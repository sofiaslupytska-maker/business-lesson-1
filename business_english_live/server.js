'use strict';
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const PORT=Number(process.env.PORT||3000), PIN=process.env.STUDENT_PIN||'2007', TEACHER=process.env.TEACHER_PASSWORD;
if(!TEACHER || TEACHER.length<12){console.error('Set TEACHER_PASSWORD to a secret of at least 12 characters.');process.exit(1)}
const sessions=new Map(), events=[], subscribers=new Set(), failures=new Map();
const hash=s=>crypto.createHash('sha256').update(s).digest();
const eq=(a,b)=>crypto.timingSafeEqual(hash(String(a)),hash(String(b)));
const respond=(res,code,obj)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(obj))};
const cookies=req=>Object.fromEntries((req.headers.cookie||'').split(';').map(x=>x.trim().split('=').map(decodeURIComponent)).filter(x=>x.length===2));
const session=req=>sessions.get(cookies(req).session)||null;
const readBody=req=>new Promise((resolve,reject)=>{let b='';req.on('data',x=>{b+=x;if(b.length>16000){reject(new Error('Too large'));req.destroy()}});req.on('end',()=>{try{resolve(JSON.parse(b||'{}'))}catch{reject(new Error('Invalid JSON'))}});req.on('error',reject)});
const sendEvent=item=>{events.push(item);if(events.length>3000)events.shift();const packet='data: '+JSON.stringify(item)+'\n\n';for(const res of [...subscribers]){try{res.write(packet)}catch{subscribers.delete(res)}}};
const header={'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'"};
const server=http.createServer(async(req,res)=>{Object.entries(header).forEach(([k,v])=>res.setHeader(k,v));const url=new URL(req.url,'http://localhost');
 if(req.method==='POST'&&url.pathname==='/api/login'){
  let b;try{b=await readBody(req)}catch{return respond(res,400,{error:'Invalid request'})}
  const ip=(req.socket.remoteAddress||'').slice(0,80), track=failures.get(ip)||{n:0,at:Date.now()};if(Date.now()-track.at>15*60000){track.n=0;track.at=Date.now()}if(track.n>=12)return respond(res,429,{error:'Too many attempts. Try again later.'});
  const role=b.role==='teacher'?'teacher':'student', good=role==='teacher'?eq(b.password||'',TEACHER):eq(b.password||'',PIN);
  if(!good){track.n++;failures.set(ip,track);return respond(res,401,{error:'Incorrect access code'})}failures.delete(ip);
  const name=role==='student'?String(b.name||'Student').trim().slice(0,55)||'Student':'Teacher', id=crypto.randomBytes(24).toString('hex');sessions.set(id,{role,name,id,created:Date.now()});res.setHeader('Set-Cookie',`session=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.NODE_ENV==='production'?'; Secure':''}`);respond(res,200,{role,name});if(role==='student')sendEvent({kind:'join',name,time:Date.now(),student:id.slice(0,10)});return;
 }
 if(req.method==='GET'&&url.pathname==='/api/me'){const s=session(req);return respond(res,200,s?{role:s.role,name:s.name}:{role:null})}
 if(req.method==='POST'&&url.pathname==='/api/logout'){const s=session(req);if(s)sessions.delete(s.id);res.setHeader('Set-Cookie','session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');return respond(res,200,{ok:true})}
 if(req.method==='POST'&&url.pathname==='/api/activity'){
  const s=session(req);if(!s||s.role!=='student')return respond(res,403,{error:'Student login required'});
  let b;try{b=await readBody(req)}catch{return respond(res,400,{error:'Invalid data'})}
  const allowed=['answer','typing','flashcard','reading','navigation','complete','drag'];if(!allowed.includes(b.kind))return respond(res,400,{error:'Unknown activity'});
  const item={kind:b.kind,student:s.id.slice(0,10),name:s.name,topic:String(b.topic||'').slice(0,100),question:String(b.question||'').slice(0,180),value:String(b.value||'').slice(0,600),correct:b.correct===true?true:b.correct===false?false:null,time:Date.now()};sendEvent(item);return respond(res,200,{ok:true});
 }
 if(req.method==='GET'&&url.pathname==='/api/events'){
  const s=session(req);if(!s||s.role!=='teacher')return respond(res,403,{error:'Teacher login required'});
  res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no'});
  res.write('data: '+JSON.stringify({kind:'snapshot',items:events})+'\n\n');subscribers.add(res);const interval=setInterval(()=>{try{res.write(': heartbeat\n\n')}catch{}},25000);req.on('close',()=>{clearInterval(interval);subscribers.delete(res)});return;
 }
 if(req.method==='GET'&&(url.pathname==='/'||url.pathname==='/app.js'||url.pathname==='/style.css')){
  const file=path.join(__dirname,'public',url.pathname==='/'?'index.html':url.pathname.slice(1));try{const data=fs.readFileSync(file);res.writeHead(200,{'Content-Type':file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':'text/javascript; charset=utf-8'});return res.end(data)}catch{return respond(res,404,{error:'Not found'})}
 }
 respond(res,404,{error:'Not found'});
});
server.listen(PORT,()=>console.log(`Classroom ready on http://localhost:${PORT}`));
