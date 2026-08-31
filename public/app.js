"use strict";
let SID = null;
let CONVO = { step: "goal", answers: {}, history: [] };
let LAST_RESULT = null;
const RESUME_TPLS = [
  { id:"classic-ats", name:"Classic", desc:"Traditional Times New Roman single-column. Widely used for campus placements — TCS, Infosys, Wipro and MNCs.", tags:["ATS-Friendly","Single Column","Fresher","Campus"], accent:"#111827", preview:"classic" },
  { id:"modern", name:"Executive", desc:"Two-column with clean gray sidebar. Great for experienced professionals targeting product companies.", tags:["Two Column","Experienced","Product","Senior"], accent:"#374151", preview:"exec" },
  { id:"minimal", name:"Clean", desc:"Google Docs / Calibri style — generous whitespace, thin dividers, no clutter. Works for any role.", tags:["Minimal","Any Role","Any Level","ATS-Friendly"], accent:"#1f2937", preview:"clean" },
  { id:"placement", name:"Campus", desc:"Standard Indian engineering placement format — hyperlinked profiles, inline skills, clean dividers.", tags:["ATS-Friendly","Single Column","Fresher","Campus","India"], accent:"#1e3a5f", preview:"campus" },
  { id:"sigma", name:"Sigma", desc:"Two-column for top achievers — light/bold name split, left sidebar for education, right for experience.", tags:["Two Column","Experienced","Academic","Any Role"], accent:"#555555", preview:"sigma" },
  { id:"harvard", name:"Harvard", desc:"Harvard/Garamond caps, bullet contacts, inline locations/dates. For experienced & MBA/MS.", tags:["ATS-Friendly","Single Column","Experienced","Professional"], accent:"#1a1a1a", preview:"harvard" },
];
const FILTER_TAGS = ["All","ATS-Friendly","Single Column","Two Column","Fresher","Experienced","Any Role","Campus","Professional","Academic"];
let RESUME_FILTER = "All";
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
async function api(path, opts) {
  const r = await fetch(path, opts);
  if (!r.ok) throw new Error((await r.json()).error || r.status);
  return r.json();
}

// ---------- Motion system (Lenis + GSAP) ----------
let lenis=null;
(function initMotion(){
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // word split for data-split (keep unsplit accessible name)
  $$("[data-split]").forEach(el=>{
    const raw=el.textContent.trim();
    el.setAttribute("aria-label", raw.replace(/\s+/g," "));
    const words=raw.split(/\s+/);
    el.innerHTML=words.map(w=>`<span class="word" aria-hidden="true">${w}</span>`).join(" ");
  });
  if(typeof gsap!=="undefined" && !prefersReduced){
    gsap.registerPlugin(ScrollTrigger);
    // hero intro
    gsap.from(".hero-title .word",{y:24, opacity:0, duration:.7, stagger:.06, ease:"power3.out", delay:.2});
    gsap.from(".hero-sub, .hero-ctas, .hero-trust, .session-pill",{y:14, opacity:0, duration:.6, stagger:.08, ease:"power2.out", delay:.55});
    gsap.from(".hero-scene",{y:18, opacity:0, duration:.8, ease:"power3.out", delay:.4});
    // section reveals
    $$(".manifesto, .how, .builder, .proof").forEach(sec=>{
      gsap.from(sec.querySelectorAll(".word"),{
        y:18, opacity:0, duration:.5, stagger:.04, ease:"power2.out",
        scrollTrigger:{trigger:sec, start:"top 82%"}
      });
      gsap.from(sec.querySelectorAll(".how-card, .proof-card, .stage, .preview-card"),{
        y:16, opacity:0, duration:.5, stagger:.07, ease:"power2.out",
        scrollTrigger:{trigger:sec, start:"top 78%"}
      });
    });
  } else if(typeof gsap!=="undefined"){
    // reduced: render final immediately
    $$(".word").forEach(w=>{w.style.transform="none"; w.style.opacity="1"});
  }
  if(typeof Lenis!=="undefined" && !prefersReduced){
    lenis=new Lenis({lerp:.1, smoothWheel:true});
    function raf(t){ lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    if(typeof gsap!=="undefined") lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.lagSmoothing(0);
  }
})();

// Hero DAG canvas — topographic, pointer-responsive, subordinate
(function heroDAG(){
  const c=$("#dagCanvas"); if(!c) return;
  const ctx=c.getContext("2d"); let rafId=null; let ptr={x:.5,y:.45}; let off=false;
  const prefersReduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DPR=Math.min(2, window.devicePixelRatio||1);
  function resize(){ const w=c.clientWidth||640,h=c.clientHeight||420; c.width=w*DPR; c.height=h*DPR; ctx.setTransform(DPR,0,0,DPR,0,0); draw(); }
  const nodes=[
    {x:120,y:120,r:9,label:"foundations"}, {x:340,y:170,r:11,label:"intermediate"}, {x:520,y:110,r:9,label:"applied"}, {x:200,y:260,r:8,label:"practice"}, {x:420,y:280,r:7,label:"ship"}
  ];
  function draw(){
    const W=c.clientWidth||640,H=c.clientHeight||420;
    if(off||prefersReduced){ poster(); return; }
    ctx.clearRect(0,0,W,H);
    // wash
    ctx.fillStyle="#FBF9F3"; ctx.fillRect(0,0,W,H);
    // contour lines — organic
    ctx.strokeStyle="rgba(31,40,54,.08)"; ctx.lineWidth=1;
    for(let k=0;k<3;k++){
      ctx.beginPath();
      const y0=90+k*70 + (ptr.y-.5)*6;
      ctx.moveTo(18,y0);
      ctx.bezierCurveTo(140+ptr.x*18, y0-22-k*6, 300-ptr.x*10, y0+18+(k%2?6:-6), W-20, y0-6+k*4);
      ctx.stroke();
    }
    // edges ridgelines
    ctx.strokeStyle="rgba(27,110,243,.22)"; ctx.lineWidth=1.4; ctx.lineCap="round";
    const edges=[[0,1],[1,2],[0,3],[1,4],[3,4]];
    edges.forEach(([a,b])=>{
      const nA=nodes[a], nB=nodes[b];
      const mx=(nA.x+nB.x)/2 + (ptr.x-.5)*8, my=(nA.y+nB.y)/2 + (ptr.y-.5)*6 -14;
      ctx.beginPath(); ctx.moveTo(nA.x,nA.y); ctx.quadraticCurveTo(mx,my,nB.x,nB.y); ctx.stroke();
    });
    // nodes as peaks
    nodes.forEach(n=>{
      const px=n.x+(ptr.x-.5)*6, py=n.y+(ptr.y-.5)*4;
      // shadow
      ctx.fillStyle="rgba(31,40,54,.06)"; ctx.beginPath(); ctx.ellipse(px, py+10, n.r*1.8, n.r*.9, 0,0,Math.PI*2); ctx.fill();
      // peak
      ctx.fillStyle="#fff"; ctx.strokeStyle= n.label==="applied" ? "#1B6EF3" : "#E4E7ED"; ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.arc(px,py,n.r,0,Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle="#1F2836"; ctx.font="600 9px Inter"; ctx.textAlign="center"; ctx.fillText(n.label.toUpperCase(), px, py+26);
    });
  }
  function poster(){ if(!ctx) return; const W=c.clientWidth||640,H=c.clientHeight||420; ctx.clearRect(0,0,W,H); }
  c.addEventListener("pointermove",e=>{ const r=c.getBoundingClientRect(); ptr.x=(e.clientX-r.left)/r.width; ptr.y=(e.clientY-r.top)/r.height; if(!off) draw(); });
  c.addEventListener("pointerleave",()=>{ ptr={x:.5,y:.45}; draw(); });
  document.addEventListener("visibilitychange",()=>{ off=document.hidden; if(!off) draw(); });
  let to=null; window.addEventListener("resize",()=>{ clearTimeout(to); to=setTimeout(resize,120); });
  resize();
  if(!prefersReduced){ // subtle breathe
    let t=0; (function loop(){ t+=0.006; if(!off) { /* keep draw cheap — only pointer drives */ } rafId=requestAnimationFrame(loop); })();
  }
  // expose for preview reuse
  window.__heroDAGDraw=draw;
})();

// Preview canvas — mirrors live path DAG (updates on session sync)
function drawPreview(pathObj){
  const c=$("#previewCanvas"); if(!c) return;
  const ctx=c.getContext("2d"); const W=c.clientWidth||360,H=c.clientHeight||260;
  const DPR=Math.min(2, window.devicePixelRatio||1);
  c.width=W*DPR; c.height=H*DPR; ctx.setTransform(DPR,0,0,DPR,0,0);
  const meta=$("#previewMeta");
  if(!pathObj || !pathObj.definitions || !pathObj.order || !pathObj.order.length){
    ctx.fillStyle="#fff"; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle="#E4E7ED"; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(16,60); ctx.bezierCurveTo(90,30,150,90,344,50); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(16,140); ctx.bezierCurveTo(90,110,150,180,344,130); ctx.stroke();
    if(meta) meta.textContent="Answer step 1 to see prerequisites bloom.";
    return;
  }
  const order=pathObj.order; const defs=pathObj.definitions;
  const cols=3; const rows=Math.ceil(order.length/cols);
  const pad=18, cellW=(W-pad*2)/cols, cellH=(H-pad*2-18)/rows;
  ctx.fillStyle="#fff"; ctx.fillRect(0,0,W,H);
  // light grid
  ctx.strokeStyle="rgba(228,231,237,.6)"; ctx.lineWidth=1;
  for(let i=1;i<cols;i++){ ctx.beginPath(); ctx.moveTo(pad+i*cellW,12); ctx.lineTo(pad+i*cellW,H-12); ctx.stroke();}
  const pos={};
  order.forEach((tid,i)=>{
    const col=i%cols, row=Math.floor(i/cols);
    const x=pad+col*cellW+cellW/2, y=14+row*cellH+cellH/2;
    pos[tid]={x,y};
    // prereq edges from explain predecessor if available
    const ex=(LAST_RESULT && LAST_RESULT.explanation && LAST_RESULT.explanation.topicExplanations || []).find(e=>e.topicId===tid);
    const prereqs=(ex && ex.prereqs)||[];
    prereqs.forEach(pre=>{
      if(!pos[pre]) return;
      ctx.strokeStyle="rgba(27,110,243,.22)"; ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.moveTo(pos[pre].x,pos[pre].y+14); ctx.lineTo(x,y-14); ctx.stroke();
    });
  });
  order.forEach((tid,i)=>{
    const {x,y}=pos[tid]; const def=defs[tid]||{name:tid};
    const g=(LAST_RESULT.gapReport && LAST_RESULT.gapReport.topics || []).find(g=>g.topicId===tid);
    const cov=g? Math.round(g.coverage*100): null;
    const col = cov==null?"#fff": cov>=70?"#E8F5E9":cov>=40?"#FFF8E1":"#FCE4EC";
    ctx.fillStyle=col; ctx.strokeStyle=cov!=null&&cov<40?"#F8BBD0":"#E4E7ED"; ctx.lineWidth=1.1;
    ctx.beginPath(); roundRect(ctx,x-52,y-16,104,32,10); ctx.fill(); ctx.stroke();
    ctx.fillStyle="#1F2836"; ctx.font="600 10px Inter"; ctx.textAlign="center"; ctx.fillText(def.name.slice(0,22), x, y-1);
    if(cov!=null){ ctx.fillStyle="#6B7280"; ctx.font="500 9px Inter"; ctx.fillText(cov+"% covered", x, y+9); }
  });
  if(meta) meta.textContent=`${order.length} topics · ${pathObj.milestones?.length||0} milestones · ${pathObj.totalHours||0}h`;
}
function roundRect(ctx,x,y,w,h,r){ ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); }

// Header nav + preview tabs
$("#menuBtn")?.addEventListener("click",()=>{
  const m=$("#mobileMenu"); const open=m.hasAttribute("hidden");
  if(open){ m.removeAttribute("hidden"); $("#menuBtn").setAttribute("aria-expanded","true"); } else { m.setAttribute("hidden",""); $("#menuBtn").setAttribute("aria-expanded","false"); }
});
$$(".preview-tabs button").forEach(b=> b.addEventListener("click",()=>{
  $$(".preview-tabs button").forEach(x=> x.setAttribute("aria-selected","false"));
  b.setAttribute("aria-selected","true");
  $$(".preview-panel").forEach(p=> p.classList.remove("active"));
  const id="preview-"+b.dataset.preview; $("#"+id)?.classList.add("active");
}));

// Legacy tabs shim now hidden — keep handler no-op
$$(".tab").forEach(t => t.addEventListener("click", () => {}));

function botMsg(html) {
  const w = $("#chatWindow"); if(!w) return;
  const el = document.createElement("div");
  el.className = "msg bot"; el.innerHTML = html; w.appendChild(el); w.scrollTop = w.scrollHeight;
}
function userMsg(text) {
  const w = $("#chatWindow"); if(!w) return;
  const el = document.createElement("div");
  el.className = "msg user"; el.textContent = text; w.appendChild(el); w.scrollTop = w.scrollHeight;
}
function showHints(h){ if(h) botMsg(`<span style="font-size:12px;color:#6B7280">${h}</span>`); }
async function send(text) {
  const body = { text }; userMsg(text); const inp=$("#chatInput"); if(inp) inp.value="";
  const typing = document.createElement("div"); typing.className="msg bot"; typing.textContent="…"; $("#chatWindow")?.appendChild(typing);
  try {
    const r = await api("/api/session/" + SID, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    typing.remove(); botMsg(r.reply.replace(/\n/g, "<br>")); if(r.hints) showHints(r.hints);
    if(r.result){ LAST_RESULT=r.result; window.LAST_RESULT=r.result; syncPreview(); $("#statusText") && ($("#statusText").textContent="Ready"); document.dispatchEvent(new CustomEvent("pathlight:sessionUpdated",{detail:r.result})); }
  } catch(e){ typing.remove(); botMsg("⚠ "+e.message); }
}
$("#sendBtn")?.addEventListener("click", () => { const t = $("#chatInput")?.value.trim(); if(t) send(t); });
$("#chatInput")?.addEventListener("keydown", e => {
  if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); const t=$("#chatInput").value.trim(); if(t) send(t); }
});

// Preview sync — called after every session write
function syncPreview(){
  if(!LAST_RESULT) return;
  drawPreview(LAST_RESULT.path);
  // profile panel
  const prof=$("#preview-profile"); if(prof) prof.innerHTML=renderProfileMini();
  const pathEl=$("#preview-path"); if(pathEl) pathEl.innerHTML=renderPathMini();
  const auditEl=$("#preview-audit"); if(auditEl) auditEl.innerHTML=renderAuditMini();
  // proof section
  const pa=$("#proof-audit"); if(pa) pa.innerHTML=renderAuditMini();
  const pw=$("#proof-weekly"); if(pw) pw.innerHTML=renderWeeklyMini();
  const pm=$("#proof-mastery"); if(pm) renderMastery();
}
function renderProfileMini(){
  const p=LAST_RESULT.profile; if(!p) return "<span style='color:#6B7280'>Run the conversation first.</span>";
  return `<div style="font-size:13px"><b>${p.baseline.level}</b> · ${(p.baseline.confidence*100|0)}%<div style="color:#6B7280">${p.goals.map(g=>g.goal).join(" · ")}</div><div style="margin-top:6px">${p.interests.map(i=>`<span style="border:1px solid #E4E7ED;border-radius:9999px;padding:4px 8px;font-size:11px;margin:2px;display:inline-block">${i.topicId} ${(i.confidence*100|0)}%</span>`).join("")}</div></div>`;
}
function renderPathMini(){
  const d=LAST_RESULT.path; if(!d) return "<span style='color:#6B7280'>No path yet.</span>";
  return `<div style="font-size:12px">${d.milestones.map((m,i)=>`<div style="margin-bottom:8px"><b>${i+1}. ${m.name}</b><div style="color:#6B7280">${m.topics.map(t=> d.definitions[t]?.name||t).join(" → ")}</div></div>`).join("")}</div>`;
}
function renderAuditMini(){
  const a=LAST_RESULT.audit; if(!a||!a.length) return "<span style='color:#6B7280'>Every profiling inference appears here, persisted.</span>";
  return a.slice(-4).map(x=>`<div style="font-size:11px;border-bottom:1px solid #E4E7ED;padding:6px 0"><b>${x.factor}</b> → ${typeof x.value==="object"?JSON.stringify(x.value):x.value} <span style="float:right">${Math.round(x.confidence*100)}%</span><div style="color:#6B7280">“${x.evidence||""}” · ${x.source}</div></div>`).join("");
}
function renderWeeklyMini(){
  const d=LAST_RESULT.path; if(!d||!d.weeklyPlan) return "<span style='color:#6B7280'>Weekly plan appears after your first answers.</span>";
  return `<div style="display:grid;gap:6px">${d.weeklyPlan.slice(0,4).map(w=>`<div style="border:1px solid #E4E7ED;border-radius:10px;padding:8px;background:#FBF9F3"><b>Week ${w.week}</b> · ${w.start}<div style="font-size:12px;color:#6B7280">${w.action}</div></div>`).join("")}</div>`;
}
document.addEventListener("pathlight:sessionUpdated", syncPreview);

// Resume — lets-code clone kept
function tplPreviewHtml(tpl){
  const accent=tpl.accent;
  if(tpl.id==="classic-ats") return `<div style="height:16px;background:${accent};border-radius:4px;margin-bottom:8px"></div><div style="font-weight:800;font-size:13px;border-bottom:2px solid #1f2937;padding-bottom:4px;margin-bottom:6px">Alex Chen — SDE</div><div style="height:3px;background:#2a3441;border-radius:2px;width:92%;margin:2px 0"></div><div style="height:3px;background:#2a3441;border-radius:2px;width:78%;margin:2px 0"></div>`;
  if(tpl.id==="placement") return `<div style="height:16px;background:${accent};border-radius:4px;margin-bottom:8px"></div><div style="font-weight:800;font-size:12px;margin-bottom:4px">Priya Sharma</div><div style="font-size:7px;color:#8b97aa;margin-bottom:6px">linkedin.com/in/priya · github.com/priya</div><div style="height:3px;background:#2a3441;border-radius:2px;width:88%;margin:2px 0"></div>`;
  if(tpl.id==="modern") return `<div style="display:flex;gap:8px"><div style="width:72px;background:${accent};border-radius:6px;padding:6px"><div style="height:18px;background:rgba(255,255,255,0.18);border-radius:3px"></div></div><div style="flex:1"><div style="font-weight:800;font-size:11px">Jordan Lee</div></div></div>`;
  return `<div style="font-weight:800;font-size:12px;margin-bottom:4px">${tpl.name} — Preview</div><div style="height:3px;background:#2a3441;border-radius:2px;width:76%;margin:2px 0"></div>`;
}
function gapForTpl(tplId){
  const g=LAST_RESULT && LAST_RESULT.gapReport && LAST_RESULT.gapReport.topics;
  if(!g||!g.length) return null;
  const avg=Math.round((LAST_RESULT.gapReport.overallCoverage||0)*100);
  if(avg>=70) return {label:"low gap", cls:"gap-low", pct:avg};
  if(avg>=40) return {label:"some gaps", cls:"gap-med", pct:avg};
  return {label:"high gap", cls:"gap-high", pct:avg};
}
function renderResumeFilterBar(){
  const bar=$("#resumeFilterBar")||$("#filterBarHost"); if(!bar) return;
  bar.innerHTML = FILTER_TAGS.map(t=>`<button class="filter-pill ${RESUME_FILTER===t?'active':''}" data-tag="${t}" style="border:1px solid #E4E7ED;background:${RESUME_FILTER===t?'#1B6EF3':'#fff'};color:${RESUME_FILTER===t?'#fff':'#1F2836'};border-radius:9999px;padding:6px 10px;font-size:11px;margin:2px;cursor:pointer">${t}</button>`).join("");
  bar.querySelectorAll(".filter-pill").forEach(b=> b.addEventListener("click", ()=>{ RESUME_FILTER=b.dataset.tag; renderResumeFilterBar(); renderTemplateGrid(); }));
}
function renderTemplateGrid(){
  const grid=$("#templateGrid")||$("#templateGridHost"); if(!grid) return;
  const filtered = RESUME_FILTER==="All" ? RESUME_TPLS : RESUME_TPLS.filter(t=> t.tags.includes(RESUME_FILTER));
  if(filtered.length===0){ grid.innerHTML = `<div style="color:#6B7280">No templates match this filter yet.</div>`; return; }
  grid.innerHTML = filtered.map(t=>{
    const gap=gapForTpl(t.id);
    const badge = gap? `<span style="font-size:11px;background:#E8F0FE;border-radius:9999px;padding:3px 8px;border:1px solid #DAE7FF">${gap.pct}% · ${gap.label}</span>` : `<span style="font-size:11px;color:#6B7280;background:var(--wash);border:1px solid var(--line);border-radius:9999px;padding:3px 8px">· filtered view</span>`;
    const tagPills = t.tags.map(tag=>`<span style="border:1px solid #E4E7ED;border-radius:9999px;padding:2px 6px;font-size:10px;margin:1px;display:inline-block">${tag}</span>`).join("");
    return `<div style="background:#fff;border:1px solid #E4E7ED;border-radius:16px;overflow:hidden;box-shadow:var(--shadow);display:flex;flex-direction:column"><div style="padding:12px;background:#FBF9F3;min-height:88px">${tplPreviewHtml(t)}</div><div style="padding:12px"><h3 style="margin:0 0 4px;font-size:13px">${t.name} ${badge}</h3><p style="margin:0 0 6px;color:#6B7280;font-size:12px">${t.desc}</p><div style="margin-bottom:8px">${tagPills}</div><button data-tpl="${t.id}" style="width:100%;border:1px solid #E4E7ED;background:#fff;border-radius:9999px;padding:8px;font-weight:600;cursor:pointer">Use This Template →</button></div></div>`;
  }).join("");
  grid.style.display="grid"; grid.style.gridTemplateColumns="repeat(auto-fill,minmax(240px,1fr))"; grid.style.gap="12px"; grid.style.marginTop="12px";
}
function initResumePanel(){ renderResumeFilterBar(); renderTemplateGrid(); }
document.addEventListener("DOMContentLoaded", initResumePanel);
setTimeout(initResumePanel, 400);

$("#resumeBtn")?.addEventListener("click", async () => {
  const resume = $("#resumeInput")?.value.trim(); if(!resume) return;
  const btn = $("#resumeBtn"); btn.disabled=true; btn.textContent="Analyzing…";
  try {
    const r = await api("/api/session/" + SID, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resume }) });
    const s = await api("/api/session/" + SID);
    LAST_RESULT = { profile: s.profile, path: s.path, gapReport: s.gapReport, explanation: s.explanation, recommendation: s.recommendation, audit: s.audit };
    window.LAST_RESULT=LAST_RESULT; syncPreview();
    const hitsHtml = (r.topicHits || []).map(h => `<span style="border:1px solid #E4E7ED;border-radius:9999px;padding:4px 8px;font-size:11px;margin:2px;display:inline-block"><b>${h.topicId}</b> · “${h.evidence}”</span>`).join("");
    const out=$("#resumeResult"); if(out) out.innerHTML = `<h3 style="font-size:12px; text-transform:uppercase; letter-spacing:.06em; color:#6B7280; margin:12px 0 6px">Resume analysis</h3><div>${hitsHtml||"No topics detected — try more detail."}</div>`;
    $("#statusText") && ($("#statusText").textContent="Path refreshed from resume");
    document.dispatchEvent(new CustomEvent("pathlight:sessionUpdated",{detail:LAST_RESULT}));
  } catch(e){ const out=$("#resumeResult"); if(out) out.innerHTML = "<p style='color:#F9470F'>⚠ "+e.message+"</p>"; }
  btn.disabled=false; btn.textContent="Analyze resume & refresh path";
});

function styleLabel(s){ if(!s) return "mixed"; const p=[]; if(s.visual) p.push("visual"); if(s.reading) p.push("reading"); if(s.hands) p.push("hands-on"); if(s.auditory) p.push("auditory"); return p.join("+")||"mixed"; }
function renderProfile(){
  const el=$("#preview-profile"); if(el) el.innerHTML=renderProfileMini() || "<p style='color:#ACB5C2;font-size:12px'>Answer step 1 to see your learner profile.</p>";
  const pa=$("#proof-audit"); if(pa) pa.innerHTML = el?.innerHTML?.slice(0,800) || "<p style='color:#ACB5C2;font-size:12px'>Audit trail builds as you answer.</p>";
}
function renderPath(){
  const el=$("#preview-path"); if(el) el.innerHTML=renderPathMini() || "<p style='color:#ACB5C2;font-size:12px'>Your weekly plan appears after the first sync.</p>";
  const pw=$("#proof-weekly"); if(pw) pw.innerHTML = el?.innerHTML?.slice(0,800) || "<p style='color:#ACB5C2;font-size:12px'>Weekly slots appear here.</p>";
}
function renderExplain(){}
function renderMastery(){
  if(!SID) return;
  api("/api/mastery/"+SID).then(topics=>{
    const host=$("#proof-mastery")||$("#masteryTable"); if(!host) return;
    host.innerHTML = topics.map(t=>{
      const pct=Math.round((t.score||0)*100); const c=pct>=80?"#059669":pct>=50?"#FFB800":pct>=20?"#F9470F":"#ACB5C2";
      return `<div style="display:flex;align-items:center;gap:8px;margin:6px 0"><div style="flex:1;font-size:12px">${t.name}</div><div style="flex:1.2;height:8px;background:#EDF0F5;border-radius:9999px;overflow:hidden"><i style="display:block;width:${pct}%;height:100%;background:${c}"></i></div><div style="font-size:11px;min-width:36px;text-align:right">${pct}%</div></div>`;
    }).join("") || "<p style='color:#6B7280'>No path yet.</p>";
  }).catch(()=>{});
}

// Gate continue scrolls to proof / opens full path view
$("#gateContinue")?.addEventListener("click",()=>{ document.getElementById("proof")?.scrollIntoView({behavior:"smooth"}); });

// Boot — cross-page SID persistence
(async function boot(){
  try{
    let sid=null; try{ sid=localStorage.getItem("pathlight_sid"); }catch(e){}
    let s=null;
    if(sid){
      try{ const existing=await api("/api/session/"+sid); if(existing && existing.profile!==undefined){ s={id:sid, question:existing.history?.slice(-1)[0]?.text || "Welcome back."}; SID=sid; window.SID=sid; s.hints=null; s.question = existing.history?.length ? "Continuing your map — ask or refine." : s.question; } else throw new Error("no session"); }catch(e){ sid=null; }
    }
    if(!sid){
      s=await api("/api/new");
      SID=s.id; window.SID=s.id; window.LAST_RESULT=null;
      try{ localStorage.setItem("pathlight_sid", s.id); }catch(e){}
    }
    if(!s) s=await api("/api/new");
    // hydrate LAST_RESULT if we reused
    if(sid){
      try{ const full=await api("/api/session/"+SID); if(full && full.profile){ LAST_RESULT={profile:full.profile, path:full.path, gapReport:full.gapReport, explanation:full.explanation, recommendation:full.recommendation, audit:full.audit}; window.LAST_RESULT=LAST_RESULT; } }catch(e){}
    }
    const sidEl=$("#sessionId"); if(sidEl) sidEl.textContent=SID;
    if(!sid){ botMsg(s.question); if(s.hints) showHints(s.hints); }
    drawPreview(LAST_RESULT?.path||null);
    syncPreview();
    if(sid && LAST_RESULT) syncPreview();
  }catch(e){ const sidEl=$("#sessionId"); if(sidEl) sidEl.textContent="offline"; }
})();
