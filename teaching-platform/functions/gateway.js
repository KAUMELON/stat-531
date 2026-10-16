const {getAuth}=require('firebase-admin/auth');
const {FieldValue}=require('firebase-admin/firestore');
const {hasAccess,isInstructor,safeAsset,validOrigin}=require('./access');
const {createHash}=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const learning=require('./content/learning.json');
const webConfig=require('./content/web-config.json');
const project='kau-agstat-teaching';
const auth=getAuth;
const cookieOptions={httpOnly:true,secure:true,sameSite:'strict',path:'/',maxAge:5*24*60*60*1000};
const fail=(code,message)=>Object.assign(new Error(message),{httpStatus:code});
module.exports=({db,handlers,instructorEmail,course,bank})=>async(req,res)=>{
 res.set('Cache-Control','private, no-store');res.set('X-Content-Type-Options','nosniff');
 try{
  const route=req.path.replace(/^\/api\//,'').split('?')[0];
  if(req.method!=='GET'&&(req.method!=='POST'||req.get('X-Agstat-Request')!=='classroom'||!validOrigin(req.get('origin'),project)))throw fail(403,'This request must come from the classroom.');
  async function quota(kind,limit){const bucket=Math.floor(Date.now()/(15*60*1000));const hash=createHash('sha256').update(`${req.ip}:${bucket}`).digest('hex');const ref=db.doc(`gatewayLimits/${kind}_${hash}`);await db.runTransaction(async tx=>{const d=await tx.get(ref);if((d.data()?.count||0)>=limit)throw fail(429,'Too many attempts. Please try again later.');tx.set(ref,{count:(d.data()?.count||0)+1,expiresAt:new Date(Date.now()+86400000)});});}
  async function identity(method,body){const r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:${method}?key=${webConfig.apiKey}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});const data=await r.json();if(!r.ok)throw fail(401,'Unable to sign in. Check your email and password.');return data;}
  if(req.method==='POST'&&['login','register'].includes(route)){
   await quota('login',20);const {email,password,name}=req.body||{};
   if(typeof email!=='string'||typeof password!=='string'||email.length>254||password.length>128)throw fail(400,'Enter your email and password.');
   if(route==='register')await handlers.registerStudent.run({data:{email,password,name},rawRequest:req});
   const signed=await identity('signInWithPassword',{email,password,returnSecureToken:true});
   if(!signed.emailVerified&&!email.endsWith('@example.invalid')){const decoded=await auth().verifyIdToken(signed.idToken);if(!decoded.email_verified)await identity('sendOobCode',{requestType:'VERIFY_EMAIL',idToken:signed.idToken}).catch(()=>{});}
   const session=await auth().createSessionCookie(signed.idToken,{expiresIn:cookieOptions.maxAge});
   res.cookie('__session',session,cookieOptions);return res.json({ok:true});
  }
  if(req.method==='POST'&&route==='reset'){
   await quota('reset',5);if(typeof req.body?.email!=='string'||req.body.email.length>254)throw fail(400,'Enter your email.');
   await identity('sendOobCode',{requestType:'PASSWORD_RESET',email:req.body.email}).catch(()=>{});return res.json({message:'If the account exists, check its inbox for a reset link.'});
  }
  if(req.method==='POST'&&route==='logout'){res.cookie('__session','',{...cookieOptions,maxAge:0});return res.json({ok:true});}
  const cookie=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('__session='))?.slice(10);
  let token;try{token=await auth().verifySessionCookie(cookie||'',true);}catch{throw fail(401,'Sign in to enter your classroom.');}
  // Read current account state so verification, suspension and revocation take effect immediately.
  const current=await auth().getUser(token.uid);token={...token,email:current.email,email_verified:current.emailVerified,name:current.displayName};
  const profile=(await db.doc(`students/${token.uid}`).get()).data()||{};
  const admin=isInstructor(token,instructorEmail.value());
  if(req.method==='GET'&&route==='session')return res.json({user:{uid:token.uid,name:current.displayName||profile.name||'Learner',email:current.email,verified:current.emailVerified,admin,status:admin?'approved':profile.status||'pending'},access:hasAccess(token,profile,instructorEmail.value())});
  if(!hasAccess(token,profile,instructorEmail.value()))throw fail(403,current.emailVerified?'Your account is awaiting department approval.':'Verify your email before entering your classroom.');
  const r={auth:{uid:token.uid,token},data:req.body||{},rawRequest:req};
  if(req.method==='GET'&&req.path.startsWith('/learning-assets/')){
   const target=safeAsset(path.join(__dirname,'assets'),decodeURIComponent(req.path.slice('/learning-assets/'.length)));
   if(!target||!fs.existsSync(target)||!fs.statSync(target).isFile())throw fail(404,'File not found.');
   return res.sendFile(target,{cacheControl:false});
  }
  if(req.method==='GET'&&route==='classroom'){
   const extra=await db.collection('books').limit(30).get();const p=await db.collection(`students/${token.uid}/progress`).get();
   const ratings=await db.collection(`students/${token.uid}/practice`).get();return res.json({course,learning,practice:bank.chapters,ratings:Object.fromEntries(ratings.docs.map(d=>[d.id,d.data()])),books:extra.docs.map(d=>({...d.data(),id:d.id})),progress:Object.fromEntries(p.docs.map(d=>[d.id,d.data()]))});
  }
  if(req.method==='GET'&&route==='students'){
   if(!admin)throw fail(403,'Administrator access required.');const people=await db.collection('students').limit(250).get();
   return res.json({students:people.docs.map(d=>({uid:d.id,...d.data(),status:d.data().status||'pending'}))});
  }
  if(req.method==='POST'&&route==='approval'){
   if(!admin)throw fail(403,'Administrator access required.');const {uid,status}=req.body;
   if(!/^[a-zA-Z0-9_-]{1,128}$/.test(uid||'')||!['approved','pending','suspended'].includes(status))throw fail(400,'Invalid approval request.');
   if(uid===token.uid)throw fail(400,'You cannot change your own approval.');
   const target=await auth().getUser(uid);if(status==='approved'&&!target.emailVerified)throw fail(400,'The student must verify their email first.');
   await db.doc(`students/${uid}`).set({status,email:target.email,name:target.displayName||'Learner',reviewedBy:token.uid,reviewedAt:FieldValue.serverTimestamp()},{merge:true});
   await db.collection('approvalAudit').add({uid,status,actor:token.uid,createdAt:FieldValue.serverTimestamp()});return res.json({ok:true});
  }
  if(req.method==='POST'&&route==='progress'){
   const {chapterId,stepIds=[],draft='',codeRuns=0,messages=[]}=req.body;const chapter=learning.chapters.find(c=>c.id===chapterId);if(!chapter||!Array.isArray(stepIds)||stepIds.length>chapter.steps.length||typeof draft!=='string'||draft.length>50000)throw fail(400,'Invalid learning record.');
   if(!Array.isArray(messages)||messages.length>16||messages.some(m=>!['student','teacher'].includes(m.role)||typeof m.text!=='string'||m.text.length>20000))throw fail(400,'Invalid conversation record.');const known=new Set(chapter.steps.map(s=>s.id));const passed=[...new Set(stepIds)].filter(s=>known.has(s));
   await db.doc(`students/${token.uid}/progress/${course.id}_${chapterId}`).set({courseId:course.id,chapterId,stepIds:passed,draft,messages,codeRuns:Math.max(0,Math.min(Number(codeRuns)||0,10000)),completed:passed.length===chapter.steps.length,updatedAt:FieldValue.serverTimestamp()},{merge:true});await db.doc(`students/${token.uid}`).set({lastActiveAt:FieldValue.serverTimestamp()},{merge:true});return res.json({saved:true});
  }
  if(req.method==='POST'&&route==='import'){
   if(!admin)throw fail(403,'Administrator access required.');const b=req.body.book;
   if(!b||!/^[a-z0-9-]{1,80}$/.test(b.id||'')||typeof b.title!=='string'||!Array.isArray(b.chapters)||JSON.stringify(b).length>800000)throw fail(400,'Use a valid course manifest under 800 KB.');
   if(b.id===course.id)throw fail(400,'The original book is managed in Quarto.');await db.doc(`books/${b.id}`).set({...b,updatedAt:FieldValue.serverTimestamp()});return res.json({ok:true});
  }
  const allowed=['teach','gradeChapter','startExam','saveExam','submitExam','myAttempts','reviewAttempts','releaseResult'];
  if(req.method==='POST'&&allowed.includes(route))return res.json(await handlers[route].run(r));
  throw fail(404,'Route not found.');
 }catch(e){const mapping={'unauthenticated':401,'permission-denied':403,'failed-precondition':409,'invalid-argument':400,'resource-exhausted':429};res.status(e.httpStatus||mapping[e.code]||500).json({error:e.httpStatus||mapping[e.code]?e.message:'The classroom service could not complete this request. Please retry.'});}
};
