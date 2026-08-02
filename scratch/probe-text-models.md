# Text-model probe — 2026-08-02

Task: write a 20s TikTok script + Instagram caption for Bin Sparkle Full Care.
Full prompt + reference answer in `videos/binsparkle/SCRIPT-fullcare.md`.

| Model | Tier | Cost | Latency | Output | Result |
|---|---|---:|---:|---:|---|
| `anthropic:claude@sonnet-4-6` | — | — | 1378ms | — | **FAIL**: invalidModel: Invalid value for 'model'. Please select a valid text model. |
| `openai:gpt@5.4` | premium | $0.00652 | 4132ms | 1169 chars | OK |
| `google:gemini@3.1-pro` | premium | $0.05078 | 41995ms | 1021 chars | OK |
| `openai:gpt@5-mini` | budget | $0.00620 | 24013ms | 1281 chars | OK |
| `deepseek:v4-flash` | — | — | 621ms | — | **FAIL**: invalidModel: Invalid value for 'model'. Please select a valid text model. |

---

## `openai:gpt@5.4` — $0.00652, 4132ms

=== VIDEO SCRIPT ===

| # | Voiceover | On-screen text |
|---|---|---|
| 1 | Ever stood in your pyjamas, dragging a wheelie bin to the kerb? | In your pyjamas. At the kerb. With a wheelie bin. |
| 2 | Then later, you’re hauling it back in after the truck’s gone. | Out to the street. Back in again. Every collection day. |
| 3 | That’s Full Care from Bin Sparkle. We put your bins out and bring them back in. | Full Care by Bin Sparkle. We put them out. We bring them back in. |
| 4 | And once a month, we give the bins a proper wash too. | Plus a proper wash once a month. |
| 5 | Bin Sparkle Full Care. From fifty-five a month for one bin. | Bin Sparkle Full Care. From fifty-five a month for 1 bin. |

=== IMAGE POST ===
- On-image text (one short line, top-left placement)
  Out. Back. Washed.

- Caption (3 short paragraphs, ~50-60 words total, same angle as the video)
Ever stood in your pyjamas, dragging a wheelie bin to the kerb?

Full Care means we put your bins out every collection day, bring them back in after the truck, and give them a proper wash once a month.

Bin Sparkle Full Care. From fifty-five a month for 1 bin, seventy for 2, eighty-five for 3.

---

## `google:gemini@3.1-pro` — $0.05078, 41995ms

=== VIDEO SCRIPT ===
| # | Voiceover | On-screen text |
|---|---|---|
| 1 | Who else hates dragging the wheelie bin to the kerb in their pyjamas? | Hate dragging bins in your pyjamas? |
| 2 | You remember the rubbish right as you get into bed. | Remembering the rubbish in bed. |
| 3 | Bin Sparkle does the job. We put your bins out, pull them back in after the truck, and wash them once a month. | Bin Sparkle: Out, in, and washed monthly. |
| 4 | Three steps. That's it. | Three steps. *That's it.* |
| 5 | Get Full Care at Bin Sparkle dot NZ. From fifty-five a month. | Get Full Care at binsparkle.nz. From $55/month. |

=== IMAGE POST ===
On-image text: Top-left placement: Stinky bins? *We've got you, mate.*

Who else hates dragging the wheelie bin to the kerb in the pouring rain?

Bin Sparkle does the job for you. We pull your bins out to the street, walk them back up the driveway after the truck, and wash them out once a month.

Three steps. *That's it.* Grab a monthly Full Care plan today. From $55 a month.

---

## `openai:gpt@5-mini` — $0.00620, 24013ms

=== VIDEO SCRIPT ===
# | Voiceover | On-screen text
1 | "Who puts your wheelie bin out when you're still in your pyjamas?" | Who puts your wheelie bin out when you're in your pyjamas?
2 | "You hear the rubbish truck, but your bin's still on the driveway." | Hear the rubbish truck? Bin still on the driveway.
3 | "Bin Sparkle's Full Care puts your bins out on collection day, brings them back in after the truck, and washes them once a month." | Bin Sparkle Full Care: put out, bring back, wash monthly.
4 | "You stay in your pyjamas — no running to the kerb, no last-minute dash." | Stay in your pyjamas. No running to the kerb.
5 | "Sign up with Bin Sparkle. From fifty-five a month for one bin, seventy a month for two, eighty-five a month for three." | Sign up with Bin Sparkle. From fifty-five a month for one bin, seventy for two, eighty-five for three.

=== IMAGE POST ===
- On-image text (one short line, top-left placement)
Bins out. Bins back. Washed monthly.

- Caption
Sick of running to the kerb in your pyjamas?

Bin Sparkle's Full Care puts your bins out on collection day, brings them back in after the truck, and gives them a proper wash once a month.

Monthly plan only. From fifty-five a month for one bin, seventy a month for two, eighty-five a month for three.
