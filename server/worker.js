import {createEngine} from './engine.js';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const secret=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
const name=value=>typeof value==='string'&&/^[\p{L}\p{N} _.-]{1,24}$/u.test(value)?value:'Player';
async function body(request){
 if(!request.headers.get('content-type')?.startsWith('application/json'))throw new Error('JSON required.');
 const text=await request.text();if(text.length>4096)throw new Error('Request too large.');return JSON.parse(text);
}
const validPair=selected=>Array.isArray(selected)&&selected.length===2&&new Set(selected).size===2&&selected.every(k=>['crimson','midnight','gilded','hours','velvet','ashen'].includes(k));
function view(row,seat){const game=JSON.parse(row.game);return {room:row.id,revision:row.revision,ready:!!row.guest,expires:row.expires,selected:game.selected,state:game.draft?null:createEngine().view(game,seat)};}
export default {async fetch(request,env){
 const url=new URL(request.url);
 if(!url.pathname.startsWith('/api/'))return env.ASSETS.fetch(request);
 try{
  if(request.method!=='GET'&&request.headers.get('origin')!==url.origin)return json({error:'Origin not allowed.'},403);
  if(!env.DB)return json({error:'Multiplayer is not configured on this server yet.'},503);
  const now=Date.now();
  if(url.pathname==='/api/rooms'&&request.method==='POST'){
   const input=await body(request);
   // Bound the test service; expired matches are never resumed.
   const active=await env.DB.prepare('SELECT count(*) AS n FROM rooms WHERE expires > ?').bind(now).first();
   if(active.n>=200)return json({error:'The test server is full. Please try later.'},429);
   const id=crypto.randomUUID(),token=secret(),invite=secret();
   if(!validPair(input.selected))throw new Error('Choose exactly two different decks.');
   const game={draft:true,selected:input.selected,names:[name(input.name)]};
   const row={id,invite:await hash(invite),host:await hash(token),guest:null,game:JSON.stringify(game),revision:0,expires:now+86400000};
   await env.DB.prepare('INSERT INTO rooms (id,invite,host,game,expires) VALUES (?,?,?,?,?)').bind(id,row.invite,row.host,row.game,row.expires).run();
   return json({...view(row,0),token,invite},201);
  }
  const match=url.pathname.match(/^\/api\/rooms\/([a-f0-9-]{36})(?:\/(join|actions|invite))?$/);
  if(!match)return json({error:'Not found.'},404);
  const row=await env.DB.prepare('SELECT * FROM rooms WHERE id = ? AND expires > ?').bind(match[1],now).first();
  if(!row)return json({error:'This room expired or does not exist.'},404);
  if(['join','invite'].includes(match[2])&&request.method==='POST'){
   const input=await body(request);
   if(typeof input.invite!=='string'||await hash(input.invite)!==row.invite)return json({error:'Invalid invitation.'},403);
   if(row.guest)return json({error:'Both seats are taken. Rejoin using the browser where you joined.'},409);
   const draft=JSON.parse(row.game);
   if(match[2]==='invite')return json({selected:draft.selected});
   if(!validPair(input.selected)||input.selected.some(k=>draft.selected.includes(k)))throw new Error('Choose two decks not already chosen by your friend.');
   const token=secret(),guest=await hash(token),game=createEngine().create([...draft.selected,...input.selected],[draft.names[0],name(input.name)]);
   const result=await env.DB.prepare('UPDATE rooms SET guest = ?, game = ?, revision = revision + 1 WHERE id = ? AND guest IS NULL AND revision = ?').bind(guest,JSON.stringify(game),row.id,row.revision).run();
   if(!result.meta.changes)return json({error:'Someone already joined. Please reconnect.'},409);
   return json({...view({...row,guest,game:JSON.stringify(game),revision:row.revision+1},1),token});
  }
  const token=request.headers.get('authorization')?.replace(/^Bearer /,'');
  if(!token||token.length!==64)return json({error:'A player session is required.'},401);
  const digest=await hash(token),seat=digest===row.host?0:digest===row.guest?1:-1;
  if(seat<0)return json({error:'Invalid player session.'},403);
  if(!match[2]&&request.method==='GET')return json(view(row,seat));
  if(match[2]==='actions'&&request.method==='POST'){
   const input=await body(request),requests=JSON.parse(row.requests);
   if(typeof input.requestId!=='string'||!/^[a-f0-9-]{36}$/.test(input.requestId))throw new Error('Invalid action identifier.');
   if(requests.some(x=>x===`${seat}:${input.requestId}`))return json(view(row,seat));
   if(!row.guest)return json({error:'Wait for your friend to join.'},409);
   if(input.revision!==row.revision)return json({error:'The board changed. Please try again.'},409);
   const game=createEngine().move(JSON.parse(row.game),seat,input.action||{});
   requests.push(`${seat}:${input.requestId}`);
   const result=await env.DB.prepare('UPDATE rooms SET game = ?, requests = ?, revision = revision + 1 WHERE id = ? AND revision = ?').bind(JSON.stringify(game),JSON.stringify(requests.slice(-128)),row.id,row.revision).run();
   if(!result.meta.changes)return json({error:'The board changed. Please try again.'},409);
   return json(view({...row,game:JSON.stringify(game),revision:row.revision+1},seat));
  }
  return json({error:'Method not allowed.'},405);
 }catch(error){return json({error:error.message||'Unable to process action.'},400);}
}};
