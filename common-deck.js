// Approved neutral Crossroads cards. These rules run in solo and authoritative multiplayer.
const COMMON_CROSSROADS=[
 ['Butcher',3,'action','common','none',0,"Effect: Place up to 2 of your opponent's active Agents into their Rest pile.",'butcher'],
 ['Blacksmith',1,'action','common','none',0,'Effect: Replace up to 1 card from the Crossroads.','blacksmith'],
 ['Sword with the Red Hilt',2,'action','common','none',0,"Effect: Place 1 of your opponent's active Champions into their Rest pile.",'sword-with-the-red-hilt'],
 ['Sword of the Strange Hangings',3,'action','common','power',3,'Effect: Gain 3 Power.','sword-of-the-strange-hangings'],
 ['Smuggler',2,'action','common','draw',1,'Effect: Draw 1 card.','smuggler'],
 ['Excalibur',5,'action','common','power',4,'Effect: Gain 4 Power.','excalibur'],
 ['Strings of Fate',3,'action','common','none',0,'Effect: Destroy 1 of your cards in play or in your Rest pile.','strings-of-fate'],
 ['Weaver',3,'action','common','weaver',1,'Effect: You may invoke 1 additional Legend this turn.','weaver']
];
const commonDefinition=c=>c.suit==='common'?COMMON_CROSSROADS.find(r=>r[0]===c.name):null;
function commonCard(raw){const c=card(raw[0],raw[1],raw[2],raw[3],raw[4],raw[5],raw[6]);c.artSlug=raw[7];return c;}
function commonChoiceCards(kind,p,foe){
 if(kind==='butcher'||kind==='red-hilt')return foe.champions;
 if(kind==='blacksmith')return state.market;
 if(kind==='strings')return [...p.champions,...p.discard];
 return [];
}
function completeCommonChoice(){
 const done=pendingCardChoice?.resolve;pendingCardChoice=null;
 const dialog=$('#commonChoiceDialog');if(dialog?.open)dialog.close();render();if(done)done();
}
function resolveCommonChoice(id){
 const choice=pendingCardChoice;if(!choice||!['butcher','red-hilt','blacksmith','strings'].includes(choice.kind))return false;
 const p=choice.isAI?state.ai:state.player,foe=choice.isAI?state.player:state.ai;
 if(choice.kind==='butcher'||choice.kind==='red-hilt'){
  const i=foe.champions.findIndex(c=>c.id===id);if(i<0)return false;foe.discard.push(...foe.champions.splice(i,1));choice.remaining--;
  if(choice.kind==='red-hilt'||!choice.remaining||!foe.champions.length)completeCommonChoice();
 }else if(choice.kind==='blacksmith'){
  const i=state.market.findIndex(c=>c.id===id);if(i<0)return false;state.marketDeck.push(...state.market.splice(i,1));shuffle(state.marketDeck);refill();completeCommonChoice();
 }else{
  let i=p.champions.findIndex(c=>c.id===id);if(i>=0)p.champions.splice(i,1);
  else{i=p.discard.findIndex(c=>c.id===id);if(i<0)return false;p.discard.splice(i,1);}completeCommonChoice();
 }
 if(pendingCardChoice)showCommonChoice();else render();return true;
}
function showCommonChoice(){
 const choice=pendingCardChoice;if(!choice||choice.isAI)return;
 let dialog=$('#commonChoiceDialog');
 if(!dialog){dialog=document.createElement('dialog');dialog.id='commonChoiceDialog';dialog.innerHTML='<h2></h2><p></p><div class="choice-list"></div><button class="choice-done">Done</button>';document.body.append(dialog);dialog.oncancel=e=>e.preventDefault();}
 const p=state.player,foe=state.ai,cards=commonChoiceCards(choice.kind,p,foe);
 const labels={butcher:'Butcher — choose up to 2 active Agents',blacksmith:'Blacksmith — replace a Crossroads card',strings:'Strings of Fate — destroy one of your cards','red-hilt':'Sword with the Red Hilt — choose a Champion'};
 dialog.querySelector('h2').textContent=labels[choice.kind];dialog.querySelector('p').textContent=choice.kind==='butcher'?`${choice.remaining} selection${choice.remaining===1?'':'s'} remaining.`:'Choose a card.';
 dialog.querySelector('.choice-list').replaceChildren(...cards.map(c=>{const b=document.createElement('button');if(choice.kind==='blacksmith'){b.className='common-choice-card';const img=document.createElement('img');img.src=cardArtwork(c);img.alt='';const name=document.createElement('strong');name.textContent=c.name;const effect=document.createElement('span');effect.textContent=c.text;b.append(img,name,effect);b.setAttribute('aria-label',`${c.name}. ${c.text}`);}else b.textContent=`${c.name}${c.durability?` — ${c.durability} health`:''}`;b.onclick=()=>resolveCommonChoice(c.id);return b;}));
 const done=dialog.querySelector('.choice-done');done.hidden=!['butcher','blacksmith'].includes(choice.kind);done.onclick=completeCommonChoice;
 if(!dialog.open)dialog.showModal();
}
function openCommonChoice(kind,isAI=false){
 const p=isAI?state.ai:state.player,foe=isAI?state.player:state.ai,cards=commonChoiceCards(kind,p,foe);
 if(!cards.length)return;
 if(isAI){
  const count=kind==='butcher'?Math.min(2,cards.length):1;
  for(let n=0;n<count;n++){
   const current=commonChoiceCards(kind,p,foe);if(!current.length)break;
   const target=kind==='blacksmith'?current[Math.floor(Math.random()*current.length)]:kind==='strings'?current.find(c=>c.name==='Copper')||current[0]:[...current].sort((a,b)=>(b.durability||0)-(a.durability||0))[0];
   if(kind==='blacksmith'){state.marketDeck.push(...state.market.splice(state.market.indexOf(target),1));shuffle(state.marketDeck);refill();}
   else if(kind==='strings'){const list=p.champions.includes(target)?p.champions:p.discard;list.splice(list.indexOf(target),1);}
   else foe.discard.push(...foe.champions.splice(foe.champions.indexOf(target),1));
  }
  return;
 }
 cardChoiceFinished=new Promise(resolve=>{pendingCardChoice={kind,isAI:false,remaining:kind==='butcher'?2:1,resolve};});
}
const applyBeforeCommonDeck=apply;
apply=function(p,c,isAI=false){
 const def=commonDefinition(c);if(!def)return applyBeforeCommonDeck(p,c,isAI);
 if(c.effect==='power')p.power+=c.value;
 else if(c.effect==='draw')draw(p,c.value);
 else if(c.effect==='weaver'){
  p.extraInvocations=(p.extraInvocations||0)+1;
  if(state.invoked){state.invoked=false;p.extraInvocations--;}
 }else if(c.name==='Butcher')openCommonChoice('butcher',isAI);
 else if(c.name==='Blacksmith')openCommonChoice('blacksmith',isAI);
 else if(c.name==='Sword with the Red Hilt')openCommonChoice('red-hilt',isAI);
 else if(c.name==='Strings of Fate')openCommonChoice('strings',isAI);
};
const playBeforeCommonDeck=playCard;
playCard=function(i,isAI=false){const result=playBeforeCommonDeck(i,isAI);if(pendingCardChoice&&!isAI)showCommonChoice();return result;};
function spendExtraInvocation(p,result){if(result&&state.invoked&&(p.extraInvocations||0)>0){p.extraInvocations--;state.invoked=false;}return result;}
const invokeBeforeWeaver=invoke;
invoke=function(key,isAI=false,...args){return spendExtraInvocation(isAI?state.ai:state.player,invokeBeforeWeaver(key,isAI,...args));};
const purseBeforeWeaver=invokeCommonPurse;
invokeCommonPurse=function(isAI=false,...args){return spendExtraInvocation(isAI?state.ai:state.player,purseBeforeWeaver(isAI,...args));};
const cleanupBeforeWeaver=cleanup;
cleanup=function(p){p.extraInvocations=0;return cleanupBeforeWeaver(p);};
const artworkBeforeCommonDeck=cardArtwork;
cardArtwork=function(c){
 if(c.suit==='common'&&['Copper','Copper Grendel'].includes(c.name))return 'assets/common/copper-grendel.png';
 if(c.suit==='common'&&['Silver','Silver Grendel'].includes(c.name))return 'assets/common/silver-grendel.png';
 const def=commonDefinition(c);return def?`assets/common/${def[7]}.png`:artworkBeforeCommonDeck(c);
};
COMMON_LIBRARY.splice(0,COMMON_LIBRARY.length,
 {name:'Copper Grendel',cost:'Starting',type:'Action',text:'Effect: Gain 1 Grendel.',qty:'6 per player'},
 {name:'Silver Grendel',cost:'Created',type:'Action',text:'Effect: Gain 2 Grendels.',qty:'Supply'},
 ...COMMON_CROSSROADS.map(raw=>({name:raw[0],cost:raw[1],type:'Action',text:raw[6],qty:3}))
);
const libraryBeforeCommonDeck=renderLibrary;
renderLibrary=function(){libraryBeforeCommonDeck();$$('#libraryCards .library-card').forEach(el=>{const name=el.querySelector('h3')?.textContent;const src=cardArtwork({name,suit:'common'});if(!src||el.querySelector('.library-printed-card'))return;const img=document.createElement('img');img.src=src;img.alt=name;img.className='library-printed-card';el.prepend(img);});};
