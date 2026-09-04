# Injection Court — Contract Specification

**Design only. No implementation in this document or alongside it.**
Written for TASK 1 / CHECKPOINT 1 per `AGENT_INSTRUCTIONS.md`. Scope authority: `README.md`.

APIs referenced here are taken from the boilerplate's own `contracts/football_bets.py` and
`contracts/PatternTest.py`, and from `genlayer-project-boilerplate/CLAUDE.md`'s API reference
(`gl.nondet.web`, `gl.nondet.exec_prompt`, `gl.eq_principle`, `gl.vm.run_nondet`) — not
invented.

---

## 1. Storage model

One `TreeMap[str, Case]` keyed by `case_id`, plus a `u256` counter to generate ids, following
the `TreeMap` + `@allow_storage @dataclass` pattern used in `football_bets.py`.

```python
@allow_storage
@dataclass
class Case:
    id: str
    incident_url: str
    agent_config: str          # JSON-encoded string — see §3 (nested structures in
                                # TreeMap-backed storage must be strings; PatternTest.py
                                # Pattern 7)
    damage_description: str
    filer: Address
    status: str                # "filed" | "resolved"
    verdict: str                # "" until resolved, then one of the four values
    reasoning: str               # "" until resolved
    filed_at: str                 # ISO 8601, set from gl.message context at file time
    resolved_at: str              # "" until resolved
```

```python
class InjectionCourt(gl.Contract):
    cases: TreeMap[str, Case]
    case_count: u256

    def __init__(self):
        self.case_count = u256(0)
```

`case_id` is generated as a zero-padded counter (`f"case_{int(self.case_count):06d}"`),
mirroring the deterministic-id pattern in `football_bets.py` (`bet_id`). A counter is simpler
and unambiguous compared to hashing inputs, and avoids collision handling.

## 2. Method signatures

Exactly the four methods named in `README.md`, no more:

```python
@gl.public.write
def file_case(self, incident_url: str, agent_config: str, damage_description: str) -> str:
    """Opens a case. Returns the new case_id."""

@gl.public.write
def investigate(self, case_id: str) -> dict:
    """Validators fetch incident_url, evaluate agent_config, return
    {"verdict": str, "reasoning": str}. Also updates stored case state."""

@gl.public.view
def get_case(self, case_id: str) -> dict:
    """Public read of one case."""

@gl.public.view
def list_cases(self) -> list:
    """Public read of every case (docket listing)."""
```

`verdict` is always one of exactly four string literals: `"developer"`, `"user"`, `"agent"`,
`"unforeseeable"`. No other value is valid contract state.

## 3. `agent_config` schema — three options for the PM to choose from

The submission must be structured enough that a validator can judge "were the protections
reasonable" (`README.md`, Open questions). All three are passed as a JSON string (per the
`TreeMap` nested-structure constraint) and parsed with `json.loads` inside the contract.

### Option A — Free text

A single prose string describing the agent's setup, written by the filer in their own words.

- **Pros:** trivial to file, no schema to learn, fits any architecture.
- **Cons:** validators must independently extract "what protections existed" from prose
  before they can judge it — this is exactly the kind of open-ended interpretation `README.md`
  already warns against for the verdict itself ("an open-ended text verdict breaks validator
  consensus"). The same risk applies one level up: if the *evidence* is unstructured, two
  validators can reasonably disagree about what claims were even made, which threatens
  consensus even with a bounded verdict.

### Option B — Fully structured checklist

A fixed JSON schema of checkable claims, no free text:

```json
{
  "instruction_content_separation": true,
  "user_confirmation_required_for": ["financial_transfer", "external_api_call"],
  "tool_access_scope": ["read_email", "send_payment"],
  "input_trust_boundary": "untrusted_web_content",
  "monitoring_or_alerting": false,
  "system_prompt_excerpt": "You are a helpful assistant..."
}
```

- **Pros:** every field is directly checkable against the fetched page and the incident —
  validators compare concrete claims, not prose.
- **Cons:** real agent architectures vary enormously; a fixed field list will not capture
  every relevant protection or its absence, and filers may have no field for something that
  actually matters to their case. Risks becoming a Procrustean bed that makes `Unforeseeable`
  vs `Developer` harder to call correctly, not easier.

### Option C — Structured core + free-text context (hybrid) — **recommended**

The Option B fields, unchanged, plus one additional optional field:

```json
{
  "instruction_content_separation": true,
  "user_confirmation_required_for": ["financial_transfer", "external_api_call"],
  "tool_access_scope": ["read_email", "send_payment"],
  "input_trust_boundary": "untrusted_web_content",
  "monitoring_or_alerting": false,
  "system_prompt_excerpt": "You are a helpful assistant...",
  "additional_context": "Free text for anything the structured fields don't capture."
}
```

- **Why recommended:** the structured fields give validators the same checkable claims as
  Option B — this is what actually gets compared to the fetched page. `additional_context` is
  explicitly informational, not a field a validator is asked to "match" — it's there so a
  filer isn't blocked from submitting a case just because their setup doesn't fit the fixed
  fields. It does not weaken consensus because **the equivalence principle only compares the
  `verdict` field of `investigate`'s output (§5), never the `agent_config` input or the
  `reasoning` output** — so free text anywhere in the input has no bearing on validator
  agreement. It only affects what the leader includes in its reasoning about the case.
- **Cost:** one extra field's worth of prompt-engineering care so the LLM treats
  `additional_context` as color, not as grounds to override the structured claims.

**PM decision needed:** confirm Option C, or pick A or B instead.

## 4. Validator prompt draft

Sent inside `investigate`'s leader function, after fetching `incident_url` via
`gl.nondet.web.render(incident_url, mode="text")` and loading the stored `agent_config`.

```
You are adjudicating an AI agent security incident for Injection Court.

INCIDENT
An AI agent visited the URL below and was manipulated by content on that page into taking a
harmful action, causing loss described as: {damage_description}

FETCHED PAGE CONTENT (this is the actual page the agent visited — read it for the injection
attempt):
{web_data}

AGENT CONFIGURATION AS SUBMITTED BY THE FILER
{agent_config_json}

Your job: assign exactly one verdict from this fixed list. Read the definitions carefully —
they are deliberately narrow so cases are decided the same way by every validator.

- "developer": The agent's own configuration was inadequate for content of this kind. Look
  specifically at instruction_content_separation, user_confirmation_required_for, and
  tool_access_scope against what actually happened. Choose this when a reasonable
  configuration change (e.g. requiring confirmation before this class of action, or not
  granting this tool access at all) would have prevented the harm.

- "user": The configuration was adequate, but the agent was pointed at this URL, or granted
  this level of tool access, in a context a reasonable operator should have recognized as
  risky. Choose this when the failure is in how the agent was deployed or directed, not how
  it was built.

- "agent": The configuration was adequate and the deployment was reasonable, and the injected
  content in the fetched page was not exceptionally sophisticated — a well-built, well-used
  agent could plausibly have resisted it, but this one made an autonomous bad call anyway.
  This is the default when neither "developer" nor "user" fits and the attack itself is not
  extraordinary.

- "unforeseeable": Choose this only when the injected content in the fetched page uses
  techniques a reasonable developer and reasonable user would not have anticipated or
  defended against, regardless of how the agent was built or deployed. This is the narrowest
  category — reserve it for genuinely novel or exceptionally well-disguised attacks, not for
  every successful injection.

Boundary rule between "agent" and "unforeseeable": if you can point to any known, common
prompt-injection technique already used in the fetched page (e.g. plain hidden text,
role-play instructions, fake system messages), that is not unforeseeable — it is at most
"agent". Reserve "unforeseeable" for attacks a reasonable person would call genuinely novel.

Respond in JSON only, no other text:
{
  "verdict": "developer" | "user" | "agent" | "unforeseeable",
  "reasoning": "2-4 sentences citing specific evidence from the fetched page and the agent
  configuration for why this verdict and not the others."
}
```

This mirrors the strict single-JSON-object instruction style used in `football_bets.py`'s
`_check_match` prompt (mandatory-JSON-only framing, explicit format, no prose wrapper).

## 5. Equivalence principle

**Decided in `README.md` and `ROADMAP.md`, not open for reconsideration: only the `verdict`
field is compared across validators. `reasoning` text is never compared.**

Implemented with `gl.vm.run_nondet` (typed) and a **custom validator function**, following the
partial-field-matching pattern in `PatternTest.py`'s `get_match_result` (Pattern 2), not
`gl.eq_principle.strict_eq()` — `strict_eq` would compare the entire JSON output including
`reasoning`, which is exactly what the plan rules out.

```python
def investigate(self, case_id: str) -> dict:
    case = self.cases[case_id]

    def leader_fn() -> dict:
        web_data = gl.nondet.web.render(case.incident_url, mode="text")
        prompt = _build_prompt(web_data, case.damage_description, case.agent_config)
        result = gl.nondet.exec_prompt(prompt, response_format="json")
        assert result["verdict"] in ("developer", "user", "agent", "unforeseeable")
        return result

    def validator_fn(leader_result) -> bool:
        if not isinstance(leader_result, glvm.Return):
            return False
        my_result = leader_fn()
        # Equivalence principle: verdict only. Reasoning is intentionally excluded.
        return leader_result.calldata["verdict"] == my_result["verdict"]

    result = gl.vm.run_nondet(leader_fn, validator_fn)

    case.status = "resolved"
    case.verdict = result["verdict"]
    case.reasoning = result["reasoning"]
    case.resolved_at = <timestamp>
    return {"verdict": result["verdict"], "reasoning": result["reasoning"]}
```

The stored `reasoning` is still the leader's own text (useful, public, and part of the
"public verdict + reasoning" requirement in `README.md`) — it is simply not what determines
consensus. This is the exact design the README already specifies ("Comparing only the verdict
is safest for consensus").

## Open item carried to Task 2

`assert result["verdict"] in (...)` inside `leader_fn` is a first line of defense against a
malformed LLM response, but is not itself the equivalence check — a leader that raises here
is surfaced as a non-`Return` to the validator, per Pattern 1 in `PatternTest.py`
(`get_match_result_raises`). Task 2 should confirm this failure path produces a sane contract
error rather than an unhandled exception, and decide whether a malformed verdict should retry
once before failing the case outright — not decided here, flagging for implementation.
