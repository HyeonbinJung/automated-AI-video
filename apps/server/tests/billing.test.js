import test from 'node:test';
import assert from 'node:assert/strict';
import {creditsFor,videoCredits,estimates,MARKUP,KRW_PER_USD,USD,workUsd} from '../pricing.js';
import {spend,setSpendHook} from '../services.js';

test('every charge is at least provider cost + 20%', () => {
  assert.ok(MARKUP >= 0.2);
  for (const usd of [0.000001, 0.0004, 0.004, 0.0162, 0.07, 0.63, 1.5]) {
    assert.ok(creditsFor(usd) >= usd * KRW_PER_USD * 1.2, `usd ${usd}`);
  }
  assert.equal(creditsFor(0), 0);
});

test('estimates cover the worst-case usage of each step', () => {
  for (const n of [7, 10, 13]) {
    const e = estimates(n);
    assert.equal(e.storyboard, creditsFor(workUsd.storyboard(n)));
    assert.equal(e.videos, creditsFor(workUsd.videos(n)));
  }
  assert.equal(videoCredits(5), creditsFor(5 * USD.videoSecond));
});

test('a recorded provider spend is billed through the hook, a zero spend is not', () => {
  const calls = [];
  setSpendHook((p, usd, what, detail) => calls.push({ id: p.id, usd, what, detail }));
  const p = { id: 'p1' };
  spend(p, 0.002, 'deepseek', { tokens: 1500 });
  spend(p, 0, 'kie:z-image', { kieCredits: 0 });
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], { id: 'p1', usd: 0.002, what: 'deepseek', detail: { tokens: 1500 } });
  assert.equal(p.spendUsd, 0.002);
  setSpendHook(() => {});
});
