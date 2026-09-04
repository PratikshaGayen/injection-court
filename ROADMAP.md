# Injection Court — Project Roadmap

**PM-owned document. The coding agent reads this but does not edit it.**

Scope authority: `README.md`. Nothing in this roadmap adds scope beyond it.
Locked scope: incident → evidence → investigation → public verdict. No money movement.

## Timeline

| Marker | Date |
|---|---|
| Build window opened | 3 Sep |
| Today | 4 Sep |
| **Submissions close** | **17 Sep, 15:30 UTC** |
| Winners announced | 25 Sep |

13 calendar days remain. Phases are sequenced so a working demo exists by 13 Sep,
leaving 4 days of buffer.

## Track

**Onchain Justice** — "Disputes, appeals and rule enforcement decided from evidence."
Distinct from the live Internet Court project (commercial disputes between counterparties);
Injection Court attributes fault for a security failure. Confirm before Phase 7.

## Decisions already settled from the plan

These are **not** open. Do not reopen them.

| Question | Resolution | Source |
|---|---|---|
| Equivalence principle scope | Compare the **verdict field only**. Reasoning text is not compared. | README "Comparing only the verdict is safest for consensus" |
| Filing fee for anti-spam | **Not in v1.** A fee is money movement, which the locked scope excludes. Ship as a stated known limitation. | README scope lock + "Explicitly cut" list |
| Starting point | `genlayerlabs/genlayer-project-boilerplate` | README build scope |

## Still open — resolved at a checkpoint, not by the coding agent alone

| Question | Resolved at |
|---|---|
| Concrete shape of the `agent_config` submission | **Checkpoint 1** — agent proposes, PM approves |

## Verified environment facts

Boilerplate structure: `contracts/` (Python intelligent contracts), `tests/` (direct + integration),
`frontend/` (Next.js 15 + TypeScript + TanStack Query + Radix UI), `deploy/` (TypeScript), `config/`.
Requires Python ≥ 3.12 and the GenLayer CLI. Toolchain: `genvm-lint check`, `pytest tests/direct/`,
`gltest tests/integration/`, `genlayer network`, `genlayer deploy`.

---

## Phase 0 — Bootstrap (target: 4–5 Sep)

Goal: a running local scaffold, nothing custom yet.

- 0.1 Initialise git repo in this folder; keep `README.md` and `pitch.md` as-is.
- 0.2 Bring in the boilerplate structure (`contracts/`, `tests/`, `frontend/`, `deploy/`, `config/`).
- 0.3 Python 3.12 venv + `requirements.txt` installed. GenLayer CLI available.
- 0.4 Prove the toolchain works on the boilerplate's own example contract:
      `genvm-lint check` passes, `pytest tests/direct/` passes.
- 0.5 `cd frontend && npm install && npm run dev` serves.

→ **CHECKPOINT 0.** Stop. Report. Wait.

## Phase 1 — Contract specification (target: 5–6 Sep)

Goal: a written spec. **No contract implementation in this phase.**

- 1.1 Define the storage model: what a case record holds.
- 1.2 Define the four method signatures exactly as `README.md` states them:
      `file_case(incident_url, agent_config, damage_description)`,
      `investigate(case_id)`, `get_case(case_id)`, `list_cases()`.
- 1.3 **Propose the `agent_config` schema.** Structured enough for a validator to judge
      "were the protections reasonable." Present 2–3 options with trade-offs.
- 1.4 Draft the validator prompt: how the four verdicts are described to the LLM so the
      boundaries between developer / user / agent / unforeseeable are unambiguous.
- 1.5 State the equivalence principle exactly as it will be coded (verdict field only).

Written to `docs/CONTRACT_SPEC.md`.

→ **CHECKPOINT 1.** Stop. Report. Wait. PM picks the `agent_config` schema.

## Phase 2 — Contract implementation (target: 6–8 Sep)

Goal: `contracts/injection_court.py` complete and lint-clean.

- 2.1 Storage + `file_case` + `get_case` + `list_cases` (no LLM path yet).
- 2.2 `investigate` — web fetch of `incident_url`, LLM evaluation, bounded verdict output.
- 2.3 Pin a concrete GenVM runner version hash. No `test`/`latest` aliases.
- 2.4 `genvm-lint check contracts/injection_court.py` passes.

→ **CHECKPOINT 2.** Stop. Report. Wait.

## Phase 3 — Tests (target: 8–9 Sep)

- 3.1 Direct-mode tests (`pytest tests/direct/`): filing, reading, listing, input validation.
- 3.2 Integration tests (`gltest tests/integration/`): full `investigate` against a real URL,
      asserting the verdict is one of the four and reasoning is non-empty.
- 3.3 At least one test per verdict category, using purpose-built fixture pages.

→ **CHECKPOINT 3.** Stop. Report. Wait.

## Phase 4 — Deploy (target: 9–10 Sep)

- 4.1 `genlayer network` → select target network. Record which.
- 4.2 `genlayer deploy`. Record the contract address in the progress file.
- 4.3 File one real case against the deployed contract and run `investigate` end-to-end.
- 4.4 Record the transaction status and finality behaviour observed.

→ **CHECKPOINT 4.** Stop. Report. Wait. **This is the go/no-go gate.**

## Phase 5 — Frontend (target: 10–13 Sep)

Exactly the three surfaces in `README.md`. Nothing more.

- 5.1 Case filing form → `file_case`.
- 5.2 Case detail view: evidence, verdict, reasoning.
- 5.3 Public docket listing all rulings.
- 5.4 Wired to the deployed contract, not mocks.

→ **CHECKPOINT 5.** Stop. Report. Wait.

## Phase 6 — Demo (target: 13–15 Sep)

- 6.1 Host a real injected page at a live public URL.
- 6.2 Full rehearsal: file on stage → validators fetch the real attack → verdict lands.
- 6.3 Record timings. Note the slowest step.

→ **CHECKPOINT 6.** Stop. Report. Wait.

## Phase 7 — Submission (target: 15–16 Sep, one day of slack before the 17th)

- 7.1 Public GitHub repository, clean history, working README with setup steps.
- 7.2 Project application filled against the Onchain Justice track.
- 7.3 Links: repo, live frontend, deployed contract, demo injected page.
- 7.4 Submit. Editable until close, so submit early and refine.

→ **CHECKPOINT 7.** Final report.
