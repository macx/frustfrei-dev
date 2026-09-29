---
name: update-astro-stack
description: Update Astro, TypeScript, astro-og-canvas and other project dependencies safely in this repo. Use when the user asks to check/update outdated packages, upgrade Astro, or update the OG image generation stack.
---

# Updating the Astro stack in frustfrei-dev

This repo has two dependencies that look like routine minor/major bumps
but have bitten us before. Read `AGENTS.md` first — it has the current
pinned versions and why. This skill is the _procedure_ for re-checking
those pins and rolling the rest forward.

## Procedure

1. **Always run `pnpm dlx @astrojs/upgrade` first**, before anything
   else in this list — even if Astro doesn't look outdated yet, or the
   user only asked about other packages. It's Astro's own migration
   tool and handles config/content-collection migrations that a plain
   `pnpm update astro` won't. Only skip it if the user says it was
   already run in this session.

2. **Survey.** `pnpm outdated`. Note every package and whether the bump
   is patch/minor (same major or, for `0.x`, same minor) or major.

3. **TypeScript: check `@astrojs/check`'s peer range before bumping.**

   ```
   npm view @astrojs/check peerDependencies
   ```

   TypeScript must satisfy that range. As of this writing
   `@astrojs/check@0.9.x` only accepts `^5.0.0 || ^6.0.0` — TS 7 is
   rejected. If a newer `@astrojs/check` widens the range, TS can move;
   otherwise leave `typescript` on the range in `AGENTS.md`.

4. **In-range updates first.** `pnpm update` (no `--latest`) rolls
   everything forward within its existing semver range. This is always
   safe to run before touching majors.

5. **For every package pnpm still lists as outdated after step 4**,
   decide per package:
   - **0.x → 0.(x+1) or patch-only major-in-changelog**: check the
     changelog/release notes for real breaking changes (not just a
     version bump). If it's patch-level under the hood (e.g. only a
     transitive dependency bump), it's safe — `pnpm add <pkg>@<version>`.
   - **Real major (1.x → 2.x, etc.)**: read the changelog for breaking
     API changes, `grep` the codebase for any removed/changed API
     surface before bumping. Don't assume "used by one file" means
     "safe to skim" — read that file.
   - **Compare type definitions for API-surface packages** (anything the
     code imports and calls directly, e.g. `@vercel/og`, `sharp`):
     ```
     cd /tmp && mkdir pkg-check && cd pkg-check
     npm pack <pkg>@<old> <pkg>@<new>
     tar xzf <pkg>-<old>.tgz && mv package old
     tar xzf <pkg>-<new>.tgz && mv package new
     diff old/package.json new/package.json   # engines, deps, peerDeps
     diff -r old/dist/*.d.ts new/dist/*.d.ts  # actual API changes, if any
     ```
     Identical `.d.ts` files strongly suggest a safe drop-in bump _if_
     the runtime behavior is also unchanged — but see step 6, because
     `@vercel/og` 1.0.x (used before the 2026-09-29 migration to
     `astro-og-canvas`, see `AGENTS.md`) proved identical types can still
     hide a runtime packaging regression that only a real build catches.

6. **OG image generation specifically: a `pnpm build` is the only real
   test.** `astro check` / `tsc --noEmit` will NOT catch a broken build
   here. `src/pages/tutorials/[id]/og.png.ts` renders 18+ images at
   _build_ time via `astro-og-canvas`'s `OGImageRoute` (backed by
   `canvaskit-wasm`/Skia) plus a `sharp` pre-processing step for
   background legibility (see `AGENTS.md` for why). This class of
   dependency — anything doing WASM-backed image/font rendering at
   build time — has already broken the entire static build silently
   once before (the `@vercel/og` 1.0.x regression: a broken WASM file
   path caused `astro build` to abort right after the first prerendered
   route with **no error printed**, `dist/` ending up with zero HTML
   pages, and a misleadingly successful `0` exit code). Treat any bump
   touching `astro-og-canvas`, `canvaskit-wasm`, `sharp`, or their
   transitive image/font-rendering internals with the same suspicion.
   **Always verify with a real build, not just types:**

   ```
   rm -rf dist node_modules/.cache/og-covers node_modules/.astro-og-canvas
   pnpm build
   find dist -name '*.html' | wc -l                # should be ~88, not 0
   find dist/tutorials -name 'og.png' | wc -l       # should match the tutorial count, not 0
   file dist/tutorials/*/og.png | head              # each: "PNG image data, 1200 x 630"
   ```

   Then eyeball at least one generated image (Read tool can render PNGs
   inline) — a build that "succeeds" can still produce illegible output,
   e.g. dark text directly over a busy unblurred photo. That's exactly
   what happened on the first `astro-og-canvas` migration attempt: build
   green, dimensions correct, but the title text was unreadable until
   the `sharp` blur+scrim pre-processing step in `og.png.ts` was added.
   Check a tutorial with a long title too (currently
   `barrierearme-responsive-navigation`) to confirm text wraps instead
   of overflowing the canvas.

   If page/image counts come back near-zero on a dependency bump, revert
   the offending package to the last known-good version recorded in
   `AGENTS.md` and stop — don't try to patch around a WASM/native crash.

7. **Cypress: verify launch works on the actual runner, not just that
   the version resolves.** After any Cypress bump: `pnpm test` (needs a
   preview server running — start one with `pnpm preview` in the
   background first, or run against `pnpm dev`). If Cypress fails to
   even launch with `bad option: --no-sandbox` (or similar) from
   `Contents/MacOS/Cypress`, that's a local/machine issue, not a
   version issue — confirmed previously by seeing the identical failure
   across three different Cypress majors even after a clean
   `rm -rf ~/Library/Caches/Cypress/<version>` +
   `pnpm exec cypress install --force`. Don't downgrade Cypress to
   "fix" that; note it and get a real pass from CI or a working machine
   before calling the suite green.

8. **Run the full validation chain, in order, on every change:**

   ```
   pnpm validate           # astro check
   pnpm build              # astro check && tsc --noEmit && astro build — the real test
   pnpm lint                # prettier --write — check `git diff --stat` after for
                             #   unexpectedly large reformatting from a prettier-plugin-astro bump
   pnpm test                # cypress e2e — see step 7 caveat
   ```

   Also skim `git diff --stat` for anything outside `package.json` /
   `pnpm-lock.yaml` — a `prettier-plugin-astro` major bump can reformat
   most `.astro` files at once (expected, but confirm it's whitespace
   only, e.g. `git diff <file>` on a sample, and that `pnpm build` still
   passes after the reformat).

9. **Watch for the `<Steps>` MDX/Prettier trap** documented in
   `CLAUDE.md`: after `pnpm lint`, if any new or edited top-level
   `<Steps>` block (not nested in `<TabItem>`) exists, run `pnpm build`
   before committing — Prettier can silently break the indentation of
   numbered lists inside `<Steps>`, and `astro build` fails with
   `Expected the closing tag </Steps>...`. Files already known to
   trigger this are excluded via `.prettierignore`.

10. **Update `AGENTS.md`** with any new pinned-version decision (what,
    why, what to re-check before bumping again) using the same format as
    the existing entries — this skill's step 3-7 is the "how", AGENTS.md
    is the "current state".

## If the brand logo changes

The OG card logo is a pre-rasterized PNG
(`src/images/frustfrei-wordmark-og.png`), not the SVG used live in
`Header.astro` (`src/images/frustfrei-wordmark.svg`) — `astro-og-canvas`
can't decode SVG. If the wordmark SVG or its brand colors change (see
the `.brand-frustfrei`/`.brand-shape`/`.brand-shape-label` fill rules in
`Header.astro`'s `<style is:global>` block), regenerate the PNG or the
OG cards will keep silently showing the old logo — nothing re-derives it
automatically, and no build step will flag it as stale:

```
sed \
  -e 's/class="brand-frustfrei"/class="brand-frustfrei" fill="#15232d"/' \
  -e 's/class="brand-shape"/class="brand-shape" fill="#004fcd"/' \
  -e 's/class="brand-shape-label"/class="brand-shape-label" fill="#fff"/' \
  src/images/frustfrei-wordmark.svg > /tmp/wordmark-og.svg

node -e "
require('sharp')('/tmp/wordmark-og.svg', { density: 300 })
  .resize({ width: 520 })  // 2x the 200px display width used in og.png.ts, for retina
  .png()
  .toFile('src/images/frustfrei-wordmark-og.png')
"
```

Update the hardcoded fill colors in the `sed` commands if the brand
palette changes, and re-run a full `pnpm build` afterward per step 6.
