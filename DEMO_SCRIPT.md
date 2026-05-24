# ForensicAI — Demo Recording Script

**COS783 Final Assignment · 5-minute screen-capture demo**

This document is a word-for-word script with timing markers, on-screen
actions, and speaker assignments. Read it as a teleprompter. Total runtime:
**5:00 (300 seconds, hard cap — no speeding up allowed).**

---

## Team & speaking responsibilities

| Member | Role in the project | Role in the demo |
|---|---|---|
| **Hendré Beyer** (u26846188) | App / presentation layer (React UI, routing, drag-and-drop pipeline, results visualisation, Python demo-image generator) | Opens the demo, walks the dev environment + UI, closes the demo |
| **François Scholtz** (u1924232) | Forensic-acquisition engine (hash chain-of-custody, MBR parser, partition table, file-system signature detection) | Phase 1 + Phase 2 walkthrough |
| **Galen Myburgh** (u21504645) | AI / anomaly-detection engine (adaptive entropy baseline, Isolation Forest, IOC + keyword scanning, risk scoring) | Phase 3 — the AI deep-dive |

---

## Pre-recording checklist

Run through this before pressing record. All free tools.

- [ ] **OBS Studio** (or QuickTime on macOS) installed and tested
- [ ] Microphones tested for all three speakers; same recording, single track
- [ ] `npm start` already running on `http://localhost:3000`
- [ ] Browser zoom set to **110 %** so the marker can read the findings
- [ ] Bookmarks bar hidden, other tabs closed, notifications muted
- [ ] VS Code open with these tabs in order:
  - `src/ai/isolationForest.ts`
  - `src/pages/DiskForensics.tsx`
- [ ] Terminal pane visible inside VS Code, cwd = project root
- [ ] **Delete any existing `sample_evidence.dd`** so the regeneration is visible
- [ ] Browser sitting on the Home page (`/`)
- [ ] One full rehearsal complete; total under 5:00 with a stopwatch

---

## The script

> **Legend.** *Italic text = stage direction (what's on screen / what to click).* **Bold name** = who is speaking. Plain text = the words to say.

---

### 0:00 – 0:30 · OPENING (30 s) — HENDRÉ

*Browser is on the Home page. Title and team name visible.*

**HENDRÉ:**

> "Good afternoon. We are team ForensicAI. My name is **Hendré Beyer**, student number **u-two-six, eight-four-six, one-eight-eight**. With me are **François Scholtz**, student number **u-one-nine-two-four, two-three-two**, and **Galen Myburgh**, student number **u-two-one, five-zero-four, six-four-five**.
>
> For the COS783 final assignment we chose **AI capability number two — Metadata Analysis**: unsupervised anomaly detection applied to disk-image forensics. What you are about to see is a browser-based digital-forensics triage tool that we built end-to-end in React and TypeScript, with a hand-written Isolation Forest as the core AI engine."

*Click **Launch Disk Forensics** to navigate to `/forensics`.*

---

### 0:30 – 1:15 · DEV ENVIRONMENT + DEMO DATA (45 s) — HENDRÉ

*Alt-tab to VS Code so the editor is briefly on screen.*

**HENDRÉ:**

> "Here is our development environment — Visual Studio Code, React 19, TypeScript, Git on a feature branch. Every piece of forensic and AI logic in this codebase is our own work: a hand-written MD5 implementation, our own MBR parser, our own entropy engine, and a from-scratch Isolation Forest. The only runtime dependencies are React, React Router, and the browser-native Web Crypto API.
>
> My contribution to the team was the React application structure, the analysis-pipeline interface, the results visualisation, and the Python demo-image generator I am about to run."

*Click into the terminal pane at the bottom of VS Code. Type and run:*

```
python3 make_demo_image.py
```

*Terminal prints: `Wrote sample_evidence.dd (8 MB)…`*

**HENDRÉ:**

> "This script writes an eight-megabyte raw disk image containing a valid Master Boot Record, an NTFS partition, a two-megabyte high-entropy region, and several embedded malware indicators — so our tool has realistic evidence to analyse."

*Alt-tab back to the browser at `/forensics`. Drag `sample_evidence.dd` from Finder onto the drop zone. Click **▶ Run Forensic Analysis**.*

**HENDRÉ:**

> "I drop the evidence into the analyser and start the pipeline. While it runs, I'll hand over to François."

---

### 1:15 – 2:15 · PHASE 1 + PHASE 2 — FORENSIC ACQUISITION & DISK STRUCTURE (60 s) — FRANÇOIS

*Analysis is running. Results begin to appear. Scroll to Phase 1 panel.*

**FRANÇOIS:**

> "Thank you, Hendré. I am **François**, and I built the forensic-acquisition layer of the tool.
>
> **Phase 1 establishes the chain of custody.** Before any analysis begins, we compute three independent cryptographic hashes of the evidence — **MD5**, **SHA-1**, and **SHA-256** — and record a UTC timestamp. The MD5 you see on screen is calculated by my own implementation of the RFC 1321 algorithm — not a library call. SHA-1 and SHA-256 use the browser-native Web Crypto API."

*Point at the three hash rows and the timestamp.*

*Scroll down to Phase 2 panel.*

**FRANÇOIS:**

> "**Phase 2 parses the disk's binary structure.** I read the MBR boot signature at bytes 510 to 511 — `0x55AA` confirms a valid Master Boot Record. I extract the disk signature from bytes 440 to 443, identify the file-system magic bytes — here you see **NTFS** detected — and parse all four partition-table entries from bytes 446 to 510.
>
> The table on screen shows one bootable NTFS partition starting at LBA 2048. All of this is byte-level parsing, written by hand against the MBR specification — no third-party parser, no shortcuts.
>
> Galen will now walk us through Phase 3, where the AI does its work."

---

### 2:15 – 3:45 · PHASE 3 — AI ANOMALY DETECTION (90 s) — GALEN

*Scroll to the Findings list, then click the **Entropy** tab.*

**GALEN:**

> "Thank you, François. I am **Galen**, and I built the artificial-intelligence layer of this tool. It consists of **two complementary unsupervised machine-learning models**, both fitted fresh on every disk image — neither requires any pre-labelled training data.
>
> **Model one — Adaptive 3-sigma entropy baseline.** Rather than using a hard-coded threshold, the tool calculates the mean and standard deviation of Shannon entropy across every sector of *this* disk. Any sector that lies more than three standard deviations above the mean is flagged as a statistical outlier. You can see the learned baseline live on screen — mu, sigma, and the three-sigma threshold the model derived from the data alone. This is classical statistical anomaly detection — a Shewhart-style control limit applied to information entropy."

*Point at the learned μ / σ / threshold values shown above the chart, then sweep the cursor across the red bars in the first entropy chart.*

**GALEN:**

> "**Model two — Isolation Forest.** This is a from-scratch implementation of the Liu, Ting and Zhou twenty-oh-eight algorithm. For each sector we engineer a **seven-dimensional feature vector**: entropy, mean byte value, zero-byte ratio, printable-byte ratio, longest zero run, distinct-byte ratio, and byte-pair entropy. The model then builds one hundred random binary trees over these features. Anomalies isolate in fewer splits — so they receive a higher anomaly score, between zero and one."

*Scroll down to the Isolation Forest chart. Hover one of the red bars so the tooltip appears.*

**GALEN:**

> "On screen you can see the per-sector Isolation Forest scores. Notice that both models — the statistical baseline and the Isolation Forest — independently flag the three- to five-megabyte region. That is the encrypted payload our generator embedded earlier. **We get cross-validation through two independent unsupervised methods.**"

*Alt-tab to VS Code, click the `src/ai/isolationForest.ts` tab so the source is visible for two seconds.*

**GALEN:**

> "This is the Isolation Forest source — hand-written, dependency-free, around ninety lines of TypeScript. I'll hand back to Hendré to close the demo."

*Alt-tab back to the browser.*

---

### 3:45 – 4:30 · FINDINGS, IOCs, INTEGRITY (45 s) — HENDRÉ

*Click the **Findings** tab. Scroll so the IF finding, the entropy finding, and the malware-keyword finding are visible.*

**HENDRÉ:**

> "Thank you, Galen. Every result rolls up into a single findings panel. The Isolation Forest finding sits alongside the entropy anomaly, the malware-keyword hits — `mimikatz`, `powershell -enc` — and the Indicators of Compromise that our regex engine extracts from the printable strings of the disk."

*Click the **IOCs** tab. Scroll once so the table shows public IPs, URLs, registry keys.*

**HENDRÉ:**

> "Here are the extracted IOCs — public IPs, a command-and-control URL, a Windows registry-run key, and Linux paths. The risk score at the top of the page — currently **critical** — is computed from the weighted severity of every finding."

*Scroll down to the Phase 4 panel.*

**HENDRÉ:**

> "Finally, **Phase 4 — Integrity Verification.** We re-compute all three cryptographic hashes after analysis is complete. All three show MATCH — the chain of custody is preserved. The evidence was not modified at any point during analysis."

---

### 4:30 – 5:00 · CLOSE — ALL THREE (30 s)

*Scroll back up so the red **CRITICAL** risk banner is on screen for the close.*

**HENDRÉ:**

> "To summarise — we have implemented AI capability number two with two real unsupervised machine-learning models, fitted per disk, embedded inside a full chain-of-custody forensic workflow."

**FRANÇOIS:**

> "Hand-written cryptographic hashing and binary structure parsing, with no third-party forensic libraries."

**GALEN:**

> "And a from-scratch Isolation Forest with seven engineered features per sector, demonstrating unsupervised metadata anomaly detection."

**HENDRÉ:**

> "Thank you. Our student numbers and the source-code link are in the video description."

*Hold the closing frame for two seconds before stopping the recording.*

---

## Time budget summary

| Segment | Speaker | Duration | Cumulative |
|---|---|---|---|
| Opening | Hendré | 0:30 | 0:30 |
| Dev env + demo image | Hendré | 0:45 | 1:15 |
| Phase 1 + Phase 2 | François | 1:00 | 2:15 |
| Phase 3 (AI) | Galen | 1:30 | 3:45 |
| Findings + integrity | Hendré | 0:45 | 4:30 |
| Three-way close | All | 0:30 | 5:00 |

**Total airtime per speaker:** Hendré 2:30 · François 1:00 · Galen 1:30.

> Note: Hendré's larger share is because the opener, the closer, and the UI walkthroughs naturally fall to the presentation-layer owner. If you would prefer a more even split, shave 10 s off "Findings + integrity" and give the opening of Phase 3 to François.

---

## Rubric coverage check

Tick each one off after the rehearsal — every line must be covered on tape.

- [ ] **Proof of dev environment (5)** — VS Code + terminal + `python3` + browser dev server visible during 0:30–1:15
- [ ] **Percentage of own code (10)** — explicit verbal claim by Hendré (0:30–1:15) and reinforced by François and Galen showing source files
- [ ] **Contribution to DF (10)** — chain of custody, MBR parsing, IOC extraction, integrity check all demonstrated (1:15–4:30)
- [ ] **AI contribution (5)** — two ML models visibly running on screen (2:15–3:45)
- [ ] **Understanding of AI capability (5)** — Galen's verbal explanation of both algorithms, formulas referenced
- [ ] **Data preprocessing (5)** — Python image generator (0:30–1:15) + seven-feature vector (2:15–3:45)
- [ ] **Output and presentation (10)** — every panel of the polished UI on screen from 1:15 onward
- [ ] **All three speakers visible/audible** — handoffs at 1:15, 2:15, 3:45, 4:30

---

## Recording & upload checklist

- [ ] Record at **1920 × 1080** (1080p) at 30 fps
- [ ] Export as **MP4** (`.mp4`, H.264) — most reliable cross-platform
- [ ] Target file size < 500 MB
- [ ] Do **not** speed up, time-lapse, or cut frames out
- [ ] Upload to **Google Drive** (or YouTube as unlisted, if preferred)
- [ ] On Drive: *Share → Anyone with the link → **Viewer***
- [ ] **Test the link in an incognito / private browser window** before submitting
- [ ] On ClickUP, submit only the link plus all three names and student numbers
- [ ] All three team members submit the same link individually if ClickUP requires it

---

## Backup plan if something goes wrong on the day

| Problem | Fix |
|---|---|
| `npm start` won't run | Use the pre-built `build/` folder served by `npx serve -s build` |
| `sample_evidence.dd` won't generate | Pre-generate it before recording and skip the `python3` step (keep the verbal mention of the script) |
| Analysis takes longer than expected | Don't worry — narrate Phase 1 / Phase 2 while it runs; that is what the script already does |
| Speaker fluffs a line | Pause, take a breath, re-deliver that line. Do **not** stop the recording — a one-second silence is invisible; a re-shoot eats your day |
| Browser shows zero anomalies | The image generator uses fresh randomness each run — re-generate `sample_evidence.dd` and re-drag |

---

## One-line elevator pitch (for the video description box on Drive / YouTube)

> "ForensicAI — a browser-based digital-forensics triage tool demonstrating AI capability #2 (Metadata Analysis) for COS783. Two from-scratch unsupervised ML models — an adaptive 3σ entropy baseline and a hand-written Isolation Forest — perform anomaly detection on disk images, alongside chain-of-custody hashing, MBR parsing, and IOC extraction. Built by François Scholtz (u1924232), Galen Myburgh (u21504645), and Hendré Beyer (u26846188)."

---

**Good luck, team.**
