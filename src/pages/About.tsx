import React from 'react';
import './About.css';

const About: React.FC = () => {
  return (
    <div className="about-page">
      <div className="about-container">
        <span className="about-badge">COS783 — Digital Forensics, 2026</span>
        <h1>About this project</h1>

        <div className="about-card">
          <h2>What we built and why</h2>
          <p>
            For the final assignment we picked AI capability <strong>#2 &mdash; Metadata Analysis</strong>,
            and we read it the way the brief actually frames it: <em>"pattern recognition,
            anomaly detection, and correlation analysis &hellip; identify suspicious patterns
            or outliers."</em> So we built a browser-based disk-image triage tool that does
            exactly that &mdash; two unsupervised anomaly-detection models running over the
            raw bytes of a disk image, with proper chain-of-custody hashing wrapped around
            them. The bonus page also has a small play with capability #7 (Data Analytics)
            on a public DFIR-tool dataset.
          </p>
        </div>

        <div className="about-card">
          <h2>What it does, end to end</h2>
          <ul className="feature-list">
            <li>Hashes the evidence three ways (MD5, SHA-1, SHA-256) before and after analysis &mdash; that's our chain of custody.</li>
            <li>Validates the MBR boot signature, extracts the disk signature, and parses the four-entry partition table by hand.</li>
            <li>Sniffs the volume boot record for known file-system magic bytes (NTFS, FAT, exFAT, ext2/3/4, HFS+).</li>
            <li>Pulls printable strings out of the image and mines them for IOCs (IPs, URLs, registry keys, Windows / UNC / Linux paths, hashes).</li>
            <li>Scans those strings for the names of known malware tools and common post-exploitation command patterns.</li>
            <li>Runs the <strong>adaptive entropy detector</strong> &mdash; a 3&sigma; rule fitted to this disk's own entropy distribution.</li>
            <li>Runs our <strong>Isolation Forest</strong> over a seven-feature vector per sector.</li>
            <li>Scores everything into a single risk number with severity-coded findings.</li>
            <li>Re-hashes the evidence at the end and tells you whether the chain of custody held.</li>
          </ul>
        </div>

        <div className="about-card">
          <h2>How the AI bit actually works</h2>
          <p>
            Two complementary unsupervised models. Neither needs training data. Both are
            fitted fresh on every disk you drop in.
          </p>
          <ul className="feature-list">
            <li>
              <strong>Adaptive entropy baseline.</strong> We work out the mean and standard
              deviation of Shannon entropy across this disk's sectors, then flag anything
              that sits three or more standard deviations above that mean. The maths is
              old (Shewhart control charts, applied to information entropy), but it works
              because every disk has its own "normal" &mdash; a fresh Linux install looks
              nothing like a heavily-used Windows machine, and a fixed threshold would lie
              about both. Absolute entropy bands then label the likely cause: above
              7.6&nbsp;bits/byte usually means encryption; 7.2&ndash;7.6 is more often packed
              or compressed code.
            </li>
            <li>
              <strong>Isolation Forest.</strong> Liu, Ting and Zhou's 2008 algorithm,
              written from scratch in TypeScript (no ML library). For each sector we build
              a seven-dimensional feature vector: entropy, mean byte value, zero-byte ratio,
              printable-byte ratio, longest zero run, distinct-byte ratio, and byte-pair
              entropy. The forest grows 100 random binary trees. Anomalies isolate quickly,
              so they end up with a shorter average path length and a higher score &mdash;
              we flag the top five percent. The point of having a second model is that the
              entropy detector only sees one feature; the forest catches sectors that look
              strange across the whole set.
            </li>
          </ul>
        </div>

        <div className="about-card">
          <h2>What we used to build it</h2>
          <ul className="tech-list">
            <li><span className="tech-tag">React 19</span> UI</li>
            <li><span className="tech-tag">TypeScript</span> the whole codebase</li>
            <li><span className="tech-tag">React Router 7</span> page navigation</li>
            <li><span className="tech-tag">Web Crypto API</span> browser-native SHA-1 / SHA-256</li>
            <li><span className="tech-tag">Hand-written MD5</span> straight off RFC 1321</li>
            <li><span className="tech-tag">Our own MBR parser</span> partition table + FS signature detection</li>
            <li><span className="tech-tag">Our own entropy + IOC engines</span> Shannon entropy on sampled sectors, regex IOC mining</li>
            <li><span className="tech-tag">Our own Isolation Forest</span> no ML library, no dependencies</li>
            <li><span className="tech-tag">Python (offline)</span> reproducible demo-image generator</li>
          </ul>
        </div>

        <div className="about-card">
          <h2>Who did what</h2>
          <ul className="feature-list">
            <li>
              <strong>Fran&ccedil;ois Scholtz &mdash; u19024232</strong>
              <br />
              <em>Acquisition and disk-structure engine.</em> The chain-of-custody hashing
              pipeline (including the from-scratch MD5), the MBR boot-signature validation,
              the partition-table parser, and the file-system signature detection.
            </li>
            <li>
              <strong>Galen Myburgh &mdash; u21504645</strong>
              <br />
              <em>AI and anomaly-detection engine.</em> The sector-sampled Shannon-entropy
              engine, the adaptive 3&sigma; baseline, the Isolation Forest implementation,
              the IOC and malware-keyword scanners, and the risk-scoring / findings builder.
            </li>
            <li>
              <strong>Hendr&eacute; Beyer &mdash; u26846188</strong>
              <br />
              <em>Application and presentation layer.</em> The React / TypeScript app
              structure, routing, the drag-and-drop analysis pipeline, the results UI
              (entropy bar chart, Isolation Forest chart, severity-coded findings, the
              integrity panel), and the Python demo-image generator plus the project
              documentation.
            </li>
          </ul>
        </div>

        <div className="about-card">
          <h2>What we'd still like to add</h2>
          <ul className="feature-list">
            <li>Cross-sector context windows for the Isolation Forest &mdash; right now each sector is judged in isolation; correlating neighbours would catch partial-encryption attacks more cleanly.</li>
            <li>Higher-order n-gram features (3- and 4-byte) for the same reason.</li>
            <li>A signed, exportable PDF report so the findings have evidentiary weight outside the browser.</li>
            <li>File-aware analysis &mdash; walking the NTFS MFT or ext4 inodes &mdash; to extend triage into proper file-level metadata anomaly detection.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default About;
