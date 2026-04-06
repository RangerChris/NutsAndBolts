import { createLevel } from '../src/lib/generator';
import { performMove, isWin, computeOptimalMoves } from '../src/lib/engine';

function canon(state: any) {
  return state.bolts.map((b: any) => b.nuts.join(',')).join('|');
}

function cloneState(s: any) {
  return {
    bolts: s.bolts.map((b: any) => ({ id: b.id, capacity: b.capacity, nuts: b.nuts.slice() })),
    extraBoltUsed: Boolean(s.extraBoltUsed),
    level: s.level,
    difficulty: s.difficulty,
    seed: s.seed,
    moveHistory: [],
  };
}

function findSolutionPath(startState: any, maxDepth = 100): Array<{ fromBoltId: string; toBoltId: string }> | null {
  if (isWin(startState)) return [];
  const startCanon = canon(startState);
  const queue: Array<{ state: any; depth: number }> = [{ state: cloneState(startState), depth: 0 }];
  const visited = new Set<string>([startCanon]);
  const parent = new Map<string, { prev: string | null; move: { fromBoltId: string; toBoltId: string } | null }>();
  parent.set(startCanon, { prev: null, move: null });

  while (queue.length > 0) {
    const { state, depth } = queue.shift() as { state: any; depth: number };
    if (depth >= maxDepth) continue;
    for (let i = 0; i < state.bolts.length; i++) {
      for (let j = 0; j < state.bolts.length; j++) {
        if (i === j) continue;
        const ns = cloneState(state);
        const mv = performMove(ns.bolts[i], ns.bolts[j]);
        if (!mv) continue;
        const c = canon(ns);
        if (visited.has(c)) continue;
        parent.set(c, { prev: canon(state), move: { fromBoltId: mv.fromBoltId, toBoltId: mv.toBoltId } });
        if (isWin(ns)) {
          const path: Array<{ fromBoltId: string; toBoltId: string }> = [];
          let cur: string | null = c;
          while (cur) {
            const p = parent.get(cur);
            if (!p) break;
            if (p.move) path.unshift(p.move);
            cur = p.prev as string | null;
          }
          return path;
        }
        visited.add(c);
        queue.push({ state: ns, depth: depth + 1 });
      }
    }
  }
  return null;
}

async function main() {
  const seed = process.argv[2] || 's-easy-1';
  const difficulty = (process.argv[3] as any) || 'easy';
  const level = Number(process.argv[4] || 1);
  const maxDepth = Number(process.argv[5] || 200);

  console.log(`Inspecting seed=${seed} difficulty=${difficulty} level=${level} maxDepth=${maxDepth}`);
  const { state } = createLevel({ difficulty, level, seed });
  console.log('Bolts:');
  state.bolts.forEach((b: any, idx: number) => {
    console.log(`  [${idx}] id=${b.id} cap=${b.capacity} nuts=${b.nuts.join(',')}`);
  });
  console.log('isWin=', isWin(state));
  const optimal = computeOptimalMoves(state, 20);
  console.log('computeOptimalMoves (maxDepth 20) =>', optimal);

  const path = findSolutionPath(state, maxDepth);
  if (!path) {
    console.log('No solution path found within depth', maxDepth);
    console.log('Canonical start:', canon(state));
    console.log('Bolts JSON:', JSON.stringify(state.bolts, null, 2));
    process.exitCode = 2;
    return;
  }
  console.log('Found path length=', path.length);
  console.log('Moves:');
  path.forEach((m, i) => console.log(`${i + 1}: ${m.fromBoltId} -> ${m.toBoltId}`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
