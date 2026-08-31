# Site DNA — https://grow.google/career-dreamer/home

AUDIT_MODE: high-fidelity
Source: https://grow.google/career-dreamer/home (Lit + Vite, GTM GTM-TNSB9VD4, reCAPTCHA 6LdRzRYq, Glue cookie bar)
Date: 2026-08-30
Mode note: Public /home is a Lit `<lit-app>` shell with auth-gated stepped questionnaire. Shell is fetchable (HTML + `index-C1r2U-Hj.js` 2.9MB + `index-Bwub_0Zr.css`). Authenticated step contents were reverse-read from bundle strings (interestInstructions, motivationsInstructions, etc.) — compositions below are therefore *inferred-from-bundle* and marked ⚑ where DOM was not live-renderable without sign-in.

---

## 1.1 PAGE ARCHITECTURE

**Mandatory console snippet (reference §1.1):**
```js
// document.querySelectorAll('section, [role="main"], header, nav, footer, [id^="hero"], lit-app')
// → [<lit-app>] — single web-component root. All sections are inside Shadow DOM.
// document.querySelector('lit-app')?.shadowRoot?.innerHTML.slice(0,1200) would enumerate.
// Tall-section check: html/body height 100% + #hero min-height calc(100vh - header - 8rem) at <767px.
// Orphan sweep: colors below orphaned from DOM in raw CSS were re-tied in 1.2 notes.
```

**Top-level macro (lit-app ShadowRoot):**
```
lit-app (ShadowRoot)
├─ glue-cookie-notification-bar (fixed bottom, category 2A, site labs.google/careerdreamer)
├─ header (sticky, Google Sans, height var(--header-height))
├─ #hero
├─ #how-it-works (bento/video)
├─ #stepped-flow (form-content → interests → motivations → skills → experiences → education → career-identity)
├─ #explore-cta (gradient)
├─ footer (4-col + compliance)
└─ md-dialog (portalled)
```
No overlapping sections. Hero is full-bleed, stepped-flow is the tall section requiring scroll.

**Orphan note:** `--interests-green`, `--skills-green`, `--education-lavender`, `--experiences-blue`, `--explorer-gradient` exist in CSS but only visible after stepping into flow — re-tied to their owning step in 1.2.

---

## 1.2 DESIGN TOKENS

**Palette — extracted from `index-Bwub_0Zr.css` :root (verbatim hex via rgb):**

| Semantic | Descriptive | Hex | rgb var | Usage |
|---|---|---|---|---|
| Paper | Snow White | #FFFFFF | var(--white) 255 255 255 | Card bg, dialog bg, hero card |
| Ink | Graphite | #1F2836 | var(--dark) 31 40 54 | Primary text, checkbox stroke, dialog outline |
| Body copy | Slate 1000 | #3D4655 | var(--gray-1000) 61 70 85 | Secondary headings |
| Muted | Stone 600 | #ACB5C2 | var(--gray-600) 172 181 194 | Dividers, inactive |
| Wash | Mist 200 | #EDF0F5 | var(--gray-200) 237 240 245 | Page bg (html,body) |
| Ribbon gray | Pearl 300 | #E4E7ED | var(--gray-300) 228 231 237 | Card borders |
| Blue core | Google Blue | #1B6EF3 | var(--blue-300) 27 110 243 | Primary CTA, progress, focus rings, blue dot (database result) |
| Blue deep | Midnight Blue | #0046B8 | var(--blue-500) 0 70 184 | CTA pressed, headings on blue bg |
| Blue pale | Sky Tint | #E8F0FE | var(--blue-50) 232 240 254 | Selected state tint |
| Career blue | Powder | #E0ECFF | var(--career-blue-light) 224 236 255 | Career cards |
| Interests | Vivid Mint | #2BD773 | var(--interests-green) 43 215 115 | Interests tag, interests step accent (light #36F586, dark #34A853) |
| Skills | Lime | #B5F568 | var(--skills-green) 181 245 104 | Skills chips (light #D1FB9F / dark #80C133) |
| Experiences | Periwinkle | #A6C9FC | var(--experiences-blue) 166 201 252 | Experience cards (light #CDE1FF / dark #7CACF8) |
| Education | Lavender | #C9B8FA | var(--education-lavender) 201 184 250 | Education cards (light #E4DBFF / dark #A284F9) |
| Career green | Pale Mint | #CFF2E0 | var(--green) 207 242 224 | Generic success bg (light #DFF1E8 / dark #C0F0D8) |
| Explorer gradient | Aurora | linear-gradient(93deg, #34ADF1 13.82%, #26D677 47.19%, #84D71B 74.83%) | var(--explorer-gradient) | CTA bento, hero accent band, explore CTA |
| Red | Alert | #F9470F | var(--red) 249 71 15 | Error, deletion guard "Whoa there" |
| Trust band | Animated Aurora | linear-gradient(93deg, #34ADF1, #26D677, #84D71B, #34ADF1…) | var(--animated-explorer-gradient) | Gradient animation on hero lockup (gradientAnimation 3s linear infinite) |

**Typography — Google Sans system (preloaded):**
- Display/Hero: `Google Sans 600–700` @ `clamp(2.4rem, 6vw, 4.2rem)` / 1.05 / -0.02em, ink or white on dark hero. H1 is hero statement.
- H2 section: `Google Sans 500` @ 1.6rem / 1.2, gray-1000
- Body: `Google Sans Text 400` @ 16px / 1.6, gray-900 #555E6D, max 620px measure
- Label/Chip: `Google Sans 500` @ 12–13px / 1.0, uppercase 0.04em tracking on step labels, pill shape 9999px
- Mono/meta: `Google Sans Mono` for version/diagnostic only
- **⚑ DRAMA RATIO:** Google Sans 700 (Display, tight -0.02em, huge 4rem) vs 400 (Text, airy 1.6) + gradient aurora band vs flat #EDF0F5 wash. Drama is typographic weight + gradient position, not italic. Preserve 700 on hero; if you drop to 500 the page reads as doc, not dream.

**Spacing / Radius / Shadow / Z:**
- Base unit 4px. Section rhythm: hero `padding 11.8rem 1rem 3.875rem` desktop (8rem top @ <767px), bento gap 1.5rem (24px), stepped form gap 1rem.
- Radius: hero/bento/card `16–24px` (rounded-2xl/3xl), pills/chips `9999px`, dialog `24px`, input `12px`.
- Shadows: card `0 8px 24px rgba(31,40,54,0.08)` + `0 1px 2px rgba(31,40,54,0.06)`; dialog scrim `opacity 0.7` black; focus `outline 1px solid gray-1000` (custom, not blue).
- Z: `--z-8:100` header, `--z-9:999` bar, `--z-10:1000` dialog. Content `--z-1` to `--z-7`.
- Motion keys (from bundle): `gradientAnimation 3s linear infinite` (background-position 100%→0%), `fadeIn 0.6s ease` (translateY 30px→0), dialog `scale 0.7→1, 500ms cubic-bezier(0.4,0,0.1,1)` + scrim `opacity 0→0.7 500ms linear`.

---

## 1.3 SECTION BLUEPRINTS

All wireframes are high-fidelity ASCII — each child enumerated (exhaustive). Lit tag names are `our-principles-page`, `task-select-area`, `md-dialog`, `lit-app`.

### A) Global Header — `header var(--header-height)`

```
┌──────────────────────────────────────────────────────────────┐
│ [Career Dreamer glyph + wordmark (aria-label "… go to homepage")]   [How it works] [Privacy] [About]  [Sign in] │
│  Google Sans 500 14px ink #1F2836  sticky top 58px  bg white/blur │
└──────────────────────────────────────────────────────────────┘
Grid: flex row justify-between, max-width 1280px centered, border-bottom 1px #E4E7ED
```

### B) Hero — `#hero` (tall, flex column centered)

```
┌──────────────────────────────────────────────────────────────┐
│  gap 2.25rem (36px)  padding 11.8rem 1rem 3.875rem (desktop) │
│  [eyebrow 12px/500 uppercase 0.08em blue #1B6EF3 "An AI experiment"] │
│  h1: "Dream big." / "Explore your possibilities with AI"    │
│      Google Sans 700 clamp 2.4–4.2rem / 1.05 / -0.02em      │
│  sub: "A playful way to explore career possibilities with AI" 16px Text 400 gray-900 │
│  CTAs: [Start exploring — primary blue pill  ##1B6EF3 → #0046B8 hover] [How it works — ghost] │
│  trust row: "Career Dreamer is an early-stage experiment and is only available in the United States." 12px │
│  micro: aurora band: explorer-gradient 4px height 100% width gradientAnimation │
└──────────────────────────────────────────────────────────────┘
Mobile: min-height calc(100vh - header - 8rem), gap 1rem, padding-top 8rem.
```

### C) How It Works — Bento / Video — `un.videos`

```
┌──────────────────────────────────────────────────────────────┐
│ h2 "How it works"  Text-h1 (xl)                             │
│ grid 1×3 @≥1024px / 1×1 @<768px  gap 1.5rem                │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│ │ 1. Shape your prof story │ 2. … │ 3. Explore paths │    │
│ │ Draft a Career Identity … │ │ │ Careers blue dot /│    │
│ │ [illustration / video]   │ │ │ green dot (AI)   │    │
│ └─────────────┘ └─────────────┘ └─────────────┘            │
│ each card: white rounded-2xl border #E4E7ED shadow, p-6     │
└──────────────────────────────────────────────────────────────┘
```

### D) Stepped Flow — `#form-content` / `task-select-area` — THE CORE (tall, scroll-required)

```
┌──────────────────────────────────────────────────────────────┐
│ progress: segmented bar (5–6 dots) + "Step 2 of 5" 12px    │
│ step header: h2 22px/500 ink + instructions 14px gray-900  │
│  e.g. interestInstructions: "Describe a career, industry, │
│  or field that interests you."                             │
│ card: white rounded-2xl border #E4E7ED, p-6–8              │
│  field: <md-autocomplete> / <task-select-area> chips       │
│   placeholder rotates: ["artificial intelligence","agriculture","content creation","creative writing","culinary arts","design","education","e-sports","engineering","entrepreneurship","fashion","healthcare","linguistics","music production"] @ rotateInterval ~3s │
│  controls: [Back ghost] [Next primary blue]  stuck footer  │
│  guard: red fS.whoaThere + fS.deletionRequirements on invalid delete │
└──────────────────────────────────────────────────────────────┘
Steps inferred from bundle (in order):
  1 Interests (green #2BD773) — ss.interestInstructions
  2 Motivations (optional, select ≤2) — ss.motivationsInstructions
  3 Skills (lime #B5F568) — chip multi-select
  4 Experiences (periwinkle #A6C9FC)
  5 Education (lavender #C9B8FA)
  6 Career Identity draft (statement synthesis)
  7 Explore Paths (results: blue dot database vs green dot Gemini AI)
```

### E) Explore Paths Results — `dt` block

```
┌──────────────────────────────────────────────────────────────┐
│ h2 "Explore paths based on…"  filter row: [Profile] [Skills] │
│ why button "? Why am I seeing these?" → md-dialog            │
│ grid cards: 2-col @≥1024px, 1-col @<768px, gap 1rem        │
│  card: dot blue #1B6EF3 (database) vs green #2BD773 (AI)   │
│  tags: role, salary, requiredExperience, requiredDegree     │
│  actions: thumbs up/down反馈 + "Chat with Gemini" (AI dots) │
└──────────────────────────────────────────────────────────────┘
```

### F) Explorer CTA / Upskill Bento — sT qs param

```
┌──────────────────────────────────────────────────────────────┐
│ bg explorer-gradient 93deg, rounded-3xl, p-8, white text    │
│ h2 + CTA [Continue to Grow with Google courses]             │
│ qs carries utm_source=google&campaign=sou--google…          │
└──────────────────────────────────────────────────────────────┘
```

### G) Footer

```
┌──────────────────────────────────────────────────────────────┐
│ 4-col: [Career Dreamer logo] [Google] [Resources] [Legal]  │
│ border-top #E4E7ED, 12px Text 400 gray-700, links blue     │
│ cookie bar: glue-cookie-notification-bar category 2A        │
└──────────────────────────────────────────────────────────────┘
```

---

## 1.3b COMPOSITION MAPS

**Hero — "The Aurora Playground"**
```
COMPOSITION MAP: Hero — Centered playground with aurora accent
Element count: 5 visual objects + gradient band

CENTER:  Column gap 2.25rem, items center, max-width 720px centered
  1) Eyebrow pill — 12px/500 uppercase blue #1B6EF3 on #E8F0FE bg rounded-full px-10 py-4
  2) H1 — 2 lines, 700 weight, tight -0.02em, line-height 1.05
  3) Sub — 16px Text 400 #555E6D max 520px
  4) CTA row — gap 12px, primary pill #1B6EF3 bg white text vs ghost #EDF0F5 bg ink text

AMBIENT:  Bottom aurora band 4px height, 100vw, var(--explorer-gradient), background-position animated
          gradientAnimation: 0% bg-pos 100% center → 100% bg-pos 0% center, 3s linear infinite

No fanned cards here — composition is *centered column*, not split. Anti-flattening: do not replace with split left/right hero.
```

**Stepped Card — "The Staged Workshop"**
```
COMPOSITION MAP: Stepped questionnaire card
Arrangement: Single white card centered, max-width 560px (narrow), margin 0 auto

CARD (white, rounded-2xl, border #E4E7ED, shadow soft):
  Per-step accent top border 4px:
   - Interests: #2BD773 (interests-green)
   - Skills: #B5F568 (skills-green)
   - Experiences: #A6C9FC (experiences-blue)
   - Education: #C9B8FA (education-lavender)
   covers full card width, radius only top.

CONTROLS: Fixed footer below card on mobile (position sticky bottom 0, bg white, border-top #E4E7ED, p-4)
          Desktop: inline below card, gap 12px, [Back] left, [Next] right blue.

State: stepValid drives Next disabled (gray #ACB5C2 bg) vs enabled (#1B6EF3).
```

---

## 1.4 ANIMATION TIMELINES

**A) Gradient aurora — hero band**
```
Trigger: load (CSS animation, not JS)
Selector: .aurora-band (var(--animated-explorer-gradient))
TIMELINE:
 t=0ms    background-position: 100% center
 t=3000ms background-position: 0% center
 DURATION: 3000ms EASING: linear LOOP: infinite DIRECTION: normal
 PROPERTIES: background-position
```

**B) Fade-in — section entrance**
```
Trigger: first paint + step change (CSS @keyframes fadeIn)
Selector: #hero, .bento-card, #form-content > card
TIMELINE:
 t=0ms   opacity 0, translateY 30px
 t=600ms opacity 1, translateY 0
 DURATION: 600ms EASING: cubic-bezier(0.4,0,0.2,1) or ease (bundle shows both; preserve ease)
```

**C) Dialog — `md-dialog` [R2 cubic-bezier(0.4,0,0.1,1) Ia 500ms]**
```
Trigger: click Why / cookie bar / error
TIMELINE:
 SCOVER:  t=0→500ms  opacity 0→0.7 linear fill:forwards
 CONTAINER: t=0→83ms opacity 0→1 linear (::before)  (Ia/6)
 CONTENT: t=0→500ms opacity 0 (0–20% hold) →1 linear
 DIALOG: t=0→500ms scale 0.7→1 cubic-bezier(0.4,0,0.1,1)
```

**D) Chip placeholder rotate — interests**
```
Trigger: interval while input empty
Selector: .autocomplete placeholder attribute
TIMELINE: every rotateIntervalDuration ≈ 3000ms, cross-fade placeholder text
  t=0ms   "artificial intelligence"
  t=3000ms "agriculture" … cycle 14 items
 EASING: ease (opacity fade)
```

---

## 1.5 MICRO-INTERACTIONS

| Component | DEFAULT | HOVER | ACTIVE / FOCUS | Transition |
|---|---|---|---|---|
| Primary CTA (blue pill) | bg #1B6EF3 text white border none rounded-full px-24 py-12 shadow soft | bg #0B59D6 | scale 0.98 + bg #0046B8 | `transition: background 150ms cubic-bezier(0.4,0,0.2,1), transform 100ms` |
| Ghost CTA | bg #EDF0F5 text #1F2836 border #DADEE3 | bg white border #ACB5C2 | scale 0.98 | 150ms ease |
| Filter chip / skill chip | bg white border #E4E7ED text #3D4655 rounded-full | border #1B6EF3 text #1B6EF3 bg #E8F0FE | selected: bg #1B6EF3 text white border #1B6EF3 | 150ms |
| Step Next (disabled) | bg #ACB5C2 text white cursor not-allowed | — | — | — |
| Step Next (enabled) | bg #1B6EF3 | bg #0B59D6 | — | 150ms |
| Dialog scrim | opacity 0 | — | opacity 0.7 | 500ms linear |

---

## 1.6 STATE MACHINES

**A) Restore vs Start new — `un.restoreSession / restartQuestion`**
```
States: [idle] → dialog "Restore previous session? Would you like to restore…" →
        [restore] → hydrate interests/skills/experiences from localStorage / API
        [startNew] → wipe and go to Step 1
Trigger: app boot if saved session exists.
```

**B) Stepped flow — `hi.step / stepValid / targetStep / _buttonsDisabled`**
```
States: S1 Interests → S2 Motivations → S3 Skills → S4 Experiences → S5 Education → S6 Identity draft → S7 Explore
Guards: stepValid = (interests≥1 && skills≥3 …). _buttonsDisabled = !stepValid
Transitions: Next increments step if stepValid else shake (Whoa there red toast). Back decrements.
Error: fS.deletionRequirements blocks deletion if dropping below (1 exp/edu + 3 skills).
```

**C) Interests tag add**
```
idle --type "music production"--> validating --> added (completedMessage "🎉 Well done! …" tada) --> chips render
Placeholder rotation paused while input focused.
```

---

## 1.7 SCROLL CHOREOGRAPHY

- No parallax / pin / Lenis. Scroll is native (`html,body height 100%`).
- Sticky: header only (`--z-8 100`, `position: sticky top 0`). Stepped controls become sticky bottom on mobile (<768px) — `position: sticky bottom 0` with `#form-content` tall scroll.
- Chronology: hero (100vh) → bento (2–3 viewport heights) → stepped flow (tallest, ~600px per step, requires progressive scroll) → results grid infinite → gradient CTA → footer. Single document scroll, no horizontal scrollers.

---

## 1.8 TECHNICAL STACK

| Layer | Choice | Evidence |
|---|---|---|
| Framework | Lit (lit-html 2.x, lit-element) + Vite | `lit-app`, `lit$` `_$litDirective$`, `vite:preloadError` in bundle |
| Language | TypeScript compiled to ES module | `type:module crossorigin` script |
| Fonts | Google Sans 400/500/600/700 + Google Sans Text 400 + Sans Mono + Material Symbols Outlined | `<link fonts.googleapis>` |
| Icons | Material Symbols Outlined (`opsz 20..48`) | CSS import |
| State | Lit reactive properties (`@property step`, `@state _buttonsDisabled`) + localStorage for restore | `hi.prototype.step` etc. |
| Dialog | `md-dialog` + `md-checkbox` (Material Web) | `--md-checkbox-*` vars, `<md-dialog>` |
| Anim | CSS `@keyframes` + Web Animations API (`element.animate`) for dialog scale | `R2 cubic-bezier(0.4,0,0.1,1) Ia 500ms` in bundle |
| Security | reCAPTCHA v3 `6LdRzRYq…`, GTM `GTM-TNSB9VD4`, CSP nonce `meta[csp-nonce]`, TrustedTypes `lit-html` policy | `<script src recaptcha>`, GTM snippets |
| Cookie | Glue `cookienotificationbar` category 2A site `labs.google/careerdreamer` | bottom bar script |
| Build | Vite, assets `/career-dreamer/home/assets/index-*.js|css`, modulepreload polyfill | `TC=function(i){return"/career-dreamer/home/"+i}` |
| Backend | Google Labs / Career Dreamer API (auth-gated), Gemini for green-dot careers | `geminiAria`, `AI result` strings |

---

## 1.9 MOTION + COPY VOICE

**Motion philosophy:** Restrained google-labs. Single hero aurora band + fadeIn on card/step change + dialog scale. No scroll parallax, no physics, no GSAP orchestration. Timing is soft (500–600ms) with `cubic-bezier(0.4,0,0.1,1)` for dialog, `linear` for gradient. The playfulness is in *copy + color accents per step*, not heavy motion.

**Copy voice pattern:**
- Headline: fragment, imperative + playful — "Dream big." / "A playful way to explore career possibilities with AI" — short, optimistic, second-person inclusive.
- Instructions: direct + supportive — "Describe a career, industry, or field that interests you." / "Select up to 2 statements that apply to you (optional)." — plain, no jargon, always with dial-tone gentleness.
- Celebrations: `tada` + "Well done! You've added an interest." — encouraging, not cheesy.
- Why copy (long-form): explanatory + hedging — "Some may pique your interest… Remember: you are the best judge… feel free to disregard…". Always permission-giving + disclaimers ("not available in US only", "helps us improve").
- Errors: soft-admonishing — "Whoa there — You need at least one experience or education and three skills…" — never punitive.
- Preserve this hedged, permission-giving, playful-but-trustworthy voice when cloning step copy.

