// Central, event-driven sound system. Gameplay code reports state through render;
// this observer only responds after a real, authoritative state change.
(function(){
'use strict';
const STORAGE_KEY='stories-of-sacrifice-audio-v1';
const manifest={
 uiClick:{files:['assets/audio/ui/click-1.ogg','assets/audio/ui/click-2.ogg','assets/audio/ui/click-3.ogg'],volume:.32,cooldown:45,maxVoices:2},
 uiHover:{files:['assets/audio/ui/hover-1.ogg'],volume:.16,cooldown:110,maxVoices:1},invalid:{files:['assets/audio/ui/invalid.ogg'],volume:.48,cooldown:180},confirm:{files:['assets/audio/ui/confirm.ogg'],volume:.48},
 cardDraw:{files:['assets/audio/cards/draw-1.ogg','assets/audio/cards/draw-2.ogg'],volume:.48,cooldown:75,maxVoices:2},cardPlay:{files:['assets/audio/cards/play-1.ogg','assets/audio/cards/play-2.ogg'],volume:.54,cooldown:65,maxVoices:3},cardRest:{files:['assets/audio/cards/rest.ogg'],volume:.34,cooldown:100},cardShuffle:{files:['assets/audio/cards/shuffle.ogg'],volume:.38,cooldown:500},restToDraw:{files:['assets/audio/cards/rest-to-draw.ogg'],volume:.5,cooldown:120},
 grendelGain:{files:['assets/audio/currency/grendel-gain-1.ogg','assets/audio/currency/grendel-gain-2.ogg'],volume:.48,cooldown:80,maxVoices:2},grendelSpend:{files:['assets/audio/currency/grendel-spend-1.ogg','assets/audio/currency/grendel-spend-2.ogg'],volume:.5,cooldown:80,maxVoices:2},prestige:{files:['assets/audio/currency/prestige.ogg'],volume:.48,cooldown:100},purchase:{files:['assets/audio/ui/confirm.ogg'],volume:.52,cooldown:120},
 powerGain:{files:['assets/audio/combat/power-gain.ogg'],volume:.4,cooldown:80},sword:{files:['assets/audio/combat/sword-1.ogg','assets/audio/combat/sword-2.ogg'],volume:.62,cooldown:100},damage:{files:['assets/audio/combat/damage-1.ogg','assets/audio/combat/damage-2.ogg'],volume:.64,cooldown:100,maxVoices:2},catapult:{files:['assets/audio/combat/catapult.ogg'],volume:.7},barricade:{files:['assets/audio/combat/barricade.ogg'],volume:.58},
 championSummon:{files:['assets/audio/champions/summon.ogg'],volume:.62},championDamaged:{files:['assets/audio/champions/damaged.ogg'],volume:.58},championDefeated:{files:['assets/audio/champions/defeated.ogg'],volume:.72},championHeal:{files:['assets/audio/champions/heal.ogg'],volume:.56},
 magic:{files:['assets/audio/magic/spell.ogg'],volume:.48,cooldown:100},petrify:{files:['assets/audio/magic/petrify.ogg'],volume:.65},soul:{files:['assets/audio/magic/soul.ogg'],volume:.55},trickster:{files:['assets/audio/magic/trickster.ogg'],volume:.52},favor:{files:['assets/audio/magic/dial.ogg'],volume:.55},treasure:{files:['assets/audio/magic/treasure-open.ogg'],volume:.58},reward:{files:['assets/audio/magic/reward.ogg'],volume:.55},
 turnStart:{files:['assets/audio/turns/start.ogg'],volume:.46,cooldown:350},turnEnd:{files:['assets/audio/turns/end.ogg'],volume:.4,cooldown:350},victory:{files:['assets/audio/results/victory.ogg'],volume:.72},defeat:{files:['assets/audio/results/defeat.ogg'],volume:.66}
};
const defaults={master:.8,sfx:.8,music:.5,muted:false};
class SoundManager{
 constructor(){this.settings=this.load();this.lastPlayed=new Map();this.active=new Map();this.lastState=null;this.enabled=typeof Audio!=='undefined';this.lastHover=null;}
 load(){try{return{...defaults,...JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}}catch{return{...defaults}}}
 save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(this.settings))}catch{}}
 set(name,value){if(!(name in defaults))return;this.settings[name]=name==='muted'?!!value:Math.max(0,Math.min(1,Number(value)));this.save();this.syncControls();}
 play(name,options={}){const def=manifest[name];if(!def||!this.enabled||this.settings.muted||this.settings.master<=0||this.settings.sfx<=0)return false;const now=performance.now(),last=this.lastPlayed.get(name)||-Infinity;if(now-last<(def.cooldown||0))return false;const voices=this.active.get(name)||0;if(voices>=(def.maxVoices||1))return false;const file=def.files[Math.floor(Math.random()*def.files.length)];let audio;try{audio=new Audio(file)}catch{return false}audio.preload='auto';audio.volume=Math.min(1,this.settings.master*this.settings.sfx*(options.volume??def.volume??1));audio.playbackRate=options.rate||(.97+Math.random()*.06);this.lastPlayed.set(name,now);this.active.set(name,voices+1);const done=()=>this.active.set(name,Math.max(0,(this.active.get(name)||1)-1));audio.addEventListener('ended',done,{once:true});audio.addEventListener('error',done,{once:true});const promise=audio.play();if(promise?.catch)promise.catch(done);return true;}
 snapshot(s){if(!s?.player||!s?.ai)return null;const player=s.player,ai=s.ai;return{turn:s.turn,over:!!s.over,winner:s.winner,invoked:!!s.invoked,message:s.message||'',legends:{...(s.legends||{})},market:(s.market||[]).map(c=>({id:c.id,name:c.name,suit:c.suit,type:c.type})),player:this.playerSnapshot(player),ai:this.playerSnapshot(ai)};}
 playerSnapshot(p){return{grendels:p.grendels||0,power:p.power||0,prestige:p.prestige||0,time:p.time||0,hand:(p.hand||[]).map(this.card),draw:(p.draw||[]).map(this.card),discard:(p.discard||[]).map(this.card),champions:(p.champions||[]).map(this.card)};}
 card(c){return{id:c.id,name:c.name,suit:c.suit,type:c.type,durability:c.durability,currentHealth:c.currentHealth,health:c.health};}
 ids(cards){return new Set(cards.map(c=>c.id));}
 added(before,after){const old=this.ids(before);return after.filter(c=>!old.has(c.id));}
 removed(before,after){const next=this.ids(after);return before.filter(c=>!next.has(c.id));}
 themed(card){if(!card)return;if(/catapult/i.test(card.name))this.play('catapult');else if(/barricade/i.test(card.name))this.play('barricade');else if(/sword|assassin|battering ram|excalibur/i.test(card.name))this.play('sword');if(card.suit==='gilded'||/gorgon|medusa|stone|petrif|serpent|asp/i.test(card.name))this.play('petrify');else if(card.suit==='ashen'||/soul|judgment|verdict|beyond|fate/i.test(card.name))this.play('soul');else if(card.suit==='velvet'||/gambler|dice|gold|deceit|sleight|shady|lucky/i.test(card.name))this.play('trickster');else if(card.suit==='hours')this.play('magic');}
 comparePlayer(oldP,newP,isPlayer){
  const handAdded=this.added(oldP.hand,newP.hand),handRemoved=this.removed(oldP.hand,newP.hand),drawAdded=this.added(oldP.draw,newP.draw),discardAdded=this.added(oldP.discard,newP.discard),champAdded=this.added(oldP.champions,newP.champions),champRemoved=this.removed(oldP.champions,newP.champions);
  const returnedToDraw=drawAdded.some(c=>oldP.discard.some(d=>d.id===c.id));
  if(handAdded.length){const explicitlyRecovered=handAdded.some(c=>oldP.discard.some(d=>d.id===c.id))&&/rewind|recover|from Rest|Anukar/i.test(this.lastState?.message||'');this.play(explicitlyRecovered?'restToDraw':'cardDraw');}
  if(returnedToDraw)this.play('restToDraw');
  if(handRemoved.length){const played=handRemoved.find(c=>newP.discard.some(d=>d.id===c.id)||newP.champions.some(d=>d.id===c.id));if(played){this.play('cardPlay');this.themed(played);}}
  if(discardAdded.some(c=>oldP.hand.some(h=>h.id===c.id)))this.play('cardRest');
  if(champAdded.length){this.play('championSummon');this.themed(champAdded[0]);}
  if(champRemoved.length){this.play('championDefeated');this.play('damage');}
  for(const c of newP.champions){const old=oldP.champions.find(x=>x.id===c.id);if(!old)continue;const oh=old.currentHealth??old.health??old.durability,nh=c.currentHealth??c.health??c.durability;if(nh<oh){this.play('championDamaged');this.play('damage')}else if(nh>oh)this.play('championHeal');}
  if(newP.grendels>oldP.grendels)this.play('grendelGain');else if(newP.grendels<oldP.grendels)this.play('grendelSpend');
  if(newP.power>oldP.power)this.play('powerGain');
  if(newP.prestige>oldP.prestige){this.play('prestige');this.play('reward');}
  if(!returnedToDraw&&newP.draw.length>oldP.draw.length&&newP.discard.length<oldP.discard.length)this.play('cardShuffle');
  return{handRemoved,discardAdded};
 }
 observe(s){const next=this.snapshot(s);if(!next)return;if(!this.lastState){this.lastState=next;if(s.turn==='player')this.play('turnStart');return}const old=this.lastState;this.lastState=next;this.comparePlayer(old.player,next.player,true);this.comparePlayer(old.ai,next.ai,false);
  const marketRemoved=this.removed(old.market,next.market);if(marketRemoved.length){this.play('purchase');this.themed(marketRemoved[0]);}
  if(Object.keys(next.legends).some(k=>next.legends[k]!==old.legends[k]))this.play('favor');
  if(!old.invoked&&next.invoked)this.play('magic');
  if(next.turn!==old.turn){this.play('turnEnd');setTimeout(()=>this.play('turnStart'),180);}
  if(!old.over&&next.over)this.play(next.winner==='player'?'victory':'defeat');
  if(next.message!==old.message){if(/cannot|can't|need |not enough|unavailable|must |choose .*first/i.test(next.message))this.play('invalid');if(/Common Purse|Silver|exchange/i.test(next.message)){this.play('treasure');this.play('reward');}if(/Heads|Tails|coin flip/i.test(next.message))this.play('trickster');if(/Petrif/i.test(next.message))this.play('petrify');}
 }
 syncControls(){const map={master:['#masterVolume','#masterVolumeValue'],sfx:['#sfxVolume','#sfxVolumeValue'],music:['#musicVolume','#musicVolumeValue']};for(const [key,[inputId,outId]] of Object.entries(map)){const input=document.querySelector(inputId),out=document.querySelector(outId);if(input)input.value=Math.round(this.settings[key]*100);if(out)out.value=`${Math.round(this.settings[key]*100)}%`;}const mute=document.querySelector('#soundMuted'),button=document.querySelector('#soundSettingsButton');if(mute)mute.checked=this.settings.muted;if(button)button.setAttribute('aria-pressed',String(this.settings.muted));}
 bindUI(){const dialog=document.querySelector('#soundSettingsDialog'),open=document.querySelector('#soundSettingsButton');if(!dialog||!open)return;open.addEventListener('click',()=>{this.play('uiClick');dialog.showModal()});dialog.querySelector('.dialog-close').addEventListener('click',()=>{this.play('uiClick');dialog.close()});for(const key of ['master','sfx','music']){const cap=key[0].toUpperCase()+key.slice(1),input=document.querySelector(`#${key}Volume`);input?.addEventListener('input',()=>this.set(key,input.value/100));input?.addEventListener('change',()=>this.play('confirm'));}document.querySelector('#soundMuted')?.addEventListener('change',e=>{this.set('muted',e.target.checked);if(!e.target.checked)this.play('confirm')});document.addEventListener('click',e=>{const button=e.target.closest('button');if(!button||button===open||button.closest('#soundSettingsDialog')||button.closest('.card')||button.closest('.mini-champion')||button.closest('.legend')||['startGame','playAll','endTurn'].includes(button.id))return;if(button.matches('.dialog-close,.library-filters button,details button'))this.play('uiClick')});document.addEventListener('pointerover',e=>{const button=e.target.closest('.top-actions button,.library-filters button');if(button&&button!==this.lastHover){this.lastHover=button;this.play('uiHover')}});document.addEventListener('pointerout',e=>{if(e.target.closest('button')===this.lastHover)this.lastHover=null});this.syncControls();}
}
const manager=new SoundManager();globalThis.AudioManager=manager;
const previousRender=globalThis.render;if(typeof previousRender==='function')globalThis.render=function(...args){const value=previousRender.apply(this,args);manager.observe(typeof state!=='undefined'?state:null);return value;};
const previousBuy=globalThis.buy;if(typeof previousBuy==='function')globalThis.buy=function(...args){const result=previousBuy.apply(this,args);if(result===false)manager.play('invalid');else if(result?.then)result.then(ok=>{if(ok===false)manager.play('invalid')});return result;};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>manager.bindUI(),{once:true});else manager.bindUI();
})();
