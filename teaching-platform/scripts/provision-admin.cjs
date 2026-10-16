// Explicitly requested administrator provisioning. Read password from stdin only.
// Never place passwords or tokens in arguments, files, stdout, or error logs.
const path=require('node:path');const {createRequire}=require('node:module');
const dep=createRequire(path.resolve(__dirname,'../functions/index.js'));
const cli=require('C:/Users/user/AppData/Roaming/npm/node_modules/firebase-tools/lib/auth.js');
const project='kau-agstat-teaching',email='pratheesh.pg@kau.in';
async function credential(){const a=cli.getGlobalDefaultAccount();const t=await cli.getAccessToken(a.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform','https://www.googleapis.com/auth/firebase']);return{access_token:t.access_token,expires_in:3000};}
async function main(){let input='';if(process.stdin.isTTY){process.stdin.setRawMode(true);console.log('Ready for administrator input (hidden).');input=await new Promise(resolve=>{const onData=chunk=>{input+=chunk.toString();if(/[\r\n]/.test(input)){process.stdin.off('data',onData);process.stdin.pause();resolve(input.trim());}};process.stdin.on('data',onData);process.stdin.resume();});process.stdin.setRawMode(false);}else{for await(const chunk of process.stdin)input+=chunk;}let secret=JSON.parse(input);input='';console.log('Provisioning requested administrator.');if(secret.email!==email||typeof secret.password!=='string'||secret.password.length<8)throw Error('Invalid administrator input.');
 dep('firebase-admin/app').initializeApp({projectId:project,credential:{getAccessToken:credential}});const auth=dep('firebase-admin/auth').getAuth();let user,created=false;
 try{user=await auth.getUserByEmail(email);}catch(e){if(e.code!=='auth/user-not-found')throw Error('Administrator lookup failed.');}
 if(user)user=await auth.updateUser(user.uid,{password:secret.password,disabled:false});else{user=await auth.createUser({email,password:secret.password,displayName:'Pratheesh P. Gopinath',emailVerified:false});created=true;}
 const token=(await credential()).access_token;
 const saved=await fetch(`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/students/${user.uid}?updateMask.fieldPaths=name&updateMask.fieldPaths=email&updateMask.fieldPaths=status&updateMask.fieldPaths=role`,{method:'PATCH',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({fields:{name:{stringValue:user.displayName||'Pratheesh P. Gopinath'},email:{stringValue:email},status:{stringValue:'approved'},role:{stringValue:'admin'}}})});if(!saved.ok)throw Error('Administrator profile could not be saved.');
 const config=require('../functions/content/web-config.json');
 async function identity(method,body){const r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:${method}?key=${config.apiKey}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw Error('Firebase administrator authentication step failed.');return d;}
 const login=await identity('signInWithPassword',{email,password:secret.password,returnSecureToken:true});secret.password='';secret=null;
 let verificationSent=false;if(!user.emailVerified){await identity('sendOobCode',{requestType:'VERIFY_EMAIL',idToken:login.idToken});verificationSent=true;}
 console.log(JSON.stringify({email,created,passwordSignInVerified:true,emailVerified:user.emailVerified,verificationSent,profileStatus:'approved'}));
}
main().catch(()=>{console.error('Administrator provisioning did not finish. No credentials were logged.');process.exitCode=1;});
