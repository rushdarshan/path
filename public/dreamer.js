// Dreamer — Career Dreamer × Pathlight
// NOTE: $ and $$ are declared in app.js — do NOT redeclare here.
(() => {

/* ─────────────────────────────────────────
   STATE
───────────────────────────────────────── */
const DRAFT_KEY = "dreamer_draft_v3";
let state = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null") || {
  role: "", org: "", tasks: [], skills: [], education: "Bachelor's degree",
  major: "", interests: [], motivations: [], experiences: "",
  pinned: [], currentTarget: null,
};
let currentStep = 0;
let phTimer = null, phIdx = 0;
let constellationNodes = [];
let hoveredNode = null;
let activeModalRole = null;
let modalSlide = 0;
let animRaf = null;

function save() { localStorage.setItem(DRAFT_KEY, JSON.stringify(state)); }

function sid() {
  return (typeof window.SID !== "undefined" && window.SID) ||
         localStorage.getItem("pathlight_sid") || null;
}

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
function el(id) { return document.getElementById(id); }

async function inheritedSend(text) {
  const id = sid();
  if (!id) return null;
  if (typeof window.userMsg === "function") window.userMsg(text);
  try {
    const r = await fetch(`/api/session/${id}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const res = await r.json();
    if (res && res.result && typeof window.LAST_RESULT !== "undefined") {
      window.LAST_RESULT = res.result;
      window.dispatchEvent(new CustomEvent("pathlight:sessionUpdated", { detail: res.result }));
      if (window.syncPreview) window.syncPreview();
    }
    if (res && res.stillAsk && res.question && typeof window.botMsg === "function")
      window.botMsg(res.question);
    if (res && res.done && typeof window.botMsg === "function")
      window.botMsg("Profile complete — see your live map →");
    return res;
  } catch (e) { console.warn("inheritedSend", e); return null; }
}

async function callAI(prompt, system) {
  try {
    const r = await fetch("/api/ai/prompt", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, system: system || "", temperature: 0.8 }),
    });
    const j = await r.json();
    return j.reply || "";
  } catch { return ""; }
}

/* ─────────────────────────────────────────
   TAB NAVIGATION
───────────────────────────────────────── */
function switchTab(tabName) {
  document.querySelectorAll(".dtab").forEach(b => {
    const active = b.dataset.tab === tabName;
    b.classList.toggle("active", active);
    b.setAttribute("aria-selected", active ? "true" : "false");
  });
  document.querySelectorAll(".dpanel").forEach(p => {
    p.classList.toggle("active", p.id === "panel-" + tabName);
  });
  if (tabName === "explore") initConstellation();
  if (tabName === "pinned") renderPinnedPanel();
}

document.querySelectorAll(".dtab").forEach(b => {
  b.addEventListener("click", () => switchTab(b.dataset.tab));
});

el("btnExplore")?.addEventListener("click", () => switchTab("explore"));
el("btnGoExplore")?.addEventListener("click", () => switchTab("explore"));

/* ─────────────────────────────────────────
   CAREER IDENTITY — STEPS
───────────────────────────────────────── */
const STEP_ROLES = [
  "Software Engineer", "Data Scientist", "UX Designer", "Product Manager",
  "Teacher", "Nurse", "Marketing Manager", "Financial Analyst", "Army Infantry",
  "Project Manager", "Graphic Designer", "Business Analyst",
];
const PH_ROLES = [
  "Software Engineer", "Healthcare Innovator", "AI Researcher", "UX Designer",
  "Product Manager", "Data Scientist", "Educator", "Financial Analyst",
  "Climate Scientist", "Robotics Engineer", "Social Entrepreneur",
];
const TASKS_BY_ROLE = {
  default: [
    "Collaborate with cross-functional teams", "Manage projects and timelines",
    "Analyze data and produce reports", "Communicate with stakeholders",
    "Mentor or train junior colleagues", "Design or build solutions",
    "Research and stay up to date", "Lead meetings and drive decisions",
  ],
};
const MOTIVATIONS = [
  "Career switch", "Level up in current role", "Build a portfolio",
  "Explore before committing", "Prepare for interviews", "Find a first job",
];
const SKILLS_POOL = [
  "Python", "JavaScript", "System Design", "Debugging", "SQL",
  "Data Visualization", "UI/UX", "Testing & QA", "Cloud Architecture",
  "Problem Solving", "Collaboration", "Research", "Communication",
  "Leadership", "Excel / Sheets", "Machine Learning",
];
const EDU_LEVELS = [
  "High school", "Some college", "Bachelor's degree",
  "Master's degree", "Doctorate", "Bootcamp / Self-taught",
];

const STEPS = [
  { key: "role",       title: "What's your current or most recent role?",   instr: "This anchors every suggestion. Military occupations welcome — we'll help translate your MOS/AFSC.", min: 1 },
  { key: "tasks",      title: "What did you do in that role?",               instr: "Select all tasks that apply. These become evidence in your audit trail.",                              min: 1 },
  { key: "skills",     title: "What can you already do?",                   instr: "Choose at least 3 skills you practice today.",                                                          min: 3 },
  { key: "education",  title: "Educational background",                     instr: "Level + major/field — validates prerequisites." },
  { key: "motivations",title: "Why does this matter now?",                  instr: "Select up to 2 motivations — keeps the path honest.",                                                    max: 2 },
  { key: "identity",   title: "Your synthesized career identity",           instr: "Review your statement — this feeds Profile, Path and Audit." },
];

function renderStep(idx) {
  currentStep = idx;
  const cfg = STEPS[idx];

  // Dots
  const dots = el("progressDots"); dots.innerHTML = "";
  for (let i = 0; i < STEPS.length; i++) {
    const d = document.createElement("div");
    d.className = `dot ${i === idx ? "active" : i < idx ? "done" : ""}`;
    d.setAttribute("role", "listitem");
    dots.appendChild(d);
  }
  // Top progress bar gradient
  const pct = Math.round(((idx + 1) / STEPS.length) * 100);
  const top = el("stageTop");
  if (top) top.style.background = `linear-gradient(90deg,#1b6ef3 0%,#2bd773 ${pct}%)`;

  el("stepLabel").textContent = `Step ${idx + 1} of ${STEPS.length} · ${cfg.key.toUpperCase()}`;
  el("stageTitle").textContent = cfg.title;
  el("stageInstr").textContent = cfg.instr;
  el("stageError").textContent = "";
  el("btnBack").style.visibility = idx === 0 ? "hidden" : "visible";
  el("btnNext").textContent = idx === STEPS.length - 1 ? "Build my map →" : "Next →";
  el("btnNext").disabled = false;

  // Clear placeholder timer
  if (phTimer) { clearInterval(phTimer); phTimer = null; }

  const body = el("stageBody");

  if (idx === 0) {
    // ROLE
    body.innerHTML = `
      <input id="roleInput" value="${escHtml(state.role)}" placeholder="${PH_ROLES[0]}" autocomplete="off">
      <div class="mos-hint">🪖 Military? Enter your MOS (e.g. 11B, 25U, 68W) or AFSC — we'll map it to civilian equivalents.</div>
      <div class="role-suggestions" id="roleSuggestions"></div>`;
    renderRoleSuggestions(state.role);
    el("roleInput").addEventListener("input", e => {
      state.role = e.target.value.trim(); save();
      renderRoleSuggestions(state.role); updatePillarGrowth(); validate();
    });
    // placeholder cycle
    phIdx = 0;
    phTimer = setInterval(() => {
      const inp = el("roleInput");
      if (inp && !inp.value) { phIdx = (phIdx + 1) % PH_ROLES.length; inp.placeholder = PH_ROLES[phIdx]; }
    }, 2800);

  } else if (idx === 1) {
    // TASKS
    const tasks = TASKS_BY_ROLE.default;
    const selAll = tasks.every(t => state.tasks.includes(t));
    body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <span class="hint">Select all that apply</span>
        <button class="select-all-btn" id="btnSelectAll">${selAll ? "Deselect all" : "Select all"}</button>
      </div>
      <div style="display:grid;gap:8px" id="tasksGrid">
        ${tasks.map(t => `
          <button class="task-pill ${state.tasks.includes(t) ? "selected" : ""}" data-v="${escAttr(t)}">
            <span class="task-checkbox"></span><span>${escHtml(t)}</span>
          </button>`).join("")}
      </div>`;
    body.querySelectorAll(".task-pill").forEach(b => b.addEventListener("click", () => {
      const v = b.dataset.v;
      if (state.tasks.includes(v)) { state.tasks = state.tasks.filter(x => x !== v); b.classList.remove("selected"); }
      else { state.tasks.push(v); b.classList.add("selected"); }
      save(); updatePillarStrengths(); validate();
    }));
    el("btnSelectAll")?.addEventListener("click", () => {
      const all = tasks.every(t => state.tasks.includes(t));
      state.tasks = all ? [] : [...tasks]; save(); renderStep(1);
    });

  } else if (idx === 2) {
    // SKILLS
    body.innerHTML = `
      <div class="chips-wrap" id="skillChips">
        ${SKILLS_POOL.map(s => `<button class="skill-chip ${state.skills.includes(s) ? "active" : ""}" data-v="${escAttr(s)}">${escHtml(s)}</button>`).join("")}
      </div>
      <div style="margin-top:12px;display:flex;gap:8px;align-items:center">
        <input id="skillInput" placeholder="Add a skill + Enter" style="flex:1">
        <span class="hint">${state.skills.length} selected</span>
      </div>
      <div class="hint" style="margin-top:6px">Need ≥3 to continue</div>`;
    body.querySelectorAll(".skill-chip").forEach(b => b.addEventListener("click", () => {
      const v = b.dataset.v;
      if (state.skills.includes(v)) { state.skills = state.skills.filter(x => x !== v); b.classList.remove("active"); }
      else { state.skills.push(v); b.classList.add("active"); }
      save(); updatePillarStrengths(); validate();
    }));
    el("skillInput")?.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        const v = e.target.value.trim();
        if (v && !state.skills.includes(v)) { state.skills.push(v); save(); renderStep(2); }
        else e.target.value = "";
      }
    });

  } else if (idx === 3) {
    // EDUCATION
    body.innerHTML = `
      <div style="display:grid;gap:14px">
        <label style="font-size:13px;font-weight:600;color:var(--g-dark)">Level
          <select id="eduLevel" style="display:block;width:100%;margin-top:6px">
            ${EDU_LEVELS.map(l => `<option ${state.education === l ? "selected" : ""}>${escHtml(l)}</option>`).join("")}
          </select>
        </label>
        <label style="font-size:13px;font-weight:600;color:var(--g-dark)">Major / field
          <input id="eduMajor" value="${escHtml(state.major)}" placeholder="e.g. Computer Science" style="display:block;width:100%;margin-top:6px">
        </label>
        <label style="font-size:13px;font-weight:600;color:var(--g-dark)">Organization / company <span style="font-weight:400;color:var(--g-muted)">(optional)</span>
          <input id="orgInput" value="${escHtml(state.org)}" placeholder="e.g. Google, US Army, Freelance" style="display:block;width:100%;margin-top:6px">
        </label>
      </div>`;

  } else if (idx === 4) {
    // MOTIVATIONS
    body.innerHTML = `
      <div class="chips-wrap">
        ${MOTIVATIONS.map(m => `<button class="skill-chip ${state.motivations.includes(m) ? "active" : ""}" data-v="${escAttr(m)}">${escHtml(m)}</button>`).join("")}
      </div>
      <div class="hint" style="margin-top:10px">Up to 2</div>`;
    body.querySelectorAll(".skill-chip").forEach(b => b.addEventListener("click", () => {
      const v = b.dataset.v;
      if (b.classList.contains("active")) {
        b.classList.remove("active"); state.motivations = state.motivations.filter(x => x !== v);
      } else {
        if (state.motivations.length >= 2) { el("stageError").textContent = "Up to 2 motivations."; return; }
        b.classList.add("active"); state.motivations.push(v);
      }
      save(); updatePillarPassions(); validate();
    }));

  } else if (idx === 5) {
    // IDENTITY statement
    const stmt = buildIdentityStatement();
    body.innerHTML = `
      <div style="background:#f8fafd;border:1px solid #dadce0;border-radius:14px;padding:18px 20px;line-height:1.7;font-size:14px;color:#202124;">
        ${escHtml(stmt)}
      </div>
      <div class="hint" style="margin-top:10px">This feeds Profile, Path, Why and Mastery. You can still edit by going back.</div>`;
    updateIdentityStatement(stmt);
    el("identityCardActions").style.display = "flex";
  }

  validate();
}

function renderRoleSuggestions(q) {
  const wrap = el("roleSuggestions"); if (!wrap) return;
  const matches = q.length < 1
    ? STEP_ROLES.slice(0, 6)
    : STEP_ROLES.filter(r => r.toLowerCase().includes(q.toLowerCase())).slice(0, 6);
  wrap.innerHTML = matches.map(r =>
    `<button class="role-suggestion-chip" data-v="${escAttr(r)}">${escHtml(r)}</button>`
  ).join("");
  wrap.querySelectorAll(".role-suggestion-chip").forEach(b => b.addEventListener("click", () => {
    state.role = b.dataset.v; save();
    const inp = el("roleInput"); if (inp) inp.value = state.role;
    renderRoleSuggestions(state.role); updatePillarGrowth(); validate();
  }));
}

function buildIdentityStatement() {
  const roleStr = state.role || "an emerging professional";
  const skillsStr = state.skills.slice(0, 4).join(", ") || "building things";
  const motiveStr = state.motivations.join(" and ") || "growth";
  const eduStr = `${state.education}${state.major ? " in " + state.major : ""}`;
  return `A ${eduStr} professional coming from ${roleStr}${state.org ? " at " + state.org : ""}, skilled in ${skillsStr}, motivated by ${motiveStr}.${state.experiences ? " " + state.experiences.slice(0, 120) : ""}`;
}

/* Pillar updaters */
function updatePillarGrowth() {
  const v = el("pillar-growth-val");
  if (!v) return;
  const text = state.role || "—";
  v.textContent = text;
  el("pillar-growth")?.classList.toggle("has-value", !!state.role);
}
function updatePillarStrengths() {
  const v = el("pillar-strengths-val");
  if (!v) return;
  const text = state.skills.slice(0, 3).join(", ") || "—";
  v.textContent = text;
  el("pillar-strengths")?.classList.toggle("has-value", state.skills.length > 0);
}
function updatePillarPassions() {
  const v = el("pillar-passions-val");
  if (!v) return;
  const text = state.motivations.join(", ") || "—";
  v.textContent = text;
  el("pillar-passions")?.classList.toggle("has-value", state.motivations.length > 0);
}
function updateIdentityStatement(stmt) {
  const el2 = el("identityStmtText");
  if (!el2) return;
  el2.textContent = stmt || "Complete the steps to generate your AI career identity statement.";
  el2.classList.toggle("has-content", !!stmt);
}

/* Validate */
function validate() {
  const cfg = STEPS[currentStep];
  let ok = true, msg = "";
  if (cfg.key === "role" && !state.role) { ok = false; msg = "Enter your current or most recent role."; }
  if (cfg.key === "tasks" && state.tasks.length < 1) { ok = false; msg = "Select at least 1 task."; }
  if (cfg.key === "skills" && state.skills.length < 3) { ok = false; msg = `Need ≥3 skills — you have ${state.skills.length}.`; }
  if (cfg.key === "motivations" && state.motivations.length < 1) { ok = false; msg = "Pick at least 1 motivation."; }
  el("btnNext").disabled = !ok;
  el("btnNext").style.opacity = ok ? "1" : ".5";
  el("stageError").textContent = ok ? "" : msg;
}

document.addEventListener("input", validate);

/* Next / Back */
async function handleNext() {
  const cfg = STEPS[currentStep];
  // Persist fields
  if (cfg.key === "role") { state.role = el("roleInput")?.value.trim() || state.role; }
  if (cfg.key === "education") {
    state.education = el("eduLevel")?.value || state.education;
    state.major = el("eduMajor")?.value.trim() || state.major;
    state.org = el("orgInput")?.value.trim() || state.org;
  }
  save();

  // Sync text to Converse session
  let text = null;
  if (cfg.key === "role") text = `My current/most recent role: ${state.role}${state.org ? " at " + state.org : ""}.`;
  else if (cfg.key === "tasks") text = `Tasks I've performed: ${state.tasks.join(", ")}.`;
  else if (cfg.key === "skills") text = `Skills I have: ${state.skills.join(", ")}.`;
  else if (cfg.key === "education") text = `Education: ${state.education}${state.major ? " in " + state.major : ""}. I can study 8 hours per week.`;
  else if (cfg.key === "motivations") text = `Motivations: ${state.motivations.join(", ")}.`;

  if (text) {
    el("btnNext").textContent = "Syncing…"; el("btnNext").disabled = true;
    await inheritedSend(text);
    el("btnNext").disabled = false;
  }

  if (currentStep < STEPS.length - 1) {
    renderStep(currentStep + 1);
  } else {
    // Complete — generate constellation, show explore
    buildConstellationNodes();
    switchTab("explore");
    updatePinnedBadge();
  }
}

function handleBack() { if (currentStep > 0) renderStep(currentStep - 1); }

el("btnNext")?.addEventListener("click", handleNext);
el("btnBack")?.addEventListener("click", handleBack);

/* Audit mini */
function renderAuditMini() {
  const list = el("auditMiniList"); if (!list) return;
  const items = [];
  if (state.role) items.push({ f: "Role", v: state.role });
  if (state.skills.length) items.push({ f: "Skills", v: state.skills.slice(0, 4).join(", ") });
  if (state.motivations.length) items.push({ f: "Motivations", v: state.motivations.join(", ") });
  if (state.education) items.push({ f: "Education", v: state.education + (state.major ? " · " + state.major : "") });
  if (!items.length) { list.innerHTML = `<p class="audit-mini-empty">Inferences appear as you answer.</p>`; return; }
  list.innerHTML = items.map(i => `
    <div class="audit-row">
      <span class="audit-factor">${escHtml(i.f)}</span>
      <span class="audit-val">${escHtml(i.v)}</span>
    </div>`).join("");
}

/* ─────────────────────────────────────────
   CONSTELLATION
───────────────────────────────────────── */
const CAREER_NODES = [
  { id:"swe",   label:"Software Engineer",      type:"blue",  salary:"$115k–$165k", why:"Your technical skills and experience match this well." },
  { id:"ds",    label:"Data Scientist",          type:"green", salary:"$105k–$150k", why:"Your analytical background is a strong match." },
  { id:"pm",    label:"Product Manager",         type:"blue",  salary:"$110k–$155k", why:"Your collaboration and leadership experience." },
  { id:"ml",    label:"ML Engineer",             type:"green", salary:"$120k–$175k", why:"Your Python and math skills map here." },
  { id:"ux",    label:"UX Designer",             type:"blue",  salary:"$85k–$125k",  why:"Your research and communication skills." },
  { id:"da",    label:"Data Analyst",            type:"blue",  salary:"$70k–$105k",  why:"SQL and visualization are core requirements." },
  { id:"devops",label:"DevOps / SRE",            type:"blue",  salary:"$115k–$155k", why:"System design and cloud skills match." },
  { id:"cyber", label:"Cybersecurity Analyst",   type:"green", salary:"$95k–$135k",  why:"Problem-solving and technical depth." },
  { id:"gd",    label:"Graphic Designer",        type:"blue",  salary:"$55k–$85k",   why:"Your creative interests." },
  { id:"mktg",  label:"Marketing Analyst",       type:"green", salary:"$65k–$95k",   why:"Communication and data skills." },
  { id:"ba",    label:"Business Analyst",        type:"blue",  salary:"$80k–$115k",  why:"Stakeholder and analytical skills." },
  { id:"teach", label:"Curriculum Designer",     type:"green", salary:"$60k–$85k",   why:"Teaching and research motivations." },
  { id:"re",    label:"Research Scientist",      type:"green", salary:"$100k–$145k", why:"Your education and research experience." },
  { id:"cons",  label:"IT Consultant",           type:"blue",  salary:"$90k–$130k",  why:"Cross-functional collaboration." },
  { id:"cloud", label:"Cloud Architect",         type:"blue",  salary:"$130k–$180k", why:"Cloud architecture skills." },
  { id:"ai",    label:"AI Product Manager",      type:"green", salary:"$125k–$165k", why:"Intersection of AI interest and PM skills." },
  { id:"pe",    label:"Platform Engineer",       type:"blue",  salary:"$115k–$155k", why:"Backend and system design skills." },
  { id:"te",    label:"Technical Writer",        type:"green", salary:"$75k–$105k",  why:"Communication and technical knowledge." },
  { id:"fin",   label:"Financial Analyst",       type:"blue",  salary:"$80k–$115k",  why:"Analytical and Excel skills." },
  { id:"ops",   label:"Operations Manager",      type:"blue",  salary:"$75k–$110k",  why:"Leadership and project management." },
  { id:"qa",    label:"QA / Test Engineer",      type:"blue",  salary:"$80k–$110k",  why:"Testing & QA skills directly match." },
  { id:"bi",    label:"BI Developer",            type:"green", salary:"$90k–$125k",  why:"SQL and data visualization focus." },
  { id:"sc",    label:"Scrum Master",            type:"blue",  salary:"$90k–$120k",  why:"Agile collaboration skills." },
  { id:"sol",   label:"Solutions Architect",     type:"green", salary:"$130k–$175k", why:"System design and cloud expertise." },
];

const CERTS = {
  swe:    [{ name:"Google IT Automation with Python", provider:"Coursera / Google", link:"https://grow.google/certificates/it-automation-with-python/", icon:"🐍" }],
  ds:     [{ name:"Google Data Analytics", provider:"Coursera / Google", link:"https://grow.google/certificates/data-analytics/", icon:"📊" }],
  ux:     [{ name:"Google UX Design", provider:"Coursera / Google", link:"https://grow.google/certificates/ux-design/", icon:"🎨" }],
  pm:     [{ name:"Google Project Management", provider:"Coursera / Google", link:"https://grow.google/certificates/project-management/", icon:"📋" }],
  cyber:  [{ name:"Google Cybersecurity", provider:"Coursera / Google", link:"https://grow.google/certificates/cybersecurity/", icon:"🔒" }],
  da:     [{ name:"Google Data Analytics", provider:"Coursera / Google", link:"https://grow.google/certificates/data-analytics/", icon:"📊" }],
  bi:     [{ name:"Google Business Intelligence", provider:"Coursera / Google", link:"https://grow.google/certificates/business-intelligence/", icon:"💡" }],
  ops:    [{ name:"Google Project Management", provider:"Coursera / Google", link:"https://grow.google/certificates/project-management/", icon:"📋" }],
  default:[{ name:"Google Career Certificate", provider:"Coursera / Google", link:"https://grow.google/intl/certificates/", icon:"🎓" }],
};

const DAY_IN_LIFE = {
  swe:    [["09:00","Stand-up & code review"],["10:00","Feature development"],["12:00","Lunch / async communication"],["13:00","Debugging & testing"],["16:00","Design discussion with PM"],["17:00","Documentation"]],
  ds:     [["09:00","Data pull & cleaning"],["10:00","EDA / notebook analysis"],["12:00","Lunch"],["13:00","Model iteration"],["15:00","Stakeholder presentation"],["17:00","Write-up & handoff"]],
  pm:     [["08:30","Email triage & slack"],["09:30","Sprint planning"],["11:00","Customer calls"],["13:00","Lunch"],["14:00","Roadmap update"],["16:00","Cross-team sync"],["17:00","OKR review"]],
  default:[["09:00","Morning planning"],["10:00","Core work session"],["12:00","Lunch"],["13:00","Meetings & collaboration"],["15:00","Deep work"],["17:00","Wrap-up & planning"]],
};

function buildConstellationNodes() {
  const W = el("constellationCanvas")?.offsetWidth || 800;
  const H = el("constellationCanvas")?.offsetHeight || 500;
  const cx = W / 2, cy = H / 2;
  const count = CAREER_NODES.length;
  constellationNodes = CAREER_NODES.map((n, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const radius = 140 + (i % 3) * 60 + Math.random() * 40;
    return {
      ...n,
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      r: n.type === "blue" ? 7 : 6,
      glow: 0,
      angle,
      radius,
      pinned: state.pinned.includes(n.id),
    };
  });
}

function initConstellation() {
  const canvas = el("constellationCanvas");
  if (!canvas) return;
  const stage = el("constellationStage");
  canvas.width = stage.offsetWidth;
  canvas.height = stage.offsetHeight;
  buildConstellationNodes();
  if (animRaf) cancelAnimationFrame(animRaf);
  drawConstellation();

  canvas.addEventListener("mousemove", onConstellationMove);
  canvas.addEventListener("mouseleave", onConstellationLeave);
  canvas.addEventListener("click", onConstellationClick);

  // Hub label
  const hubLabel = el("hubLabel");
  if (hubLabel) {
    const role = state.role || "your interests";
    hubLabel.textContent = `Paths based on ${role.length > 18 ? role.slice(0, 18) + "…" : role}`;
  }
  const hubPills = el("hubPills");
  if (hubPills) hubPills.textContent = (state.skills.slice(0, 2).join(" · ")) || "🌱 💪";
}

function drawConstellation() {
  const canvas = el("constellationCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = "#0b0e14"; ctx.fillRect(0, 0, W, H);

  // Stars (tiny)
  const t = Date.now() * 0.0003;
  for (let i = 0; i < 80; i++) {
    const sx = ((i * 137.5 + 13) % W);
    const sy = ((i * 97.3 + 7) % H);
    const alpha = 0.15 + 0.1 * Math.sin(t + i);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath(); ctx.arc(sx, sy, .8, 0, Math.PI * 2); ctx.fill();
  }

  // Edges to hub
  const cx = W / 2, cy = H / 2;
  constellationNodes.forEach(n => {
    const alpha = hoveredNode?.id === n.id ? 0.35 : 0.08;
    ctx.strokeStyle = n.type === "blue"
      ? `rgba(27,110,243,${alpha})` : `rgba(43,215,115,${alpha})`;
    ctx.lineWidth = hoveredNode?.id === n.id ? 1.2 : .7;
    ctx.setLineDash([4, 6]);
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(n.x, n.y); ctx.stroke();
    ctx.setLineDash([]);
  });

  // Nodes
  constellationNodes.forEach(n => {
    const isHovered = hoveredNode?.id === n.id;
    const isPinned = state.pinned.includes(n.id);
    const r = n.r + (isHovered ? 4 : 0);

    // Glow
    if (isHovered) {
      const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 4);
      grd.addColorStop(0, n.type === "blue" ? "rgba(27,110,243,.35)" : "rgba(43,215,115,.35)");
      grd.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(n.x, n.y, r * 4, 0, Math.PI * 2); ctx.fill();
    }

    // Circle
    const color = n.type === "blue" ? "#1b6ef3" : "#2bd773";
    ctx.fillStyle = isHovered ? "#fff" : color;
    ctx.strokeStyle = color;
    ctx.lineWidth = isPinned ? 2.5 : 1.5;
    ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // Pin marker
    if (isPinned) {
      ctx.fillStyle = "#FFB800"; ctx.font = "10px sans-serif";
      ctx.textAlign = "center"; ctx.fillText("📌", n.x, n.y - r - 4);
    }

    // Label
    ctx.fillStyle = isHovered ? "#fff" : "rgba(255,255,255,.65)";
    ctx.font = `${isHovered ? "600" : "500"} 11px Inter,sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(n.label, n.x, n.y + r + 14);
  });

  animRaf = requestAnimationFrame(drawConstellation);
}

function nodeAtPoint(x, y) {
  return constellationNodes.find(n => Math.hypot(n.x - x, n.y - y) < (n.r + 10));
}

function onConstellationMove(e) {
  const canvas = el("constellationCanvas");
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
  const my = (e.clientY - rect.top) * (canvas.height / rect.height);
  const hit = nodeAtPoint(mx, my);
  canvas.style.cursor = hit ? "pointer" : "default";
  if (hit) { hoveredNode = hit; showNodeCard(hit, e.clientX, e.clientY); }
  else { hoveredNode = null; hideNodeCard(); }
}

function onConstellationLeave() {
  hoveredNode = null; hideNodeCard();
  el("constellationCanvas").style.cursor = "default";
}

function onConstellationClick(e) {
  const canvas = el("constellationCanvas");
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
  const my = (e.clientY - rect.top) * (canvas.height / rect.height);
  const hit = nodeAtPoint(mx, my);
  if (hit) showNodeCard(hit, e.clientX, e.clientY);
}

function showNodeCard(node, cx, cy) {
  const card = el("nodeCard");
  card.removeAttribute("hidden");

  el("nodeCardDot").className = `node-card-dot ${node.type}`;
  el("nodeCardTitle").textContent = node.label;
  el("nodeCardSalary").textContent = `$ Avg. Salary: ${node.salary}`;
  el("nodeCardWhy").textContent = node.why;
  el("nodeCardPin").textContent = state.pinned.includes(node.id) ? "📌 Pinned" : "📌";

  // Position card
  const stage = el("constellationStage").getBoundingClientRect();
  let left = cx - stage.left + 12;
  let top = cy - stage.top - 20;
  if (left + 250 > stage.width) left = cx - stage.left - 262;
  if (top + 180 > stage.height) top = cy - stage.top - 200;
  card.style.left = `${Math.max(8, left)}px`;
  card.style.top  = `${Math.max(8, top)}px`;

  // Bind actions
  el("nodeCardPin").onclick = () => { togglePin(node.id); showNodeCard(node, cx, cy); };
  el("nodeCardDeep").onclick = () => openDeepDive(node);
  el("nodeCardPath").onclick = () => setTarget(node);
}

function hideNodeCard() {
  const card = el("nodeCard");
  // Only hide if mouse not over it
  setTimeout(() => {
    if (!hoveredNode) card.setAttribute("hidden", "");
  }, 120);
}

/* ─────────────────────────────────────────
   PIN / UNPIN
───────────────────────────────────────── */
function togglePin(nodeId) {
  if (state.pinned.includes(nodeId)) state.pinned = state.pinned.filter(x => x !== nodeId);
  else state.pinned.push(nodeId);
  save();
  updatePinnedBadge();
  renderExplorePinned();
}

function updatePinnedBadge() {
  const badge = el("pinnedBadge");
  if (!badge) return;
  if (state.pinned.length > 0) {
    badge.textContent = state.pinned.length;
    badge.removeAttribute("hidden");
    el("exploreBadge")?.removeAttribute("hidden");
    if (el("exploreBadge")) el("exploreBadge").textContent = constellationNodes.length || CAREER_NODES.length;
  } else {
    badge.setAttribute("hidden", "");
  }
}

function renderExplorePinned() {
  const list = el("explorePinnedList"); if (!list) return;
  if (!state.pinned.length) {
    list.innerHTML = `<p class="explore-aside-empty">Pin roles from the constellation to compare them here.</p>`;
    return;
  }
  list.innerHTML = state.pinned.map(id => {
    const n = CAREER_NODES.find(c => c.id === id);
    if (!n) return "";
    return `<div class="pinned-chip" data-id="${id}">
      <span class="legend-dot ${n.type}"></span>
      <span class="pinned-chip-label">${escHtml(n.label)}</span>
      <button class="pinned-chip-remove" data-id="${id}" title="Unpin">✕</button>
    </div>`;
  }).join("");
  list.querySelectorAll(".pinned-chip-remove").forEach(b => b.addEventListener("click", e => {
    e.stopPropagation(); togglePin(b.dataset.id);
  }));
  list.querySelectorAll(".pinned-chip[data-id]").forEach(b => b.addEventListener("click", e => {
    if (e.target.classList.contains("pinned-chip-remove")) return;
    const n = CAREER_NODES.find(c => c.id === b.dataset.id);
    if (n) showExploreDetail(n);
  }));
}

function showExploreDetail(node) {
  const card = el("exploreDetailCard"); if (!card) return;
  card.style.display = "block";
  el("exploreDetailHead").textContent = node.label;
  el("exploreDetailBody").innerHTML = `
    <p class="pinned-role-salary">${node.salary}</p>
    <p style="font-size:13px;color:var(--g-muted);margin:8px 0">${node.why}</p>
    <button class="btn primary" style="width:100%;margin-top:8px" onclick="window._dreamerOpenDeepDive && window._dreamerOpenDeepDive('${node.id}')">Deep dive →</button>`;
}

/* ─────────────────────────────────────────
   DEEP DIVE MODAL
───────────────────────────────────────── */
function openDeepDive(node) {
  activeModalRole = node;
  modalSlide = 0;
  el("modalRoleTitle").textContent = node.label;
  el("modalSalary").textContent = `$ Avg. Salary: ${node.salary}`;
  el("modalPinBtn").textContent = state.pinned.includes(node.id) ? "📌 Pinned" : "📌 Pin";
  el("deepDiveOverlay").removeAttribute("hidden");
  document.body.style.overflow = "hidden";
  renderModalSlide(0);
  updateModalNav(0);
}

window._dreamerOpenDeepDive = (id) => {
  const n = CAREER_NODES.find(c => c.id === id);
  if (n) openDeepDive(n);
};

function closeDeepDive() {
  el("deepDiveOverlay").setAttribute("hidden", "");
  document.body.style.overflow = "";
  activeModalRole = null;
}

el("modalClose")?.addEventListener("click", closeDeepDive);
el("deepDiveOverlay")?.addEventListener("click", e => { if (e.target === el("deepDiveOverlay")) closeDeepDive(); });

el("modalPinBtn")?.addEventListener("click", () => {
  if (!activeModalRole) return;
  togglePin(activeModalRole.id);
  el("modalPinBtn").textContent = state.pinned.includes(activeModalRole.id) ? "📌 Pinned" : "📌 Pin";
});

el("modalSetTarget")?.addEventListener("click", () => {
  if (!activeModalRole) return;
  setTarget(activeModalRole);
  closeDeepDive();
});

el("modalNext")?.addEventListener("click", () => {
  if (modalSlide < 4) { modalSlide++; renderModalSlide(modalSlide); updateModalNav(modalSlide); }
});
el("modalPrev")?.addEventListener("click", () => {
  if (modalSlide > 0) { modalSlide--; renderModalSlide(modalSlide); updateModalNav(modalSlide); }
});

document.querySelectorAll(".mstab").forEach(b => b.addEventListener("click", () => {
  const s = parseInt(b.dataset.slide, 10);
  modalSlide = s; renderModalSlide(s); updateModalNav(s);
}));

function updateModalNav(s) {
  document.querySelectorAll(".mstab").forEach((b, i) => b.classList.toggle("active", i === s));
  el("modalSlideCounter").textContent = `${s + 1} / 5`;
  el("modalPrev").disabled = s === 0;
  el("modalNext").disabled = s === 4;
}

function renderModalSlide(s) {
  const node = activeModalRole; if (!node) return;
  const body = el("modalBody");

  if (s === 0) {
    // Overview
    body.innerHTML = `
      <div class="modal-slide-section">
        <h3>About this role</h3>
        <p>${node.why} ${node.label} professionals work at the intersection of technology and business, solving complex problems and driving value.</p>
      </div>
      <div class="modal-slide-section">
        <h3>Key requirements</h3>
        <span class="modal-badge blue">Bachelor's preferred</span>
        <span class="modal-badge green">High demand</span>
        <span class="modal-badge orange">Remote-friendly</span>
      </div>
      <div class="modal-slide-section">
        <h3>Salary range</h3>
        <p style="font-family:'JetBrains Mono',monospace;font-size:20px;font-weight:700;color:#1b6ef3;margin:0">${node.salary}</p>
        <p style="font-size:12px;color:var(--g-muted);margin:4px 0 0">Varies by location, experience, and company size.</p>
      </div>
      <a href="https://www.google.com/search?q=${encodeURIComponent(node.label + ' jobs')}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;color:#1b6ef3;font-size:13px;font-weight:600;text-decoration:none">Find jobs near you ↗</a>`;

  } else if (s === 1) {
    // Sweet spots
    const matchedSkills = state.skills.filter(sk => {
      const rel = ["Python","JavaScript","SQL","Data Visualization","System Design","UI/UX","Testing & QA","Cloud Architecture","Machine Learning"];
      return rel.some(r => sk.includes(r.split(" ")[0]));
    });
    body.innerHTML = `
      <div class="modal-slide-section">
        <h3>💪 Your sweet spots</h3>
        <p>Skills from your profile that directly apply to this role:</p>
        <div class="chips-wrap">
          ${(matchedSkills.length ? matchedSkills : state.skills.slice(0, 5)).map(s =>
            `<span class="skill-chip active" style="cursor:default">${escHtml(s)}</span>`).join("")}
          ${!state.skills.length ? `<span class="hint">Complete Career Identity to see your matches.</span>` : ""}
        </div>
      </div>
      <div class="modal-slide-section">
        <h3>Skills commonly required</h3>
        <div class="chips-wrap">
          ${["Communication","Problem Solving","Collaboration","Technical writing","Data analysis","Project management"]
            .map(s => `<span class="skill-chip" style="cursor:default">${s}</span>`).join("")}
        </div>
      </div>`;

  } else if (s === 2) {
    // Day in the life
    const day = DAY_IN_LIFE[node.id] || DAY_IN_LIFE.default;
    body.innerHTML = `
      <div class="modal-slide-section">
        <h3>📋 A day in the life</h3>
        ${day.map(([time, task]) => `
          <div class="day-item">
            <span class="day-time">${time}</span>
            <span class="day-task">${escHtml(task)}</span>
          </div>`).join("")}
      </div>`;

  } else if (s === 3) {
    // Growth areas
    body.innerHTML = `
      <div class="modal-slide-section">
        <h3>⬆️ Areas for growth</h3>
        <p>Based on your profile, these are the gaps most worth closing for <strong>${escHtml(node.label)}</strong>:</p>
        ${["System design depth","Cloud platform certifications","Domain-specific knowledge","Portfolio / personal projects","Professional network"]
          .map(g => `<div style="padding:10px 0;border-bottom:1px solid #dadce0;font-size:13px;color:#202124">📍 ${g}</div>`).join("")}
      </div>
      <div class="modal-slide-section" style="margin-top:16px">
        <h3>Pathlight can help</h3>
        <p>Your learning roadmap already accounts for these gaps. Set this as your target to generate a week-by-week plan.</p>
      </div>`;

  } else if (s === 4) {
    // Certificates
    const certs = CERTS[node.id] || CERTS.default;
    body.innerHTML = `
      <div class="modal-slide-section">
        <h3>🎓 Google Career Certificates</h3>
        <p>Credentials from Google and Coursera that align with this role:</p>
        ${certs.map(c => `
          <div class="cert-card">
            <div class="cert-logo"><span>${c.icon}</span></div>
            <div>
              <p class="cert-name">${escHtml(c.name)}</p>
              <p class="cert-meta">${escHtml(c.provider)}</p>
            </div>
            <a class="cert-link" href="${c.link}" target="_blank" rel="noopener">Enroll ↗</a>
          </div>`).join("")}
        <div class="cert-card">
          <div class="cert-logo"><span>🌐</span></div>
          <div>
            <p class="cert-name">Browse all Google Certificates</p>
            <p class="cert-meta">grow.google / Coursera</p>
          </div>
          <a class="cert-link" href="https://grow.google/intl/certificates/" target="_blank" rel="noopener">View all ↗</a>
        </div>
      </div>`;
  }
}

/* ─────────────────────────────────────────
   SET AS TARGET
───────────────────────────────────────── */
function setTarget(node) {
  state.currentTarget = node.id; save();
  const text = `My target career: ${node.label}. Please update my learning path to focus on this.`;
  inheritedSend(text);
  if (typeof window.botMsg === "function")
    window.botMsg(`Target set: <strong>${escHtml(node.label)}</strong>. Your learning path will now focus on this career. Go to Profile or Path to see the full roadmap.`);
  switchTab("chat");
}

/* ─────────────────────────────────────────
   TAKE ACTION PANEL
───────────────────────────────────────── */
const ACTION_CARDS = [
  { icon:"📝", tag:"Resume", title:"Tailor my resume", desc:"Get a rewritten resume summary optimized for your target role.", prompt: () => `Write a compelling 3-sentence resume summary for someone transitioning to ${state.currentTarget ? CAREER_NODES.find(n=>n.id===state.currentTarget)?.label : "a tech role"}, with background as ${state.role||"a professional"} skilled in ${state.skills.slice(0,4).join(", ")||"various skills"}. Make it ATS-friendly and achievement-focused.` },
  { icon:"🎤", tag:"Interview", title:"Interview prep", desc:"Generate 5 STAR-format answers for common behavioral questions.", prompt: () => `Generate 5 STAR-format interview answers for a ${state.currentTarget ? CAREER_NODES.find(n=>n.id===state.currentTarget)?.label : "tech"} role. Background: ${state.role||"professional"}, skills: ${state.skills.slice(0,5).join(", ")||"various"}. Focus on ${state.motivations[0]||"career growth"}.` },
  { icon:"🗺️", tag:"Plan", title:"30-60-90 day plan", desc:"Build a concrete transition plan from where you are to where you want to be.", prompt: () => `Create a 30-60-90 day career transition plan for going from ${state.role||"current role"} to ${state.currentTarget ? CAREER_NODES.find(n=>n.id===state.currentTarget)?.label : "target role"}. Make it specific, weekly-level actions. Skills I have: ${state.skills.slice(0,5).join(", ")||"various"}.` },
  { icon:"💌", tag:"Networking", title:"Cold outreach message", desc:"Write a LinkedIn message to someone already in your target role.", prompt: () => `Write a warm, non-generic LinkedIn outreach message to a ${state.currentTarget ? CAREER_NODES.find(n=>n.id===state.currentTarget)?.label : "professional"} from someone coming from ${state.role||"a different background"}. Keep it under 150 words, specific, and with one clear ask.` },
  { icon:"🏅", tag:"Skills", title:"Skill gap analysis", desc:"Identify the 5 most critical skills to learn next for your target.", prompt: () => `Given my profile — role: ${state.role||"professional"}, skills: ${state.skills.join(", ")||"various"}, education: ${state.education} — what are the 5 most critical skills I should learn to become a ${state.currentTarget ? CAREER_NODES.find(n=>n.id===state.currentTarget)?.label : "tech professional"}? For each: name, why it matters, best free resource to learn it.` },
  { icon:"🧭", tag:"Clarity", title:"Career pivot story", desc:"Craft a compelling narrative about your career change.", prompt: () => `Help me craft a 2-paragraph career pivot narrative for going from ${state.role||"my current role"} to ${state.currentTarget ? CAREER_NODES.find(n=>n.id===state.currentTarget)?.label : "a new career"}. It should highlight transferable skills (${state.skills.slice(0,3).join(", ")||"various"}), feel authentic, and work for interviews and LinkedIn.` },
];

function renderActionPanel() {
  const grid = el("actionGrid"); if (!grid) return;
  grid.innerHTML = ACTION_CARDS.map((c, i) => `
    <div class="action-card" data-idx="${i}">
      <span class="action-card-icon">${c.icon}</span>
      <span class="action-card-tag">${c.tag}</span>
      <p class="action-card-title">${c.title}</p>
      <p class="action-card-desc">${c.desc}</p>
    </div>`).join("");
  grid.querySelectorAll(".action-card").forEach(card => {
    card.addEventListener("click", async () => {
      const idx = parseInt(card.dataset.idx, 10);
      const cfg = ACTION_CARDS[idx];
      card.classList.add("loading");
      card.querySelector(".action-card-icon").textContent = "⏳";

      const outputWrap = el("actionOutputWrap");
      const output = el("actionOutput");
      const outputTitle = el("actionOutputTitle");
      outputWrap.style.display = "block";
      outputTitle.textContent = cfg.title;
      output.textContent = "Generating with Gemini AI…";
      outputWrap.scrollIntoView({ behavior: "smooth", block: "nearest" });

      const reply = await callAI(cfg.prompt());
      output.textContent = reply || "No response — check your API key in the server config.";
      card.classList.remove("loading");
      card.querySelector(".action-card-icon").textContent = cfg.icon;
    });
  });
}

el("btnActionClose")?.addEventListener("click", () => {
  el("actionOutputWrap").style.display = "none";
});

/* ─────────────────────────────────────────
   CONSTELLATION TOOLBAR BUTTONS
───────────────────────────────────────── */
el("btnRemix")?.addEventListener("click", () => {
  buildConstellationNodes(); // re-randomise positions slightly
});

el("btnWhyModal")?.addEventListener("click", () => {
  const body = el("whyBody");
  const role = state.role || "your background";
  body.innerHTML = `
    <div style="font-size:14px;line-height:1.75;color:#5f6368">
      <p>These career paths were surfaced based on your Career Identity profile:</p>
      <ul style="margin:12px 0 0 18px;display:grid;gap:8px">
        <li><strong>Role:</strong> ${escHtml(state.role || "Not yet set — complete Career Identity first.")}</li>
        <li><strong>Skills:</strong> ${escHtml(state.skills.join(", ") || "None yet.")}</li>
        <li><strong>Motivations:</strong> ${escHtml(state.motivations.join(", ") || "None yet.")}</li>
        <li><strong>Education:</strong> ${escHtml(state.education + (state.major ? " in " + state.major : ""))}</li>
      </ul>
      <p style="margin-top:16px">🔵 <strong>Blue nodes</strong> are direct matches from our curriculum database. 🟢 <strong>Green nodes</strong> are AI-generated hybrid suggestions based on your full profile.</p>
      <p>Complete all Career Identity steps to get more personalized matches.</p>
    </div>`;
  el("whyOverlay").removeAttribute("hidden");
});

el("whyClose")?.addEventListener("click", () => el("whyOverlay").setAttribute("hidden", ""));
el("whyOverlay")?.addEventListener("click", e => { if (e.target === el("whyOverlay")) el("whyOverlay").setAttribute("hidden", ""); });

/* ─────────────────────────────────────────
   PINNED PANEL
───────────────────────────────────────── */
function renderPinnedPanel() {
  const grid = el("pinnedGrid"); if (!grid) return;
  const empty = el("pinnedEmpty");
  if (!state.pinned.length) {
    if (empty) empty.style.display = "flex";
    return;
  }
  if (empty) empty.style.display = "none";

  // Remove old cards
  grid.querySelectorAll(".pinned-role-card").forEach(c => c.remove());

  state.pinned.forEach(id => {
    const n = CAREER_NODES.find(c => c.id === id);
    if (!n) return;
    const card = document.createElement("div");
    card.className = "pinned-role-card";
    card.innerHTML = `
      <p class="pinned-role-name">
        <span class="pinned-role-dot ${n.type}"></span>${escHtml(n.label)}
      </p>
      <p class="pinned-role-salary">${n.salary}</p>
      <p class="pinned-role-why">${escHtml(n.why)}</p>
      <div class="pinned-role-actions">
        <button class="btn primary" data-id="${id}">Set as target</button>
        <button class="btn ghost" data-id="${id}">Deep dive →</button>
        <button class="pinned-remove" data-id="${id}">Remove</button>
      </div>`;
    card.querySelector(".btn.primary").addEventListener("click", () => setTarget(n));
    card.querySelector(".btn.ghost").addEventListener("click", () => openDeepDive(n));
    card.querySelector(".pinned-remove").addEventListener("click", () => {
      togglePin(id); renderPinnedPanel();
    });
    grid.appendChild(card);
  });
}

/* ─────────────────────────────────────────
   ESCAPE HTML HELPERS
───────────────────────────────────────── */
function escHtml(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function escAttr(s) { return escHtml(s); }

/* ─────────────────────────────────────────
   BOOT
───────────────────────────────────────── */
function boot() {
  if (!el("dreamerStage")) return; // not on dreamer page

  // Init tab listener — explore badge
  if (CAREER_NODES.length) {
    const eb = el("exploreBadge");
    if (eb) { eb.textContent = CAREER_NODES.length; eb.removeAttribute("hidden"); }
  }

  renderStep(0);
  renderActionPanel();
  updatePillarGrowth();
  updatePillarStrengths();
  updatePillarPassions();
  renderAuditMini();
  updatePinnedBadge();
  renderExplorePinned();

  // Restore from draft
  if (state.role) updatePillarGrowth();
  if (state.skills.length) updatePillarStrengths();
  if (state.motivations.length) updatePillarPassions();
}

document.addEventListener("DOMContentLoaded", () => {
  // wait a tick so app.js has booted and SID is set
  setTimeout(boot, 100);
  el("btnSaveIdentity")?.addEventListener("click", () => { save(); alert("Draft saved!"); });
});

/* Re-render audit when session updates */
document.addEventListener("pathlight:sessionUpdated", renderAuditMini);

})();
