// Creates isolated QA users, tests the deployed service, then removes QA records.
// Credentials remain in process memory and are never written to logs or files.
const fs=require('node:fs');const crypto=require('node:crypto');const assert=require('node:assert/strict');
const cliAuth=require('C:/Users/user/AppData/Roaming/npm/node_modules/firebase-tools/lib/auth.js');
const functionsRequire=require('node:module').createRequire(require('node:path').resolve(__dirname,'../functions/index.js'));
const {initializeApp}=functionsRequire('firebase-admin/app');
const {getAuth}=functionsRequire('firebase-admin/auth');
const {getFirestore,FieldValue}=functionsRequire('firebase-admin/firestore');
const bank=require('../functions/content/questions.json');const course=require('../functions/content/course.json');
const project='kau-agstat-teaching';const region='asia-south1';
async function credential(){const account=cliAuth.getGlobalDefaultAccount();const t=await cliAuth.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform','https://www.googleapis.com/auth/firebase']);return{access_token:t.access_token,expires_in:3000};}
initializeApp({projectId:project,credential:{getAccessToken:credential}});const admin=getAuth();
let accessToken;
const firestoreUrl=`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`;
function value(v){if(v instanceof Date)return{timestampValue:v.toISOString()};if(v?.toDate)return{timestampValue:v.toDate().toISOString()};if(typeof v==='string')return{stringValue:v};if(typeof v==='boolean')return{booleanValue:v};if(typeof v==='number')return{integerValue:String(v)};return{mapValue:{fields:Object.fromEntries(Object.entries(v).map(([k,x])=>[k,value(x)]))}};}
async function cloud(url,method='GET',body){const r=await fetch(url,{method,headers:{Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const b=await r.json().catch(()=>({}));if(!r.ok&&r.status!==404)throw new Error(`Firestore ${r.status}: ${b.error?.message||'request failed'}`);return b;}
const db={doc(path){return{async set(data){await cloud(`${firestoreUrl}/${path}`,'PATCH',{fields:Object.fromEntries(Object.entries(data).map(([k,v])=>[k,value(v)]))});},async update(data){await cloud(`${firestoreUrl}/${path}?${Object.keys(data).map(k=>'updateMask.fieldPaths='+encodeURIComponent(k)).join('&')}`,'PATCH',{fields:Object.fromEntries(Object.entries(data).map(([k,v])=>[k,value(v)]))});},async delete(){await cloud(`${firestoreUrl}/${path}`,'DELETE');},path};},collection(name){return{where(field,op,match){return{async get(){const rows=await cloud(`${firestoreUrl}:runQuery`,'POST',{structuredQuery:{from:[{collectionId:name}],where:{fieldFilter:{field:{fieldPath:field},op:'EQUAL',value:value(match)}}}});return{docs:rows.filter(r=>r.document).map(r=>({ref:{delete:()=>cloud('https://firestore.googleapis.com/v1/'+r.document.name,'DELETE')}}))};}};}};},async recursiveDelete(ref){for(const collection of ['progress','practice','attendance','activity']){const list=await cloud(`${firestoreUrl}/${ref.path}/${collection}`);for(const d of list.documents||[])await cloud('https://firestore.googleapis.com/v1/'+d.name,'DELETE');}await ref.delete();}};
const publicConfig=JSON.parse(fs.readFileSync('public/firebase-config.js','utf8').replace(/^\uFEFF/,'').replace('export const firebaseConfig = ','').replace(/;\s*$/,''));
const users=[];const report=[];
async function signIn(email,password){const r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${publicConfig.apiKey}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})});const b=await r.json();if(!r.ok)throw new Error(b.error?.message||'Sign-in failed');return b.idToken;}
async function callable(name,data,token){const r=await fetch(`https://${region}-${project}.cloudfunctions.net/${name}`,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({data})});const b=await r.json();return{status:r.status,...b};}
async function record(name,fn){await fn();report.push({test:name,passed:true});console.log('PASS',name);}
async function main(){
 const access=await credential();accessToken=access.access_token;
 try{
  const existing=await admin.listUsers(1000);for(const u of existing.users.filter(u=>/^agstat-qa-\d+-[01]@example.invalid$/.test(u.email||''))){await db.recursiveDelete(db.doc(`students/${u.uid}`));await admin.deleteUser(u.uid);}
  await record('Registration rejects an invalid short password',async()=>assert.equal((await callable('registerStudent',{email:'invalid-qa@example.invalid',password:'123',name:'QA'},null)).error?.status,'INVALID_ARGUMENT'));
  for(let i=0;i<2;i++){const password=crypto.randomBytes(24).toString('base64url');const email=`agstat-qa-${Date.now()}-${i}@example.invalid`;const registration=await callable('registerStudent',{email,password,name:`QA Learner ${i+1}`},null);assert.ok(registration.result?.created,JSON.stringify(registration));const u=await admin.getUserByEmail(email);users.push({uid:u.uid});const unverified=await signIn(email,password);await record(`Unverified learner ${i+1} cannot use assessed teaching`,async()=>assert.equal((await callable('teach',{courseId:course.id,chapterId:'01',question:'What is R?'},unverified)).error?.status,'FAILED_PRECONDITION'));await admin.updateUser(u.uid,{emailVerified:true});await db.doc(`students/${u.uid}`).update({status:'approved',profileComplete:true,name:'Synthetic Learner',rollNo:'QA-001',degree:'BSc Hons Agriculture',whatsapp:'+12025550123'});users[i].token=await signIn(email,password);}
  const [a,b]=users;
  await record('Real Firebase email sign-in',async()=>assert.ok(a.token&&b.token));
  await record('Unauthenticated tutor access denied',async()=>assert.equal((await callable('teach',{courseId:course.id,chapterId:'01',question:'What is R?'},null)).error?.status,'UNAUTHENTICATED'));
  await record('Student cannot read another learner profile',async()=>{const r=await fetch(`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/students/${b.uid}`,{headers:{Authorization:`Bearer ${a.token}`}});assert.equal(r.status,403);});
  await record('Student cannot write exam grades',async()=>{const r=await fetch(`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/attempts/qa-forged-${a.uid}`,{method:'PATCH',headers:{Authorization:`Bearer ${a.token}`,'Content-Type':'application/json'},body:JSON.stringify({fields:{uid:{stringValue:a.uid},score:{integerValue:'14'}}})});assert.equal(r.status,403);});
  await record('Student cannot use instructor review',async()=>assert.equal((await callable('reviewAttempts',{},a.token)).error?.status,'PERMISSION_DENIED'));
  await record('STAT MAASH gives a grounded live AI response',async()=>{const r=await callable('teach',{courseId:course.id,chapterId:'01',question:'Explain how R differs from RStudio. Use a simple agricultural example.'},a.token);assert.ok(r.result?.answer?.length>100,JSON.stringify(r));assert.match(r.result.answer,/RStudio/i);console.log('Teaching response:',r.result.answer.slice(0,700));});
  await record('Chapter assessment requires prior learning and practice',async()=>{const answers=Object.fromEntries(bank.chapters['01'].map(q=>[q.id,q.answer]));const r=await callable('gradeChapter',{courseId:course.id,chapterId:'01',answers},a.token);assert.equal(r.error?.status,'FAILED_PRECONDITION',JSON.stringify(r));});
  await record('Exam requires completion of chapter path',async()=>assert.equal((await callable('startExam',{courseId:course.id},a.token)).error?.status,'FAILED_PRECONDITION'));
  for(const c of course.chapters)await db.doc(`students/${a.uid}/practice/${course.id}_${c.id}`).set({courseId:course.id,chapterId:c.id,passed:true,score:2,total:2,updatedAt:new Date()});
  let exam;
  await record('Exam starts with private answer keys omitted',async()=>{const r=await callable('startExam',{courseId:course.id},a.token);exam=r.result;assert.equal(exam?.questions?.length,14,JSON.stringify(r));assert.ok(exam.questions.every(q=>!('answer'in q)&&!('explanation'in q)));});
  await record('Other students cannot save this exam',async()=>assert.equal((await callable('saveExam',{attemptId:exam.id,answers:{}},b.token)).error?.status,'PERMISSION_DENIED'));
  await record('AI tutoring stops during an active exam',async()=>assert.equal((await callable('teach',{courseId:course.id,chapterId:'01',question:'Help me with R'},a.token)).error?.status,'FAILED_PRECONDITION'));
  const answers=Object.fromEntries(bank.final.map(q=>[q.id,q.answer]));
  await record('Answers save and resume without creating another attempt',async()=>{assert.ok((await callable('saveExam',{attemptId:exam.id,answers},a.token)).result?.saved);const r=await callable('startExam',{courseId:course.id},a.token);assert.equal(r.result?.id,exam.id);assert.equal(Object.keys(r.result.answers).length,14);});
  await record('Final marking is correct, provisional, and idempotent',async()=>{const r=await callable('submitExam',{attemptId:exam.id,answers},a.token);assert.equal(r.result?.score,14,JSON.stringify(r));assert.equal(r.result.status,'provisional');const second=await callable('submitExam',{attemptId:exam.id,answers:{}},a.token);assert.equal(second.result?.score,14);});
  await record('Students cannot release their own grades',async()=>assert.equal((await callable('releaseResult',{attemptId:exam.id},a.token)).error?.status,'PERMISSION_DENIED'));
  await record('A second final attempt is rejected',async()=>assert.equal((await callable('startExam',{courseId:course.id},a.token)).error?.status,'FAILED_PRECONDITION'));
  // Test expiry without waiting 25 minutes, using a second isolated learner.
  for(const c of course.chapters)await db.doc(`students/${b.uid}/practice/${course.id}_${c.id}`).set({courseId:course.id,chapterId:c.id,passed:true,score:2,total:2,updatedAt:new Date()});
  const second=(await callable('startExam',{courseId:course.id},b.token)).result;
  // A fixed historical deadline avoids assuming the desktop and server clocks match.
  await db.doc(`attempts/${second.id}`).update({answers:{[bank.final[0].id]:bank.final[0].answer},deadline:functionsRequire('firebase-admin/firestore').Timestamp.fromMillis(0)});
  await record('Late submissions use saved answers, ignoring new late answers',async()=>{const r=await callable('submitExam',{attemptId:second.id,answers},b.token);assert.equal(r.result?.score,1,JSON.stringify(r));});
 }finally{
  for(const u of users){await db.recursiveDelete(db.doc(`students/${u.uid}`));const attempts=await db.collection('attempts').where('uid','==',u.uid).get();for(const d of attempts.docs)await d.ref.delete();await db.doc(`examLocks/${u.uid}_${course.id}`).delete();await db.doc(`tutorLimits/${u.uid}_${new Date().toISOString().slice(0,10)}`).delete();await admin.deleteUser(u.uid);}
  fs.writeFileSync('qa/live-integration.json',JSON.stringify({createdAt:new Date().toISOString(),tests:report,qaUsersRemoved:true},null,2));
 }
}
main().catch(e=>{console.error('Integration check failed:',e.message);process.exitCode=1;});
