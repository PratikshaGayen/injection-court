"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  Footer,
  MarginRule,
  Nav,
  VERDICT_VAR,
} from "@/components/court/Chrome";
import { useCase, useInvestigate } from "@/lib/hooks/useInjectionCourt";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { useReveal } from "@/lib/hooks/useScrollFx";
import { VERDICT_MEANING } from "@/lib/contracts/types";
import type { AgentConfig, Verdict } from "@/lib/contracts/types";

/* The real stages of an investigation, paced against the ~60s a round takes
   on Bradbury. The last one stays lit until the receipt actually lands. */
const STAGES = [
  { at: 0, label: "Broadcasting the case" },
  { at: 8, label: "Validators fetching the page" },
  { at: 22, label: "Weighing it against the configuration" },
  { at: 40, label: "Reaching consensus on the verdict" },
  { at: 58, label: "Recording the ruling" },
];

function Deliberation() {
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const activeIndex = STAGES.reduce((acc, s, i) => (t >= s.at ? i : acc), 0);

  return (
    <div className="delib">
      {STAGES.map((s, i) => {
        const state =
          i < activeIndex ? "done" : i === activeIndex ? "active" : "waiting";
        return (
          <div className="delib__row" key={s.label} data-state={state}>
            <span className="delib__tick">
              {state === "done" ? "✓" : state === "active" ? "▸" : "·"}
            </span>
            {s.label}
          </div>
        );
      })}
      <p
        className="hint"
        style={{ marginTop: "0.9rem", fontFamily: "var(--font-prose)" }}
      >
        A round takes about a minute. Leaving this page will not stop it — the
        verdict is recorded on chain either way.
      </p>
    </div>
  );
}

function ConfigGrid({ raw }: { raw: string }) {
  let cfg: Partial<AgentConfig> | null = null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") cfg = parsed as AgentConfig;
  } catch {
    cfg = null;
  }

  if (!cfg) {
    return (
      <pre className="field__val" style={{ whiteSpace: "pre-wrap", margin: 0 }}>
        {raw}
      </pre>
    );
  }

  const list = (v: unknown) =>
    Array.isArray(v) && v.length > 0 ? v.join(", ") : "none";

  const cells: Array<{ k: string; v: string; bool?: boolean }> = [
    {
      k: "Instruction / content separation",
      v: cfg.instruction_content_separation ? "yes" : "no",
      bool: !!cfg.instruction_content_separation,
    },
    {
      k: "Monitoring or alerting",
      v: cfg.monitoring_or_alerting ? "yes" : "no",
      bool: !!cfg.monitoring_or_alerting,
    },
    {
      k: "Confirmation required before",
      v: list(cfg.user_confirmation_required_for),
      bool:
        Array.isArray(cfg.user_confirmation_required_for) &&
        cfg.user_confirmation_required_for.length > 0,
    },
    { k: "Tool access scope", v: list(cfg.tool_access_scope) },
    { k: "Input trust boundary", v: cfg.input_trust_boundary || "unspecified" },
  ];

  return (
    <div className="stack">
      <div className="configgrid">
        {cells.map((c) => (
          <div className="configcell" key={c.k}>
            <div className="configcell__k">{c.k}</div>
            <div
              className="configcell__v"
              data-bool={c.bool === undefined ? undefined : String(c.bool)}
            >
              {c.v}
            </div>
          </div>
        ))}
      </div>
      {cfg.system_prompt_excerpt ? (
        <div className="field">
          <div className="field__key">System prompt</div>
          <div className="field__val">{cfg.system_prompt_excerpt}</div>
        </div>
      ) : null}
      {cfg.additional_context ? (
        <div className="field">
          <div className="field__key">Added context</div>
          <div className="field__val">{cfg.additional_context}</div>
        </div>
      ) : null}
    </div>
  );
}

export default function CasePage() {
  const params = useParams<{ id: string }>();
  const caseId = params?.id;
  const { data: c, isLoading } = useCase(caseId);
  const { isConnected, connectWallet, isMetaMaskInstalled } = useWallet();
  const { mutateAsync, isPending } = useInvestigate();
  const head = useReveal<HTMLDivElement>();
  const evidence = useReveal<HTMLDivElement>();

  async function onInvestigate() {
    if (!caseId) return;
    if (!isConnected) {
      try {
        await connectWallet();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Could not connect the wallet"
        );
        return;
      }
    }
    try {
      await mutateAsync(caseId);
      toast.success("The verdict is on the record");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "The investigation did not complete"
      );
    }
  }

  const resolved = c?.status === "resolved" && c.verdict !== "";
  const verdict = (c?.verdict || "") as Verdict;
  const vcolor = resolved ? VERDICT_VAR[verdict] : "var(--type-dim)";

  return (
    <>
      <Nav />
      <MarginRule />
      <main className="shell">
        <div className="casehead reveal" ref={head}>
          <Link href="/#docket" className="eyebrow">
            ← Docket
          </Link>

          {isLoading ? (
            <p className="prose" style={{ marginTop: "1.5rem" }}>
              <span className="spinner" style={{ display: "inline-block" }} />{" "}
              Reading the case…
            </p>
          ) : !c ? (
            <div className="notice" style={{ marginTop: "1.5rem" }}>
              No case with that id is on the record.
            </div>
          ) : (
            <>
              <h1
                className="h2"
                style={{
                  marginTop: "1.1rem",
                  fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
                }}
              >
                {c.id}
              </h1>

              <div style={{ marginTop: "2rem" }}>
                {resolved ? (
                  <div
                    className="verdictcard"
                    style={{ "--v": vcolor } as React.CSSProperties}
                  >
                    <p className="eyebrow">Verdict</p>
                    <p className="verdictcard__label">{verdict}</p>
                    <p
                      style={{
                        marginTop: "0.9rem",
                        fontFamily: "var(--font-prose)",
                        fontSize: "0.9375rem",
                        color: "var(--type-dim)",
                        position: "relative",
                        zIndex: 1,
                        maxWidth: "58ch",
                      }}
                    >
                      {VERDICT_MEANING[verdict]}
                    </p>
                    <p className="verdictcard__reasoning">{c.reasoning}</p>
                  </div>
                ) : isPending ? (
                  <Deliberation />
                ) : (
                  <div className="stack">
                    <div className="notice notice--agent">
                      No verdict yet. Sending this case to the validators has
                      them fetch the page and rule on it — about a minute.
                    </div>
                    <div>
                      <button
                        className="btn btn--agent"
                        onClick={onInvestigate}
                        disabled={!isMetaMaskInstalled}
                      >
                        {isConnected
                          ? "Send to the validators"
                          : "Connect wallet and send"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div
                className="reveal"
                ref={evidence}
                style={{ marginTop: "3.5rem" }}
              >
                <p className="eyebrow" style={{ marginBottom: "0.5rem" }}>
                  Evidence
                </p>
                <div className="field">
                  <div className="field__key">Incident URL</div>
                  <div className="field__val">
                    <a href={c.incident_url} target="_blank" rel="noreferrer">
                      {c.incident_url} ↗
                    </a>
                  </div>
                </div>
                <div className="field">
                  <div className="field__key">What it cost</div>
                  <div
                    className="field__val"
                    style={{
                      fontFamily: "var(--font-prose)",
                      fontSize: "1rem",
                    }}
                  >
                    {c.damage_description}
                  </div>
                </div>
                <div className="field">
                  <div className="field__key">Filed by</div>
                  <div className="field__val">{c.filer}</div>
                </div>

                <p className="eyebrow" style={{ margin: "2.5rem 0 0.9rem" }}>
                  Agent configuration as submitted
                </p>
                <ConfigGrid raw={c.agent_config} />
              </div>
            </>
          )}
        </div>

        <Footer />
      </main>
    </>
  );
}
