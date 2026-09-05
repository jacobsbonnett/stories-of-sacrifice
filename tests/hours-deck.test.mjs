import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import {createEngine} from '../dist/server/engine.js';

test('Keeper of Hours ships twelve illustrated cards and is included in both engines',()=>{
 const code=fs.readFileSync('hours-deck.js','utf8');
 assert.match(code,/const HOURS_CARDS=\[/);
 assert.equal((code.match(/assets\/hours/g)||[]).length,1);
 const files=fs.readdirSync('assets/hours').filter(x=>x.endsWith('.png'));
 assert.equal(files.length,12);
 assert.match(fs.readFileSync('index.html','utf8'),/hours-deck\.js/);
 assert.match(fs.readFileSync('build.mjs','utf8'),/'hours-deck\.js'/);
});

test('complete roster has the intended costs and Champion health',()=>{const s=createEngine().create(['hours','crimson','midnight','velvet'],['A','B']),expected={
 'Aion, Keeper of Hours':[8,4],'The Last Tomorrow':[7,0],'Pendulum Warden':[6,3],'Borrowed Hour':[6,0],'Sands Unfallen':[5,0],'Clockwork Sentinel':[5,3],'Moment Between Bells':[5,0],'Rewind the Thread':[4,0],'Stolen Second':[4,0],'Hourglass Fracture':[4,0],'Glimpse Beyond Midnight':[3,0]
};for(const [name,[cost,health]]of Object.entries(expected)){const c=find(s,name);assert.equal(c.cost,cost,name);assert.equal(c.durability,health,name);}assert.equal([...s.player.hand,...s.player.draw].filter(c=>c.name==='Second Hand').length,1);});

test('Keeper of Hours browser module parses',()=>{
 execFileSync(process.execPath,['--check','hours-deck.js']);
});

const selected=['hours','crimson','midnight','velvet'];
const blank=(seat=0)=>{const s=createEngine().create(selected,['A','B']);s.turn=seat?'ai':'player';for(const p of [s.player,s.ai]){p.hand=[];p.draw=[];p.discard=[];p.champions=[];p.grendels=0;p.power=0;p.prestige=0;p.discount=0;p.time=0;}return s;};
const find=(s,name)=>[...s.market,...s.marketDeck,...s.player.hand,...s.player.draw].find(c=>c.name===name);
const play=(s,seat,name,prior=0)=>{const p=seat?s.ai:s.player,c=find(s,name);s.chain.hours=prior;p.hand=[c];return createEngine().move(s,seat,{type:'play',id:c.id});};

test('Time and highest eligible combo tiers work for both seats',()=>{for(const seat of [0,1]){let s=blank(seat);s=play(s,seat,'Stolen Second',1);let p=seat?s.ai:s.player;assert.deepEqual([p.time,p.grendels,p.power],[1,2,0]);s=blank(seat);s=play(s,seat,'Stolen Second',3);p=seat?s.ai:s.player;assert.deepEqual([p.time,p.grendels,p.power],[1,0,2]);s=blank(seat);s=play(s,seat,'Moment Between Bells',2);p=seat?s.ai:s.player;assert.deepEqual([p.grendels,p.time,p.power],[2,2,0]);}});

test('all base Effects resolve exactly for both seats',()=>{const expected={
 'Aion, Keeper of Hours':{power:2,time:1},'The Last Tomorrow':{power:4},'Pendulum Warden':{time:1},'Borrowed Hour':{hand:1},'Sands Unfallen':{power:2},'Clockwork Sentinel':{power:1},'Moment Between Bells':{grendels:2},'Rewind the Thread':{},'Stolen Second':{time:1},'Hourglass Fracture':{power:3},'Glimpse Beyond Midnight':{hand:1}
};for(const seat of [0,1])for(const [name,want]of Object.entries(expected)){let s=blank(seat),p=seat?s.ai:s.player;if(want.hand)p.draw=[{id:`draw-${seat}-${name}`,name:'Copper',cost:0,type:'action',suit:'common'}];s=play(s,seat,name,0);p=seat?s.ai:s.player;for(const key of ['power','grendels','time'])assert.equal(p[key]||0,want[key]||0,`${name} ${key}`);if(want.hand)assert.equal(p.hand.length,want.hand,name);}});

test('Aion lets its owner choose how much Time becomes Power',()=>{for(const seat of [0,1]){let s=blank(seat),p=seat?s.ai:s.player;p.time=3;s=play(s,seat,'Aion, Keeper of Hours',2);assert.equal(s.choice.kind,'hours-spend');s=createEngine().move(s,seat,{type:'choose',amount:2});p=seat?s.ai:s.player;assert.deepEqual([p.time,p.power],[2,6]);}});

test('Rewind choices return illustrated Hours actions for both online seats',()=>{for(const seat of [0,1]){let s=blank(seat),p=seat?s.ai:s.player,c=find(s,'Sands Unfallen');p.discard=[c];p.playedThisTurn=[c.id];s=play(s,seat,'Rewind the Thread');assert.equal(s.choice.kind,'hours-rewind');s=createEngine().move(s,seat,{type:'choose',id:c.id});p=seat?s.ai:s.player;assert.ok(p.hand.some(x=>x.id===c.id));assert.equal(s.choice,null);}});

test('Suspend blocks one Champion Effect and Sera Vey grants Time plus a draw',()=>{for(const seat of [0,1]){let s=blank(seat),p=seat?s.ai:s.player,foe=seat?s.player:s.ai,target=find(s,'Aion, Keeper of Hours');target.ready=true;foe.champions=[target];s=play(s,seat,'Pendulum Warden',2);assert.equal(s.choice.kind,'hours-suspend');s=createEngine().move(s,seat,{type:'choose',id:target.id});s.turn=seat?'player':'ai';assert.throws(()=>createEngine().move(s,1-seat,{type:'effect',id:target.id}),/Effect already used|Wait for your turn/);s=blank(seat);p=seat?s.ai:s.player;p.grendels=4;p.draw=[{id:'future',name:'Copper',cost:0,type:'action',suit:'common',effect:'grendels',value:1,text:'Effect: Gain 1 Grendel.'}];s=createEngine().move(s,seat,{type:'invoke',key:'hours'});p=seat?s.ai:s.player;assert.deepEqual([p.grendels,p.time,p.hand.length],[0,2,1]);}});
