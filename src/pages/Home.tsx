import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

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
    </div>
  );
};

export default Home;
