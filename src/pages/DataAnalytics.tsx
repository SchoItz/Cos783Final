import React, { useRef, useState, useCallback, useEffect } from 'react';
import './DataAnalytics.css';

// ── Types ────────────────────────────────────────────────────────────────────
interface ForensicTool {
  id: number;
  tool_name: string;
  commands: string[];
  usage: string;
  description: string;
  link: string;
  system: string[];
}

interface Analytics {
  total: number;
  platformCounts: Record<string, number>;
  categoryCounts: Record<string, number>;
  avgCommands: number;
  guiOnlyCount: number;
}

// ── Constants ────────────────────────────────────────────────────────────────
const ACCEPTED = ['.jsonl', '.json', '.csv', '.log', '.txt'];
const PLATFORMS = ['Windows', 'Linux', 'macOS', 'Android', 'iOS', 'Cloud'];
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Disk Forensics':    ['disk', 'image', 'partition', 'file system', 'carv', 'recover', 'ntfs', 'fat'],
  'Memory Analysis':   ['memory', 'ram', 'volatile', 'dump', 'heap', 'process', 'kernel'],
  'Network Forensics': ['network', 'packet', 'pcap', 'traffic', 'tcp', 'http', 'dns', 'sniff', 'capture'],
  'Mobile Forensics':  ['mobile', 'android', 'ios', 'iphone', 'smartphone', 'tablet', 'sms', 'cellebrite'],
  'Malware Analysis':  ['malware', 'reverse', 'sandbox', 'yara', 'disassem', 'decompil', 'virus', 'exploit'],
  'Cloud Forensics':   ['cloud', 'aws', 'azure', 'gcp', 'saas', 'cloudtrail', 'sentinel'],
  'Blockchain':        ['blockchain', 'crypto', 'bitcoin', 'ethereum', 'transaction', 'chainalysis'],
  'OSINT / Intel':     ['osint', 'intelligence', 'maltego', 'link analysis', 'open source'],
  'Timeline Analysis': ['timeline', 'log2timeline', 'plaso', 'timesketch', 'event log'],
};

// ── Helper functions ──────────────────────────────────────────────────────────
function detectCategory(tool: ForensicTool): string {
  const haystack = (tool.tool_name + ' ' + tool.usage + ' ' + tool.description).toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(k => haystack.includes(k))) return cat;
  }
  return 'General Forensics';
}

function parseJSONL(text: string): ForensicTool[] {
  return text
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(l => { try { return JSON.parse(l); } catch { return null; } })
    .filter(Boolean) as ForensicTool[];
}

function computeAnalytics(tools: ForensicTool[]): Analytics {
  const platformCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  let totalCommands = 0;
  let guiOnly = 0;
  for (const t of tools) {
    for (const s of (t.system || [])) {
      platformCounts[s] = (platformCounts[s] || 0) + 1;
    }
    const cat = detectCategory(t);
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    const cmds = t.commands || [];
    const isGui = cmds.length === 1 && cmds[0].toLowerCase().includes('gui');
    if (isGui) guiOnly++;
    else totalCommands += cmds.length;
  }
  return {
    total: tools.length,
    platformCounts,
    categoryCounts,
    avgCommands: tools.length ? +(totalCommands / (tools.length - guiOnly || 1)).toFixed(1) : 0,
    guiOnlyCount: guiOnly,
  };
}

function validateFile(file: File): string | null {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!ACCEPTED.includes(ext)) return `"${file.name}" is not supported. Use .jsonl, .json, .csv, .log or .txt`;
  if (file.size > 50 * 1024 * 1024) return `"${file.name}" exceeds the 50 MB limit.`;
  return null;
}

// ── Bar chart ─────────────────────────────────────────────────────────────────
const BarChart: React.FC<{ data: Record<string, number>; color?: string }> = ({ data, color = '#00e5ff' }) => {
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = sorted[0]?.[1] || 1;
  return (
    <div className="bar-chart">
      {sorted.map(([label, value]) => (
        <div key={label} className="bc-row">
          <span className="bc-label">{label}</span>
          <div className="bc-track">
            <div className="bc-fill" style={{ width: `${(value / max) * 100}%`, backgroundColor: color }} />
          </div>
          <span className="bc-value">{value}</span>
        </div>
      ))}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const DataAnalytics: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [tools, setTools] = useState<ForensicTool[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [usingDefault, setUsingDefault] = useState(false);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [activeTab, setActiveTab] = useState<'platforms' | 'categories'>('platforms');

  // Load bundled dataset on mount
  useEffect(() => {
    fetch('/data/forensic_toolkit.jsonl')
      .then(r => r.text())
      .then(text => {
        const parsed = parseJSONL(text);
        setTools(parsed);
        setAnalytics(computeAnalytics(parsed));
        setUsingDefault(true);
      })
      .catch(() => {});
  }, []);

  const processText = useCallback((text: string, file: File) => {
    let parsed: ForensicTool[] = [];
    if (file.name.endsWith('.jsonl') || file.name.endsWith('.json')) {
      parsed = parseJSONL(text);
      if (parsed.length === 0) {
        try { const arr = JSON.parse(text); if (Array.isArray(arr)) parsed = arr; } catch {}
      }
    } else {
      parsed = text.split('\n').filter(l => l.trim()).map((l, i) => ({
        id: i + 1, tool_name: l.trim(), commands: [], usage: '', description: l.trim(), link: '', system: [],
      }));
    }
    setTools(parsed);
    setAnalytics(computeAnalytics(parsed));
    setUsingDefault(false);
    setSearch('');
    setPlatformFilter('All');
  }, []);

  const handleFile = useCallback((file: File) => {
    const err = validateFile(file);
    if (err) { setFileError(err); return; }
    setFileError(null);
    setDroppedFile(file);
    const reader = new FileReader();
    reader.onload = e => processText(e.target?.result as string, file);
    reader.readAsText(file);
  }, [processText]);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };
  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const filteredTools = tools.filter(t => {
    const matchSearch = search === '' ||
      t.tool_name.toLowerCase().includes(search.toLowerCase()) ||
      (t.usage || '').toLowerCase().includes(search.toLowerCase());
    const matchPlatform = platformFilter === 'All' || (t.system || []).includes(platformFilter);
    return matchSearch && matchPlatform;
  });

  return (
    <div className="da-page">
      <div className="da-header">
        <span className="da-badge">Feature #7 · Data Analytics</span>
        <h1>Forensic Toolkit <span className="da-highlight">Analyser</span></h1>
        <p>
          AI-assisted pattern recognition across the{' '}
          <a href="https://www.kaggle.com/datasets/cyberprince/forensic-toolkit-dataset"
            target="_blank" rel="noreferrer" className="da-link">
            Forensic Toolkit Dataset
          </a>{' '}
          — 300 DFIR tools classified by platform, category, and usage patterns.
        </p>
      </div>

      <div className="da-main">
        {/* Sidebar */}
        <div className="da-sidebar">
          <div className="da-panel">
            <h2 className="panel-title">📂 Dataset</h2>
            <input ref={fileInputRef} type="file" accept=".jsonl,.json,.csv,.log,.txt"
              style={{ display: 'none' }} onChange={onFileInput} />
            <div
              className={`upload-zone ${dragging ? 'upload-zone--active' : ''} ${droppedFile ? 'upload-zone--loaded' : ''}`}
              onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="upload-icon">{droppedFile ? '✅' : '⬆️'}</div>
              {droppedFile ? (
                <><p className="upload-filename">{droppedFile.name}</p>
                  <span>{(droppedFile.size / 1024).toFixed(1)} KB · click to replace</span></>
              ) : (
                <><p>Drop your own dataset</p><span>or click to browse</span></>
              )}
              <div className="upload-formats">
                <span className="fmt-tag">.jsonl</span>
                <span className="fmt-tag">.json</span>
                <span className="fmt-tag">.csv</span>
                <span className="fmt-tag">.log</span>
              </div>
            </div>
            {fileError && <p className="upload-error">{fileError}</p>}
            {usingDefault && (
              <p className="default-note">
                📦 Bundled dataset (50 tools). Drop the full Kaggle <code>.jsonl</code> above to load all 300.
              </p>
            )}
          </div>

          {analytics && (
            <div className="da-panel">
              <h2 className="panel-title">🔎 Filter</h2>
              <div className="config-item">
                <label>Search</label>
                <input type="text" placeholder="tool name or usage..."
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="config-item">
                <label>Platform</label>
                <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value)}>
                  <option>All</option>
                  {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <p className="filter-count">{filteredTools.length} of {tools.length} tools</p>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="da-content">
          {analytics ? (
            <>
              <div className="stats-row">
                {[
                  { v: analytics.total, l: 'Tools Loaded' },
                  { v: Object.keys(analytics.platformCounts).length, l: 'Platforms Covered' },
                  { v: Object.keys(analytics.categoryCounts).length, l: 'Categories Detected' },
                  { v: analytics.avgCommands, l: 'Avg Commands / Tool' },
                  { v: analytics.guiOnlyCount, l: 'GUI-only Tools' },
                  { v: analytics.total - analytics.guiOnlyCount, l: 'CLI Tools' },
                ].map(({ v, l }) => (
                  <div key={l} className="stat-card">
                    <span className="stat-value">{v}</span>
                    <span className="stat-label">{l}</span>
                  </div>
                ))}
              </div>

              <div className="da-panel">
                <div className="chart-tabs">
                  <button className={`tab-btn ${activeTab === 'platforms' ? 'tab-btn--active' : ''}`}
                    onClick={() => setActiveTab('platforms')}>Platform Distribution</button>
                  <button className={`tab-btn ${activeTab === 'categories' ? 'tab-btn--active' : ''}`}
                    onClick={() => setActiveTab('categories')}>Category Breakdown</button>
                </div>
                {activeTab === 'platforms'
                  ? <BarChart data={analytics.platformCounts} color="#00e5ff" />
                  : <BarChart data={analytics.categoryCounts} color="#7ee787" />
                }
              </div>

              <div className="da-panel">
                <h2 className="panel-title">🛠️ Tool Directory</h2>
                <div className="tool-table-wrap">
                  <table className="tool-table">
                    <thead>
                      <tr>
                        <th>#</th><th>Tool</th><th>Category</th><th>Platforms</th><th>Usage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTools.slice(0, 100).map(t => (
                        <tr key={t.id}>
                          <td className="td-id">{t.id}</td>
                          <td className="td-name">
                            {t.link
                              ? <a href={t.link} target="_blank" rel="noreferrer" className="tool-link">{t.tool_name}</a>
                              : t.tool_name}
                          </td>
                          <td className="td-cat"><span className="cat-tag">{detectCategory(t)}</span></td>
                          <td className="td-sys">
                            {(t.system || []).map(s => (
                              <span key={s} className={`sys-tag sys-tag--${s.toLowerCase().replace(/\s/g, '')}`}>{s}</span>
                            ))}
                          </td>
                          <td className="td-usage">{t.usage}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredTools.length > 100 && <p className="table-overflow">Showing first 100 of {filteredTools.length} results.</p>}
                  {filteredTools.length === 0 && <p className="table-empty">No tools match your filters.</p>}
                </div>
              </div>
            </>
          ) : (
            <div className="da-panel da-empty"><p>Loading dataset…</p></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataAnalytics;

