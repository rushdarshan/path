"use strict";

// Conversational profiling engine. Drives a multi-turn chat that elicits the
// profiling dimensions one at a time: name/goal -> interests -> experience -> 
// learning pattern -> time budget. Uses deterministic NLU (no external API)
// so profiling works offline and identically every run.

const { profileFromConversation, analyzeResume } = require("./profiler");

const FLOW = [
  {
    key: "goal",
    question: "Hi! I'm your learning path advisor. Let's build a path that actually fits you. First — what made you want to start learning? Something like: I want to get a job as a developer, I want to change careers into data science, it's a hobby, or I need to pass an exam.",
    hints: "Try: 'I want to break into tech as a web developer' or 'learning Python for data analysis as a hobby'",
  },
  {
    key: "interests",
    question: "Great. Now, what are you most interested in learning? List topics, technologies, or just what sounds fun to you.",
    hints: "e.g. Python, web development, machine learning, game design, cybersecurity, cloud",
  },
  {
    key: "baseline",
    question: "How much experience do you have already? Be honest — it tunes the path difficulty.",
    hints: "e.g. 'complete beginner', 'I know a bit of Python', 'I've built things at work'",
  },
  {
    key: "learningPattern",
    question: "How do you learn best? Do you like watching videos, reading docs, building hands-on, or listening to lectures?",
    hints: "e.g. 'I learn by watching then doing' or 'I read documentation mostly'",
  },
  {
    key: "timeBudget",
    question: "Last one — how many hours per week can you realistically spend?",
    hints: "e.g. '5 hours per week' or 'an hour a day'",
  },
];

function startSession(session) {
  return {
    step: FLOW[0].key,
    question: FLOW[0].question,
    hints: FLOW[0].hints,
    answered: {},
    complete: false,
    sessionId: session.id,
    isFirst: true,
  };
}

function nextQuestion(session) {
  const order = FLOW.map(f => f.key);
  const idx = order.indexOf(session.convoStep);
  const nextKey = order[idx + 1];
  if (!nextKey) return null;
  const next = FLOW.find(f => f.key === nextKey);
  session.convoStep = nextKey;
  return { step: nextKey, question: next.question, hints: next.hints, answered: session.answers, complete: false };
}

// Lightweight NLU that response to a free-text answer. Returns {captured, suggestion}.
function judgeAnswer(key, text) {
  const t = text.toLowerCase();
  switch (key) {
    case "timeBudget": {
      // "10 hours", "5 hrs", "10h", "phrase 'an hour a day'", "1.5h/day", "3h per day"
      const perWeek = t.match(/(\d{1,2}(?:\.\d)?)\s*(?:hours?|hrs?|h)\s*(?:per|a|each|a week|\/)?\s*(?:week)?/);
      const perDay = t.match(/(\d{1,2}(?:\.\d)?)\s*(?:hours?|hrs?|h)?\s*(?:per|a|each|\/)\s*day/) || (/(?:an?|one)\s+hour\s*(?:per|a|each|\/)?\s*day/.test(t) ? [null, "1"] : null);
      if (perWeek && perWeek[1] && !t.includes("day")) {
        const h = parseFloat(perWeek[1]);
        return { captured: { perWeek: Math.round(h * 10) / 10, perDay: null, hoursPerWeek: Math.max(1, Math.min(40, Math.round(h))) }, ok: true };
      }
      if (perDay && perDay[1]) {
        const h = parseFloat(perDay[1]);
        const w = Math.round(h * 7 * 10) / 10;
        return { captured: { perWeek: w, perDay: h, hoursPerWeek: Math.max(1, Math.min(40, Math.round(w))) }, ok: true };
      }
      return { captured: null, ok: false, hint: "I need a number of hours — like '10 hours', '5 hours a week', or 'an hour a day'." };
    }
    default:
      return { captured: { raw: text }, ok: true };
  }
}

// Whether the engine believes it has enough to generate a path.
function canGenerate(session) {
  return session.answers && session.answers.goal && session.answers.interests;
}

module.exports = { FLOW, startSession, nextQuestion, judgeAnswer, canGenerate };