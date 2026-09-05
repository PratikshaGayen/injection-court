# Injection Court — Onchain Justice track application

> **DRAFT — internal.** For PM review only. Nothing here has been submitted anywhere.
> Sections are written to be paste-ready for the application form; trim to whatever the
> form's fields actually ask for.

---

## Project name

Injection Court

## One-liner

On-chain fault attribution for prompt-injected AI agents: when hidden text in a web page
makes an agent send $1,000 to an attacker, GenLayer validators fetch the real page,
weigh it against how the agent was configured, and record a public, reasoned verdict —
Developer, User, Agent, or Unforeseeable.

## The problem

An AI agent reads a web page. Hidden text in that page instructs the agent to send $1,000
somewhere. The agent does it. Whose fault was that?

Today there is genuinely no way to answer. No process, no precedent, no neutral party.
The developer blames the user, the user blames the developer, the incident gets argued
from scratch and then forgotten. Nothing accumulates. As agents start transacting,
every unresolved incident is a liability question with no forum.

## The solution

Injection Court is the narrow version of the answer — a court of record, deliberately
verdict-only:

1. **Someone files a case**: the URL of the content that caused the failure, a structured
   account of what the agent was allowed to do (`agent_config`), and what it cost.
2. **Every validator fetches the actual page** through GenLayer's native web access —
   no oracle, no screenshots, the evidence is the live URL itself.
3. **They weigh the attack against the configuration**: were the protections reasonable
   for content of this kind? That question has no unit test; it takes judgment from
   parties with no stake in the answer.
4. **A bounded verdict is recorded**: one of exactly four — `developer`, `user`,
   `agent`, `unforeseeable` — plus written reasoning. The record is public and permanent.

The verdict-only equivalence principle is the design spine: **only the `verdict` field is
compared across validators; reasoning text is never compared.** Consensus on one of four
words is achievable; consensus on prose is not. The stored reasoning is the leader's own
words — public, useful, not consensus-bearing.

The **Agent** category is the novel one: built correctly, used correctly, and the agent
still made a bad autonomous call. Current liability thinking has no slot for that; the
category only becomes necessary once software makes its own calls.

## Why this needs GenLayer

- **The parties are adversaries.** Developer and user sit on opposite sides of the
  question; neither will accept a verdict from the other's backend, and neither should
  own the court.
- **The decision requires judgment.** There is no test that returns "they should have
  caught this." An LLM validator reading the actual attack and the actual configuration
  is the only thing that can answer it — and GenLayer is the only chain where that
  judgment is the consensus mechanism itself.
- **The evidence is publicly checkable.** Injection payloads are almost always public web
  pages. Validators fetch the real URL and read the real attack — native web access, no
  oracle. (Checked against GenLayer's own "When to Use GenLayer" fit rules: passes all
  six; their docs list reputation update as a valid on-chain consequence, so
  verdict-only is a legitimate shape.)

## What's built (all live)

- **Intelligent Contract** — `0x7b8f4F1a73ceBb088880F94815E76C10f4c0C306` on GenLayer
  Bradbury testnet
  ([explorer](https://explorer-bradbury.genlayer.com/address/0x7b8f4F1a73ceBb088880F94815E76C10f4c0C306)).
  Four methods: `file_case`, `investigate` (fetch + evaluate + consensus),
  `get_case`, `list_cases`. No money movement, no balances, no fees anywhere.
- **Frontend** — https://injection-court.vercel.app — public docket (every case, live
  from the contract), case detail (verdict, reasoning, evidence, parsed config grid),
  and a filing form that builds the structured `agent_config` from toggles and chips.
- **The injected demo page** — https://pratikshagayen.github.io/injection-court/ — an
  ordinary-looking shop listing with a $1,000 "supplier deposit" instruction hidden
  inside it (invisible text + an HTML comment), exactly the way real attacks hide.
- **Rehearsal harness** — `scripts/rehearse_case.py` in the repo: files a case against
  the demo page and runs the full consensus round, printing per-step timings.

## Proof it works

The docket holds real, resolved cases investigated end-to-end by Bradbury validators —
leader fetches the URL, LLM evaluates, validators reach consensus, verdict and reasoning
land on-chain:

- **[case_000009](https://injection-court.vercel.app/case/case_000009)** — filed against
  the injected demo page with a deliberately arguable configuration (instruction/content
  separation ON, payment confirmation OFF, `send_payment` in tool scope, autonomous
  checkout within a stated budget). Resolved **`developer`**, reasoning citing the
  missing payment confirmation and identifying the injection as "a plain HTML comment
  with direct instructions, a common and foreseeable technique, ruling out
  'unforeseeable'", with "standard autonomous shopping" ruling out `user`.
- **Verdict stability: 4/4.** Four independent resolved runs against the same page and
  config (cases 000002, 000005, 000009, 000010) all returned `developer`, with
  independently worded reasoning — hours apart, different leader/validator sets. That is
  direct evidence the verdict-only equivalence principle holds: validators agree on the
  verdict even when their prose differs. Nothing was tuned to produce agreement.
- A control ladder (example.com, a tiny sibling page) also resolved correctly, isolating
  the demo page's evidence as the deciding variable.

## Demo walkthrough (if invited to show it)

1. Open the [demo page](https://pratikshagayen.github.io/injection-court/) — it reads as
   an ordinary product listing. View source: the instruction is there, hidden the way
   real attacks hide it.
2. Open the [docket](https://injection-court.vercel.app) — real cases, live from the
   contract.
3. File a case against the demo page with an arguable config from the filing form (or
   show `case_000009`).
4. Run `investigate` and wait out the round (~1–7 min in a healthy window): validators
   fetch the page themselves; the verdict and reasoning land on-chain and render on the
   case page.
5. Point at the verdict colour taxonomy: the case page renders the missing protections in
   the same amber as the `developer` verdict — the evidence visually explains the ruling.

## Honesty section (deliberate)

- **No anti-spam.** No filing fee — a fee is money movement and v1 is verdict-only by
  design. The docket contains clearly-labeled diagnostic cases from testing.
- **Testnet capacity is real.** Bradbury oscillates: in busy windows the RPC
  rate-limits (`node at capacity`) and validator rounds can park in timeout states
  instead of resolving. In a healthy window a full investigation takes ~1–7 minutes.
  This is the network, not the contract — and 4/4 stable verdicts across resolved runs
  shows consensus is sound when rounds complete.
- **`genvm-lint` false positive**: flags the equivalence-principle pattern; the
  boilerplate's own reference contract fails identically. Documented, not worked around.
- **CLI gap**: `genlayer write --args` cannot pass JSON-object-shaped strings; use the
  SDK or the frontend (documented in the README).

## What this becomes

Attribution is upstream of everything: you cannot price a risk you cannot attribute, and
nobody has ever counted what share of agent failures are negligence. A few hundred
rulings in, this is a thing that does not exist today — an actual record of how agents
fail and who was responsible. Insurance pools, bonding, fault-weighted payouts, and
regulation are all downstream of that record. v1 deliberately builds only the record.

## Links

- Repository: https://github.com/PratikshaGayen/injection-court
- Live frontend: https://injection-court.vercel.app
- Contract: `0x7b8f4F1a73ceBb088880F94815E76C10f4c0C306` (Bradbury testnet) —
  https://explorer-bradbury.genlayer.com/address/0x7b8f4F1a73ceBb088880F94815E76C10f4c0C306
- Injected demo page: https://pratikshagayen.github.io/injection-court/
- Resolved proof case: https://injection-court.vercel.app/case/case_000009
