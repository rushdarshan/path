"use strict";

// Recommendation engine: scores every topic against the learner profile across
// five factors, returns ranked candidates with a full factor breakdown so the
// explanation layer can say *which* signal drove *which* recommendation.

const { allTopics, getTopic, domains } = require("./ontology");

// Factor weights — tunable, exposed for experimentation.
const WEIGHTS = {
  interest: 0.30,      // what they said they like
  goal: 0.20,          // why they're learning
  readiness: 0.20,     // do they have the prereqs (baseline)
  style: 0.15,         // how they like to learn (resource/journey fit)
  level: 0.15,         // right difficulty for their baseline
};

function norm(v) { return Math.max(0, Math.min(1, v)); }

function scoreInterest(topic, interestSet) {
  // interestSet: Set of topicIds the profiler matched.
  if (interestSet.has(topic.id)) {
    return { score: 1.0, driver: "explicit interest match" };
  }
  // Prerequisite-of-a-wanted-topic: implicitly valuable.
  for (const wantedId of interestSet) {
    const wanted = getTopic(wantedId);
    if (wanted && wanted.prereqs.includes(topic.id)) {
      return { score: 0.85, driver: `prerequisite for ${wanted.name} (your stated interest)` };
    }
  }
  return { score: 0.15, driver: "no direct stated interest" };
}

function scoreGoal(topic, profile) {
  // Map goals -> whether this topic advances them.
  const goal = profile.goals.find(g => g.confidence >= 0.5);
  const g = goal ? goal.goal : "start_learning";
  let base = 0.5;
  const drivers = [];
  if (g === "job_ready" || g === "career_transition" || g === "career_advancement") {
    const portfolioTopic = ["fullstack-projects", "react-frontend", "ml-basics", "mlops", "ux-design", "business-analytics"];
    if (portfolioTopic.includes(topic.id)) { base = 1.0; drivers.push("portfolio-worthy for job hunting"); }
    if (topic.domain === "programming" || topic.domain === "web") base = Math.max(base, 0.8);
  }
  if (g === "build_projects") {
    if (topic.id === "fullstack-projects" || topic.id === "game-dev-basics" || topic.id === "react-native-mobile") { base = 1.0; drivers.push("directly enables building"); }
    if (topic.level <= 2) base = Math.max(base, 0.75);
  }
  if (g === "exam_cert" && /cert|exam|aws|ccna/.test(topic.name)) base = 1.0;
  if (g === "curiosity") base = Math.max(base, 0.7);
  if (g === "start_learning") { if (topic.level === 1) base = 0.9; else base = 0.4; drivers.push("beginner-friendly ramp"); }
  if (g === "academic") base = Math.max(base, 0.6);
  return { score: norm(base), driver: drivers.join("; ") || `advances "${g.replace(/_/g, " ")}" goal` };
}

function scoreReadiness(topic, profile) {
  // Do they already satisfy prereqs? If they're brand new, readiness is low for
  // high-level topics (good — the recommender must sequence, not dump).
  const baselinePts = { none: 0, some: 0.35, working: 0.65, strong: 0.9 }[profile.baseline.level] ?? 0.5;
  const missing = topic.prereqs.length;
  if (missing === 0) {
    const f = 0.35 + baselinePts * 0.65;
    return { score: norm(f), driver: "no prerequisites — can start immediately" };
  }
  const prereqNames = topic.prereqs.map(getTopic).map(t => t && t.name).filter(Boolean);
  return { score: norm(baselinePts * 0.8), driver: `requires ${prereqNames.join(", ")} first` };
}

function scoreStyle(topic, profile) {
  const s = topic.styles || { visual: 0.6, reading: 0.6, hands: 0.6, auditory: 0.3 };
  const p = profile.style;
  const resourceKindMatch = topic.resources.some(r => {
    if (p.reading >= 0.7 && r.kind === "article") return true;
    if (p.visual >= 0.7 && (r.kind === "video" || r.kind === "interactive")) return true;
    if (p.hands >= 0.7 && r.kind === "interactive") return true;
    if (p.auditory >= 0.7 && r.kind === "video") return true;
    return false;
  });
  const sim = (s.visual * p.visual + s.reading * p.reading + s.hands * p.hands + s.auditory * p.auditory) / 4;
  return { score: norm(sim * 0.8 + (resourceKindMatch ? 0.2 : 0)), driver: resourceKindMatch ? "resources match how you learn" : "pace-adjusted available resources" };
}

function scoreLevel(topic, profile) {
  const baselinePts = { none: 0, some: 0.4, working: 0.7, strong: 1.0 }[profile.baseline.level] ?? 0.5;
  const delta = Math.abs(topic.level - (1 + baselinePts * 3));
  // A topic exactly at their level scores best; adjacent slightly lower; far off worst.
  const s = Math.max(0, 1 - delta * 0.55);
  return { score: norm(s), driver: `level ${topic.level} vs your ${profile.baseline.level} baseline` };
}

function recommend(profile, opts = {}) {
  const weights = { ...WEIGHTS, ...(opts.weights || {}) };
  const interestSet = new Set((profile.interests || []).map(i => i.topicId));
  const candidates = allTopics().map(t => {
    const f = {
      interest: scoreInterest(t, interestSet),
      goal: scoreGoal(t, profile),
      readiness: scoreReadiness(t, profile),
      style: scoreStyle(t, profile),
      level: scoreLevel(t, profile),
    };
    const total = Object.keys(weights).reduce((acc, k) => acc + weights[k] * f[k].score, 0);
    return {
      topicId: t.id,
      name: t.name,
      domain: t.domain,
      level: t.level,
      estHours: t.estHours,
      total: +total.toFixed(3),
      factors: f,
      topFactors: Object.entries(f)
        .map(([k, v]) => ({ factor: k, score: +v.score.toFixed(2), driver: v.driver }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3),
    };
  });

  candidates.sort((a, b) => b.total - a.total);

  // Core: interest matches plus prereqs of wanted topics. Goal/readiness/style/
  // level factors re-rank and tune these but never drag in unrelated topics.
  let selected = candidates.filter(c => c.factors.interest.score >= 0.85);
  // Domain coherence guard: bare "react" fires both react-frontend (web) and
  // react-native-mobile (mobile) via topicsForKeyword phrase expansion. If the
  // user said "react" for web and never mentioned mobile, suppress mobile.
  // ponytail: evidence must contain explicit mobile phrase; bare "react" does not count.
  const hasMobileSignal = (profile.interests || []).some(i => /mobile|react native|flutter|ios|android/i.test(i.evidence || ""))
    || /mobile|react native|flutter|\bios\b|\bandroid\b/i.test((profile.resume && profile.resume.raw) || "");
  if (!hasMobileSignal) {
    const webCount = [...interestSet].filter(id => getTopic(id)?.domain === "web").length;
    if (webCount >= 1) selected = selected.filter(c => c.domain !== "mobile");
  }
  if (selected.length < 3 && !opts.includeAll) {
    const goal = profile.goals.find(g => g.confidence >= 0.5);
    const fieldGoal = goal && !["start_learning", "curiosity"].includes(goal.goal);
    if (selected.length === 0 && !fieldGoal) {
      // Nothing matched the catalog AND the goal is generic — a goal-scored
      // dump would fabricate a direction. Say so instead.
      return {
        candidateCount: candidates.length,
        selected: [],
        weights,
        honestMiss: true,
        note: "Your interests and goal don't map to any subject I teach, so I won't guess a direction for you. Tell me a subject you want to be able to do something with (e.g. 'build web apps', 'analyze data', 'automate servers') and I'll build a real path from there.",
        generatedAt: new Date().toISOString(),
      };
    }
    // Scarce interests — let the goal signal fill the path so it stays useful.
    for (const c of candidates) {
      if (selected.some(x => x.topicId === c.topicId)) continue;
      if (c.factors.goal.score >= 0.8) selected.push(c);
    }
  }
  if (opts.includeAll) selected = candidates;

  // Always carry prerequisites for selected topics even if they scored low, so
  // the path is complete (coverage beats raw preference for buildability).
  const selectedIds = new Set(selected.map(c => c.topicId));
  for (const c of [...selected]) {
    const t = getTopic(c.topicId);
    for (const p of t.prereqs) {
      if (!selectedIds.has(p)) {
        const pc = candidates.find(x => x.topicId === p);
        if (pc) { selected.push({ ...pc, autoIncluded: true, total: pc.total }); selectedIds.add(p); }
      }
    }
  }
  if (!selected.length) selected = candidates.slice(0, 3);

  return {
    candidateCount: candidates.length,
    selected,
    weights,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { recommend, WEIGHTS };