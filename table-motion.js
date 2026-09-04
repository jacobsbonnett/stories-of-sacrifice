// Presentation layer: public card movements, private rival hands, and paced turns.
const motion={busy:false,internal:false,known:false,previousHands:{player:[],ai:[]},previousDials:{}};
const reducedMotion=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const awaitingCardChoice=()=>typeof pendingCardChoice!=='undefined'&&!!pendingCardChoice;
const pause=(ms)=>new Promise(resolve=>setTimeout(resolve,reducedMotion()?0:ms));
function fanCards(container,opponent=false){
  const cards=[...container.children],n=cards.length;
  const cardWidth=cards[0]?.offsetWidth||(opponent?85:180);
  const step=Math.min(opponent?36:78,Math.max(8,(container.clientWidth-cardWidth)/Math.max(1,n-1)));
  cards.forEach((node,index)=>{const offset=index-(n-1)/2;node.style.setProperty('--fan-x',`${offset*step}px`);node.style.setProperty('--fan-y',`${Math.abs(offset)*5}px`);node.style.setProperty('--fan-angle',`${offset*Math.min(6,30/Math.max(1,n-1))}deg`);node.style.setProperty('--fan-z',index+1)});
}
function backCard(){const node=document.createElement('div');node.className='card card-back';node.setAttribute('aria-label','Face-down rival card');return node;}
function pileMarkup(player,kind){const cards=player[kind],top=cards.at(-1);return `<div class="pile-face ${kind==='draw'&&cards.length?'card-back':''} ${cards.length?'':'pile-empty'}">${kind==='discard'&&top?(player===state.ai?'Rest':top.name):''}</div><strong>${kind==='draw'?'Draw':'Rest'}</strong>${cards.length} cards`;}
function fly(source,from,to,delay=0){
  if(reducedMotion()||!from||!to||!from.width||!to.width)return;
  const ghost=source.cloneNode(true);ghost.removeAttribute('id');ghost.removeAttribute('tabindex');ghost.setAttribute('aria-hidden','true');ghost.classList.add('flying-card');
  Object.assign(ghost.style,{left:`${from.left}px`,top:`${from.top}px`,width:`${from.width}px`,height:`${from.height}px`});document.body.append(ghost);
  const dx=to.left-from.left,dy=to.top-from.top;
  const animation=ghost.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${dx*.55}px,${dy*.5-25}px) scale(.95)`,offset:.55,opacity:1},{transform:`translate(${dx}px,${dy}px) scale(${to.width/from.width},${to.height/from.height})`,opacity:0.6}],{duration:440,delay,easing:'cubic-bezier(.22,.7,.25,1)',fill:'backwards'});
  animation.finished.catch(()=>{}).finally(()=>ghost.remove());
}
const renderBeforeMotion=render;
render=function(){
  const old=new Map([...document.querySelectorAll('[data-motion-id]')].map(el=>[el.dataset.motionId,{node:el.cloneNode(true),rect:el.getBoundingClientRect(),zone:el.dataset.zone}]));
  renderBeforeMotion();if(!state.player)return;
  if(!$('#opponentHand'))$('#rivalCards').innerHTML='<div id="aiDraw" class="pile"></div><div id="opponentHand" class="opponent-hand" aria-label="Rival face-down hand"></div><div id="aiDiscard" class="pile"></div>';
  for(const [side,p] of [['player',state.player],['ai',state.ai]]){
    $(`#${side}Draw`).innerHTML=pileMarkup(p,'draw');$(`#${side}Discard`).innerHTML=pileMarkup(p,'discard');
    const hand=side==='player'?$('#hand'):$('#opponentHand');
    if(side==='ai')syncHandCards(hand,p.hand,()=>backCard());
    [...hand.children].forEach((el,i)=>{el.dataset.motionId=p.hand[i].id;el.dataset.zone=side; if(side==='player'){el.onclick=()=>playCard(state.player.hand.findIndex(c=>c.id===el.dataset.motionId));el.tabIndex=0;el.setAttribute('role','button');el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click()}}}});
    fanCards(hand,side==='ai');
    document.querySelectorAll(`#${side==='ai'?'aiPanel':'playerPanel'} .mini-champion`).forEach((el,i)=>{el.dataset.motionId=p.champions[i].id;el.dataset.zone='champion';});
  }
  [...$('#market').children].forEach((el,i)=>{el.dataset.motionId=state.market[i].id;el.dataset.zone='market';el.tabIndex=0;el.onkeydown=e=>{if(e.key==='Enter'){el.click()}}});
  $('#playedCards').replaceChildren();
  for(const [side,p] of [['player',state.player],['ai',state.ai]])for(const c of p.played){const el=document.createElement('div');el.className='played-card';el.dataset.motionId=c.id;el.dataset.zone='played';el.style.setProperty('--suit',SUIT_COLORS[c.suit]);el.textContent=c.name;el.title=c.text;$('#playedCards').append(el);}
  for(const [side,p] of [['player',state.player],['ai',state.ai]]){
    let delay=0;
    p.hand.forEach(c=>{if(!motion.known||!motion.previousHands[side].includes(c.id)){const el=document.querySelector(`[data-motion-id="${c.id}"]`);fly(side==='ai'?backCard():el,$(`#${side}Draw .pile-face`).getBoundingClientRect(),el.getBoundingClientRect(),delay);if(!reducedMotion())el.animate([{opacity:0},{opacity:1}],{duration:120,delay:delay+320,fill:'backwards'});delay+=95;}});
    motion.previousHands[side]=p.hand.map(c=>c.id);
  }
  for(const [id,previous] of old){const next=document.querySelector(`[data-motion-id="${id}"]`);if(next&&next.dataset.zone!==previous.zone){fly(next,previous.rect,next.getBoundingClientRect());}else if(!next){const side=state.player.discard.some(c=>c.id===id)?'player':state.ai.discard.some(c=>c.id===id)?'ai':null;if(side)fly(previous.node,previous.rect,$(`#${side}Discard .pile-face`).getBoundingClientRect());}}
  const angles={player:180,ai:0,neutral:90};
document.querySelectorAll('.legend-token').forEach((token,i)=>{if(token.classList.contains('character-token'))return;const key=state.selected[i],now=state.legends[key]||'neutral',before=motion.previousDials[key]||'neutral';if(now!==before&&!reducedMotion())token.querySelector('.dial-pointer').animate([{transform:`rotate(${angles[before]}deg)`},{transform:`rotate(${angles[now]}deg)`}],{duration:450,easing:'ease-out'});motion.previousDials[key]=now;});
  motion.known=true;
  if(motion.busy||state.turn!=='player'||state.over)document.querySelectorAll('#hand .card,#market .card,#legends button,#playAll,#endTurn').forEach(el=>{if(el.tagName==='BUTTON')el.disabled=true;});
};
// Protect asynchronous turns from clicks or keyboard actions changing the board midway.
for(const name of ['playCard','buy','activateChampion','attackChampion','invoke','invokeCommonPurse']){
  const original=window[name];window[name]=function(...args){const ai=args[name==='invokeCommonPurse'?0:1]===true;if(awaitingCardChoice())return false;if(!ai&&!motion.internal&&(motion.busy||state.turn!=='player'||state.over))return false;return original(...args);};
}
const startBeforeMotion=start;
start=function(){if(motion.busy||awaitingCardChoice())throw new Error('Wait for the current turn to finish.');motion.known=false;motion.previousHands={player:[],ai:[]};motion.previousDials={};state.legends={};startBeforeMotion();};
$('#startGame').onclick=()=>start();
async function discardAndDraw(p){
  returnUsedContracts(p);
  p.playedThisTurn=[];
  p.discard.push(...p.played.splice(0),...p.hand.splice(0));p.grendels=0;p.power=0;p.discount=0;p.champions.forEach(c=>c.ready=true);render();await pause(500);draw(p,5);render();await pause(900);
}
endTurn=async function(){
  if(awaitingCardChoice()||motion.busy||state.turn!=='player'||state.over)return;
  motion.busy=true;render();
  try{state.player.prestige+=state.player.power;state.player.power=0;if(checkWin('player'))return;await discardAndDraw(state.player);state.turn='ai';state.invoked=false;state.chain={};render();await aiTurn();}
  finally{motion.busy=false;render();}
};
aiTurn=async function(){
  if(typeof resolveStartOfTurnDiscards==='function')await resolveStartOfTurnDiscards(state.ai,true);
  log('The Rival plays its hand…');
  async function playRivalEffects(){
    while(!state.over){
      const playable=state.ai.hand.findIndex(canPlayCard);
      if(playable>=0){playCard(playable,true);render();await pause(620);continue;}
      const index=state.ai.champions.findIndex(c=>c.ready);if(index<0)break;
      activateChampion(index,true);render();await pause(250);
    }
  }
  await playRivalEffects();
  while(!state.over){const options=state.market.map((c,i)=>({c,i})).filter(x=>x.c.cost<=state.ai.grendels+state.ai.discount).sort((a,b)=>b.c.cost-a.c.cost);if(!options.length)break;if(!buy(options[0].i,true))break;render();await pause(500);await playRivalEffects();}
  for(const key of shuffle([...state.selected]))if(invoke(key,true)){render();await pause(500);break;}
  if(!state.invoked)invokeCommonPurse(true);
  while(state.ai.power>0&&state.player.champions.length){const guards=state.player.champions.some(c=>c.type==='guard');const index=state.player.champions.findIndex(c=>!guards||c.type==='guard');if(index<0)break;const target=state.player.champions[index],damage=Math.min(state.ai.power,target.durability);state.ai.power-=damage;if(typeof damageChampion==='function')damageChampion(state.player,target.id,damage);else{target.durability-=damage;if(!target.durability)state.player.discard.push(...state.player.champions.splice(index,1));}render();await pause(350);}
  state.ai.prestige+=state.ai.power;state.ai.power=0;if(checkWin('ai'))return;
  await discardAndDraw(state.ai);state.turn='player';state.invoked=false;state.chain={};
  if(typeof resolveStartOfTurnDiscards==='function')await resolveStartOfTurnDiscards(state.player);
  log('Your turn. The Crossroads await.');render();
};
$('#endTurn').onclick=()=>endTurn();
$('#playAll').onclick=async()=>{if(awaitingCardChoice()||motion.busy||state.turn!=='player'||state.over)return;motion.busy=true;try{while(state.player.hand.some(canPlayCard)){motion.internal=true;playCard(state.player.hand.findIndex(canPlayCard));motion.internal=false;render();if(awaitingCardChoice())await cardChoiceFinished;await pause(300);}}finally{motion.internal=false;motion.busy=false;render();}};
window.addEventListener('resize',()=>{if(state.player){fanCards($('#hand'));fanCards($('#opponentHand'),true)}});
