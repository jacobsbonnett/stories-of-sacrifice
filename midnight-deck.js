// Approved Midnight Parliament artwork and activation-time rules.
const MIDNIGHT_CARDS=[
 ['Puppy',0,'action','grendels',1,'Effect: Gain 1 Grendel.',0,'puppy'],
 ['Eagles Nest',6,'champion','grendels',1,'Effect: Gain 1 Grendel. Combo 2: Draw 1 card.',2,'eagles-nest'],
 ['Lions Pride',6,'champion','grendels',2,'Effect: Gain 2 Grendels. Combo 2: Draw 1 card.',2,'lions-pride'],
 ['Bears Decree',6,'champion','grendels',1,'Effect: Gain 1 Grendel. Combo 2: Gain 2 Grendels and 2 Power.',3,'bears-decree'],
 ['Law in Effect',4,'contract','draw',1,'On purchase: Play immediately, then return this card to the Crossroads stock. Effect: Draw 1 card. Combo 2: Opponent discards 1 card from their hand at the start of their turn.',0,'law-in-effect'],
 ['Wolf Pack',4,'action','grendels',1,'Effect: Gain 1 Grendel. Combo: Gain 2 Grendels and 2 Power. Combo 2: Gain 2 Power.',0,'wolf-pack'],
 ["Monkey's Deceit",6,'action','draw',1,'Effect: Draw 1 card. Combo 2: Draw 1 card.',0,'monkeys-deceit'],
 ['Sweeping Seagull',6,'action','draw',1,'Effect: Draw 1 card. Combo 2: Draw 1 card. Combo 3: Draw 1 card.',0,'sweeping-seagull'],
 ['Watering Hole',4,'action','power',2,'Effect: Gain 2 Power. Combo: Draw 1 card. Combo 3: Gain 3 Grendels.',0,'watering-hole'],
 ['Talon',4,'action','grendels',1,'Effect: Gain 1 Grendel. Combo: Gain 2 Grendels and 2 Power.',0,'talon'],
 ['Hyena Screech',6,'action','draw',1,'Effect: Draw 1 card. Combo 2: Draw 1 card. Combo 3: Gain 4 Power.',0,'hyena-screech'],
 ['Carnivorous Cat',4,'action','grendels',2,'Effect: Gain 2 Grendels. Combo: Draw 1 card.',0,'carnivorous-cat'],
 ['Racoons Horde',4,'action','grendels',2,'Effect: Gain 2 Grendels. Combo: Draw 1 card. Combo 2: Gain 1 Grendel.',0,'racoons-horde']
];
const midnightDefinition=c=>c.suit==='midnight'?MIDNIGHT_CARDS.find(r=>r[0]===c.name):null;
CHRONICLES.midnight.start={name:'Puppy',effect:'grendels',value:1,text:'Effect: Gain 1 Grendel.'};
CHRONICLES.midnight.cards=MIDNIGHT_CARDS.slice(1);
const applyBeforeMidnight=apply;
apply=function(p,c,isAI=false){
 if(!midnightDefinition(c))return applyBeforeMidnight(p,c,isAI);
 const count=state.chain.midnight=(state.chain.midnight||0)+1;
 if(c.effect==='grendels')p.grendels+=c.value;
 if(c.effect==='power')p.power+=c.value;
 if(c.effect==='draw')draw(p,c.value);
 if(count>=2){
  if(['Wolf Pack','Talon'].includes(c.name)){p.grendels+=2;p.power+=2;}
  if(['Watering Hole','Carnivorous Cat','Racoons Horde'].includes(c.name))draw(p,1);
 }
 if(count>=3){
  if(['Eagles Nest','Lions Pride',"Monkey's Deceit",'Sweeping Seagull','Hyena Screech'].includes(c.name))draw(p,1);
  if(c.name==='Bears Decree'){p.grendels+=2;p.power+=2;}
  if(c.name==='Wolf Pack')p.power+=2;
  if(c.name==='Racoons Horde')p.grendels++;
  if(c.name==='Law in Effect'){
   const foe=isAI?state.player:state.ai;
   foe.pendingDiscards=(foe.pendingDiscards||0)+1;
  }
 }
 if(count>=4){
  if(c.name==='Sweeping Seagull')draw(p,1);
  if(c.name==='Watering Hole')p.grendels+=3;
  if(c.name==='Hyena Screech')p.power+=4;
 }
};
const buyBeforeMidnight=buy;
buy=function(i,isAI=false){
 const p=isAI?state.ai:state.player,c=state.market[i];
 if(!c||state.over||pendingCardChoice||state.turn!==(isAI?'ai':'player'))return false;
 if(!midnightDefinition(c)||c.name!=='Law in Effect')return buyBeforeMidnight(i,isAI);
 const price=Math.max(0,c.cost-p.discount);if(p.grendels<price)return false;
 p.grendels-=price;p.discount=0;state.market.splice(i,1);
 // Resolve outside all owned piles: the purchase draw cannot draw this contract.
 apply(p,c,isAI);state.marketDeck.push(c);shuffle(state.marketDeck);refill();
 if(!isAI){log('Law in Effect resolves and returns to the Crossroads stock.');render();}
 return true;
};
function showLawDiscardChoices(){
 const list=$('#lawDiscardCards');list.replaceChildren();
 $('#lawDiscardCount').textContent=`Choose ${pendingCardChoice.remaining} more card${pendingCardChoice.remaining===1?'':'s'} to discard.`;
 for(const c of state.player.hand){
  const button=document.createElement('button');button.type='button';
  button.textContent=`${c.name} — ${c.text}`;button.onclick=()=>resolveLawDiscard(c.id);list.append(button);
 }
}
function resolveLawDiscard(id){
 if(pendingCardChoice?.kind!=='law-discard'||state.turn!=='player'||state.over)return false;
 const p=state.player,index=p.hand.findIndex(c=>c.id===id);if(index<0)return false;
 p.discard.push(...p.hand.splice(index,1));pendingCardChoice.remaining--;
 if(!pendingCardChoice.remaining||!p.hand.length){
  const done=pendingCardChoice.resolve;pendingCardChoice=null;$('#lawDiscardDialog').close();render();done();
 }else{showLawDiscardChoices();render();}
 return true;
}
async function resolveStartOfTurnDiscards(p,isAI=false){
 const count=Math.min(p.pendingDiscards||0,p.hand.length);p.pendingDiscards=0;if(!count)return;
 if(isAI){
  // The Rival chooses from its own hand; its discarded cards never expose the remaining hand.
  for(let n=0;n<count;n++){
   let index=0;for(let i=1;i<p.hand.length;i++)if(p.hand[i].cost<p.hand[index].cost)index=i;
   p.discard.push(...p.hand.splice(index,1));
  }
  log(`Law in Effect: the Rival discards ${count} card${count===1?'':'s'}.`);render();return;
 }
 cardChoiceFinished=new Promise(resolve=>{pendingCardChoice={kind:'law-discard',remaining:count,resolve};});
 showLawDiscardChoices();const dialog=$('#lawDiscardDialog');dialog.oncancel=e=>e.preventDefault();dialog.showModal();render();
 await cardChoiceFinished;
}
