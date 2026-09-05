"use client";

import Link from "next/link";
import { useCases } from "@/lib/hooks/useInjectionCourt";
import { useRevealChildren } from "@/lib/hooks/useScrollFx";
import { VerdictChip } from "./Chrome";

function shortUrl(url: string) {
  try {
    const u = new URL(url);
    return u.host + (u.pathname === "/" ? "" : u.pathname);
  } catch {
    return url;
  }
}

export function Docket({ limit }: { limit?: number }) {
  const { data, isLoading, isError } = useCases();
  const cases = limit ? data?.slice(0, limit) : data;
  const ref = useRevealChildren<HTMLDivElement>(".docket__row", [cases?.length]);

  if (isLoading) {
    return (
      <div className="docket">
        <div
          className="docket__row is-in"
          style={{ color: "var(--type-faint)" }}
        >
          <span className="docket__id">
            <span className="spinner" style={{ display: "inline-block" }} />
          </span>
          <span className="docket__url">Reading the docket from Bradbury…</span>
          <span />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="notice">
        The docket could not be read from the network. The contract is at{" "}
        {process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "(unset)"} on Bradbury —
        check the RPC is reachable, then reload.
      </div>
    );
  }

  if (!cases || cases.length === 0) {
    return (
      <div className="notice notice--agent">
        No cases on the record yet.{" "}
        <Link href="/file" style={{ color: "var(--agent)" }}>
          File the first one →
        </Link>
      </div>
    );
  }

  return (
    <div className="docket" ref={ref}>
      {cases.map((c, i) => (
        <Link
          key={c.id}
          href={`/case/${c.id}`}
          className="docket__row"
          style={{ "--i": i } as React.CSSProperties}
        >
          <span className="docket__id">{c.id}</span>
          <span className="docket__url">{shortUrl(c.incident_url)}</span>
          <VerdictChip verdict={c.verdict} status={c.status} />
        </Link>
      ))}
    </div>
  );
}
