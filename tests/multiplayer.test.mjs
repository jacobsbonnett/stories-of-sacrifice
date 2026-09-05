import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createEngine} from '../dist/server/engine.js';
import worker from '../dist/server/index.js';
const selected=['crimson','midnight','gilded','hours'];
const setup=()=>createEngine().create(selected,['Alice','Bob']);
test('40 target: response below 40 loses, but both at 40 advance to 80 regardless of leader',()=>{
 for(const starter of [0,1])for(const response of [39,40,42,44]){
  let s=setup();const side=starter?'ai':'player',other=starter?'player':'ai';s.turn=side;s[side].prestige=42;s[other].prestige=38;
  s=createEngine().move(s,starter,{type:'end'});assert.equal(s.over,false);assert.equal(s.finale,side);
  s[other].prestige=response;s=createEngine().move(s,1-starter,{type:'end'});
  if(response<40){assert.equal(s.over,true);assert.equal(s.winner,side);}else{assert.equal(s.over,false);assert.equal(s.prestigeTarget,80);assert.equal(s.finale,null);}
 }
});
test('80 is final: compare after response, never increase, equal scores draw',()=>{
 for(const starter of [0,1])for(const response of [79,80,82,84]){
  let s=setup();const side=starter?'ai':'player',other=starter?'player':'ai';s.turn=side;s.prestigeTarget=80;s[side].prestige=82;s[other].prestige=75;
  s=createEngine().move(s,starter,{type:'end'});assert.equal(s.over,false);assert.equal(s.finale,side);
  s[other].prestige=response;s=createEngine().move(s,1-starter,{type:'end'});
  assert.equal(s.over,true);assert.equal(s.prestigeTarget,80);assert.equal(s.winner,response===82?'draw':response>82?other:side);
 }
});
test('80 target persists through lower scores; allegiance still wins; resources remain public',()=>{
 let s=setup();s.prestigeTarget=80;s.player.prestige=39;s.ai.prestige=41;s.ai.grendels=7;s.ai.power=5;
 s=createEngine().move(s,0,{type:'end'});assert.equal(s.over,false);assert.equal(s.prestigeTarget,80);
 const view=createEngine().view(s,0);assert.equal(view.ai.grendels,7);assert.equal(view.ai.power,5);
 s.legends=Object.fromEntries(selected.map(k=>[k,'ai']));s=createEngine().move(s,1,{type:'end'});assert.equal(s.winner,'ai');
 assert.equal(setup().prestigeTarget,40);
});
test('seat orientation, private hands and private draw order',()=>{
 const s=setup();for(const seat of [0,1]){const v=createEngine().view(s,seat);assert.equal(v.player.name,seat?'Bob':'Alice');assert.equal(v.turn,seat?'ai':'player');
 for(const pile of [v.ai.hand,v.ai.draw,v.player.draw,v.marketDeck])for(const c of pile){assert.deepEqual(Object.keys(c),['id','hidden']);assert.ok(c.id.startsWith('hidden-'));}
 assert.notEqual(v.ai.hand[0].id,s.ai.hand[0].id);assert.equal(v.player.hand.length,5);}
});
test('turn authority, end turn, no automatic opponent, and manual Champion effects',()=>{
 let s=setup();assert.throws(()=>createEngine().move(s,1,{type:'play',id:s.ai.hand[0].id}),/turn/);
 const total=p=>p.hand.length+p.draw.length+p.discard.length+p.champions.length;
 s=createEngine().move(s,0,{type:'end'});assert.equal(s.turn,'ai');assert.equal(s.ai.hand.length,5);assert.equal(total(s.player),10);
 const c=s.ai.hand.find(c=>c.name==='Copper');s=createEngine().move(s,1,{type:'play',id:c.id});assert.equal(s.ai.hand.length,4);assert.equal(s.player.hand.length,5);
 assert.throws(()=>createEngine().move(s,0,{type:'end'}),/turn/);
});
test('purchase goes to the purchaser Rest and opponents cannot spend it',()=>{
 let s=setup();s.turn='ai';s.ai.grendels=99;const c=s.market.find(c=>c.name!=='Law in Effect');s=createEngine().move(s,1,{type:'buy',id:c.id});assert.ok(s.ai.discard.some(x=>x.id===c.id));assert.ok(!s.player.discard.some(x=>x.id===c.id));
 assert.throws(()=>createEngine().move(s,1,{type:'invoke',key:'not-a-deck'}));
});
test('all serialized target choices work for both players',()=>{
 for(const seat of [0,1]){
  let s=setup();s.turn=seat?'ai':'player';const p=seat?s.ai:s.player,foe=seat?s.player:s.ai;
  p.hand=[{id:'assassin',name:'The Assassin',suit:'crimson',cost:5,type:'champion',effect:'grendels',value:1,durability:4}];
  foe.champions=[{id:'target',durability:5,maxHealth:5,type:'champion'}];s.chain.crimson=1;
  s=createEngine().move(s,seat,{type:'play',id:'assassin'});assert.equal(s.choice.kind,'assassin');
  assert.throws(()=>createEngine().move(s,seat,{type:'end'}),/choosing/);
  s=createEngine().move(s,seat,{type:'choose',id:'target'});assert.equal((seat?s.player:s.ai).champions[0].durability,3);assert.equal(s.choice,null);
  assert.equal((seat?s.ai:s.player).champions[0].ready,false);
  assert.throws(()=>createEngine().move(s,seat,{type:'effect',id:'assassin'}),/used/);
  const own=seat?s.ai:s.player;own.grendels=4;
  own.discard=[0,1].map(i=>({id:'stone'+i,name:'Petrified Villager',type:'token',suit:'gilded'}));
  s=createEngine().move(s,seat,{type:'invoke',key:'gilded'});assert.ok(!s.choice);
  assert.equal((seat?s.ai:s.player).discard.length,0);assert.equal((seat?s.ai:s.player).power,1);
  const next=seat?s.player:s.ai;next.pendingDiscards=2;
  s=createEngine().move(s,seat,{type:'end'});assert.equal(s.choice.kind,'law-discard');
  for(let i=0;i<2;i++){const active=seat?s.player:s.ai;s=createEngine().move(s,1-seat,{type:'choose',id:active.hand[0].id});}
  assert.equal(s.choice,null);
 }
});
test('room API: invitations, third seat denial, actions, retries, stale state, reconnect, privacy',async()=>{
 const db=new DatabaseSync(':memory:');for(const file of fs.readdirSync(new URL('../drizzle/',import.meta.url)).filter(n=>n.endsWith('.sql')))db.exec(fs.readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
 const DB={prepare(sql){return {bind(...args){return {async first(){return db.prepare(sql).get(...args);},async run(){return {meta:{changes:Number(db.prepare(sql).run(...args).changes)}};}};}};}};
 const call=async(path,body,token)=>{const response=await worker.fetch(new Request('https://game.test'+path,{method:body?'POST':'GET',headers:{Origin:'https://game.test','Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})}),{DB});return {status:response.status,data:await response.json()};};
 const host=(await call('/api/rooms',{selected:selected.slice(0,2),name:'Alice'})).data;assert.ok(host.token);assert.equal(host.state,null);const base='/api/rooms/'+host.room;
 assert.equal((await call(base)).status,401);assert.equal((await call(base+'/join',{invite:'wrong'})).status,403);
 assert.deepEqual((await call(base+'/invite',{invite:host.invite})).data.selected,selected.slice(0,2));
 assert.equal((await call(base+'/join',{invite:host.invite,name:'Bob',selected:selected.slice(0,2)})).status,400);
 const guest=(await call(base+'/join',{invite:host.invite,name:'Bob',selected:selected.slice(2)})).data;assert.ok(guest.token);assert.deepEqual(guest.state.selected,selected);
 assert.equal((await call(base+'/join',{invite:host.invite,name:'Third'})).status,409);
 const snapshot=(await call(base,null,host.token)).data;assert.equal(snapshot.ready,true);
 // Select a non-drawing starter so the hand-size assertion is independent of shuffle.
 const action={requestId:crypto.randomUUID(),revision:snapshot.revision,action:{type:'play',id:snapshot.state.player.hand.find(c=>c.name==='Copper').id}};
 const played=await call(base+'/actions',action,host.token);assert.equal(played.status,200);
 const retry=await call(base+'/actions',action,host.token);assert.equal(retry.data.revision,played.data.revision);
 assert.equal((await call(base+'/actions',{...action,requestId:crypto.randomUUID()},host.token)).status,409);
 const rejoin=(await call(base,null,guest.token)).data;assert.equal(rejoin.state.ai.hand.length,4);assert.ok(rejoin.state.ai.hand.every(c=>!c.name));
 const blocked=await call(base+'/actions',{revision:played.data.revision,requestId:crypto.randomUUID(),action:{type:'end'}},guest.token);assert.equal(blocked.status,400);
 assert.equal((await call(base+'/actions',{revision:played.data.revision,requestId:crypto.randomUUID(),action:{type:'end'}},host.token)).status,200);
 db.close();
});
