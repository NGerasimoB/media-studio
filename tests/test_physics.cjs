const {test} = require('node:test');
const assert = require('node:assert/strict');
const {simulateSlab, stateAt} = require('../assets/remotion/physics.cjs');

test('slab has finite states, falls onto the supports and stays above them', () => {
  const states = simulateSlab({duration: 8, releaseAt: 1});
  for (const state of states) {
    assert.ok(Object.values(state).every(Number.isFinite), 'non-finite physics state');
  }
  assert.equal(stateAt(states, 0.5).y, 85);
  assert.ok(stateAt(states, 2).y > 280, 'slab did not fall');
  const last = states.at(-1);
  assert.ok(last.y > 300 && last.y < 322, 'slab missed the support');
  // Contacts may settle sideways; the slab must remain over the support footprint.
  assert.ok(Math.abs(last.x - 510) < 50 && Math.abs(last.angle) < 0.05);
});

test('seeking out of order and rebuilding keeps exactly the same states', () => {
  const settings = {duration: 7, releaseAt: 1.5};
  const first = simulateSlab(settings);
  const second = simulateSlab(settings);
  for (const time of [6.3, 0.5, 2.25, 1.5, 0, 6.3]) {
    assert.deepEqual(stateAt(first, time), stateAt(second, time));
  }
});

test('invalid simulation times are rejected', () => {
  for (const settings of [
    {duration: 0, releaseAt: 0}, {duration: 2, releaseAt: 3},
    {duration: 2, releaseAt: -1}, {duration: 2, releaseAt: 0, fps: 30},
  ]) assert.throws(() => simulateSlab(settings));
});
