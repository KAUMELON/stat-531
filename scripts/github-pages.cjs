// Uses the GitHub account authorised in Git Credential Manager. Credentials stay in memory.
const {execFileSync}=require('node:child_process');
const path=require('node:path');
const git='C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/git/cmd/git.exe';
const root=path.resolve(__dirname,'..');
const args=['-c',`safe.directory=${root.replaceAll('\\','/')}`,'-c','credential.helper=','-c','credential.helper=manager','-c','credential.credentialStore=dpapi','-c','credential.username=KAUMELON'];
async function main(){
 const credential=execFileSync(git,[...args,'credential','fill'],{cwd:root,input:'protocol=https\nhost=github.com\nusername=KAUMELON\n\n',encoding:'utf8',stdio:['pipe','pipe','pipe']});
 const fields=Object.fromEntries(credential.trim().split(/\r?\n/).map(line=>{const i=line.indexOf('=');return[line.slice(0,i),line.slice(i+1)];}));
 if(fields.username?.toLowerCase()!=='kaumelon'||!fields.password)throw Error('Authorise KAUMELON in Git Credential Manager first.');
 async function api(endpoint,method='GET',body){const res=await fetch('https://api.github.com/repos/KAUMELON/stat-531/'+endpoint,{method,signal:AbortSignal.timeout(30000),headers:{Authorization:`Bearer ${fields.password}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const data=await res.json().catch(()=>({}));if(!res.ok&&res.status!==404)throw Error(`GitHub ${res.status}: ${data.message||'Request failed'}`);return{status:res.status,data};}
 const mode=process.argv[2]||'status';
 if(mode==='configure'){
  const prior=await api('pages');
  const response=await api('pages',prior.status===404?'POST':'PUT',{build_type:'legacy',source:{branch:'gh-pages',path:'/'}});
  console.log(JSON.stringify({configured:response.status<300}));
 }else if(mode==='rebuild'){
  const result=await api('pages/builds','POST',{});console.log(JSON.stringify({httpStatus:result.status,status:result.data.status}));
 }else if(mode==='build'){
  const result=await api('pages/builds/latest');console.log(JSON.stringify({httpStatus:result.status,status:result.data.status,commit:result.data.commit,error:result.data.error}));
 }else if(mode==='status'){
  const result=await api('pages');console.log(JSON.stringify({httpStatus:result.status,url:result.data.html_url,status:result.data.status,source:result.data.source,cname:result.data.cname}));
 }else throw Error('Use status, configure, rebuild or build.');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
