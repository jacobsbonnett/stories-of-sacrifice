// Transcribed from the twelve supplied Crimson Standard cards.
const CRIMSON_CARDS=[
  ['Barricade',0,'action','power',1,'Effect: Gain 1 Power.',0,'barricade'],
  ['City Gates',2,'action','power',2,'Effect: Gain 2 Power. Combo: Gain 1 Grendel.',0,'city-gates'],
  ["King’s Army",3,'action','grendels',2,'Effect: Gain 2 Grendels. Combo: Gain 3 Power.',0,'kings-army'],
  ["Hero’s Call",3,'action','grendels',2,'Effect: Gain 2 Grendels. Combo: Gain 2 Power. Combo 2: Draw 1 card.',0,'heros-call'],
  ['Battering Rams',4,'action','power',3,'Effect: Gain 3 Power. Combo: Gain 1 Grendel.',0,'battering-rams'],
  ['Catapult',4,'action','power',4,'Effect: Gain 4 Power. Combo: Gain 1 Grendel.',0,'catapult'],
  ['The Assassin',5,'champion','grendels',1,'Effect: Gain 1 Grendel. Combo: Deal 2 damage to a chosen opposing Champion.',4,'assassin'],
  ['Galahad',5,'champion','power',3,'Effect: Gain 3 Power. Combo: Heal this Champion for 2 health.',5,'galahad'],
  ['Shield Maiden',6,'champion','power',1,'Effect: Gain 1 Power.',5,'shield-maiden'],
  ['Graveyard',6,'action','power',5,'Effect: Gain 5 Power. Combo: Gain 2 Power.',0,'graveyard'],
  ['Muster',8,'action','power',4,'Effect: Gain 4 Power. Combo: Draw 2 cards.',0,'muster'],
  ['Joan of Ark',9,'champion','power',3,'Effect: Gain 3 Power.',5,'joan-of-ark']
];
const crimsonDefinition=c=>c.suit==='crimson'?CRIMSON_CARDS.find(r=>r[0]===c.name):null;
CHRONICLES.crimson.start={name:'Barricade',effect:'power',value:1,text:'Effect: Gain 1 Power.'};
CHRONICLES.crimson.cards=CRIMSON_CARDS.slice(1);
function championMaxHealth(c){return c.maxHealth??c.durability;}
function damageChampion(owner,id,amount){
  const index=owner.champions.findIndex(c=>c.id===id);if(index<0)return false;
  const c=owner.champions[index];c.maxHealth??=c.durability;
  c.durability=Math.max(0,c.durability-amount);
  if(c.durability===0){owner.champions.splice(index,1);owner.discard.push(c);}
  return true;
}
let pendingCardChoice=null;
let cardChoiceFinished=Promise.resolve();
function chooseAssassinTarget(isAI){
  const foe=isAI?state.player:state.ai;if(!foe.champions.length)return;
  if(isAI){const target=[...foe.champions].sort((a,b)=>a.durability-b.durability)[0];damageChampion(foe,target.id,2);return;}
  const dialog=$('#championTargetDialog'),list=$('#championTargets');list.replaceChildren();
  cardChoiceFinished=new Promise(resolve=>{pendingCardChoice={resolve,foe};});
  for(const c of foe.champions){
    const button=document.createElement('button');button.type='button';button.className='common-choice-card';
    const img=document.createElement('img');img.src=cardArtwork(c);img.alt='';
    const name=document.createElement('strong');name.textContent=c.name;
    const effect=document.createElement('span');effect.textContent=`${c.durability}/${championMaxHealth(c)} health → ${Math.max(0,c.durability-2)} health · ${c.text}`;
    button.append(img,name,effect);button.setAttribute('aria-label',`${c.name}. ${effect.textContent}`);
    button.onclick=()=>resolveAssassinTarget(c.id);list.append(button);
  }
  dialog.oncancel=e=>e.preventDefault();dialog.showModal();
}
function resolveAssassinTarget(id){
  if(!pendingCardChoice||pendingCardChoice.kind==='law-discard'||state.over||state.turn!=='player')return false;
  if(!damageChampion(pendingCardChoice.foe,id,2))return false;
  const done=pendingCardChoice.resolve;pendingCardChoice=null;
  $('#championTargetDialog').close();render();done();return true;
}
const applyBeforeCrimson=apply;
apply=function(p,c,isAI=false){
  if(!crimsonDefinition(c))return applyBeforeCrimson(p,c,isAI);
  const count=state.chain.crimson=(state.chain.crimson||0)+1;
  if(c.effect==='power')p.power+=c.value;
  if(c.effect==='grendels')p.grendels+=c.value;
  // Only this activation's bonuses resolve. Prior cards are never revisited.
  if(count>=2&&!(count>=3&&c.name==='Hero’s Call')){
    if(['City Gates','Battering Rams','Catapult'].includes(c.name))p.grendels++;
    if(c.name==='King’s Army')p.power+=3;
    if(c.name==='Hero’s Call')p.power+=2;
    if(c.name==='Graveyard')p.power+=2;
    if(c.name==='Muster')draw(p,2);
    if(c.name==='Galahad')c.durability=Math.min(championMaxHealth(c),c.durability+2);
    if(c.name==='The Assassin')chooseAssassinTarget(isAI);
  }
  if(count>=3&&c.name==='Hero’s Call')draw(p,1);
};
const playBeforeCrimson=playCard;
playCard=function(i,isAI=false){
  if(pendingCardChoice)return false;
  const p=isAI?state.ai:state.player,c=p?.hand[i];
  if(!c||state.over||state.turn!==(isAI?'ai':'player'))return false;
  if(c.type!=='champion'&&c.type!=='guard')return playBeforeCrimson(i,isAI);
  p.hand.splice(i,1);c.maxHealth??=c.durability;c.durability=c.maxHealth;
  c.ready=false;p.champions.push(c);apply(p,c,isAI);
  if(!isAI){log(`${c.name}: placement Effect resolved.`);render();}
  return true;
};
const effectBeforeCrimson=activateChampion;
activateChampion=function(i,isAI=false){if(pendingCardChoice)return false;return effectBeforeCrimson(i,isAI);};
attackChampion=function(i){
  if(pendingCardChoice)return false;
  const c=state.ai.champions[i];if(!c||state.player.power<=0)return false;
  if(state.ai.champions.some(x=>x.type==='guard')&&c.type!=='guard'){log('A Guard protects that Champion.');return false;}
  const damage=Math.min(state.player.power,c.durability);state.player.power-=damage;
  damageChampion(state.ai,c.id,damage);log(`Dealt ${damage} damage to ${c.name}.`);render();return true;
};
const renderCardBeforeCrimson=renderCard;
function cardArtwork(c){
 const crimson=crimsonDefinition(c);if(crimson)return `assets/crimson/${crimson[7]}.png`;
 const midnight=typeof midnightDefinition==='function'?midnightDefinition(c):null;
 return midnight?`assets/midnight/${midnight[7]}.png`:null;
}
renderCard=function(c,mode,i){
  const element=renderCardBeforeCrimson(c,mode,i),def=cardArtwork(c);
  if(def){
    element.classList.add('illustrated-card');
    const image=document.createElement('img');image.className='printed-card';image.src=def;image.alt='';
    element.prepend(image);element.setAttribute('aria-label',`${c.name}. Cost ${c.cost}. ${c.text}`);
    element.title=`${c.name} · ${c.cost} Grendels · ${c.text}`;
  }
  return element;
};
const panelBeforeCrimson=panel;
panel=function(p,isAI){
  const html=panelBeforeCrimson(p,isAI);
  return html.replace(/<span class="mini-champion[^]*?<\/span>/g,(_,offset)=>{
    // The base panel supplies one span per Champion in stable order.
    const prior=html.slice(0,offset).match(/class="mini-champion/g)?.length||0;
    const c=p.champions[prior],def=cardArtwork(c),max=championMaxHealth(c);
    const label=isAI?'Attack':c.ready?'Effect':'Effect used';
    return `<button class="mini-champion ${c.type==='guard'?'guard':''} ${def?'champion-art':''}" data-i="${prior}" title="${c.name}: ${c.text}" aria-label="${c.name}, ${c.durability} of ${max} health. ${label}">${def?`<img src="${def}" alt="${c.name}">`:`<span>${c.name}</span>`}<b class="current-health ${c.durability<max?'damaged':''}">${c.durability}</b><span class="effect-status">${label}</span></button>`;
  });
};
const renderLibraryBeforeCrimson=renderLibrary;
renderLibrary=function(){
  renderLibraryBeforeCrimson();
  $$('#libraryCards .library-card').forEach(el=>{
    const name=el.querySelector('h3')?.textContent;
    const src=cardArtwork({name,suit:'crimson'})||cardArtwork({name,suit:'midnight'});if(!src)return;
    const img=document.createElement('img');img.src=src;img.alt=name;img.className='library-printed-card';el.prepend(img);
  });
};
