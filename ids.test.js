import {test} from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {randomId} from './ids.js';
test('HTTP-compatible IDs use secure random values without randomUUID',()=>{const api={getRandomValues:array=>webcrypto.getRandomValues(array)};const ids=Array.from({length:100},()=>randomId(api));assert.equal(new Set(ids).size,100);for(const id of ids)assert.match(id,/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);});
test('native randomUUID remains supported',()=>assert.equal(randomId({randomUUID:()=> 'native-id'}),'native-id'));
test('missing secure randomness fails explicitly',()=>assert.throws(()=>randomId({}),/безопасную/));
