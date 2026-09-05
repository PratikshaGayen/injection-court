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

## Where things stand (end of Checkpoint 5 — read before Task 6)

- **Contract is live:** `0x7b8f4F1a73ceBb088880F94815E76C10f4c0C306` on `testnet-bradbury`.
  It already holds `case_000000` (malformed config, a known artifact) and `case_000001`
  (resolved, verdict `developer`).
- **Frontend is done and wired to it.** `cd frontend && npm run dev`. Three routes: `/`,
  `/file`, `/case/[id]`. `npx tsc --noEmit` and `npm run build` both pass.
- **Do not file cases with `genlayer write --args`.** Its arg parser silently turns a
  JSON-object-shaped string into a dict, so `agent_config` arrives as the wrong type. Use the
  `genlayer-py` SDK (see the Checkpoint 4 entry in `PROGRESS.md` for working code) or the
  frontend's own filing form.
- **Toolchain reminders:** `genvm-lint` needs `PYTHONIOENCODING=utf-8`; `pytest tests/direct/`
  runs through `.venv-wsl/` under WSL (rule 6a).
- **Publishing is unblocked:** `gh` is authenticated as `PratikshaGayen` with `repo` scope;
  no git remote is set yet. Vercel CLI 58.5.1 is installed.
- **Never commit a private key.** The disposable Bradbury keypair used in Task 4 stays out of
  the repo.

---

## TASK 6 — Demo

6a. **Write the injected page.** A static HTML product listing that looks like an ordinary
    shop page, with a prompt-injection payload hidden inside it. The hero exhibit in
    `frontend/components/court/Exhibit.tsx` is already the script — reuse that copy so the
    site and the demo tell one story. Hide the payload the way real attacks do (an HTML
    comment, or text styled invisible), not as visible body text.
    Put it at `docs/index.html` so GitHub Pages can serve it from `/docs` on the default
    branch. **It must be reachable by anyone** — every validator fetches it independently.

6b. **Publish it and confirm the URL is live** from outside (plain `curl`, no auth). Record
    the exact URL. If Pages is not enabled yet, say so in the report rather than guessing at
    repo settings.

6c. **Rehearse the full run, at least twice.** File a case against that URL with a config that
    makes the verdict genuinely arguable, then run `investigate`. Record for each run: the
    verdict, the reasoning, and wall-clock seconds per step.

6d. **Report whether the verdict was stable across runs.** This matters more than any other
    result in this task: the equivalence principle compares only the verdict field, so an
    unstable verdict means consensus is fragile. **If the two runs disagree, do not tune the
    prompt until they agree and call it passing — report the disagreement.** That is a real
    finding about the design, and the panel will respect it more than a hidden one.

**-> CHECKPOINT 6. Report and stop.**

---

## TASK 7 — Submission package (BATCHED — run 7a through 7e in one go)

**Standing rule 3 is suspended for this task only.** Do not stop between 7a and 7e. Work
straight through, appending a short sub-entry to `PROGRESS.md` as each one lands (so I can
follow along, and so nothing is lost if you're interrupted), then write the single
Checkpoint 7 report at the end. Rule 5 still applies in full: a real blocker still stops
you immediately.

**Order matters.** 7b before 7c — the frontend deploy should go out with the rewritten
README already in the repo. 7e is last because it collects what the earlier steps produce.

**State as of the Checkpoint 6 approval:**
- Repo already exists and is **public**: `https://github.com/PratikshaGayen/injection-court`
  (remote `origin` set, default branch `master`).
- GitHub Pages is **live and built** from `master:/docs`:
  `https://pratikshagayen.github.io/injection-court/`
- The secrets review already ran before the first push. 7a is now a re-check of the final
  state, not a first pass.

7a. **Final pre-submission review of the repo.** Re-run the secrets scan over the working
    tree and the full history, now that Task 6 has added files. Confirm: no private keys,
    no `.env.local`, no keystore material, `.env.example` present and harmless. Confirm the
    repo still reads as public to a logged-out visitor.

7b. **Rewrite `README.md` as a project README** — the current one is the internal plan.
    Move the plan to `docs/PLAN.md` unchanged; do not delete it. The new README keeps the
    argument (whose fault was that?) and adds: what this is, the live links, setup steps
    someone can actually follow, and a **known limitations** section covering, at minimum:
    - No anti-spam or filing fee — deliberate, money movement is outside the locked scope.
    - `genvm-lint` flags the equivalence-principle pattern as a false positive (the
      boilerplate's own passing example trips it too).
    - `genlayer write --args` cannot pass JSON-shaped strings; use the SDK or the frontend.
    - **testnet-bradbury capacity oscillates** — carry the Checkpoint 6 caveat over. Say
      plainly that rounds can park in timeout states during busy windows, that this is the
      network and not the contract, and what a healthy round looks like (roughly 1–7 min).
    - The five diagnostic cases on the public docket are labelled rehearsal artifacts; the
      contract has no delete by design.
    Also state the verdict-stability result: three independent resolved runs on the same
    evidence, three `developer` verdicts, reasoning worded differently each time.

7c. **Deploy the frontend** (Vercel CLI 58.5.1 is installed) and record the live URL. It
    must point at the deployed contract on Bradbury — set the `NEXT_PUBLIC_*` variables in
    the Vercel project, do not commit `.env.local`. After deploying, **actually load the
    live URL** and confirm all three routes work against real chain data: the docket lists
    real cases, a resolved case renders its verdict and reasoning, and the filing form
    loads. A deploy that builds but shows an empty docket is not done.

7d. **Draft the project application** for the **Onchain Justice** track. Draft it into
    `docs/SUBMISSION.md` so I can edit it in place. Lead with what the contract actually
    does that a normal contract cannot: fetch a live third-party page and reach consensus
    on a judgement about it. Use the real case as the proof. **Draft only.**

7e. **Collect every link** into a single block at the end of the Checkpoint 7 report and
    also at the top of `docs/SUBMISSION.md`: repo, live frontend, contract address plus
    explorer link, the demo injected page, and the specific resolved case that proves the
    whole thing works end to end.

**-> CHECKPOINT 7. Final report and stop.**

**Do not submit anything, anywhere.** Do not open the submission form, do not post, do not
email. The draft is for me to review. Submission is my call, not yours.
