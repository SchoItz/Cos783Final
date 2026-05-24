import React, { useRef, useState, useCallback } from 'react';
import './DataAnalytics.css';

const ACCEPTED = ['.csv', '.json', '.log', '.txt'];

function validateFile(file: File): string | null {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!ACCEPTED.includes(ext)) return `"${file.name}" is not a supported file type.`;
  if (file.size > 50 * 1024 * 1024) return `"${file.name}" exceeds the 50 MB limit.`;
  return null;
}

const DataAnalytics: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    const err = validateFile(file);
    if (err) { setError(err); setDroppedFile(null); return; }
    setError(null);
    setDroppedFile(file);
  }, []);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };
  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

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

          {/* Hidden real file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json,.log,.txt"
            style={{ display: 'none' }}
            onChange={onFileInput}
          />

          <div
            className={`upload-zone ${dragging ? 'upload-zone--active' : ''} ${droppedFile ? 'upload-zone--loaded' : ''}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="upload-icon">{droppedFile ? '✅' : '⬆️'}</div>
            {droppedFile ? (
              <>
                <p className="upload-filename">{droppedFile.name}</p>
                <span>{(droppedFile.size / 1024).toFixed(1)} KB · click to replace</span>
              </>
            ) : (
              <>
                <p>Drag &amp; drop a dataset file here</p>
                <span>or click to browse</span>
              </>
            )}
            <div className="upload-formats">
              <span className="fmt-tag">.csv</span>
              <span className="fmt-tag">.json</span>
              <span className="fmt-tag">.log</span>
              <span className="fmt-tag">.txt</span>
            </div>
          </div>
          {error && <p className="upload-error">{error}</p>}

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
