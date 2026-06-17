const assert = require('assert');
require('../extension/lib/classifier.js');
const C = globalThis.BDTrialClassifier;

let r = C.classifyTweet('Brent Dill is dangerous and this pattern harmed people.');
assert.equal(r.related, true);
assert.equal(r.lane, 'prosecution');
assert.equal(C.roleAllows('prosecution', r), true);
assert.equal(C.roleAllows('defense', r), false);

r = C.classifyTweet('The Brent Dill reaction was an outsized overreaction and unfair default guilty mob.');
assert.equal(r.related, true);
assert.equal(r.lane, 'defense');
assert.equal(C.roleAllows('defense', r), true);
assert.equal(C.roleAllows('prosecution', r), false);

r = C.classifyTweet('A thread about gardening.');
assert.equal(r.related, false);
assert.equal(C.roleAllows('jury', r), false);

r = C.classifyTweet('Brent Dill dangerous harm but also possibly misrepresented context.');
assert.equal(r.lane, 'contested');
assert.equal(C.roleAllows('jury', r), true);
assert.equal(C.roleAllows('prosecution', r), true);
assert.equal(C.roleAllows('defense', r), true);

const receipt = C.receiptFromTweet({tweetId:'1', url:'https://x.com/i/web/status/1', author:'someone', text:'Brent Dill dangerous', role:'jury', classification:r, capturedAt:'2026-06-17T00:00:00Z'});
assert.equal(receipt.schema_version, 'trial-extension-capture/v0.1');
assert.equal(receipt.admission, 'unreviewed');
console.log('classifier tests passed');
