# AGENTS.md

Notes for coding agents working in this repo. See also `CLAUDE.md` for
release/deploy process notes.

## Dependency versions pinned below their "latest"

`pnpm outdated` will keep flagging these. Do not bump them without
re-checking the specific blocker noted — see
`.claude/skills/update-astro-stack/SKILL.md` for the full update
procedure and how to re-verify each one.

- **typescript stays on `^6.0.3`, not 7.x.** `@astrojs/check@0.9.10`
  declares `peerDependencies.typescript: "^5.0.0 || ^6.0.0"` — TS 7 is
  outside that range. Revisit once `@astrojs/check` (or whatever Astro
  ships as its type-checking peer at the time) adds TS 7 support.
- **`@vercel/og` is no longer used at all** (removed 2026-09-29). It was
  pinned to `^0.11.1` because `@vercel/og@1.0.3` (built on
  `satori@0.33.5`) switched its Node build from an inlined HarfBuzz WASM
  blob to loading a separate `hb.wasm` file via a `__dirname`-based path
  that fails silently inside Astro's bundled SSR/build output — the
  whole `astro build` aborts with no error message right after
  prerendering the first route, leaving `dist/` without any HTML pages.
  Confirmed by running `ImageResponse` directly outside of Astro
  (`ENOENT ... open './hb.wasm'` / a WASM `RuntimeError` killing the
  Node process). Rather than stay pinned on an unmaintained 0.x forever,
  OG image generation was migrated to `astro-og-canvas` — see below.
- Cypress on this machine (macOS, darwin-arm64) currently fails to launch
  at _any_ version tested (15.16.0, 15.21.1, 16.1.0) with
  `bad option: --no-sandbox` from `Contents/MacOS/Cypress` even after a
  full cache clear and reinstall (`rm -rf ~/Library/Caches/Cypress/<ver>`
  - `cypress install --force`). This is a local/environment issue, not a
    package-version issue — reproduced identically across three majors.
    `cypress` in `package.json` is on `^16.1.0` (latest, API-compatible —
    see the skill for the breaking-changes check performed). Run `pnpm
test` in CI or on a working local Cypress install to actually execute
    the e2e suite; don't trust a green `pnpm build`/`pnpm lint` alone as
    proof the suite passes.

## OG image generation (`src/pages/tutorials/[id]/og.png.ts`)

Uses `astro-og-canvas`'s `OGImageRoute` (Skia/CanvasKit-based, no browser
or `@vercel/og`/satori involved) — migrated from `@vercel/og` 2026-09-29,
see above for why. This is still the one thing on this repo that a
routine "bump the major" pass can silently break the entire static build
for. Always run a full `pnpm build` (not just `astro check`/`tsc`) after
touching `astro-og-canvas`, `canvaskit-wasm`, or `sharp`, and check
`dist/tutorials/*/og.png` actually exists and is a valid 1200×630 PNG —
`file dist/tutorials/*/og.png | head` should say so for every file.

Things worth knowing about this integration, discovered during the
migration:

- **`astro-og-canvas` has no blur/scrim/opacity support of its own.** It
  draws `bgImage` fully opaque, then text directly on top with no way to
  dim or soften the photo behind it. Dark title/description text over a
  busy, brightly-lit tutorial cover photo is close to unreadable without
  help. The fix implemented here: pre-process every cover with `sharp`
  (resize to the exact 1200×630 canvas, `.blur(12)`, composite a
  `#edf0f2` scrim at 55% opacity, re-encode as JPEG) and cache the
  result under `node_modules/.cache/og-covers/`, then hand _that_ file
  to `bgImage` instead of the original. This also incidentally shrank
  output file size from ~1.3MB to ~400KB per image (Skia's PNG encoder
  on a full-resolution photo produces much larger files than JPEG on a
  pre-blurred one) — if a future redesign drops the blur, re-check
  output file size isn't regressing back up.
- **Logo must be a raster image, not the SVG used in `Header.astro`.**
  `astro-og-canvas` decodes images via Skia's `MakeImageFromEncoded`,
  which doesn't rasterize SVG. The header brand mark
  (`src/images/frustfrei-wordmark.svg`, colors driven by CSS classes)
  has its fills baked in and is pre-rendered once to
  `src/images/frustfrei-wordmark-og.png` (520×70, 2× for retina at the
  200px display width used in the OG card). If the wordmark SVG changes,
  regenerate that PNG — it will silently keep showing the old logo
  otherwise, since nothing re-derives it automatically. See the update
  skill for the exact `sharp` command used to bake the CSS colors in and
  rasterize it.
- **The logo is drawn at a fixed position (top of the card)**, and the
  overall layout is a fixed template — there's no way to replicate the
  previous `@vercel/og` design's dual-image compositing (blurred
  full-bleed background _plus_ a separate sharp cropped cover thumbnail)
  or a bottom-right logo placement. The current design (full-bleed
  blurred+scrimmed cover, logo top-left, title/description stacked, a
  brand-blue bottom border) is an intentional redesign, not a bug.
- **pnpm requires `canvaskit-wasm` as an explicit direct dependency**
  (already added) — without it, `astro-og-canvas` throws a
  `__dirname is not defined` error at build time. This is a documented,
  thrown JS error (not a silent crash like the `@vercel/og` regression
  above), so it's easy to diagnose if it ever regresses.
