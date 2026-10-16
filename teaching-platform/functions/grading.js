const {randomInt}=require('node:crypto');
function shuffle(items){const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=randomInt(i+1);[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;}
function publicQuestions(questions){return questions.map(({id,prompt,options})=>({id,prompt,options}));}
function grade(questions,answers){return questions.reduce((score,q)=>score+(Number.isInteger(answers[q.id])&&answers[q.id]===q.answer?1:0),0);}
function validAnswers(questions,answers){if(!answers||typeof answers!=='object'||Array.isArray(answers))return false;const allowed=new Map(questions.map(q=>[q.id,q]));return Object.entries(answers).every(([id,a])=>allowed.has(id)&&Number.isInteger(a)&&a>=0&&a<allowed.get(id).options.length);}
module.exports={shuffle,publicQuestions,grade,validAnswers};
