"use strict";

// Profiling engine: free-text conversation + resume -> structured learner profile.
// Every inference carries {value, confidence, evidence} so the explainability layer
// (and dashboard) can show WHY the system thinks what it thinks.

const { topicsForKeyword, getTopic, allTopics } = require("./ontology");

// ---------- Learning-pattern extraction ----------

const LEARNING_STYLE_HINTS = [
  { style: "visual", confidence: 0.55, re: /\b(watch|video|see|visual|diagram|infographic|draw|animated|screenshot|charts)\w*/i },
  { style: "reading", confidence: 0.55, re: /\b(read|book|article|documentation|text|write notes|reading)\w*/i },
  { style: "hands", confidence: 0.55, re: /\b(build|practice|hands.?on|exercises|projects|do it myself|try|experiment|apply|used|implemented|created|developed|shipped|deployed|ran)\w*/i },
  { style: "auditory", confidence: 0.45, re: /\b(podcast|listen|audio|lecture|talk through|explain to me)\w*/i },
];

// Keyword signals that reveal *what* the learner wants to build / become / fix.
const GOAL_PATTERNS = [
  { goal: "career_transition", re: /\b(switch|move into|transition to|new career|change career|break into|get into|become a|work as|want to be a|start a career)\w*/i },
  { goal: "job_ready", re: /\b(get a job|hired|employment|land a role|interview|portfolio for|job focused|jobs? in|hiring|job ready|dream job|aiming for a role)\w*/i },
  { goal: "career_advancement", re: /\b(promotion|senior|advance|next level|level up my career|grow in my role|upskill at work)\w*/i },
  { goal: "build_projects", re: /\b(build|create|make|ship|launch) (a |my |an )?[a-z ]*(app|website|project|product|game|tool|portfolio)\w*/i },
  { goal: "start_learning", re: /\b(start learning|zero|no experience|absolute beginner|from scratch|new to)\w*/i },
  { goal: "exam_cert", re: /\b(certif|exam|certification|get certified|pass the)\w*/i },
  { goal: "curiosity", re: /\b(interesting|curious|want to understand|fascinated|always wanted to learn|hobby)\w*/i },
  { goal: "academic", re: /\b(course|university|college|degree|study for)\w*/i },
];

const TIME_BUDGET_RE = /\b(\d{1,2})\s*(hours?|hrs?|h)\s*(?:per|a|each|every)?\s*(?:week|w)?\b/i;

// ---------- Baseline / prior skill detection ----------

const BASELINE_SIGNALS = [
  { level: "none", re: /\b(no experience|zero|complete beginner|brand new|never)\w*/i },
  { level: "some", re: /\b(some|basic|a little|started|took a|beginner|dabbled|intro|know a bit)\w*/i },
  { level: "working", re: /\b(comfortable|intermediate|worked with|built (a|an|some)|used [a-z]+ (at|in) work|2\+ years|for [0-9]+ months)\w*/i },
  { level: "strong", re: /\b(expert|advanced|fluent|years? of (professional )?experience|senior|lead|proficient)\w*/i },
];

// ---------- The profiler ----------

function naturalLanguage(text) {
  return text ? text.replace(/[<>]/g, " ").trim() : "";
}

function scoreStyle(text) {
  const scores = { visual: 0, reading: 0, hands: 0, auditory: 0 };
  const evidence = {};
  for (const hint of LEARNING_STYLE_HINTS) {
    const m = text.match(hint.re);
    if (m) {
      scores[hint.style] += hint.confidence;
      evidence[hint.style] = m[0];
    }
  }
  const max = Math.max(0.2, ...Object.values(scores));
  const dominant = Object.entries(scores).sort((a, b) => b[1] - a[1]).filter(e => e[1] > 0).map(e => e[0]);
  if (!dominant.length) {
    // No explicit style signal: don't return an all-zero vector. Default hands-on
    // (the most common self-report) at low confidence and flag the assumption.
    return {
      profile: { visual: 0.4, reading: 0.4, hands: 0.7, auditory: 0.2 },
      evidence: {},
      dominant: ["hands"],
      defaultAssumption: true,
    };
  }
  return {
    profile: {
      visual: +(scores.visual / max).toFixed(2),
      reading: +(scores.reading / max).toFixed(2),
      hands: +(scores.hands / max).toFixed(2),
      auditory: +(scores.auditory / max).toFixed(2),
    },
    evidence,
    dominant,
  };
}

function extractGoals(text) {
  const goals = [];
  for (const p of GOAL_PATTERNS) {
    const m = text.match(p.re);
    if (m) {
      goals.push({ goal: p.goal, confidence: 0.5 + Math.min(0.4, m[0].length / 40), evidence: m[0] });
    }
  }
  if (!goals.length) goals.push({ goal: "start_learning", confidence: 0.4, evidence: text.split(/\s+/).length < 40 ? "short or generic answer" : "no explicit goal signal" });
  return goals;
}

const STOPWORDS = new Set([
  "the","and","for","get","job","into","with","of","a","an","my","to","i","in","on",
  "it","is","are","was","be","at","by","as","or","have","has","want","wanna","like",
  "about","from","this","that","what","how","when","where","who","do","does","new",
  "learn","learning","study","want","what's","best","just","really","etc","etc.",
  "beginner","complete",
]);

function extractInterests(text) {
  const results = [];
  const seen = new Set();
  // 1) Exact topic keyword matches (exact key OR compound/keyword phrase)
  const words = text.toLowerCase().split(/[^a-z0-9+#_-]+/).filter(w => w.length >= 2 && !STOPWORDS.has(w));
  for (const w of words) {
    for (const tid of w.length >= 2 ? topicsForKeyword(w) : []) {
      if (seen.has(tid)) continue;
      seen.add(tid);
      results.push({ topicId: tid, confidence: 0.8, evidence: w, kind: "explicit_keyword" });
    }
  }
  // 2) Fuzzy/compound matches — e.g. "web development", "machine learning", "cyber security"
  const compoundPatterns = [
    ["web development", ["html-css", "javascript-core"]],
    ["web dev", ["html-css", "javascript-core"]],
    ["frontend", ["html-css", "javascript-core", "react-frontend"]],
    ["full stack", ["react-frontend", "node-backend"]],
    ["machine learning", ["ml-basics", "python-for-data"]],
    ["deep learning", ["deep-learning"]],
    ["ai", ["ml-basics", "llm-applications"]],
    ["data science", ["python-for-data", "statistics-foundations", "ml-basics"]],
    ["data analytics", ["databases-sql", "business-analytics"]],
    ["cyber security", ["security-basics", "penetration-testing"]],
    ["cloud", ["aws-cloud", "docker-systems"]],
    ["devops", ["docker-systems", "ci-cd"]],
    ["game development", ["game-dev-basics"]],
    ["game design", ["game-design"]],
    ["mobile", ["react-native-mobile"]],
    ["product management", ["product-management"]],
    ["product manager", ["product-management"]],
    ["ux", ["ux-design"]],
    ["ui design", ["ux-design"]],
  ];
  for (const [phrase, tids] of compoundPatterns) {
    if (text.toLowerCase().includes(phrase)) {
      for (const tid of tids) {
        if (seen.has(tid)) continue;
        seen.add(tid);
        results.push({ topicId: tid, confidence: 0.7, evidence: phrase, kind: "compound_match" });
      }
    }
  }
  return results;
}

function extractTimeBudget(text) {
  const m = text.match(TIME_BUDGET_RE);
  if (m) {
    const hours = parseInt(m[1], 10);
    // Guard: if the sentence was clearly about TOTAL hours ("I want 20 hours total"),
    // treat as per-week default still but flag it.
    const total = /\bper (year|month|course)\b/.test(text);
    return { hoursPerWeek: hours, confidence: total ? 0.4 : 0.7, evidence: m[0], isTotal: total };
  }
  // Common prose phrasings
  if (/\b(morning|evening|after work|commute)\b/i.test(text) && /\b(an hour|hour a day|30 minutes|daily)\b/i.test(text)) {
    return { hoursPerWeek: 5, confidence: 0.4, evidence: "daily habit phrasing" };
  }
  if (/\ba lot of time\b/i.test(text)) return { hoursPerWeek: 15, confidence: 0.3, evidence: "a lot of time" };
  if (/\blittle time\b/i.test(text)) return { hoursPerWeek: 3, confidence: 0.4, evidence: "little time" };
  return { hoursPerWeek: 8, confidence: 0.3, evidence: "no explicit budget", isDefault: true };
}

function extractPace(text) {
  if (/\b(intensive|full.?time|fast|accelerated|cram|as fast)\w*/i.test(text)) return { pace: "intensive", confidence: 0.5, evidence: "intensity signal" };
  if (/\b(relaxed|slow|gentle|no rush|steady)\w*/i.test(text)) return { pace: "relaxed", confidence: 0.5, evidence: "pace signal" };
  return { pace: "steady", confidence: 0.3, evidence: "no explicit pace" };
}

function extractNeedsForInterests(interests, baseline) {
  // Derive "needs" from the raw topics hit + baseline: what a learner lacks.
  const needs = [];
  if (baseline === "none") {
    for (const i of interests) {
      const t = getTopic(i.topicId);
      for (const c of t.concepts.slice(0, 2)) {
        needs.push({ need: `${c.name} fundamentals`, concept: c.name, topicId: t.id, confidence: 0.5, evidence: `no prior experience in ${t.name}` });
      }
    }
  } else if (baseline === "some") {
    for (const i of interests) {
      const t = getTopic(i.topicId);
      if (t.concepts.length > 2) {
        needs.push({ need: `${t.concepts[2].name} depth`, concept: t.concepts[2].name, topicId: t.id, confidence: 0.45, evidence: `basic exposure to ${t.name}` });
      }
    }
  }
  return needs;
}

// PubMed-style resume text -> extracted topics + tech mentions
const TECH_TOKEN_RE = /(python|javascript|typescript|react|node\.?js|sql|postgres|mysql|mongodb|docker|kubernetes|aws|gcp|azure|linux|git|html|css|excel|tableau|power\s?bi|pandas|numpy|scikit|tensorflow|pytorch|java|c\+\+|c#|php|ruby|swift|kotlin|flutter|dart|unity|unreal|figma|jira|agile|scrum|kafka|spark|hadoop|airflow|mlops|cyber|security|networking)\b/i;

function analyzeResume(resumeText) {
  const raw = naturalLanguage(resumeText);
  if (!raw) return null;
  const mentions = (raw.match(new RegExp(TECH_TOKEN_RE.source, "gi")) || []).map(s => s.toLowerCase());
  const uniq = [...new Set(mentions)];
  const topicHits = [];
  const seen = new Set();
  for (const tok of uniq) {
    for (const tid of topicsForKeyword(tok)) {
      if (seen.has(tid)) continue;
      seen.add(tid);
      topicHits.push({ topicId: tid, confidence: 0.6, evidence: tok, kind: "resume_token" });
    }
  }
  // Explicit mentions of roles give goal hints too.
  const roleHits = [];
  const roles = [/software engineer\w*/i, /data scientist\w*/i, /developer\w*/i, /analyst\w*/i, /designer\w*/i, /project manager\w*/i, /student\w*/i, /career changer\w*/i];
  for (const r of roles) {
    const m = raw.match(r);
    if (m) roleHits.push(m[0]);
  }
  return { raw, tokens: uniq, topicHits, roleHits, wordCount: raw.split(/\s+/).filter(Boolean).length };
}

// Main entry — merge everything into a structured learner profile.
function profileFromConversation({ answers = {}, resume = null, previous = null }) {
  const text = naturalLanguage(Object.values(answers).join(" . ") + (resume ? " . " + resume : ""));
  const styleInfo = scoreStyle(text);
  const goals = extractGoals(text);
  const interests = extractInterests(text);
  const budget = (typeof answers.hoursPerWeek === "number")
    ? { hoursPerWeek: answers.hoursPerWeek, confidence: 0.8, evidence: "transcribed from chat" }
    : extractTimeBudget(text);
  const pace = extractPace(text);

  // Baseline: explicit answers first, then detect from full text.
  const explicitBaseline = naturalLanguage(answers.baseline || answers.experience || "");
  let baseline = "some";
  let baselineConfidence = 0.5;
  let baselineEvidence = "assumed from response";
  for (const s of BASELINE_SIGNALS) {
    if (s.re.test(explicitBaseline) || s.re.test(text)) {
      baseline = s.level; baselineConfidence = s.level === "some" ? 0.45 : 0.7; baselineEvidence = "explicit signal";
      break;
    }
  }

  const needs = extractNeedsForInterests(interests, baseline);

  const profile = {
    person: naturalLanguage(answers.name) || null,
    goals: goals.filter(g => g.confidence >= 0.5).length ? goals.filter(g => g.confidence >= 0.5) : goals,
    interests,
    needs,
    style: styleInfo.profile,
    pace,
    timeBudget: { hoursPerWeek: budget.hoursPerWeek, confidence: budget.confidence, evidence: budget.evidence },
    baseline: { level: baseline, confidence: baselineConfidence, evidence: baselineEvidence },
    resume: resume ? analyzeResume(resume) : null,
    profilerEvidence: {
      style: styleInfo.evidence,
      goals: goals.map(g => g.evidence).filter(Boolean),
      interests: interests.map(i => i.evidence).filter(Boolean),
      baseline: baselineEvidence,
    },
  };
  return profile;
}

module.exports = { profileFromConversation, analyzeResume, extractInterests, extractGoals, scoreStyle };