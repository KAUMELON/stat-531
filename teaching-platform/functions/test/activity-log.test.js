const {test}=require('node:test');
const assert=require('node:assert/strict');
const {filters,event,history}=require('../activity-log');
test('history date filters include the full IST day and reject path injection',()=>{
 const f=filters({uid:'student_1',from:'2026-10-17',to:'2026-10-17'});
 assert.equal(new Date(f.from).toISOString(),'2026-10-16T18:30:00.000Z');
 assert.equal(f.to-f.from,86400000);
 for(const input of [{uid:'../other'},{uid:'ok',from:'2026-02-30'},{uid:'ok',cursor:'../bad'},{uid:'ok',from:'2026-10-18',to:'2026-10-17'}])assert.throws(()=>filters(input));
});
test('event timestamps are server assigned and transaction events use the transaction',()=>{
 let captured;const ref={set:d=>{captured=d;}};const db={collection:path=>{assert.equal(path,'students/student/activity');return{doc:()=>ref};}};
 event(db,'student','signed_in');assert.equal(captured.source,'server');assert.equal(captured.occurredAt.constructor.name,'ServerTimestampTransform');
 event(db,'student','attendance',{chapterId:'01'},{set:(r,d)=>{assert.equal(r,ref);captured=d;}});assert.equal(captured.chapterId,'01');
});
test('history pagination returns a stable continuation and CSV never silently truncates',async()=>{
 const calls=[];const docs=Array.from({length:101},(_,i)=>({id:'event'+i,data:()=>({occurredAt:{toMillis:()=>1000+i},type:'attendance'})}));
 const query={orderBy(){return this;},limit(n){calls.push(n);return this;},async get(){return{docs};}};
 const db={collection:()=>query};const page=await history(db,{uid:'student'});assert.equal(page.events.length,100);assert.equal(page.cursor,'event99');assert.equal(page.events[0].occurredAt,1000);assert.deepEqual(calls,[101]);
 query.get=async()=>({docs:Array(5001).fill(docs[0])});await assert.rejects(history(db,{uid:'student'},true),/5,000/);
});
