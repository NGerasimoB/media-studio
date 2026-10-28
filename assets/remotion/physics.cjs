const {Bodies, Body, Composite, Engine} = require('matter-js');

// Precompute from zero; rendering frame 200 before frame 20 gives the same state.
function simulateSlab({duration, releaseAt, fps = 60}) {
  if (![duration, releaseAt, fps].every(Number.isFinite) || duration <= 0 ||
      releaseAt < 0 || releaseAt >= duration || fps < 60 || fps > 240) {
    throw new Error('Expected duration > releaseAt >= 0 and 60 <= simulation fps <= 240');
  }
  const engine = Engine.create({enableSleeping: false});
  const slab = Bodies.rectangle(510, 85, 730, 82, {
    restitution: 0.22, friction: 0.7,
  });
  // Capture finite mass/inertia before holding the body; static-at-creation cannot restore them.
  Body.setStatic(slab, true);
  const supports = [300, 430, 560, 690].map((x) =>
    Bodies.rectangle(x, 505, 52, 290, {isStatic: true}));
  Composite.add(engine.world, [slab, ...supports]);
  const states = [];
  let released = false;
  for (let step = 0; step <= Math.ceil(duration * fps); step++) {
    if (!released && step / fps >= releaseAt) {
      Body.setStatic(slab, false);
      released = true;
    }
    const state = {x: slab.position.x, y: slab.position.y, angle: slab.angle};
    if (!Object.values(state).every(Number.isFinite)) throw new Error('Non-finite physics state');
    states.push(state);
    Engine.update(engine, 1000 / fps);
  }
  Engine.clear(engine);
  Composite.clear(engine.world, false);
  return states;
}

function stateAt(states, seconds, fps = 60) {
  const index = Math.max(0, Math.min(states.length - 1, seconds * fps));
  const left = Math.floor(index), right = Math.min(left + 1, states.length - 1);
  const fraction = index - left;
  return Object.fromEntries(['x', 'y', 'angle'].map((key) =>
    [key, states[left][key] + (states[right][key] - states[left][key]) * fraction]));
}

module.exports = {simulateSlab, stateAt};
