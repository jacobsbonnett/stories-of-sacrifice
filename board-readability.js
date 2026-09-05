// Read-only previews remain available on either turn, even after using an Effect.
const championPreview=document.createElement('aside');championPreview.id='championPreview';championPreview.hidden=true;document.body.append(championPreview);
const inspectDialog=document.createElement('dialog');inspectDialog.id='inspectChampion';inspectDialog.setAttribute('aria-label','Champion details');
const inspectContent=document.createElement('div'),inspectClose=document.createElement('button');inspectClose.textContent='Close';inspectClose.onclick=()=>inspectDialog.close();inspectDialog.append(inspectContent,inspectClose);document.body.append(inspectDialog);
let inspectedChampion=null;
const restDialog=document.createElement('dialog');restDialog.id='inspectRest';restDialog.setAttribute('aria-labelledby','inspectRestTitle');
restDialog.innerHTML='<div class="rest-inspect-header"><div><p class="eyebrow">Your discarded cards</p><h2 id="inspectRestTitle">Your Rest pile</h2><p id="inspectRestSummary"></p></div><button class="dialog-close" aria-label="Close Rest pile">×</button></div><div id="inspectRestCards" class="rest-inspect-cards"></div>';
const restClose=restDialog.querySelector?.('.dialog-close');if(restClose)restClose.onclick=()=>restDialog.close();document.body.append(restDialog);
const flipDialog=document.createElement('dialog');flipDialog.id='coinFlipResult';flipDialog.setAttribute('aria-labelledby','coinFlipTitle');
flipDialog.innerHTML='<div class="coin-flip-stage"><div class="result-coin"><span class="result-coin-face result-heads">G</span><span class="result-coin-face result-tails">✦</span></div></div><p class="eyebrow">Coin flip</p><h2 id="coinFlipTitle"></h2><button class="coin-flip-close">Continue</button>';
const flipClose=flipDialog.querySelector?.('.coin-flip-close');if(flipClose)flipClose.onclick=()=>flipDialog.close();document.body.append(flipDialog);
let shownFlipSerial=0;
function showCoinFlipResult(){
 const serial=state.player?.flipSerial||0;if(!serial||serial===shownFlipSerial)return;shownFlipSerial=serial;
 const result=state.player.lastFlip;const coin=flipDialog.querySelector?.('.result-coin'),title=flipDialog.querySelector?.('#coinFlipTitle');
 if(coin){coin.classList.remove('land-heads','land-tails');void coin.offsetWidth;coin.classList.add(result==='heads'?'land-heads':'land-tails');}
 if(title)title.textContent=result==='heads'?'Heads — you won the flip!':'Tails — the flip landed on tails.';
 if(!flipDialog.open)flipDialog.showModal();
}
function showRestPile(){
 const cards=state.player?.discard||[],list=$('#inspectRestCards');
 $('#inspectRestSummary').textContent=cards.length?`${cards.length} card${cards.length===1?'':'s'}. Newly recruited cards wait here until your deck reshuffles.`:'No cards are resting right now.';
 list.replaceChildren(...cards.map(c=>{const item=document.createElement('article');item.className='rest-inspect-card';const src=cardArtwork(c);if(src){const img=document.createElement('img');img.src=src;img.alt=c.name;item.append(img);}const h=document.createElement('h3');h.textContent=c.name;const p=document.createElement('p');p.textContent=c.text;item.append(h,p);return item;}));
 if(!restDialog.open)restDialog.showModal();
}
function fillChampionDetails(container,c){
 container.replaceChildren();const imagePath=cardArtwork(c);
 if(imagePath){const img=document.createElement('img');img.src=imagePath;img.alt=c.name;container.append(img);}
 const title=document.createElement('h2');title.textContent=c.name;
 const stats=document.createElement('p');stats.textContent=`Cost: ${c.cost} Grendels · Health: ${c.durability}/${championMaxHealth(c)}`;stats.className=c.durability<championMaxHealth(c)?'damaged':'';
 const effects=document.createElement('p');effects.textContent=c.text;
 const status=document.createElement('p');status.textContent=c.ready?'Effect available on its owner’s turn.':'Effect used this turn.';
 container.append(title,stats,effects,status);
}
function inspectChampion(side,id){const c=state[side]?.champions.find(c=>c.id===id);if(!c)return;inspectedChampion={side,id};fillChampionDetails(inspectContent,c);championPreview.hidden=true;inspectDialog.showModal();}
const renderBeforeReadability=render;
render=function(){
 championPreview.hidden=true;renderBeforeReadability();if(!state.player)return;
 for(const side of ['player','ai'])document.querySelectorAll(`#${side==='ai'?'aiPanel':'playerPanel'} .mini-champion`).forEach((el,i)=>{
  const c=state[side].champions[i];if(!c)return;
  const show=()=>{fillChampionDetails(championPreview,c);championPreview.hidden=false;const rect=el.getBoundingClientRect(),width=championPreview.offsetWidth,height=championPreview.offsetHeight;championPreview.style.left=`${Math.max(8,Math.min(rect.right+12,innerWidth-width-8))}px`;championPreview.style.top=`${Math.max(8,Math.min(rect.top,innerHeight-height-8))}px`;};
  el.onmouseenter=show;el.onfocus=show;el.onmouseleave=()=>championPreview.hidden=true;el.onblur=()=>championPreview.hidden=true;
  const button=document.createElement('button');button.className='inspect-champion-button';button.textContent='Inspect';button.setAttribute('aria-label',`Inspect ${c.name}`);button.onclick=()=>inspectChampion(side,c.id);el.after(button);
 });
 if(inspectDialog.open&&inspectedChampion){const c=state[inspectedChampion.side].champions.find(c=>c.id===inspectedChampion.id);if(c)fillChampionDetails(inspectContent,c);else inspectContent.textContent='This Champion is no longer on the field.';}
 let target=document.querySelector('#prestigeTarget');if(!target){target=document.createElement('span');target.id='prestigeTarget';document.querySelector('.resources').append(target);}
 target.textContent=`Target: ${state.prestigeTarget||40} Prestige${state.finale?' · Response turn':''}`;
 const restPile=document.querySelector('#playerDiscard');if(restPile){restPile.classList.add('inspectable-pile');restPile.tabIndex=0;restPile.setAttribute('role','button');restPile.setAttribute('aria-label',`View your Rest pile, ${state.player.discard.length} cards`);restPile.onclick=showRestPile;restPile.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showRestPile();}};}
 if(restDialog.open)showRestPile();
 showCoinFlipResult();
};
