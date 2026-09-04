import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import {createEngine} from '../dist/server/engine.js';
const selected=['gilded','crimson','midnight','hours'];
const token=(id=crypto.randomUUID())=>({id,name:'Petrified Villager',cost:0,type:'token',suit:'gilded',effect:'none',value:0});
const copper=()=>({id:crypto.randomUUID(),name:'Copper',cost:0,type:'action',suit:'common',effect:'grendels',value:1});
const elements=new Map();
const node=()=>({dataset:{},children:[],style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},append(){},prepend(){},replaceChildren(){},showModal(){},close(){},querySelector:()=>node(),setAttribute(){}});
const solo=vm.createContext({document:{querySelector:s=>{if(!elements.has(s))elements.set(s,node());return elements.get(s);},querySelectorAll:()=>[],createElement:node},crypto:webcrypto,console,setTimeout,matchMedia:()=>({matches:true}),addEventListener(){}});solo.window=solo;
for(const f of ['game.js','crimson-deck.js','midnight-deck.js','gorgon-deck.js','table-motion.js'])vm.runInContext(fs.readFileSync(new URL('../'+f,import.meta.url),'utf8'),solo);
vm.runInContext('render=()=>{};log=()=>{};',solo);
function setup(seat=0){let s=createEngine().create(selected,['Alice','Bob']);s.turn=seat?'ai':'player';s.legends={};for(const p of [s.player,s.ai]){p.hand=[];p.draw=[];p.discard=[];p.champions=[];}return s;}
function make(name){const s=createEngine().create(selected,['A','B']);if(name==='Asp')return [...s.player.hand,...s.player.draw].find(c=>c.name===name);return [...s.market,...s.marketDeck].find(c=>c.name===name);}
function action(s,seat,a,mode){if(mode==='online')return createEngine().move(s,seat,a);solo.snapshot=structuredClone(s);solo.action=a;solo.seat=seat;vm.runInContext(`Object.assign(state,snapshot);motion.busy=false;motion.internal=false;pendingCardChoice=null;constDummy=0;`,solo);vm.runInContext(`{const p=seat?state.ai:state.player;const i=p.hand.findIndex(c=>c.id===action.id);if(action.type==='play')playCard(i,!!seat);else if(action.type==='effect')activateChampion(p.champions.findIndex(c=>c.id===action.id),!!seat);else if(action.type==='invoke')invoke(action.key,!!seat);}`,solo);return JSON.parse(vm.runInContext('JSON.stringify(state)',solo));}
// Independent expected [Grendels, Power, draws, newly created Villagers].
// Scaling cases begin with five Villagers in the enemy draw/rest and one in hand (excluded).
const cases=[
 ['Asp',0,0,[[1,0,0,0],[1,0,0,0],[1,0,0,0]]],
 ['Medusa',8,4,[[0,0,0,1],[0,2,0,1],[0,8,0,1]]],
 ["Gorgon's Gaze",6,0,[[0,0,0,1],[0,2,0,1],[0,2,0,2]]],
 ['Garden of Stone',6,0,[[2,0,0,0],[2,0,0,1],[2,3,0,1]]],
 ['Stheno',6,4,[[0,2,0,0],[0,2,0,1],[0,4,0,1]]],
 ['Euryale',5,3,[[1,0,0,0],[1,2,0,0],[1,2,0,1]]],
 ["Serpent's Bite",5,0,[[0,3,0,0],[1,3,0,0],[1,5,0,0]]],
 ['Stone Curse',4,0,[[0,0,0,1],[0,2,0,1],[0,2,0,1]]],
 ["Gorgon's Lair",4,0,[[2,0,0,0],[2,1,0,0],[2,1,1,0]]],
 ['Coiling Serpents',4,0,[[1,0,0,0],[1,2,0,0],[1,2,0,1]]],
 ['Hall of Statues',3,0,[[0,1,0,0],[1,1,0,0],[1,2,0,0]]],
 ['Cursed Reflection',3,0,[[0,0,1,0],[0,1,1,0],[0,1,1,1]]]
];
for(const mode of ['solo','online'])for(const seat of [0,1])for(const [name,cost,hp,levels] of cases)test(`${mode}, seat ${seat}: ${name} at every combo level`,()=>{
 for(let prior=0;prior<4;prior++){
  let s=setup(seat),p=seat?s.ai:s.player,foe=seat?s.player:s.ai,c=make(name);assert.equal(c.cost,cost);assert.equal(c.durability,hp);
  p.hand=[c];p.draw=Array.from({length:8},copper);foe.draw=[token(),token()];foe.discard=[token(),token(),token(),copper()];foe.hand=[token()];s.chain.gilded=prior;
  const old=foe.discard.map(c=>c.id);s=action(s,seat,{type:'play',id:c.id},mode);p=seat?s.ai:s.player;foe=seat?s.player:s.ai;
  assert.deepEqual([p.grendels,p.power,p.hand.length,foe.discard.length-4],levels[Math.min(prior,2)]);
  assert.deepEqual(foe.discard.slice(0,4).map(c=>c.id),old,'Petrify never replaces cards');assert.equal(new Set(foe.discard.map(c=>c.id)).size,foe.discard.length);
  assert.equal(s.chain.gilded,prior+1);
  if(hp){assert.equal(p.champions[0].ready,false);assert.equal(p.champions[0].durability,hp);if(mode==='online')assert.throws(()=>action(s,seat,{type:'effect',id:c.id},mode),/used/);else assert.equal(action(s,seat,{type:'effect',id:c.id},mode).chain.gilded,prior+1);
   p.champions[0].ready=true;s=action(s,seat,{type:'effect',id:c.id},mode);assert.equal((seat?s.ai:s.player).champions[0].ready,false);assert.equal(s.chain.gilded,prior+2);
  }else assert.ok(p.discard.some(x=>x.id===c.id));
 }
});
for(const mode of ['solo','online'])for(const seat of [0,1])test(`${mode}, seat ${seat}: Medusa price, cleanse, rounding, limits and dial`,()=>{
 for(const relation of ['neutral','own','opponent'])for(const n of [0,1,2,3,6]){
  let s=setup(seat);const side=seat?'ai':'player',other=seat?'player':'ai',p=s[side];s.legends.gilded=relation==='neutral'?null:relation==='own'?side:other;
  const price=relation==='neutral'?4:relation==='own'?3:5;p.grendels=price;p.discard=[copper(),...Array.from({length:n},()=>token())];p.draw=[token()];p.hand=[token()];s[other].discard=[token()];
  s=action(s,seat,{type:'invoke',key:'gilded'},mode);assert.equal(s[side].grendels,0);assert.equal(s[side].power,Math.floor(n/2));assert.equal(s[side].discard.length,1);assert.equal(s[side].draw.length,1);assert.equal(s[side].hand.length,1);assert.equal(s[other].discard.length,1);assert.equal(s.legends.gilded,relation==='opponent'?null:side);assert.equal(s.invoked,true);
  if(mode==='online')assert.throws(()=>action(s,seat,{type:'invoke',key:'gilded'},mode),/unavailable/);else assert.equal(action(s,seat,{type:'invoke',key:'gilded'},mode)[side].power,Math.floor(n/2));
  s=setup(seat);s[side].grendels=3;const before=JSON.stringify(s);if(mode==='online')assert.throws(()=>action(s,seat,{type:'invoke',key:'gilded'},mode),/unavailable/);else assert.equal(JSON.stringify(action(s,seat,{type:'invoke',key:'gilded'},mode)),before);
 }
});
test('Villagers: cannot play, do not combo, start-turn rests before forced discard, no replacement draw, both online seats',()=>{
 for(const seat of [0,1]){
  let s=setup(seat),side=seat?'ai':'player',other=seat?'player':'ai';s[side].hand=[token('blocked')];assert.throws(()=>createEngine().move(s,seat,{type:'play',id:'blocked'}),/cannot be played/);
  const soloState=action(s,seat,{type:'play',id:'blocked'},'solo');assert.equal(soloState[side].hand.length,1);assert.deepEqual(soloState.chain,{});
  s[other].hand=[token('start'),copper(),copper()];s[other].pendingDiscards=2;
  s=createEngine().move(s,seat,{type:'end'});assert.equal(s[other].hand.length,2);assert.equal(s[other].discard[0].id,'start');assert.equal(s.choice.remaining,2);
  const view=createEngine().view(s,seat);assert.ok(view.ai.hand.every(c=>c.hidden&&!c.name));assert.equal(view.ai.discard[0].name,'Petrified Villager');
 }
});
test('no retroactive combos; bought cards rest; starter and token supply; all approved art exists',()=>{
 let s=setup();const med=make('Medusa'),asp=make('Asp');s.player.hand=[med,asp];s=createEngine().move(s,0,{type:'play',id:med.id});s=createEngine().move(s,0,{type:'play',id:asp.id});assert.equal(s.player.power,0);assert.equal(s.ai.discard.length,1);
 s.player.grendels=99;for(const raw of cases.slice(1)){const c=make(raw[0]);s.market=[c];s=createEngine().move(s,0,{type:'buy',id:c.id});assert.ok(s.player.discard.some(x=>x.id===c.id));assert.ok(!s.player.hand.some(x=>x.id===c.id));}
 const fresh=createEngine().create(selected,['A','B']);for(const p of [fresh.player,fresh.ai])assert.equal([...p.hand,...p.draw].filter(c=>c.name==='Asp').length,1);
 assert.ok(![...fresh.market,...fresh.marketDeck].some(c=>['Asp','Petrified Villager'].includes(c.name)));
 const defs=vm.runInContext('GORGON_CARDS.map(c=>c[7])',solo);for(const slug of [...defs,'petrified-villager'])assert.ok(fs.statSync(new URL('../assets/gorgon/'+slug+'.png',import.meta.url)).size>0);
});
test('solo Play all and Rival turns finish with unplayable mid-turn draws',async()=>{
 solo.snapshot=setup();vm.runInContext(`Object.assign(state,snapshot);state.player.hand=[petrifiedVillager(),basic()];motion.busy=false;`,solo);
 await vm.runInContext("$('#playAll').onclick()",solo);assert.equal(vm.runInContext('state.player.hand.length',solo),1);assert.equal(vm.runInContext('state.player.grendels',solo),1);
 vm.runInContext(`state.turn='ai';state.ai.hand=[createCard(GORGON_CARDS.find(c=>c[0]==='Cursed Reflection'),'gilded')];state.ai.draw=[petrifiedVillager()];state.ai.discard=[];state.market=[];state.marketDeck=[];state.player.hand=[petrifiedVillager(),basic()];state.chain={};`,solo);
 await vm.runInContext('aiTurn()',solo);assert.equal(vm.runInContext('state.turn',solo),'player');assert.equal(vm.runInContext('state.player.hand.length',solo),1);assert.equal(vm.runInContext('state.player.discard.filter(isPetrifiedVillager).length',solo),1);
});
