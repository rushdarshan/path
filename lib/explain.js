"use strict";

// Explainability layer. Every recommendation, milestone, edge, and resource
// gets a plain-language rationale chained to the *specific signals* that caused
// it. This is the "explainability of every recommendation" spec requirement.

const { getTopic } = require("./ontology");

const FACTOR_LABELS = {
  interest: "your interests",
  goal: "your goal",
  readiness: "your readiness",
  style: "your learning style",
  level: "your current level",
};

function explainTopic(topicId, cand, profile) {
  const t = getTopic(topicId);
  if (!cand) return { topicId, summary: `${t.name} was selected as part of your path.` };

  const drives = cand.topFactors.map(f => `${FACTOR_LABELS[f.factor] || f.factor} (score ${f.score.toFixed(2)}): ${f.driver}`);

  const prereqNames = t.prereqs.map(getTopic).map(x => x.name);
  const prereqs = prereqNames.length
    ? `Prerequisites required first: ${prereqNames.join(", ")}.`
    : "No prerequisites — you can start this immediately.";

  const styleMatch = profile.style.hands >= 0.7 ? "This journey favours hands-on work: projects and interactive exercises." :
    profile.style.reading >= 0.7 ? "Curated resources lean toward reading: docs, articles, reference material." :
      profile.style.visual >= 0.7 ? "Curated resources lean toward visuals: videos and interactive walks." :
        "Resources are a balanced mix for your style.";

  const backing = (profile.interests || []).find(i => i.topicId === topicId);
  // Topics auto-included as prerequisites have no direct interest evidence —
  // surface the prerequisite driver instead of an empty backing string.
  const prereqDriver = backing ? "" : (cand.topFactors.find(f => /prerequisite for/.test(f.driver || ""))?.driver || "");
  const backingText = backing ? backing.evidence : prereqDriver;

  return {
    topicId,
    name: t.name,
    estHours: t.estHours,
    score: cand.total,
    summary: `${t.name} is in your path because ${profile.goals.some(g => g.confidence >= 0.5) ? `it advances your aim to ${profile.goals.find(g => g.confidence >= 0.5).goal.replace(/_/g, " ")}` : "it fills a gap in your learning goals"}.`,
    why: `${drives.join(" ")}`,
    profiledBacking: backingText,
    factors: drives,
    prereqs: prereqNames,
    prereqSummary: prereqs,
    styleMatch,
    resources: t.resources.map(r => ({
      title: r.title, url: r.url, kind: r.kind, minutes: r.minutes,
      reason: r.kind === "video"
        ? "watch-style content fits your visual preference"
        : r.kind === "interactive"
          ? "hands-on; you learn best by doing"
          : r.kind === "book"
            ? "in-depth reading reference"
            : "structured reference you can skim",
    })),
  };
}

function explainMilestone(m, orderedTopics) {
  const names = m.topics.map(getTopic).map(t => t.name);
  return {
    milestoneId: m.id,
    name: m.name,
    level: m.level,
    rationale: `Milestone "${m.name}" groups Level ${m.level} topics so you build one coherent skill band before moving up: ${names.join(", ")}.`,
    topics: names,
  };
}

function explainWeeklyPlan(weeks) {
  return {
    summary: weeks.length
      ? `At your budget this path spans ${weeks.length} weekly sessions.`
      : "No plan yet.",
    weeks: weeks.map(w => ({
      week: w.week,
      start: w.start,
      milestone: w.milestone,
      hours: w.hours,
      note: `Week ${w.week}: ${w.hours}h on ${w.milestone} — ${w.topics.map(getTopic).map(t => t.name).join(", ")}`,
    })),
  };
}

// Builds the full "why this path" narrative used by both the API and dashboard.
function buildExplanation({ path, candidates, profile }) {
  const candMap = new Map(candidates.map(c => [c.topicId, c]));
  const topicExplanations = path.order.map(id => explainTopic(id, candMap.get(id), profile));
  const milestoneExplanations = path.milestones.map(m => explainMilestone(m));
  const plan = explainWeeklyPlan(path.weeklyPlan);

  return {
    summary: `This path is built for a ${profile.baseline.level} baseline learner who wants to ${profile.goals.find(g => g.confidence >= 0.5)?.goal.replace(/_/g, " ") || "grow"} — ${path.totalHours} hours across ${path.estimatedWeeks} weeks, tuned to ${path.hoursPerWeek}h/week.`,
    topicExplanations,
    milestoneExplanations,
    plan,
    styleMatch: profile.style,
  };
}

module.exports = { buildExplanation, explainTopic, explainMilestone };