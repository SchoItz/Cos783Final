// Minimal, dependency-free Isolation Forest (unsupervised anomaly detection).
// Implementation of Liu, Ting & Zhou (2008) "Isolation Forest".
//
// A point is "isolated" by recursively partitioning the feature space along
// random attributes at random split values. Anomalies, being few and different,
// require fewer splits to isolate — so they end up with a shorter expected
// path length and therefore a higher anomaly score.

type Row = number[];

interface Node {
  left?: Node;
  right?: Node;
  splitAttr?: number;
  splitVal?: number;
  size: number;
  depth: number;
}

function buildTree(data: Row[], depth: number, maxDepth: number): Node {
  const n = data.length;
  if (depth >= maxDepth || n <= 1) return { size: n, depth };

  const d = data[0].length;
  const a = Math.floor(Math.random() * d);

  let min = Infinity;
  let max = -Infinity;
  for (const r of data) {
    if (r[a] < min) min = r[a];
    if (r[a] > max) max = r[a];
  }
  if (min === max) return { size: n, depth };

  const splitVal = min + Math.random() * (max - min);
  const left: Row[] = [];
  const right: Row[] = [];
  for (const r of data) (r[a] < splitVal ? left : right).push(r);

  return {
    splitAttr: a,
    splitVal,
    size: n,
    depth,
    left: buildTree(left, depth + 1, maxDepth),
    right: buildTree(right, depth + 1, maxDepth),
  };
}

// c(n) — average path length of an unsuccessful search in a BST,
// used to normalise per-tree path lengths (Liu et al. 2008, eq. 1).
const c = (n: number): number =>
  n <= 1 ? 0 : 2 * (Math.log(n - 1) + 0.5772156649) - (2 * (n - 1)) / n;

function pathLength(row: Row, node: Node): number {
  if (node.splitAttr === undefined) return node.depth + c(node.size);
  return row[node.splitAttr] < (node.splitVal as number)
    ? pathLength(row, node.left as Node)
    : pathLength(row, node.right as Node);
}

/**
 * Score every row with the Isolation Forest anomaly score in [0, 1].
 * Higher = more anomalous. Scores ≈ 0.5 indicate "no clear signal".
 */
export function isolationForestScores(
  data: Row[],
  nTrees = 100,
  sampleSize = 256,
): number[] {
  const n = data.length;
  if (n === 0) return [];

  const psi = Math.min(sampleSize, n);
  const maxDepth = Math.ceil(Math.log2(Math.max(psi, 2)));

  const trees: Node[] = [];
  for (let t = 0; t < nTrees; t++) {
    const sample: Row[] = [];
    for (let i = 0; i < psi; i++) sample.push(data[Math.floor(Math.random() * n)]);
    trees.push(buildTree(sample, 0, maxDepth));
  }

  const cn = c(psi);
  return data.map(row => {
    const avg = trees.reduce((s, tr) => s + pathLength(row, tr), 0) / trees.length;
    return Math.pow(2, -avg / cn);
  });
}
