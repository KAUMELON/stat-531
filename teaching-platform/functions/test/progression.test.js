const {test}=require('node:test'),assert=require('node:assert/strict');const {cleared,unlockedIds,csvCell}=require('../progression');
const chapters=[{id:'01'},{id:'02'},{id:'03'}];
test('only the first chapter is open to a new student',()=>assert.deepEqual(unlockedIds(chapters,{}),['01']));
test('a failed assessment does not unlock the next chapter',()=>assert.deepEqual(unlockedIds(chapters,{'01':{score:1,total:2}}),['01']));
test('passing unlocks exactly the next chapter',()=>assert.deepEqual(unlockedIds(chapters,{'01':{score:2,total:2}}),['01','02']));
test('a prior pass survives a lower retry score',()=>assert.ok(cleared({passed:true,score:0,total:2})));
test('a later isolated pass cannot bypass earlier chapters',()=>assert.deepEqual(unlockedIds(chapters,{'02':{passed:true}}),['01']));
test('score CSV quotes values and neutralizes formula cells',()=>{assert.equal(csvCell('=1+1'),'"\'=1+1"');assert.equal(csvCell('a"b'),'"a""b"');});
