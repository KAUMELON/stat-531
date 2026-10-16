const test=require('node:test');const assert=require('node:assert/strict');
const{grade,validAnswers,publicQuestions,shuffle}=require('../grading');
const qs=[{id:'a',prompt:'A',options:['x','y'],answer:1},{id:'b',prompt:'B',options:['x','y'],answer:0}];
test('server grader uses exact integer answers, not truthy or coerced values',()=>{assert.equal(grade(qs,{a:1,b:0}),2);assert.equal(grade(qs,{a:'1',b:0}),1);assert.equal(grade(qs,{}),0);});
test('answer validation rejects unknown IDs, invalid option ranges and arrays',()=>{assert.ok(validAnswers(qs,{a:1}));for(const a of [{a:2},{a:-1},{a:'1'},{fake:0},[]])assert.equal(validAnswers(qs,a),false);});
test('public exam payload omits answers and explanations',()=>{assert.deepEqual(Object.keys(publicQuestions(qs)[0]).sort(),['id','options','prompt']);});
test('shuffle preserves question identities without modifying the bank',()=>{const r=shuffle(qs);assert.deepEqual(r.map(q=>q.id).sort(),['a','b']);assert.equal(qs[0].id,'a');});
