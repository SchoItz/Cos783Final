import { isolationForestScores } from './ai/isolationForest';

// Quick sanity check on the Isolation Forest: drop a single obvious outlier
// into a tight Gaussian-ish cluster and make sure the outlier gets a higher
// anomaly score than the cluster members. If this ever breaks, something
// fundamental in the IF is wrong.
test('isolation forest scores an obvious outlier higher than the cluster', () => {
  // Tiny seeded PRNG so the test is reproducible (Jest doesn't seed Math.random).
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
  data.push([10, 10, 10, 10]); // the obvious outlier

  const scores = isolationForestScores(data, 100, 64);
  const outlierScore = scores[scores.length - 1];
  const meanCluster = scores.slice(0, 200).reduce((a, b) => a + b, 0) / 200;

  expect(scores).toHaveLength(data.length);
  expect(outlierScore).toBeGreaterThan(meanCluster);
});
