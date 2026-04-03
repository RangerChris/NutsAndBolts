const { createLevel } = require('../src/lib/generator');
const { getLevelParams } = require('../src/lib/progression');

type Stats = {
  runs: number;
  totalShuffle: number;
  minShuffle: number;
  maxShuffle: number;
  buckets: Record<string, number>;
};

function makeStats() {
  return { runs: 0, totalShuffle: 0, minShuffle: Infinity, maxShuffle: -Infinity, buckets: {} } as Stats;
}

async function runSim() {
  const difficulties = ['easy', 'medium', 'hard', 'extreme'] as const;
  const runsPer = 500;

  for (const d of difficulties) {
    const stats = makeStats();
    for (let i = 0; i < runsPer; i++) {
      const seed = `${d}-sim-${i}`;
      const { state } = createLevel({ difficulty: d, level: i % 20 + 1, seed });
      const shuffle = (state.moveHistory || []).length;
      stats.runs += 1;
      stats.totalShuffle += shuffle;
      stats.minShuffle = Math.min(stats.minShuffle, shuffle);
      stats.maxShuffle = Math.max(stats.maxShuffle, shuffle);
      const key = String(shuffle);
      stats.buckets[key] = (stats.buckets[key] || 0) + 1;
    }

    const avg = stats.totalShuffle / stats.runs;
    console.log(`\nDifficulty: ${d}`);
    console.log(`Runs: ${stats.runs}`);
    console.log(`Shuffle moves - avg: ${avg.toFixed(2)}, min: ${stats.minShuffle}, max: ${stats.maxShuffle}`);
    console.log('Top buckets:');
    const sorted = Object.entries(stats.buckets).sort((a, b) => b[1] - a[1]).slice(0, 10);
    for (const [k, v] of sorted) console.log(`  ${k}: ${v}`);

    // show level params for a few sample levels
    console.log('\nSample level params:');
    for (const L of [1, 5, 10, 20]) {
      const p = getLevelParams(d as any, L);
      console.log(` L${L}: bolts=${p.numBolts}, height=${p.stackHeight}, shuffleMoves=${p.shuffleMoves}`);
    }
  }
}

runSim().catch((e) => {
  console.error('Simulation failed:', e);
});
