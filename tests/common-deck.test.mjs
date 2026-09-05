import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import vm from 'node:vm';import {webcrypto} from 'node:crypto';
import {createEngine} from '../dist/server/engine.js';
const selected=['crimson','midnight','hours','velvet'];
const setup=()=>createEngine().create(selected,['Alice','Bob']);
const card=(s,name)=>[...s.market,...s.marketDeck].find(c=>c.name===name);
const champ=(id,type='champion',health=4)=>({id,name:id,cost:4,type,suit:'crimson',effect:'power',value:1,text:'Effect.',durability:health,maxHealth:health,ready:true});
const play=(s,seat,c)=>{const p=seat?s.ai:s.player;s.turn=seat?'ai':'player';p.hand=[c];return createEngine().move(s,seat,{type:'play',id:c.id});};
test('the new Common Purse stock replaces all placeholder commons and has approved costs/art',()=>{
 const s=setup(),expected={Butcher:3,Blacksmith:1,'Sword with the Red Hilt':2,'Sword of the Strange Hangings':3,Smuggler:2,Excalibur:5,'Strings of Fate':3,Weaver:3};
 const commons=[...s.market,...s.marketDeck].filter(c=>c.suit==='common');
 for(const [name,cost] of Object.entries(expected)){assert.equal(commons.filter(c=>c.name===name).length,3);assert.equal(commons.find(c=>c.name===name).cost,cost);}
 assert.ok(!commons.some(c=>['Open Market','Traveling Broker','Call in a Favor','Public Bounty','Copper','Silver'].includes(c.name)));
 for(const slug of ['butcher','blacksmith','sword-with-the-red-hilt','sword-of-the-strange-hangings','smuggler','excalibur','strings-of-fate','weaver','copper-grendel','silver-grendel'])assert.ok(fs.statSync(new URL('../assets/common/'+slug+'.png',import.meta.url)).size>0);
});
for(const seat of [0,1])test(`multiplayer seat ${seat}: direct Power and draw cards`,()=>{
 let s=setup(),p=seat?s.ai:s.player;copperDraw(s,p);
 let c=card(s,'Sword of the Strange Hangings');s=play(s,seat,c);p=seat?s.ai:s.player;assert.equal(p.power,3);assert.ok(p.discard.some(x=>x.id===c.id));
 c=card(s,'Excalibur');s=play(s,seat,c);assert.equal((seat?s.ai:s.player).power,7);
 c=card(s,'Smuggler');copperDraw(s,seat?s.ai:s.player);s=play(s,seat,c);assert.equal((seat?s.ai:s.player).hand.length,1);
});
function copperDraw(s,p){p.draw=[{id:crypto.randomUUID(),name:'Copper',cost:0,type:'action',suit:'common',effect:'grendels',value:1,text:'Effect.'}];}
for(const seat of [0,1])test(`multiplayer seat ${seat}: Butcher and red-hilt Sword select active targets`,()=>{
 let s=setup(),foe=seat?s.player:s.ai;foe.champions=[champ('one'),champ('two','guard'),champ('three')];let c=card(s,'Butcher');s=play(s,seat,c);assert.equal(s.choice.kind,'butcher');
 s=createEngine().move(s,seat,{type:'choose',id:'one'});assert.equal(s.choice.remaining,1);s=createEngine().move(s,seat,{type:'choose',done:true});assert.equal(s.choice,null);foe=seat?s.player:s.ai;assert.deepEqual(foe.champions.map(c=>c.id),['two','three']);assert.equal(foe.discard[0].id,'one');
 c=card(s,'Sword with the Red Hilt');s=play(s,seat,c);assert.equal(s.choice.kind,'red-hilt');s=createEngine().move(s,seat,{type:'choose',id:'two'});foe=seat?s.player:s.ai;assert.equal(s.choice,null);assert.deepEqual(foe.champions.map(c=>c.id),['three']);assert.ok(foe.discard.some(c=>c.id==='two'));
 // With only one target, Butcher removes just that one and completes automatically.
 c=card(s,'Butcher');s=play(s,seat,c);s=createEngine().move(s,seat,{type:'choose',id:'three'});assert.equal(s.choice,null);assert.equal((seat?s.player:s.ai).champions.length,0);
 c=card(s,'Butcher');s=play(s,seat,c);assert.equal(s.choice,null,'no enemy Agents means no target prompt');
});
for(const seat of [0,1])test(`multiplayer seat ${seat}: Blacksmith replaces or keeps a Crossroads card`,()=>{
 let s=setup(),c=card(s,'Blacksmith');s=play(s,seat,c);assert.equal(s.choice.kind,'blacksmith');const ids=s.market.map(c=>c.id),target=ids[0];s=createEngine().move(s,seat,{type:'choose',id:target});assert.equal(s.choice,null);assert.equal(s.market.length,5);assert.ok(!s.market.some(c=>c.id===target));
 c=card(s,'Blacksmith');s=play(s,seat,c);const same=s.market.map(c=>c.id);s=createEngine().move(s,seat,{type:'choose',done:true});assert.deepEqual(s.market.map(c=>c.id),same);
});
for(const seat of [0,1])test(`multiplayer seat ${seat}: Strings permanently destroys from Rest or field`,()=>{
 let s=setup(),p=seat?s.ai:s.player,c=card(s,'Strings of Fate');p.discard=[{id:'rest',name:'Copper',suit:'common',type:'action'}];s=play(s,seat,c);assert.equal(s.choice.kind,'strings');s=createEngine().move(s,seat,{type:'choose',id:'rest'});p=seat?s.ai:s.player;assert.ok(!p.discard.some(c=>c.id==='rest'));
 p.champions=[champ('field')];c=card(s,'Strings of Fate');s=play(s,seat,c);s=createEngine().move(s,seat,{type:'choose',id:'field'});assert.equal((seat?s.ai:s.player).champions.length,0);assert.ok(!(seat?s.ai:s.player).discard.some(c=>c.id==='field'));
});
for(const seat of [0,1])test(`multiplayer seat ${seat}: Weaver grants exactly one additional invocation before or after the first`,()=>{
 for(const weaverFirst of [true,false]){let s=setup(),p=seat?s.ai:s.player;p.grendels=5;p.power=2;p.discard=[{id:'copper',name:'Copper',suit:'common',type:'action'}];const w=card(s,'Weaver');
  if(weaverFirst)s=play(s,seat,w);else s.turn=seat?'ai':'player';
  s=createEngine().move(s,seat,{type:'invoke',key:'crimson'});assert.equal(s.invoked,!weaverFirst);
  if(!weaverFirst)s=play(s,seat,w);
  assert.equal(s.invoked,false);s=createEngine().move(s,seat,{type:'exchange'});assert.equal(s.invoked,true);p=seat?s.ai:s.player;assert.equal(p.extraInvocations,0);assert.ok(p.discard.some(c=>c.name==='Silver'));
  assert.throws(()=>createEngine().move(s,seat,{type:'invoke',key:'crimson'}),/unavailable/);
 }
});
test('solo browser path pauses for targets and resolves selections without affecting the other hand',()=>{
 const elements=new Map();const node=()=>({children:[],dataset:{},style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},append(...x){this.children.push(...x)},prepend(){},replaceChildren(...x){this.children=x},setAttribute(){},querySelector(){return node()},showModal(){this.open=true},close(){this.open=false}});
 const cx=vm.createContext({document:{body:node(),querySelector:s=>{if(!elements.has(s))elements.set(s,node());return elements.get(s)},querySelectorAll:()=>[],createElement:node},crypto:webcrypto,console,setTimeout,matchMedia:()=>({matches:true}),addEventListener(){}});cx.window=cx;
 for(const f of ['game.js','crimson-deck.js','midnight-deck.js','gorgon-deck.js','common-deck.js'])vm.runInContext(fs.readFileSync(new URL('../'+f,import.meta.url),'utf8'),cx);vm.runInContext(`render=()=>{};log=()=>{};state.selected=${JSON.stringify(selected)};state.player=makePlayer('You');state.ai=makePlayer('Rival');state.turn='player';state.over=false;state.market=[];state.marketDeck=[];state.legends={};state.chain={};state.invoked=false;state.ai.hand=[basic()];state.ai.champions=[{id:'a',name:'A',type:'champion',durability:3},{id:'b',name:'B',type:'guard',durability:2}];state.player.hand=[commonCard(COMMON_CROSSROADS.find(c=>c[0]==='Butcher'))];`,cx);
 vm.runInContext('playCard(0)',cx);assert.equal(vm.runInContext('pendingCardChoice.kind',cx),'butcher');vm.runInContext("resolveCommonChoice('a')",cx);vm.runInContext("resolveCommonChoice('b')",cx);assert.equal(vm.runInContext('state.ai.champions.length',cx),0);assert.equal(vm.runInContext('state.ai.hand.length',cx),1);assert.equal(vm.runInContext('pendingCardChoice',cx),null);
});
