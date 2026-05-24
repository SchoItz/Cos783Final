# ForensicAI — Demo recording script

**COS783 final assignment · 5-minute screen-capture video**

This is the teleprompter we'll read off when we record. It covers the speaking
order, who says what, what to click on screen and when, and the full word-for-word
script. Total runtime is **5:00 — that's the hard cap, no speeding up allowed.**

---

## Who's doing what

| Member | What you built | What you cover in the video |
|---|---|---|
| **Hendré Beyer** (u26846188) | App layer — React UI, routing, drag-and-drop pipeline, results visualisation, the Python demo-image generator | Opens, walks the dev environment + UI, closes |
| **François Scholtz** (u1924232) | Forensic-acquisition layer — chain-of-custody hashing (incl. the from-scratch MD5), MBR parser, partition table, FS signature detection | Phase 1 and Phase 2 |
| **Galen Myburgh** (u21504645) | AI layer — adaptive entropy baseline, Isolation Forest, IOC and keyword scanners, risk scoring | Phase 3 (the AI bit) |

---

## Things to do before pressing record

Tick these off first.

- [ ] OBS Studio installed (or QuickTime on Mac) and a quick test recording done so we know the mic levels are right
- [ ] All three mics tested, one combined audio track
- [ ] `npm start` already running on `http://localhost:3000`
- [ ] Browser zoomed to **110%** so the marker can read the findings
- [ ] Bookmark bar hidden, other tabs closed, notifications off
- [ ] VS Code open with these tabs in this order:
  - `src/ai/isolationForest.ts`
  - `src/pages/DiskForensics.tsx`
- [ ] Terminal pane open inside VS Code, sitting in the project root
- [ ] Any old `sample_evidence.dd` deleted so we can show the generator run
- [ ] Browser sitting on the Home page (`/`)
- [ ] One full dry run done end-to-end with a stopwatch — under 5:00

---

## The script

> Legend: *italics* = stage direction (what to click, what's on screen). **Bold name** = who's speaking. Plain text in quote blocks = the words to say.

---

### 0:00 – 0:30 · Opening (30s) — HENDRÉ

*Browser is on the Home page.*

**HENDRÉ:**

> "Hi, we're team ForensicAI. I'm **Hendré Beyer**, student number **u26846188**.
> With me are **François Scholtz**, **u1924232**, and **Galen Myburgh**, **u21504645**.
>
> For the final assignment we chose AI capability number two — **Metadata Analysis**.
> What we built is a browser-based disk-forensics triage tool that runs two
> unsupervised anomaly-detection models over the bytes of a disk image. The whole
> thing is in TypeScript and React, and the AI is a from-scratch Isolation Forest.
> Let me show you."

*Click **Open the analyser** to navigate to `/forensics`.*

---

### 0:30 – 1:15 · Dev environment and demo data (45s) — HENDRÉ

*Alt-tab to VS Code briefly so the editor is on screen.*

**HENDRÉ:**

> "Here's our dev environment — VS Code, React 19, TypeScript, Git on a feature
> branch. Everything forensic and AI in this codebase is our own work: the MD5
> implementation, the MBR parser, the entropy engine, the Isolation Forest. The
> only runtime libraries we use are React itself, React Router, and the browser's
> built-in Web Crypto API for SHA-1 and SHA-256.
>
> My part of the team was the React app, the analysis pipeline UI, the results
> visualisation, and the Python script I'm about to run."

*Click into the terminal pane and run:*

```
python3 make_demo_image.py
```

*Output says: `Wrote sample_evidence.dd (8 MB)…`*

**HENDRÉ:**

> "That script writes an 8 MB raw disk image with a valid MBR, an NTFS partition,
> a 2 MB high-entropy region, and a handful of embedded malware indicators — so
> we've got something realistic to drop into the tool."

*Alt-tab back to the browser. Drag `sample_evidence.dd` onto the drop zone. Click **▶ Run Forensic Analysis**.*

**HENDRÉ:**

> "I drop the evidence in, start the pipeline, and while it runs I'll hand over
> to François."

---

### 1:15 – 2:15 · Phase 1 + Phase 2 (60s) — FRANÇOIS

*Scroll to the Phase 1 panel as the hashes appear.*

**FRANÇOIS:**

> "Thanks, Hendré. I'm **François**. I built the acquisition side of the tool.
>
> **Phase 1** is where we set up the chain of custody. Before we touch anything
> on the disk image, we hash it three different ways — MD5, SHA-1, and SHA-256
> — and record a UTC timestamp. The MD5 you see on screen is my own
> implementation of the RFC 1321 algorithm, written by hand, not a library
> call. SHA-1 and SHA-256 use the browser's Web Crypto API."

*Point at the three hash rows and the timestamp.*

*Scroll down to the Phase 2 panel.*

**FRANÇOIS:**

> "**Phase 2** parses the disk's binary layout. We check the boot signature at
> bytes 510 and 511 — `0x55AA` confirms it's a valid MBR. We pull the disk
> signature from bytes 440 to 443, sniff the volume boot record for known
> file-system magic bytes — here we see NTFS — and parse all four partition
> entries from bytes 446 to 510.
>
> The row on screen shows one bootable NTFS partition starting at LBA 2048.
> Every byte offset there I read straight off the MBR specification — no
> third-party parser, no shortcuts. Over to Galen for the AI side."

---

### 2:15 – 3:45 · Phase 3, the AI (90s) — GALEN

*Click the **Entropy** tab.*

**GALEN:**

> "Thanks, François. I'm **Galen**. I built the AI side of the tool, which is
> two complementary unsupervised models. Neither one uses training data, and
> both are fitted from scratch on every disk you drop in.
>
> **Model one — adaptive entropy baseline.** The trick is that we don't use a
> fixed entropy threshold. Instead, the tool works out the mean and standard
> deviation of Shannon entropy across this particular disk, and flags any
> sector that sits three or more standard deviations above that mean. That's
> classical statistical anomaly detection — a Shewhart-style control chart
> applied to information entropy. You can see the baseline the model learned
> right there on screen — mu, sigma, and the 3-sigma cutoff, all derived from
> the data, not hard-coded."

*Point at the learned μ / σ / threshold values, then sweep across the red bars in the entropy chart.*

**GALEN:**

> "**Model two — our Isolation Forest.** This is a from-scratch implementation of
> the Liu, Ting and Zhou algorithm from 2008. For every sector we build a
> seven-feature vector: entropy, mean byte value, zero-byte ratio,
> printable-byte ratio, longest zero run, distinct-byte ratio, and byte-pair
> entropy. Then we grow a hundred random binary trees over those features. The
> sectors that 'isolate' fastest get the highest anomaly score, and we flag
> the top five percent."

*Scroll to the Isolation Forest chart. Hover one of the red bars to show the tooltip.*

**GALEN:**

> "What you see here is that both models — completely independent of each other
> — flag the same region between 3 and 5 megabytes. That's the encrypted
> chunk Hendré's generator embedded. Two independent unsupervised methods
> agreeing on the same anomaly — that's cross-validation."

*Alt-tab to VS Code, click the `src/ai/isolationForest.ts` tab so the source is visible for two seconds.*

**GALEN:**

> "This is the Isolation Forest source — about 90 lines of TypeScript, no ML
> dependency. Back to Hendré."

*Alt-tab back to the browser.*

---

### 3:45 – 4:30 · Findings, IOCs, integrity (45s) — HENDRÉ

*Click the **Findings** tab. Scroll so the IF finding, the entropy finding, and the malware-keyword finding are visible.*

**HENDRÉ:**

> "Everything ends up in this findings panel. You can see the Isolation Forest
> result, the entropy anomaly, the malware-keyword hits — `mimikatz`,
> `powershell -enc` — and the IOCs that our regex extractor pulled out of
> the raw strings on the disk."

*Click the **IOCs** tab briefly. Scroll once.*

**HENDRÉ:**

> "Here are the IOCs themselves — public IPs, a command-and-control URL, a
> Windows registry-run key, Linux paths. The risk score at the top of the page
> — currently **critical** — is computed from the weighted severity of every
> finding."

*Scroll down to the Phase 4 panel.*

**HENDRÉ:**

> "And **Phase 4** is the integrity check. We re-hash the evidence after
> everything is done. All three hashes match — chain of custody preserved.
> The disk image was not modified at any point during the analysis."

---

### 4:30 – 5:00 · Close — ALL THREE (30s)

*Scroll back up so the red **CRITICAL** risk banner is on screen for the close.*

**HENDRÉ:**

> "To wrap up — we built AI capability number two with two real unsupervised
> machine-learning models, fitted on every disk, wrapped in a full
> chain-of-custody forensic workflow."

**FRANÇOIS:**

> "All the cryptographic hashing and binary parsing is hand-written, no
> third-party forensic libraries."

**GALEN:**

> "And the Isolation Forest is from scratch, seven features per sector — a
> proper unsupervised anomaly detector for disk metadata."

**HENDRÉ:**

> "Thanks for watching. Our names and student numbers are in the video
> description."

*Hold the closing frame for two seconds, then stop the recording.*

---

## Time budget

| Segment | Speaker | Time | Cumulative |
|---|---|---|---|
| Opening | Hendré | 0:30 | 0:30 |
| Dev environment + demo image | Hendré | 0:45 | 1:15 |
| Phase 1 + Phase 2 | François | 1:00 | 2:15 |
| Phase 3 (AI) | Galen | 1:30 | 3:45 |
| Findings, IOCs, integrity | Hendré | 0:45 | 4:30 |
| Three-way close | All | 0:30 | 5:00 |

Speaking time per person: Hendré 2:30, François 1:00, Galen 1:30. Hendré's
share is bigger because the opener, the closer, and the UI walkthroughs are
naturally his territory as the front-end lead. If we want a more even split,
shave 10 seconds off "Findings, IOCs, integrity" and let François open
Phase 3.

---

## Rubric checklist (tick after the dry run)

Every line on the rubric has to show up somewhere on tape. Use this to verify.

- [ ] **Dev environment proof (5)** — VS Code, terminal, `python3`, browser dev server visible at 0:30–1:15
- [ ] **% own code (10)** — Hendré's verbal claim at 0:30–1:15, reinforced when François and Galen show their source files
- [ ] **Contribution to DF (10)** — chain of custody, MBR parsing, IOC mining, integrity check (1:15–4:30)
- [ ] **AI contribution (5)** — both models visibly running, both surfaced in findings (2:15–3:45)
- [ ] **Understanding of AI capability (5)** — Galen walks through both algorithms with reasoning, formulas referenced
- [ ] **Data preprocessing (5)** — Python image generator (0:30–1:15) + seven-feature vector explanation (2:15–3:45)
- [ ] **Output and presentation (10)** — every panel of the polished UI on screen from 1:15 onward
- [ ] **All three speakers on tape** — handoffs at 1:15, 2:15, 3:45, 4:30

---

## Recording and upload checklist

- [ ] Record at 1920 × 1080, 30 fps
- [ ] Export as MP4 (H.264) — most reliable across platforms
- [ ] Target under 500 MB so Drive upload doesn't drag
- [ ] No speed-ups, no time-lapse, no frame cuts (the brief is explicit about this)
- [ ] Upload to Google Drive (most reliable). YouTube unlisted is also fine.
- [ ] On Drive: *Share → Anyone with the link → **Viewer***
- [ ] Test the link from an incognito window before submitting
- [ ] ClickUP submission: just the link, plus all three names and student numbers
- [ ] All three of us submit the link individually if ClickUP requires it

---

## If something goes wrong on the day

| Problem | What to do |
|---|---|
| `npm start` won't come up | Serve the pre-built `build/` folder with `npx serve -s build` |
| `sample_evidence.dd` won't regenerate | Use the one already in the repo and skip the `python3` step (still mention the script verbally) |
| Analysis takes longer than expected | Stay calm — the script already covers Phase 1 and Phase 2 verbally while the pipeline runs |
| Speaker fluffs a line | Pause one beat, take a breath, re-deliver. Do not stop the recording — re-shoots eat the day |
| The demo image shows zero anomalies somehow | Re-run the generator (the random region changes each time), drag the new file in |

---

## One-liner for the video description box

> "ForensicAI — a browser-based digital-forensics triage tool for COS783, demonstrating AI capability #2 (Metadata Analysis). Two from-scratch unsupervised anomaly-detection models — an adaptive 3σ entropy baseline and a hand-written Isolation Forest — applied to disk-image sectors, alongside chain-of-custody hashing, MBR parsing, and IOC extraction. Built by François Scholtz (u1924232), Galen Myburgh (u21504645), and Hendré Beyer (u26846188)."

---

Good luck, team.
