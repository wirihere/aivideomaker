# Next session — pick up Singularity Convergence intro video here

> **Read order for the new session:**
> 1. `~/.claude/projects/<this>/memory/MEMORY.md` — read **`feedback_orchestrator_role.md`** FIRST. You are the orchestrator; the system + templates are tools you direct. Then skim the rest (~24 durable rules).
> 2. `docs/PROCESS.md` — workflow (Principle 0 + the 6 principles + the cycle).
> 3. `docs/SESSION-HANDOFF-2026-04-26-late.md` — broader project state (faq-quick template work parked).
> 4. **THIS FILE** — current video project state.
> 5. `videos/singularity-convergence/DESIGN.md` + `SCRIPT.md` + `STORYBOARD.md` — the creative plan you'll execute.

---

## Where we are

The intro video for **https://singularityconvergence.org/** is **plan-complete, asset-pull pending**.

**Done:**
- Step 1 — capture (12 screenshots, 4 SVGs: logo / favicon / cross-circuit / neural-tree, 6 sections, fonts Georgia + Arial, palette: cosmic black + gold + parchment cream)
- Step 2 — `DESIGN.md` (brand cheat sheet — sacred-cosmic register; restraint as discipline; light-as-elevation)
- Step 3 — `SCRIPT.md` (~100 spoken words + ~12s designed silence = 65-72s at -15% rate; voice `en-GB-RyanNeural`)
- Step 4 — `STORYBOARD.md` (10 beats, B0 cold open through B9 CTA; per-beat concept + visual + animation choreography + transitions + SFX; asset audit table; production architecture; visual-review hard rule)

**Pending — start here in the new session:**
- **Step 4.5 — pull + visually review stock photos** (the biggest unknown; do this carefully):
  - 1 candle in dark for B1
  - 1 hands-turning-aged-book-pages photo or short video for B2
  - 1 light-through-stained-glass / arched window photo for B6
  - 1 starfield / nebula for backgrounds (B0, B5, B9)
  - **Per memory rule `feedback_visual_review_assets.md`**: pull 6+ candidates per query, READ each one with the Read tool, reject anything that looks "stocky", overlit, posed, smiling-actor, or literal-cathedral-with-crucifix. Save rejected URLs to `assets/singularity-convergence/rejected.txt`.
- Step 5 — generate VO via `node scripts/fetch-tts-edge.mjs` with the script from `SCRIPT.md`. Voice: `en-GB-RyanNeural`. Rate: `-15%`. Output: `assets/voiceover/singularity-convergence.mp3` + `.vtt`. Then update STORYBOARD with real beat durations from VTT.
- Step 6 — build compositions per beat. **This is where the orchestrator role matters most** — read each beat in STORYBOARD.md, evaluate the storyboard's creative direction with your eyes (don't follow it slavishly if a moment feels off), build the comp, self-review for layout / asset placement / motion quality before moving to the next beat. Use techniques.md (`~/.claude/skills/website-to-hyperframes/references/techniques.md`) — pick 2-3 per beat, NOT just basic fade/scale.
- Step 6.5 — verify with `npm run verify -- --comp=index.html ...`. Address any motion-continuity / script-timing / brand-fidelity findings.
- Step 7 — `npx hyperframes lint` + `npx hyperframes validate` + preview. Surface preview to user. Render to MP4 only on explicit user approval.

---

## Critical creative decisions already made (don't relitigate)

- **Format: 9:16 vertical (1080×1920).** Phone-native; the brand's web design is centred-on-canvas anyway. Landscape variant deferred until 9:16 master is locked.
- **Duration: 72s (target).** This brand needs breathing room. Per user: "we can make longer videos to whatever it takes to get a great outcome."
- **Voice: `en-GB-RyanNeural` at -15% rate.** British male, low-key authority. Reads scripture without sounding preachy.
- **Music vibe: contemplative cinematic, NOT existing shortlist.** Single sustained piano + low drone + sparse harp. The system's `kinetic-pop` / `warm-community` / `documentary` shortlists are all WRONG for this brand. **Flag for music-shortlist gap** (`project_music_shortlist_gap.md` already notes this gap pattern). For this video, source the underscore manually if no fit exists.
- **No "AI/tech-cliché" stock.** No futuristic dashboards, no robot hands, no neural-network animations from stock libraries. The brand's own `cross-circuit.svg` and `neural-tree.svg` carry that thread perfectly.
- **No "happy actor" stock.** No smiling models, no posed people. The mood is solitude + reverence.
- **No new (non-palette) colours.** Black + gold + cream only. The faintly-red strikethrough in B2 ("the agenda") is the ONLY allowed exception — held for ~1 second to make the metaphor land, then removed.

---

## What's NOT in the storyboard (orchestrator: decide as you go)

- **The procedural atom emblem.** STORYBOARD.md says "recreate in CSS+SVG so we can animate it" — there's no ready-made asset. The new session needs to either: (a) author a custom SVG of the atom-orbit emblem (gold-stroked orbits + glowing core + soft halo), OR (b) extract the atom emblem from the actual page DOM (it's likely an animated SVG in the source HTML — check `capture/extracted/animations.json` and `capture/AGENTS.md`). Option (b) is cheaper if the source SVG is recoverable.
- **Music sourcing.** Existing shortlists don't fit. Either:
  - Source one track manually from Pixabay/Pexels with query "ambient cinematic piano contemplative" + visual review (listen, not just look)
  - OR build a new `sacred-cosmic` music shortlist for the project (codify the gap)
- **Whether to also render 16:9 / 1:1 variants.** The user said "9:16 only by default, re-run for other sizes". Default to 9:16 only; surface 16:9 as a follow-up question after the master is approved.

---

## Things the user explicitly asked / preferences captured this session

- **Visual review of fetched stock is mandatory** — `feedback_visual_review_assets.md` (in user memory). The eye is the only gate. Filenames + alt text lie.
- **You are the orchestrator** — `feedback_orchestrator_role.md` (in user memory, marked read-this-first). The system + templates are tools you direct, not autopilots.
- **We can make longer videos** — quality > speed; render time is not a constraint.
- **Find images of real people / things to suit the brand** — yes, the agreement is to pull stock + visually review. Lean on contemplative/sacred imagery (candle, hands+book, cathedral light) more than tech imagery — the brand's own SVGs handle the tech side.

---

## Failure modes to avoid

- **Shipping the storyboard's directions mechanically without creative judgment.** STORYBOARD.md is detailed but the orchestrator (you) still has to look at each beat as it comes together and ask "is this actually moving me, or is it just executing the plan?"
- **Settling for the first stock image returned.** The visual-review rule exists because top-3 results are usually generic. Pull 6-10 candidates per query, read every one, pick the one that lands.
- **Forcing music from the existing shortlists.** None of them fit. If you must use one, `quiet-premium` is closest, but better to source manually + flag the shortlist gap for codification later.
- **Adding non-palette colours.** Only the `#7a3a3a` strikethrough in B2 is allowed, briefly. Anything else breaks the visual identity.
- **Hard-cutting between beats.** This is a contemplative video. Even 0.4s cross-dissolves are tighter than this brand wants. Use velocity-matched CSS transitions or longer cross-fades. Hard cuts kill the spell.
- **Letting the verifier `watch` verdict pass.** Memory rule `feedback_silent_loop_not_skipped.md`: only `ship` ratifies. Iterate until clean.
- **Pinging the user with intermediate progress.** Memory rule `feedback_iteration_workflow.md`: silent internal loop until template + render are genuinely ready. Surface a frame strip + summary; let user decide render.

---

## Files in this project directory

```
videos/singularity-convergence/
├── DESIGN.md                       brand cheat sheet
├── SCRIPT.md                       narration backbone (~100 words)
├── STORYBOARD.md                   creative north star (10 beats, full direction)
├── NEXT-SESSION.md                 THIS FILE — handoff
├── capture/                        Step 1 capture artifacts
│   ├── DESIGN.md (deprecated stub) ← ignore; the real DESIGN.md is at parent
│   ├── AGENTS.md / CLAUDE.md       capture skill's notes
│   ├── screenshots/                12 scroll captures
│   ├── assets/
│   │   ├── cross-circuit.svg       USE: B7 (path-draw)
│   │   ├── neural-tree.svg         USE: B8 (path-draw + node pop-in)
│   │   ├── logo.svg                FYI (custom Georgia text used at video scale instead)
│   │   └── favicon.svg             SKIP
│   ├── extracted/
│   │   ├── tokens.json             colors / fonts confirmed
│   │   ├── visible-text.txt        every claim in script traces here
│   │   ├── asset-descriptions.md
│   │   ├── animations.json         CHECK for the atom emblem source
│   │   └── ...
│   └── meta.json
└── (NEW dirs to create in next session)
    ├── assets/stock/               visually-reviewed stock here
    ├── assets/voiceover/           VO + VTT here
    ├── compositions/               b0–b9 HTML files here
    └── index.html                  root assembly
```
