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
            This application demonstrates the application of <strong>artificial intelligence (AI)</strong> in
            digital forensic investigations. Specifically, it focuses on <strong>Data Analytics (Feature #7)</strong> —
            using machine learning and data mining to identify patterns, connections, and correlations
            in digital evidence that may not be immediately apparent.
          </p>
        </div>

        <div className="about-card">
          <h2>Assignment Context</h2>
          <p>
            Digital forensic investigation can be significantly enhanced through AI techniques.
            This project targets one of eight identified AI-capable applications: large-scale data
            analysis using clustering and classification algorithms to extract meaningful insights
            from forensic datasets.
          </p>
        </div>

        <div className="about-card">
          <h2>Technology Stack</h2>
          <ul className="tech-list">
            <li><span className="tech-tag">React 18</span> Frontend UI library</li>
            <li><span className="tech-tag">TypeScript</span> Type-safe JavaScript</li>
            <li><span className="tech-tag">React Router</span> Client-side navigation</li>
            <li><span className="tech-tag">CSS3</span> Custom styling</li>
          </ul>
        </div>

        <div className="about-card">
          <h2>Planned AI Features</h2>
          <ul className="feature-list">
            <li>K-Means clustering on forensic event logs</li>
            <li>Isolation Forest anomaly detection</li>
            <li>Decision tree classification of evidence categories</li>
            <li>Interactive visualization of cluster results</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default About;
