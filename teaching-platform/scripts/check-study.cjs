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
assert.ok(html.includes('Investigation for this chapter'));
for(const step of groups[i].items.filter(s=>s.kind==='code')){examples++;assert.ok(html.includes('data-copy-example="'+step.index+'"'));}
}
assert.ok(vm.runInContext(`bookView('${c.id}')`,context).includes(c.bookUrl));
}
assert.equal(examples,218);assert.equal(course.chapters.length,14);
assert.ok(vm.runInContext('chaptersView()',context).includes('chapter-search'));
console.log(JSON.stringify({chapters:14,topics,originalRExamples:examples,allTopicViewsRender:true,readerLinks:true}));


