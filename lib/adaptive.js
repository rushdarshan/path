"use strict";

const { getTopic } = require("./ontology");

function feedbackMultiplier(feedback, topicId) {
  let multiplier = 1;
  const list = feedback || [];
  for (const f of list.filter(x => x.topicId === topicId)) {
    if (f.type === "too_difficult") multiplier *= 0.75;
    if (f.type === "not_relevant") multiplier *= 0.60;
    if (f.type === "already_know") multiplier *= 0.40;
    if (f.type === "liked") multiplier *= 1.10;
  }
  return Math.max(0.25, Math.min(1.25, multiplier));
}

function getAdaptiveRecommendations({ profile, recommendation, mastery, feedback }) {
  const candidates = (recommendation && recommendation.selected) || [];
  mastery = mastery || {};
  feedback = feedback || [];

  const adapted = candidates.map(c => {
    const topicId = c.topicId;
    const baseScore = c.total;
    const goalRelevance = (c.factors && c.factors.goal && typeof c.factors.goal.score === "number")
      ? c.factors.goal.score
      : 0.50;

    const topicMastery = (mastery[topicId] && typeof mastery[topicId].theta === "number")
      ? mastery[topicId].theta
      : 0.10;

    const gap = 1 - topicMastery;

    // adaptiveScore = baseScore * 0.50 + gap * 0.30 + goalRelevance * 0.20
    const adaptiveScoreRaw = baseScore * 0.50 + gap * 0.30 + goalRelevance * 0.20;
    const multiplier = feedbackMultiplier(feedback, topicId);
    const adaptiveScore = Math.max(0, Math.min(1, adaptiveScoreRaw * multiplier));

    // priority = gap * baseScore
    const priorityScore = gap * baseScore;
    let priority = "low";
    if (priorityScore >= 0.65) priority = "critical";
    else if (priorityScore >= 0.45) priority = "high";
    else if (priorityScore >= 0.25) priority = "medium";

    // Reason generation
    let reason = "Recommended to progress your customized learning path.";
    if (topicMastery < 0.40) {
      reason = "Recommended because your mastery is low and this skill is highly relevant to your goal.";
    } else if (topicMastery >= 0.70) {
      reason = "You already have strong mastery; moving forward prevents unnecessary repetition.";
    } else {
      reason = "Recommended as the next prerequisite because you have mastered the upstream concepts.";
    }

    // Dynamic explanation fields (Section 7)
    const whyRecommended = [];
    
    // Goal factor
    const goalDriver = (c.factors && c.factors.goal && c.factors.goal.driver) || "";
    if (goalDriver) {
      whyRecommended.push(goalDriver.charAt(0).toUpperCase() + goalDriver.slice(1));
    } else {
      whyRecommended.push("Matches your learning goals");
    }

    // Prerequisite / readiness factor
    const hasPrereqs = getTopic(topicId)?.prereqs?.length > 0;
    if (hasPrereqs) {
      whyRecommended.push("You have strong prerequisite mastery");
    }
    whyRecommended.push("Your current path is ready for this topic");

    let whyNow = "Next recommended step in your learning path.";
    if (topicMastery < 0.40) {
      whyNow = "Previous prerequisite topics are sufficiently mastered.";
    } else if (topicMastery >= 0.70) {
      whyNow = "You have solid foundational knowledge here; advance to keep progress moving.";
    } else if (hasPrereqs) {
      whyNow = "Previous prerequisite topics are sufficiently mastered.";
    }

    return {
      topicId,
      name: c.name,
      baseScore,
      adaptiveScore: +adaptiveScore.toFixed(3),
      mastery: +topicMastery.toFixed(3),
      gap: +gap.toFixed(3),
      priority,
      reason,
      explanation: {
        whyRecommended,
        whyNow
      }
    };
  });

  // Rerank by adaptiveScore descending
  adapted.sort((a, b) => b.adaptiveScore - a.adaptiveScore);

  return {
    recommendations: adapted,
    strategy: "mastery_gap",
    generatedAt: new Date().toISOString()
  };
}

module.exports = { getAdaptiveRecommendations, feedbackMultiplier };
