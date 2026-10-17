// Disposable QA account only. One-time codes, links and passwords never leave memory.
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs');
const cli=require('C:/Users/user/AppData/Roaming/npm/node_modules/firebase-tools/lib/auth.js');
const dep=require('node:module').createRequire(require('node:path').resolve(__dirname,'../functions/index.js'));
const base='https://kau-agstat-teaching.web.app',email=`agstat-email-qa-${Date.now()}@example.invalid`;
const credential={async getAccessToken(){const a=cli.getGlobalDefaultAccount();const t=await cli.getAccessToken(a.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform','https://www.googleapis.com/auth/firebase']);return{access_token:t.access_token,expires_in:3000};}};
dep('firebase-admin/app').initializeApp({projectId:'kau-agstat-teaching',credential});const auth=dep('firebase-admin/auth').getAuth();
let user;const report=[];
async function request(body,origin=base){const r=await fetch(base+'/api/email-action',{method:'POST',headers:{'Content-Type':'application/json','X-Agstat-Request':'classroom',Origin:origin},body:JSON.stringify(body)});return{status:r.status,data:await r.json()};}
async function check(name,fn){await fn();report.push({name,passed:true});console.log('PASS',name);}
(async()=>{try{
 user=await auth.createUser({email,password:crypto.randomBytes(24).toString('base64url'),emailVerified:false});
 const link=await auth.generateEmailVerificationLink(email,{url:base+'/'});const parsed=new URL(link),code=parsed.searchParams.get('oobCode');
 await check('Firebase generates a verification code for the optional handler',async()=>assert.ok(code));
 await check('Missing codes receive actionable guidance',async()=>{const r=await request({operation:'inspect'});assert.equal(r.status,400);assert.match(r.data.error,/incomplete/);});
 await check('Cross-origin action requests are denied',async()=>assert.equal((await request({operation:'inspect',oobCode:code},'https://example.invalid')).status,403));
 await check('The valid code identifies its mode even if the URL mode is wrong',async()=>{const r=await request({operation:'inspect',oobCode:code,mode:'invalid'});assert.equal(r.status,200);assert.equal(r.data.mode,'verifyEmail');});
 await check('Opening the page cannot silently verify a user',async()=>{const response=await fetch(base+'/account-action.html?oobCode='+encodeURIComponent(code));assert.equal(response.status,200);assert.match(response.headers.get('referrer-policy'),/no-referrer/);assert.equal((await auth.getUser(user.uid)).emailVerified,false);});
 await check('A mismatched confirmation action is rejected',async()=>assert.equal((await request({operation:'confirm',oobCode:code,mode:'resetPassword'})).status,400));
 await check('A real one-time code verifies only the synthetic account',async()=>{assert.equal((await request({operation:'confirm',oobCode:code,mode:'verifyEmail'})).status,200);assert.equal((await auth.getUser(user.uid)).emailVerified,true);});
 await check('An already-used link produces a clear recovery message',async()=>{const r=await request({operation:'inspect',oobCode:code});assert.equal(r.status,400);assert.match(r.data.error,/already been used/);});
 const reset=new URL(await auth.generatePasswordResetLink(email,{url:base+'/'})).searchParams.get('oobCode');
 await check('Password-reset links retain their correct action type',async()=>{const r=await request({operation:'inspect',oobCode:reset});assert.equal(r.status,200);assert.equal(r.data.mode,'resetPassword');});
 await check('Weak reset passwords are rejected before modifying the account',async()=>assert.equal((await request({operation:'confirm',oobCode:reset,mode:'resetPassword',newPassword:'short'})).status,400));
 await check('Password reset works for the disposable test account',async()=>{const password=crypto.randomBytes(24).toString('base64url');assert.equal((await request({operation:'confirm',oobCode:reset,mode:'resetPassword',newPassword:password})).status,200);const key=require('../functions/content/web-config.json').apiKey;const r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${key}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})});assert.equal(r.status,200);});
 }finally{if(user)await auth.deleteUser(user.uid);fs.mkdirSync('qa',{recursive:true});fs.writeFileSync('qa/email-action-live.json',JSON.stringify({checks:report,syntheticAccountRemoved:!!user},null,2));}
})().catch(e=>{console.error('Email-action QA failed: '+e.message);process.exitCode=1;});
