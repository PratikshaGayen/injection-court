import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import type { Case, TransactionReceipt } from "./types";
import { isVerdict } from "./types";

/**
 * Client for the deployed InjectionCourt contract.
 *
 * Reads come back from GenLayer as Map instances (and Maps nested inside
 * arrays), so every read is normalised to plain objects before it reaches
 * the UI.
 */

function toPlain(value: unknown): unknown {
  if (value instanceof Map) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of value.entries()) out[String(k)] = toPlain(v);
    return out;
  }
  if (Array.isArray(value)) return value.map(toPlain);
  return value;
}

function toCase(raw: unknown): Case {
  const o = toPlain(raw) as Record<string, unknown>;
  const verdict = String(o.verdict ?? "");
  return {
    id: String(o.id ?? ""),
    incident_url: String(o.incident_url ?? ""),
    agent_config: String(o.agent_config ?? ""),
    damage_description: String(o.damage_description ?? ""),
    filer: String(o.filer ?? ""),
    status: o.status === "resolved" ? "resolved" : "filed",
    verdict: isVerdict(verdict) ? verdict : "",
    reasoning: String(o.reasoning ?? ""),
  };
}

class InjectionCourt {
  private address: `0x${string}`;
  private client: ReturnType<typeof createClient>;

  constructor(address: string, account?: string | null) {
    this.address = address as `0x${string}`;
    this.client = InjectionCourt.build(account);
  }

  private static build(account?: string | null) {
    const config: Record<string, unknown> = { chain: testnetBradbury };
    if (account) config.account = account as `0x${string}`;
    return createClient(config as never);
  }

  updateAccount(account: string | null) {
    this.client = InjectionCourt.build(account);
  }

  /** Every case ever filed, newest first. */
  async listCases(): Promise<Case[]> {
    const raw = await this.client.readContract({
      address: this.address,
      functionName: "list_cases",
      args: [],
    });
    const list = toPlain(raw);
    if (!Array.isArray(list)) return [];
    return list.map(toCase).reverse();
  }

  async getCase(caseId: string): Promise<Case | null> {
    try {
      const raw = await this.client.readContract({
        address: this.address,
        functionName: "get_case",
        args: [caseId],
      });
      if (!raw) return null;
      return toCase(raw);
    } catch {
      return null;
    }
  }

  /** Opens a case. agentConfig must be a JSON string. */
  async fileCase(
    incidentUrl: string,
    agentConfig: string,
    damageDescription: string
  ): Promise<TransactionReceipt> {
    const hash = await this.client.writeContract({
      address: this.address,
      functionName: "file_case",
      args: [incidentUrl, agentConfig, damageDescription],
      value: BigInt(0),
    });
    return (await this.client.waitForTransactionReceipt({
      hash,
      status: "ACCEPTED" as never,
      retries: 30,
      interval: 5000,
    })) as TransactionReceipt;
  }

  /**
   * Sends the case to the validators. They fetch the incident URL themselves,
   * weigh it against the agent config, and return a verdict. Takes about a
   * minute on Bradbury.
   */
  async investigate(caseId: string): Promise<TransactionReceipt> {
    const hash = await this.client.writeContract({
      address: this.address,
      functionName: "investigate",
      args: [caseId],
      value: BigInt(0),
    });
    return (await this.client.waitForTransactionReceipt({
      hash,
      status: "ACCEPTED" as never,
      retries: 60,
      interval: 5000,
    })) as TransactionReceipt;
  }
}

export default InjectionCourt;
