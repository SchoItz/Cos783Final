# ForensicAI — AI-Assisted Disk Forensics (COS783 / DF 2026)

A browser-based digital-forensics triage tool demonstrating **AI capability #2 — Metadata Analysis (anomaly detection)**.
Drop a disk image and the tool performs chain-of-custody hashing, MBR/partition parsing, IOC + malware-keyword
extraction, **adaptive Shannon-entropy anomaly detection**, and ranking with a **hand-written Isolation Forest** —
producing a severity-coded, risk-scored findings report and a post-analysis integrity check.

## AI method

**Unsupervised anomaly detection — two complementary models.**

1. **Adaptive entropy baseline.** The tool learns each disk's own entropy distribution (mean μ and standard
   deviation σ) and flags sampled sectors whose entropy exceeds a 3σ upper control limit (z-score ≥ 3).
   Absolute entropy bands then label the likely cause: encryption/ransomware (> 7.6 bits/byte) vs.
   packing/compression (7.2–7.6).
2. **Isolation Forest.** A from-scratch implementation of Liu, Ting & Zhou's algorithm scores each
   sector over a **7-dimensional feature vector** `[entropy, mean byte value, zero-byte ratio,
   printable-byte ratio, longest zero run, distinct-byte ratio, byte-pair (bigram) entropy]`.
   Sectors that isolate quickly in random trees receive a high anomaly score; the top percentile
   is surfaced as a multivariate ML finding. The disk is full-scanned where feasible (capped at
   10 000 sectors so the model stays interactive).

## Run

```bash
npm install
npm start            # http://localhost:3000
```

Build for production:

```bash
CI=true npm run build
```

## Demo data

A reproducible 8 MB demo image with a valid MBR, an NTFS signature, a high-entropy
"encrypted" region, malware-keyword strings, and IOCs is **committed to the repo as
`sample_evidence.dd`** so you can drag it straight into the app without any setup.

To regenerate it (the high-entropy region uses fresh randomness on each run, so the
file's hash will change — the chain-of-custody check inside the app still confirms
pre/post-analysis MATCH):

```bash
python make_demo_image.py    # overwrites sample_evidence.dd
```

## Features

- Chain-of-custody hashing (MD5, SHA-1, SHA-256) recorded before and after analysis
- MBR boot-signature validation, disk-signature extraction, partition-table parsing
- Printable-string extraction + IOC mining (IPs, URLs, registry keys, paths, hashes)
- Malware / post-exploitation keyword scanning
- Adaptive Shannon-entropy anomaly detection (per-disk 3σ control limit)
- Hand-written Isolation Forest over multivariate sector features
- Automated risk scoring and severity-coded findings report
- Post-analysis integrity verification (chain-of-custody confirmation)

## Tech stack

React 19, TypeScript, React Router 7, Web Crypto API, custom MBR/partition parser,
hand-written MD5 (RFC 1321), custom entropy + IOC engines, hand-written Isolation Forest.
Python is used only **offline** to generate the demo disk image; the app itself is 100% in-browser.

## Own code

The entire React/TypeScript application, the MD5 implementation, the MBR/partition parser,
the Shannon-entropy engine, the IOC + keyword scanners, the adaptive baseline / z-score
logic, and the Isolation Forest are written by the team. The only third-party runtime
dependencies are React, React Router, and the browser-native Web Crypto API. We estimate
**> 95 %** of the application code (forensic + AI logic, UI, routing, styles) is our own.

## Team

- François Scholtz — **u1924232**
- Galen Myburgh — **u21504645**
- Hendré Beyer — **u26846188**
