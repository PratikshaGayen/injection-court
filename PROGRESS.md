# Injection Court — Progress Log

**The coding agent appends here. The PM reviews and writes approvals here. Nothing is ever deleted.**

Report format and standing rules: see `AGENT_INSTRUCTIONS.md`.
Roadmap and phase gates: see `ROADMAP.md`.

---

## [PM] Project opened — 4 Sep

Scope locked to `README.md`. Roadmap and task blocks issued.

Settled — not open for the coding agent to revisit:
- Equivalence principle compares the **verdict field only**; reasoning text is not compared.
- **No filing fee** in v1 — a fee is money movement, excluded by the scope lock. Anti-spam
  ships as a stated known limitation.
- Start from `genlayerlabs/genlayer-project-boilerplate`.

Open — resolved by the PM at Checkpoint 1:
- The concrete `agent_config` schema.

**Coding agent: begin TASK 0. Stop at Checkpoint 0 and wait for review.**

---

## [Checkpoint 0] Bootstrap — 4 Sep

STATUS: PARTIAL — one real blocker found (upstream, not our code). Everything else complete.

### Done
- `git init` at `D:/Genlayer/Hackathon/injection-court`. No commits yet — awaiting PM review
  before the first commit. `README.md` and `pitch.md` untouched.
- Cloned `genlayerlabs/genlayer-project-boilerplate` (depth 1) to a scratch dir and copied in
  its structure, **not** its `README.md`/`CLAUDE.md` (ours are authoritative):
  `contracts/`, `tests/direct/`, `tests/integration/`, `config/`, `deploy/`, `frontend/`,
  `support/`, plus `requirements.txt`, `pyproject.toml`, `gltest.config.yaml`, `package.json`,
  `package-lock.json`, `tsconfig.json`, `.gitignore`.
- Python 3.14.3 venv created at `.venv/`, `pip install -r requirements.txt` succeeded —
  `genlayer-py 0.18.0`, `genlayer-test 0.29.2`, `genvm-linter 0.11.1rc2`, plus web3/eth deps.
- GenLayer CLI confirmed reachable, version `0.39.1`, full command set present (`init`, `up`,
  `deploy`, `call`, `write`, `network`, `staking`, etc.).
- `frontend/`: `npm install` succeeded — 756 packages. `npm run dev` confirmed the Next.js
  16.0.3 (Turbopack) dev server serves at `http://localhost:3000`. Stopped after confirming.

### Commands run and their real output
- `git init` -> PASS
- `python -m venv .venv` -> PASS
- `pip install -r requirements.txt` -> PASS (full dependency tree resolved and installed)
- `genlayer --help` -> PASS (CLI functional)
- `genvm-lint check contracts/football_bets.py` -> **FAIL** on first run
  (`UnicodeEncodeError: 'charmap' codec can't encode character '\u2713'` — Windows console
  defaults to cp1252, the linter writes a UTF-8 checkmark). Fixed by running with
  `PYTHONIOENCODING=utf-8` set -> **PASS** on retry: "Lint passed (2 checks)", "Validation
  passed", 5 methods (3 view, 2 write), 3 style warnings about bare `Exception` (boilerplate's
  own code, not ours).
- `pytest tests/direct/ -v` -> **FAIL**: 33 failed, 10 passed. Root cause identified in
  `gltest/direct/loader.py` — every failure traces to the same
  `PermissionError: [WinError 32] The process cannot access the file because it is being used
  by another process`. The loader does `os.dup2(fd, 0)` (points stdin at the temp file) then
  in `finally: os.close(fd); os.unlink(path)` while stdin (fd 0) still holds the file open.
  POSIX allows unlinking an open file (deferred delete); Windows does not. This is a bug in
  the `genlayer-test` package itself (v0.29.2), not in our code or the boilerplate's contract
  code — the 10 tests that pass are the ones (`test_patterns.py`'s pure-logic cases) that
  don't go through this code path.
- `npm install` (frontend) -> PASS (756 packages; some WalletConnect deprecation warnings and
  npm-audit findings, all in the boilerplate's own dependency tree, not introduced by us)
- `npm run dev` (frontend) -> PASS — served at `http://localhost:3000`, stopped cleanly after
  confirming.

### Decisions I had to make
- Set `PYTHONIOENCODING=utf-8` as a genlayer-lint/pytest environment fix rather than editing
  any package source — this is a standard, well-known fix for Windows console encoding and
  changes nothing about tool behavior. Recommend this env var be set project-wide (e.g. in a
  `.env` or documented in the README setup steps) since every contributor on Windows will hit
  the same crash otherwise.
- Did **not** attempt to patch `gltest`'s `loader.py` in `site-packages` to work around the
  `os.unlink` bug — that's fragile (wiped on reinstall), not something TASK 0 authorized, and
  exactly the kind of "guess and work around silently" the standing rules forbid. Flagging
  instead.

### BLOCKED
- **`pytest tests/direct/` cannot pass on this Windows machine as-is.** This is an upstream
  bug in `genlayer-test==0.29.2`'s direct-mode loader (Windows can't unlink a file while a
  duplicated fd still holds it open — POSIX-only assumption). It blocks **all** future direct
  tests we write in Task 3, not just the boilerplate's own example tests.
  Options, for the PM to choose from — I have not acted on any of these:
  1. Run direct-mode tests inside WSL (Windows Subsystem for Linux) instead of native Windows.
  2. Vendor/monkeypatch a local fix for `gltest`'s loader (e.g. via a `conftest.py` fixture
     that patches `tempfile`/`os.unlink` behavior) — contained to our test setup, not
     site-packages.
  3. File the bug upstream at `genlayerlabs/genlayer-testing-suite` and pin to a fixed release
     once available; treat direct-mode tests as blocked until then.
  4. Accept integration-mode tests (`gltest`) as the primary test coverage for now, since that
     path may not share this loader code — untested, would need to verify in Task 3.
  I have no basis in the plan to pick one of these unilaterally — it changes how Task 3 is
  built. **Recommend option 1 (WSL) as fastest if WSL is available on this machine, otherwise
  option 2.**

### Ready for
- Task 1 (contract specification) does not depend on this blocker — it's a design doc, no
  test execution. I can proceed to Task 1 now if the PM approves, in parallel with the PM
  deciding how to resolve the pytest blocker before Task 3 begins.

AWAITING PM REVIEW.

---

## [PM] Checkpoint 0 review — 4 Sep

**APPROVED.** Bootstrap accepted as-is; the pytest blocker is now resolved.

Decision on the BLOCKED item: **Option 1 — run direct-mode tests via WSL.**

Resolution carried out and verified:
- WSL Ubuntu was already present on this machine (Python 3.12.3).
- `python3.12-venv` isn't installed and installing it needs a sudo password not available to
  the agent. Worked around without sudo: `python3 -m venv --without-pip .venv-wsl` +
  `get-pip.py` bootstrap — no system packages touched, no site-packages patched.
- `pytest tests/direct/ -v` under `.venv-wsl/bin/pytest` -> **43/43 PASSED**, confirming the
  root-cause diagnosis (Windows-only `os.unlink`-while-open failure) was correct and fully
  resolved by running on a POSIX filesystem.
- `.gitignore` updated to exclude `.venv-wsl`.
- `AGENT_INSTRUCTIONS.md` updated (new rule 6a) so this resolution is standing guidance for
  Task 3 and beyond — direct-mode pytest always runs through WSL from here on; `genvm-lint`
  and integration tests (`gltest`) keep running natively on Windows.
- Bootstrap + this fix committed to git as the project baseline.

**Coding agent: proceed to TASK 1 (contract specification). Stop at Checkpoint 1 — the
`agent_config` schema choice is mine to make, not yours.**

---

## [Checkpoint 1] Contract specification — 4 Sep

STATUS: COMPLETE

### Done
- `docs/CONTRACT_SPEC.md` written: storage model, all four method signatures, three
  `agent_config` schema options with trade-offs and a recommendation, a full validator prompt
  draft with an explicit boundary rule between `agent` and `unforeseeable`, and the
  equivalence-principle implementation approach.

### Commands run and their real output
- None — this task is design-only, no code or tests to execute.

### Decisions I had to make
- Grounded every API reference (`gl.nondet.web`, `gl.nondet.exec_prompt`, `gl.eq_principle`,
  `gl.vm.run_nondet`, the leader/validator partial-field-matching pattern) in the boilerplate's
  own `contracts/football_bets.py`, `contracts/PatternTest.py`, and `CLAUDE.md` API reference
  rather than recalling from memory, per standing rule 7.
- Chose `gl.vm.run_nondet` with a custom `validator_fn` over `gl.eq_principle.strict_eq()` for
  the equivalence principle, because `strict_eq` would compare the whole JSON output
  (including `reasoning`), which contradicts the already-locked "verdict field only" decision.
  This is not a new decision — it's the correct implementation of one already made.
- Recommended Option C (structured core + free-text `additional_context`) for `agent_config`
  over pure free-text (breaks consensus on what claims were even made) or pure structured
  (too rigid for the range of real agent architectures). Reasoning is in §3 of the spec.

### BLOCKED
- None.

### Ready for
- PM decision on the `agent_config` schema (§3 of `docs/CONTRACT_SPEC.md`).

AWAITING PM REVIEW.

---

## [PM] Checkpoint 1 review — 4 Sep

**APPROVED. Schema: Option C (structured core + free-text `additional_context`).**

Rationale for picking C over A/B: the free-text field carries zero consensus risk because the
equivalence principle already excludes everything except `verdict` from cross-validator
comparison (§5) — so the objection to free text ("breaks validator consensus") that `README.md`
raises for the *verdict* doesn't apply here. Meanwhile pure-structured (B) risks forcing real
incidents into fields that don't fit them, which would show up later as filers unable to make
their case at all. C gets the checkable claims of B without B's rigidity.

Validator prompt and equivalence-principle approach also approved as drafted — no changes
requested.

**Coding agent: proceed to TASK 2 (contract implementation), using Option C from
`docs/CONTRACT_SPEC.md` §3. Stop at Checkpoint 2.**

---
