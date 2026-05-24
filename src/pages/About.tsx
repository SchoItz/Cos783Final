import React from 'react';
import './About.css';

const About: React.FC = () => {
  return (
    <div className="about-page">
      <div className="about-container">
        <span className="about-badge">COS783 — Digital Forensics 2026</span>
        <h1>About This Project</h1>

        <div className="about-card">
          <h2>Overview</h2>
          <p>
            This project demonstrates AI capability <strong>#2 — Metadata Analysis</strong> applied to
            disk-image forensics: <strong>unsupervised anomaly detection</strong> that flags suspicious
            regions and indicators an investigator should examine first. A bonus page also explores
            capability #7 (Data Analytics) over a public DFIR-tool dataset.
          </p>
        </div>

        <div className="about-card">
          <h2>What It Does</h2>
          <ul className="feature-list">
            <li>Chain-of-custody hashing (MD5, SHA-1, SHA-256) recorded before and after analysis</li>
            <li>MBR boot-signature validation, disk-signature extraction, and partition-table parsing</li>
            <li>Printable-string extraction and Indicator-of-Compromise (IOC) mining (IPs, URLs, registry keys, paths)</li>
            <li>Malware/post-exploitation keyword scanning</li>
            <li><strong>Adaptive Shannon-entropy anomaly detection</strong> (per-disk 3&sigma; control limit)</li>
            <li><strong>Hand-written Isolation Forest</strong> ranking sectors over a multivariate feature space</li>
            <li>Automated risk scoring and a ranked, severity-coded findings report</li>
            <li>Post-analysis integrity verification confirming the evidence was not modified</li>
          </ul>
        </div>

        <div className="about-card">
          <h2>AI Method</h2>
          <p>
            <strong>Unsupervised anomaly detection — two complementary models, no training data required.</strong>
          </p>
          <ul className="feature-list">
            <li>
              <strong>Adaptive entropy baseline.</strong> The tool learns each disk&rsquo;s own
              entropy distribution (mean &mu; and standard deviation &sigma;) and flags any
              sampled sector whose entropy exceeds a 3&sigma; upper control limit
              (z-score &ge; 3). Absolute entropy bands then label the likely cause:
              encryption/ransomware (&gt; 7.6 bits/byte) vs. packing/compression (7.2&ndash;7.6).
            </li>
            <li>
              <strong>Isolation Forest.</strong> A from-scratch implementation of Liu, Ting &amp; Zhou&rsquo;s
              algorithm scores each sector over a 7-dimensional feature vector
              [entropy, mean byte value, zero-byte ratio, printable-byte ratio, longest zero
              run, distinct-byte ratio, byte-pair (bigram) entropy]. Sectors that isolate
              quickly in random trees receive a high anomaly score; the top percentile is
              surfaced as a multivariate ML finding that does not rely on absolute entropy
              thresholds alone. The tool full-scans the disk where feasible (capped at 10 000
              sectors so the model stays interactive).
            </li>
          </ul>
        </div>

        <div className="about-card">
          <h2>Technology Stack</h2>
          <ul className="tech-list">
            <li><span className="tech-tag">React 19</span> Frontend UI library</li>
            <li><span className="tech-tag">TypeScript</span> Type-safe JavaScript</li>
            <li><span className="tech-tag">React Router 7</span> Client-side navigation</li>
            <li><span className="tech-tag">Web Crypto API</span> Browser-native SHA-1 / SHA-256</li>
            <li><span className="tech-tag">Hand-written MD5</span> RFC 1321 reference implementation</li>
            <li><span className="tech-tag">Custom MBR parser</span> Partition table + FS-signature detection</li>
            <li><span className="tech-tag">Custom entropy + IOC engines</span> Sector-sampled Shannon entropy, regex-driven IOC mining</li>
            <li><span className="tech-tag">Custom Isolation Forest</span> Dependency-free unsupervised ML</li>
            <li><span className="tech-tag">Python (offline)</span> Reproducible demo-image generator</li>
          </ul>
        </div>

        <div className="about-card">
          <h2>Team &amp; Responsibilities</h2>
          <ul className="feature-list">
            <li>
              <strong>Fran&ccedil;ois Scholtz &mdash; u1924232</strong>
              <br />
              <em>Forensic acquisition &amp; disk-structure engine.</em> Chain-of-custody
              hashing pipeline (hand-written MD5 + Web-Crypto SHA-1/256), MBR boot-signature
              validation, partition-table parser, and file-system signature detection.
            </li>
            <li>
              <strong>Galen Myburgh &mdash; u21504645</strong>
              <br />
              <em>AI / anomaly-detection engine.</em> Sector-sampled Shannon-entropy engine,
              adaptive per-disk 3&sigma; baseline, the from-scratch Isolation Forest, the
              IOC + malware-keyword scanners, and the risk-scoring / findings builder.
            </li>
            <li>
              <strong>Hendr&eacute; Beyer &mdash; u26846188</strong>
              <br />
              <em>Application &amp; presentation layer.</em> React/TypeScript application
              structure, routing, drag-and-drop analysis pipeline, results UI (entropy bar
              chart, Isolation Forest chart, severity-coded findings, integrity panel), and
              the Python demo-image generator + project documentation.
            </li>
          </ul>
        </div>

        <div className="about-card">
          <h2>Limitations &amp; Future Work</h2>
          <ul className="feature-list">
            <li>Analysis is single-pass over a sampled sector subset; full-image scanning would
                improve recall at the cost of in-browser memory.</li>
            <li>The Isolation Forest currently uses seven hand-engineered features; sector-locality
                correlation (cross-sector context windows) and higher-order n-gram features would
                sharpen detection of partially encrypted or obfuscated regions.</li>
            <li>Findings are presented in-app; a signed, exportable PDF/JSON report would
                strengthen evidentiary use.</li>
            <li>No file-carving or deleted-file recovery; integrating a JavaScript port of
                The Sleuth Kit would extend the tool toward a full triage suite.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default About;
