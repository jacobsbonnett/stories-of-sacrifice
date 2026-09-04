// Appended inside the build-time rules factory. No browser or AI runs on the server.
render=()=>{};
log=t=>{state.message=t.replace(/^You /,`${state.player?.name||'Player'} `);};
finish=(who,message)=>{state.over=true;state.winner=who;state.message=message;};
chooseAssassinTarget=()=>{if(state.ai.champions.length)state.choice={kind:'assassin'};};
openSeraphineSacrifice=()=>{state.choice={kind:'sacrifice'};};
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
   state.turn='ai';state.invoked=false;state.chain={};
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
  if(state.turn!=='player')state.choice=null;
  return structuredClone(state);
 }
};
