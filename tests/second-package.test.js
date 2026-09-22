import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { STORIES, tracesFrom } from '../src/data/stories.js';
import { SECOND_STORIES } from '../src/data/secondStories.js';
import { NarrativeDirector } from '../src/narrative/NarrativeDirector.js';
import { restoreHistorias, serializeHistorias } from '../src/state/historias.js';
import { createStoryEffects, EFFECTS } from '../src/world/storyEffects.js';

test('second package round trips every result without duplicates or untrusted text',()=>{
 let count=0; const d=new NarrativeDirector(STORIES,{onResolve:()=>count++});
 for (const s of SECOND_STORIES) {
   d.invite(s.id); assert.equal(d.choose(s.actions[0].id),null);
   for (const outcome of s.outcomes) {
     d.open(s.id); d.resolve(outcome.id,'discard');
     const before=count; d.open(s.id); d.resolve(outcome.id);
     assert.equal(count,before); assert.equal(d.state,'resolved');
     assert.equal(d.invite('silla-quien-falta'),false);
     const restored=restoreHistorias(JSON.parse(JSON.stringify(serializeHistorias({results:d.results}))),STORIES);
     assert.deepEqual(restored.results,d.results);
     d.close(); assert.equal(d.active,null); assert.equal(d.resolve(outcome.id),null);
   }
 }
 assert.equal(tracesFrom(d.results).length,3);
 assert.equal(Object.keys(d.results).length,3);
});
test('second package effects are closed, replaceable and disposable',()=>{
 const scene=new THREE.Scene(), effects=createStoryEffects(scene);
 for (const story of SECOND_STORIES) {
   for (const effectId of [...(story.views||[]),...story.outcomes].map(x=>x.effectId).filter(Boolean)) {
     assert.ok(EFFECTS[effectId]); effects.set(story.id,effectId);
     const n=scene.children.length; effects.set(story.id,effectId); assert.equal(scene.children.length,n);
   }
 }
 effects.dispose(); assert.equal(scene.children.length,0);
});
