"use strict";

// Zero-dependency HTTP server. Serves the static SPA from ./public and the
// /api/* JSON endpoints. Optional: if GEMINI_API_KEY is present, Gemini models
// power open-ended chat and career prompts; otherwise the deterministic engine
// and intelligent local fallback run with zero external network dependencies.

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const store = require("./lib/store");
const gemini = require("./lib/gemini");
const { buildPath, buildAdaptivePath } = require("./lib/pathbuilder");
const { profileFromConversation, analyzeResume } = require("./lib/profiler");
const { diagnoseGaps } = require("./lib/gaps");
const { recommend } = require("./lib/recommender");
const { buildExplanation } = require("./lib/explain");
const { createMasteryMap, pickNextQuiz, submitAnswers, masteryLabel } = require("./lib/mastery");
const { startSession, nextQuestion, judgeAnswer } = require("./lib/conversation");
const { getAdaptiveRecommendations } = require("./lib/adaptive");
const { getNextAction } = require("./lib/nextaction");

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
    feedback: [], adaptiveRecommendation: null,
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

function createDemoSession(type = "ml", existingId = null) {
  const id = existingId || crypto.randomBytes(6).toString("hex");
  const s = {
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    convoStep: "done",
    convoHistory: [],
    answers: {},
    profile: null,
    recommendation: null,
    path: null,
    explanation: null,
    mastery: null,
    nextQuiz: null,
    feedback: [],
    adaptiveRecommendation: null,
    status: "ready",
    audit: [],
    question: "Welcome to your Pathlight learning map.",
    hints: null,
    isFirst: false,
  };

  if (type === "fullstack") {
    s.answers = {
      role: "Junior Web Developer",
      goal: "Transition to a Full-Stack Engineer building reactive web applications and scalable backend APIs",
      interests: "JavaScript, HTML, CSS, React Frontend, Node Backend, REST APIs, SQL Databases, Git Version Control",
      baseline: "Working knowledge of HTML, CSS and foundational JavaScript scripting",
      learningPattern: "Hands-on projects with visual component architecture and weekly implementation milestones",
      timeBudget: "8 hours per week with dedicated focus blocks",
      hoursPerWeek: 8,
    };
  } else if (type === "cyber") {
    s.answers = {
      role: "IT Support Specialist",
      goal: "Become a Cybersecurity Analyst specializing in threat detection, vulnerability analysis, and network defense",
      interests: "Linux, Networking, Security Basics, Cryptography, Web Application Security, Threat Modeling",
      baseline: "Basic IT administration and hardware support experience",
      learningPattern: "Hands-on capture-the-flag exercises and structured reference documentation",
      timeBudget: "10 hours per week",
      hoursPerWeek: 10,
    };
  } else {
    // Default: Machine Learning Engineer
    s.answers = {
      role: "Software Developer",
      goal: "Become a Machine Learning Engineer building production AI pipelines and deep neural models",
      interests: "Python, Data Structures, Statistics & Probability, Machine Learning Basics, Deep Learning PyTorch, SQL Databases",
      baseline: "Working proficiency in Python programming and basic calculus",
      learningPattern: "Hands-on code implementations with mathematical visual models and spaced repetition",
      timeBudget: "8 hours per week with weekly milestones",
      hoursPerWeek: 8,
    };
  }

  const result = runPipeline(s);
  s.status = "ready";

  // Provide realistic initial BKT mastery states across the ordered topics
  if (s.path && s.path.order && s.mastery) {
    s.path.order.forEach((tid, idx) => {
      if (s.mastery[tid]) {
        if (idx === 0) {
          s.mastery[tid].theta = 0.88;
          s.mastery[tid].pKnown = 0.88;
          s.mastery[tid].evidence = 1.2;
        } else if (idx === 1) {
          s.mastery[tid].theta = 0.68;
          s.mastery[tid].pKnown = 0.68;
          s.mastery[tid].evidence = 0.8;
        } else if (idx === 2) {
          s.mastery[tid].theta = 0.45;
          s.mastery[tid].pKnown = 0.45;
          s.mastery[tid].evidence = 0.4;
        } else {
          s.mastery[tid].theta = 0.15;
          s.mastery[tid].pKnown = 0.15;
          s.mastery[tid].evidence = 0.1;
        }
      }
    });
  }

  // Recalculate adaptive path and adaptive recommendation based on the initialized mastery
  const hw = (s.answers.hoursPerWeek || s.profile?.timeBudget?.hoursPerWeek || 8);
  s.path = buildAdaptivePath({
    selected: s.recommendation?.selected || [],
    mastery: s.mastery,
    feedback: s.feedback || [],
    timeBudget: { hoursPerWeek: hw }
  });
  s.adaptiveRecommendation = getAdaptiveRecommendations({
    profile: s.profile,
    recommendation: s.recommendation,
    mastery: s.mastery,
    feedback: s.feedback || []
  });

  store.save(id, s);
  return { ok: true, session: s, result };
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
  session.feedback = session.feedback || [];

  const hw = (session.answers.hoursPerWeek || profile.timeBudget?.hoursPerWeek || 8);
  const tempMastery = createMasteryMap(rec.selected.map(s => s.topicId));
  session.mastery = tempMastery;

  const pathData = buildAdaptivePath({
    selected: rec.selected,
    mastery: tempMastery,
    feedback: session.feedback,
    timeBudget: { hoursPerWeek: hw }
  });
  session.path = pathData;
  session.gapReport = diagnoseGaps(profile, pathData.order, pathData.weeklyPlan);
  session.explanation = buildExplanation({ path: pathData, candidates: rec.selected, profile });
  
  session.adaptiveRecommendation = getAdaptiveRecommendations({
    profile,
    recommendation: rec,
    mastery: tempMastery,
    feedback: session.feedback
  });

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
  const [, sub, id, extra] = parts;
  
  if (sub === "new" && req.method === "GET") return json(res, 200, newSession());
  if (sub === "demo") {
    const type = id || "ml";
    let sid = null;
    try {
      const q = url.searchParams.get("sid");
      if (q) sid = q;
    } catch {}
    const demo = createDemoSession(type, sid);
    return json(res, 200, demo);
  }

  if (sub === "session" && extra === "adaptive" && req.method === "GET") {
    const s = getSession(id);
    if (!s) return json(res, 404, { error: "not found" });
    const adaptive = getAdaptiveRecommendations({
      profile: s.profile,
      recommendation: s.recommendation,
      mastery: s.mastery,
      feedback: s.feedback || []
    });
    return json(res, 200, adaptive);
  }

  if (sub === "session" && extra === "feedback" && req.method === "POST") {
    const s = getSession(id);
    if (!s) return json(res, 404, { error: "not found" });
    readBody(req).then((b) => {
      const { topicId, type, rating } = b;
      if (!topicId || !type) return json(res, 400, { error: "missing topicId or type" });
      s.feedback = s.feedback || [];
      s.feedback.push({
        topicId,
        type,
        rating: typeof rating === "number" ? rating : null,
        timestamp: new Date().toISOString()
      });

      const adaptive = getAdaptiveRecommendations({
        profile: s.profile,
        recommendation: s.recommendation,
        mastery: s.mastery,
        feedback: s.feedback
      });
      s.adaptiveRecommendation = adaptive;

      const hw = (s.answers.hoursPerWeek || s.profile?.timeBudget?.hoursPerWeek || 8);
      s.path = buildAdaptivePath({
        selected: s.recommendation?.selected || [],
        mastery: s.mastery,
        feedback: s.feedback,
        timeBudget: { hoursPerWeek: hw }
      });
      s.updatedAt = new Date().toISOString();
      store.save(s.id, s);
      return json(res, 200, { ok: true, feedback: s.feedback });
    });
    return;
  }

  if (sub === "session" && extra === "next-action" && req.method === "GET") {
    const s = getSession(id);
    if (!s) return json(res, 404, { error: "not found" });
    const action = getNextAction({
      profile: s.profile,
      path: s.path,
      mastery: s.mastery,
      feedback: s.feedback || []
    });
    return json(res, 200, action);
  }
  
  if (sub === "session" && req.method === "GET") {
    const s = getSession(id);
    return s ? json(res, 200, s) : json(res, 404, { error: "not found" });
  }

  if (sub === "session" && req.method === "POST") {
    readBody(req).then(async (b) => {
      const s = getSession(id);
      if (!s) return json(res, 404, { error: "not found" });
      
      // Handle direct answers sync from Dreamer questionnaire
      if (b.answers !== undefined) {
        s.answers = { ...s.answers, ...b.answers };
        if (b.answers.role) {
          s.answers.goal = `Become a ${b.answers.role} with verified prerequisite readiness`;
        }
        if (b.answers.skills && Array.isArray(b.answers.skills)) {
          s.answers.interests = (s.answers.interests || "") + " " + b.answers.skills.join(" ");
        }
        const result = runPipeline(s);
        s.status = "ready";
        store.save(s.id, s);
        return json(res, 200, { ok: true, session: s, result });
      }

      if (b.resume !== undefined) {
        const ana = analyzeResume(b.resume || "");
        if (ana) {
          if (ana.topicHits && ana.topicHits.length) {
            if (!s.answers) s.answers = {};
            s.answers.interests = (s.answers.interests || "") + " " + ana.topicHits.map(h => h.evidence).join(" ");
          }
          s.profile = profileFromConversation({ answers: s.answers || {}, resume: b.resume });
          recordAudit(s, s.profile, "resume");
          if (ana.topicHits && ana.topicHits.length) {
            const rec = recommend(s.profile);
            const hw = (s.answers.hoursPerWeek || s.profile?.timeBudget?.hoursPerWeek || 8);
            s.feedback = s.feedback || [];
            const tempMastery = createMasteryMap(rec.selected.map(x => x.topicId));
            s.mastery = tempMastery;

            const pathData = buildAdaptivePath({
              selected: rec.selected,
              mastery: tempMastery,
              feedback: s.feedback,
              timeBudget: { hoursPerWeek: hw }
            });
            s.recommendation = rec;
            s.path = pathData;
            s.gapReport = diagnoseGaps(s.profile, pathData.order, pathData.weeklyPlan);
            s.explanation = buildExplanation({ path: pathData, candidates: rec.selected, profile: s.profile });
            s.adaptiveRecommendation = getAdaptiveRecommendations({
              profile: s.profile,
              recommendation: rec,
              mastery: tempMastery,
              feedback: s.feedback
            });
          }
        }
        store.save(s.id, s);
        return json(res, 200, { ok: true, topicHits: ana ? ana.topicHits : [], profile: s.profile });
      }

      if (b.text !== undefined) {
        const out = await advanceConvo(s, String(b.text));
        return json(res, 200, out);
      }

      return json(res, 400, { error: "send {text}, {answers}, or {resume}" });
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

      const adaptive = getAdaptiveRecommendations({
        profile: s.profile,
        recommendation: s.recommendation,
        mastery: s.mastery,
        feedback: s.feedback || []
      });
      s.adaptiveRecommendation = adaptive;

      const hw = (s.answers.hoursPerWeek || s.profile?.timeBudget?.hoursPerWeek || 8);
      s.path = buildAdaptivePath({
        selected: s.recommendation?.selected || [],
        mastery: s.mastery,
        feedback: s.feedback || [],
        timeBudget: { hoursPerWeek: hw }
      });
      s.updatedAt = new Date().toISOString();

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

  // ── Gemini & Intelligent Fallback AI routes ────────────────────────────────

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
        json(res, 200, { reply: "I'm analyzing your path prerequisites. Ask me about any topic, study schedule, or skill requirement!" });
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
        json(res, 200, { reply: "Strategic blueprint generated. Review your prerequisite milestones on the Path page." });
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
        res.write(`data: ${JSON.stringify({ chunk: "Strategic path generated." })}\n\n`);
        res.write("data: [DONE]\n\n");
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
          role: b.role || "software engineer",
          skills: b.skills || [],
          education: b.education || "",
        });
        json(res, 200, { careers });
      } catch (e) {
        json(res, 200, { careers: [] });
      }
    });
    return;
  }

  json(res, 404, { error: "unknown api" });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/health" || url.pathname === "/healthz") return json(res, 200, { ok: true, ts: new Date().toISOString() });
  if (url.pathname.startsWith("/api/")) return handleApi(req, res, url);

  // Static: map / to index.html (SPA)
  let p = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
  if (!p.includes(".")) p += ".html";
  const filePath = path.join(PUBLIC_DIR, p);

  if (!filePath.startsWith(PUBLIC_DIR)) return json(res, 403, { error: "forbidden" });

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const fallback = path.join(PUBLIC_DIR, "index.html");
      return fs.createReadStream(fallback).pipe(res);
    }
    const ext = path.extname(filePath).toLowerCase();
    const map = {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "application/javascript; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".svg": "image/svg+xml",
      ".ico": "image/x-icon",
    };
    res.writeHead(200, { "Content-Type": map[ext] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`\n  Pathlight — Cartography of Prerequisites\n  → http://localhost:${PORT}\n`);
});