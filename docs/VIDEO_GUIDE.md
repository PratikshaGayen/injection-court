# Recording the walkthrough video

A simple script for the GenLayer portal submission video. Voiceover only — no face on
camera, just your screen and your voice. Target length: **3–4 minutes**.

---

## Before you record

1. **Check the network is behaving.** Open the [docket](https://injection-court.vercel.app)
   and make sure recent cases show a verdict, not stuck "awaiting." If Bradbury looks slow
   right now, wait and try later — recording into a bad window is the one thing that can
   ruin a take.
2. **File one fresh case** a few minutes before you record (from the
   [filing form](https://injection-court.vercel.app/file), against the
   [demo page](https://pratikshagayen.github.io/injection-court/)). Leave it unresolved —
   you'll run it live on camera. Keep the tab open.
3. **Also open, in tabs, ready to switch to:**
   - The demo page
   - The demo page's source view (`Ctrl+U`), scrolled down to the hidden comment
   - The docket
   - A resolved case, e.g. `case_000009`, as backup in case your live round runs slow
4. **Zoom your browser to ~120%** so text reads clearly on the recording.
5. **Record the browser window only**, not your whole desktop. Windows' `Win+G` (Xbox Game
   Bar) or OBS both work fine.

---

## What to record — one pass, in order

Just talk over each screen as you show it. Rough timing in brackets; don't worry about
hitting it exactly.

**1. The problem (20s)**
Say what this is, plainly:

> "When an AI agent messes up and someone loses money, who's at fault? Nobody answers
> that today. Injection Court is a GenLayer contract that rules on it — it doesn't move
> money, it just produces a verdict, on-chain."

**2. The attack (40s)**
Show the demo page, then view-source and scroll to the hidden comment.

> "This looks like an ordinary shop page. But hidden in it — the way real attacks hide
> things — is an instruction telling a shopping agent to secretly send $1,000 to an
> attacker's wallet."

**3. A resolved case (30s)**
Open the docket, click into `case_000009`.

> "Here's a case already ruled on exactly this. Verdict: developer. The agent had a
> payment tool but no confirmation step configured for it — that's a build-time gap, not
> the user's fault or the agent's."

**4. File and run a live case (90s)**
Switch to the case you pre-filed. Click "send to the validators."

> "Let's watch one happen live. Every validator independently fetches this same page
> right now and runs its own judgement — they only agree if they reach the same verdict."

Stay on this screen while it works through its stages. This is normally the longest part
of the video — that's fine, it's the point.

**If it's taking a long time:** say so once, plainly, and cut to the resolved case as your
backup:

> "This one's taking a while — Bradbury testnet gets busy sometimes. Here's a case that
> already completed the same round."

**5. The verdict lands (20s)**

> "And there it is. This is the fourth independent run against this same evidence, and
> all four agree: developer — every time, worded differently, never tuned to match."

**6. Close (20s)**

> "Injection Court doesn't prevent attacks or insure against them — it just answers whose
> fault it was. Links to the code, the live app, and the contract are below."

---

## After recording

1. Trim any dead air.
2. Add text captions for the four links in the last few seconds: repo, live frontend,
   contract, demo page (see the Links section in `docs/SUBMISSION.md`).
3. Upload to YouTube as **Unlisted**, unless the GenLayer portal's own form says
   otherwise — check the form before publishing.
4. Once you have the URL, add it to `docs/SUBMISSION.md`.

I don't have access to the actual GenLayer submission form, so I can't confirm its exact
length limit or visibility requirement — check that directly before you finish.
