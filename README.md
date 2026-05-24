# ForensicAI

Our final-assignment project for **COS783 / Digital Forensics 2026**.

Browser-based disk-image triage tool that demonstrates AI capability **#2 — Metadata
Analysis (anomaly detection)**. You drop a disk image into the page; the tool hashes
it for chain of custody, parses the MBR and partition table by hand, pulls IOCs and
malware-keyword hits out of the raw strings, runs two unsupervised anomaly-detection
models over the sector bytes, scores the lot into a single risk number, and then
re-hashes the image so we can prove nothing got modified along the way.

## How the AI bit works

Two unsupervised models. No training data. Both refit themselves on every disk you
analyse.

1. **Adaptive entropy baseline.** We compute the mean and standard deviation of
   Shannon entropy across this disk's sampled sectors, and flag anything that sits
   three or more standard deviations above the mean. Classic statistical
   anomaly-detection (a Shewhart control limit, basically), applied to information
   entropy. The absolute entropy bands then label the likely cause: above
   7.6 bits/byte tends to mean encryption; 7.2–7.6 more often means a packer or
   compressed payload.

2. **Isolation Forest.** Liu, Ting & Zhou's 2008 algorithm, written from scratch in
   TypeScript with no ML library. For each sector we build a **seven-feature
   vector** — entropy, mean byte, zero-byte ratio, printable-byte ratio, longest
   zero run, distinct-byte ratio, and byte-pair entropy. The forest grows 100 random
   binary trees. Anomalies isolate in fewer splits than ordinary sectors do, so they
   get a higher anomaly score; we flag the top five percent. The point of having two
   models is that the entropy detector only sees one feature, whereas the forest can
   catch sectors that look strange across the whole feature set.

The whole disk is scanned where the size allows it; on larger images we stride to
keep the sample around 10 000 sectors so the model stays interactive in the browser.

## Running it locally

```bash
npm install
npm start            # http://localhost:3000
```

Production build:

```bash
CI=true npm run build
```

## Sample evidence

We ship a small demo image with the repo — `sample_evidence.dd` (8 MB) — so you can
just drag it onto the drop zone and see the tool work end to end. The generator
script is also committed if you want to regenerate it (the high-entropy region uses
fresh randomness on each run, so its hash will change; the in-app chain-of-custody
check still confirms the pre/post hashes match for that session):

```bash
python make_demo_image.py
```

## What's in the box

- Three-way cryptographic hashing (MD5, SHA-1, SHA-256), before and after analysis
- MBR boot-signature validation, disk-signature extraction, four-entry partition-table parser
- File-system magic-byte sniffer (NTFS, FAT, exFAT, ext2/3/4, HFS+)
- Printable-string extractor and regex-based IOC miner (IPs, URLs, registry keys, paths, hashes)
- Malware-tool name and post-exploitation command scanner
- Adaptive 3σ entropy anomaly detector
- From-scratch Isolation Forest over seven engineered features per sector
- Risk scoring with severity-coded findings
- Post-analysis integrity check

## Tech we used

React 19, TypeScript, React Router 7, the browser-native Web Crypto API for SHA-1
and SHA-256, and Python (only offline, only for the demo-image generator). MD5,
the MBR parser, the entropy engine, the IOC engine, the malware scanner, the
risk scoring, and the Isolation Forest are all written by us.

## Own code

The React app, the MD5 implementation, the MBR / partition parser, the entropy
engine, the adaptive baseline, the Isolation Forest, the IOC and keyword scanners
— all our work. The only runtime dependencies are React, React Router, and the
browser's Web Crypto API. By line count we estimate over 95% of the application
code (forensic logic, AI logic, UI, routing, styles) is our own.

## Team

- François Scholtz — **u19024232**
- Galen Myburgh — **u21504645**
- Hendré Beyer — **u26846188**
