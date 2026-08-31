"use strict";

// Gap diagnosis: compares what the learner already evidences against what the
// path's topics require (concept-by-concept), producing a reproducible,
// evidence-linked gap report — no LLM needed. Every claim carries the exact
// token/source that justifies it.

const { getTopic } = require("./ontology");
const { TECH_TOKEN_RE } = require("./profiler");

function norm(v) { return Math.max(0, Math.min(1, v)); }

// Wrap every word-ish feature of a concept so hyphenated names match cleanly.
function conceptLexemes(name) {
  return new Set([name, ...name.split(/[-_ ]+/), name.replace(/[-_ ]+/g, "")].filter(Boolean));
}

// Does the lemma text contain the concept as a whole word / one of its lexemes?
function conceptMentioned(text, name) {
  const lex = conceptLexemes(name.toLowerCase());
  for (const l of lex) {
    if (!l) continue;
    if (new RegExp(`(^|[^a-z0-9])${l}([^a-z0-9]|$)`, "i").test(text)) return true;
  }
  return false;
}

// Map a baseline level to a fractional mastery of a topic's early concepts.
const BASELINE_CREDIT = { none: 0, some: 0.15, working: 0.35, strong: 0.5 };

// Build the evidence text = resume text + existing profile signals.
function evidenceText(profile) {
  const parts = [];
  if (profile.resume && profile.resume.raw) parts.push(profile.resume.raw);
  if (profile.resume && profile.resume.tokens) parts.push(profile.resume.tokens.join(" "));
  if (Array.isArray(profile.interests)) {
    for (const i of profile.interests) {
      if (i && (i.topicId || i.keyword || i.name)) parts.push(String(i.topicId || i.keyword || i.name));
      if (i && i.name) parts.push(String(i.name));
    }
  }
  return parts.join(" ");
}

// Does this topic already appear in the resume's extracted hits? If so the
// learner has hands-on exposure — that covers the topic's prerequisite core.
function topicEvidenced(profile, topicId) {
  const hits = (profile.resume && profile.resume.topicHits) || [];
  const tokens = (profile.resume && profile.resume.tokens) || [];
  if (hits.some(h => h.topicId === topicId)) return true;
  const t = getTopic(topicId);
  if (!t) return false;
  const kws = (t.keywords || []).map(k => String(k).toLowerCase()).filter(k => k.length >= 3);
  return kws.some(k => tokens.includes(k.toLowerCase())) || kws.some(k => new RegExp(`(^|[^a-z0-9])${k}([^a-z0-9]|$)`).test(tokens.join(" ")));
}

// Estimate a study-slot for a concept inside the topic's resource (loaded by
// whether the resource fits the learner's pattern), derived from resource
// minutes distributed across concept weights — a planning aid, not a fake
// real-world timestamp.
function conceptPacing(topic, conceptName, style = {}, startWeek, totalWeeks) {
  const concepts = (topic.concepts || []).filter(c => c && c.name);
  const total = concepts.reduce((s, c) => s + (c.weight || 1), 0) || 1;
  const idx = concepts.findIndex(c => c.name === conceptName);
  if (idx < 0) return null;
  const before = concepts.slice(0, idx).reduce((s, c) => s + (c.weight || 1), 0);
  const share = (concepts[idx].weight || 1) / total;
  const order = idx + 1;
  const prefer = style.visual >= 0.7 ? "video" : style.reading >= 0.7 ? "article" : style.hands >= 0.7 ? "interactive" : null;
  const res = prefer ? topic.resources.find(r => r.kind === prefer) || topic.resources[0] : topic.resources[0];
  const minutes = res ? Math.max(20, Math.round((res.minutes || 60) * share / 5) * 5) : null;
  // Schedule-anchored note when the weekly plan is available; percentage fallback otherwise.
  let paceNote = null;
  if (startWeek) {
    paceNote = `Week ${startWeek}${totalWeeks ? ` of ${totalWeeks}` : ""}: study block ${order} of ${concepts.length}${res ? ` — opens "${res.title}"` : ""} (${topic.name}).`;
  } else if (res) {
    paceNote = `Plan study block ${order} of ${concepts.length} — roughly the first ~${Math.round(before / total * 100)}% through "${res.title}".`;
  }
  return {
    concept: conceptName,
    sequence: order,              // 1st, 2nd, ... concept in this topic
    afterShare: before / total,   // fraction of the topic before this concept
    resource: res ? { title: res.title, url: res.url, kind: res.kind } : null,
    estMinutes: minutes,          // approximate study block for the concept
    paceNote,
  };
}

// Core: per-topic gap diagnosis.
function diagnoseTopic(topicId, profile, startWeek, totalWeeks) {
  const t = getTopic(topicId);
  if (!t) return null;
  const concepts = (t.concepts || []).filter(c => c && c.name);
  const text = evidenceText(profile).toLowerCase();
  const baseline = (profile.baseline && profile.baseline.level) || "some";
  const credit = BASELINE_CREDIT[baseline] ?? 0.15;

  const covered = [];
  const missing = [];
  for (const c of concepts) {
    const mentioned = conceptMentioned(text, c.name);
    // Educator credit: baseline level + resume topic-evidence count as partial coverage.
    const gained = mentioned ? 1 : (topicEvidenced(profile, topicId) ? credit : 0);

    // Confidence: direct mention is strong evidence; topic-evidence + baseline is soft.
    const confidence = mentioned ? 0.85 : (topicEvidenced(profile, topicId) ? 0.5 : 0.25);

    // Only count toward "covered/missing" for the report: a concept is covered
    // if there is direct mention OR sizable educator credit.
    const entry = {
      concept: c.name,
      weight: c.weight || 1,
      evidence: mentioned ? findEvidence(profile, c.name) : (topicEvidenced(profile, topicId) ? `profile baseline (${baseline}) + resume shows this topic` : `assumed from baseline ${baseline}`),
      confidence,
      pacing: conceptPacing(t, c.name, profile.style || {}, startWeek, totalWeeks),
    };
    if (mentioned || gained >= 0.5) covered.push(entry); else missing.push(entry);
  }

  const covW = covered.reduce((s, e) => s + e.weight, 0);
  const totW = concepts.reduce((s, c) => s + (c.weight || 1), 0) || 1;
  const coverage = totW ? covW / totW : 1;
  const gapLevel = coverage < 0.34 ? "foundational" : coverage < 0.67 ? "bridge" : "polish";

  const styling = profile.style || {};
  const note = covered.length === 0
    ? `No evidence you already know ${t.name} — start from the foundation.`
    : missing.length === 0
      ? `You already cover ${t.name} in your background — this serves as a bridge/refresher.`
      : `You already have ${covered.length} of ${concepts.length} concepts in ${t.name}; the gap is ${missing.map(m => m.concept).join(", ")}.`;

  return {
    topicId,
    name: t.name,
    coverage,
    gapLevel,
    covered,
    missing,
    pacingCarrier: conceptPacing(t, concepts[0] ? concepts[0].name : null, styling, startWeek, totalWeeks),
    note,
  };
}

function findEvidence(profile, conceptName) {
  const text = evidenceText(profile);
  const hit = text.match(new RegExp(`[^.;\\n]*${conceptName.replace(/[-_ ]+/, "[-_ ]")}[^.;\\n]*`, "i"));
  if (hit) return `resume/chat mentions "${hit[0].trim().slice(0, 90)}..."`;
  return "direct keyword match in profile signals";
}

function diagnoseGaps(profile, topicIds, weeklyPlan) {
  // First week each topic appears in the plan, to anchor study blocks to real weeks.
  const startWeek = {};
  if (Array.isArray(weeklyPlan)) {
    for (const w of weeklyPlan) {
      if (w && (w.topicId || w.topic) && !((w.topicId || w.topic) in startWeek)) startWeek[w.topicId || w.topic] = w.week;
    }
  }
  const totalWeeks = Array.isArray(weeklyPlan) ? weeklyPlan.length : 0;
  const topics = (topicIds || []).map(id => diagnoseTopic(id, profile, startWeek[id], totalWeeks)).filter(Boolean);
  const overall = topics.length ? topics.reduce((s, t) => s + t.coverage, 0) / topics.length : 0;
  return {
    overallCoverage: norm(overall),
    topics,
    summary:
      topics.length === 0 ? "No topics to diagnose."
        : overall < 0.34 ? `Most of the path is new — ${Math.round((1 - overall) * 100)}% of required concepts are not yet evidenced in your background.`
          : overall < 0.67 ? `You're bridging — about ${Math.round((1 - overall) * 100)}% of the path's concepts are still missing.`
            : `Close to ready — the few missing concepts are polishing the path.`,
  };
}

module.exports = { diagnoseGaps, diagnoseTopic, conceptPacing };