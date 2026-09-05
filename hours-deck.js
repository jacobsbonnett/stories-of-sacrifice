// Keeper of Hours: persistent Time, Rewind, and Champion suspension.
const HOURS_CARDS=[
 ['Second Hand',0,'action','grendels',1,'Effect: Gain 1 Grendel.',0,'second-hand'],
 ['Aion, Keeper of Hours',8,'champion','hours',0,'Effect: Gain 2 Power and 1 Time. Combo: Rewind 1. Combo 2: Spend up to 3 Time. Gain 2 Power per Time spent.',4,'aion-keeper-of-hours'],
 ['The Last Tomorrow',7,'action','hours',0,'Effect: Gain 4 Power. Combo: Gain 1 Time. Combo 2: If you have 3 Time, draw 2 cards.',0,'the-last-tomorrow'],
 ['Pendulum Warden',6,'champion','hours',0,'Effect: Gain 1 Time. Combo: Gain 2 Power. Combo 2: Suspend an opposing Champion.',3,'pendulum-warden'],
 ['Borrowed Hour',6,'action','hours',0,'Effect: Draw 1 card. Combo: Gain 1 Time. Combo 2: Rewind 1.',0,'borrowed-hour'],
 ['Sands Unfallen',5,'action','hours',0,'Effect: Gain 2 Power. Combo: Gain 1 Time. Combo 2: Draw 1 card.',0,'sands-unfallen'],
 ['Clockwork Sentinel',5,'champion','hours',0,'Effect: Gain 1 Power. Combo: Gain 1 Time. Combo 2: Suspend an opposing Champion.',3,'clockwork-sentinel'],
 ['Moment Between Bells',5,'action','hours',0,'Effect: Gain 2 Grendels. Combo: Gain 2 Power. Combo 2: Gain 2 Time.',0,'moment-between-bells'],
 ['Rewind the Thread',4,'action','hours',0,'Effect: Rewind 1. Combo: Gain 1 Power. Combo 2: Gain 1 Time.',0,'rewind-the-thread'],
 ['Stolen Second',4,'action','hours',0,'Effect: Gain 1 Time. Combo: Gain 2 Grendels. Combo 2: Gain 2 Power.',0,'stolen-second'],
 ['Hourglass Fracture',4,'action','hours',0,'Effect: Gain 3 Power. Combo: Spend 1 Time: Draw 1 card. Combo 2: Gain 2 Power.',0,'hourglass-fracture'],
 ['Glimpse Beyond Midnight',3,'action','hours',0,'Effect: Draw 1 card. Combo: Gain 1 Time. Combo 2: Gain 1 Power.',0,'glimpse-beyond-midnight']
];
const hoursDefinition=c=>c?.suit==='hours'?HOURS_CARDS.find(r=>r[0]===c.name):null;
Object.assign(CHRONICLES.hours,{name:'The Keeper of Hours',legend:'Sera Vey, Keeper of Hours',color:'#228fd0',pitch:'Gather Time, rewind cards you have played, and suspend rival Champions.',start:{name:'Second Hand',effect:'grendels',value:1,text:'Effect: Gain 1 Grendel.'},cards:HOURS_CARDS.slice(1)});
SUIT_COLORS.hours='#228fd0';

function gainTime(p,n){p.time=Math.min(9,(p.time||0)+n);}
function hoursRewindCards(p){return p.discard.filter(c=>(p.playedThisTurn||[]).includes(c.id)&&c.suit==='hours'&&c.type==='action'&&!c.returnToStock);}
function completeHoursChoice(){const done=pendingCardChoice?.resolve;pendingCardChoice=null;const d=$('#hoursChoiceDialog');if(d?.open)d.close();render();if(done)done();}
function resolveHoursChoice(id){
 const q=pendingCardChoice;if(!q||!['hours-rewind','hours-suspend'].includes(q.kind))return false;
 const p=q.isAI?state.ai:state.player,foe=q.isAI?state.player:state.ai;
 if(q.kind==='hours-rewind'){const i=p.discard.findIndex(c=>c.id===id&&(p.playedThisTurn||[]).includes(c.id));if(i<0)return false;p.hand.push(...p.discard.splice(i,1));}
 else{const c=foe.champions.find(c=>c.id===id);if(!c)return false;c.suspendedTurns=1;c.ready=false;}
 completeHoursChoice();return true;
}
function showHoursChoice(){
 const q=pendingCardChoice;if(!q||q.isAI)return;let d=$('#hoursChoiceDialog');
 if(!d){d=document.createElement('dialog');d.id='hoursChoiceDialog';d.innerHTML='<h2></h2><p></p><div class="hours-choice-cards"></div><button class="hours-choice-skip" type="button">Skip</button>';document.body.append(d);d.oncancel=e=>e.preventDefault();}
 const cards=q.kind==='hours-rewind'?hoursRewindCards(state.player):state.ai.champions;
 d.querySelector('h2').textContent=q.kind==='hours-rewind'?'Rewind — return a played card to your hand':'Suspend — choose an opposing Champion';
 d.querySelector('p').textContent=q.kind==='hours-rewind'?'Choose an Hours action you played earlier this turn. Replaying it starts a new activation.':'That Champion cannot use its Effect on its next turn.';
 d.querySelector('.hours-choice-cards').replaceChildren(...cards.map(c=>{const b=document.createElement('button');b.className='hours-choice-card';const img=document.createElement('img');img.src=cardArtwork(c);img.alt='';const t=document.createElement('span');t.textContent=`${c.name} — ${c.text}`;b.append(img,t);b.onclick=()=>resolveHoursChoice(c.id);return b;}));
 const skip=d.querySelector('.hours-choice-skip');skip.hidden=cards.length>0;skip.onclick=completeHoursChoice;if(!d.open)d.showModal();
}
function openHoursChoice(kind,p,isAI=false){
 const cards=kind==='hours-rewind'?hoursRewindCards(p):(isAI?state.player:state.ai).champions;if(!cards.length)return false;
 if(isAI){const c=[...cards].sort((a,b)=>(b.cost||0)-(a.cost||0))[0];if(kind==='hours-rewind'){p.discard.splice(p.discard.indexOf(c),1);p.hand.push(c);}else{c.suspendedTurns=1;c.ready=false;}return true;}
 cardChoiceFinished=new Promise(resolve=>{pendingCardChoice={kind,isAI:false,resolve};});showHoursChoice();return true;
}
const applyBeforeHours=apply;
apply=function(p,c,isAI=false){
 if(!hoursDefinition(c))return applyBeforeHours(p,c,isAI);
 const count=state.chain.hours=(state.chain.hours||0)+1;
 if(c.name==='Aion, Keeper of Hours'){p.power+=2;gainTime(p,1);}
 if(c.name==='The Last Tomorrow')p.power+=4;
 if(c.name==='Pendulum Warden')gainTime(p,1);
 if(c.name==='Borrowed Hour')draw(p,1);
 if(c.name==='Sands Unfallen')p.power+=2;
 if(c.name==='Clockwork Sentinel')p.power++;
 if(c.name==='Moment Between Bells')p.grendels+=2;
 if(c.name==='Rewind the Thread')openHoursChoice('hours-rewind',p,isAI);
 if(c.name==='Stolen Second')gainTime(p,1);
 if(c.name==='Hourglass Fracture')p.power+=3;
 if(c.name==='Glimpse Beyond Midnight')draw(p,1);
 if(count>=3){
  if(c.name==='Aion, Keeper of Hours'){const spent=Math.min(3,p.time||0);p.time-=spent;p.power+=spent*2;}
  if(c.name==='The Last Tomorrow'&&(p.time||0)>=3)draw(p,2);
  if(['Pendulum Warden','Clockwork Sentinel'].includes(c.name))openHoursChoice('hours-suspend',p,isAI);
  if(c.name==='Borrowed Hour')openHoursChoice('hours-rewind',p,isAI);
  if(c.name==='Sands Unfallen')draw(p,1);
  if(c.name==='Moment Between Bells')gainTime(p,2);
  if(c.name==='Rewind the Thread')gainTime(p,1);
  if(['Stolen Second','Hourglass Fracture'].includes(c.name))p.power+=2;
  if(c.name==='Glimpse Beyond Midnight')p.power++;
 }else if(count>=2){
  if(c.name==='Aion, Keeper of Hours')openHoursChoice('hours-rewind',p,isAI);
  if(['The Last Tomorrow','Pendulum Warden','Borrowed Hour','Sands Unfallen','Clockwork Sentinel','Glimpse Beyond Midnight'].includes(c.name))gainTime(p,1);
  if(['Pendulum Warden','Clockwork Sentinel','Moment Between Bells'].includes(c.name))p.power+=2;
  if(c.name==='Rewind the Thread')p.power++;
  if(c.name==='Stolen Second')p.grendels+=2;
  if(c.name==='Hourglass Fracture'&&(p.time||0)>0){p.time--;draw(p,1);}
 }
};
const activateBeforeHours=activateChampion;
activateChampion=function(i,isAI=false){const p=isAI?state.ai:state.player,c=p.champions[i];if(c?.suspendedTurns){c.suspendedTurns=0;c.ready=false;if(!isAI){log(`${c.name} is suspended outside time this turn.`);render();}return false;}return activateBeforeHours(i,isAI);};
function seraCost(isAI=false){const owner=state.legends.hours,side=isAI?'ai':'player';return !owner?4:owner===side?3:5;}
const invokeBeforeHours=invoke;
invoke=function(key,isAI=false,...args){if(key!=='hours')return invokeBeforeHours(key,isAI,...args);const p=isAI?state.ai:state.player,side=isAI?'ai':'player',other=isAI?'player':'ai',cost=seraCost(isAI);if(state.invoked||state.turn!==side||p.grendels<cost)return false;p.grendels-=cost;gainTime(p,2);draw(p,1);state.legends.hours=state.legends.hours===other?null:side;state.invoked=true;if(!isAI){log(`Sera Vey: gained 2 Time and drew 1 card.`);render();}return typeof spendExtraInvocation==='function'?spendExtraInvocation(p,true):true;};
const legendTextBeforeHours=legendText;legendText=function(key){return key==='hours'?`Pay ${state.player?seraCost():4} Grendels: gain 2 Time and draw 1 card.`:legendTextBeforeHours(key);};
const artworkBeforeHours=cardArtwork;cardArtwork=function(c){const def=hoursDefinition(c);return def?`assets/hours/${def[7]}.png`:artworkBeforeHours(c);};
const renderBeforeHours=render;render=function(){renderBeforeHours();if(!state.player)return;let counter=$('#timeCounter');if(!counter){counter=document.createElement('div');counter.id='timeCounter';counter.className='resource-counter time-counter';counter.innerHTML='<span>Time</span><b>0</b><span class="time-symbol">⌛</span>';document.querySelector('.resources')?.append(counter);}counter.hidden=!state.selected.includes('hours');counter.querySelector('b').textContent=state.player.time||0;};
const panelBeforeHours=panel;panel=function(p,isAI){const html=panelBeforeHours(p,isAI);return state.selected.includes('hours')?html.replace('</div>',`<span>Time <b>${p.time||0}</b></span></div>`):html;};
const libraryBeforeHours=renderLibrary;renderLibrary=function(){libraryBeforeHours();$$('#libraryCards .library-card').forEach(el=>{const name=el.querySelector('h3')?.textContent,src=cardArtwork({name,suit:'hours'});if(!src||el.querySelector('.library-printed-card'))return;const img=document.createElement('img');img.src=src;img.alt=name;img.className='library-printed-card';el.prepend(img);});};
