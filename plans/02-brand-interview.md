# Brand Interview — Pathlight × Career Dreamer Landing

Reference site: https://grow.google/career-dreamer/home
Target use: Landing / intro funnel *in front of* existing Pathlight app (https://pathlight existing project), not a standalone marketing site.
Date: 2026-08-30
Note: Answers inferred from your stated intent (“use this career dreamer as a landing page or intro page to our existing project”) + existing Pathlight codebase (zero-dep Node http, vanilla SPA, dark #0b0e14 shell, profile/path/why/mastery/resume tabs). Edit any field and I regenerate Phase 3 in seconds — DNA is frozen.

---

## 1. PRODUCT IDENTITY
Pathlight — AI-powered Personalized Learning Path Recommender with prerequisite-aware roadmaps, gap diagnosis, weekly scheduling, and adaptive mastery. The new **Dreamer Intro** is its top-of-funnel landing: a playful, step-by-step “Shape your professional story” questionnaire that feeds directly into Pathlight’s deterministic engine. Category: EdTech / Career-tech / AI learning platform.

## 2. AUDIENCE PERSONA
Primary: Indian engineering students and early-career builders, 18–27, moderately technical (comfortable typing skills in plaintext, pasting a short experience summary), Chrome desktop + mobile. Psychographic: “ambitious but overwhelmed, time-poor and placement-anxious” — needs a trustworthy, gentle, one-question-at-a-time on-ramp, not a 40-field form.

## 3. BRAND FEELING
playful, trustworthy, precise

## 4. COLOR PALETTE
Keep Pathlight’s dark shell but adopt Dreamer’s per-step accents + aurora for the *landing* only:
- Page wash: #EDF0F5 (gray-200, Dreamer html bg) for landing; app shell stays #0b0e14 inside.
- Ink: #1F2836 (dark 31 40 54) for body copy on landing; cards stay #FFFFFF.
- Blue primary: #1B6EF3 → hover #0B59D6 (CTAs, focus, progress dots, blue database dot)
- Accents per step: Interests #2BD773 (light #36F586), Skills #B5F568 (light #D1FB9F), Experiences #A6C9FC (#CDE1FF light), Education #C9B8FA (#E4DBFF light)
- Explorer aurora: linear-gradient(93deg, #34ADF1 13.82%, #26D677 47.19%, #84D71B 74.83%) + animated variant for hero band.
- If you prefer to stay fully dark on the intro, map the same accents as 4px top borders on white cards (as in DNA) — palette already dark-mode safe.

## 5. PAGE SECTIONS
In order for the **Dreamer intro landing** (mounted at `/` or as `#panel-dreamer` before `#panel-chat`):
1. Hero — centered playground (eyebrow + huge H1 + sub + dual CTA + aurora band)
2. How It Works — 3-card bento (“Shape your professional story” / step 2 / “Explore paths”) — as in Dreamer `un.videos`
3. Stepped Questionnaire — one-by-one cards: Interests → Motivations (≤2) → Skills → Experiences → Education → Draft Career Identity — single question visible, Back/Next sticky footer, progress dots
4. Explorer CTA / Upskill Bento — aurora gradient card → “Continue to Pathlight” (qs preserved)
5. Footer — compact 4-col + cookie note + compliance
Existing app tabs (Converse / Profile / Path / Why / Mastery / Resume) remain *after* the intro; “Start exploring” CTA scrolls or routes into the stepped flow, and on completion hands off to `POST /api/session/:id` with collected interests/skills/experiences.

## 6. PRIMARY HEADLINE
Headline: “Dream big. Map your next chapter.”
Subheadline: “A playful, one-question-at-a-time way to turn what you’ve done — interests, skills and experience — into a prerequisite-aware learning path with a real weekly plan.”

## 7. PRIMARY CTA
Primary: “Start exploring” (hero pill, blue #1B6EF3) → enters stepped flow at Interests.
Secondary on last step card: “Shape your story →” / “Continue to Pathlight” (aurora gradient bento CTA) → creates Pathlight session and drops user into Profile → Path.
Ghost hero secondary: “See how it works” → scrolls to bento.

## 8. KEY DIFFERENTIATOR
Dreamer gives inspiring, divergent ideas (blue database dots + green Gemini dots). Pathlight adds *convergent rigor*: every “one by one” answer is parsed via ontology + BKT guard + time-budget + audit trail into a dependency-ordered path, weekly schedule, and why-explanations that survive refresh. Playful front, rigorous back — not just AI suggestions, but a verifiable curriculum with mastery quizzes and resume gap re-targeting. Voice stays hedged/permission-giving (“feel free to disregard…”) while the engine stays deterministic.

## 9. ANIMATION INTENSITY
Level: 2 — Subtle
Keep Dreamer’s restraint: `fadeIn 600ms` on hero/bento/step change, `gradientAnimation 3s linear infinite` on aurora band, dialog `scale 0.7→1 500ms cubic-bezier(0.4,0,0.1,1)` + scrim `opacity 0→0.7 500ms linear`. No GSAP, no parallax, no Lenis. Chip placeholder rotates ~3s.

## 10. TECH STACK
Keep existing zero-dependency server (Node `http`) + vanilla SPA (HTML/CSS/JS, no framework). Replicate Lit `hi.step` logic in vanilla: `let step`, `stepValid`, `targetStep`, single visible card, sticky footer, localStorage `restore vs start new` dialog. Use CSS `@keyframes` + `element.animate()` for dialog only. Fonts: `Google Sans 400/500/600/700` + `Google Sans Text 400` + `Material Symbols Outlined` (already CDN). If you later port to React, spec stays valid — just swap `md-dialog` for your component.

## 11. CONTENT ASSETS
Logo: keep existing `◎ Pathlight` wordmark (replace Career Dreamer glyph). No new logo file needed.
Photography/illustrations: none — use aurora gradient + Material Symbols + soft card illustrations if needed. If Unsplash placeholders are required for the bento, aesthetic: `bright minimal, airy, abstract organic` — pale gradients + subtle geometric shapes, not stock people shots, to preserve Dreamer’s lab playfulness.
No custom cursor, no Lottie — rendered CSS only.

## 12. SECTION MODIFICATIONS
Dreamer reference sections → decision (Dreamer shell is the intro, your app is the engine behind it):

- Global Header (Career Dreamer wordmark + Sign in): ADAPT — keep sticky header pattern (height ~58px, max-width 1280, border #E4E7ED) but swap wordmark to `◎ Pathlight` + nav “How it works · Privacy · Enter app” where “Enter app” links to existing `#panel-chat`. Preserve Google Sans 500 14px ink.
- Hero (#hero centered playground): KEEP AS-IS — gap 2.25rem, padding 11.8rem / 8rem mobile, centered column + aurora band, dual CTA layout. Content swapped to Q6 headline/sub + CTA “Start exploring”. Trust row becomes “An early-stage experiment — your audit trail stays local.”
- How It Works bento (un.videos 3 cards): KEEP AS-IS — 3-col @1024px grid gap 1.5rem, white rounded-2xl cards p-6, titles “1. Shape your professional story” etc. — second card adapted to “2. Map to prerequisites” (Pathlight ontology), third kept as “3. Explore paths (blue = verified occupation, green = AI idea)”.
- Stepped Flow (#form-content task-select-area): KEEP AS-IS — this IS the “fill out details one by one” request. Single-card narrow 560px, per-step 4px top border (Interests green, Skills lime, Experiences periwinkle, Education lavender), placeholder rotation 14 interests, Back ghost + Next blue footer, `whoaThere` deletion guard (≥1 exp/edu + ≥3 skills). On final step, card shows synthesized Career Identity draft (from collected answers) before Explore.
- Explore Paths results (dt): ADAPT — keep dot system (blue #1B6EF3 database vs green #2BD773 Gemini) but cards map to Pathlight `path.weeklyPlan` / `gapReport` topics + “Why am I seeing these?” dialog preserved verbatim. “Chat with Gemini” becomes “See why / View weekly slot”. Thumbs up/down kept as lightweight feedback.
- Explorer CTA / Upskill bento (gradient): ADAPT — keep aurora gradient rounded-3xl p-8 white text, but copy becomes “Continue to your Pathlight path → Profile · Path · Mastery” and href carries existing `qs` plus session id.
- Footer (4-col + cookie bar): ADAPT — keep 3–4 col + Glue category 2A bar pattern, swap labs.google/careerdreamer site id to your own, keep 12px gray-700.
- md-dialog + glue-cookie-notification-bar + reCAPTCHA/GTM: REMOVE from intro landing (not needed). Keep only the restore-session dialog (“Restore previous session? Would you like to restore…”) mapped to localStorage SID hydration.
- Added (not in reference): Weekly plan strip + Concept mastery mini-table below Explore cards (existing Pathlight `weeklyPlan` + `mastery` tables), so the landing visibly hands off to a real curriculum, not just inspiration.

