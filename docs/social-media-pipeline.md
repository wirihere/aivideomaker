# Social-media pipeline — how assets flow across repos

> **The question this answers:** "Do we need a centralized place for social
> media work? There's a repo for this and a repo for that — how do we
> structure it?"
>
> **The answer:** centralization already exists where it should (shared
> concerns). Each repo keeps its role. What was missing was the **contract**
> between them — how an asset produced in one repo lands as a post in
> another. This doc is that contract.

## The four layers (each repo has one job)

| Repo | Role | What lives here |
|---|---|---|
| `aivideomaker` | **Factory** — produces assets | Compositions (`.html`), rendered MP4s (`renders/<brand>/`), narration + mixes (`videos/<brand>/voiceover/`), brand image PNGs (`videos/<brand>/assets/`), scripts (`videos/<brand>/SCRIPT-*.md`) |
| `bin-sparkle-social` | **Distributor** — turns assets into scheduled posts | `social/posts/` (one file per post), `social/assets/` (post-ready images), brand-specific posting playbooks in `playbooks/` |
| `automation-template` | **Shared backbone** — secrets + cross-brand playbooks | `.env` (every API key), platform playbooks (`social-media.md`, `social-x.md`, `social-linkedin.md`, `social-fb-group.md`, etc.), `runware.md` (audio playbook) |
| `autonomous-runner` | **Scheduler** — fires unattended sessions on a cadence | `projects.json` (project registry), `waker.ps1` (the alarm clock), `agents/autonomous.md` (the safety-bottled agent) |

**Why not collapse them into one repo?** Three of the four already have their
own deploy pipeline, git history, and CLAUDE.md. Collapsing loses that. The
right move is to keep the layers distinct and make the **bridge** between them
trivial — which the new global permissions (allow everywhere) does.

## How an asset flows: aivideomaker → post

Worked example using the binsparkle-clean video built 2026-08-02.

### 1. Asset produced in aivideomaker

```
aivideomaker/
├── renders/binsparkle/binsparkle_2026-08-02_20-13-31-graded-yuv420.mp4  ← the video
├── videos/binsparkle/assets/clean-0[1-7]-*.png                            ← 7 images
├── videos/binsparkle/voiceover/binsparkle-clean-final.mp3                 ← mixed narration + bed
└── videos/binsparkle/SCRIPT-fullcare.md / SCRIPT-customer.md / etc.       ← scripts
```

**Renders stay local** (`.gitignore`'d — large, regeneratable). The MP4
above is the master file; copy it elsewhere when it's needed outside this
machine.

### 2. Bridge into bin-sparkle-social

`bin-sparkle-social/social/` is a git worktree on its own branch
(`social-content`), deliberately separated from the production code so a
content commit can never be swept into a `wrangler deploy`.

Two ways across, depending on what the post needs:

- **For posts that re-use a rendered MP4 or image:** copy the file into
  `bin-sparkle-social/social/assets/<post-slug>/`. Source files are large and
  gitignored in aivideomaker, so copying is the right move (don't reference
  across repos by path).
- **For posts that only need the script/caption text:** open the relevant
  `aivideomaker/videos/<brand>/SCRIPT-*.md` directly. With the global
  permission set to allow-everywhere, sessions in bin-sparkle-social can read
  aivideomaker files without prompts — no copy needed.

### 3. Draft the post in bin-sparkle-social

One file per post under `social/posts/`. Convention:

```
social/posts/<YYYY-MM-DD>-<slug>.md
```

Each post file contains:
- The asset filenames it depends on (relative to `social/assets/`)
- The platform-specific caption (TikTok, Instagram, Facebook, LinkedIn, X —
  each differs in length, hashtag conventions, link rules)
- The posting instructions or scheduled time

### 4. Publish via the automation-template playbooks

Posting method is per-platform — see `automation-template/social-media.md` for
the decision tree (API vs Playwright vs human). The playbooks already cover
each platform.

### 5. Schedule unattended runs (optional)

If a post is fully drafted and ready, register it as a task in
`bin-sparkle-social/tasks/next.md` and the autonomous-runner will pick it up
on the project's cadence (currently none registered — see
`autonomous-runner/projects.json`).

## What "centralized" actually means here

- **One place for shared secrets + playbooks** → `automation-template` (already
  is).
- **One place per brand's social content** → `bin-sparkle-social/social/` (already is).
- **One place for asset production** → `aivideomaker` (already is).
- **One place for scheduling** → `autonomous-runner` (already is).

The mistake to avoid: trying to centralize asset production *into* the social
repo, or social posting *into* aivideomaker. Both lose separation of concerns
and make deploys riskier. Keep the layers distinct.

## Adding a new brand

The pattern is per-brand:

1. Create `<brand>-social` repo (or branch on the existing brand repo) with
   `social/posts/`, `social/assets/`, `social/README.md`.
2. Mirror the `bin-sparkle-social/social/README.md` convention.
3. In aivideomaker, produce assets under `videos/<brand>/`.
4. Register the new repo in `autonomous-runner/projects.json` if you want it
   to run on a schedule.

## Reference

- **Posting playbooks index:** `automation-template/social-media.md`
- **Existing brand social folder (exemplar):** `bin-sparkle-social/social/README.md`
- **Asset factory state:** `aivideomaker/CLAUDE.md` (Start here block)
- **Scheduler:** `autonomous-runner/README.md`
