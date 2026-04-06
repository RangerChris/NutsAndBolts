import { describe, it } from 'vitest';
import { createLevel } from './generator';
import { getLevelParams } from './progression';
import { onBalancerEvent } from './balancer';

async function runSim() {
  const difficulties = ['easy', 'medium', 'hard', 'extreme'] as const;
  const runsPer = 200;
  const csvLines: string[] = [];
  const unsubscribe = onBalancerEvent((ev) => {
    const p = ev.payload || {};
    const seed = JSON.stringify(p.seed || '');
    const difficulty = JSON.stringify(p.difficulty || '');
    const level = JSON.stringify(p.level || '');
    const shuffleMoves = JSON.stringify((p.params && p.params.shuffleMoves) || '');
    const performed = JSON.stringify((p.generated && p.generated.shufflePerformed) || '');
    csvLines.push([seed, difficulty, level, shuffleMoves, performed].join(','));
  });
  for (const d of difficulties) {
    const stats = { runs: 0, totalShuffle: 0, min: Infinity, max: -Infinity, buckets: {} as Record<string, number> };
    for (let i = 0; i < runsPer; i++) {
      const seed = `${d}-sim-${i}`;
      const { state } = createLevel({ difficulty: d, level: (i % 20) + 1, seed });
      const shuffle = (state.moveHistory || []).length;
      stats.runs += 1;
      stats.totalShuffle += shuffle;
      stats.min = Math.min(stats.min, shuffle);
      stats.max = Math.max(stats.max, shuffle);
      stats.buckets[shuffle] = (stats.buckets[shuffle] || 0) + 1;
    }
    const avg = stats.totalShuffle / stats.runs;
    // Print summary
     
    console.log(`\nDifficulty: ${d} — runs=${stats.runs} avg=${avg.toFixed(2)} min=${stats.min} max=${stats.max}`);
    const sorted = Object.entries(stats.buckets).sort((a, b) => b[1] - a[1]).slice(0, 8);
     
    console.log('Top buckets:', sorted.slice(0, 8).map(([k, v]) => `${k}:${v}`).join(', '));
    // sample level params
     
    console.log('Sample params:');
    for (const L of [1, 5, 10, 20]) {
      const p = getLevelParams(d, L);
       
      console.log(` L${L}: bolts=${p.numBolts}, height=${p.stackHeight}, shuffleMoves=${p.shuffleMoves}`);
    }
  }
  unsubscribe();
  if (csvLines.length > 0) {
     
    console.log('\nCSV sample (first 5):');
     
    console.log(['seed,difficulty,level,shuffleMoves,shufflePerformed', ...csvLines.slice(0, 5)].join('\n'));
  }
}

describe('simulation', () => {
  it('runs generator simulation for balancing (prints to console)', async () => {
    await runSim();
  });
});
