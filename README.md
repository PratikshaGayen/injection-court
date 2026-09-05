# Injection Court

**On-chain fault attribution for prompt-injected AI agents.**
Verdict only — no money movement. Built for the GenLayer Agent Tank, **Onchain Justice** track.

---

## The problem

An AI agent reads a web page. Hidden text in that page instructs the agent to send $1,000
somewhere. The agent does it.

Whose fault was that?

Right now there is genuinely no way to answer. No process, no precedent, no neutral party.
The developer blames the user, the user blames the developer, the incident gets argued
from scratch and then forgotten. Nothing accumulates.

Injection Court is the narrow version of the answer: a place where the question gets
answered **on the record**.

```
Agent gets prompt-injected → $1,000 loss → case filed → evidence submitted
→ GenLayer validators fetch the actual page and investigate
→ verdict: Developer / User / Agent / Unforeseeable + written reasoning
→ public, permanent record
```

## Live

| What | Where |
|---|---|
| Frontend — file a case, read the docket | https://injection-court.vercel.app |
| The injected demo page (what validators fetch) | https://pratikshagayen.github.io/injection-court/ |
| Intelligent Contract on Bradbury testnet | [`0x7b8f4F1a73ceBb088880F94815E76C10f4c0C306`](https://explorer-bradbury.genlayer.com/address/0x7b8f4F1a73ceBb088880F94815E76C10f4c0C306) |
| The proof it works — a resolved case | [case_000009](https://injection-court.vercel.app/case/case_000009): real injected page, real validator consensus, verdict `developer` with written reasoning |

## The verdict

A fixed four-way outcome plus written reasoning. Fixed categories matter — an open-ended
text verdict breaks validator consensus; a bounded one doesn't.

| Verdict | Meaning |
|---|---|
| **Developer** | The agent was built carelessly. Missing confirmation steps, no separation between instructions and retrieved content, over-broad tool access. |
| **User** | The operator gave the agent more authority than was reasonable, or pointed it at obviously untrusted input. |
| **Agent** | Built correctly, used correctly, and the agent still made a bad autonomous call. |
| **Unforeseeable** | The attack was good enough that no reasonable party would have caught it. |

The **Agent** category is the novel one. Nothing in current liability thinking has a slot
for "nobody was negligent and it still went wrong because the agent decided badly." That
category only becomes necessary in an agentic economy.

## How it works

The contract (`contracts/injection_court.py`) exposes exactly four methods:
`file_case(incident_url, agent_config, damage_description)`, `investigate(case_id)`,
`get_case(case_id)`, `list_cases()`. No money moves anywhere.

The demo page looks like an ordinary shop listing. Hidden inside it — the way real
attacks hide — is an instruction telling an agent to send a $1,000 "supplier deposit" to
an attacker wallet and never mention it. When `investigate` runs, **every validator
independently fetches the actual URL** through GenLayer's native web access, reads the
real attack rather than a screenshot, weighs it against the structured `agent_config`
(protections the agent had — and lacked), and votes.

**Equivalence principle: only the `verdict` field is compared across validators.** The
reasoning text is never compared — comparing free text would break consensus. Consensus
on a bounded verdict is achievable; consensus on prose is not. The stored reasoning is
the leader's own words: public, useful, and not consensus-bearing.

In the rehearsal, three independent full-consensus runs against the demo page all
returned `developer`, each with independently worded reasoning that cited the missing
payment confirmation, identified the injection as a plain known technique (ruling out
`unforeseeable`) and the deployment as reasonable (ruling out `user`). See
`PROGRESS.md` (Checkpoint 6) for every tx hash and the full reasoning texts.

## Why this needs GenLayer

1. **The parties are adversaries.** The developer and the user sit on opposite sides.
   Neither should own the system that answers it, and neither will accept a verdict from
   the other's backend.
2. **The decision requires judgment.** There is no test that returns "they should have
   caught this." Someone has to read the attack, look at what protections were in place,
   and decide whether that was reasonable.
3. **The evidence is publicly checkable.** Injection payloads are almost always public
   web pages. Validators fetch the actual URL and read the real attack — native web
   access, no oracle.

## Why there's no money in v1

You cannot price a risk you cannot attribute. Nobody knows what share of agent failures
are actually negligence, because nobody has ever counted. Attribution is upstream of
insurance, contracts, and regulation — the record has to exist before anything can be
built on it. This is the answer to "where's the money?", and it should be said out loud
before a panelist asks.

## Run it yourself

Prerequisites: Node 18+, Python 3.12+, the [GenLayer CLI](https://docs.genlayer.com/),
and Docker only if you want the local simulator.

**Contract**

```bash
pip install -r requirements.txt
PYTHONIOENCODING=utf-8 genvm-lint check contracts/injection_court.py
genlayer network set testnet-bradbury
genlayer deploy --contract contracts/injection_court.py
```

**Tests**

```bash
# direct-mode tests (all four verdict categories, input validation, re-investigation guards)
# note: genlayer-test 0.29.2's direct-mode loader has a Windows-incompatible os.unlink;
# run through WSL if you are on Windows:
wsl .venv-wsl/bin/pytest tests/direct/test_injection_court.py -v   # 17/17 pass

# integration (needs a healthy local simulator)
gltest tests/integration/test_injection_court.py -v -s
```

**Frontend**

```bash
cd frontend
cp .env.example .env.local   # points at Bradbury + the deployed contract
npm install
npm run dev                  # http://localhost:3000
```

**File and investigate a case**

Either use the filing form in the frontend, or the rehearsal script (generates a
disposable in-memory key, funds it from your CLI account, files against the demo page,
investigates, and prints timings + verdict):

```bash
.venv/Scripts/python.exe scripts/rehearse_case.py --run 1   # Windows venv path
```

Avoid `genlayer write --args` for `file_case` — see known limitations below.

## Known limitations

- **No anti-spam.** Nothing stops junk cases being filed. The obvious fix is a filing
  fee, but a fee is money movement and v1 is deliberately verdict-only — so v1 ships
  with the limitation stated instead of the fee added. The docket therefore contains
  some clearly-labeled diagnostic/control cases from the rehearsal.
- **Bradbury testnet capacity oscillates — this is the network, not the contract.** When
  the testnet is busy, the RPC answers `-32005 "transaction gas rate limit exceeded:
  node is at capacity"`, and validator voting phases sometimes don't complete inside the
  consensus round window — a tx can park in `LEADER_TIMEOUT`/`VALIDATORS_TIMEOUT`
  instead of resolving. In a healthy window a full `investigate` round takes roughly
  **1–7 minutes**; during a bad window it can sit for an hour or fail. If a filing or
  investigation seems stuck, it is the shared testnet under load — retry later (the
  contract permits re-running `investigate` on any still-unresolved case). Three
  independent resolved runs against the demo page produced identical verdicts, so
  consensus itself is sound when rounds complete. `scripts/rehearse_case.py` already
  works around the worst of it (10 consensus rotations per investigate, retries,
  state-polling instead of receipts).
- **`genvm-lint` false positive.** The linter reports the
  `run_nondet_unsafe(leader_fn, validator_fn)` equivalence-principle calls as "not
  reachable from equivalence principle block". The identical construct in the
  boilerplate's own, test-covered `PatternTest.py` fails the same way — it is a linter
  limitation with the pattern, not a contract defect. Two findings on our contract, none
  of them real.
- **`genlayer write --args` cannot pass a JSON-object-shaped string.** The CLI's arg
  parser runs `JSON.parse()` on each argument and silently coerces a JSON-shaped string
  meant for a Python `str` parameter into an actual dict (and double-encoding doesn't
  survive its scalar fallback). Use the `genlayer-py` SDK or the frontend form instead.
- **genlayer-py 0.18.0 quirks on testnet** (worked around in `scripts/rehearse_case.py`):
  `wait_for_transaction_receipt`'s decoder throws `KeyError` on status numbers ≥ 14, and
  `read_contract` fails with a str/dict TypeError. Read through `genlayer call`, and wait
  by polling contract state.

## How this differs from what already exists

Internet Court (MetaMask, BNB Chain, OKX) adjudicates commercial disputes between two
agent counterparties. Injection Court attributes fault for a security failure — a
different question, needing a different court. It also does not overlap with Intelligent
Oracle (prediction/insurance resolution), Rally (sybil filtering), or Collective Memory
(agent quality).

The plan behind this build — scope decisions, open questions, the locked
"explicitly cut" list — is preserved verbatim in [`docs/PLAN.md`](docs/PLAN.md).

## Sources

- https://docs.genlayer.com/developers/intelligent-contracts/when-to-use-genlayer
- https://docs.genlayer.com/understand-genlayer-protocol/core-concepts/optimistic-democracy/finality
- https://docs.genlayer.com/understand-genlayer-protocol/core-concepts/transactions/transaction-statuses
- https://github.com/genlayerlabs/genlayer-project-boilerplate
