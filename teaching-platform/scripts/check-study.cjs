const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let source=fs.readFileSync('public/classroom.js','utf8').split("$('#account').onclick=")[0];
const course=JSON.parse(fs.readFileSync('functions/content/course.json')),learning=JSON.parse(fs.readFileSync('functions/content/learning.json'));
const context=vm.createContext({console});vm.runInContext(source,context);
context.fixture={course,learning,books:[],ratings:{}};
vm.runInContext('data=fixture; session={user:{name:"Test learner"}};',context);
let topics=0,examples=0;
for(const c of course.chapters){
const groups=vm.runInContext(`topicGroups('${c.id}')`,context);topics+=groups.length;
for(let i=0;i<groups.length;i++){
const html=vm.runInContext(`studyView('${c.id}',${i})`,context);
assert.ok(html.includes('Complete chapter reading'));assert.ok(!html.includes('Pause and think'));
for(const step of groups[i].items.filter(s=>s.kind==='code')){examples++;assert.ok(step.code.length>0);}
}
assert.ok(vm.runInContext(`bookView('${c.id}')`,context).includes(c.bookUrl));
}
assert.equal(examples,218);assert.equal(course.chapters.length,14);
assert.ok(vm.runInContext('chaptersView()',context).includes('chapter-search'));
console.log(JSON.stringify({chapters:14,topics,originalRExamples:examples,allTopicViewsRender:true,readerLinks:true}));



vm.runInContext('data={...fixture,learning:{chapters:[fixture.learning.chapters[0]]},unlocked:["01"]};chapterProgress={};',context);
let dashboard=vm.runInContext('studentHome()',context);assert.ok(dashboard.includes('Video lecture coming soon'));assert.ok(dashboard.includes('Read chapter'));assert.ok(!dashboard.includes('Pause and think'));assert.ok(!dashboard.includes('Objects, data structures, and functions'));
assert.ok(vm.runInContext('studentRead("01")',context).includes('Complete chapter reading'));
assert.equal(vm.runInContext('assessmentReady("01")',context),false);
vm.runInContext('chapterProgress["r-agriculture_01"]={readComplete:true};',context);
assert.equal(vm.runInContext('assessmentReady("01")',context),true);
vm.runInContext('data.videos={"01":{provider:"file",url:"https://example.com/lecture.mp4"}};',context);
assert.equal(vm.runInContext('assessmentReady("01")',context),false);
vm.runInContext('chapterProgress["r-agriculture_01"].videoComplete=true;',context);
assert.equal(vm.runInContext('assessmentReady("01")',context),true);
assert.ok(vm.runInContext('studentWatch("01")',context).includes('<video'));
console.log('Video, full chapter reading and assessment flow verified. R practice is optional.');
