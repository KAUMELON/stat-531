// Uses the signed-in Firebase CLI account in memory. Never prints credentials.
const auth = require('C:/Users/user/AppData/Roaming/npm/node_modules/firebase-tools/lib/auth.js');
const fs = require('node:fs');
const project = 'kau-agstat-teaching';
async function api(url, method='GET', body) {
  const account = auth.getGlobalDefaultAccount();
  if (!account) throw new Error('Sign into Firebase CLI first.');
  const token = await auth.getAccessToken(account.tokens.refresh_token, ['https://www.googleapis.com/auth/cloud-platform','https://www.googleapis.com/auth/firebase']);
  const response = await fetch(url, {method, headers:{Authorization:`Bearer ${token.access_token}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
  const data=await response.json();
  if (!response.ok) throw new Error(`${response.status}: ${data.error?.message || 'Cloud request failed'}`);
  return data;
}
async function main() {

  if(['ui-verify','ui-approve','ui-suspend','ui-cleanup'].includes(process.argv[2])) {
    const email=process.argv[3];
    if(!/^agstat-ui-qa-\d+@example.invalid$/.test(email||''))throw new Error('Only isolated UI QA accounts are accepted.');
    const r=require('node:module').createRequire(require('node:path').resolve(__dirname,'../functions/index.js'));
    r('firebase-admin/app').initializeApp({projectId:project,credential:{async getAccessToken(){const a=auth.getGlobalDefaultAccount();const t=await auth.getAccessToken(a.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform','https://www.googleapis.com/auth/firebase']);return{access_token:t.access_token,expires_in:3000};}}});
    const user=await r('firebase-admin/auth').getAuth().getUserByEmail(email);
    if(process.argv[2]==='ui-verify'){await r('firebase-admin/auth').getAuth().updateUser(user.uid,{emailVerified:true});console.log('UI QA email marked verified');}
    else if(['ui-approve','ui-suspend'].includes(process.argv[2])){const status=process.argv[2]==='ui-approve'?'approved':'suspended';await api(`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/students/${user.uid}?updateMask.fieldPaths=status`,'PATCH',{fields:{status:{stringValue:status}}});console.log('Synthetic UI QA status: '+status);}
    else{
      const base=`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/students/${user.uid}`;
      for(const name of ['progress','practice','attendance','activity']){const list=await api(`${base}/${name}`);for(const d of list.documents||[])await api('https://firestore.googleapis.com/v1/'+d.name,'DELETE');}
      const docs=`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`;
      const attempts=await api(`${docs}:runQuery`,'POST',{structuredQuery:{from:[{collectionId:'attempts'}],where:{fieldFilter:{field:{fieldPath:'uid'},op:'EQUAL',value:{stringValue:user.uid}}}}});
      for(const row of attempts)if(row.document)await api('https://firestore.googleapis.com/v1/'+row.document.name,'DELETE');
      for(const path of [base,`${docs}/examLocks/${user.uid}_r-agriculture`,`${docs}/tutorLimits/${user.uid}_${new Date().toISOString().slice(0,10)}`]){try{await api(path,'DELETE');}catch(e){if(!e.message.startsWith('404:'))throw e;}}
      await r('firebase-admin/auth').getAuth().deleteUser(user.uid);console.log('UI QA account and learning records removed');
    }
  }
  if(process.argv[2] === 'accounts') {
    const b=await api('https://cloudbilling.googleapis.com/v1/billingAccounts');
    console.log(JSON.stringify((b.billingAccounts||[]).map(a=>({name:a.name,displayName:a.displayName,open:a.open}))));
  }
  if(process.argv[2] === 'related-billing') {
    const projects=['raisins-2025','fig-1-41cec','statoberrydrona','datarepo-statoberry','papaya-523c0','seminars-1','training-8aca7','raisins-admin'];
    const rows=await Promise.all(projects.map(async id=>{try{const b=await api(`https://cloudbilling.googleapis.com/v1/projects/${id}/billingInfo`);return{project:id,account:b.billingAccountName,enabled:b.billingEnabled};}catch{return{project:id,unavailable:true};}}));
    console.log(JSON.stringify(rows));
  }
  if(process.argv[2] === 'activate-billing') {
    const account=process.argv[3];
    if(!/^billingAccounts\/[A-Z0-9-]+$/.test(account||''))throw new Error('Provide an exact billing account returned by accounts.');
    const b=await api(`https://cloudbilling.googleapis.com/v1/projects/${project}/billingInfo`,'PUT',{billingAccountName:account});
    console.log(JSON.stringify({projectId:project,billingEnabled:b.billingEnabled}));
  }
  if(process.argv[2] === 'server-apis') {
    const services=['cloudfunctions.googleapis.com','run.googleapis.com','artifactregistry.googleapis.com','cloudbuild.googleapis.com','aiplatform.googleapis.com','eventarc.googleapis.com','pubsub.googleapis.com'];
    for(const service of services){await api(`https://serviceusage.googleapis.com/v1/projects/${project}/services/${service}:enable`,'POST',{});console.log(`Enabled ${service}`);}
    const resource=await api(`https://cloudresourcemanager.googleapis.com/v1/projects/${project}`);
    const number=resource.projectNumber;
    const member=`serviceAccount:${number}-compute@developer.gserviceaccount.com`;
    const policy=await api(`https://cloudresourcemanager.googleapis.com/v1/projects/${project}:getIamPolicy`,'POST',{});
    for(const role of ['roles/aiplatform.user','roles/datastore.user','roles/logging.logWriter']){
      let binding=(policy.bindings||[]).find(b=>b.role===role);
      if(!binding){binding={role,members:[]};(policy.bindings||=[]).push(binding);}
      if(!binding.members.includes(member))binding.members.push(member);
    }
    await api(`https://cloudresourcemanager.googleapis.com/v1/projects/${project}:setIamPolicy`,'POST',{policy});
    console.log('Runtime permissions configured for this teaching project');
  }
  if(process.argv[2] === 'probe-ai') {
    const model=process.argv[3]||'gemini-3.8-flash';
    const b=await api(`https://aiplatform.googleapis.com/v1/projects/${project}/locations/global/publishers/google/models/${model}:generateContent`,'POST',{contents:[{role:'user',parts:[{text:'In one sentence, explain the difference between R and RStudio to an agricultural student.'}]}],generationConfig:{maxOutputTokens:160,temperature:0.2}});
    console.log(JSON.stringify({model,text:b.candidates?.[0]?.content?.parts?.filter(p=>p.text&&!p.thought).map(p=>p.text).join(' ')}));
  }
  if(process.argv[2] === 'registration-role') {
    const resource=await api(`https://cloudresourcemanager.googleapis.com/v1/projects/${project}`);
    const member=`serviceAccount:${resource.projectNumber}-compute@developer.gserviceaccount.com`;
    const policy=await api(`https://cloudresourcemanager.googleapis.com/v1/projects/${project}:getIamPolicy`,'POST',{});
    let binding=policy.bindings.find(b=>b.role==='roles/firebaseauth.admin');
    if(!binding){binding={role:'roles/firebaseauth.admin',members:[]};policy.bindings.push(binding);}
    if(!binding.members.includes(member))binding.members.push(member);
    await api(`https://cloudresourcemanager.googleapis.com/v1/projects/${project}:setIamPolicy`,'POST',{policy});
    console.log('Registration runtime can create accounts in the teaching project');
  }
  if(process.argv[2] === 'auth-token-api') {
    const url=`https://serviceusage.googleapis.com/v1/projects/${project}/services/securetoken.googleapis.com`;
    const current=await api(url);console.log(JSON.stringify({service:current.name,state:current.state}));
    if(current.state!=='ENABLED'){await api(url+':enable','POST',{});console.log('Firebase token refresh API enabled');}
  }
  if (process.argv[2] === 'setup') {
    for (const service of ['firestore.googleapis.com','identitytoolkit.googleapis.com','firebaserules.googleapis.com']) {
      await api(`https://serviceusage.googleapis.com/v1/projects/${project}/services/${service}:enable`,'POST',{});
      console.log(`Enabled ${service}`);
    }
    try {
      const db = await api(`https://firestore.googleapis.com/v1/projects/${project}/databases?databaseId=(default)`,'POST',{locationId:'asia-south1',type:'FIRESTORE_NATIVE'});
      console.log('Firestore database requested', db.name);
    } catch(e) { if(!e.message.includes('already exists')) throw e; console.log('Firestore already exists'); }
    try { await api(`https://identitytoolkit.googleapis.com/v2/projects/${project}/identityPlatform:initializeAuth`,'POST',{}); } catch(e) { if(!/already|ALREADY/.test(e.message)) console.log('Auth initialization:',e.message); }
    await api(`https://identitytoolkit.googleapis.com/admin/v2/projects/${project}/config?updateMask=signIn.email.enabled,signIn.email.passwordRequired,authorizedDomains`,'PATCH',{
      signIn:{email:{enabled:true,passwordRequired:true}},
      authorizedDomains:[`${project}.firebaseapp.com`,`${project}.web.app`]
    });
    console.log('Email/password authentication configured');
  }
  if(process.argv[2] === 'billing') {
    const b = await api(`https://cloudbilling.googleapis.com/v1/projects/${project}/billingInfo`);
    console.log(JSON.stringify({projectId:project,billingEnabled:b.billingEnabled}));
  }
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
