"use client";

import Link from "next/link";
import { Footer, MarginRule, Nav } from "@/components/court/Chrome";
import { Exhibit } from "@/components/court/Exhibit";
import { Pipeline, Verdicts } from "@/components/court/Sections";
import { Docket } from "@/components/court/Docket";
import { useReveal } from "@/lib/hooks/useScrollFx";

export default function Home() {
  const verdictsHead = useReveal<HTMLDivElement>();
  const pipelineHead = useReveal<HTMLDivElement>();
  const docketHead = useReveal<HTMLDivElement>();
  const whyHead = useReveal<HTMLDivElement>();

  return (
    <>
      <Nav />
      <MarginRule />

      <main className="shell">
        {/* Hero: the exhibit is the argument. */}
        <section className="hero">
          <div>
            <p
              className="eyebrow rise"
              style={{ "--d": "0.1s" } as React.CSSProperties}
            >
              Prompt injection · fault attribution · GenLayer
            </p>

            <h1
              className="display hero__question rise"
              style={
                { "--d": "0.22s", marginTop: "1.5rem" } as React.CSSProperties
              }
            >
              Whose fault
              <br />
              was <em>that?</em>
            </h1>

            <p
              className="prose hero__sub rise"
              style={{ "--d": "0.38s" } as React.CSSProperties}
            >
              An agent read a page. Something hidden in it told the agent to
              send $1,000 somewhere, and it did. Today there is no process for
              answering who was responsible — every incident is argued from
              scratch, then forgotten.
            </p>

            <div
              className="hero__actions rise"
              style={{ "--d": "0.52s" } as React.CSSProperties}
            >
              <Link href="/file" className="btn btn--agent">
                File a case
              </Link>
              <Link href="#docket" className="btn btn--ghost">
                Read the docket
              </Link>
            </div>
          </div>

          <div
            className="rise"
            style={{ "--d": "0.44s" } as React.CSSProperties}
          >
            <Exhibit />
            <p className="eyebrow" style={{ marginTop: "1rem", lineHeight: 1.7 }}>
              Exhibit A — the page as the agent received it
            </p>
          </div>
        </section>

        {/* The taxonomy */}
        <section className="section" id="verdicts">
          <div className="section__head reveal" ref={verdictsHead}>
            <h2 className="h2">Four verdicts, nothing else</h2>
            <p className="prose">
              A bounded outcome is what makes consensus possible — validators
              can agree on one of four words in a way they never could on free
              text. <strong>Agent</strong> is the one that does not exist
              anywhere else: built correctly, used correctly, and it still went
              wrong. That category only becomes necessary once software starts
              making its own calls.
            </p>
          </div>
          <Verdicts />
        </section>

        {/* The sequence */}
        <section className="section" id="how">
          <div className="section__head reveal" ref={pipelineHead}>
            <h2 className="h2">How a case moves</h2>
          </div>
          <Pipeline />
        </section>

        {/* The record */}
        <section className="section" id="docket">
          <div className="section__head reveal" ref={docketHead}>
            <h2 className="h2">The docket</h2>
            <p className="prose">
              Every case ever filed, live from the contract on Bradbury testnet.
              Rulings are public and permanent.
            </p>
          </div>
          <Docket />
        </section>

        {/* The honest answer to the obvious question */}
        <section className="section" id="why">
          <div className="reveal" ref={whyHead}>
            <h2 className="h2">Where&rsquo;s the money?</h2>
            <p className="prose" style={{ marginTop: "1.25rem" }}>
              Nowhere, deliberately. No payouts, no premiums, no bonds, no
              escrow. You cannot price a risk you cannot attribute, and nobody
              knows what share of agent failures are actually negligence,
              because nobody has ever counted.
            </p>
            <p className="prose" style={{ marginTop: "1.25rem" }}>
              A few hundred rulings in, this is a thing that does not exist
              today:{" "}
              <strong>
                an actual record of how agents fail and who was responsible when
                they did.
              </strong>{" "}
              Insurance and contracts get built on that. The record has to come
              first.
            </p>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
