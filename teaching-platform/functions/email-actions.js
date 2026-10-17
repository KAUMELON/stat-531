const modes={VERIFY_EMAIL:'verifyEmail',PASSWORD_RESET:'resetPassword',RECOVER_EMAIL:'recoverEmail'};
const fail=(message)=>Object.assign(new Error(message),{httpStatus:400});
module.exports=async function emailAction(data,identity){
 const {oobCode,operation,newPassword,mode}=data||{};
 if(typeof oobCode!=='string'||oobCode.length<16||oobCode.length>2048||!['inspect','confirm'].includes(operation))throw fail('This email link is incomplete. Open the complete link from your newest email.');
 let info;try{info=await identity('resetPassword',{oobCode});}catch{throw fail('This link has expired or has already been used. Return to the classroom to sign in or request a fresh email.');}
 const actualMode=modes[info.requestType];
 if(!actualMode)throw fail('This account action is not supported here. Please contact the department.');
 if(operation==='inspect')return{mode:actualMode};
 if(mode!==actualMode)throw fail('The action does not match this email link. Reload the original link.');
 if(actualMode==='resetPassword'){
  if(typeof newPassword!=='string'||newPassword.length<8||newPassword.length>128)throw fail('Choose a password of 8–128 characters.');
  await identity('resetPassword',{oobCode,newPassword});
 }else await identity('update',{oobCode});
 return{ok:true,mode:actualMode};
};
