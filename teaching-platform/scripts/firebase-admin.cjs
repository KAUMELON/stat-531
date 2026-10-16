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
