# Claim Mate v5 — "Ninety Days"

**Tagline:** Ninety days to reverse A.C.C.'s decision.
**Length:** ~25s · 1080x1920 · en-AU-WilliamNeural @ -12%
**Hook:** "Has A.C.C. denied your injury claim?" → DENIED stamp slams over A.C.C.
**Centerpiece:** The 90-day statutory deadline revealed as an insider fact ("Did you know…") — the urgency engine that makes viewers act now instead of later.

---

## What changed from v4

| v4 (shipped) | v5 (proposed) |
|---|---|
| Hook: "Did A.C.C. decline your injury treatment?" | Hook: "Has A.C.C. denied your injury claim?" — broader audience (claim-level, not just treatment) |
| Stamp reads `DECLINED` | Stamp reads `DENIED` — sharper verb matches the new hook |
| No deadline stated | **NEW scene: `90 DAYS` stamp reveal** — statutory appeal window surfaced as an insider fact |
| $0 ledger card says "YOU PAY · ACC PAYS OUR FEE" | Simpler `$0` card — "You pay nothing." No fee-mechanism claims |
| Step 2 card: "Check what ACC missed" | Step 2 card: "Find every mistake" (punchier) |
| CTA: "Start your appeal today" | CTA: "Start your appeal today" (kept — it works) |

Everything else — William voice, brand pulse, same photos + video, wordmark CTA — is the same chassis.

---

## Beat sheet

### Scene 1 — Hook (0.00 → 3.50) · dark canvas
Text stack on navy:
- `Has` (small, top)
- `A.C.C.` (280px hero, white)
- `denied your` (medium)
- `injury claim?` (medium)

At 1.05s: `DENIED` stamp slams across A.C.C. (red, angled, reuse v4 mechanic)

**Narration (0.05-3.10):** "Has A.C.C. denied your injury claim?"

### Scene 2 — 90 days reveal (3.50 → 7.20) · denied letter photo
DENIED stamp rides through the cut, crumples off at 4.20. As stamp clears, a huge `90` stamps in (cream/white, 260px, slight rotation) with `DAYS` beside it in smaller weight.

Text sequence synced to narration:
- `Did you know…` lands at 3.60 (small, top)
- `90` hero stamps at ~5.10 on the word "ninety"
- `DAYS` lands beside `90` at ~5.50
- `to appeal` lands at 6.20 (small, below)

**Narration (3.55-7.00):** "Did you know — you only have ninety days to appeal that decision?"

### Scene 3 — Step 01 (7.20 → 10.80) · workspace photo
Card: `01 STEP — Upload your letter`
**Narration:** "Upload your decision letter. It takes two minutes."

### Scene 4 — Step 02 (10.80 → 14.60) · laptop video
Card: `02 STEP — Find every mistake`
**Narration:** "We check your case. Find what A.C.C. missed."

### Scene 5 — Step 03 (14.60 → 18.60) · laptop video
Card: `03 STEP — Lodged in five days`
**Narration:** "We draft your review. Lodge it inside five days."

### Scene 6 — Cost beat (18.60 → 20.80) · woman photo
Minimal card:

```
┌───────────────────┐
│                   │
│   $0              │  ← hero, 180px, navy
│   ─              │
│   TO YOU          │  ← small caps, 30px, muted
│                   │
└───────────────────┘
```

**Narration (18.70-20.10):** "You pay nothing."

Short and clean — no claims about how the service is funded, no fee-mechanism framing. Just the cost to the viewer.

### Scene 7 — CTA (20.80 → 25.00) · cinematic wordmark
- `CLAIM ✓ MATE` wordmark with animated tick draw-in
- `claim-mate.co.nz`
- Subtitle: *"90 days from your decision letter"* — callback to scene 2

**Narration (20.90-24.20):** "Claim Mate. Start your appeal today."

---

## Narration (TTS-ready, ~44 words, ~22s at William -12%)

```
Has A.C.C. denied your injury claim?

Did you know, you only have ninety days to appeal that decision?

Upload your decision letter. It takes two minutes.

We check your case. Find what A.C.C. missed.

We draft your review. Lodge it inside five days.

You pay nothing.

Claim Mate. Start your appeal today.
```

**Note on "90 days":** The Accident Compensation Act 2001 s.134 sets the review lodgement window at 3 months (90-92 days depending on which months). "Ninety days" is factually accurate and lands harder than "three months" — real, countable, scarce.

---

## Why "Did you know" works

The word "only" is the urgency driver. "You have ninety days" is a plain statement; "you only have ninety days" is a warning. Wrapping it in "did you know" turns it from a warning into an insider tip — the viewer feels informed rather than lectured. Classic objection pattern: most people don't know there's a deadline at all, so by the time they start thinking about appealing they've already burned 40-60 days. Surfacing 90 as a number creates artificial scarcity around a real statutory fact.

---

## Risks / watchpoints

- **"Has" vs "Did":** "Has A.C.C. denied" is present-perfect — catches both recently-denied and still-disputing viewers. Strongest for the ad audience.
- **DENIED vs DECLINED:** one letter longer — stamp kerning may need a tweak. Build from v4's stamp CSS.
- **"90" stamp legibility:** At 260px on a photo background, the cream/white fill needs a subtle drop shadow or a translucent navy plate behind it for contrast. Mirror the v4 DECLINED stamp's shadow treatment.
- **Scene 6 minimalism:** `$0` alone risks feeling bare. If test render feels flat, add a tiny "No win, no worry" style line — but avoid any claim about how fees are actually paid.
