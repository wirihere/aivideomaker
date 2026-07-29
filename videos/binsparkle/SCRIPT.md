# SCRIPT — Bin Sparkle contractor onboarding

> **Hand-written onboarding orientation** (not a scraped brand promo). This is the video shown on the welcome call to walk a new cleaner through how Bin Sparkle works. Content is exact by design — every fact (75/25 split, outcome-only checking, photo rule) has to be right.
>
> Wires into the HyperFrames renderer directly: the narration below drives TTS (Stage 5), the on-screen copy fills the composition's scenes (Stage 7). Brand look comes from `tokens.css`.

## Audience & tone
- **Audience:** a warm prospect on the welcome call (already applied, being onboarded). Not a cold scroll.
- **Awareness:** product-aware — they know Bin Sparkle exists, need to understand how it works for *them*.
- **Tone:** warm, plain, honest — Bin Sparkle's own voice ("Hamilton's friendliest bin cleaning service"). Conversational, 12-year-old comprehension. No hype.
- **Voice (TTS):** `en-NZ-MollyNeural` at ~−5% rate (local fit, friendly). Fallback `en-AU-NatashaNeural`.
- **Format:** vertical 1080×1920, ~75s. Seven scenes, one per topic.

## Framework
Plain orientation — each scene answers one question a new cleaner has, in the order they'd ask it. Close is "here's what to do next," not a sales CTA.

---

## The 7 scenes

### Scene 1 — How a job flows (≈0–12s)
**On-screen:** `How a job flows` → `Book → Claim → Clean → Paid`
**Narration:**
> Here's how Bin Sparkle works. A customer in your suburb books a clean. The job pops up on your dashboard. First cleaner to claim it gets it. You do the clean, snap a before and after photo, and tap done. We pay you your share. That's the whole loop.

### Scene 2 — What "done" means (≈12–24s)
**On-screen:** `What "done" means` → `Clean · Fresh · Photos · Bin back`
**Narration:**
> All we ask is the result. The bin clean — inside, outside, the lid and the wheels. Smelling fresh at the end. A before and after photo so we know it's done. And the bin back where you found it. How you get there is entirely up to you.

### Scene 3 — Hearing about jobs (≈24–34s)
**On-screen:** `Jobs come to you` → `Email alert · your suburbs · magic-link sign-in`
**Narration:**
> The moment a job lands in one of your suburbs, you get an email. You sign in with a one-tap magic link — no password. See it, claim it, done.

### Scene 4 — How we check your work (≈34–46s)
**On-screen:** `We check the result, not the method` → `Before + after photos, reviewed before payout`
**Narration:**
> Before we pay out, we look at your before and after photos. That's it. We're checking the bin's clean — not how you cleaned it. Your method, your gear, your call.

### Scene 5 — The money (≈46–56s)
**On-screen:** `You keep 75%` → `Paid by Stripe · a few working days`
**Narration:**
> You keep seventy-five percent of every job. We keep twenty-five for the platform — Stripe fees, the website, the alerts. When you mark a job done and the photos check out, Stripe sends your share to your bank, usually within a few working days.

### Scene 6 — Your independence (≈56–66s)
**On-screen:** `Your hours. Your method. Your business.` → `Work for others too`
**Narration:**
> You're an independent contractor, not an employee. You pick which jobs to take, when to work, and how to do them. You can clean for other people too. No exclusivity, ever.

### Scene 7 — Your next steps (≈66–76s)
**On-screen:** `Your next steps` → `Sign agreement → Set up Stripe → First clean`
**Narration:**
> Three things to get going. Sign the agreement. Set up Stripe so we can pay you. Then claim your first job — we'll look at that one closely, then it's business as usual. Welcome to Bin Sparkle.

---

## Self-check (onboarding, not promo)
1. ☑ Every fact accurate (75/25, outcome-only, photo rule, magic-link, Stripe timing).
2. ☑ Conversational — reads like one person explaining it, not a script.
3. ☑ 12-year-old comprehension — no jargon ("contractor" appears once, in context).
4. ☑ Matches Bin Sparkle's voice — warm, plain, honest.
5. ☐ Read aloud via TTS preview before final render (Stage 5).

## Build notes (for Stage 7)
- Visuals: clean text cards + simple icons/diagrams (a bin icon, a 75/25 split bar, a 3-step arrow). On-brand via `tokens.css`. No reliance on stock footage.
- Motion: reuse the design system's warm-community motion (soft entries, gentle drift) — keep it calm, this is orientation not a hype reel.
- End card: "Welcome to Bin Sparkle" + `binsparkle.nz/contractor/apply` is **not** needed here (viewer is already applying) — the next-steps card is the close.
