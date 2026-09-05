// Approved Golden Deceiver cards, coin flips, Paid Combos, and Vaelis invocation.
const GOLDEN_CARDS=[
 ['Street Urchin',0,'action','grendels',1,'Effect: Gain 1 Grendel.',0,'street-urchin'],
 ['Golden Deceiver',8,'champion','grendels',3,'Effect: Gain 3 Grendels. Combo: Your next card purchase this turn costs 2 Grendels less. Combo 2: Convert all your current Grendels directly into Prestige.',3,'golden-deceiver'],
 ['The Gambler',6,'action','flip',0,'Effect: Flip a coin. Heads: Gain 4 Grendels. Tails: Lose 2 Grendels. Combo: Gain 2 Power. Combo 2: Flip a coin. Heads: Draw 2 cards. Tails: Discard 1 card.',0,'the-gambler'],
 ["Fool's Gold",6,'action','grendels',3,'Effect: Gain 3 Grendels. Combo: Gain 1 Power. Paid Combo: Pay 2 Grendels: Gain 4 Power.',0,'fools-gold'],
 ['Golden Opportunity',5,'action','grendels',2,'Effect: Gain 2 Grendels. Combo: Your next card purchase this turn costs 1 Grendel less. Combo 2: Your next card purchase this turn costs an additional 1 Grendel less.',0,'golden-opportunity'],
 ['Loaded Dice',5,'action','grendels',2,'Effect: Gain 2 Grendels. Combo: Gain 1 Grendel. Paid Combo: Pay 2 Grendels: Draw 1 card.',0,'loaded-dice'],
 ['Sleight of Hand',4,'action','grendels',2,'Effect: Gain 2 Grendels. Combo: Draw 1 card. Paid Combo: Pay 1 Grendel: Gain 2 Power.',0,'sleight-of-hand'],
 ['Shady Deal',4,'action','grendels',2,'Effect: Gain 2 Grendels. Combo: Your next card purchase this turn costs 1 Grendel less. Paid Combo: Pay 2 Grendels: Gain 3 Power.',0,'shady-deal'],
 ['Double or Nothing',4,'action','flip',0,'Effect: Flip a coin. Heads: Gain 4 Grendels. Tails: Gain nothing. Combo: Gain 1 Power. Combo 2: Gain 2 Power.',0,'double-or-nothing'],
 ['Hidden Ace',4,'action','grendels',1,'Effect: Gain 1 Grendel. Combo: Gain 2 Grendels. Paid Combo: Pay 2 Grendels: Draw 1 card.',0,'hidden-ace'],
 ['Quick Fingers',3,'action','grendels',1,'Effect: Gain 1 Grendel. Combo: Your next card purchase this turn costs 1 Grendel less. Combo 2: Gain 2 Power.',0,'quick-fingers'],
 ['Lucky Break',3,'action','grendels',1,'Effect: Gain 1 Grendel. Combo: Flip a coin. Heads: Gain 3 Grendels. Tails: Gain 1 Power.',0,'lucky-break']
];
const goldenDefinition=c=>c.suit==='velvet'?GOLDEN_CARDS.find(r=>r[0]===c.name):null;
Object.assign(CHRONICLES.velvet,{name:'The Golden Deceiver',legend:'Vaelis, Lord of Masks',color:'#d5a916',pitch:'Wager on coin flips, negotiate Paid Combos, and bend the cost of the Crossroads.',start:{name:'Street Urchin',effect:'grendels',value:1,text:'Effect: Gain 1 Grendel.'},cards:GOLDEN_CARDS.slice(1)});
SUIT_COLORS.velvet='#d5a916';
function goldenFlip(p){const result=p.forcedFlip||((Math.random()<.5)?'heads':'tails');p.forcedFlip=null;p.lastFlip=result;return result;}
const PAID_GOLDEN={"Fool's Gold":{cost:2,kind:'power',value:4},'Loaded Dice':{cost:2,kind:'draw',value:1},'Sleight of Hand':{cost:1,kind:'power',value:2},'Shady Deal':{cost:2,kind:'power',value:3},'Hidden Ace':{cost:2,kind:'draw',value:1}};
function resolveGoldenChoice(value){
 const q=pendingCardChoice;if(!q||!['golden-paid','golden-discard','vaelis-flip'].includes(q.kind))return false;const p=q.isAI?state.ai:state.player;
 if(q.kind==='golden-paid'&&value==='pay'){if(p.grendels<q.effect.cost)return false;p.grendels-=q.effect.cost;q.effect.kind==='power'?p.power+=q.effect.value:draw(p,q.effect.value);}
 else if(q.kind==='golden-discard'){const i=p.hand.findIndex(c=>c.id===value);if(i<0)return false;p.discard.push(...p.hand.splice(i,1));}
 else if(q.kind==='vaelis-flip'){if(!['heads','tails'].includes(value))return false;p.forcedFlip=value;}
 const done=q.resolve;pendingCardChoice=null;const d=$('#goldenChoiceDialog');if(d?.open)d.close();render();if(done)done();return true;
}
function showGoldenChoice(){
 const q=pendingCardChoice;if(!q||q.isAI)return;let d=$('#goldenChoiceDialog');
 if(!d){d=document.createElement('dialog');d.id='goldenChoiceDialog';d.innerHTML='<h2></h2><img class="golden-choice-card" alt=""><p></p><div class="golden-choice-actions"></div>';document.body.append(d);d.oncancel=e=>e.preventDefault();}
 const title=d.querySelector('h2'),img=d.querySelector('img'),text=d.querySelector('p'),actions=d.querySelector('div');actions.replaceChildren();
 if(q.kind==='golden-paid'){title.textContent=`${q.card.name} — Paid Combo`;img.hidden=false;img.src=cardArtwork(q.card);text.textContent=`${q.card.text} Pay ${q.effect.cost} Grendel${q.effect.cost===1?'':'s'} for the Paid Combo?`;for(const [label,value] of [['Pay','pay'],['Decline','decline']]){const b=document.createElement('button');b.textContent=label;b.onclick=()=>resolveGoldenChoice(value);actions.append(b);}}
 else if(q.kind==='golden-discard'){title.textContent='The Gambler — Tails';img.hidden=false;img.src=cardArtwork(q.card);text.textContent=`${q.card.text} Choose 1 card from your hand to discard.`;for(const c of state.player.hand){const b=document.createElement('button');b.textContent=`${c.name} — ${c.text}`;b.onclick=()=>resolveGoldenChoice(c.id);actions.append(b);}}
 else{title.textContent='Vaelis — Choose the next coin flip';img.hidden=true;text.textContent='This hidden choice applies to your next coin flip this turn.';for(const value of ['heads','tails']){const b=document.createElement('button');b.textContent=value[0].toUpperCase()+value.slice(1);b.onclick=()=>resolveGoldenChoice(value);actions.append(b);}}
 if(!d.open)d.showModal();
}
function openGoldenChoice(kind,card,isAI=false,effect=null){
 const p=isAI?state.ai:state.player;if(kind==='golden-paid'&&p.grendels<effect.cost)return;if(kind==='golden-discard'&&!p.hand.length)return;
 if(isAI){if(kind==='golden-paid'){p.grendels-=effect.cost;effect.kind==='power'?p.power+=effect.value:draw(p,effect.value);}else if(kind==='golden-discard'){let i=0;for(let n=1;n<p.hand.length;n++)if(p.hand[n].cost<p.hand[i].cost)i=n;p.discard.push(...p.hand.splice(i,1));}else p.forcedFlip='heads';return;}
 cardChoiceFinished=new Promise(resolve=>{pendingCardChoice={kind,card,isAI:false,effect,resolve};});showGoldenChoice();
}
const applyBeforeGolden=apply;
apply=function(p,c,isAI=false){
 if(!goldenDefinition(c))return applyBeforeGolden(p,c,isAI);const count=state.chain.velvet=(state.chain.velvet||0)+1;
 if(c.effect==='grendels')p.grendels+=c.value;
 if(c.effect==='flip'){const result=goldenFlip(p);if(c.name==='The Gambler')result==='heads'?p.grendels+=4:p.grendels=Math.max(0,p.grendels-2);else if(c.name==='Double or Nothing'&&result==='heads')p.grendels+=4;}
 if(count>=3){
  if(c.name==='Golden Deceiver'){p.prestige+=p.grendels;p.grendels=0;}
  if(c.name==='The Gambler'){const r=goldenFlip(p);if(r==='heads')draw(p,2);else openGoldenChoice('golden-discard',c,isAI);}
  if(c.name==='Golden Opportunity')p.discount+=2;
  if(['Double or Nothing','Quick Fingers'].includes(c.name))p.power+=2;
 }else if(count>=2){
  if(c.name==='Golden Deceiver')p.discount+=2;if(c.name==='The Gambler')p.power+=2;if(c.name==='Double or Nothing')p.power++;
  if(['Golden Opportunity','Quick Fingers'].includes(c.name))p.discount++;
 }
 if(count>=2){
  if(c.name==="Fool's Gold")p.power++;if(c.name==='Loaded Dice')p.grendels++;if(c.name==='Sleight of Hand')draw(p,1);if(c.name==='Shady Deal')p.discount++;if(c.name==='Hidden Ace')p.grendels+=2;
  if(c.name==='Lucky Break'){const r=goldenFlip(p);r==='heads'?p.grendels+=3:p.power++;}
 }
 if(count>=2&&PAID_GOLDEN[c.name])openGoldenChoice('golden-paid',c,isAI,PAID_GOLDEN[c.name]);
};
const playBeforeGolden=playCard;playCard=function(i,isAI=false){const result=playBeforeGolden(i,isAI);if(pendingCardChoice&&!isAI)showGoldenChoice();return result;};
function vaelisCost(isAI=false){const owner=state.legends.velvet,side=isAI?'ai':'player';return !owner?3:owner===side?2:4;}
const invokeBeforeGolden=invoke;
invoke=function(key,isAI=false,...args){if(key!=='velvet')return invokeBeforeGolden(key,isAI,...args);const p=isAI?state.ai:state.player,side=isAI?'ai':'player',other=isAI?'player':'ai',cost=vaelisCost(isAI);if(state.invoked||state.turn!==side||p.grendels<cost||pendingCardChoice)return false;p.grendels-=cost;state.legends.velvet=state.legends.velvet===other?null:side;state.invoked=true;openGoldenChoice('vaelis-flip',null,isAI);if(!isAI){log(`Vaelis: paid ${cost} Grendels. Choose your next coin flip.`);render();}return typeof spendExtraInvocation==='function'?spendExtraInvocation(p,true):true;};
const legendTextBeforeGolden=legendText;legendText=function(key){return key==='velvet'?`Pay ${state.player?vaelisCost():3} Grendels: choose the result of your next coin flip this turn.`:legendTextBeforeGolden(key);};
const cleanupBeforeGolden=cleanup;cleanup=function(p){p.forcedFlip=null;p.lastFlip=null;return cleanupBeforeGolden(p);};
const artworkBeforeGolden=cardArtwork;cardArtwork=function(c){const def=goldenDefinition(c);return def?`assets/golden/${def[7]}.png`:artworkBeforeGolden(c);};
const libraryBeforeGolden=renderLibrary;renderLibrary=function(){libraryBeforeGolden();$$('#libraryCards .library-card').forEach(el=>{const name=el.querySelector('h3')?.textContent,src=cardArtwork({name,suit:'velvet'});if(!src||el.querySelector('.library-printed-card'))return;const img=document.createElement('img');img.src=src;img.alt=name;img.className='library-printed-card';el.prepend(img);});};
