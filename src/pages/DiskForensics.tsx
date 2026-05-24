import React, { useRef, useState, useCallback } from 'react';
import './DiskForensics.css';

// ── Types ─────────────────────────────────────────────────────────────────────
interface HashSet   { md5: string; sha1: string; sha256: string; timestamp: string; }
type Severity       = 'critical' | 'high' | 'medium' | 'info';

interface PartitionEntry {
  num: number; active: boolean; type: number; typeName: string;
  startSector: number; sizeSectors: number; sizeMB: number;
}
interface MBRInfo {
  valid: boolean; diskSignature: string;
  partitions: PartitionEntry[]; fsSignature: string | null;
}
interface IOCEntry  { type: string; value: string; count: number; severity: Severity; }
interface EntropyPt { sectorIdx: number; offsetMB: number; entropy: number; }
interface Finding   {
  id: number; severity: Severity;
  title: string; description: string; evidence: string[];
}
interface AnalysisState {
  phase: 'idle'|'loading'|'pre-hash'|'analyzing'|'post-hash'|'done'|'error';
  progress: number; stepMsg: string;
  preHashes: HashSet | null; postHashes: HashSet | null;
  mbrInfo: MBRInfo | null;
  findings: Finding[]; iocs: IOCEntry[]; entropy: EntropyPt[];
  riskScore: number; error: string | null;
}

// ── Partition type table ───────────────────────────────────────────────────────
const PARTITION_TYPES: Record<number, string> = {
  0x00:'Empty', 0x01:'FAT12', 0x04:'FAT16 <32MB', 0x05:'Extended (CHS)',
  0x06:'FAT16', 0x07:'NTFS / exFAT', 0x0B:'FAT32', 0x0C:'FAT32 LBA',
  0x0E:'FAT16 LBA', 0x0F:'Extended LBA', 0x11:'Hidden FAT12', 0x14:'Hidden FAT16',
  0x16:'Hidden FAT16', 0x17:'Hidden NTFS', 0x1B:'Hidden FAT32',
  0x1C:'Hidden FAT32 LBA', 0x82:'Linux Swap', 0x83:'Linux ext2/3/4',
  0x84:'Hibernation', 0x85:'Linux Extended', 0x8E:'Linux LVM',
  0xA5:'FreeBSD', 0xA8:'macOS Darwin', 0xAB:'macOS Boot', 0xAF:'macOS HFS+',
  0xEB:'BeOS', 0xEE:'GPT Protective', 0xEF:'EFI System', 0xFD:'Linux RAID',
};

const FS_SIGNATURES = [
  { name:'NTFS',     offset:3,    magic:[0x4E,0x54,0x46,0x53,0x20,0x20,0x20,0x20] },
  { name:'FAT32',    offset:82,   magic:[0x46,0x41,0x54,0x33,0x32,0x20,0x20,0x20] },
  { name:'FAT16',    offset:54,   magic:[0x46,0x41,0x54,0x31,0x36,0x20,0x20,0x20] },
  { name:'exFAT',    offset:3,    magic:[0x65,0x78,0x46,0x41,0x54,0x20,0x20,0x20] },
  { name:'ext2/3/4', offset:1080, magic:[0x53,0xEF] },
  { name:'HFS+',     offset:1024, magic:[0x48,0x2B] },
];

const MALWARE_KEYWORDS = [
  'mimikatz','meterpreter','metasploit','cobalt strike','cobaltstrike',
  'psexec','netcat','nc.exe','ncat','lsass.dmp',
  'pass-the-hash','pass the hash','ntds.dit','sam hive',
  'vssadmin delete','bcdedit /set','wbadmin delete',
  'regsvr32 /s','certutil -decode','bitsadmin /transfer',
  'mshta http','powershell -enc','powershell -e ','powershell -w hidden',
  'invoke-mimikatz','invoke-shellcode','downloadstring',
  'iex(','iex (','system.net.webclient',
  'createremotethread','virtualallocex','writeprocessmemory',
  'cmd /c ','cmd.exe /c ','/etc/shadow','/etc/passwd',
  'base64 -d','base64 --decode','chmod +x','wget http','curl http',
  'rm -rf /','dd if=/dev/zero',
  'cryptolocker','wannacry','petya','ryuk','lockbit','conti',
];

const IOC_PATTERNS: { type: string; re: RegExp; severity: Severity }[] = [
  { type:'IPv4',         re:/\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g, severity:'medium' },
  { type:'URL',          re:/https?:\/\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]{4,}/g, severity:'high' },
  { type:'Email',        re:/\b[a-zA-Z0-9._%+-]{2,}@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g, severity:'medium' },
  { type:'Registry Key', re:/HKEY_(?:LOCAL_MACHINE|CURRENT_USER|CLASSES_ROOT|USERS|CURRENT_CONFIG)\\[^\s"'<>]{3,}/g, severity:'medium' },
  { type:'Windows Path', re:/[A-Za-z]:\\(?:[^\\\/:*?"<>|\r\n]+\\)*[^\\\/:*?"<>|\r\n]{2,}/g, severity:'info' },
  { type:'UNC Path',     re:/\\\\[a-zA-Z0-9._-]{2,}\\[a-zA-Z0-9._$-]{2,}/g, severity:'medium' },
  { type:'Linux Path',   re:/\/(?:etc|var|tmp|usr|home|root|bin|sbin|proc)\/[^\s"'<>]{3,}/g, severity:'medium' },
  { type:'MD5 Hash',     re:/\b[0-9a-fA-F]{32}\b/g, severity:'info' },
  { type:'SHA256 Hash',  re:/\b[0-9a-fA-F]{64}\b/g, severity:'info' },
];

const FORENSIC_COMMANDS = `# ═══ PHASE 1 — Chain of Custody: Pre-Analysis Hashing ═══════════════════
# Record current timestamp
date -u -Iseconds | tee -a evidence_log.txt

# Compute cryptographic hashes (chain of custody)
md5sum    evidence.dd | tee evidence.md5
sha1sum   evidence.dd | tee evidence.sha1
sha256sum evidence.dd | tee evidence.sha256

# ═══ PHASE 2 — Disk Structure Analysis (The Sleuth Kit) ════════════════
# List partitions (equivalent to parsing MBR in-browser)
mmls evidence.dd

# Partition table details
fdisk -lu evidence.dd

# File system statistics (one per partition offset)
fsstat -o <partition_offset> evidence.dd

# ═══ PHASE 3 — File Listing & Deleted File Recovery ════════════════════
# Recursive file listing with metadata
fls -r -l -o <offset> evidence.dd

# Recover deleted files
tsk_recover -e -o <offset> evidence.dd ./recovered/

# Extract a specific file by inode
icat -o <offset> evidence.dd <inode_number> > recovered_file

# ═══ PHASE 4 — String Extraction & IOC Hunting ═════════════════════════
# Extract printable strings (min length 5)
strings -a -n 5 evidence.dd > strings.txt

# Hunt for IOCs
grep -Eo 'https?://[^ "]+' strings.txt       > iocs_urls.txt
grep -Eo '([0-9]{1,3}\.){3}[0-9]{1,3}' strings.txt > iocs_ips.txt
grep -Ei 'HKEY_[A-Z_]+\\\\[^ "]+' strings.txt  > iocs_registry.txt

# Scan for malware keyword indicators
grep -iEf malware_keywords.txt strings.txt   > keyword_hits.txt

# ═══ PHASE 5 — AI: Shannon Entropy Anomaly Detection ═══════════════════
python3 << 'EOF'
import math, sys

SECTOR_SIZE = 512
THRESHOLD_HIGH     = 7.2   # possible encryption / packing
THRESHOLD_CRITICAL = 7.6   # strong indicator of encrypted/ransomware data

def shannon_entropy(data):
    if not data: return 0.0
    freq = [0] * 256
    for b in data: freq[b] += 1
    n = len(data)
    return -sum((f/n) * math.log2(f/n) for f in freq if f > 0)

anomalies = []
with open('evidence.dd', 'rb') as f:
    sector = 0
    while True:
        chunk = f.read(SECTOR_SIZE)
        if not chunk: break
        e = shannon_entropy(chunk)
        if e > THRESHOLD_HIGH:
            level = 'CRITICAL' if e > THRESHOLD_CRITICAL else 'HIGH'
            anomalies.append((sector, e, level))
            print(f"[{level}] Sector {sector} @ {sector*SECTOR_SIZE/1048576:.2f}MB  entropy={e:.4f}")
        sector += 1

print(f"\\nTotal anomalous sectors: {len(anomalies)}")
EOF

# ═══ PHASE 6 — Post-Analysis Integrity Verification ════════════════════
# Re-compute hashes — they MUST match pre-analysis values
md5sum    evidence.dd | diff - evidence.md5    && echo "MD5:    MATCH ✓" || echo "MD5:    MISMATCH ✗"
sha1sum   evidence.dd | diff - evidence.sha1   && echo "SHA-1:  MATCH ✓" || echo "SHA-1:  MISMATCH ✗"
sha256sum evidence.dd | diff - evidence.sha256 && echo "SHA-256:MATCH ✓" || echo "SHA-256:MISMATCH ✗"`;

// ── MD5 (RFC 1321) ─────────────────────────────────────────────────────────────
function computeMD5(data: Uint8Array): string {
  const S = [
    7,12,17,22, 7,12,17,22, 7,12,17,22, 7,12,17,22,
    5, 9,14,20, 5, 9,14,20, 5, 9,14,20, 5, 9,14,20,
    4,11,16,23, 4,11,16,23, 4,11,16,23, 4,11,16,23,
    6,10,15,21, 6,10,15,21, 6,10,15,21, 6,10,15,21,
  ];
  const K = [
    0xd76aa478,0xe8c7b756,0x242070db,0xc1bdceee,0xf57c0faf,0x4787c62a,0xa8304613,0xfd469501,
    0x698098d8,0x8b44f7af,0xffff5bb1,0x895cd7be,0x6b901122,0xfd987193,0xa679438e,0x49b40821,
    0xf61e2562,0xc040b340,0x265e5a51,0xe9b6c7aa,0xd62f105d,0x02441453,0xd8a1e681,0xe7d3fbc8,
    0x21e1cde6,0xc33707d6,0xf4d50d87,0x455a14ed,0xa9e3e905,0xfcefa3f8,0x676f02d9,0x8d2a4c8a,
    0xfffa3942,0x8771f681,0x6d9d6122,0xfde5380c,0xa4beea44,0x4bdecfa9,0xf6bb4b60,0xbebfbc70,
    0x289b7ec6,0xeaa127fa,0xd4ef3085,0x04881d05,0xd9d4d039,0xe6db99e5,0x1fa27cf8,0xc4ac5665,
    0xf4292244,0x432aff97,0xab9423a7,0xfc93a039,0x655b59c3,0x8f0ccc92,0xffeff47d,0x85845dd1,
    0x6fa87e4f,0xfe2ce6e0,0xa3014314,0x4e0811a1,0xf7537e82,0xbd3af235,0x2ad7d2bb,0xeb86d391,
  ];
  const add = (a: number, b: number) => (a + b) | 0;
  const rol = (n: number, c: number) => (n << c) | (n >>> (32 - c));

  const len = data.length;
  const padLen = ((len % 64) < 56 ? 56 : 120) - (len % 64);
  const buf = new Uint8Array(len + padLen + 8);
  buf.set(data);
  buf[len] = 0x80;
  const view = new DataView(buf.buffer);
  // 64-bit little-endian bit count
  const bitLow  = ((len % 0x20000000) * 8) >>> 0;
  const bitHigh = Math.floor(len / 0x20000000);
  view.setUint32(len + padLen,     bitLow,  true);
  view.setUint32(len + padLen + 4, bitHigh, true);

  let a0 = 0x67452301 | 0, b0 = 0xefcdab89 | 0,
      c0 = 0x98badcfe | 0, d0 = 0x10325476 | 0;

  for (let i = 0; i < buf.length; i += 64) {
    const M: number[] = Array.from({length:16}, (_,j) => view.getInt32(i + j*4, true));
    let a = a0, b = b0, c = c0, d = d0;
    for (let j = 0; j < 64; j++) {
      let f: number, g: number;
      if      (j < 16) { f = (b & c) | (~b & d);  g = j; }
      else if (j < 32) { f = (d & b) | (~d & c);  g = (5*j + 1) % 16; }
      else if (j < 48) { f = b ^ c ^ d;            g = (3*j + 5) % 16; }
      else             { f = c ^ (b | ~d);          g = (7*j) % 16; }
      const tmp = d; d = c; c = b;
      b = add(b, rol(add(add(a, f), add(K[j], M[g])), S[j]));
      a = tmp;
    }
    a0 = add(a0,a); b0 = add(b0,b); c0 = add(c0,c); d0 = add(d0,d);
  }
  const out = new DataView(new ArrayBuffer(16));
  out.setInt32(0,a0,true); out.setInt32(4,b0,true);
  out.setInt32(8,c0,true); out.setInt32(12,d0,true);
  return Array.from(new Uint8Array(out.buffer), b => b.toString(16).padStart(2,'0')).join('');
}

// ── Forensic helpers ──────────────────────────────────────────────────────────
async function webHash(buffer: ArrayBuffer, algo: string): Promise<string> {
  const d = await crypto.subtle.digest(algo, buffer);
  return Array.from(new Uint8Array(d), b => b.toString(16).padStart(2,'0')).join('');
}

function shannonEntropy(data: Uint8Array): number {
  const freq = new Float64Array(256);
  for (let i = 0; i < data.length; i++) freq[data[i]]++;
  let e = 0;
  for (let i = 0; i < freq.length; i++) {
    const f = freq[i];
    if (f === 0) continue;
    const p = f / data.length;
    e -= p * Math.log2(p);
  }
  return e;
}

function extractStrings(bytes: Uint8Array, minLen = 5, maxResults = 60000): string[] {
  const out: string[] = [];
  let cur = '';
  for (let i = 0; i < bytes.length && out.length < maxResults; i++) {
    const b = bytes[i];
    if (b >= 0x20 && b < 0x7F) { cur += String.fromCharCode(b); }
    else { if (cur.length >= minLen) out.push(cur); cur = ''; }
  }
  if (cur.length >= minLen) out.push(cur);
  return out;
}

function parseMBR(bytes: Uint8Array): MBRInfo {
  const valid = bytes.length >= 512 && bytes[510] === 0x55 && bytes[511] === 0xAA;
  const dv    = new DataView(bytes.buffer, 0, Math.min(512, bytes.byteLength));
  const diskSignature = valid
    ? Array.from(bytes.slice(440,444), b => b.toString(16).padStart(2,'0')).join('')
    : '00000000';

  const partitions: PartitionEntry[] = [];
  if (valid) {
    for (let i = 0; i < 4; i++) {
      const base = 446 + i * 16;
      const type = bytes[base + 4];
      if (type === 0) continue;
      const start = dv.getUint32(base + 8,  true);
      const size  = dv.getUint32(base + 12, true);
      partitions.push({
        num: i+1, active: bytes[base] === 0x80, type,
        typeName: PARTITION_TYPES[type] ?? `Unknown (0x${type.toString(16).toUpperCase().padStart(2,'0')})`,
        startSector: start, sizeSectors: size,
        sizeMB: Math.round((size * 512) / (1024 * 1024)),
      });
    }
  }
  let fsSignature: string | null = null;
  for (const sig of FS_SIGNATURES) {
    if (bytes.length > sig.offset + sig.magic.length &&
        sig.magic.every((b, j) => bytes[sig.offset + j] === b)) {
      fsSignature = sig.name; break;
    }
  }
  return { valid, diskSignature, partitions, fsSignature };
}

function extractIOCs(strings: string[]): IOCEntry[] {
  const text   = strings.join('\n');
  const counts: Record<string, { type: string; count: number; severity: Severity }> = {};
  for (const { type, re, severity } of IOC_PATTERNS) {
    const matches = text.match(re) ?? [];
    for (const m of matches) {
      const key = `${type}::${m}`;
      if (counts[key]) counts[key].count++;
      else counts[key] = { type, count: 1, severity };
    }
  }
  return Object.entries(counts)
    .map(([k, v]) => ({ value: k.slice(k.indexOf('::')+2), ...v }))
    .sort((a,b) => {
      const o: Record<Severity,number> = {critical:0,high:1,medium:2,info:3};
      return o[a.severity] - o[b.severity] || b.count - a.count;
    });
}

function buildFindings(
  mbr: MBRInfo, iocs: IOCEntry[], entropy: EntropyPt[],
  kwHits: {kw:string;count:number}[],
): { findings: Finding[]; riskScore: number } {
  const findings: Finding[] = [];
  let risk = 0;
  let id = 1;

  // MBR
  if (!mbr.valid) {
    findings.push({ id:id++, severity:'high',
      title:'Invalid MBR Boot Signature',
      description:'No valid 0x55AA signature at bytes 510-511. The image may be corrupt, wiped, or a non-standard format.',
      evidence:['Offset 510-511: expected 0x55 0xAA — not found'],
    });
    risk += 30;
  } else {
    findings.push({ id:id++, severity:'info',
      title:'Valid MBR Detected',
      description:`MBR signature 0x55AA confirmed. Disk signature 0x${mbr.diskSignature}. ${mbr.partitions.length} partition(s) defined.`,
      evidence:[
        `Boot signature @ offsets 510-511: 0x55 0xAA ✓`,
        `Disk signature @ offsets 440-443: 0x${mbr.diskSignature}`,
      ],
    });
  }
  if (mbr.fsSignature) {
    findings.push({ id:id++, severity:'info',
      title:`File System Identified: ${mbr.fsSignature}`,
      description:`${mbr.fsSignature} signature bytes detected in the Volume Boot Record.`,
      evidence:[`OEM-ID / magic bytes match ${mbr.fsSignature}`],
    });
  }

  // Entropy (AI anomaly detection)
  const critEntr = entropy.filter(p => p.entropy > 7.6);
  const highEntr = entropy.filter(p => p.entropy >= 7.2 && p.entropy <= 7.6);
  if (critEntr.length > 0) {
    findings.push({ id:id++, severity:'critical',
      title:`Encrypted / Ransomware Data Regions Detected (${critEntr.length} sectors)`,
      description:`${critEntr.length} sector(s) have Shannon entropy > 7.6 bits/byte — the signature of fully encrypted or ransomware-processed data. Normal plaintext ≈ 4–6 bits/byte; maximum theoretical entropy = 8.0.`,
      evidence: critEntr.slice(0,6).map(p => `Sector ${p.sectorIdx.toLocaleString()} @ ${p.offsetMB.toFixed(2)} MB  →  ${p.entropy.toFixed(4)} bits/byte`),
    });
    risk += Math.min(critEntr.length * 5, 45);
  } else if (highEntr.length > 0) {
    findings.push({ id:id++, severity:'high',
      title:`High-Entropy Regions — Possible Packing / Obfuscation (${highEntr.length} sectors)`,
      description:`${highEntr.length} sector(s) have entropy ≥ 7.2, consistent with compressed data, packed executables, or encrypted payloads.`,
      evidence: highEntr.slice(0,4).map(p => `Sector ${p.sectorIdx.toLocaleString()} @ ${p.offsetMB.toFixed(2)} MB  →  ${p.entropy.toFixed(4)} bits/byte`),
    });
    risk += Math.min(highEntr.length * 3, 20);
  } else {
    findings.push({ id:id++, severity:'info',
      title:'Entropy Profile: Normal',
      description:'No anomalously high-entropy sectors detected. Entropy values are consistent with standard file system and user data.',
      evidence:[`Max sector entropy: ${entropy.length ? Math.max(...entropy.map(p=>p.entropy)).toFixed(4) : 'N/A'} bits/byte`],
    });
  }

  // Malware keywords
  const knownMalware = ['mimikatz','meterpreter','cryptolocker','wannacry','petya','ryuk','lockbit','conti','cobaltstrike','cobalt strike'];
  const critKW = kwHits.filter(k => knownMalware.includes(k.kw));
  const highKW = kwHits.filter(k => !knownMalware.includes(k.kw));
  if (critKW.length > 0) {
    findings.push({ id:id++, severity:'critical',
      title:`Known Malware Tool Strings Detected (${critKW.length})`,
      description:'Strings matching known malware tool names or ransomware families were extracted from the disk image. This is a strong indicator of compromise.',
      evidence: critKW.map(k => `"${k.kw}"  ×${k.count}`),
    });
    risk += Math.min(critKW.length * 25, 50);
  }
  if (highKW.length > 0) {
    findings.push({ id:id++, severity:'high',
      title:`Suspicious Command Patterns Detected (${highKW.length})`,
      description:'Strings associated with post-exploitation, lateral movement, or anti-forensic activity were found.',
      evidence: highKW.slice(0,6).map(k => `"${k.kw}"  ×${k.count}`),
    });
    risk += Math.min(highKW.length * 10, 25);
  }

  // IOC-based findings
  const urls = iocs.filter(i => i.type === 'URL');
  const ips  = iocs.filter(i => i.type === 'IPv4');
  const pubIPs = ips.filter(i =>
    !i.value.startsWith('192.168.') && !i.value.startsWith('10.') &&
    !i.value.startsWith('172.') && !i.value.startsWith('127.') && i.value !== '0.0.0.0'
  );

  if (urls.length > 0) {
    findings.push({ id:id++, severity:'high',
      title:`${urls.length} URL(s) Extracted`,
      description:'URLs found in disk strings may indicate C2 communication endpoints, malware download locations, or phishing artefacts.',
      evidence: urls.slice(0,5).map(u => u.value),
    });
    risk += Math.min(urls.length * 5, 20);
  }
  if (pubIPs.length > 0) {
    findings.push({ id:id++, severity:'medium',
      title:`${pubIPs.length} Routable (Non-RFC1918) IP Address(es) Found`,
      description:'Public IP addresses may represent attacker infrastructure, C2 servers, or exfiltration targets.',
      evidence: pubIPs.slice(0,5).map(i => `${i.value}  (×${i.count})`),
    });
    risk += Math.min(pubIPs.length * 4, 15);
  }

  return { findings, riskScore: Math.min(risk, 100) };
}

// ── Sub-component: Hash table ─────────────────────────────────────────────────
const HashTable: React.FC<{ hashes: HashSet; pre?: HashSet }> = ({ hashes, pre }) => (
  <table className="df-hash-table">
    <thead>
      <tr><th>Algorithm</th><th>Hash Value</th>{pre && <th>Integrity</th>}</tr>
    </thead>
    <tbody>
      {(['MD5','SHA-1','SHA-256'] as const).map(algo => {
        const val  = algo === 'MD5' ? hashes.md5  : algo === 'SHA-1' ? hashes.sha1  : hashes.sha256;
        const prev = algo === 'MD5' ? pre?.md5     : algo === 'SHA-1' ? pre?.sha1    : pre?.sha256;
        return (
          <tr key={algo}>
            <td><span className="df-algo">{algo}</span></td>
            <td><code className="df-hash-val">{val}</code></td>
            {pre && (
              <td>
                {prev === val
                  ? <span className="df-match df-match--ok">✓ MATCH</span>
                  : <span className="df-match df-match--fail">✗ MISMATCH</span>}
              </td>
            )}
          </tr>
        );
      })}
    </tbody>
  </table>
);

// ── Main page component ───────────────────────────────────────────────────────
const DiskForensics: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file,     setFile]     = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'findings'|'iocs'|'entropy'|'commands'>('findings');
  const [state, setState] = useState<AnalysisState>({
    phase:'idle', progress:0, stepMsg:'',
    preHashes:null, postHashes:null, mbrInfo:null,
    findings:[], iocs:[], entropy:[], riskScore:0, error:null,
  });

  const patch = useCallback((p: Partial<AnalysisState>) =>
    setState(s => ({ ...s, ...p })), []);

  // ── File handling ─────────────────────────────────────────────────────────
  const handleFile = (f: File) => {
    const ext = (f.name.split('.').pop() ?? '').toLowerCase();
    if (!['dd','img','bin','raw','iso','vmdk'].includes(ext)) {
      patch({ phase:'error', error:`"${f.name}" is not a supported format. Use .dd, .img, .bin, .raw, .iso, or .vmdk` });
      return;
    }
    if (f.size > 2 * 1024 * 1024 * 1024) {
      patch({ phase:'error', error:'File exceeds the 2 GB limit.' });
      return;
    }
    setFile(f);
    patch({ phase:'idle', error:null, preHashes:null, postHashes:null,
            findings:[], iocs:[], entropy:[], riskScore:0 });
  };

  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onDrop      = (e: React.DragEvent) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); };
  const onInput     = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) handleFile(f); };

  // ── Analysis pipeline ─────────────────────────────────────────────────────
  const runAnalysis = useCallback(async () => {
    if (!file) return;
    patch({ phase:'loading', progress:2, stepMsg:'Reading disk image into memory…' });

    try {
      const buffer = await file.arrayBuffer();
      const bytes  = new Uint8Array(buffer);

      // Phase 1 — Pre-analysis hashes
      patch({ phase:'pre-hash', progress:5, stepMsg:'Computing MD5 hash (chain of custody)…' });
      await tick();
      const md5Pre = computeMD5(bytes);

      patch({ progress:22, stepMsg:'Computing SHA-1 hash…' });
      await tick();
      const sha1Pre = await webHash(buffer, 'SHA-1');

      patch({ progress:38, stepMsg:'Computing SHA-256 hash…' });
      await tick();
      const sha256Pre = await webHash(buffer, 'SHA-256');

      const preHashes: HashSet = { md5:md5Pre, sha1:sha1Pre, sha256:sha256Pre, timestamp:new Date().toUTCString() };
      patch({ preHashes, progress:48, stepMsg:'Pre-analysis hashes recorded. Starting forensic analysis…' });
      await tick(60);

      // Phase 2 — Structural analysis
      patch({ phase:'analyzing', progress:52, stepMsg:'Parsing Master Boot Record (MBR)…' });
      await tick();
      const mbrInfo = parseMBR(bytes);

      patch({ progress:57, stepMsg:'Extracting printable strings (first 10 MB)…' });
      await tick();
      const sample  = bytes.slice(0, Math.min(bytes.length, 10 * 1024 * 1024));
      const strings = extractStrings(sample);

      patch({ progress:63, stepMsg:'Extracting Indicators of Compromise (IOCs)…' });
      await tick();
      const iocs = extractIOCs(strings);

      patch({ progress:70, stepMsg:'AI: Shannon entropy anomaly detection (sampling sectors)…' });
      await tick();
      const SECTOR      = 512;
      const totalSectors = Math.floor(bytes.length / SECTOR);
      const step        = Math.max(1, Math.floor(totalSectors / 500)); // ≤500 sample points
      const entropy: EntropyPt[] = [];
      for (let s = 0; s * SECTOR < bytes.length; s += step) {
        const start = s * SECTOR;
        const end   = Math.min(start + SECTOR, bytes.length);
        entropy.push({ sectorIdx:s, offsetMB:(s*SECTOR)/1048576, entropy:shannonEntropy(bytes.slice(start,end)) });
      }

      patch({ progress:82, stepMsg:'AI: Scanning for malware keyword indicators…' });
      await tick();
      const lower   = strings.map(s => s.toLowerCase());
      const kwHits  = MALWARE_KEYWORDS
        .map(kw => ({ kw, count:lower.filter(s => s.includes(kw)).length }))
        .filter(k => k.count > 0);

      patch({ progress:88, stepMsg:'Building findings report…' });
      await tick();
      const { findings, riskScore } = buildFindings(mbrInfo, iocs, entropy, kwHits);

      patch({ mbrInfo, iocs, entropy, findings, riskScore, progress:92,
              stepMsg:'Analysis complete. Re-computing hashes for post-analysis verification…' });
      await tick(60);

      // Phase 3 — Post-analysis hashes (chain of custody verification)
      patch({ phase:'post-hash', progress:93, stepMsg:'Post-analysis MD5…' });
      await tick();
      const md5Post = computeMD5(bytes);

      patch({ progress:96, stepMsg:'Post-analysis SHA-1…' });
      await tick();
      const sha1Post = await webHash(buffer, 'SHA-1');

      patch({ progress:98, stepMsg:'Post-analysis SHA-256…' });
      await tick();
      const sha256Post = await webHash(buffer, 'SHA-256');

      const postHashes: HashSet = { md5:md5Post, sha1:sha1Post, sha256:sha256Post, timestamp:new Date().toUTCString() };
      patch({ postHashes, phase:'done', progress:100, stepMsg:'Complete.' });
    } catch (err) {
      patch({ phase:'error', error:String(err) });
    }
  }, [file, patch]);

  const { phase, progress, stepMsg, preHashes, postHashes, mbrInfo, findings, iocs, entropy, riskScore, error } = state;

  const hashMatch = preHashes && postHashes &&
    preHashes.md5 === postHashes.md5 &&
    preHashes.sha1 === postHashes.sha1 &&
    preHashes.sha256 === postHashes.sha256;

  const critCount  = findings.filter(f => f.severity === 'critical').length;
  const highCount  = findings.filter(f => f.severity === 'high').length;
  const medCount   = findings.filter(f => f.severity === 'medium').length;
  const infoCount  = findings.filter(f => f.severity === 'info').length;

  const riskLabel = riskScore >= 75 ? 'CRITICAL' : riskScore >= 50 ? 'HIGH' : riskScore >= 25 ? 'MEDIUM' : 'LOW';
  const riskCls   = riskScore >= 75 ? 'risk--critical' : riskScore >= 50 ? 'risk--high' : riskScore >= 25 ? 'risk--medium' : 'risk--low';

  const maxE = Math.max(...entropy.map(p => p.entropy), 1);

  return (
    <div className="df-page">
      <div className="df-header">
        <span className="df-badge">Feature #2 · Anomaly Detection</span>
        <h1>Disk Image <span className="df-hi">Forensics</span></h1>
        <p>Chain-of-custody hashing · Binary parsing · AI-powered entropy anomaly detection · IOC extraction</p>
      </div>

      {/* ── Drop zone ── */}
      <div
        className={`df-zone ${dragging ? 'df-zone--drag' : ''} ${file ? 'df-zone--loaded' : ''}`}
        onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept=".dd,.img,.bin,.raw,.iso,.vmdk"
          style={{display:'none'}} onChange={onInput} />
        <div className="df-zone-icon">{file ? '💾' : '📁'}</div>
        {file ? (
          <>
            <p className="df-zone-name">{file.name}</p>
            <span>{(file.size / (1024*1024)).toFixed(2)} MB · click to change</span>
          </>
        ) : (
          <>
            <p>Drop a disk image here</p>
            <span>or click to browse</span>
          </>
        )}
        <div className="df-fmts">
          {['.dd','.img','.bin','.raw','.iso','.vmdk'].map(f => <span key={f} className="df-fmt">{f}</span>)}
        </div>
      </div>

      {error && <div className="df-error">⚠ {error}</div>}

      {file && phase === 'idle' && (
        <button className="df-run-btn" onClick={runAnalysis}>▶ Run Forensic Analysis</button>
      )}

      {/* ── Progress bar ── */}
      {['loading','pre-hash','analyzing','post-hash'].includes(phase) && (
        <div className="df-prog-wrap">
          <div className="df-prog-track">
            <div className="df-prog-fill" style={{width:`${progress}%`}} />
          </div>
          <p className="df-prog-msg">{stepMsg}</p>
        </div>
      )}

      {/* ── Results ── */}
      {(phase === 'done' || preHashes) && (
        <div className="df-results">

          {/* Risk banner */}
          {phase === 'done' && (
            <div className={`df-risk ${riskCls}`}>
              <div className="df-risk-score">{riskScore}<span className="df-risk-denom">/100</span></div>
              <div>
                <div className="df-risk-label">RISK LEVEL: {riskLabel}</div>
                <div className="df-risk-sub">
                  {critCount > 0 && <span className="df-sev-dot critical">{critCount} critical</span>}
                  {highCount > 0 && <span className="df-sev-dot high">{highCount} high</span>}
                  {medCount  > 0 && <span className="df-sev-dot medium">{medCount} medium</span>}
                  {infoCount > 0 && <span className="df-sev-dot info">{infoCount} info</span>}
                </div>
              </div>
            </div>
          )}

          {/* Phase 1 — Pre-analysis hashes */}
          {preHashes && (
            <div className="df-panel">
              <div className="df-panel-head">
                <span className="df-phase-num">PHASE 1</span>
                <h2>Pre-Analysis Hash Verification</h2>
              </div>
              <p className="df-timestamp">Recorded at: {preHashes.timestamp}</p>
              <HashTable hashes={preHashes} />
              <p className="df-panel-note">
                These hashes establish the <strong>chain of custody</strong> for the disk evidence.
                Any byte-level modification after this point will produce different outputs, proving tampering.
              </p>
            </div>
          )}

          {/* Phase 2 — Disk structure */}
          {mbrInfo && (
            <div className="df-panel">
              <div className="df-panel-head">
                <span className="df-phase-num">PHASE 2</span>
                <h2>Disk Structure Analysis</h2>
              </div>
              <div className="df-mbr-grid">
                <div className="df-mbr-cell">
                  <span className="df-mbr-lbl">MBR Signature</span>
                  <span className={`df-mbr-val ${mbrInfo.valid ? 'df-ok' : 'df-bad'}`}>
                    {mbrInfo.valid ? '0x55AA  ✓  Valid' : '✗  Not found'}
                  </span>
                </div>
                <div className="df-mbr-cell">
                  <span className="df-mbr-lbl">Disk Signature</span>
                  <code className="df-mbr-val">0x{mbrInfo.diskSignature}</code>
                </div>
                <div className="df-mbr-cell">
                  <span className="df-mbr-lbl">File System</span>
                  <span className="df-mbr-val">{mbrInfo.fsSignature ?? 'Not detected at sector 0'}</span>
                </div>
                <div className="df-mbr-cell">
                  <span className="df-mbr-lbl">Partitions</span>
                  <span className="df-mbr-val">{mbrInfo.partitions.length}</span>
                </div>
              </div>

              {mbrInfo.partitions.length > 0 && (
                <div className="df-table-wrap">
                  <table className="df-part-table">
                    <thead><tr><th>#</th><th>Type</th><th>Start Sector</th><th>Size</th><th>Active</th></tr></thead>
                    <tbody>
                      {mbrInfo.partitions.map(p => (
                        <tr key={p.num}>
                          <td>{p.num}</td>
                          <td>
                            <code>{p.typeName}</code>
                            <span className="df-hex-tag">0x{p.type.toString(16).toUpperCase().padStart(2,'0')}</span>
                          </td>
                          <td className="df-mono">{p.startSector.toLocaleString()}</td>
                          <td>{p.sizeMB > 0 ? `${p.sizeMB.toLocaleString()} MB` : `${p.sizeSectors.toLocaleString()} sectors`}</td>
                          <td>{p.active ? <span className="df-active-tag">Bootable</span> : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Phase 3 — Analysis results tabs */}
          {findings.length > 0 && (
            <div className="df-panel">
              <div className="df-panel-head">
                <span className="df-phase-num">PHASE 3</span>
                <h2>Analysis Results</h2>
              </div>

              <div className="df-tabs">
                {(['findings','iocs','entropy','commands'] as const).map(t => (
                  <button key={t} className={`df-tab ${activeTab === t ? 'df-tab--on' : ''}`}
                    onClick={() => setActiveTab(t)}>
                    {{ findings:`Findings (${findings.length})`, iocs:`IOCs (${iocs.length})`, entropy:'Entropy Map', commands:'Commands Used' }[t]}
                  </button>
                ))}
              </div>

              {/* Findings tab */}
              {activeTab === 'findings' && (
                <div className="df-findings">
                  {findings.map(f => (
                    <div key={f.id} className={`df-finding df-finding--${f.severity}`}>
                      <div className="df-finding-hd">
                        <span className={`df-sev df-sev--${f.severity}`}>{f.severity.toUpperCase()}</span>
                        <span className="df-finding-title">{f.title}</span>
                      </div>
                      <p className="df-finding-desc">{f.description}</p>
                      {f.evidence.length > 0 && (
                        <div className="df-evidence">
                          <span className="df-evid-lbl">Evidence:</span>
                          {f.evidence.map((e,i) => <code key={i} className="df-evid-item">{e}</code>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* IOCs tab */}
              {activeTab === 'iocs' && (
                <div className="df-ioc-wrap">
                  {iocs.length === 0
                    ? <p className="df-empty">No IOCs extracted from this image.</p>
                    : (
                      <div className="df-table-wrap">
                        <table className="df-ioc-table">
                          <thead><tr><th>Type</th><th>Value</th><th>Count</th><th>Severity</th></tr></thead>
                          <tbody>
                            {iocs.slice(0,200).map((ioc,i) => (
                              <tr key={i}>
                                <td><span className="df-ioc-type">{ioc.type}</span></td>
                                <td><code className="df-ioc-val">{ioc.value.length > 90 ? ioc.value.slice(0,87)+'…' : ioc.value}</code></td>
                                <td>{ioc.count}</td>
                                <td><span className={`df-sev df-sev--${ioc.severity}`}>{ioc.severity}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {iocs.length > 200 && <p className="df-overflow">Showing 200 of {iocs.length} IOCs.</p>}
                      </div>
                    )}
                </div>
              )}

              {/* Entropy tab */}
              {activeTab === 'entropy' && (
                <div className="df-ent-wrap">
                  <div className="df-ent-legend">
                    <span className="df-leg df-leg--normal">■ Normal (&lt;7.2 bits/byte)</span>
                    <span className="df-leg df-leg--high">■ High (7.2–7.6)</span>
                    <span className="df-leg df-leg--crit">■ Critical (&gt;7.6)</span>
                  </div>
                  <div className="df-ent-ai-note">
                    <strong>AI Technique — Shannon Entropy Anomaly Detection:</strong> Each bar is a sampled 512-byte sector.
                    The model flags sectors exceeding the statistical anomaly threshold (7.2 bits/byte).
                    Fully encrypted or ransomware-processed data approaches the theoretical maximum of 8.0 bits/byte.
                  </div>
                  <div className="df-ent-chart">
                    {entropy.map((p,i) => {
                      const cls = p.entropy > 7.6 ? 'df-eb--crit' : p.entropy > 7.2 ? 'df-eb--high' : 'df-eb--norm';
                      return (
                        <div key={i} className={`df-ent-bar ${cls}`}
                          style={{height:`${(p.entropy/maxE)*100}%`}}
                          title={`Sector ${p.sectorIdx} @ ${p.offsetMB.toFixed(2)} MB: ${p.entropy.toFixed(4)} bits/byte`}
                        />
                      );
                    })}
                  </div>
                  <div className="df-ent-stats">
                    <span>Average: {(entropy.reduce((s,p)=>s+p.entropy,0)/(entropy.length||1)).toFixed(3)} bits/byte</span>
                    <span>Maximum: {Math.max(...entropy.map(p=>p.entropy)).toFixed(3)}</span>
                    <span>Anomalous sectors: {entropy.filter(p=>p.entropy>7.2).length} of {entropy.length} sampled</span>
                    <span>Threshold: 7.200 bits/byte</span>
                  </div>
                </div>
              )}

              {/* Commands tab */}
              {activeTab === 'commands' && (
                <div className="df-cmd-wrap">
                  <p className="df-cmd-note">
                    These are the equivalent forensic commands that would be run on a real system.
                    This application replicates the same operations in the browser using the
                    <strong> Web Crypto API</strong>, custom MBR/partition parsers, and a
                    <strong> Shannon entropy anomaly detector</strong>.
                  </p>
                  <pre className="df-cmd-pre">{FORENSIC_COMMANDS}</pre>
                </div>
              )}
            </div>
          )}

          {/* Phase 4 — Post-analysis hashes */}
          {postHashes && (
            <div className="df-panel">
              <div className="df-panel-head">
                <span className="df-phase-num">PHASE 4</span>
                <h2>Post-Analysis Integrity Verification</h2>
              </div>
              <p className="df-timestamp">Re-computed at: {postHashes.timestamp}</p>
              <HashTable hashes={postHashes} pre={preHashes ?? undefined} />
              <div className={`df-custody ${hashMatch ? 'df-custody--pass' : 'df-custody--fail'}`}>
                {hashMatch
                  ? '✅  CHAIN OF CUSTODY VERIFIED — All three hashes match. The disk image was not modified during this analysis session.'
                  : '❌  INTEGRITY FAILURE — Hash mismatch detected. The evidence file may have been altered.'}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

function tick(ms = 0) { return new Promise<void>(r => setTimeout(r, ms)); }

export default DiskForensics;
