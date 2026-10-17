// Accept only supported HTTPS lecture URLs; never accept arbitrary iframe HTML.
function lectureVideo(raw){if(raw==='')return null;if(typeof raw!=='string'||raw.length>2048)throw Error('Enter a supported HTTPS video URL.');let u;try{u=new URL(raw);}catch{throw Error('Enter a valid video URL.');}if(u.protocol!=='https:'||u.username||u.password)throw Error('Use an HTTPS video URL.');const host=u.hostname.toLowerCase();let id;
if(['youtube.com','www.youtube.com','m.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(host)){id=u.pathname==='/watch'?u.searchParams.get('v'):u.pathname.match(/^\/(?:embed|shorts)\/([\w-]{11})\/?$/)?.[1];}else if(host==='youtu.be')id=u.pathname.slice(1);
if(id){if(!/^[\w-]{11}$/.test(id))throw Error('Invalid YouTube video link.');return{provider:'youtube',url:'https://www.youtube-nocookie.com/embed/'+id};}
if(['vimeo.com','www.vimeo.com','player.vimeo.com'].includes(host)){const v=u.pathname.match(/^\/(?:video\/)?(\d+)(?:\/([a-zA-Z0-9]+))?\/?$/);if(!v)throw Error('Use a Vimeo video link.');const hash=v[2]||u.searchParams.get('h');return{provider:'vimeo',url:'https://player.vimeo.com/video/'+v[1]+(hash?'?h='+encodeURIComponent(hash):'')};}
if(/\.(mp4|webm)$/i.test(u.pathname))return{provider:'file',url:u.href};throw Error('Use a YouTube, Vimeo, MP4 or WebM link.');}
module.exports={lectureVideo};
