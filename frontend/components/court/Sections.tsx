"use client";

import { VERDICTS, VERDICT_MEANING } from "@/lib/contracts/types";
import { VERDICT_VAR } from "./Chrome";
import { useRevealChildren, useScrollScrub } from "@/lib/hooks/useScrollFx";

/**
 * One mark per verdict. Same ring every time — a ring is "a verdict" — with a
 * different interior for who carries it. Unforeseeable gets the empty set,
 * because that is precisely what it means.
 */
function Mark({ verdict }: { verdict: (typeof VERDICTS)[number] }) {
  const interior = {
    developer: (
      <path
        data-draw
        d="M20 20l-4 4 4 4M28 20l4 4-4 4"
        style={{ "--len": 34 } as React.CSSProperties}
      />
    ),
    user: (
      <>
        <circle
          data-draw
          cx="24"
          cy="21"
          r="2.6"
          style={{ "--len": 20, "--d": "0.12s" } as React.CSSProperties}
        />
        <path
          data-draw
          d="M18.4 30.5a5.6 5.6 0 0 1 11.2 0"
          style={{ "--len": 22, "--d": "0.2s" } as React.CSSProperties}
        />
      </>
    ),
    agent: (
      <path
        data-draw
        d="M24 17.5l6.5 6.5-6.5 6.5-6.5-6.5z"
        style={{ "--len": 42 } as React.CSSProperties}
      />
    ),
    unforeseeable: (
      <path
        data-draw
        d="M18.5 29.5l11-11"
        style={{ "--len": 18 } as React.CSSProperties}
      />
    ),
  }[verdict];

  return (
    <svg className="verdict__mark" viewBox="0 0 48 48" aria-hidden="true">
      <circle
        data-draw
        cx="24"
        cy="24"
        r="15"
        style={{ "--len": 100 } as React.CSSProperties}
      />
      {interior}
    </svg>
  );
}

export function Verdicts() {
  const ref = useRevealChildren<HTMLDivElement>(".verdict");

  return (
    <div className="verdicts" ref={ref}>
      {VERDICTS.map((v, i) => (
        <article
          key={v}
          className="verdict"
          style={
            {
              "--v": VERDICT_VAR[v],
              "--d": `${i * 0.09}s`,
            } as React.CSSProperties
          }
        >
          <Mark verdict={v} />
          <h3 className="verdict__name">{v}</h3>
          <p className="verdict__def">{VERDICT_MEANING[v]}</p>
        </article>
      ))}
    </div>
  );
}

const STEPS = [
  {
    title: "Someone files a case",
    text: "The URL of the content that caused it, the configuration the agent was running, and what the failure cost.",
  },
  {
    title: "Validators fetch the page themselves",
    text: "Each one reads the live URL directly. Nobody adjudicates from a screenshot pasted into a form — the evidence is the page.",
  },
  {
    title: "They weigh it against the configuration",
    text: "Were the protections reasonable for content like this? That question has no unit test. It takes judgment, from parties with no stake in the answer.",
  },
  {
    title: "A verdict is recorded",
    text: "One of four, with the reasoning behind it. Only the verdict field is compared across validators, so consensus never hinges on wording.",
  },
];

export function Pipeline() {
  const scrub = useScrollScrub<HTMLDivElement>();
  const reveal = useRevealChildren<HTMLDivElement>(".step");

  return (
    <div
      ref={(node) => {
        scrub.current = node;
        reveal.current = node;
      }}
      className="pipeline"
    >
      <div className="pipeline__spine" aria-hidden="true">
        <i />
      </div>
      {STEPS.map((s, i) => (
        <div className="step" key={s.title}>
          <div className="step__num">{i + 1}</div>
          <div className="step__body">
            <h3 className="step__title">{s.title}</h3>
            <p className="step__text">{s.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
