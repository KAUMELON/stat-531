const {test}=require('node:test'),assert=require('node:assert/strict');const {cleared,unlockedIds,csvCell}=require('../progression');
const chapters=[{id:'01'},{id:'02'},{id:'03'}];
test('only the first chapter is open to a new student',()=>assert.deepEqual(unlockedIds(chapters,{}),['01']));
test('a failed assessment does not unlock the next chapter',()=>assert.deepEqual(unlockedIds(chapters,{'01':{score:1,total:2}}),['01']));
test('passing unlocks exactly the next chapter',()=>assert.deepEqual(unlockedIds(chapters,{'01':{score:2,total:2}}),['01','02']));
test('a prior pass survives a lower retry score',()=>assert.ok(cleared({passed:true,score:0,total:2})));
test('a later isolated pass cannot bypass earlier chapters',()=>assert.deepEqual(unlockedIds(chapters,{'02':{passed:true}}),['01']));
test('score CSV quotes values and neutralizes formula cells',()=>{assert.equal(csvCell('=1+1'),'"\'=1+1"');assert.equal(csvCell('a"b'),'"a""b"');});

test('Chapter assessment needs reading, with R practice optional',()=>{const {canAssess}=require('../progression'),chapter={steps:[{id:'read',kind:'learn'},{id:'lab',kind:'challenge'}]};assert.equal(canAssess({},chapter,null),false);assert.equal(canAssess({readComplete:true},chapter,null),true);assert.equal(canAssess({stepIds:['read']},chapter,null),true);});
test('An available video must also be marked complete',()=>{const {canAssess}=require('../progression'),chapter={steps:[{id:'read',kind:'learn'}]},video={provider:'file',url:'https://example.com/a.mp4'};assert.equal(canAssess({readComplete:true},chapter,video),false);assert.equal(canAssess({readComplete:true,videoComplete:true},chapter,video),true);});
