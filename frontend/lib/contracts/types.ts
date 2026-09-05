/**
 * Types for the InjectionCourt intelligent contract.
 * Mirrors contracts/injection_court.py — see docs/CONTRACT_SPEC.md.
 */

export const VERDICTS = ["developer", "user", "agent", "unforeseeable"] as const;
export type Verdict = (typeof VERDICTS)[number];

export interface Case {
  id: string;
  incident_url: string;
  agent_config: string;
  damage_description: string;
  filer: string;
  status: "filed" | "resolved";
  /** Empty string until the case is resolved. */
  verdict: Verdict | "";
  /** Empty string until the case is resolved. */
  reasoning: string;
}

/**
 * The agent_config schema — Option C from docs/CONTRACT_SPEC.md §3:
 * structured claims a validator can check, plus free-text context.
 */
export interface AgentConfig {
  instruction_content_separation: boolean;
  user_confirmation_required_for: string[];
  tool_access_scope: string[];
  input_trust_boundary: string;
  monitoring_or_alerting: boolean;
  system_prompt_excerpt: string;
  additional_context: string;
}

export interface TransactionReceipt {
  status?: string;
  hash?: string;
  [key: string]: unknown;
}

export const VERDICT_MEANING: Record<Verdict, string> = {
  developer:
    "The agent was built carelessly — missing confirmation steps, no separation between instructions and retrieved content, or over-broad tool access.",
  user: "The operator gave the agent more authority than was reasonable, or pointed it at obviously untrusted input.",
  agent:
    "Built correctly, used correctly, and the agent still made a bad autonomous call.",
  unforeseeable:
    "The attack was good enough that no reasonable party would have caught it.",
};

export function isVerdict(v: string): v is Verdict {
  return (VERDICTS as readonly string[]).includes(v);
}
