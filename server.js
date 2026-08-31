"use strict";

// Zero-dependency HTTP server. Serves the static SPA from ./public and the
// /api/* JSON endpoints. Optional: if OPENAI_API_KEY is present AND a model is
// configured, the /api/llm endpoint enriches recommendations; otherwise the
// deterministic engine runs alone. The point: the app fully works offline.

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const store = require("./lib/store");
const gemini = require("./lib/gemini");
const { buildPath } = require("./lib/pathbuilder");
const { profileFromConversation, analyzeResume } = require("./lib/profiler");
  const { diagnoseGaps } = require("./lib/gaps");
const { recommend } = require("./lib/recommender");
const { buildExplanation } = require("./lib/explain");
const { createMasteryMap, pickNextQuiz, submitAnswers, masteryLabel } = require("./lib/mastery");
const { startSession, nextQuestion, judgeAnswer } = require("./lib/conversation");

const PORT = process.env.PORT || 4317;
const PUBLIC_DIR = path.join(__dirname, "public");

function json(res, code, data) {
  res.writeHead(code, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (c) => { body += c; if (body.length > 1e6) req.destroy(); });
    req.on("end", () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { resolve({}); }
    });
  });
}

function newSession() {
  const id = crypto.randomBytes(6).toString("hex");
  const session = startSession({ id });
  const s = {
    id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    convoStep: "goal", convoHistory: [], answers: {}, profile: null,
    recommendation: null, path: null, explanation: null, mastery: null, nextQuiz: null,
    status: "profiling", audit: [],
    question: session.question, hints: session.hints, isFirst: true,
  };
  store.save(id, s);
  return s;
}

function getSession(id) {
  const s = store.load(id);
  if (!s) return null;
  return s;
}

async function advanceConvo(session, text) {
  session.convoHistory.push({ role: "user", text, at: new Date().toISOString() });
  const judge = judgeAnswer(session.convoStep, text);
  const flowOrder = ["goal", "interests", "baseline", "learningPattern", "timeBudget"];
  const idx = flowOrder.indexOf(session.convoStep);

  if (judge.ok === false) {
    session.updatedAt = new Date().toISOString();
    store.save(session.id, session);
    return { reply: judge.hint, stillAsk: true, step: session.convoStep };
  }

  session.answers[session.convoStep] = text;
  if (session.convoStep === "timeBudget") {
    session.answers.hoursPerWeek = judge.captured ? judge.captured.hoursPerWeek : 8;
  }

  const nxt = nextQuestion(session);
  if (nxt) {
    session.updatedAt = new Date().toISOString();
    store.save(session.id, session);
    return { reply: nxt.question, stillAsk: true, step: nxt.step, hints: nxt.hints };
  }

  // All dimensions collected — run the full pipeline.
  const result = runPipeline(session);
  session.status = "ready";
  session.updatedAt = new Date().toISOString();
  store.save(session.id, session);
  return { reply: result.reply, stillAsk: false, step: "done", result };
}

function recordAudit(session, profile, source) {
  session.audit = session.audit || [];
  const at = new Date().toISOString();
  const push = (factor, value, confidence, evidence) =>
    session.audit.push({ at, source, factor, value, confidence, evidence });
  (profile.goals || []).forEach(g => push("goal", g.goal, g.confidence, g.evidence));
  (profile.interests || []).forEach(i => push("interest", i.topicId, i.confidence, i.evidence));
  if (profile.timeBudget) push("timeBudget", profile.timeBudget.hoursPerWeek, profile.timeBudget.confidence, profile.timeBudget.evidence);
  if (profile.baseline) push("baseline", profile.baseline.level, profile.baseline.confidence, profile.baseline.evidence);
  if (profile.style) for (const [k, v] of Object.entries(profile.style)) push("learningPattern", k, v, (profile.profilerEvidence && profile.profilerEvidence.style && profile.profilerEvidence.style[k]) || "inferred");
}

function runPipeline(session) {
  const profile = profileFromConversation({ answers: session.answers });
  recordAudit(session, profile, "conversation");
  session.profile = profile;
  const rec = recommend(profile);
  session.recommendation = rec;

  const hw = (session.answers.hoursPerWeek || profile.timeBudget.hoursPerWeek || 8);
  const pathData = buildPath({ selected: rec.selected, timeBudget: { hoursPerWeek: hw } });
  session.path = pathData;
  session.gapReport = diagnoseGaps(profile, pathData.order, pathData.weeklyPlan);
  session.explanation = buildExplanation({ path: pathData, candidates: rec.selected, profile });
  session.mastery = createMasteryMap(pathData.order);

  if (rec.honestMiss) {
    const reply = rec.note;
return { reply, profile, recommendation: rec, path: pathData, explanation: session.explanation, gapReport: session.gapReport, audit: session.audit };
  }

  const topDefinition = rec.selected[0] ? rec.selected[0].name : "your path";
  const milestoneNames = pathData.milestones.map(m => `${m.name} (${m.topics.length} topics)`).join(", ");
  const planTip = pathData.weeklyPlan.length
    ? `Your first milestone starts ${pathData.weeklyPlan[0].start}.`
    : "";

  const reply = [
    `Here's your personalized path — ${pathData.order.length} topics, ~${pathData.totalHours} hours over ~${pathData.estimatedWeeks} weeks at ${hw}h/week.`,
    `Milestones: ${milestoneNames}.`,
    planTip,
    "Open the Path tab to see the full roadmap with prerequisites and weekly plan, the Help pages to understand every recommendation, and try the Mastery quiz to start adapting your path.",
  ].join("\n");
  return { reply, profile, recommendation: rec, path: pathData, explanation: session.explanation, gapReport: session.gapReport, audit: session.audit };
}

function handleApi(req, res, url) {
  const parts = url.pathname.split("/").filter(Boolean); // api, ...
  const [, sub, id] = parts;
  if (sub === "new" && req.method === "GET") return json(res, 200, newSession());
  if (sub === "session" && req.method === "GET") { const s = getSession(id); return s ? json(res, 200, s) : json(res, 404, { error: "not found" }); }

  if (sub === "session" && req.method === "POST") {
    readBody(req).then(async (b) => {
      const s = getSession(id);
      if (!s) return json(res, 404, { error: "not found" });
      if (b.resume !== undefined) {
        const ana = analyzeResume(b.resume || "");
        if (ana) {
          // Inject resume evidence into answers.interests BEFORE profiling so
          // recommend() sees explicit interests and gap diagnosis is anchored.
          if (ana.topicHits && ana.topicHits.length) {
            if (!s.answers) s.answers = {};
            s.answers.interests = (s.answers.interests || "") + " " + ana.topicHits.map(h => h.evidence).join(" ");
          }
s.profile = profileFromConversation({ answers: s.answers || {}, resume: b.resume });
          recordAudit(s, s.profile, "resume");
          if (ana.topicHits && ana.topicHits.length) {
            const rec = recommend(s.profile);
            const hw = (s.answers.hoursPerWeek || s.profile.timeBudget.hoursPerWeek || 8);
            const pathData = buildPath({ selected: rec.selected, timeBudget: { hoursPerWeek: hw } });
            s.recommendation = rec; s.path = pathData;
            s.gapReport = diagnoseGaps(s.profile, pathData.order, pathData.weeklyPlan);
            s.explanation = buildExplanation({ path: pathData, candidates: rec.selected, profile: s.profile });
            s.mastery = createMasteryMap(pathData.order);
          }
        }
        store.save(s.id, s);
        return json(res, 200, { ok: true, topicHits: ana ? ana.topicHits : [], profile: s.profile });
      }
      if (b.text !== undefined) {
        const out = await advanceConvo(s, String(b.text));
        if (!out.stillAsk && out.result) return json(res, 200, out);
        return json(res, 200, out);
      }
      return json(res, 400, { error: "send {text} or {resume}" });
    });
    return;
  }

  if (sub === "quiz" && req.method === "POST") {
    readBody(req).then((b) => {
      const s = getSession(id);
      if (!s || !s.mastery) return json(res, 404, { error: "no session/mastery yet" });
      const quiz = pickNextQuiz(s.mastery, b.topic ? [b.topic] : s.path.order);
      s.nextQuiz = quiz;
      store.save(s.id, s);
      const { keys, ...wire } = quiz;
      return json(res, 200, wire);
    });
    return;
  }

  if (sub === "quiz" && req.method === "PUT") {
    readBody(req).then((b) => {
      const s = getSession(id);
      if (!s || !s.mastery) return json(res, 404, { error: "no session" });
      const out = submitAnswers(s.mastery, s.nextQuiz, b.answers);
      s.mastery = s.mastery; // already mutated
      store.save(s.id, s);
      json(res, 200, out);
    });
    return;
  }

  if (sub === "mastery" && req.method === "GET") {
    const s = getSession(id);
    if (!s || !s.mastery) return json(res, 404, { error: "no mastery yet" });
    const topics = s.path.order.map(tid => {
      const m = s.mastery[tid];
      const l = masteryLabel(m);
      const concepts = {};
      if (m && m.conceptScores) for (const [c, cs] of Object.entries(m.conceptScores)) concepts[c] = masteryLabel(cs);
      const t = s.explanation?.topicExplanations?.find(x => x.topicId === tid);
      return { topicId: tid, name: t ? t.name : tid, score: l.theta, level: l.label, label: l.label, concepts };
    });
    return json(res, 200, topics);
  }

  // ── Gemini AI routes ───────────────────────────────────────────────────────

  // POST /api/ai/chat  { history:[{role,text}], message, system? }
  if (sub === "ai" && id === "chat" && req.method === "POST") {
    readBody(req).then(async (b) => {
      try {
        const reply = await gemini.chat(
          b.history || [],
          b.message || "",
          { system: b.system, temperature: b.temperature }
        );
        json(res, 200, { reply });
      } catch (e) {
        console.error("[gemini] chat error:", e.message);
        json(res, 500, { error: e.message });
      }
    });
    return;
  }

  // POST /api/ai/prompt  { prompt, system? }  — for Take Action runner
  if (sub === "ai" && id === "prompt" && req.method === "POST") {
    readBody(req).then(async (b) => {
      try {
        const reply = await gemini.generate(b.prompt || "", {
          system: b.system,
          temperature: b.temperature ?? 0.7,
          maxTokens: b.maxTokens ?? 1200,
        });
        json(res, 200, { reply });
      } catch (e) {
        console.error("[gemini] prompt error:", e.message);
        json(res, 500, { error: e.message });
      }
    });
    return;
  }

  // POST /api/ai/stream  { prompt, system? }  — SSE streaming
  if (sub === "ai" && id === "stream" && req.method === "POST") {
    readBody(req).then(async (b) => {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      });
      try {
        await gemini.stream(
          b.prompt || "",
          (chunk) => res.write(`data: ${JSON.stringify({ chunk })}\n\n`),
          { system: b.system, temperature: b.temperature }
        );
        res.write("data: [DONE]\n\n");
      } catch (e) {
        res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
      }
      res.end();
    });
    return;
  }

  // POST /api/ai/careers  { role, skills, education }  — AI career suggestions
  if (sub === "ai" && id === "careers" && req.method === "POST") {
    readBody(req).then(async (b) => {
      try {
        const careers = await gemini.suggestCareers({
          role: b.role || "student",
          skills: b.skills || [],
          education: b.education || "",
        });
        json(res, 200, { careers });
      } catch (e) {
        console.error("[gemini] careers error:", e.message);
        json(res, 500, { error: e.message });
      }
    });
    return;
  }

  json(res, 404, { error: "unknown api" });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname.startsWith("/api/")) return handleApi(req, res, url);

  // Static: map / to index.html (SPA) — Dreamer is now a tab inside it. /dreamer.html still served standalone if visited directly.
  const rel = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
  const fp = path.join(PUBLIC_DIR, rel);
  if (!fp.startsWith(PUBLIC_DIR)) return json(res, 400, { error: "bad path" });
  fs.readFile(fp, (err, data) => {
    if (err) return json(res, 404, { error: "not found" });
    const ext = path.extname(fp).toLowerCase();
    const mime = {
      ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
      ".svg": "image/svg+xml", ".json": "application/json", ".png": "image/png",
      ".ico": "image/x-icon", ".woff2": "font/woff2",
    }[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": mime, "Cache-Control": "no-cache" });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log("");
  console.log(`  Personalized Learning Path Recommender`);
  console.log(`  → http://localhost:${PORT}`);
  console.log("");
});