"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * lovebook landing page — archetype 02 "Luxe Serif Minimal Editorial",
 * adapted to lovebook's own shoebox palette (ivory paper, dusty plum, the
 * serif as the human voice). The product's whole personality is restraint, so
 * the page is quiet by design: generous whitespace, serif headlines with one
 * italic accent, hairline dividers, motion that never shouts.
 *
 * Motion: GSAP ScrollTrigger one-shot reveals (Recipe 5), a self-drawing
 * connector line between the two avatars (Recipe 2), ambient float on the
 * hero mark (Recipe 6), a CSS moments marquee (Recipe 8). All honor
 * prefers-reduced-motion.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:5173";

export function HomeView() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Hero — the headline reads first, then the rest settles up.
      gsap.from("[data-hero] > *", {
        y: 22,
        opacity: 0,
        duration: 0.7,
        stagger: 0.09,
        delay: 0.1,
        ease: "power2.out",
      });

      // Every section: a gentle staggered rise when it enters view.
      const reveals = gsap.utils.toArray<HTMLElement>("[data-reveal]");
      reveals.forEach((el) => {
        gsap.from(el.children, {
          y: 28,
          opacity: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 78%" },
        });
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={root}
      /* overflow-x-clip (not -hidden) so the sticky nav stays glued to the
         viewport — overflow-x-hidden makes the root a scroll container and
         breaks position:sticky in several engines. */
      className="min-h-screen overflow-x-clip bg-paper text-ink"
    >
      <Nav />
      <Hero />
      <MomentsTicker />
      <TheMoment />
      <WhatItIsnt />
      <ThreeDoors />
      <Pairing />
      <Faq />
      <CtaClose />
      <Footer />
    </div>
  );
}

/* ─────────────────────────── Nav ─────────────────────────── */

function Nav() {
  return (
    <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6">
      <div className="lb-glass mx-auto flex w-full max-w-5xl items-center justify-between rounded-pill px-5 py-2.5 sm:px-6">
        <Wordmark />
        <Link
          href={APP_URL}
          className="rounded-pill bg-plum/90 px-5 py-2 font-sans text-[13px] font-medium text-print transition-all hover:bg-plum hover:-translate-y-0.5"
        >
          Open lovebook
        </Link>
      </div>
    </header>
  );
}

function Wordmark() {
  return (
    <span className="font-sans text-[12px] font-semibold uppercase tracking-[0.22em] text-ink-3">
      lovebook
    </span>
  );
}

/* ─────────────────────────── Hero ─────────────────────────── */

function Hero() {
  return (
    <section className="relative flex min-h-[92svh] w-full flex-col items-center justify-center overflow-hidden px-5 pb-14 pt-16 text-center sm:px-8">
      {/* The Silk Ribbons backdrop (LUMEN, seed 9015), full-bleed, slow ken-burns
          drift so it breathes without looping like a video. Kept at z-0 (not a
          negative z-index, which would paint it behind the page's paper bg and
          hide it) — the content panel sits above at z-10. */}
      <div className="absolute inset-0 z-0" aria-hidden>
        <img
          src="/lumen-silk-9015.webp"
          alt=""
          /* object-[center_28%] keeps the blown-out bottom-right of the ribbons
             below the fold so the hero doesn't read as a white void. */
          className="lb-kenburns h-full w-full object-cover object-[center_28%]"
          fetchPriority="high"
        />
        {/* Top scrim: melt the image into the nav. Gentle so the ribbons stay. */}
        <div className="absolute inset-0 bg-gradient-to-b from-paper/55 via-transparent to-transparent" />
        {/* Plum-tinted edge vignette — DARKENS the hot white corners (esp.
            bottom) with the brand plum instead of fanning more white onto them. */}
        <div className="absolute inset-0 [background:radial-gradient(120%_90%_at_50%_35%,transparent_55%,rgba(90,56,80,0.32))]" />
        {/* A whisper of plum wash over the whole thing ties it to the palette. */}
        <div className="absolute inset-0 bg-plum/[0.06] mix-blend-multiply" />
        {/* Clean handoff into the paper section below — only the bottom strip. */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-paper" />
      </div>

      <PairMark />

      {/* Liquid-glass panel — Apple-style frosted glass holds the text for
          contrast over the busy ribbons. */}
      <div
        data-hero
        className="lb-glass relative z-10 mt-9 flex max-w-2xl flex-col items-center rounded-[28px] px-7 py-10 sm:px-12 sm:py-12"
      >
        <h1 className="font-display text-[clamp(40px,7vw,78px)] font-medium leading-[1.04] tracking-[-0.02em] text-ink">
          One feed.
          <br />
          <span className="italic text-plum">Two people.</span>
        </h1>
        <p className="mt-6 max-w-xl font-serif text-[clamp(17px,2.4vw,21px)] leading-relaxed text-ink-2">
          Post a moment, your person sees it. No replies, no metrics, no
          audience — a quiet shared space that belongs to neither WhatsApp nor
          Instagram.
        </p>
        <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href={APP_URL}
            className="rounded-pill bg-plum px-8 py-3.5 font-sans text-[15px] font-semibold text-print shadow-[0_8px_22px_rgba(110,69,94,0.30)] transition-all hover:bg-plum-deep hover:-translate-y-0.5"
          >
            Start your space
          </Link>
          <Link
            href={APP_URL}
            className="font-sans text-[14px] font-medium text-ink-2 underline-offset-4 transition-colors hover:text-plum hover:underline"
          >
            I have an invite code
          </Link>
        </div>
        <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
          Pairs in seconds · Just the two of you
        </p>
      </div>
    </section>
  );
}

// Diverse couple pairs — any two people. Mixed across skin tone and gender so
// the mark says "whoever your person is." Rotates on a gentle interval.
const COUPLES: ReadonlyArray<readonly [string, string]> = [
  ["👩🏼", "👨🏿"], // white woman + black guy
  ["👩🏿", "👨🏼"], // black woman + white guy
  ["👩🏽", "👩🏻"], // two women
  ["👨🏾", "👨🏼"], // two men
  ["👩🏻", "👨🏽"], // light woman + brown guy
  ["🧑🏿", "🧑🏻"], // two people, dark + light
  ["👵🏼", "👴🏾"], // older couple (a parent + their person)
  ["👩🏾", "👨🏻"], // brown woman + light guy
];

/** Two avatars with a self-drawing connector — the whole product in one mark.
 *  The faces cycle through diverse couples so it reads as "any two people." */
function PairMark() {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((n) => (n + 1) % COUPLES.length), 2600);
    return () => clearInterval(id);
  }, []);

  const couple = COUPLES[i] ?? COUPLES[0]!;

  return (
    <div className="relative z-10 flex items-center justify-center" aria-hidden>
      <svg
        viewBox="0 0 200 60"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
      >
        <path
          className="lb-connector"
          d="M58 30 C 90 8, 110 8, 142 30"
          fill="none"
          stroke="#8a5f7d"
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{ ["--lb-len" as string]: "120" }}
        />
      </svg>
      <div
        className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full border border-print-edge bg-print text-[30px] shadow-[0_8px_24px_rgba(110,69,94,0.18)]"
        style={{
          ["--lb-rot" as string]: "-3deg",
          animation: "lb-float 4s ease-in-out infinite",
        }}
      >
        <span key={`a-${i}`} className="lb-face">
          {couple[0]}
        </span>
      </div>
      <div
        className="relative z-10 -ml-4 flex h-16 w-16 items-center justify-center rounded-full border border-print bg-plum-soft/20 text-[30px] shadow-[0_8px_24px_rgba(110,69,94,0.14)] bg-neutral-50/20 backdrop-blur-[2px]"
        style={{
          ["--lb-rot" as string]: "3deg",
          animation: "lb-float 4.6s ease-in-out 0.4s infinite",
        }}
      >
        <span key={`b-${i}`} className="lb-face">
          {couple[1]}
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────── Moments ticker ─────────────────────── */

function MomentsTicker() {
  const items = [
    "saw this on my walk",
    "sky was unreasonable this evening",
    "bought the good bread",
    "this song, all day",
    "the cat found a sunbeam",
    "thinking of you",
    "made it home",
    "look what was at the market",
  ];
  const doubled = [...items, ...items];
  return (
    <div className="border-y border-hair py-5" aria-hidden>
      <div className="overflow-hidden">
        <div className="lb-marquee-track flex gap-3">
          {doubled.map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="whitespace-nowrap rounded-pill border border-hair bg-print px-5 py-2 font-serif text-[14px] italic text-ink-3"
            >
              “{item}”
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── The moment ─────────────────────── */

function TheMoment() {
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-14 px-6 py-28 sm:px-8 lg:grid-cols-2">
      <div data-reveal>
        <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.2em] text-ink-3">
          The whole product
        </p>
        <h2 className="mt-4 font-display text-[clamp(30px,4.4vw,48px)] font-medium leading-tight tracking-[-0.02em]">
          You post. They see it.{" "}
          <span className="italic text-plum">That’s it.</span>
        </h2>
        <p className="mt-6 max-w-md font-serif text-[18px] leading-relaxed text-ink-2">
          A photo. A voice note. One line of text. It lands at the top of the
          one feed the two of you share — newest first, no algorithm deciding
          what surfaces. They’ll see it whenever they next look.
        </p>
        <p className="mt-4 max-w-md font-serif text-[18px] leading-relaxed text-ink-2">
          There’s a heart to tap back. Nothing else to do. No thread asking for
          a reply, no count to chase.
        </p>
      </div>

      {/* A mock feed card — the postcard moment. */}
      <div data-reveal className="flex justify-center">
        <div className="w-full max-w-sm">
          <div
            className="rounded-print border border-print-edge bg-print px-6 pb-4 pt-6 shadow-[0_18px_44px_rgba(43,36,41,0.10)]"
            style={{ rotate: "-0.6deg" }}
          >
            <span className="block font-display text-[34px] leading-[0.4] text-plum opacity-40">
              “
            </span>
            <p className="mt-2 font-serif text-[20px] leading-relaxed text-ink">
              Sky was unreasonable this evening. Wished you were on the balcony.
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-dotted border-hair-strong pt-3">
              <span className="font-serif text-[13px] italic text-ink-3">
                2h ago
              </span>
              <span className="font-mono text-[12px] text-ink-3">1 ❤️</span>
            </div>
          </div>
          <p className="mt-3 pl-1 font-serif text-[13px] italic text-ink-3">
            — from Ada, on her balcony
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── What it isn't ─────────────────────── */

function WhatItIsnt() {
  const gone = [
    "Likes, view counts, follower numbers",
    "Comments, threads, replies that demand a reply",
    "An algorithm choosing what you see",
    "A third person, ever",
    "An audience to perform for",
  ];
  return (
    <section className="border-y border-hair bg-paper-deep">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-24 sm:px-8 lg:grid-cols-2">
        <div data-reveal>
          <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.2em] text-ink-3">
            The personality is the restraint
          </p>
          <h2 className="mt-4 font-display text-[clamp(28px,4vw,44px)] font-medium leading-tight tracking-[-0.02em]">
            What lovebook <span className="italic text-plum">doesn’t</span>{" "}
            have.
          </h2>
          <p className="mt-6 max-w-md font-serif text-[18px] leading-relaxed text-ink-2">
            Everything that turns a small daily moment into content lives
            somewhere else. Here, a moment is just a moment.
          </p>
        </div>
        <ul data-reveal className="space-y-3">
          {gone.map((line) => (
            <li
              key={line}
              className="flex items-center gap-3 font-sans text-[15px] text-ink-3 line-through decoration-hair-strong sm:text-[16px]"
            >
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-hair text-[12px] text-ink-3 no-underline">
                ×
              </span>
              {line}
            </li>
          ))}
          <li className="flex items-center gap-3 pt-1 font-sans text-[15px] font-semibold text-plum sm:text-[16px]">
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-plum text-[12px] text-print">
              ✓
            </span>
            Just the two of you, and what you saw today.
          </li>
        </ul>
      </div>
    </section>
  );
}

/* ─────────────────────── Three doors ─────────────────────── */

function ThreeDoors() {
  const doors = [
    {
      label: "Photo",
      glyph: "◉",
      body: "Tap the camera, take it, send. No filter, no crop, no caption field. The photo is the post.",
    },
    {
      label: "Voice",
      glyph: "◠",
      body: "Hold to record, up to thirty seconds, release to send. Your actual voice, not typed-out words.",
    },
    {
      label: "One line",
      glyph: "“",
      body: "A single line, up to two hundred characters. Want to say more? Send another. Keep it light.",
    },
  ];
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-28 sm:px-8">
      <div data-reveal className="mx-auto max-w-2xl text-center">
        <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.2em] text-ink-3">
          Three doors
        </p>
        <h2 className="mt-4 font-display text-[clamp(28px,4vw,46px)] font-medium leading-tight tracking-[-0.02em]">
          Three ways to drop a moment.
        </h2>
      </div>
      <div data-reveal className="mt-16 grid gap-5 md:grid-cols-3">
        {doors.map((door) => (
          <div
            key={door.label}
            className="rounded-card border border-print-edge bg-print p-8 transition-transform hover:-translate-y-1"
          >
            <span className="font-display text-[40px] leading-none text-plum">
              {door.glyph}
            </span>
            <h3 className="mt-5 font-display text-[22px] font-medium text-ink">
              {door.label}
            </h3>
            <p className="mt-3 font-serif text-[16px] leading-relaxed text-ink-2">
              {door.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────── Pairing ─────────────────────── */

function Pairing() {
  const steps = [
    {
      n: "01",
      title: "Invite your person",
      body: "Generate a six-character code or a link. Send it however you already talk.",
    },
    {
      n: "02",
      title: "They claim it",
      body: "They enter the code or tap the link. The pair locks — just the two of you.",
    },
    {
      n: "03",
      title: "Your space opens",
      body: "One shared feed appears, empty and waiting. Drop the first moment.",
    },
  ];
  return (
    <section className="bg-plum text-print">
      <div className="mx-auto w-full max-w-6xl px-6 py-28 sm:px-8">
        <div data-reveal className="mx-auto max-w-2xl text-center">
          <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.2em] text-print/55">
            How it begins
          </p>
          <h2 className="mt-4 font-display text-[clamp(28px,4vw,46px)] font-medium leading-tight tracking-[-0.02em]">
            One pair. <span className="italic text-print/80">No one else.</span>
          </h2>
        </div>
        <div data-reveal className="mt-16 grid gap-10 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.n}>
              <span className="font-mono text-[13px] tracking-[0.1em] text-print/50">
                {step.n}
              </span>
              <h3 className="mt-3 font-display text-[24px] font-medium">
                {step.title}
              </h3>
              <p className="mt-3 font-serif text-[16px] leading-relaxed text-print/75">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── FAQ ─────────────────────── */

function Faq() {
  const items = [
    {
      q: "Can anyone else see our feed?",
      a: "No. A lovebook is just your two devices. Your moments are visible only to you and your paired person — never a third account, never the public.",
    },
    {
      q: "Who is it for?",
      a: "Any two close people who want a quiet space between them: couples, close friends, a parent and an adult child, siblings. One pair per person.",
    },
    {
      q: "What can I post?",
      a: "A photo, a voice note up to thirty seconds, or one line of text. Posts stay forever — nothing disappears, nothing auto-deletes.",
    },
    {
      q: "Is it on my phone?",
      a: "lovebook installs to your home screen like a real app, works offline for recent moments, and sends a gentle notification when your person posts.",
    },
    {
      q: "What if we stop?",
      a: "You can leave a pair any time. The shared feed is archived, read-only, and you’re both free to pair with someone new.",
    },
  ];
  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-28 sm:px-8">
      <div data-reveal>
        <h2 className="text-center font-display text-[clamp(26px,3.6vw,40px)] font-medium tracking-[-0.02em]">
          Fair questions.
        </h2>
        <div className="mt-12 space-y-3">
          {items.map((item) => (
            <details
              key={item.q}
              className="group rounded-card border border-hair bg-print px-6 py-4 open:border-plum-soft/40"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between font-sans text-[16px] font-medium text-ink [&::-webkit-details-marker]:hidden">
                {item.q}
                <span
                  aria-hidden
                  className="ml-4 font-display text-[22px] text-plum transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 font-serif text-[16px] leading-relaxed text-ink-2">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── CTA close ─────────────────────── */

function CtaClose() {
  return (
    <section
      data-reveal
      className="mx-auto w-full max-w-4xl px-6 py-28 text-center sm:px-8"
    >
      <h2 className="font-display text-[clamp(32px,5.2vw,60px)] font-medium leading-[1.06] tracking-[-0.02em]">
        A quiet place,
        <br />
        <span className="italic text-plum">just for the two of you.</span>
      </h2>
      <div className="mt-10">
        <Link
          href={APP_URL}
          className="inline-block rounded-pill bg-plum px-10 py-4 font-sans text-[16px] font-semibold text-print transition-all hover:bg-plum-deep hover:-translate-y-0.5"
        >
          Start your space
        </Link>
      </div>
      <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-4">
        Free · No audience · No metrics
      </p>
    </section>
  );
}

/* ─────────────────────── Footer ─────────────────────── */

function Footer() {
  return (
    <footer className="border-t border-hair">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-9 sm:flex-row sm:px-8">
        <Wordmark />
        <p className="font-serif text-[13px] italic text-ink-3">
          One feed, two people.
        </p>
        <div className="flex gap-5 font-sans text-[13px] text-ink-3">
          <Link href="/privacy" className="transition-colors hover:text-plum">
            Privacy
          </Link>
          <Link href="/about" className="transition-colors hover:text-plum">
            About
          </Link>
          <Link href={APP_URL} className="transition-colors hover:text-plum">
            Open app
          </Link>
        </div>
      </div>
    </footer>
  );
}
