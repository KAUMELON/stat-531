const path = require('node:path');
function isInstructor(token, email) {
  return !!token && token.email_verified === true && token.email?.toLowerCase() === email.toLowerCase();
}
function hasAccess(token, profile, email) {
  return isInstructor(token,email) || (!!token?.email_verified && profile?.status === 'approved');
}
function safeAsset(root, name) {
  const target = path.resolve(root, name);
  return target.startsWith(path.resolve(root) + path.sep) && !name.split(/[\\/]/).some(x=>x.startsWith('.')) ? target : null;
}
function validOrigin(origin, project) {
  return [`https://${project}.web.app`, `https://${project}.firebaseapp.com`].includes(origin);
}
module.exports = {isInstructor,hasAccess,safeAsset,validOrigin};
