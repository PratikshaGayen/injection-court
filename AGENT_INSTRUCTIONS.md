# Coding Agent Instructions — Injection Court

You are the coding agent. A separate Project Manager supervises you through `PROGRESS.md`.

## Standing rules — apply to every task

1. **`README.md` is the scope authority.** If a task seems to require something outside it,
   stop and report. Do not add scope.
2. **The "Explicitly cut" list in `README.md` is permanent.** No prevention gate, no escrow,
   no bonds, no insurance pool, no fault-weighted payouts, no filing fee. Do not re-add.
3. **Execute exactly one numbered task block per run.** Do not run ahead.
4. **At every CHECKPOINT: stop, append a report to `PROGRESS.md`, and wait.**
   Do not start the next phase until the PM writes an approval into `PROGRESS.md`.
5. **Any blocker, uncertainty, ambiguity, or failing command → stop immediately** and write
   it into `PROGRESS.md` under `BLOCKED`. Do not guess. Do not work around it silently.
6. **Use the GenLayer skills available in this environment** rather than recalling API shapes
   from memory: `genlayer-dev:write-contract`, `genlayer-dev:genlayer-cli`,
   `genlayer-dev:direct-tests`, `genlayer-dev:integration-tests`, `genlayer-dev:genvm-lint`.
6a. **Environment note (resolved at Checkpoint 0):** `pytest tests/direct/` fails on native
   Windows — upstream bug in `genlayer-test==0.29.2`'s loader (`os.unlink` on a file whose fd
   is still open via `os.dup2`; valid on POSIX, not on Windows). Confirmed fixed by running
   the same suite under WSL Ubuntu (43/43 pass there vs 10/43 native). Run all
   `pytest tests/direct/` invocations through the WSL venv at `.venv-wsl/` (created via
   `python3 -m venv --without-pip` + `get-pip.py`, since `python3.12-venv` isn't installed and
   we're avoiding sudo). `genvm-lint` and `gltest` (integration) continue to run natively on
   Windows with `PYTHONIOENCODING=utf-8` set — only the direct-mode pytest path needs WSL.
7. **Never invent a GenLayer API.** If unsure of a signature, consult the docs/skills and
   cite what you found in the report.
8. **Pin concrete GenVM runner version hashes.** Never `test` or `latest` aliases.
9. Report failures honestly. A red test in the report is fine. A hidden red test is not.

## Progress report format

Append to `PROGRESS.md`. Never delete earlier entries.

```
## [Checkpoint N] <phase name> — <date, e.g. 6 Sep>
STATUS: COMPLETE | BLOCKED | PARTIAL

### Done
- <what was actually built, with file paths>

### Commands run and their real output
- `<command>` -> PASS / FAIL (+ the error if it failed)

### Decisions I had to make
- <decision> — <why> — <what I want confirmed>

### BLOCKED (omit if none)
- <exactly what stopped you and what you need to proceed>

### Ready for
- <the next task block>

AWAITING PM REVIEW.
```

---

# Task blocks — execute in order, one per run

## TASK 0 — Bootstrap

Set up the project scaffold in `D:/Genlayer/Hackathon/injection-court`.

- `git init` here. Do not modify `README.md` or `pitch.md`.
- Bring in the structure of `genlayerlabs/genlayer-project-boilerplate`:
  `contracts/`, `tests/direct/`, `tests/integration/`, `frontend/`, `deploy/`, `config/`.
- Create a Python 3.12+ venv and install `requirements.txt`.
- Confirm the GenLayer CLI is installed and reachable.
- Verify the toolchain works **on the boilerplate's own example contract before writing any
  of our own code**: `genvm-lint check` on it, then `pytest tests/direct/ -v`.
- `cd frontend && npm install && npm run dev` — confirm it serves, then stop it.

Do not write any Injection Court code in this task.

**-> CHECKPOINT 0. Report and stop.** Include the exact tool versions you got
(Python, GenLayer CLI, Node) and any install that failed.

---

## TASK 1 — Contract specification (no implementation)

Write `docs/CONTRACT_SPEC.md`. Design only — do not create `contracts/injection_court.py`.

1. **Storage model.** What one case record holds: id, incident_url, agent_config,
   damage_description, filer, status, verdict, reasoning, timestamps. Give concrete types.
2. **Method signatures**, exactly as `README.md` specifies:
   - `file_case(incident_url, agent_config, damage_description)`
   - `investigate(case_id)` returning `{verdict, reasoning}`, verdict in
     {developer, user, agent, unforeseeable}
   - `get_case(case_id)`, `list_cases()`
3. **`agent_config` schema — present 2 or 3 options.** It must be structured enough that a
   validator can judge "were the protections reasonable." Give each option's trade-offs.
   Recommend one. **The PM chooses. Do not pick for yourself.**
4. **Validator prompt draft.** Write how the four verdicts are explained to the LLM. The
   boundaries must be unambiguous — especially `agent` (built right, used right, still chose
   badly) vs `unforeseeable` (nobody would have caught it).
5. **Equivalence principle.** State it as it will be coded: **the verdict field is compared;
   the reasoning text is not.** This is already decided — implement it, do not re-evaluate it.

**-> CHECKPOINT 1. Report and stop.** The PM must approve the `agent_config` schema before
Task 2 begins.

---

## TASK 2 — Contract implementation

Implement `contracts/injection_court.py` using the PM-approved spec.

2a. Storage, `file_case`, `get_case`, `list_cases`. No LLM path yet. Lint clean.
2b. `investigate(case_id)`: fetch `incident_url` via GenLayer's native web access, evaluate
    the fetched content against the stored `agent_config`, return a bounded verdict plus
    reasoning. Apply the verdict-only equivalence principle.
2c. Pin the GenVM runner version hash explicitly.
2d. `genvm-lint check contracts/injection_court.py` must pass.

Constraints: no money movement, no balances, no transfers, no fees anywhere in this contract.

**-> CHECKPOINT 2. Report and stop.** Paste the full contract in the report.

---

## TASK 3 — Tests

3a. Direct-mode tests in `tests/direct/`: filing a case, reading it back, listing, and input
    validation (bad URL, empty fields). `pytest tests/direct/ -v`.
3b. Integration tests in `tests/integration/`: full `investigate` run against a real reachable
    URL. Assert the verdict is one of the four values and reasoning is non-empty.
    `gltest tests/integration/ -v -s`.
3c. Build a fixture page per verdict category and confirm the contract can reach each of the
    four verdicts. **If a category cannot be reached, report that as a finding — do not tune
    the prompt until it "works" and call it passing.**

**-> CHECKPOINT 3. Report and stop.** Include real pass/fail counts.

---

## TASK 4 — Deploy

4a. `genlayer network` — pick the target network, record which one and why.
4b. `genlayer deploy`. **Record the contract address in `PROGRESS.md`.**
4c. File one real case against the deployed contract and run `investigate` end to end.
4d. Record the transaction status progression and when finality was reached.

**-> CHECKPOINT 4. Report and stop. This is the go/no-go gate — do not start the frontend
until the PM approves.**

---

## TASK 5 — Frontend

Three surfaces only, per `README.md`. Wired to the deployed contract, not mocks.

5a. Case filing form calling `file_case`.
5b. Case detail view: evidence (the incident URL), verdict, reasoning.
5c. Public docket listing all rulings.

Do not add: user accounts, dashboards, charts, notifications, admin panels, or any surface
not in the list above.

**-> CHECKPOINT 5. Report and stop.** Include screenshots or a description of each screen
in a real browser against real contract data.

---

## TASK 6 — Demo

6a. Author a real prompt-injected page and host it at a live public URL. Record the URL.
6b. Full rehearsal: file the case, validators fetch the real page, verdict lands. Do this
    at least twice and report whether the verdict was stable across runs.
6c. Record wall-clock timing for each step and flag the slowest.

**-> CHECKPOINT 6. Report and stop.**

---

## TASK 7 — Submission package

7a. Public GitHub repository. Clean history, no secrets, README with working setup steps.
7b. Draft the project application for the **Onchain Justice** track. Do not submit it —
    the PM reviews the draft first.
7c. Collect all links: repo, live frontend, contract address, demo injected page.

**-> CHECKPOINT 7. Final report and stop.**
