const {event,history}=require('./activity-log');
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
  if(req.method==='POST'&&route==='email-action'){await quota('email-action',40);return res.json(await require('./email-actions')(req.body,identity));}
  if(req.method==='POST'&&['login','register'].includes(route)){
   await quota('login',20);const {email,password,name}=req.body||{};
   if(typeof email!=='string'||typeof password!=='string'||email.length>254||password.length>128)throw fail(400,'Enter your email and password.');
   if(route==='register')await handlers.registerStudent.run({data:{email,password,name},rawRequest:req});
   const signed=await identity('signInWithPassword',{email,password,returnSecureToken:true});
   const decoded=await auth().verifyIdToken(signed.idToken);let verificationSent=false,verificationError=false;
   if(!decoded.email_verified&&(route==='register'||req.body.resendVerification===true)&&!email.endsWith('@example.invalid')){try{await identity('sendOobCode',{requestType:'VERIFY_EMAIL',idToken:signed.idToken,continueUrl:'https://kau-agstat-teaching.web.app/'});verificationSent=true;}catch{verificationError=true;}}
   const session=await auth().createSessionCookie(signed.idToken,{expiresIn:cookieOptions.maxAge});
   if(!isInstructor(decoded,instructorEmail.value()))await event(db,decoded.uid,'signed_in');res.cookie('__session',session,cookieOptions);return res.json({ok:true,verified:decoded.email_verified===true,verificationSent,verificationError});
  }
  if(req.method==='POST'&&route==='reset'){
   await quota('reset',5);if(typeof req.body?.email!=='string'||req.body.email.length>254)throw fail(400,'Enter your email.');
   await identity('sendOobCode',{requestType:'PASSWORD_RESET',email:req.body.email}).catch(()=>{});return res.json({message:'If the account exists, check its inbox for a reset link.'});
  }
  if(req.method==='POST'&&route==='logout'){const value=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('__session='))?.slice(10);let signed;try{signed=await auth().verifySessionCookie(value||'',true);}catch{}if(signed&&!isInstructor(signed,instructorEmail.value()))await event(db,signed.uid,'signed_out');res.cookie('__session','',{...cookieOptions,maxAge:0});return res.json({ok:true});}
  const cookie=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('__session='))?.slice(10);
  let token;try{token=await auth().verifySessionCookie(cookie||'',true);}catch{throw fail(401,'Sign in to enter your classroom.');}
  // Read current account state so verification, suspension and revocation take effect immediately.
  const current=await auth().getUser(token.uid);token={...token,email:current.email,email_verified:current.emailVerified,name:current.displayName};
  const profile=(await db.doc(`students/${token.uid}`).get()).data()||{};
  const admin=isInstructor(token,instructorEmail.value());
  const profileComplete=require('./student-profile').completeProfile(profile);
  if(req.method==='GET'&&route==='session')return res.json({user:{uid:token.uid,name:profile.name||current.displayName||'Student',email:current.email,verified:current.emailVerified,admin,role:admin?'teacher':'student',profileComplete:admin||profileComplete,details:admin?null:{name:profile.name||'',rollNo:profile.rollNo||'',degree:profile.degree||'',whatsapp:profile.whatsapp||''},status:admin?'approved':profile.status||'pending'},needsProfile:!admin&&!profileComplete,access:hasAccess(token,profile,instructorEmail.value())});
  if(req.method==='POST'&&route==='student-profile'){
   if(admin)throw fail(400,'Teacher accounts do not need a student profile.');let details;try{details=require('./student-profile').studentDetails(req.body);}catch(e){throw fail(400,e.message);}const ref=db.doc(`students/${token.uid}`);await db.runTransaction(async tx=>{const existing=(await tx.get(ref)).data();if(require('./student-profile').completeProfile(existing))throw fail(409,'Your profile has already been submitted. Contact your teacher for corrections.');event(db,token.uid,'profile_submitted',{},tx);tx.set(ref,{...details,email:current.email,role:'student',profileComplete:true,status:'pending',profileSubmittedAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()},{merge:true});});await auth().updateUser(token.uid,{displayName:details.name}).catch(()=>{});return res.json({saved:true,status:'pending'});
  }
  if(!hasAccess(token,profile,instructorEmail.value()))throw fail(403,!profileComplete?'Complete your student details before entering the course.':current.emailVerified?'Your account is awaiting department approval.':'Verify your email before entering your classroom.');
  const r={auth:{uid:token.uid,token},data:req.body||{},rawRequest:req};
  const ratingsSnap=await db.collection(`students/${token.uid}/practice`).get();const ratings=Object.fromEntries(ratingsSnap.docs.map(d=>[d.id,d.data()]));const byChapter=Object.fromEntries(ratingsSnap.docs.map(d=>[d.data().chapterId,d.data()]));const unlocked=admin?course.chapters.map(c=>c.id):require('./progression').unlockedIds(course.chapters,byChapter);
  function checkChapter(id){if(!unlocked.includes(id))throw fail(403,'Pass the current chapter assessment to unlock this chapter.');}
  if(!admin&&req.method==='POST'&&['progress','teach','gradeChapter'].includes(route))checkChapter(req.body?.chapterId);
  if(req.method==='POST'&&route==='attendance'){
   if(admin)return res.json({recorded:false});const {chapterId,section}=req.body||{};checkChapter(chapterId);if(!['video','reading','practice','assessment','final-exam'].includes(section))throw fail(400,'Invalid course activity.');const now=Date.now(),day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now)),ref=db.doc(`students/${token.uid}`),daily=db.doc(`students/${token.uid}/attendance/${day}`);const recorded=await db.runTransaction(async tx=>{const [person,date]=await Promise.all([tx.get(ref),tx.get(daily)]),last=person.data()?.lastAttendanceAt?.toMillis?.()||0;if(last&&now-last<30000)return false;const seconds=require('./student-profile').attendanceSeconds(last,now);tx.set(ref,{lastAttendanceAt:FieldValue.serverTimestamp(),lastActiveAt:FieldValue.serverTimestamp(),currentChapter:chapterId,currentSection:section,totalActiveSeconds:FieldValue.increment(seconds),attendanceDays:FieldValue.increment(date.exists?0:1)},{merge:true});event(db,token.uid,'attendance',{chapterId,section,activeSeconds:seconds},tx);tx.set(daily,{day,lastSeenAt:FieldValue.serverTimestamp(),firstSeenAt:date.data()?.firstSeenAt||FieldValue.serverTimestamp(),activeSeconds:FieldValue.increment(seconds),visits:FieldValue.increment(1)},{merge:true});return true;});return res.json({recorded});
  }
  if(req.method==='POST'&&route==='activity'){
   if(admin)return res.json({recorded:false});const {type,chapterId,section,outcome}=req.body||{};checkChapter(chapterId);
   if(!['chapter_opened','r_run','practice_check','video_play','video_pause','video_ended'].includes(type)||!['video','reading','practice','assessment','final-exam'].includes(section)||outcome!==undefined&&!['success','error','passed','retry'].includes(outcome))throw fail(400,'Invalid activity event.');
   await quota('activity',300);await event(db,token.uid,type,{chapterId,section,source:'client-reported',...(outcome?{outcome}:{})});return res.json({recorded:true});
  }
  if(req.method==='GET'&&['activity-history','activity.csv'].includes(route)){
   if(!admin)throw fail(403,'Teacher access required.');let result;try{result=await history(db,req.query,route==='activity.csv');}catch(e){if(/Choose|date|cursor|5,000/.test(e.message))throw fail(400,e.message);throw e;}
   if(route==='activity-history')return res.json(result);
   const rows=[['Student UID','Date and time (IST)','Timestamp (UTC)','Activity','Chapter','Section','Outcome','Score','Total','Active seconds','Source','Actor']];
   for(const e of result.events)rows.push([req.query.uid,e.occurredAt?new Date(e.occurredAt).toLocaleString('en-IN',{timeZone:'Asia/Kolkata',hour12:false}):'',e.occurredAt?new Date(e.occurredAt).toISOString():'',e.type,e.chapterId||'',e.section||'',e.outcome||'',e.score??'',e.total??'',e.activeSeconds??'',e.source,e.actor||'']);
   res.set('Content-Type','text/csv; charset=utf-8');res.set('Content-Disposition','attachment; filename="stat-maash-activity.csv"');return res.send('\ufeff'+rows.map(row=>row.map(require('./progression').csvCell).join(',')).join('\r\n'));
  }
  if(req.method==='POST'&&route==='lecture-video'){
   if(!admin)throw fail(403,'Teacher access required.');const {chapterId,url}=req.body||{};if(!course.chapters.some(c=>c.id===chapterId))throw fail(400,'Choose a chapter.');let video;try{video=require('./lecture-video').lectureVideo(url);}catch(e){throw fail(400,e.message);}await db.doc(`courseSettings/${course.id}/chapters/${chapterId}`).set({video,updatedAt:FieldValue.serverTimestamp(),updatedBy:token.uid},{merge:true});return res.json({saved:true,video});
  }
  if(req.method==='POST'&&route==='lesson-completion'){
   const {chapterId,kind}=req.body||{};checkChapter(chapterId);if(!['video','reading'].includes(kind))throw fail(400,'Choose video or reading.');await db.doc(`students/${token.uid}/progress/${course.id}_${chapterId}`).set({courseId:course.id,chapterId,[kind==='reading'?'readComplete':'videoComplete']:true,updatedAt:FieldValue.serverTimestamp()},{merge:true});if(!admin)await event(db,token.uid,kind+'_completed',{chapterId});return res.json({saved:true});
  }
  if(req.method==='GET'&&['student-report','scores.csv'].includes(route)){
   if(!admin)throw fail(403,'Teacher access required.');const people=await db.collection('students').limit(250).get();const students=await Promise.all(people.docs.filter(d=>!isInstructor({email:d.data().email,email_verified:true},instructorEmail.value())).map(async d=>{const [progress,practice]=await Promise.all([db.collection(`students/${d.id}/progress`).get(),db.collection(`students/${d.id}/practice`).get()]);return{uid:d.id,name:d.data().name||'Student',email:d.data().email||'',rollNo:d.data().rollNo||'',degree:d.data().degree||'',whatsapp:d.data().whatsapp||'',profileComplete:require('./student-profile').completeProfile(d.data()),currentChapter:d.data().currentChapter||'',currentSection:d.data().currentSection||'',activeNow:Date.now()-(d.data().lastAttendanceAt?.toMillis?.()||0)<120000,activeMinutes:Math.floor((d.data().totalActiveSeconds||0)/60),attendanceDays:d.data().attendanceDays||0,status:d.data().status||'pending',lastActiveAt:d.data().lastActiveAt?.toMillis?.()||null,progress:Object.fromEntries(progress.docs.map(x=>[x.data().chapterId,x.data()])),scores:Object.fromEntries(practice.docs.map(x=>[x.data().chapterId,x.data()]))};}));
   const finals=await db.collection('attempts').where('type','==','final').limit(250).get();const exams=finals.docs.map(d=>({id:d.id,...d.data()}));
   if(route==='student-report')return res.json({students,chapters:course.chapters.map(c=>({id:c.id,title:c.title,activities:learning.chapters.find(l=>l.id===c.id).steps.length})),exams:exams.map(x=>({uid:x.uid,score:x.score??null,total:x.total,status:x.status}))});
   const rows=[['Name','Email','Roll number','Degree','WhatsApp','Last active','Current chapter','Current section','Recorded active minutes','Days attended','Access status','Chapter','Chapter title','Video marked complete','Reading marked complete','Activities explored','Total activities','R runs','Latest score','Total marks','Passed','Final score','Final total','Final status']];for(const person of students)for(const c of course.chapters){const p=person.progress[c.id]||{},score=person.scores[c.id]||{},exam=exams.find(e=>e.uid===person.uid)||{};rows.push([person.name,person.email,person.rollNo,person.degree,person.whatsapp,person.lastActiveAt?new Date(person.lastActiveAt).toISOString():'',person.currentChapter,person.currentSection,person.activeMinutes,person.attendanceDays,person.status,c.id,c.title,p.videoComplete?'Yes':'No',p.readComplete?'Yes':'No',p.stepIds?.length||0,learning.chapters.find(l=>l.id===c.id).steps.length,p.codeRuns||0,score.score??'',score.total??'',require('./progression').cleared(score)?'Yes':'No',exam.score??'',exam.total??'',exam.status||'Not started']);}res.set('Content-Type','text/csv; charset=utf-8');res.set('Content-Disposition','attachment; filename="stat-maash-student-scores.csv"');return res.send('\ufeff'+rows.map(row=>row.map(require('./progression').csvCell).join(',')).join('\r\n'));
  }

  if(req.method==='GET'&&req.path.startsWith('/learning-assets/')){
   if(!admin){const name=decodeURIComponent(req.path);const match=name.match(/\/(\d{2})-[^/]+\.html$/)||name.match(/chapter-(\d{2})/);if(match)checkChapter(match[1]);if(/search\.json$/.test(name))throw fail(403,'Use the chapter reader.');}
   const target=safeAsset(path.join(__dirname,'assets'),decodeURIComponent(req.path.slice('/learning-assets/'.length)));
   if(!target||!fs.existsSync(target)||!fs.statSync(target).isFile())throw fail(404,'File not found.');
   if(!admin){const match=req.path.match(/\/(\d{2})-[^/]+\.html$/)||req.path.match(/chapter-(\d{2})\.pptx$/);if(match)await event(db,token.uid,req.path.endsWith('.pptx')?'slides_downloaded':'book_opened',{chapterId:match[1]});}
   return res.sendFile(target,{cacheControl:false});
  }
  if(req.method==='GET'&&route==='classroom'){
   const extra=await db.collection('books').limit(30).get();const p=await db.collection(`students/${token.uid}/progress`).get();
   const settings=await db.collection(`courseSettings/${course.id}/chapters`).get();const videos=Object.fromEntries(settings.docs.filter(d=>unlocked.includes(d.id)).map(d=>[d.id,d.data().video||null]));return res.json({videos,course:admin?course:{...course,chapters:course.chapters.map(c=>unlocked.includes(c.id)?c:{id:c.id,title:c.title,module:c.module})},learning:{...learning,chapters:learning.chapters.filter(c=>unlocked.includes(c.id))},practice:Object.fromEntries(Object.entries(bank.chapters).filter(([id])=>unlocked.includes(id))),ratings,unlocked,books:extra.docs.map(d=>({...d.data(),id:d.id})),progress:Object.fromEntries(p.docs.map(d=>[d.id,d.data()]))});
  }
  if(req.method==='GET'&&route==='students'){
   if(!admin)throw fail(403,'Administrator access required.');const people=await db.collection('students').limit(250).get();
   return res.json({students:people.docs.map(d=>({uid:d.id,...d.data(),isTeacher:isInstructor({email:d.data().email,email_verified:true},instructorEmail.value()),profileComplete:require('./student-profile').completeProfile(d.data()),status:d.data().status||'pending'}))});
  }
  if(req.method==='POST'&&route==='approval'){
   if(!admin)throw fail(403,'Administrator access required.');const {uid,status}=req.body;
   if(!/^[a-zA-Z0-9_-]{1,128}$/.test(uid||'')||!['approved','pending','suspended'].includes(status))throw fail(400,'Invalid approval request.');
   if(uid===token.uid)throw fail(400,'You cannot change your own approval.');
   const target=await auth().getUser(uid),targetProfile=(await db.doc(`students/${uid}`).get()).data()||{};if(status==='approved'&&!require('./student-profile').completeProfile(targetProfile))throw fail(400,'The student must submit all profile details before approval.');if(status==='approved'&&!target.emailVerified)throw fail(400,'The student must verify their email first.');
   await db.doc(`students/${uid}`).set({status,email:target.email,name:targetProfile.name||target.displayName||'Student',reviewedBy:token.uid,reviewedAt:FieldValue.serverTimestamp()},{merge:true});
   await event(db,uid,'access_'+status,{actor:token.uid});await db.collection('approvalAudit').add({uid,status,actor:token.uid,createdAt:FieldValue.serverTimestamp()});return res.json({ok:true});
  }
  if(req.method==='POST'&&route==='progress'){
   const {chapterId,stepIds=[],draft='',codeRuns=0,messages=[]}=req.body;const chapter=learning.chapters.find(c=>c.id===chapterId);if(!chapter||!Array.isArray(stepIds)||stepIds.length>chapter.steps.length||typeof draft!=='string'||draft.length>50000)throw fail(400,'Invalid learning record.');
   if(!Array.isArray(messages)||messages.length>16||messages.some(m=>!['student','teacher'].includes(m.role)||typeof m.text!=='string'||m.text.length>20000))throw fail(400,'Invalid conversation record.');const known=new Set(chapter.steps.map(s=>s.id));const passed=[...new Set(stepIds)].filter(s=>known.has(s));
   await db.doc(`students/${token.uid}/progress/${course.id}_${chapterId}`).set({courseId:course.id,chapterId,stepIds:passed,draft,messages,codeRuns:Math.max(0,Math.min(Number(codeRuns)||0,10000)),completed:passed.length===chapter.steps.length,updatedAt:FieldValue.serverTimestamp()},{merge:true});await db.doc(`students/${token.uid}`).set({lastActiveAt:FieldValue.serverTimestamp()},{merge:true});if(!admin)await event(db,token.uid,'progress_saved',{chapterId,activities:passed.length});return res.json({saved:true});
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
