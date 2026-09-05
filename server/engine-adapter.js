// Appended inside the build-time rules factory. No browser or AI runs on the server.
render=()=>{};
log=t=>{state.message=t.replace(/^You /,`${state.player?.name||'Player'} `);};
finish=(who,message)=>{state.over=true;state.winner=who;state.message=message;};
chooseAssassinTarget=()=>{if(state.ai.champions.length)state.choice={kind:'assassin'};};
openSeraphineSacrifice=()=>{state.choice={kind:'sacrifice'};};
openCommonChoice=(kind)=>{const cards=commonChoiceCards(kind,state.player,state.ai);if(cards.length)state.choice={kind,remaining:kind==='butcher'?2:1};};
openGoldenChoice=(kind,card,isAI=false,effect=null)=>{
 if(kind==='golden-paid'&&state.player.grendels<effect.cost)return;
 if(kind==='golden-discard'&&!state.player.hand.length)return;
 state.choice={kind,cardName:card?.name||null,cardText:card?.text||null,effect};
};
openJudgeChoice=(kind,p,isAI,count,title,after=null)=>{
 if(kind==='judge-rest'){
  if(!p.discard.length)return false;
  state.choice={kind,remaining:Math.min(count,p.discard.length),selected:[],title,after};return true;
 }
 judgeFillTopThree(p);if(!p.draw.length)return false;
 state.choice={kind,cards:p.draw.splice(Math.max(0,p.draw.length-3)),selected:[],remaining:Math.min(3,p.draw.length||3),title,after};
 state.choice.remaining=state.choice.cards.length;return true;
};
function swapSeats(){
 [state.player,state.ai]=[state.ai,state.player];
 const swap=x=>x==='player'?'ai':x==='ai'?'player':x;
 state.turn=swap(state.turn);state.finale=swap(state.finale);state.winner=swap(state.winner);
 for(const k of state.selected)state.legends[k]=swap(state.legends[k]);
}
function indexOf(cards,id){const i=cards.findIndex(c=>c.id===id);if(i<0)throw new Error('That card is no longer available.');return i;}
function act(action){
 if(state.over||state.turn!=='player')throw new Error('Wait for your turn.');
 if(state.choice){
  if(action.type!=='choose')throw new Error('Finish choosing a card first.');
  const choice=state.choice;
  if(choice.kind==='assassin'){indexOf(state.ai.champions,action.id);damageChampion(state.ai,action.id,2);state.choice=null;}
  else if(choice.kind==='sacrifice'){
   if(!state.player.discard.some(c=>c.id===action.id&&(state.player.playedThisTurn||[]).includes(c.id)))throw new Error('Choose a card played this turn.');
   if(!invoke('gilded',false,action.id))throw new Error('Sacrifice unavailable.');state.choice=null;
  }else if(choice.kind==='law-discard'){
   state.player.discard.push(...state.player.hand.splice(indexOf(state.player.hand,action.id),1));
   if(--choice.remaining===0||!state.player.hand.length)state.choice=null;
  }else if(['butcher','red-hilt'].includes(choice.kind)){
   if(action.done&&choice.kind==='butcher')state.choice=null;
   else{const i=indexOf(state.ai.champions,action.id);state.ai.discard.push(...state.ai.champions.splice(i,1));if(choice.kind==='red-hilt'||--choice.remaining===0||!state.ai.champions.length)state.choice=null;}
  }else if(choice.kind==='blacksmith'){
   if(action.done)state.choice=null;
   else{const i=indexOf(state.market,action.id);state.marketDeck.push(...state.market.splice(i,1));shuffle(state.marketDeck);refill();state.choice=null;}
  }else if(choice.kind==='strings'){
   let i=state.player.champions.findIndex(c=>c.id===action.id);
   if(i>=0)state.player.champions.splice(i,1);else state.player.discard.splice(indexOf(state.player.discard,action.id),1);state.choice=null;
  }else if(choice.kind==='golden-paid'){
   if(action.accept){if(state.player.grendels<choice.effect.cost)throw new Error('Paid Combo is no longer affordable.');state.player.grendels-=choice.effect.cost;choice.effect.kind==='power'?state.player.power+=choice.effect.value:draw(state.player,choice.effect.value);}state.choice=null;
  }else if(choice.kind==='golden-discard'){
   state.player.discard.push(...state.player.hand.splice(indexOf(state.player.hand,action.id),1));state.choice=null;
  }else if(choice.kind==='vaelis-flip'){
   if(!['heads','tails'].includes(action.result))throw new Error('Choose Heads or Tails.');state.player.forcedFlip=action.result;state.choice=null;
  }else if(['judge-rest','judge-order'].includes(choice.kind)){
   const pool=choice.kind==='judge-rest'?state.player.discard:choice.cards,i=indexOf(pool,action.id);choice.selected.push(...pool.splice(i,1));choice.remaining--;
   if(choice.remaining===0||!pool.length){for(const c of [...choice.selected].reverse())state.player.draw.push(c);if(choice.after?.draw)draw(state.player,choice.after.draw);state.choice=null;}
  }
  return;
 }
 switch(action.type){
  case 'play':{const i=indexOf(state.player.hand,action.id);if(!canPlayCard(state.player.hand[i]))throw new Error('This card cannot be played.');playCard(i);break;}
  case 'effect':{const i=indexOf(state.player.champions,action.id);if(!state.player.champions[i].ready)throw new Error('Effect already used.');activateChampion(i);break;}
  case 'buy':if(!buy(indexOf(state.market,action.id)))throw new Error('Not enough Grendels.');break;
  case 'attack':if(!attackChampion(indexOf(state.ai.champions,action.id)))throw new Error('Cannot attack that Champion.');break;
  case 'invoke':if(!state.selected.includes(action.key)||!invoke(action.key))throw new Error('Invocation unavailable.');break;
  case 'exchange':if(!invokeCommonPurse())throw new Error('Exchange unavailable.');break;
  case 'end':{
   const p=state.player;p.prestige+=p.power;p.power=0;
   if(checkWin('player'))return;
   returnUsedContracts(p);p.discard.push(...p.hand.splice(0),...p.played.splice(0));p.playedThisTurn=[];
   p.grendels=0;p.discount=0;draw(p,5);
   p.forcedFlip=null;p.lastFlip=null;
   state.turn='ai';state.invoked=false;state.chain={};
   state.player.extraInvocations=0;
   state.ai.champions.forEach(c=>c.ready=true);
   restPetrifiedVillagers(state.ai);
   const count=Math.min(state.ai.pendingDiscards||0,state.ai.hand.length);state.ai.pendingDiscards=0;
   if(count)state.choice={kind:'law-discard',remaining:count};
   state.message='Turn passed.';break;
  }
  default:throw new Error('Unknown action.');
 }
 if(!state.choice&&state.selected.every(k=>state.legends[k]==='player'))checkWin('player');
}
return {
 create(selected,names){
  if(!Array.isArray(selected)||selected.length!==4||new Set(selected).size!==4||selected.some(k=>!Object.hasOwn(CHRONICLES,k)))throw new Error('Choose four different decks.');
  state.selected=selected;start();state.player.name=names[0];state.ai.name=names[1];return structuredClone(state);
 },
 move(snapshot,seat,action){Object.assign(state,structuredClone(snapshot));if(seat===1)swapSeats();act(action);if(seat===1)swapSeats();return structuredClone(state);},
 view(snapshot,seat){
  Object.assign(state,structuredClone(snapshot));if(seat===1)swapSeats();
  // Never send draw order, stock contents, or the opponent's hand definitions.
  const backs=(cards,zone)=>cards.map((c,i)=>({id:`hidden-${zone}-${i}`,hidden:true}));
  state.player.draw=backs(state.player.draw,'own-draw');state.ai.draw=backs(state.ai.draw,'opponent-draw');state.ai.hand=backs(state.ai.hand,'opponent-hand');
  state.marketDeck=backs(state.marketDeck,'stock');
  delete state.ai.forcedFlip;
  if(state.turn!=='player')state.choice=null;
  return structuredClone(state);
 }
};
