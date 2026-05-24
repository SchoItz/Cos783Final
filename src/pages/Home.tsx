import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home: React.FC = () => {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <span className="hero-badge">COS783 — Digital Forensics 2026</span>
          <h1>AI-Assisted <span className="highlight">Disk Forensics</span></h1>
          <p className="hero-sub">
            AI capability <strong>#2 — Metadata Analysis</strong>: unsupervised anomaly detection
            applied to disk-image triage. Chain-of-custody hashing, MBR/partition parsing,
            IOC + malware-keyword extraction, adaptive entropy baselining, and a hand-written
            Isolation Forest score each sector to surface what an investigator should examine first.
          </p>
          <div className="hero-actions">
            <Link to="/forensics" className="btn-primary">Launch Disk Forensics</Link>
            <Link to="/analytics" className="btn-secondary">Bonus: Data Analytics</Link>
            <Link to="/about" className="btn-secondary">About</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
