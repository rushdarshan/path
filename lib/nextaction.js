"use strict";

const { getTopic } = require("./ontology");

function formatConceptName(name) {
  if (!name) return "";
  return name.replace(/-/g, " ");
}

function getNextAction({ profile, path, mastery, feedback }) {
  mastery = mastery || {};
  feedback = feedback || [];
  
  if (!path || !path.order || !path.order.length) {
    return {
      action: "learn",
      topicId: "programming-basics",
      title: "Start with Programming Basics",
      reason: "No active learning path was found. Let's start with the basics.",
      estimatedMinutes: 45,
      priority: "high"
    };
  }

  // Find the first topic in path order that is not fully mastered (theta < 0.80)
  let targetTopicId = null;
  for (const tid of path.order) {
    const theta = (mastery[tid] && typeof mastery[tid].theta === "number")
      ? mastery[tid].theta
      : 0.10;
    if (theta < 0.80) {
      targetTopicId = tid;
      break;
    }
  }

  // If all are mastered, fallback to the last topic
  if (!targetTopicId) {
    targetTopicId = path.order[path.order.length - 1];
  }

  const topicObj = getTopic(targetTopicId);
  const topicName = topicObj ? topicObj.name : targetTopicId;

  // Find the weakest concept in this topic
  let targetConcept = null;
  const m = mastery[targetTopicId];
  if (m && m.conceptScores) {
    let lowestTheta = Infinity;
    for (const [cName, cs] of Object.entries(m.conceptScores)) {
      if (typeof cs.theta === "number" && cs.theta < lowestTheta) {
        lowestTheta = cs.theta;
        targetConcept = cName;
      }
    }
  }

  // Fallback to the first concept of the topic from the ontology if none found
  if (!targetConcept && topicObj && topicObj.concepts && topicObj.concepts.length) {
    targetConcept = topicObj.concepts[0].name;
  }
  targetConcept = targetConcept || "core";

  const theta = (m && typeof m.theta === "number") ? m.theta : 0.10;
  const gap = 1 - theta;

  // Determine action
  let action = "learn";
  if (theta < 0.30) {
    action = (m && m.n > 0) ? "review" : "learn";
  } else if (theta <= 0.55) {
    const hasNegativeFeedback = feedback.some(f => f.topicId === targetTopicId && (f.type === "too_difficult" || f.type === "disliked"));
    action = (hasNegativeFeedback || (m && m.n > 0)) ? "review" : "practice";
  } else if (theta <= 0.80) {
    action = "quiz";
  } else {
    action = "advance";
  }

  // Generate Title
  let title = `Study ${topicName}`;
  if (action === "learn") {
    title = `Learn ${formatConceptName(targetConcept)}`;
  } else if (action === "review") {
    title = `Review ${formatConceptName(targetConcept)}`;
  } else if (action === "practice") {
    title = `Practice ${formatConceptName(targetConcept)}`;
  } else if (action === "quiz") {
    title = `Take ${topicName} quiz`;
  } else if (action === "advance") {
    title = `Advance to next topic`;
  }

  // Generate Reason
  const currentIndex = path.order.indexOf(targetTopicId);
  const nextTopicId = (currentIndex !== -1 && currentIndex + 1 < path.order.length) ? path.order[currentIndex + 1] : null;
  const nextTopicName = nextTopicId ? (getTopic(nextTopicId)?.name || nextTopicId) : "your career goals";
  const reason = `Your mastery is ${theta.toFixed(2)} and this concept is required before ${nextTopicName}.`;

  // Estimate minutes
  let estimatedMinutes = 45;
  if (action === "learn") estimatedMinutes = 60;
  else if (action === "review") estimatedMinutes = 45;
  else if (action === "practice") estimatedMinutes = 45;
  else if (action === "quiz") estimatedMinutes = 15;
  else if (action === "advance") estimatedMinutes = 15;

  // Priority
  const priorityScore = gap * 0.7;
  let priority = "low";
  if (priorityScore >= 0.65) priority = "critical";
  else if (priorityScore >= 0.45) priority = "high";
  else if (priorityScore >= 0.25) priority = "medium";

  return {
    action,
    topicId: targetTopicId,
    title,
    reason,
    estimatedMinutes,
    priority
  };
}

module.exports = { getNextAction };
