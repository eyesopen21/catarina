import test from 'node:test';
import assert from 'node:assert/strict';
import { createRaceBarrier, RACE_IDS, RACE_SCENARIOS, raceBarriers } from './barriers.mjs';

const withTimeout = (promise, ms = 2000) =>
  Promise.race([
    promise,
    new Promise((_resolve, reject) => setTimeout(() => reject(new Error('barrier timed out')), ms)),
  ]);

test('R-01 through R-10 are exposed as reusable barriers', () => {
  assert.deepEqual([...RACE_IDS], ['R-01', 'R-02', 'R-03', 'R-04', 'R-05', 'R-06', 'R-07', 'R-08', 'R-09', 'R-10']);
  for (const id of RACE_IDS) {
    const barrier = raceBarriers[id]({ point: 'after-commit' });
    assert.equal(typeof barrier, 'function');
    assert.equal(barrier.id, id);
    assert.equal(barrier.point, 'after-commit');
    assert.equal(barrier.description, RACE_SCENARIOS[id]);
  }
});

test('a race barrier releases every participant only once all have arrived', async () => {
  const barrier = createRaceBarrier('R-04', { parties: 3 });
  let released = 0;
  const participants = [1, 2, 3].map(async () => {
    await withTimeout(barrier());
    released += 1;
    return released;
  });
  const results = await withTimeout(Promise.all(participants));
  assert.deepEqual(results.sort(), [1, 2, 3]);
});

test('unknown race ids and invalid party counts are rejected', () => {
  assert.throws(() => createRaceBarrier('R-99'), TypeError);
  assert.throws(() => createRaceBarrier('R-01', { parties: 0 }), TypeError);
});
