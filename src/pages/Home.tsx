import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const features = [
  { id: 1, title: 'Keyword Searching', desc: 'NLP-powered context-aware search with semantic analysis.', icon: '🔎' },
  { id: 2, title: 'Metadata Analysis', desc: 'Automated pattern recognition and anomaly detection in metadata.', icon: '🗂️' },
  { id: 3, title: 'Network Traffic Analysis', desc: 'ML-based detection of anomalies and indicators of compromise.', icon: '🌐' },
  { id: 4, title: 'Malware Analysis', desc: 'Automated malware classification and IOC generation.', icon: '🦠' },
  { id: 5, title: 'Social Media Analysis', desc: 'NLP and sentiment analysis on social media content.', icon: '📱' },
  { id: 6, title: 'Image & Video Forensics', desc: 'Object/face recognition and tampering detection.', icon: '🎞️' },
  { id: 7, title: 'Data Analytics', desc: 'ML-based pattern mining, clustering, and classification of digital evidence.', icon: '📊', active: true },
  { id: 8, title: 'Speech & Text Analysis', desc: 'Audio transcription and pattern extraction from recorded content.', icon: '🎙️' },
];

const Home: React.FC = () => {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <span className="hero-badge">COS783 Final Assignment</span>
          <h1>Digital Forensics <span className="highlight">AI</span> Platform</h1>
          <p className="hero-sub">
            Demonstrating how artificial intelligence enhances digital forensic investigation
            through automated pattern recognition, machine learning, and data analytics.
          </p>
          <div className="hero-actions">
            <Link to="/analytics" className="btn-primary">Launch Data Analytics</Link>
            <Link to="/about" className="btn-secondary">Learn More</Link>
          </div>
        </div>
      </section>

      <section className="features-section">
        <h2>AI Forensics Capabilities</h2>
        <p className="section-sub">Eight ways AI transforms digital investigations</p>
        <div className="features-grid">
          {features.map((f) => (
            <div key={f.id} className={`feature-card ${f.active ? 'feature-card--active' : ''}`}>
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-num">#{f.id}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              {f.active && (
                <Link to="/analytics" className="feature-link">Explore →</Link>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
