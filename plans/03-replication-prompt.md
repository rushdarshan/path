# Replication Prompt — Pathlight × Career Dreamer Intro Funnel

---

## 1. ROLE + AESTHETIC IDENTITY

**Role:** Act as a World-Class Senior Creative Technologist and Lead Frontend Engineer.

**Aesthetic Identity:** Playful Laboratory / Trustworthy Playground — Airy Aurora, Precise Steps

You are not building a standalone career inspiration site. You are building a *landing intro funnel that lives in front of* an existing zero-dependency vanilla SPA — Pathlight (Personalized Learning Path Recommender, dark #0b0e14 shell, tabs Converse/Profile/Path/Why/Mastery/Resume). The reference you transplant is https://grow.google/career-dreamer/home — a Google Labs Lit experiment: centered hero with Google Sans + an animated aurora band, a 3-card bento, and a tall stepped questionnaire where *one question is visible at a time* with sticky Back/Next. Its soul is restraint + play: a single gradient does all the magic, all motion is fadeIn + a dialog scale, and every step uses a 4px color accent to orient the eye. Your job is to graft that soul onto Pathlight's deterministic engine so the landing feels like Dreamer but lands in a real path.

---

## 2. CORE DESIGN SYSTEM

### Palette

| Semantic Name | Descriptive Word | Hex | Usage |
|---|---|---|---|
| Paper | Snow White | #FFFFFF | Card bg, dialog bg, stepped card bg |
| Ink | Graphite | #1F2836 (rgb 31 40 54, --dark) | Primary text, header copy, checkbox stroke, headings |
| Muted | Slate | #3D4655 (--gray-1000 61 70 85) | Secondary headings, card subtitles |
| Body copy | Pewter | #555E6D (--gray-900 85 94 109-derived) | Body 16px Text, instructions |
| Stone | Quiet Stone | #ACB5C2 (--gray-600) | Disabled Next bg, inactive dots, borders |
| Wash | Mist | #EDF0F5 (--gray-200 237 240 245) | Page bg (html,body), bento surround |
| Border | Pearl | #E4E7ED (--gray-300) | Card borders, header border, input border |
| Blue core | Google Blue | #1B6EF3 (--blue-300) | Primary CTA bg, progress dots active, focus, blue database dot, Links |
| Blue hover | Midnight Hover | #0B59D6 (--blue-400) | Primary hover |
| Blue press | Midnight | #0046B8 (--blue-500) | Pressed |
| Blue tint | Sky Wash | #E8F0FE (--blue-50) | Chip selected bg tint, focus ring soft |
| Career Powder | Powder Blue | #E0ECFF (--career-blue-light) | Career cards, bento tint |
| Interests | Vivid Mint | #2BD773 (--interests-green 43 215 115) / light #36F586 / dark #34A853 | Interests step 4px top border, tag |
| Skills | Lime Field | #B5F568 (--skills-green 181 245 104) / light #D1FB9F / dark #80C133 | Skills step accent |
| Experiences | Periwinkle | #A6C9FC (--experiences-blue 166 201 252) / light #CDE1FF | Experience accent |
| Education | Lavender | #C9B8FA (--education-lavender 201 184 250) / light #E4DBFF | Education accent |
| Aurora | Dream Aurora | linear-gradient(93deg, #34ADF1 13.82%, #26D677 47.19%, #84D71B 74.83%) (--explorer-gradient) | Hero 4px band, upsell bento bg, animated variant |
| Red | Alert | #F9470F (--red) + tint #FACFC8 | Error toast "Whoa there", deletion guard |

**Substitution rule:** Reference Blue → Pathlight Blue #1B6EF3, Reference Wash → Pathlight wash #EDF0F5 (landing) / #0b0e14 (app shell behind landing). Keep each semantic role — if reference used Interests green for top border, you use #2BD773 for top border. Never swap skills lime onto interests card.

### Typography

| Role | Font Family | Weight | Size | Line-Height | Notes |
|---|---|---|---|---|---|
| Display (Hero H1) | Google Sans | 700 | clamp(2.4rem, 6vw, 4.2rem) | 1.05 | tracking -0.02em, ink or white on hero, 2 lines max "Dream big." Must stay 700. |
| H2 Section | Google Sans | 500 | 1.6rem (≈25px) | 1.2 | bento titles, step header, explore h2 |
| Body | Google Sans Text | 400 | 16px | 1.6 | instructions, descriptions, max 620px. Never use Google Sans for body copy. |
| Label / Chip | Google Sans | 500 | 12–13px | 1.0 | uppercase 0.04em tracking on step labels, pill 9999px, chip text |
| Mono | Google Sans Mono | 400 | 12px | 1.5 | diagnostic only |

**⚑ Drama Ratio:** Reference drama is Google Sans 700 (Display, tight -0.02em, huge 4.2rem) vs Text 400 (air 1.6) + aurora gradient band (vivid, animated 3s linear) vs flat Mist #EDF0F5 wash. Do not drop Display to 500, do not relax tracking, do not replace aurora with flat blue — if you do the page becomes a generic Google clone and the playful lab feeling disappears. Preserve 700 on H1 + aurora 4px band + fadeIn 600ms.

### Texture System

- Noise/grain: none — flat colors + gradient bands only. Do not add grain.
- Border radius scale: hero CTA pill 9999px, bento/card 16–24px (rounded-2xl/3xl), stepped card 16px (top border radius 16px 16px 0 0 for 4px bar), dialog 24px, input 12px, chip 9999px.
- Shadow system: card `0 8px 24px rgba(31,40,54,0.08) + 0 1px 2px rgba(31,40,54,0.06)`, header sticky shadow soft, dialog scrim `opacity 0.7` black, focus `outline 1px solid #3D4655` (ink, not blue).
- Z: header 100, bar 999, dialog 1000 (var(--z-8..10)). Content stays 1–7.

---

## 3. COMPONENT ARCHITECTURE

> High-Fidelity: ASCII wireframes, timelines (t=Xms), diff tables, state machines below are transplanted from Site DNA (§1.3–1.7) with Pathlight content substituted. Do not paraphrase.

### A) Global Header — "The Quiet Bookmark"

```
┌──────────────────────────────────────────────────────────────┐
│ [◎ Pathlight wordmark (replace Career Dreamer glyph, aria-label "Pathlight — go to app")]   [How it works] [Enter app] [Start exploring — blue pill] │
│ height ~58px sticky top 0 z-100 bg white / blur + border-bottom 1px #E4E7ED, max-width 1280 centered, px 24, flex justify-between, Google Sans 500 14px ink #1F2836 │
└──────────────────────────────────────────────────────────────┘
Layout: flex row, nav gap 20px, CTA pill bg #1B6EF3 text white px 18 py 9 rounded-full.
```

### B) Hero — "The Aurora Playground" (tall, centered column)

```
┌──────────────────────────────────────────────────────────────┐
│  display:flex flex-direction column align-items center gap 2.25rem (36px) │
│  padding 11.8rem 1rem 3.875rem desktop; mobile: min-height calc(100vh - 58px - 8rem) padding-top 8rem gap 1rem │
│  [eyebrow pill 12px/500 uppercase 0.08em blue #1B6EF3 on #E8F0FE] "An AI experiment — now landing for Pathlight" │
│  h1 700 clamp 2.4–4.2rem /1.05 /-0.02em "Dream big. Map your next chapter." │
│  sub 16px Text 400 #555E6D max 520px "A playful, one-question-at-a-time way…" │
│  CTAs row gap 12px: [Start exploring → primary #1B6EF3] [See how it works ghost #EDF0F5 bg] │
│  trust row 12px #ACB5C2 "Early-stage experiment — your audit trail stays local." (permission-giving Dreamer voice) │
│  ambient: 4px aurora band bottom 100vw var(--explorer-gradient) animated 3s linear │
└──────────────────────────────────────────────────────────────┘
Composition: single centered column max-width 720px — NOT split. Keep gap 2.25rem.

TIMELINE — fadeIn on hero mount
 t=0ms   opacity 0, translateY 30px
 t=600ms opacity 1, translateY 0
 EASING: cubic-bezier(0.4,0,0.2,1) or ease (bundle shows both; use ease)

TIMELINE — aurora band
 t=0ms   background-position 100% center
 t=3000ms background-position 0% center
 DURATION 3000ms linear infinite
```

### C) How It Works — "The Bento Syllabus" (keep-as-is)

```
┌──────────────────────────────────────────────────────────────┐
│ h2 "How it works" Google Sans 500 1.6rem ink, centered      │
│ grid 1×3 @≥1024px / 1×1 @<768px gap 1.5rem max-width 1024    │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│ │1. Shape your prof story │2. Map to prerequisites │3. Explore paths│
│ │ Draft Career Identity… │ Pathlight ontology… │ blue dot / green dot │
│ │ [soft illustration] │ │ │ Careers cards preview │   │
│ └─────────────┘ └─────────────┘ └─────────────┘            │
│ each card: white rounded-2xl border #E4E7ED shadow, p-6, min-h 260px │
└──────────────────────────────────────────────────────────────┘
```

### D) Stepped Flow — "The Staged Workshop" — THE CORE, one-by-one (keep-as-is, this is your request)

```
┌──────────────────────────────────────────────────────────────┐
│ progress: flex row 5–6 dots (active #1B6EF3, inactive #DADEE3) + "Step 2 of 6" 12px/500 gray-1000  │
│ h2 22px/500 ink + p instructions 14px #555E6D 620px          │
│  e.g. "Describe a career, industry, or field that interests you." (Interests) │
│ card: white rounded-2xl border #E4E7ED shadow, p-6–8, max-width 560px centered │
│  top accent bar 4px full-width: Interests #2BD773 / Skills #B5F568 / Experiences #A6C9FC / Education #C9B8FA │
│  field: <task-select-area>-like chips + <md-autocomplete>    │
│   placeholder cycles every ~3000ms across 14: "artificial intelligence","agriculture","content creation","creative writing","culinary arts","design","education","e-sports","engineering","entrepreneurship","fashion","healthcare","linguistics","music production" │
│  sticky footer @<768px: position sticky bottom 0 bg white border-top #E4E7ED p-4 flex gap 12px [Back ghost] [Next primary #1B6EF3] │
│  desktop footer: inline below card, same gap │
│  guards: deletion blocked with red toast "Whoa there — You need at least one experience or education and three skills." │
└──────────────────────────────────────────────────────────────┘
Layout: single-card visible; all other steps hidden (`display:none` until step===targetStep). Step Valid drives Next disabled (`bg #ACB5C2` + not-allowed) vs enabled (`#1B6EF3` → hover `#0B59D6`).

INTERACTION — Next button
 DEFAULT (enabled): bg #1B6EF3 white | HOVER: #0B59D6 | ACTIVE scale 0.98 | DISABLED: bg #ACB5C2 white not-allowed
 TRANSITION background 150ms cubic-bezier(0.4,0,0.2,1), transform 100ms

ANIMATION — step card swap (fadeIn transposed)
 t=0ms   opacity 0 + translateY 30px
 t=600ms opacity 1 + translateY 0 cubic-bezier(0.4,0,0.2,1)

ANIMATION — placeholder rotate
 interval ~3000ms cross-fade opacity 0→1 ease while placeholder string swaps.

STATE MACHINES (transplanted verbatim):
 Restore-or-New: boot → if localStorage SID exists show md-dialog "Restore previous session? Would you like to restore your previous session or start a new one? [Restore | Start new]" → restore hydrates interests/skills/experiences from /api/session/:id else wipe.
 Flow: S1 Interests → S2 Motivations (optional ≤2) → S3 Skills → S4 Experiences → S5 Education → S6 Identity draft (synthesized statement) → S7 Explore. Guard stepValid = (interests≥1 && skills≥3 && (exp≥1 || edu≥1)). _buttonsDisabled = !stepValid. Error Whoa-there blocks deletion below minimum.
 Chip add: idle --type "music production"--> validating --> added (tada + "🎉 Well done! You've added an interest.") --> chip renders. Rotation paused when input focused.
```

### E) Explore Paths Results — "The Branching Map" (adapt, keep dot language)

```
┌──────────────────────────────────────────────────────────────┐
│ h2 "Explore paths based on…" filter row: [Profile] [Skills] [Interests] pills │
│ why button "? Why am I seeing these?" 12px link → md-dialog │
│ grid 2-col @≥1024px / 1-col @<768px gap 1rem                │
│  card white rounded-2xl border gap 1 border #E4E7ED p-4    │
│   dot row: blue dot #1B6EF3 (database result) vs green #2BD773 (AI result) + label │
│   title 16px/500 ink + salary/requiredDegree / requiredExperience 13px gray-700 │
│   actions: thumbs up/down + "See why / View weekly slot"  │
│ below grid: Pathlight weeklyPlan strip (4-week compact) + gap diagnosis bars │
└──────────────────────────────────────────────────────────────┘
Interaction: chip filter identical to Stepped (150ms), Why dialog follows md-dialog timeline (500ms scale, scrim linear).

Dialog — Why am I seeing these? (preserve voice):
 copy block from bundle: "You are the best judge… Some may pique your interest… explore based on specific profile sections… blue dots are US occupations DB with salary/degree… green dots are Gemini ideas… thumbs up/down helps improve…" — permission-giving + hedging, keep verbatim structure.
```

### F) Explorer CTA — "The Aurora Gate" (adapt, keep gradient)

```
┌──────────────────────────────────────────────────────────────┐
│ bg var(--explorer-gradient) 93deg, rounded-3xl p-8, white text, max-width 1024 │
│ h2 "Continue to your Pathlight path" + sub 14px white/85    │
│ CTA pill white bg #1B6EF3 text: "Continue to Pathlight → Profile · Path · Mastery" (carry ?utm_… + SID) │
│ hover: filter brightness 1.06 200ms cubic-bezier(0.25,0.1,0.25,1) │
└──────────────────────────────────────────────────────────────┘
```

### G) Footer — "The Small Print"

```
┌──────────────────────────────────────────────────────────────┐
│ 4-col grid: [◎ Pathlight] [Google-style nav] [Resources] [Legal] border-top #E4E7ED 12px Text gray-700 links #1B6EF3 │
│ glue bar removed; keep soft cookie-like "Restore bar" only if you re-add category handling. │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. TECHNICAL REQUIREMENTS

```
TECHNICAL REQUIREMENTS
  Stack:                Vanilla HTML/CSS/JS inside existing SPA (no framework). Optionally Lit 2.x if you want to mirror reference verbatim (reference is Lit + Vite). Keep current zero-dep Node http server — landing can be a new #panel-dreamer or public/dreamer.html static shell.
  Animation:            CSS @keyframes only + Web Animations API for dialog scale if you mirror md-dialog. No GSAP, no Lenis, no ScrollTrigger — reference motion is fadeIn + gradientAnimation + dialog scale.
  Scroll:               native document scroll (html,body height 100%). No parallax, no pinning. Sticky header (z-8 100) + sticky mobile step controls (bottom 0) are the only sticky.
  Animation Lifecycle:  No gsap.context. For step swap: toggle display + add class .fadeIn (animation fadeIn 600ms). For aurora: CSS animation gradientAnimation 3s linear infinite. For dialog: scrim opacity 0→0.7 500ms linear, container opacity 0→1 83ms linear, content 500ms linear with 20% hold, dialog scale 0.7→1 500ms cubic-bezier(0.4,0,0.1,1). Cleanup: cancelAnimation or remove class on detached.
  Scroll Trigger Setup: N/A — no scroll triggers (reference has none; do not add start: top 80% triggers).
  Hover Implementation: transition: background 150ms cubic-bezier(0.4,0,0.2,1), transform 100ms. CTA hover is flat color swap (#1B6EF3 → #0B59D6), not pseudo slide.
  Custom Cursor:        N/A — reference has none. Do not add.
  Font Loading:         <link rel="preconnect fonts.googleapis" + <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600;700&family=Google+Sans+Text:wght@400&family=Google+Sans+Mono&family=Material+Symbols+Outlined:opsz,wght,FILL@20..48,100..700,0..1" rel="stylesheet" as="style"> — same as reference. No self-host needed.
  Image Sources:        No photography required. Bento uses soft abstract geometric gradients (career-blue/powder) or white. If you use Unsplash at all: bright minimal, airy, abstract organic — NOT moody/dark, NOT stock people.
```

---

## 5. EXECUTION DIRECTIVE

*Do not build a form; build a playground that asks one honest question at a time — until the map draws itself.*

