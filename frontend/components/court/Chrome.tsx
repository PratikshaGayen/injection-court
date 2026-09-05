"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePageProgress, useScrolled } from "@/lib/hooks/useScrollFx";
import type { Verdict } from "@/lib/contracts/types";

export const VERDICT_VAR: Record<Verdict, string> = {
  developer: "var(--developer)",
  user: "var(--user)",
  agent: "var(--agent)",
  unforeseeable: "var(--unforeseeable)",
};

/** The court's mark. Outer ring turns once every forty seconds. */
export function Seal({ className = "seal" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <g className="seal__ring">
        <circle cx="12" cy="12" r="10.25" strokeDasharray="3 3.4" />
      </g>
      <circle cx="12" cy="12" r="6" />
      <path d="M12 8.4v7.2M9.2 10.6h5.6" />
    </svg>
  );
}

export function MarginRule() {
  const p = usePageProgress();
  return (
    <div className="marginrule" aria-hidden="true">
      <div
        className="marginrule__fill"
        style={{ "--p": p } as React.CSSProperties}
      />
    </div>
  );
}

export function Nav() {
  const scrolled = useScrolled();
  const pathname = usePathname();
  return (
    <nav className="nav" data-scrolled={scrolled}>
      <Link href="/" className="nav__mark">
        <Seal />
        INJECTION COURT
      </Link>
      <div className="nav__links">
        <Link href="/#docket" data-active={pathname === "/"}>
          Docket
        </Link>
        <Link href="/file" data-active={pathname === "/file"}>
          File a case
        </Link>
      </div>
    </nav>
  );
}

export function Footer() {
  const explorer =
    process.env.NEXT_PUBLIC_GENLAYER_EXPLORER ||
    "https://explorer-bradbury.genlayer.com";
  const address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
  return (
    <footer className="footer">
      <span>Injection Court — verdicts only, no money moves</span>
      {address ? (
        <a
          href={`${explorer}/address/${address}`}
          target="_blank"
          rel="noreferrer"
          style={{ color: "var(--type-dim)" }}
        >
          {address.slice(0, 10)}…{address.slice(-6)} ↗
        </a>
      ) : null}
    </footer>
  );
}

export function VerdictChip({
  verdict,
  status,
}: {
  verdict: Verdict | "";
  status: "filed" | "resolved";
}) {
  if (status !== "resolved" || !verdict) {
    return (
      <span className="chip chip--pending">
        <span className="chip__dot" />
        Awaiting verdict
      </span>
    );
  }
  return (
    <span
      className="chip"
      style={{ "--v": VERDICT_VAR[verdict] } as React.CSSProperties}
    >
      <span className="chip__dot" />
      {verdict}
    </span>
  );
}
