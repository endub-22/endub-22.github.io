import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = globalThis;
await import('../nebula-art/story.js');
const { TEXT_DEFAULTS } = await import('../nebula-art/whispers.js');

test('endingId maps paths to correct endings', () => {
  const { endingId } = globalThis.NebulaStory;
  assert.equal(endingId('ABBBB'), 'E2');
  assert.equal(endingId('AABBB'), 'E3');
  assert.equal(endingId('AAABB'), 'E4');
  assert.equal(endingId('AAAAB'), 'E5');
  assert.equal(endingId('BAAAA'), 'E6');
  assert.equal(endingId('AAAAA'), 'E7');
  assert.equal(endingId('ABABA'), 'E8');
  assert.equal(endingId('AAABA'), 'E9');
  assert.equal(endingId('BABBB'), 'E10');
});

test('endingId rejects invalid paths', () => {
  const { endingId } = globalThis.NebulaStory;
  assert.throws(() => endingId('ABC'), /Path must be exactly 5 choices/);
});

test('createStoryEngine computes ending from choices', () => {
  const { createStoryEngine } = globalThis.NebulaStory;
  let observed;
  const engine = createStoryEngine({
    onRenderNode: () => {},
    onRenderEnding: (_, id) => { observed = id; }
  });
  engine.start();
  'AAABA'.split('').forEach(c => engine.choose(c));
  assert.equal(observed, 'E9');
});

test('TEXT_DEFAULTS exposes expected values', () => {
  assert.equal(TEXT_DEFAULTS.textEnabled, true);
  assert.equal(TEXT_DEFAULTS.textSize, 72);
  assert.equal(TEXT_DEFAULTS.textFadeInMs, 2000);
});
