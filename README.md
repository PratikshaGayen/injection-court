# Injection Court

**Status:** scope locked — verdict only, no money movement.
**Event:** GenLayer Agent Tank (pitch mission → 2 Sep, build window 3–17 Sep, winners 25 Sep).

---

## The problem

An AI agent reads a web page. Hidden text in that page instructs the agent to send $1,000
somewhere. The agent does it.

Whose fault was that?

Right now there is genuinely no way to answer. There's no process, no precedent, and no
neutral party. The developer blames the user, the user blames the developer, the incident
gets argued from scratch and then forgotten. Nothing accumulates.

## What we're building

The narrow version, deliberately. A place where the question gets answered on the record.

```
Agent gets prompt-injected
        ↓
$1,000 loss occurs
        ↓
Someone files a case
        ↓
Evidence is submitted
        ↓
GenLayer validators investigate
        ↓
Who was at fault?
        ↓
Developer / User / Agent / Unforeseeable
        ↓
Public verdict + reasoning
```

## The verdict

A fixed four-way outcome plus written reasoning. Fixed categories matter — an open-ended
text verdict breaks validator consensus, a bounded one doesn't.

| Verdict | Meaning |
|---|---|
| **Developer** | The agent was built carelessly. Missing confirmation steps, no separation between instructions and retrieved content, over-broad tool access. |
| **User** | The operator gave the agent more authority than was reasonable, or pointed it at obviously untrusted input. |
| **Agent** | Built correctly, used correctly, and the agent still made a bad autonomous call. |
| **Unforeseeable** | The attack was good enough that no reasonable party would have caught it. |

The **Agent** category is the novel one. Nothing in current liability thinking has a slot
for "nobody was negligent and it still went wrong because the agent decided badly." That
category only becomes necessary in an agentic economy.

## Why this needs GenLayer

1. **The parties are adversaries.** The developer and the user sit on opposite sides of the
   question. Neither should own the system that answers it, and neither will accept a
   verdict from the other's backend.
2. **The decision requires judgment.** There is no test that returns "they should have
   caught this." Someone has to read the attack, look at what protections were in place,
   and decide whether that was reasonable.
3. **The evidence is publicly checkable.** This is the strongest part. Injection payloads
   are almost always public web pages — a poisoned document, a comment, a product listing.
   Validators fetch the actual URL and read the real attack rather than trusting a
   screenshot someone pasted into a form. Native web access, no oracle.

Checked against GenLayer's own "When to Use GenLayer" fit rules: passes all six. Their docs
list **reputation update** as a valid on-chain consequence alongside payouts, so a
verdict-only design is a legitimate shape rather than a watered-down one.

## Why there's no money in v1

You cannot price a risk you cannot attribute. Nobody knows what share of agent failures are
actually negligence, because nobody has ever counted. Attribution is upstream of insurance,
contracts, and regulation — the record has to exist before anything can be built on it.

This is the answer to "where's the money?" and it should be said out loud in the pitch
before a panelist raises it.

## Explicitly cut (do not re-add)

These were explored and removed on purpose. Each one made the concept worse.

- **Prevention gate** — pre-checking risky actions before they execute
- **Escrow / hold window** — holding transfers so they can be reversed
- **Bonds** — developers posting collateral
- **Insurance pool and premiums** — funding payouts
- **Fault-weighted payouts** — moving money based on the verdict

The scope is: incident → evidence → investigation → public verdict. Nothing else.

## Build scope (3–17 Sep, solo, Python + web)

**Intelligent Contract**
- `file_case(incident_url, agent_config, damage_description)` — opens a case
- `investigate(case_id)` — validators fetch the URL, evaluate against the agent config,
  return `{verdict, reasoning}` where verdict is one of
  developer / user / agent / unforeseeable
- `get_case(case_id)` / `list_cases()` — public read

**Frontend**
- Case filing form
- Case detail view showing evidence, verdict, and reasoning
- Public docket listing all rulings

**Demo**
- A real injected page hosted at a live URL
- File the case on stage, let validators read the actual attack, show the verdict land

Start from `genlayerlabs/genlayer-project-boilerplate`.

## Open questions

- Equivalence principle design: how much of the reasoning text is compared vs. just the
  verdict field? Comparing only the verdict is safest for consensus.
- What does an agent config submission look like concretely? Needs to be structured enough
  for validators to judge "were the protections reasonable."
- Anti-spam: nothing currently stops junk cases being filed. A filing fee is the obvious
  answer but that reintroduces money — decide before building.

## Context: what already exists on GenLayer

Confirmed built, do not overlap:

| Project | Covers |
|---|---|
| Internet Court (MetaMask, BNB Chain, OKX, 20+) | agent-to-agent commerce disputes |
| Intelligent Oracle | prediction markets, insurance resolution |
| Rally | AI-validator bot/sybil filtering |
| Collective Memory | agent marketplace quality layer |
| Docs examples | football prediction market, DAO proposal compliance, bounty rules, flight-delay insurance, freelance escrow |

Injection Court is distinct from Internet Court: that adjudicates commercial disputes
between two agent counterparties, this attributes fault for a security failure.

## Sources

- https://docs.genlayer.com/developers/intelligent-contracts/when-to-use-genlayer
- https://docs.genlayer.com/understand-genlayer-protocol/core-concepts/optimistic-democracy/finality
- https://docs.genlayer.com/understand-genlayer-protocol/core-concepts/transactions/transaction-statuses
- https://github.com/genlayerlabs/genlayer-project-boilerplate
