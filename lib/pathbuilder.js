"use strict";

// Path builder: turns recommended topics + the knowledge graph into an ordered
// learning path DAG with milestones. This is the "path with prerequisites and
// milestones" spec requirement and the direct counter to LevelUp-ai's leveled DAG.

const { getTopic, TOPIC_INDEX } = require("./ontology");

const MILESTONE_NAMES = {
  1: "Foundations",
  2: "Core Skills",
  3: "Applied Mastery",
  4: "Expert Practice",
};

// Topological sort (Kahn) respecting prereq edges. Returns ordered topic list.
function topoSort(topicIds) {
  const ids = new Set(topicIds);
  const indegree = new Map();
  const out = new Map();
  for (const id of ids) {
    indegree.set(id, 0);
    out.set(id, []);
  }
  for (const id of ids) {
    const t = getTopic(id);
    for (const p of t.prereqs) {
      if (ids.has(p)) {
        out.get(p).push(id);
        indegree.set(id, (indegree.get(id) || 0) + 1);
      }
    }
  }
  const queue = [...ids].filter(id => (indegree.get(id) || 0) === 0).sort((a, b) => getTopic(a).level - getTopic(b).level);
  const order = [];
  while (queue.length) {
    const id = queue.shift();
    order.push(id);
    const nexts = out.get(id).sort((a, b) => getTopic(a).level - getTopic(b).level);
    for (const n of nexts) {
      indegree.set(n, indegree.get(n) - 1);
      if (indegree.get(n) === 0) queue.push(n);
    }
  }
  if (order.length !== ids.size) {
    // Cycle defense: append missing by level so path still emits.
    const missing = [...ids].filter(id => !order.includes(id)).sort((a, b) => getTopic(a).level - getTopic(b).level);
    order.push(...missing);
  }
  return order;
}

// Group ordered topics into milestones by level buckets (all prereqs are
// same-or-lower level, so bucket ordering preserves DAG validity).
function groupMilestones(orderedIds) {
  const byLevel = new Map();
  for (const id of orderedIds) {
    const t = getTopic(id);
    if (!byLevel.has(t.level)) byLevel.set(t.level, []);
    byLevel.get(t.level).push(id);
  }
  const levels = [...byLevel.keys()].sort((a, b) => a - b);
  return levels.map((lv, i) => ({
    id: `m${i + 1}`,
    level: lv,
    name: MILESTONE_NAMES[lv] || `Level ${lv}`,
    topics: byLevel.get(lv),
    totalHours: byLevel.get(lv).reduce((a, id) => a + getTopic(id).estHours, 0),
  }));
}

// Weekly plan: walk topics in DAG order, allocating the learner's weekly budget
// so each week gets one concrete topic+concept action and prerequisites are
// visible at pace level (not just an aggregated milestone band).
function buildWeeklyPlan(orderedIds, hoursPerWeek, startDate = new Date()) {
  const weekMs = 7 * 24 * 3600 * 1000;
  const weeks = [];
  let weekZero = startDate.getTime();
  for (const tid of orderedIds) {
    const t = getTopic(tid);
    let remaining = t.estHours;
    const concepts = (t.concepts || []).map(c => c.name);
    let ci = 0;
    while (remaining > 0) {
      const allocated = Math.min(hoursPerWeek, remaining);
      const m = MILESTONE_NAMES[t.level] || `Level ${t.level}`;
      const focus = ci >= concepts.length
        ? `Consolidation: review + practice ${t.name}.`
        : `Focus: ${concepts[ci]}.`;
      ci++;
      weeks.push({
        week: weeks.length + 1,
        start: new Date(weekZero + weeks.length * weekMs).toISOString().slice(0, 10),
        milestone: m,
        level: t.level,
        topicId: tid,
        topic: t.name,
        hours: allocated,
        topics: [tid],
        action: `${t.name} (${m}) — ${allocated}h. ${focus}`.trim(),
      });
      remaining -= allocated;
    }
  }
  return weeks;
}

function buildPath({ selected, timeBudget, startDate }) {
  const ordered = topoSort(selected.map(s => s.topicId));
  const milestones = groupMilestones(ordered);
  const hw = Math.max(1, Math.min(40, timeBudget.hoursPerWeek));
  const totalHours = ordered.reduce((a, id) => a + getTopic(id).estHours, 0);

  // Edges for the DAG viz: inferred maximum acyclic edges between milestones.
  const orderedIds = ordered;
  const milestoneOf = new Map();
  milestones.forEach((m, i) => m.topics.forEach(id => milestoneOf.set(id, m.id)));
  const edges = [];
  const seenEdge = new Set();
  for (let i = 0; i < orderedIds.length; i++) {
    const id = orderedIds[i];
    const t = getTopic(id);
    for (const p of t.prereqs) {
      if (!orderedIds.includes(p)) continue;
      const key = `${p}->${id}`;
      if (seenEdge.has(key)) continue;
      seenEdge.add(key);
      edges.push({ from: p, to: id, prerequisite: true });
    }
  }

  const weeklyPlan = buildWeeklyPlan(ordered, hw, startDate ? new Date(startDate) : undefined);

  return {
    id: "path-" + Date.now().toString(36),
    totalHours,
    estimatedWeeks: weeklyPlan.length,
    hoursPerWeek: hw,
    order: ordered,
    milestones,
    edges,
    weeklyPlan,
    definitions: Object.fromEntries(ordered.map(id => [id, {
      name: getTopic(id).name, description: getTopic(id).description, estHours: getTopic(id).estHours, level: getTopic(id).level,
    }])),
    createdAt: new Date().toISOString(),
  };
}

module.exports = { buildPath, topoSort, groupMilestones, buildWeeklyPlan, MILESTONE_NAMES };