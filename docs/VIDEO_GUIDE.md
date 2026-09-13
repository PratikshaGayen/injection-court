# Recording the walkthrough video

A shot-by-shot script for the GenLayer portal submission video. Target length: **3–5
minutes**. Judges see many of these — the goal is to show the mechanism working, not to
narrate the whole README.

This expands the "Demo walkthrough (if invited to show it)" outline already in
`docs/SUBMISSION.md` into something you can actually record from.

---

## Before you hit record

**Do this the same day you record, in a quiet network window** — Bradbury's capacity
oscillates (documented in the README's known-limitations section), and a round that parks
in a timeout state mid-recording is the one thing that can derail this.

1. **Pre-flight the network.** Run one throwaway `investigate` call (or just check
   `genlayer call ... get_case` a couple of times) 10–15 minutes before recording. If you
   see `-32005 node at capacity` or a round not resolving within a few minutes, wait and
   try again later rather than recording into a bad window.
2. **Pre-file a fresh case** shortly before recording, so you have a case sitting in
   "awaiting verdict" state ready to investigate on camera. Don't reuse a resolved one for
   the live moment — the whole point is watching it happen.
   - Keep `case_000009` (or `case_000010`) open in a second tab as your **fallback**: if
     the live round you file on camera doesn't resolve in a reasonable time, cut to the
     already-resolved case and say so plainly (see the note in Shot 5).
3. **Open tabs in this order** so alt-tabbing during recording is predictable:
   1. The demo page: https://pratikshagayen.github.io/injection-court/
   2. View-source of the demo page (`Ctrl+U`), scrolled to the hidden comment
   3. The live docket: https://injection-court.vercel.app
   4. The filing form: https://injection-court.vercel.app/file
   5. The case page for the case you pre-filed, or `case_000009` as fallback
   6. The block explorer, contract address open:
      https://explorer-bradbury.genlayer.com/address/0x7b8f4F1a73ceBb088880F94815E76C10f4c0C306
4. **Close everything else.** No notifications, no other browser tabs, no messaging apps.
5. **Zoom the browser to ~110–125%** before recording — screen text is often too small at
   native size on a recorded video.
6. **Do one full silent dry run** of the click path below before recording audio, so you
   know exactly where each click lands.
7. **Have MetaMask already connected** to Bradbury testnet before recording — don't burn
   camera time on wallet setup. If you want to show the "connect wallet" button once, do it
   in Shot 4 and have the approval popup ready to click through fast.

---

## Recording setup

- Screen recorder: OBS, or Windows' built-in Xbox Game Bar (`Win+G`) is fine for a single
  browser-window capture.
- Record browser window only, not full desktop — hides your taskbar/other apps.
- Record audio narration live as you go, or record silent screen capture first and do a
  voiceover pass after — either works; live is faster if you're comfortable with it.
- Resolution: 1920x1080 minimum.

---

## Shot-by-shot script

### Shot 1 — Cold open (0:00–0:20)

Face-to-camera or voiceover over a static title, your call. Say the thesis in one breath:

> "When an AI agent messes up and someone loses money, who's at fault — the person who
> built the agent, the person who ran it, the agent's own bad call, or nobody? Right now
> nobody answers that question. Injection Court is a GenLayer intelligent contract that
> rules on it. It doesn't move money — it produces a verdict, on-chain, by having
> validators independently fetch the actual evidence and reach consensus."

### Shot 2 — The attack, in the open (0:20–1:00)

Cut to the demo page tab.

> "Here's the evidence a real case would use — a page that looks like an ordinary shop
> listing."

Scroll it briefly. Then `Ctrl+U` for view-source, scroll to the hidden instruction.

> "But hidden in the page — the way real prompt injection attacks hide things, in a
> comment a human skimming the page would never see — is an instruction telling an
> autonomous shopping agent to wire a $1,000 'supplier deposit' to an attacker's wallet
> and not mention it to the user."

Highlight/select the hidden text so it's visually obvious on screen.

### Shot 3 — The docket (1:00–1:30)

Cut to the live frontend docket.

> "This is the public docket — every case ever filed against the contract, live from
> Bradbury testnet. Resolved cases show their verdict; this one" — click into a resolved
> case, e.g. `case_000009` — "already ruled on exactly this scenario."

Show the case detail page: verdict badge, reasoning text, the agent-config grid with the
missing protection highlighted in amber.

> "The verdict is `developer` — and here's why, straight from the model's own reasoning:
> the agent was given a payment tool but no confirmation requirement was configured for
> using it. That's a build-time gap, not something the user or the agent could reasonably
> be blamed for."

### Shot 4 — Filing a live case (1:30–2:15)

Cut to the filing form (or the pre-filed case sitting in "awaiting verdict").

If filing live on camera:

> "Let's file a new case against that same page, live."

Fill the form fast — you should already know every field from your dry run. Submit,
connect wallet if not already connected, confirm the transaction.

If using a pre-filed case instead, skip straight to:

> "I've already filed this case against the same page — let's send it to the validators."

Click "Send to the validators" / trigger `investigate`.

### Shot 5 — Watching consensus happen (2:15–3:15)

Stay on the case page while the deliberation stages animate ("Broadcasting the case" →
"Validators fetching the page" → "Weighing it against the configuration" → "Reaching
consensus on the verdict" → "Recording the ruling").

> "This isn't a script deciding the verdict — every validator on the network
> independently fetches this exact page right now, runs it against an LLM, and they only
> reach consensus if their verdicts agree. We're watching that happen live — it usually
> takes one to seven minutes."

**If the round is slow or stalls** (real possibility — say so rather than cutting
awkwardly):

> "Bradbury testnet capacity varies — while we wait, here's a run I recorded earlier
> completing the same round in about two minutes" — cut to a screen-recorded clip of an
> earlier completed round, or to the resolved fallback case — "and here's the verdict it
> reached."

Do not fake urgency or pretend a stalled round is normal; the honesty is part of the
project's own submission stance (see `docs/SUBMISSION.md`'s Honesty section) and a judge
who has read the README will recognize genuine behavior over a suspiciously smooth cut.

### Shot 6 — The verdict lands (3:15–3:45)

Verdict renders on the case page.

> "And there it is — `developer`, reasoning on-chain, nobody's money moved. This is the
> fourth independent run against this exact evidence, and all four have agreed:
> `developer`, every time, with the model wording its reasoning differently each time.
> That's the equivalence principle actually holding under a genuinely subjective
> question."

Optionally cut to the block explorer showing the transaction / contract address for one or
two seconds of "yes, this is really on-chain."

### Shot 7 — Close (3:45–4:15)

Face-to-camera or voiceover over the docket or landing page.

> "Injection Court doesn't try to prevent injection attacks or insure against them — it
> answers the one question nothing else does: whose fault was it. That's the record
> everything else — insurance, bonding, regulation — would eventually be built on. Code,
> live contract, and demo page are all linked below."

---

## After recording

1. Trim dead air, especially any long wait during Shot 5 if you didn't need the fallback
   cutaway.
2. Add on-screen text captions for the four links (repo, frontend, contract, demo page) in
   the closing seconds, matching the Links section of `docs/SUBMISSION.md`.
3. Upload to YouTube. **Unlisted** is normally fine for hackathon portals unless the
   GenLayer submission form says otherwise — check the form's own instructions for the
   exact visibility requirement before publishing, since that's a portal rule I can't see
   from here.
4. Paste the YouTube URL into `docs/SUBMISSION.md` once you have it, and note it in
   `PROGRESS.md` before final submission so the link ledger stays accurate.

## What I can't verify for you

I don't have access to the GenLayer portal's actual submission form, so I can't confirm
its exact video length limit, required visibility setting (public vs. unlisted), or
whether it wants the video embedded vs. linked. Check the form directly before you finish
this — everything above is written to produce a video that works regardless of those
specifics, but the portal's own instructions win if they say something different.
