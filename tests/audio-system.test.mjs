import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=fs.readFileSync(path.join(root,'audio-manager.js'),'utf8');

class MockAudio{
 static played=[];
 constructor(src){this.src=src;this.listeners={};}
 addEventListener(name,fn){this.listeners[name]=fn;}
 play(){MockAudio.played.push({src:this.src,volume:this.volume});return Promise.resolve();}
}
const storage=new Map();
const nodes=new Map();
function node(id=''){return{id,value:'',checked:false,open:false,style:{},classList:{},setAttribute(k,v){this[k]=v},addEventListener(){},querySelector(){return node()},showModal(){this.open=true},close(){this.open=false},closest(){return null}}}
const document={readyState:'complete',querySelector(selector){if(!nodes.has(selector))nodes.set(selector,node(selector));return nodes.get(selector)},addEventListener(){}};
const state={player:{hand:[],draw:[],discard:[],champions:[],grendels:0,power:0,prestige:0},ai:{hand:[],draw:[],discard:[],champions:[],grendels:0,power:0,prestige:0},market:[],legends:{},turn:'player'};
const context={Audio:MockAudio,document,state,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},performance:{now:()=>Date.now()},setTimeout,globalThis:null,render(){},buy(){return false}};
context.globalThis=context;vm.runInNewContext(source,context,{filename:'audio-manager.js'});

test('central manager exposes categorized settings and persists them',()=>{
 assert.ok(context.AudioManager);
 context.AudioManager.set('master',.35);
 assert.equal(JSON.parse(storage.get('stories-of-sacrifice-audio-v1')).master,.35);
});

test('actual state changes produce card and resource sounds',()=>{
 context.render();
 state.player.hand.push({id:'c1',name:'Copper',suit:'common',type:'action'});
 state.player.grendels=1;
 context.render();
 assert.ok(MockAudio.played.some(x=>x.src.includes('/cards/draw-')));
 assert.ok(MockAudio.played.some(x=>x.src.includes('/currency/grendel-gain-')));
});

test('mute prevents playback and an invalid purchase is routed centrally',()=>{
 const before=MockAudio.played.length;
 context.AudioManager.set('muted',true);
 context.buy(0);
 assert.equal(MockAudio.played.length,before);
});

test('every manifest path refers to a bundled audio file',()=>{
 for(const match of source.matchAll(/['`](assets\/audio\/[^'`]+\.ogg)['`]/g))assert.ok(fs.existsSync(path.join(root,match[1])),`Missing ${match[1]}`);
});
