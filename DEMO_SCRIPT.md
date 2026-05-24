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
| **François Scholtz** (u19024232) | Forensic-acquisition layer — chain-of-custody hashing (incl. the from-scratch MD5), MBR parser, partition table, FS signature detection | Phase 1 and Phase 2 |
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
- [ ] `sample_forensic_tools.jsonl` handy in Finder (only if doing the Data Analytics bonus)
- [ ] Browser sitting on the Home page (`/`)
- [ ] One full dry run done end-to-end with a stopwatch — under 5:00

---

## The script

> Legend: *italics* = stage direction (what to click, what's on screen). **Bold name** = who's speaking. Plain text in quote blocks = the words to say.

---

### 0:00 – 0:25 · Opening (25s) — HENDRÉ

*Browser is on the Home page.*

**HENDRÉ:**

> "Hi, we're team ForensicAI — I'm **Hendré Beyer**, **u26846188**, with
> **François Scholtz**, **u19024232**, and **Galen Myburgh**, **u21504645**.
> For the final assignment we chose AI capability number two — Metadata
> Analysis. We built a browser-based disk-forensics tool that runs two
> unsupervised anomaly-detection models over a disk image — all in TypeScript
> and React, with a from-scratch Isolation Forest. Let me show you."

*Click **Open the analyser** to navigate to `/forensics`.*

---

### 0:25 – 1:00 · Dev environment and demo data (35s) — HENDRÉ

*Alt-tab to VS Code briefly so the editor is on screen.*

**HENDRÉ:**

> "This is our dev environment — VS Code, React 19, TypeScript, Git.
> Everything forensic and AI here is our own: the MD5, the MBR parser, the
> entropy engine, the Isolation Forest. The only libraries are React, React
> Router, and the browser's Web Crypto API. My part was the app, the UI, and
> this Python generator."

*Click into the terminal pane and run:*

```
python3 make_demo_image.py
```

*Output says: `Wrote sample_evidence.dd (8 MB)…`*

**HENDRÉ:**

> "That writes an 8 MB disk image with a valid MBR, an NTFS partition, a
> high-entropy region, and some embedded malware indicators."

*Alt-tab back to the browser. Drag `sample_evidence.dd` onto the drop zone. Click **▶ Run Forensic Analysis**.*

**HENDRÉ:**

> "I drop it in, start the pipeline, and hand over to François."

---

### 1:00 – 1:45 · Phase 1 + Phase 2 (45s) — FRANÇOIS

*Scroll to the Phase 1 panel as the hashes appear.*

**FRANÇOIS:**

> "Thanks. I'm **François** — I built the acquisition side. **Phase 1** is chain
> of custody: before we touch anything, we hash the image three ways — MD5,
> SHA-1, SHA-256. The MD5 is my own RFC 1321 implementation, not a library."

*Point at the hash rows, then scroll to the Phase 2 panel.*

**FRANÇOIS:**

> "**Phase 2** parses the binary layout. The `0x55AA` signature at bytes 510 and
> 511 confirms a valid MBR. We read the disk signature, detect the file system
> — NTFS here — and parse all four partition entries by hand. One bootable NTFS
> partition at LBA 2048. Over to Galen."

---

### 1:45 – 2:55 · Phase 3, the AI (70s) — GALEN

*Click the **Entropy** tab.*

**GALEN:**

> "Thanks. I'm **Galen** — I built the AI: two unsupervised models, no training
> data, both fitted per disk. First, the **adaptive entropy baseline**. Instead
> of a fixed threshold, we compute this disk's own mean and standard deviation
> of Shannon entropy, and flag any sector three sigma above the mean — a
> control-chart approach. You can see the learned mu, sigma, and cutoff on
> screen."

*Point at the learned μ / σ / cutoff, then sweep across the red bars.*

**GALEN:**

> "Second, our **Isolation Forest** — the Liu, Ting and Zhou algorithm, from
> scratch. Each sector becomes a seven-feature vector, and a hundred random
> trees score how fast it isolates. We flag the top five percent. Notice both
> models independently flag the same 3-to-5-megabyte region — that's the
> encrypted chunk, found two different ways."

*Alt-tab to VS Code, click the `src/ai/isolationForest.ts` tab for two seconds.*

**GALEN:**

> "That's the Isolation Forest — ninety lines of TypeScript, no ML library.
> Back to Hendré."

*Alt-tab back to the browser.*

---

### 2:55 – 3:30 · Findings, IOCs, integrity (35s) — HENDRÉ

*Click the **Findings** tab, then briefly the **IOCs** tab.*

**HENDRÉ:**

> "Everything lands in the findings panel — the Isolation Forest result, the
> entropy anomaly, malware keywords like `mimikatz`, and the IOCs our regex
> pulled from the strings: public IPs, a C2 URL, a registry key. The risk score
> up top is critical."

*Scroll down to the Phase 4 panel.*

**HENDRÉ:**

> "And **Phase 4** re-hashes the image — all three match, so the chain of
> custody held and nothing was modified. François will quickly show our bonus
> page before we wrap up."

---

### 3:30 – 4:05 · Bonus — Data Analytics, capability #7 (35s) — FRANÇOIS · OPTIONAL

> **Optional segment.** This earns the bonus marks and gives François a second
> turn, but it pushes the runtime to ~4:25. If your dry run is already tight,
> drop this block and go straight to the close — the main demo stands on its own.

*Click **Data Analytics** in the navbar to open `/analytics`. The bundled dataset is already loaded.*

**FRANÇOIS:**

> "On top of the main tool we also built a small bonus around capability number
> seven, Data Analytics. It loads a dataset of forensic tools and does pattern
> recognition over it — counting platforms, and auto-classifying each tool into
> a category from its description. Right now it's showing the 50-tool set we
> bundled with the app."

*Drag `sample_forensic_tools.jsonl` onto the upload zone on the left.*

**FRANÇOIS:**

> "But it's not hard-coded — I can drop in a completely different dataset and it
> re-analyses on the spot. You can see the tool count jump to 52, the platform
> bars redraw — Linux and Windows leading — and the category breakdown updates,
> from disk forensics through memory, network and mobile. Same idea as the main
> tool: let the data tell us the pattern. Back to the team to close."

---

### 4:05 – 4:25 · Close — ALL THREE (20s)

*Scroll back up so the red **CRITICAL** risk banner is on screen.*

**HENDRÉ:** > "So — capability number two, two unsupervised ML models, in a full chain-of-custody workflow."

**FRANÇOIS:** > "Hand-written hashing and parsing, no forensic libraries."

**GALEN:** > "And a from-scratch Isolation Forest, seven features per sector."

**HENDRÉ:** > "Thanks for watching — our names and numbers are in the description."

*Hold the closing frame for two seconds, then stop the recording.*

---

## Time budget

| Segment | Speaker | Time | Cumulative |
|---|---|---|---|
| Opening | Hendré | 0:25 | 0:25 |
| Dev environment + demo image | Hendré | 0:35 | 1:00 |
| Phase 1 + Phase 2 | François | 0:45 | 1:45 |
| Phase 3 (AI) | Galen | 1:10 | 2:55 |
| Findings, IOCs, integrity | Hendré | 0:35 | 3:30 |
| *Bonus — Data Analytics (optional)* | *François* | *0:35* | *4:05* |
| Three-way close | All | 0:20 | 3:50 *(or 4:25 with bonus)* |

**Two ways to run it:**

- **Without the bonus** — finishes around **3:50**, lands at ~4:00–4:15 at a
  relaxed pace. Roughly a minute of buffer under the 5:00 cap.
- **With the bonus** — finishes around **4:25**, lands at ~4:35–4:45. Still
  inside the cap, and it picks up the bonus marks. Use this if your dry run is
  comfortable.

Speaking time per person without the bonus: Hendré ~1:55, François ~0:45,
Galen ~1:10. With the bonus, François goes up to ~1:20, which evens things out
nicely. Either way you've got headroom — if anyone slows down or the analysis
takes a beat, you're still under five minutes.

---

## Rubric checklist (tick after the dry run)

Every line on the rubric has to show up somewhere on tape. Use this to verify.

- [ ] **Dev environment proof (5)** — VS Code, terminal, `python3`, browser dev server visible at 0:25–1:00
- [ ] **% own code (10)** — Hendré's verbal claim at 0:25–1:00, reinforced when François and Galen show their source files
- [ ] **Contribution to DF (10)** — chain of custody, MBR parsing, IOC mining, integrity check (1:00–3:30)
- [ ] **AI contribution (5)** — both models visibly running, both surfaced in findings (1:45–2:55)
- [ ] **Understanding of AI capability (5)** — Galen walks through both algorithms with reasoning, formulas referenced
- [ ] **Data preprocessing (5)** — Python image generator (0:25–1:00) + seven-feature vector explanation (1:45–2:55)
- [ ] **Output and presentation (10)** — every panel of the polished UI on screen from 1:00 onward
- [ ] **Bonus (5)** — Data Analytics page shown, a second dataset dropped in live (only if doing the optional segment)
- [ ] **All three speakers on tape** — handoffs at 1:00, 1:45, 2:55, 3:30 (and 4:05 if running the bonus)

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

> "ForensicAI — a browser-based digital-forensics triage tool for COS783, demonstrating AI capability #2 (Metadata Analysis). Two from-scratch unsupervised anomaly-detection models — an adaptive 3σ entropy baseline and a hand-written Isolation Forest — applied to disk-image sectors, alongside chain-of-custody hashing, MBR parsing, and IOC extraction. Built by François Scholtz (u19024232), Galen Myburgh (u21504645), and Hendré Beyer (u26846188)."

---

Good luck, team.
