"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Footer, MarginRule, Nav } from "@/components/court/Chrome";
import { useFileCase } from "@/lib/hooks/useInjectionCourt";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { useReveal } from "@/lib/hooks/useScrollFx";
import type { AgentConfig, Case } from "@/lib/contracts/types";

const ACTIONS = [
  "financial_transfer",
  "external_api_call",
  "send_email",
  "file_write",
  "code_execution",
];

const TOOLS = [
  "send_payment",
  "browse_web",
  "read_email",
  "shell",
  "database_write",
];

function Toggle({
  on,
  onChange,
  title,
  hint,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      className="toggle"
      data-on={on}
      onClick={() => onChange(!on)}
      aria-pressed={on}
    >
      <span className="toggle__text">
        {title}
        <span>{hint}</span>
      </span>
      <span className="switch" />
    </button>
  );
}

function ChipSet({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="chiprow">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            className="selectchip"
            data-on={on}
            aria-pressed={on}
            onClick={() =>
              onChange(on ? value.filter((v) => v !== o) : [...value, o])
            }
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

export default function FilePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const head = useReveal<HTMLDivElement>();
  const { address, isConnected, connectWallet, isMetaMaskInstalled } =
    useWallet();
  const { mutateAsync, isPending } = useFileCase();

  const [incidentUrl, setIncidentUrl] = useState("");
  const [damage, setDamage] = useState("");
  const [separation, setSeparation] = useState(false);
  const [monitoring, setMonitoring] = useState(false);
  const [confirmFor, setConfirmFor] = useState<string[]>([]);
  const [tools, setTools] = useState<string[]>([]);
  const [boundary, setBoundary] = useState("untrusted_web_content");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [context, setContext] = useState("");

  const urlValid = /^https?:\/\/.+/i.test(incidentUrl.trim());
  const ready = urlValid && damage.trim().length > 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
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

    const config: AgentConfig = {
      instruction_content_separation: separation,
      user_confirmation_required_for: confirmFor,
      tool_access_scope: tools,
      input_trust_boundary: boundary.trim() || "unspecified",
      monitoring_or_alerting: monitoring,
      system_prompt_excerpt: systemPrompt.trim(),
      additional_context: context.trim(),
    };

    try {
      await mutateAsync({
        incidentUrl: incidentUrl.trim(),
        agentConfig: JSON.stringify(config),
        damageDescription: damage.trim(),
      });
      await qc.refetchQueries({ queryKey: ["cases"] });
      const list = qc.getQueryData<Case[]>(["cases"]);
      toast.success("Case filed on the record");
      if (list && list.length > 0) {
        router.push(`/case/${list[0].id}`);
      } else {
        router.push("/#docket");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "The case could not be filed"
      );
    }
  }

  return (
    <>
      <Nav />
      <MarginRule />
      <main className="shell">
        <div className="casehead reveal" ref={head}>
          <p className="eyebrow">New filing</p>
          <h1
            className="h2"
            style={{ marginTop: "1rem", fontSize: "clamp(2rem, 5vw, 3.2rem)" }}
          >
            File a case
          </h1>
          <p className="prose" style={{ marginTop: "1.1rem" }}>
            Give the validators the page that caused it and an honest account of
            what the agent was allowed to do. They will read the URL themselves
            and decide who carries the failure.
          </p>
        </div>

        <form
          className="form"
          onSubmit={onSubmit}
          style={{ paddingBottom: "4rem" }}
        >
          <div>
            <label className="label" htmlFor="url">
              Incident URL
            </label>
            <input
              id="url"
              className="input"
              type="url"
              inputMode="url"
              placeholder="https://shop.example.com/listing/8842"
              value={incidentUrl}
              onChange={(e) => setIncidentUrl(e.target.value)}
              required
            />
            <p className="hint">
              The page that carried the injection. It has to be reachable —
              every validator fetches it independently.
            </p>
          </div>

          <div>
            <label className="label" htmlFor="damage">
              What the failure cost
            </label>
            <textarea
              id="damage"
              className="textarea"
              placeholder="The agent sent $1,000 to an address in the hidden instruction while completing a routine purchase."
              value={damage}
              onChange={(e) => setDamage(e.target.value)}
              required
            />
          </div>

          <div>
            <p className="label" style={{ marginBottom: "0.9rem" }}>
              Agent configuration
            </p>
            <div className="toggles">
              <Toggle
                on={separation}
                onChange={setSeparation}
                title="Instructions kept separate from retrieved content"
                hint="Fetched page text could not be read as commands."
              />
              <Toggle
                on={monitoring}
                onChange={setMonitoring}
                title="Monitoring or alerting in place"
                hint="Something would have flagged an unusual action."
              />
            </div>
          </div>

          <div>
            <label className="label">Confirmation required before</label>
            <ChipSet
              options={ACTIONS}
              value={confirmFor}
              onChange={setConfirmFor}
            />
            <p className="hint">
              Leave empty if the agent could act without asking.
            </p>
          </div>

          <div>
            <label className="label">Tools the agent could reach</label>
            <ChipSet options={TOOLS} value={tools} onChange={setTools} />
          </div>

          <div>
            <label className="label" htmlFor="boundary">
              Input trust boundary
            </label>
            <input
              id="boundary"
              className="input"
              value={boundary}
              onChange={(e) => setBoundary(e.target.value)}
              placeholder="untrusted_web_content"
            />
          </div>

          <div>
            <label className="label" htmlFor="sys">
              System prompt excerpt
            </label>
            <textarea
              id="sys"
              className="textarea"
              placeholder="You are a helpful autonomous shopping assistant…"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
            />
          </div>

          <div>
            <label className="label" htmlFor="ctx">
              Anything the fields above miss
            </label>
            <textarea
              id="ctx"
              className="textarea"
              placeholder="Optional. Context a validator should weigh but the schema does not capture."
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
          </div>

          {!isMetaMaskInstalled ? (
            <div className="notice">
              Filing writes to Bradbury testnet, so it needs a wallet. Install
              MetaMask, then reload this page.
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <button
              type="submit"
              className="btn btn--agent"
              disabled={!ready || isPending || !isMetaMaskInstalled}
            >
              {isPending ? (
                <>
                  <span className="spinner" />
                  Filing…
                </>
              ) : isConnected ? (
                "File the case"
              ) : (
                "Connect wallet and file"
              )}
            </button>
            {address ? (
              <span className="eyebrow">
                Filing as {address.slice(0, 6)}…{address.slice(-4)}
              </span>
            ) : null}
          </div>
        </form>

        <Footer />
      </main>
    </>
  );
}
