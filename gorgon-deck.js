// Approved Gorgon's Curse cards. Shared by the browser and authoritative server.
const GORGON_CARDS=[
 ['Asp',0,'action','grendels',1,'Effect: Gain 1 Grendel.',0,'asp'],
 ['Medusa',8,'champion','petrify',1,"Effect: Petrify 1. Combo: Gain 2 Power. Combo 2: Gain Power equal to the number of Petrified Villagers in your opponent's deck and rest pile.",4,'medusa'],
 ["Gorgon's Gaze",6,'action','petrify',1,'Effect: Petrify 1. Combo: Gain 2 Power. Combo 2: Petrify 1.',0,'gorgons-gaze'],
 ['Garden of Stone',6,'action','grendels',2,'Effect: Gain 2 Grendels. Combo: Petrify 1. Combo 2: Gain 3 Power.',0,'garden-of-stone'],
 ['Stheno',6,'champion','power',2,'Effect: Gain 2 Power. Combo: Petrify 1. Combo 2: Gain 2 Power.',4,'stheno'],
 ['Euryale',5,'champion','grendels',1,'Effect: Gain 1 Grendel. Combo: Gain 2 Power. Combo 2: Petrify 1.',3,'euryale'],
 ["Serpent's Bite",5,'action','power',3,'Effect: Gain 3 Power. Combo: Gain 1 Grendel. Combo 2: Gain 2 Power.',0,'serpents-bite'],
 ['Stone Curse',4,'action','petrify',1,'Effect: Petrify 1. Combo: Gain 2 Power.',0,'stone-curse'],
 ["Gorgon's Lair",4,'action','grendels',2,'Effect: Gain 2 Grendels. Combo: Gain 1 Power. Combo 2: Draw 1 card.',0,'gorgons-lair'],
 ['Coiling Serpents',4,'action','grendels',1,'Effect: Gain 1 Grendel. Combo: Gain 2 Power. Combo 2: Petrify 1.',0,'coiling-serpents'],
 ['Hall of Statues',3,'action','power',1,"Effect: Gain 1 Power. Combo: Gain 1 Grendel. Combo 2: Gain 1 Power for every 3 Petrified Villagers in your opponent's deck and rest pile.",0,'hall-of-statues'],
 ['Cursed Reflection',3,'action','draw',1,'Effect: Draw 1 card. Combo: Gain 1 Power. Combo 2: Petrify 1.',0,'cursed-reflection']
];
const VILLAGER_TEXT='Effect: No effect. Cannot be played. At the start of your turn, place this card in your rest pile.';
const gorgonDefinition=c=>c.suit==='gilded'?GORGON_CARDS.find(r=>r[0]===c.name):null;
const isPetrifiedVillager=c=>c.suit==='gilded'&&c.name==='Petrified Villager'&&c.type==='token';
function petrifiedVillager(){return card('Petrified Villager',0,'token','gilded','none',0,VILLAGER_TEXT);}
function restPetrifiedVillagers(p){
 const tokens=p.hand.filter(isPetrifiedVillager);
 p.hand=p.hand.filter(c=>!isPetrifiedVillager(c));p.discard.push(...tokens);
 return tokens.length;
}
Object.assign(CHRONICLES.gilded,{name:"The Gilded Gorgon — Gorgon's Curse",legend:'Medusa',color:'#278b51',pitch:'Petrify the opposing deck, build green combos, and cleanse your Rest pile.',start:{name:'Asp',effect:'grendels',value:1,text:'Effect: Gain 1 Grendel.'},cards:GORGON_CARDS.slice(1)});
SUIT_COLORS.gilded='#278b51';
const applyBeforeGorgon=apply;
apply=function(p,c,isAI=false){
 if(isPetrifiedVillager(c))return;
 if(!gorgonDefinition(c))return applyBeforeGorgon(p,c,isAI);
 const count=state.chain.gilded=(state.chain.gilded||0)+1;
 const foe=isAI?state.player:state.ai;
 const petrify=()=>foe.discard.push(petrifiedVillager());
 if(c.effect==='grendels')p.grendels+=c.value;
 if(c.effect==='power')p.power+=c.value;
 if(c.effect==='draw')draw(p,c.value);
 if(c.effect==='petrify')petrify();
 const hasCombo2=!['Asp','Stone Curse'].includes(c.name);
 if(count>=2&&!(count>=3&&hasCombo2)){
  if(['Medusa',"Gorgon's Gaze",'Euryale','Stone Curse','Coiling Serpents'].includes(c.name))p.power+=2;
  if(['Garden of Stone','Stheno'].includes(c.name))petrify();
  if(["Serpent's Bite",'Hall of Statues'].includes(c.name))p.grendels++;
  if(["Gorgon's Lair",'Cursed Reflection'].includes(c.name))p.power++;
 }
 if(count>=3){
  if(['Medusa','Hall of Statues'].includes(c.name)){
   const n=[...foe.draw,...foe.discard].filter(isPetrifiedVillager).length;
   p.power+=c.name==='Medusa'?n:Math.floor(n/3);
  }
  if(["Gorgon's Gaze",'Euryale','Coiling Serpents','Cursed Reflection'].includes(c.name))petrify();
  if(c.name==='Garden of Stone')p.power+=3;
  if(['Stheno',"Serpent's Bite"].includes(c.name))p.power+=2;
  if(c.name==="Gorgon's Lair")draw(p,1);
 }
};
const playBeforeGorgon=playCard;
playCard=function(i,isAI=false){if(!canPlayCard((isAI?state.ai:state.player)?.hand[i]))return false;return playBeforeGorgon(i,isAI);};
const discardBeforeGorgon=resolveStartOfTurnDiscards;
resolveStartOfTurnDiscards=async function(p,isAI=false){restPetrifiedVillagers(p);return discardBeforeGorgon(p,isAI);};
function medusaCost(isAI=false){const owner=state.legends.gilded;return !owner?4:owner===(isAI?'ai':'player')?3:5;}
function medusaUnavailable(isAI=false){
 const p=isAI?state.ai:state.player;
 if(!p||state.over)return 'No active match.';
 if(state.turn!==(isAI?'ai':'player'))return 'Wait for your turn.';
 if(state.invoked)return 'Invocation used this turn';
 if(pendingCardChoice)return 'Finish choosing a card first.';
 return p.grendels<medusaCost(isAI)?`Requires ${medusaCost(isAI)} Grendels`:'';
}
const invokeBeforeGorgon=invoke;
invoke=function(key,isAI=false,...args){
 if(key!=='gilded')return invokeBeforeGorgon(key,isAI,...args);
 if(!state.selected.includes(key)||medusaUnavailable(isAI))return false;
 const p=isAI?state.ai:state.player,cost=medusaCost(isAI),removed=p.discard.filter(isPetrifiedVillager).length;
 p.grendels-=cost;p.discard=p.discard.filter(c=>!isPetrifiedVillager(c));p.power+=Math.floor(removed/2);
 const caller=isAI?'ai':'player',opponent=isAI?'player':'ai';
 state.legends.gilded=state.legends.gilded===opponent?null:caller;state.invoked=true;
 if(!isAI){log(`Medusa: paid ${cost} Grendels, removed ${removed} Petrified Villagers, gained ${Math.floor(removed/2)} Power.`);render();}
 return true;
};
const legendBeforeGorgon=legendText;
legendText=function(key){return key==='gilded'?`Pay ${state.player?medusaCost():4} Grendels: remove all Petrified Villagers from your Rest pile. Gain 1 Power per 2 removed (rounded down).`:legendBeforeGorgon(key);};
const artworkBeforeGorgon=cardArtwork;
cardArtwork=function(c){if(isPetrifiedVillager(c))return 'assets/gorgon/petrified-villager.png';const def=gorgonDefinition(c);return def?`assets/gorgon/${def[7]}.png`:artworkBeforeGorgon(c);};
const entriesBeforeGorgon=libraryEntries;
libraryEntries=function(key){const entries=entriesBeforeGorgon(key);if(key==='gilded')entries.push({name:'Petrified Villager',cost:'Created',type:'Token',text:VILLAGER_TEXT,qty:'Created by Petrify'});return entries;};
const libraryBeforeGorgon=renderLibrary;
renderLibrary=function(){libraryBeforeGorgon();$$('#libraryCards .library-card').forEach(el=>{const name=el.querySelector('h3')?.textContent;const src=cardArtwork({name,suit:'gilded',type:name==='Petrified Villager'?'token':'action'});if(!src||el.querySelector('.library-printed-card'))return;const img=document.createElement('img');img.src=src;img.alt=name;img.className='library-printed-card';el.prepend(img);});};
const renderBeforeGorgon=render;
render=function(){
 renderBeforeGorgon();if(!state.player)return;
 const index=state.selected.indexOf('gilded'),el=$$('#legends .legend')[index];
 if(index>=0&&el){const p=el.querySelector('p'),status=p.querySelector('.allegiance-status');p.textContent=legendText('gilded');if(status)p.append(status);const b=el.querySelector('button'),reason=medusaUnavailable();b.disabled=!!reason;b.textContent=reason||`Invoke · ${medusaCost()} Grendels`;b.title=reason||legendText('gilded');}
 $$('#hand .card').forEach(el=>{const c=state.player.hand.find(c=>c.id===el.dataset.motionId);if(c&&isPetrifiedVillager(c)){el.setAttribute('aria-disabled','true');el.title=VILLAGER_TEXT;}});
};
