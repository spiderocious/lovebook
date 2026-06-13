---
name: lovebook-landing-page
description: The lovebook marketing landing page — where it lives, archetype, stack
metadata:
  type: project
---

The lovebook landing page is built in `apps/website` (Next 15, App Router, client component). Built 2026-06-13 following the dockito landing-page operating manual (`/Users/feranmi/codebases/2026/dockito/landing-page/CLAUDE.md` — 18 archetypes, animation-system + conversion-copy skills).

**Archetype: 02 Luxe Serif Minimal Editorial**, adapted to lovebook's own "shoebox" palette (ivory paper #f8f4ee, dusty plum #6e455e accent, Fraunces display + Source Serif body — the serif is the human voice). Chosen because the product's whole personality is restraint; the loud candy-pop of the leaksync website (the reference the user liked, but for a different product) was deliberately NOT copied.

Structure (`src/app/view.tsx`, one client component): Nav → Hero (serif headline "One feed. / Two people." + a two-avatar PairMark with a self-drawing SVG connector + dual CTA) → moments marquee ticker → "You post. They see it. That's it." with a mock postcard → "What lovebook doesn't have" struck-through restraint list → Three doors (photo/voice/one line) → Pairing 3-steps (on plum) → FAQ (`<details>`) → CTA close → footer. `page.tsx` just renders `<HomeView/>`.

**Motion:** GSAP + ScrollTrigger (added gsap dep; leaksync proved it deploys). Recipe 5 (IO/scrolltrigger staggered reveals via `[data-reveal]`), Recipe 2 (self-drawing connector, CSS `lb-connector`), Recipe 6 (ambient float on avatars), Recipe 8 (CSS moments marquee). All gated on `prefers-reduced-motion`.

**Two stale-template bugs fixed while here:** (1) `next.config.mjs` referenced `@repo/ui`/`@repo/core` (wrong scope) → fixed to `@lovebook/*` in both `transpilePackages` and webpack aliases. (2) layout now imports `@lovebook/ui/styles.css` (the :root CSS-variable tokens the Tailwind preset maps to) — without it every `var(--paper)`/`var(--plum)` class was undefined. Also moved `themeColor` to a `viewport` export (Next 15 deprecation).

The page is a CLIENT component importing NO `@lovebook/ui` JS (only the pure styles.css), which sidesteps the old server-component-imports-client-barrel build break. Fonts self-hosted via @fontsource. Verified: typecheck (7/7) + lint + `next build` (static prerender) + served-HTML smoke test all green.

See [[lovebook-product]]. Design refs the user keeps: dockito/landing-pages/screenshots + dockito/landing-page archetypes.
