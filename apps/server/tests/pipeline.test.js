import test from 'node:test';
import assert from 'node:assert/strict';
import {demoProject,estimateCredits} from '../prompts.js';
test('storyboard demo has 15 unique scenes',()=>{const p=demoProject();assert.equal(p.scenes.length,15);assert.equal(new Set(p.scenes.map(s=>s.id)).size,15);});
test('Flow credit estimates are not paid API estimates',()=>{assert.equal(estimateCredits(15,'veoLite',8).total,150);assert.equal(estimateCredits(3,'omni',4).total,21);assert.equal(estimateCredits(3,'omni',4).usd,'1.20');});
