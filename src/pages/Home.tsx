import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home: React.FC = () => {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <span className="hero-badge">COS783 &mdash; Digital Forensics, 2026</span>
          <h1>Disk forensics <span className="highlight">in the browser</span></h1>
          <p className="hero-sub">
            Our final-assignment project for AI capability #2 (Metadata Analysis).
            Drop a disk image in and the tool hashes it for chain of custody, parses the
            MBR and partition table, pulls IOCs and malware-keyword hits out of the raw
            strings, and runs two unsupervised anomaly-detection models &mdash; an
            adaptive entropy baseline and our own Isolation Forest &mdash; to flag the
            sectors an investigator should look at first.
          </p>
          <div className="hero-actions">
            <Link to="/forensics" className="btn-primary">Open the analyser</Link>
            <Link to="/analytics" className="btn-secondary">Bonus &mdash; Data Analytics</Link>
            <Link to="/about" className="btn-secondary">About the project</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
