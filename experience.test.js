import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initial,validateState} from './model.js';
import {capture,materialize,validateDocument} from './sync-model.js';
import {weeklyCount} from './experience.js';
test('new profile fields survive backup and synchronization; legacy backups remain valid',()=>{const s=initial();s.profile.sex='female';s.profile.fitness='advanced';s.profile.trainingDays=[1,3,5];assert.deepEqual(materialize(validateDocument(capture(null,s,'device',1))).profile,s.profile);const legacy=initial();for(const k of ['sex','fitness','trainingDays'])delete legacy.profile[k];assert.equal(validateState(legacy),legacy);});
test('invalid profile choices cannot enter synchronization',()=>{for(const [key,value] of [['sex','invalid'],['fitness','expert'],['trainingDays',[7]],['trainingDays',[1,1]],['trainingDays','Monday']]){const s=initial();s.profile[key]=value;assert.throws(()=>validateState(s));assert.throws(()=>validateDocument(capture(null,s,'device',1)));}});
test('weekly count starts on local Monday and excludes future records',()=>{const now=new Date(2026,9,18,12);const history=[new Date(2026,9,11,23),new Date(2026,9,12,0),new Date(2026,9,18,11),new Date(2026,9,19,0)].map(date=>({date:date.toISOString()}));assert.equal(weeklyCount(history,now),2);});
