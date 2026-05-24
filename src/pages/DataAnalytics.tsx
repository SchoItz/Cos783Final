import React from 'react';
import './DataAnalytics.css';

const DataAnalytics: React.FC = () => {
  return (
    <div className="da-page">
      <div className="da-header">
        <span className="da-badge">Feature #7</span>
        <h1>Data Analytics <span className="da-highlight">Engine</span></h1>
        <p>
          Upload digital evidence datasets and let machine learning identify hidden patterns,
          correlations, and anomalies across large volumes of forensic data.
        </p>
      </div>

      <div className="da-layout">
        {/* Upload Panel */}
        <div className="da-panel">
          <h2 className="panel-title">📂 Evidence Input</h2>
          <div className="upload-zone">
            <div className="upload-icon">⬆️</div>
            <p>Drag & drop dataset files here</p>
            <span>.csv, .json, .log supported</span>
            <button className="btn-upload">Browse Files</button>
          </div>

          <div className="config-section">
            <h3>Analysis Options</h3>
            <div className="config-item">
              <label>Algorithm</label>
              <select>
                <option>K-Means Clustering</option>
                <option>Isolation Forest (Anomaly Detection)</option>
                <option>Decision Tree Classification</option>
                <option>DBSCAN Clustering</option>
              </select>
            </div>
            <div className="config-item">
              <label>Target Column</label>
              <input type="text" placeholder="e.g. event_type" />
            </div>
            <div className="config-item">
              <label>Max Clusters / Depth</label>
              <input type="number" defaultValue={5} min={2} max={20} />
            </div>
            <button className="btn-run" disabled>
              Run Analysis
            </button>
            <p className="coming-soon">AI analysis coming soon</p>
          </div>
        </div>

        {/* Results Panel */}
        <div className="da-panel da-results-panel">
          <h2 className="panel-title">📊 Results</h2>
          <div className="results-placeholder">
            <div className="placeholder-chart">
              <div className="bar" style={{ height: '60%' }}></div>
              <div className="bar" style={{ height: '90%' }}></div>
              <div className="bar" style={{ height: '45%' }}></div>
              <div className="bar" style={{ height: '75%' }}></div>
              <div className="bar" style={{ height: '55%' }}></div>
              <div className="bar" style={{ height: '85%' }}></div>
              <div className="bar" style={{ height: '40%' }}></div>
            </div>
            <p className="placeholder-label">Upload data and run analysis to see results</p>
          </div>

          <div className="stats-row">
            <div className="stat-card">
              <span className="stat-value">—</span>
              <span className="stat-label">Records Processed</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">—</span>
              <span className="stat-label">Clusters Found</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">—</span>
              <span className="stat-label">Anomalies Detected</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">—</span>
              <span className="stat-label">Accuracy Score</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataAnalytics;
