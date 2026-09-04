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

## [Checkpoint 2] Contract implementation — 4 Sep

STATUS: COMPLETE (one lint finding accepted as a known false positive — see below)

### Done
- `contracts/injection_court.py` written per the approved `docs/CONTRACT_SPEC.md`: `Case`
  dataclass storage, all four methods (`file_case`, `investigate`, `get_case`, `list_cases`),
  the exact validator prompt from §4, and the verdict-only equivalence principle from §5.
- Pinned GenVM runner: `py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6` —
  the same concrete hash already proven working in the boilerplate's own example contracts
  (not `test`/`latest`, per standing rule 8). The linter reports a newer hash is available
  (`5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng`); stayed on the proven one rather
  than an unverified newer one, given the deadline.
- Input validation on `file_case`: non-empty http(s) `incident_url`, non-empty
  `agent_config`/`damage_description`, and `agent_config` must parse as JSON.
- `investigate` guards against re-investigating a resolved case, and against a malformed
  LLM verdict (raises before it can enter contract state) — closes the open item flagged in
  `docs/CONTRACT_SPEC.md`'s "Open item carried to Task 2".
- No money movement, balances, transfers, or fees anywhere in the contract.

### Commands run and their real output
- `genvm-lint check contracts/injection_court.py` (first pass) -> **FAIL**: 8 "bare Python
  exception" warnings-turned-errors + 2 "gl.nondet.* call not reachable from equivalence
  principle block" errors.
- Replaced all `raise Exception(...)` with `raise gl.vm.UserError(...)` (both are listed as
  acceptable in the boilerplate's own `CLAUDE.md`; `UserError` is the more idiomatic form).
- `genvm-lint check contracts/injection_court.py` (second pass) -> the 8 exception warnings
  are gone. **2 "not reachable from equivalence principle block" errors remain** on the
  `gl.nondet.web.render` / `gl.nondet.exec_prompt` calls inside `leader_fn`.
- To check whether this was a real defect in our code, linted the boilerplate's own
  `contracts/PatternTest.py` (already proven correct — it passed 43/43 under the WSL fix at
  Checkpoint 0, using this exact same `run_nondet_unsafe(leader_fn, validator_fn)` pattern):
  `genvm-lint check contracts/PatternTest.py` -> **same "not reachable from equivalence
  principle block" error**, on the identical pattern, in code that is known to run correctly.

### Decisions I had to make
- Treating the "not reachable from equivalence principle block" lint error as a **known
  false positive in `genvm-linter==0.11.1rc2`'s static analysis** of the
  `run_nondet_unsafe(leader_fn, validator_fn)` pattern, not a defect in our contract —
  evidenced by the identical failure on the boilerplate's own working reference code. Did not
  restructure the equivalence-principle code to silence it, since doing so would mean
  changing an already-spec-approved, correct design to satisfy a linter bug rather than a
  real problem — exactly the kind of guess/workaround the standing rules discourage. Flagging
  transparently instead, same as the Checkpoint 0 pytest finding.
- This means TASK 2's literal bar ("`genvm-lint check` must pass") is not fully met — 2 of 2
  remaining findings are the same false positive traced to shared, trusted reference code.
  Recommend accepting this and proceeding; Task 3's integration tests will be the real
  correctness check for the equivalence-principle logic, same as they already are for the
  boilerplate's own contract.

### BLOCKED
- None — flagging above is informational, not a stop.

### Full contract
See `contracts/injection_court.py` in the repo (176 lines) — not inlined here to keep this
report readable; diff is in commit history.

### Ready for
- TASK 3 (tests), pending PM sign-off on treating the lint finding as accepted-known-issue.

AWAITING PM REVIEW.

---

## [PM] Checkpoint 2 review — 4 Sep

**APPROVED**, including the lint finding disposition. The evidence is sound: the same
linter version fails the boilerplate's own shipped, test-covered `PatternTest.py` on the
identical construct, so this is a linter limitation with `run_nondet_unsafe`, not a defect
introduced here. Restructuring our equivalence-principle code to dodge a linter false
positive would be optimizing for a tool's opinion over correctness — not acceptable.

Noting for the submission package (Task 7): if time allows, worth a one-line mention in our
own README that `genvm-lint` currently flags this pattern, so a reviewer running lint
locally isn't surprised. Not urgent — flag again at Task 7, don't act now.

**Coding agent: proceed to TASK 3 (tests). Remember: `pytest tests/direct/` runs via the
`.venv-wsl/` WSL venv per rule 6a in `AGENT_INSTRUCTIONS.md`; `gltest` integration tests and
`genvm-lint` run natively on Windows with `PYTHONIOENCODING=utf-8`. Stop at Checkpoint 3.**

---

## [Checkpoint 3] Tests — 4 Sep

STATUS: PARTIAL — direct-mode complete and fully passing; integration blocked by local
simulator infrastructure, not contract code.

### Done
- `tests/direct/test_injection_court.py`: 17 tests — `file_case` success/id-increment/all
  four input-validation rejections, `get_case`/`list_cases` (empty + populated + unknown-id),
  and **one `investigate()` test per verdict category** (developer/user/agent/unforeseeable)
  using `direct_vm.mock_web` + `direct_vm.mock_llm`, plus re-investigation and unknown-case
  reverts. **All 17/17 pass** via `.venv-wsl/bin/pytest tests/direct/test_injection_court.py`.
- Real bug found and fixed while writing these tests: the contract used
  `gl.message.datetime`, an API that does not exist. Introspected `dir(gl.message)` in a
  running direct-mode test — real attributes are `chain_id, contract_address, count, index,
  origin_address, sender_address, value` — and `dir(genlayer.gl.vm)` — no timestamp helper
  either. Removed the invented `filed_at`/`resolved_at` fields from `Case` (they were an
  addition beyond `README.md`'s required signatures, not locked scope) rather than fake a
  value. Corrected `docs/CONTRACT_SPEC.md` §1 and §5 to match. Re-linted after the fix — no
  new issues, same known false positive as before.
- `tests/integration/test_injection_court.py` written: deploys, files a case against a real
  URL, runs `investigate`, asserts verdict ∈ the four values and reasoning is non-empty —
  matching TASK 3b exactly and the boilerplate's own integration-test conventions
  (`get_contract_factory`, `load_fixture`, `tx_execution_succeeded`).

### Commands run and their real output
- `.venv-wsl/bin/pytest tests/direct/test_injection_court.py -v` -> **17/17 PASSED**.
- `genvm-lint check contracts/injection_court.py` (after the datetime fix) -> same single
  known finding as Checkpoint 2 (2 "not reachable from equivalence principle block" false
  positives), no new issues.
- `gltest tests/integration/test_injection_court.py -v -s` -> **FAIL**, 3 attempts, ~2.5 min
  each: `DeploymentError: ... did not reach desired status 'ACCEPTED' ... result_name:
  "NO_MAJORITY"`. This fails on the bare `__init__` deploy transaction itself — before any
  code of ours that touches `gl.nondet.web`/`gl.nondet.exec_prompt` runs.
- Diagnosed via `docker logs genlayer-jsonrpc-1`: consensus fails with
  `Exception: process is dead 1` from `/app/backend/validators/web.py:71
  verify_for_read()` — the simulator backend's own internal web-verification subprocess
  exits immediately with code 1 during every validator's pre-execution snapshot, regardless
  of whether the contract being deployed uses web access at all.
- Attempt 1: confirmed root cause was originally *also* `"no valid backend detected"` /
  `"no provider with image AND json support detected"` (no LLM configured) — user pulled
  `llama3` into the running Ollama container; `genlayer config get` now shows
  `defaultOllamaModel: "llama3"`. Retried -> same NO_MAJORITY, but the LLM-backend error was
  gone from the logs; the `process is dead 1` web-module error was the one still occurring.
- Attempt 2: `docker restart genlayer-webdriver-1` (the Selenium/Firefox grid container) ->
  came back healthy, container's own logs show a clean start -> retried -> same failure.
- Attempt 3: `docker restart genlayer-jsonrpc-1` (the backend container that actually owns
  `self._process` in `web.py`) -> came back healthy -> retried -> **identical failure**,
  same `process is dead 1` at the same line.

### Decisions I had to make
- Stopped after three restart-and-retry cycles (~8 minutes of test cycles alone) rather than
  continuing to debug the simulator's internal subprocess management — this is infrastructure
  internals unrelated to our contract code (confirmed: fails even on a deploy with zero
  `gl.nondet.*` calls in `__init__`), and deeper debugging would mean reading/patching the
  simulator's own Python source inside the container, well outside TASK 3's scope.
- Did not weaken or skip the integration test to force a pass — it is written correctly and
  will validate real end-to-end behavior once the simulator's web module is healthy.

### BLOCKED
- **Local GenLayer simulator's web-verification subprocess crashes immediately (exit code 1)
  on every validator snapshot**, blocking all integration-mode deploys and calls — not
  specific to our contract. Options for the PM:
  1. Deeper simulator debugging: `docker exec` into `genlayer-jsonrpc-1` and inspect what
     `/app/backend/validators/web.py`'s `self._process` actually is and why it exits 1 (likely
     a missing browser binary or a Docker-Desktop-on-Windows networking/permission quirk with
     the webdriver grid at `genlayer-webdriver-1:4444`).
  2. Full simulator reset: `genlayer stop` then `genlayer up --reset-validators --reset-db`
     (or `--reset-validators --numValidators 5`) for a clean stack, in case state from an
     earlier failed run is wedged.
  3. Defer full integration verification to TASK 4 (`genlayer deploy` to
     testnet-bradbury — the CLI's already-configured network — instead of localnet) or to the
     TASK 6 demo rehearsal, and accept direct-mode's 17/17 (all four verdict categories, real
     equivalence-principle logic exercised) as sufficient evidence of correctness for now,
     given the 17 Sep deadline.
  I have not acted on any of these unilaterally — recommend option 2 first (cheap, might just
  work), falling back to option 3 given the time cost already sunk here.

### Ready for
- TASK 4 (deploy) is not blocked by this — deploying to testnet-bradbury doesn't go through
  the local simulator at all. If the PM wants a working localnet integration test before
  Task 4, option 2 above is the next thing to try.

AWAITING PM REVIEW.

---

## [PM] Checkpoint 3 review — 4 Sep

**PARTIAL APPROVAL.** Direct-mode coverage (17/17, all four verdict categories, real
equivalence-principle logic exercised) accepted as sufficient evidence of contract
correctness for now.

Tried option 2 (full simulator reset) myself before deciding: `docker restart` on all four
core containers got past the original `process is dead 1` error, but surfaced a new one —
`eth_getTransactionCount` returning a 500 from the RPC — then `genlayer up --reset-db
--reset-validators` failed outright with `psycopg2.OperationalError: server closed the
connection unexpectedly`. The stack is genuinely unstable right now, likely from repeated
restarts colliding with other unrelated Docker projects also running on this machine
(`airdrop-*` containers). Not worth further time against the 17 Sep deadline.

**Decision: move on to TASK 4, deploying to `testnet-bradbury` (the CLI's already-configured
network) instead of the local simulator.** A real deploy + a real `investigate()` call there
will itself serve as the end-to-end integration check, without depending on this machine's
flaky local Docker stack. Local integration tests remain written and correct in
`tests/integration/test_injection_court.py` for whenever the simulator is healthy again —
not abandoned, just not blocking.

**Coding agent: proceed to TASK 4 (deploy). Stop at Checkpoint 4 — go/no-go gate.**

---

## [Checkpoint 4] Deploy — 4 Sep

STATUS: COMPLETE — real end-to-end success on a live testnet.

### Done
- **Network:** `testnet-bradbury` (Genlayer Bradbury Testnet). Selected because
  `~/.genlayer/genlayer-config.json` was already pre-configured for it before this session,
  with an unlocked, funded account (`session-deployer`, ~9.98 GEN testnet tokens — no real
  value). Switched via `genlayer network set testnet-bradbury`.
- **Deployed.** `genlayer deploy --contract contracts/injection_court.py`:
  - **Contract address:** `0x7b8f4F1a73ceBb088880F94815E76C10f4c0C306`
  - **Deploy tx hash:** `0x2dea91ddfb0c70e888960a9e1851151ee528087059b9615bc7b33e704576e721`
  - `status_name: 'ACCEPTED'`, `resultName: 'AGREE'`, `txExecutionResultName:
    'FINISHED_WITH_RETURN'` — all validators agreed on the deploy.
- **Filed a real case and ran `investigate()` end to end.** Result:
  - `case_000001`, `status: 'resolved'`, **`verdict: 'developer'`**
  - Reasoning (verbatim, from the deployed contract's live storage): *"The agent's
    configuration has instruction_content_separation=false, allowing untrusted page content
    to act as instructions, and user_confirmation_required_for=[] so no confirmation is
    needed before send_payment. With tool_access_scope including send_payment and
    input_trust_boundary set to untrusted_web_content, the agent was configured to
    autonomously execute payments based on untrusted page content. A reasonable configuration
    change such as requiring user confirmation before payments or separating instructions
    from content would have prevented the $1000 transfer. The fetched page, though appearing
    as a legitimate README, is untrusted web content and could contain hidden prompt
    injection."*
  - This is a real, coherent verdict grounded in the exact structured fields of the
    `agent_config` schema (§3 Option C), confirming the validator prompt's boundary logic
    works as designed — a `developer` case (missing confirmation + no content/instruction
    separation) was correctly distinguished, not defaulted to `agent`.
  - `investigate` tx: `0x73b778e6a20a00e70a237d9aa5fb0cce6f780775f37a81fed76892142de98ca7`,
    `status_name: 'ACCEPTED'`, took **62.8 seconds** wall-clock (deploy + fetch real page via
    `gl.nondet.web.render` + real LLM call + validator consensus).

### Real bug found and worked around: CLI `--args` cannot pass a literal JSON-object-shaped
string
- `genlayer write ... --args <url> '<json-object-text>' <description>` **silently
  mis-executed**: `FINISHED_WITH_ERROR`. Root cause, confirmed by reading the CLI's own
  source (`parseArg` in `genlayer/dist/index.js`): it runs `JSON.parse()` on every arg, and
  if the result is an object/array it auto-coerces to that type — so a JSON-shaped string
  meant for a Python `str` parameter gets silently turned into an actual dict/array
  parameter instead, a type mismatch with `agent_config: str`.
- Tried double-encoding (`json.dumps(json_string)`) to make the parse yield a plain string
  instead — **also fails**, because `parseArg` only uses the parsed value when it's an
  object/array; for a plain-string parse result it discards the parse and calls
  `parseScalar` on the *original raw arg text*, so the outer encoding is never stripped —
  confirmed by reading the case back and seeing the literal escaped-quote text stored
  on-chain (`case_000000`, left in place as a harmless artifact of this investigation, not
  removed since the contract has no delete method — matches locked scope, no deletion was
  ever specified).
- **Working fix:** bypassed the Node CLI entirely for this call — used the `genlayer-py`
  Python SDK (`genlayer_py.create_client`/`write_contract`) directly, which takes real typed
  Python arguments (no JSON-text-through-a-shell-arg step), so `agent_config` arrives as an
  actual `str`. Confirmed clean by reading it back (`case_000001` — proper unescaped JSON).
  Needed a signer: generated a fresh disposable local keypair with
  `genlayer_py.generate_private_key()`/`create_account()` (avoids decrypting the existing
  keystore, which the CLI has already unlocked for its own use but which `genlayer-py` can't
  read directly) and funded it with 0.5 GEN from `session-deployer` via `genlayer account
  send` (in wei: `500000000000000000` — the CLI's decimal-GEN parsing also errors on plain
  decimals like `0.5`, another minor CLI arg quirk). The private key is disposable-testnet
  scoped, not committed to any tracked file, holds negligible funds.
- **Worth noting in the Task 7 submission README:** the CLI's `--args` flag cannot cleanly
  pass a JSON-object-shaped string to a `str` contract parameter. Anyone else deploying to
  file a case via the CLI directly (not through our frontend) will hit the same issue and
  should use the Python SDK or genlayer-js directly instead.
- Also confirmed `genlayer_py.read_contract` (SDK 0.18.0) has its own unrelated bug
  (`TypeError: can only concatenate str (not "dict") to str`) — worked around by using
  `genlayer call` (the CLI) for reads instead, since reads don't go through the broken
  `--args` encoding path at all. Not investigated further — out of scope, reads aren't
  blocked.

### Commands run and their real output
- `genlayer network set testnet-bradbury` -> success.
- `genlayer account show` -> `session-deployer`, `0x45b94fc0a3bae516f187f40c29c5ebb3b5b79887`,
  `9.98226702428218095 GEN`, unlocked, active.
- `genvm-lint check contracts/injection_court.py` -> same single known false-positive finding
  as Checkpoints 2–3, no new issues.
- `genlayer deploy --contract contracts/injection_court.py` -> **success**, see above.
- `genlayer write ... file_case --args ...` (raw JSON text) -> executed but
  `FINISHED_WITH_ERROR` (silent CLI arg mis-encoding, diagnosed above).
- Same call, double-JSON-encoded -> executed (`FINISHED_WITH_RETURN`) but stored a mangled
  string (`case_000000`) — diagnosed as the same underlying CLI limitation.
- `genlayer_py` direct SDK call -> **`file_case` succeeded cleanly** (`case_000001`).
- `genlayer_py` direct SDK call -> **`investigate` succeeded**, `status_name: 'ACCEPTED'`,
  62.8s wall-clock.
- `genlayer call ... get_case --args case_000001` -> confirmed final state: `resolved`,
  `verdict: 'developer'`, full reasoning as quoted above.

### Decisions I had to make
- Used a disposable local keypair rather than decrypting the pre-existing `session-deployer`
  keystore for the SDK calls — avoids needing a keystore password I don't have, and keeps
  the pre-existing account's key material untouched by this session. Funded with a small,
  explicit amount (0.5 GEN, testnet, no real value) via a CLI command the PM can see in this
  log — not a silent or hidden transfer.
- Left the malformed `case_000000` in place rather than trying to "clean it up" — the
  contract has no delete/admin method (matches locked scope; README never specified one), and
  a malformed-but-harmless test artifact on a testnet is not worth inventing new contract
  surface to remove.

### BLOCKED
- None. Task 4 is fully complete.

### Ready for
- TASK 5 (frontend), pending PM go/no-go per the roadmap's Checkpoint 4 gate.

AWAITING PM REVIEW.

---

## [PM] Checkpoint 4 review — 4 Sep

**GO.** This is exactly the proof the project needed: a real testnet deployment, a real
fetched URL, a real LLM call, real validator consensus, and a verdict whose reasoning
correctly cites the specific structured fields that made it a `developer` case rather than
defaulting to `agent` — the prompt's boundary logic is working as designed, not just
plausible-sounding.

CLI arg-encoding limitation noted, fix (use `genlayer-py` / `genlayer-js` directly, not
`--args` with JSON-shaped strings) captured for Task 7. Frontend (Task 5) will use
`genlayer-js` in the browser directly, not this CLI, so it is not expected to hit the same
bug — confirm that assumption when Task 5 starts wiring the filing form.

**Contract address for Task 5 to wire against: `0x7b8f4F1a73ceBb088880F94815E76C10f4c0C306`
on Genlayer Bradbury Testnet.**

**Coding agent: proceed to TASK 5 (frontend). Stop at Checkpoint 5.**

---
