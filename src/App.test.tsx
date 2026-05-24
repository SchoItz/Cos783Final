import { isolationForestScores } from './ai/isolationForest';

// Smoke test: a clear outlier in a tight Gaussian cluster should receive
// a higher Isolation Forest anomaly score than the cluster members.
test('isolation forest assigns higher score to an obvious outlier', () => {
  const rng = (seed: number) => {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 0x100000000;
    };
  };
  const rand = rng(42);
  const data: number[][] = [];
  for (let i = 0; i < 200; i++) {
    data.push([rand() * 0.1, rand() * 0.1, rand() * 0.1, rand() * 0.1]);
  }
  // Add one obvious outlier far from the cluster
  data.push([10, 10, 10, 10]);

  const scores = isolationForestScores(data, 100, 64);

  const outlierScore = scores[scores.length - 1];
  const meanCluster = scores.slice(0, 200).reduce((a, b) => a + b, 0) / 200;

  expect(scores).toHaveLength(data.length);
  expect(outlierScore).toBeGreaterThan(meanCluster);
});
