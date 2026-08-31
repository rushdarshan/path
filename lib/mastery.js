"use strict";

// Adaptive mastery engine: per-concept mastery tracking (a lightweight IRT/BKT-
// style estimate), quiz generation targeting weak concepts, and the adaptive
// retry loop that re-quizzes precisely what a learner missed and refreshes the
// path with compensations. Direct counter to skillpath (weak-concept memory)
// and AIE (mastery tracking + adaptive difficulty).

const { getTopic } = require("./ontology");

// ---- Mastery math ----
// mastery in [0,1], updated by Elo-like / BKT-style evidence.
// Theta = current estimate. Each correct answer pushes theta up; wrong pulls
// down. Confidence grows with evidence volume.

function initialMastery() { return { theta: 0.1, evidence: 0, n: 0, attempts: [], lastUpdated: null, pKnown: 0.1, pSlip: 0.1, pGuess: 0.25, pTransit: 0.12 }; }

function updateMastery(m, correct, difficulty = 1) {
  const k = 0.12 * difficulty; // difficulty scales the learning step
  const L = m.pKnown ?? 0.1;
  const pSlip = m.pSlip ?? 0.1;
  const pGuess = m.pGuess ?? 0.25;
  const pT = (m.pTransit ?? 0.12) * Math.min(3, k + 1);
  let posterior;
  if (correct) {
    const d = L * (1 - pSlip) + (1 - L) * pGuess;
    posterior = d ? (L * (1 - pSlip)) / d : L; // P(L | correct) belies guess/slip
  } else {
    const d = L * pSlip + (1 - L) * (1 - pGuess);
    posterior = d ? (L * pSlip) / d : L; // P(L | wrong)
  }
  m.pKnown = Math.max(0.01, Math.min(0.99, posterior + (1 - posterior) * pT));
  m.theta = m.pKnown;
  m.evidence = correct ? m.evidence + 0.15 + k : m.evidence - 0.12;
  m.evidence = Math.max(0.05, m.evidence);
  m.n += 1;
  m.attempts.push({ correct, difficulty, at: Date.now() });
  m.lastUpdated = Date.now();
  return m;
}

// Mastery level used throughout the UI.
function masteryLabel(m) {
  if (!m) return { label: "Not started", theta: 0, color: "#888" };
  if (m.theta >= 0.8) return { label: "Mastered", theta: m.theta, color: "#46a758" };
  if (m.theta >= 0.55) return { label: "Working", theta: m.theta, color: "#0091ff" };
  if (m.theta >= 0.3) return { label: "Learning", theta: m.theta, color: "#f76b15" };
  return { label: "Fragile", theta: m.theta, color: "#e5484d" };
}

// ---- Quiz question bank ----
// Fallback deterministic bank so the app WORKS with zero external APIs.
const QUESTION_BANK = {
  "programming-basics": [
    { q: "Which Python data type is immutable?", options: ["list", "tuple", "dict", "set"], answer: 1, concept: "data-types", difficulty: 1 },
    { q: "What does a function return when there is no return statement?", options: ["None", "0", "null", "undefined"], answer: 0, concept: "functions", difficulty: 1 },
    { q: "What keyword is used to define a loop that iterates over items?", options: ["for", "while", "do", "repeat"], answer: 0, concept: "control-flow", difficulty: 1 },
    { q: "What is the typical output of `type(3.14)` in Python?", options: ["int", "float", "double", "num"], answer: 1, concept: "data-types", difficulty: 1 },
  ],
  "html-css": [
    { q: "Which HTML tag is the correct semantic for the main content?", options: ["<main>", "<div>", "<content>", "<body>"], answer: 0, concept: "html-semantics", difficulty: 1 },
    { q: "Which CSS property lays children in a row or column?", options: ["display", "position", "flex-direction", "box-sizing"], answer: 2, concept: "flexbox-grid", difficulty: 1 },
    { q: "What is the box model order (inside-out)?", options: ["content, padding, border, margin", "margin, border, padding, content", "content, border, padding, margin", "padding, margin, border, content"], answer: 0, concept: "box-model-layout", difficulty: 1.2 },
  ],
  "javascript-core": [
    { q: "Which keyword declares a block-scoped variable?", options: ["var", "let", "static", "def"], answer: 1, concept: "syntax-and-types", difficulty: 1 },
    { q: "What does `async` + `await` handle?", options: ["Promises", "Errors", "Hoisting", "Closures"], answer: 0, concept: "asynchronous-js", difficulty: 1.3 },
    { q: "What is inside a closure?", options: ["Function + its lexical scope", "Class methods only", "Global vars only", "DOM only"], answer: 0, concept: "functions-scope-closures", difficulty: 1.2 },
  ],
  "ml-basics": [
    { q: "What problem does supervised learning solve?", options: ["Labeled prediction", "Clustering", "Reinforcement", "Generation"], answer: 0, concept: "supervised-learning", difficulty: 1.2 },
    { q: "What is overfitting?", options: ["Model memorizes training", "Model is too slow", "Data is too small", "GPU overheats"], answer: 0, concept: "overfitting-regularization", difficulty: 1.3 },
    { q: "Which metric fits a binary classification?", options: ["Precision/Recall", "Mean squared error", "R-squared", "IOU"], answer: 0, concept: "model-evaluation", difficulty: 1.1 },
  ],
  "databases-sql": [
    { q: "Which clause combines rows from two tables?", options: ["JOIN", "WHERE", "GROUP BY", "LIMIT"], answer: 0, concept: "joins", difficulty: 1.1 },
    { q: "Which function counts rows per group?", options: ["COUNT", "SUM", "AVG", "MAX"], answer: 0, concept: "aggregations", difficulty: 1 },
    { q: "What does an index speed up?", options: ["Lookup", "Storage", "Backup", "Replication"], answer: 0, concept: "indexing", difficulty: 1.2 },
  ],
  "statistics-foundations": [
    { q: "Which term describes the spread of a distribution?", options: ["Variance", "Mean", "Median", "Mode"], answer: 0, concept: "descriptive-statistics", difficulty: 1 },
    { q: "What does a p-value help assess?", options: ["Hypothesis significance", "Data size", "Spread", "Bias"], answer: 0, concept: "hypothesis-testing", difficulty: 1.3 },
  ],
  "git-version-control": [
    { q: "Which command saves a snapshot?", options: ["git commit", "git push", "git merge", "git clone"], answer: 0, concept: "commits", difficulty: 1 },
    { q: "Which command creates a new branch?", options: ["git branch", "git log", "git status", "git stash"], answer: 0, concept: "branching", difficulty: 1 },
  ],
  "react-frontend": [
    { q: "What is a React hook for local state?", options: ["useState", "useFetch", "useRouter", "useDOM"], answer: 0, concept: "state-and-hooks", difficulty: 1.2 },
    { q: "What sends props from parent to child?", options: ["Attributes", "Events", "Signals", "Reducers"], answer: 0, concept: "components-and-props", difficulty: 1 },
  ],
  "node-backend": [
    { q: "Which framework is built on Node?", options: ["Express", "Django", "Laravel", "Rails"], answer: 0, concept: "http-and-routing", difficulty: 1 },
    { q: "What does an API endpoint GET return?", options: ["Data", "Forms", "Sessions", "SQL"], answer: 0, concept: "rest-api-design", difficulty: 1 },
  ],
  "security-basics": [
    { q: "Which attack injects untrusted code into a web app?", options: ["XSS", "DDoS", "Phishing", "Brute-force"], answer: 0, concept: "web-attacks", difficulty: 1.1 },
    { q: "What does symmetric encryption use?", options: ["Shared key", "Public key", "No key", "Hash"], answer: 0, concept: "cryptography-basics", difficulty: 1.2 },
  ],
  "aws-cloud": [
    { q: "Which AWS service is object storage?", options: ["S3", "EC2", "Lambda", "VPC"], answer: 0, concept: "storage-s3", difficulty: 1 },
    { q: "Which service runs code without servers?", options: ["Lambda", "EC2", "RDS", "EBS"], answer: 0, concept: "compute-ec2-lambda", difficulty: 1.1 },
  ],
  "docker-systems": [
    { q: "What is a Docker image?", options: ["Read-only template", "Running process", "Network config", "Log file"], answer: 0, concept: "images-vs-containers", difficulty: 1 },
    { q: "Which file defines multi-container setup?", options: ["docker-compose.yml", "Dockerfile", ".env", "README"], answer: 0, concept: "compose-networking", difficulty: 1.1 },
  ],
  "penetration-testing": [
    { q: "What is the first phase of a pentest?", options: ["Reconnaissance", "Exploitation", "Reporting", "Cleanup"], answer: 0, concept: "reconnaissance", difficulty: 1 },
  ],
  "python-for-data": [
    { q: "Which library provides DataFrames?", options: ["pandas", "requests", "flask", "django"], answer: 0, concept: "pandas-dataframes", difficulty: 1 },
    { q: "What is EDA short for?", options: ["Exploratory data analysis", "End data access", "External data audit", "Error detection alarm"], answer: 0, concept: "eda-reporting", difficulty: 1 },
  ],
  "deep-learning": [
    { q: "What does backpropagation compute?", options: ["Gradients", "Features", "Loss baseline", "Batch size"], answer: 0, concept: "backpropagation", difficulty: 1.4 },
    { q: "What layer transforms sequences into context? (attention)", options: ["Transformer", "Convolution", "Dropout", "Pooling"], answer: 0, concept: "transformers", difficulty: 1.5 },
  ],
  "llm-applications": [
    { q: "What does RAG stand for?", options: ["Retrieval-augmented generation", "Random access graph", "Real-time argument grid", "Recurrent attention gap"], answer: 0, concept: "rag-retrieval", difficulty: 1.2 },
  ],
};

// ---- Session engine ----

function createMasteryMap(topicIds) {
  const m = {};
  for (const id of topicIds) {
    const t = getTopic(id);
    m[id] = { theta: 0.1, evidence: 0, n: 0, attempts: [], lastUpdated: null, conceptScores: {} };
    for (const c of t.concepts) m[id].conceptScores[c.name] = initialMastery();
  }
  return m;
}

function pickNextQuiz(mastery, topicIds, bank = QUESTION_BANK) {
  // Find the weakest *quiz-able* concept: a concept that has bank questions in
  // its topic. Concepts with no bank coverage are skipped — re-quizzing a
  // concept we can't test just re-asks unrelated questions (retry lock).
  let weakest = null;
  let weakestTopic = null;
  for (const tid of topicIds) {
    const m = mastery[tid];
    const topicHas = (bank[tid] || []).filter(q => q.concept && q.answer !== undefined);
    if (!m || !topicHas.length) continue;
    for (const [concept, cs] of Object.entries(m.conceptScores)) {
      const testable = topicHas.some(q => q.concept === concept);
      if (!testable) continue;
      if (!weakest || cs.theta < weakest) { weakest = cs.theta; weakestTopic = { tid, concept }; }
    }
  }
  if (!weakestTopic) {
    // No weak concept is testable — pick a likely newcomer topic.
    const candidates = topicIds.filter(tid => (bank[tid] || []).length);
    weakestTopic = { tid: candidates[0] || topicIds[0], concept: null };
  }
  const questions = bank[weakestTopic.tid] || [];
  const picked = questions.filter(q => !weakestTopic.concept || q.concept === weakestTopic.concept);
  const pool = picked.length ? picked : questions.slice(0, 3);
  const wire = pool.map(q => ({ question: q.q, options: q.options, concept: q.concept, difficulty: q.difficulty }));
  return {
    topicId: weakestTopic.tid,
    topicName: getTopic(weakestTopic.tid).name,
    concept: weakestTopic.concept || "core",
    reason: picked.length
      ? `Mastery of "${weakestTopic.concept}" is lowest in ${getTopic(weakestTopic.tid).name}.`
      : `Re-quizzing ${getTopic(weakestTopic.tid).name} to solidify core concepts.`,
    questions: wire,
    keys: pool.map(q => q.answer),
  };
}

function submitAnswers(mastery, quiz, answers) {
  const results = [];
  const topicId = quiz.topicId;
  const keys = quiz.keys || quiz.questions.map(q => q.answer);
  for (let i = 0; i < quiz.questions.length; i++) {
    const q = quiz.questions[i];
    const correct = answers[i] === keys[i];
    const m = mastery[topicId];
    if (m) {
      const updated = updateMastery(m, correct, q.difficulty);
      if (m.conceptScores && q.concept) {
        m.conceptScores[q.concept] = updateMastery(m.conceptScores[q.concept], correct, q.difficulty);
      }
      m.theta = updated.theta; m.evidence = updated.evidence; m.n = updated.n;
    }
    results.push({ correct, concept: q.concept, answerGiven: answers[i], expected: keys[i] });
  }
  // If still fragile in any quiz-able concept, mark the topic for compensation.
  const m = mastery[topicId];
  const testable = (concept) => (QUESTION_BANK[topicId] || []).some(q => q.concept === concept);
  const scored = m ? Object.entries(m.conceptScores).filter(([c]) => testable(c)) : [];
  const weakestConcept = scored.sort((a, b) => a[1].theta - b[1].theta)[0] || null;
  const needsRetry = weakestConcept && weakestConcept[1].theta < 0.45;
  const weakConcepts = scored.filter(([, cs]) => cs.theta < 0.45).map(([c]) => c);
  const score = results.filter(r => r.correct).length;
  return {
    results, topicId, needsRetry, score, total: quiz.questions.length, weakConcepts,
    next: needsRetry
      ? { type: "retry", target: weakestConcept[0], reason: `"${weakestConcept[0]}" still low (${weakestConcept[1].theta.toFixed(2)})` }
      : { type: "advance", reason: "core concepts are solid enough to proceed" },
  };
}

module.exports = { createMasteryMap, pickNextQuiz, submitAnswers, updateMastery, masteryLabel, QUESTION_BANK };