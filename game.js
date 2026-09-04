// Reuse card elements by identity; unchanged hands never leave the document.
function syncHandCards(container,cards,create){
  const existing=new Map([...container.children].map(el=>[el.dataset.motionId,el]));
  const ids=new Set(cards.map(c=>c.id));
  for(const el of existing.values())if(!ids.has(el.dataset.motionId))el.remove();
  if(cards.length&&!container.children.length)container.textContent='';
  cards.forEach((c,i)=>{
    const el=existing.get(c.id)||create(c,i);
    el.dataset.motionId=c.id;
    if(container.children[i]!==el)container.insertBefore(el,container.children[i]||null);
  });
}
const CHRONICLES={
  gilded:{name:'The Gilded Consortium',legend:'Lady Aurica',color:'#c49a48',pitch:'Build wealth, recruit premium cards, and turn possessions into Prestige.',start:{name:'Small Investment',effect:'grendels',value:1,text:'+1 Grendels. Recruit a costly card for bonus Prestige.'},cards:[['Silver-Tongued Factor',3,'action','grendels',2,'+2 Grendels. Chain 2: +1 Grendels.'],['Merchant Caravan',4,'action','grendels',3,'+3 Grendels.'],['Consortium Auditor',4,'champion','discount',1,'Exhaust: Your next recruit costs 1 less.',3],['Profitable Venture',5,'action','grendels',4,'+4 Grendels. Chain 2: +1 Prestige.'],["Appraiser's Eye",5,'action','draw',1,'+2 Grendels. Draw a card.'],['Master of Ledgers',6,'guard','grendels',2,'Exhaust: +2 Grendels.',4],['Hostile Takeover',7,'action','mixed',5,'+5 Grendels and +1 Prestige.'],['Golden Opportunity',6,'action','prestige',3,'+3 Prestige.']]},
  midnight:{name:'The Midnight Parliament',legend:'Corven',color:'#77639e',pitch:'Chain cards together, draw deeply, and turn spare Grendels into Power.',start:{name:'Listening Crow',effect:'grendels',value:1,text:'+1 Grendels. Chain 2: Draw a card.'},cards:[['Rooftop Whisper',2,'action','grendels',1,'+1 Grendels. Chain 2: +1 Grendels.'],['Blackwing Courier',3,'action','grendels',2,'+2 Grendels. Chain 3: Draw a card.'],['Parliament Informant',4,'champion','grendels',1,'Exhaust: +1 Grendels.',3],['Shiny Distraction',4,'action','mixed',2,'+2 Grendels. Chain 3: +2 Power.'],['Gather the Flock',5,'action','draw',1,'Draw a card. Chain 2: +2 Grendels.'],['Night Market Knave',5,'champion','grendels',1,'Exhaust: +1 Grendels.',4],['Hundred Watching Eyes',6,'action','draw',1,'+3 Grendels. Draw a card.'],["Speaker's Decree",7,'action','draw',2,'Draw two cards.']]},
  hours:{name:'The Keeper of Hours',legend:'Sera Vey',color:'#4d8a8e',pitch:'Scout future draws, filter weak cards, and control enemy Champions.',start:{name:'Fleeting Insight',effect:'draw',value:0,text:'Scout, then draw a card.'},cards:[['Moment of Clarity',2,'action','grendels',1,'+1 Grendels. Scout your next draw.'],['Patient Observer',3,'champion','draw',0,'Exhaust: Draw, then discard.',3],['Borrowed Second',3,'action','grendels',2,'+2 Grendels.'],['Turn the Glass',4,'action','draw',1,'Draw a card.'],['Temporal Rebuke',4,'action','power',3,'+3 Power.'],['Curator of Moments',5,'guard','draw',0,'Exhaust: Draw, then discard.',4],['Rewrite the Hour',6,'action','draw',2,'Draw two cards.'],['The Perfect Moment',7,'action','mixed',3,'+3 Grendels and +3 Power.']]},
  crimson:{name:'The Crimson Standard',legend:'Marshal Oren',color:'#a74c40',pitch:'Field Guards, recover Champions, and press the rival with Power.',start:{name:'Young Volunteer',effect:'power',value:1,text:'+1 Power.'},cards:[['Shield-Line Recruit',2,'guard','none',0,'Guard.',2],['Rallying Cry',3,'action','power',2,'+2 Power. Chain 2: +1 Power.'],['Veteran Spear',4,'champion','power',1,'Exhaust: +1 Power.',3],['Hold the Gate',4,'action','power',3,'+3 Power.'],['Banner Captain',5,'guard','power',1,'Guard. Exhaust: +1 Power.',4],['Honored Dead',5,'action','draw',1,'Draw a card and gain +1 Power.'],['Unbroken Advance',6,'action','power',5,'+5 Power.'],['The Blood-Red Banner',7,'guard','power',2,'Guard. Exhaust: +2 Power.',5]]},
  velvet:{name:'The Velvet Fox',legend:'Vessa',color:'#b06e83',pitch:'Disrupt the rival, diminish Prestige, and seed their deck with Doubts.',start:{name:'Marked Coin',effect:'grendels',value:1,text:'+1 Grendels.'},cards:[['False Smile',2,'action','grendels',1,'+1 Grendels. Chain 2: +1 Power.'],['Cutpurse',3,'champion','grendels',1,'Exhaust: +1 Grendels.',2],['Misdirection',3,'action','grendels',2,'+2 Grendels.'],['Planted Evidence',4,'action','doubt',1,'+1 Grendels. Give the rival a Doubt.'],['Velvet-Footed Burglar',4,'champion','power',1,'Exhaust: +1 Power.',3],['Poisoned Compliment',5,'action','steal',2,'+2 Grendels. Rival loses 1 Prestige.'],['House of Mirrors',5,'guard','none',0,'Guard.',4],["Vessa's Masterstroke",7,'action','doubt',3,'+3 Grendels. Give the rival a Doubt.']]},
  ashen:{name:'The Ashen Reaver',legend:'Brenn Ash-Hand',color:'#b66742',pitch:'Banish weak cards, concentrate your deck, and generate relentless Power.',start:{name:'Blood Price',effect:'power',value:1,text:'+1 Power.'},cards:[['Cinder Acolyte',2,'action','power',2,'+2 Power.'],['Ruthless Forager',3,'action','grendels',2,'+2 Grendels.'],['Scarred Marauder',4,'champion','power',1,'Exhaust: +1 Power.',3],['Feed the Flame',4,'action','banish',2,'+2 Grendels. Banish a Copper from your Rest pile.'],['Ashen Rite',5,'action','power',3,'+3 Power.'],['Bone-Crowned Seer',5,'champion','draw',0,'Exhaust: Draw a card.',4],['No Weakness',5,'action','power',4,'+4 Power if your deck is lean.'],['Reaver Chieftain',6,'guard','power',2,'Guard. Exhaust: +2 Power.',5]]}
};
const state={selected:[],market:[],marketDeck:[],turn:'player',over:false,invoked:false,chain:{},message:'',finale:null,player:null,ai:null};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
function card(name,cost,type,suit,effect,value,text,durability=0){return{id:crypto.randomUUID(),name,cost,type,suit,effect,value,text,durability,ready:true}}
function createCard(raw,suit){return card(raw[0],raw[1],raw[2],suit,raw[3],raw[4],raw[5],raw[6]||0)}
function basic(name='Copper'){return card(name,0,'action','common','grendels',name==='Copper'?1:2,`+${name==='Copper'?1:2} Grendels.`)}
function doubt(){return card('Doubt',0,'burden','velvet','none',0,'No effect. A costly seed of uncertainty.')}
function canPlayCard(c){return !!c&&!c.hidden&&!(c.suit==='gilded'&&c.type==='token'&&c.name==='Petrified Villager');}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function makePlayer(name){const deck=[...Array(6)].map(()=>basic());state.selected.forEach(k=>{const s=CHRONICLES[k].start;deck.push(card(s.name,0,'action',k,s.effect,s.value,s.text))});return{name,draw:shuffle(deck),discard:[],hand:[],played:[],champions:[],grendels:0,power:0,prestige:0,discount:0}}
function draw(p,n=1){for(let i=0;i<n;i++){if(!p.draw.length){const recyclable=p.discard.filter(c=>!c.returnToStock);p.discard=p.discard.filter(c=>c.returnToStock);p.draw=shuffle(recyclable);}if(p.draw.length)p.hand.push(p.draw.pop())}}
function returnUsedContracts(p){
  const returning=p.discard.filter(c=>c.returnToStock);
  p.discard=p.discard.filter(c=>!c.returnToStock);
  returning.forEach(c=>{delete c.returnToStock;state.marketDeck.push(c);});
  if(returning.length)shuffle(state.marketDeck);
}
function setupChoices(){const box=$('#chronicleChoices');Object.entries(CHRONICLES).forEach(([k,c])=>{const d=document.createElement('div');d.className='choice';d.dataset.key=k;d.innerHTML=`<span class="check">◆</span><span class="eyebrow">${c.legend}</span><h3>${c.name}</h3><p>${c.pitch}</p>`;d.onclick=()=>toggleChoice(k,d);box.append(d)})}
function toggleChoice(k,el){if(state.selected.includes(k)){state.selected=state.selected.filter(x=>x!==k);el.classList.remove('selected')}else if(state.selected.length<4){state.selected.push(k);el.classList.add('selected')}$('#selectionHelp').textContent=`${state.selected.length} of 4 Chronicles chosen.`;$('#startGame').disabled=state.selected.length!==4}
function start(){state.over=false;state.turn='player';state.invoked=false;state.chain={};state.finale=null;state.player=makePlayer('You');state.ai=makePlayer('The Rival');state.marketDeck=[];state.selected.forEach(k=>CHRONICLES[k].cards.forEach(r=>{state.marketDeck.push(createCard(r,k));state.marketDeck.push(createCard(r,k))}));['Open Market','Traveling Broker','Call in a Favor','Public Bounty'].forEach((n,i)=>{for(let q=0;q<3;q++)state.marketDeck.push(card(n,2+i,'action','common',i===3?'power':'grendels',i===3?3:2,i===3?'+3 Power.':'+2 Grendels.'))});shuffle(state.marketDeck);state.market=[];refill();draw(state.player,5);draw(state.ai,5);$('#setup').classList.add('hidden');$('#game').classList.remove('hidden');log('Your story begins. Play a card from your hand.');render()}
function refill(){while(state.market.length<5&&state.marketDeck.length)state.market.push(state.marketDeck.pop())}
function apply(p,c,isAI=false){state.chain[c.suit]=(state.chain[c.suit]||0)+1;let v=c.value||0;if(c.effect==='grendels')p.grendels+=v;if(c.effect==='power')p.power+=v;if(c.effect==='prestige')p.prestige+=v;if(c.effect==='mixed'){p.grendels+=v;p.power+=Math.min(3,v)}if(c.effect==='draw')draw(p,v||1);if(c.effect==='discount')p.discount+=v;if(c.effect==='steal'){p.grendels+=v;const foe=isAI?state.player:state.ai;foe.prestige=Math.max(0,foe.prestige-1)}if(c.effect==='doubt'){p.grendels+=v;(isAI?state.player:state.ai).discard.push(doubt())}if(c.effect==='banish'){p.grendels+=v;const ix=p.discard.findIndex(x=>x.name==='Copper');if(ix>=0)p.discard.splice(ix,1)}if(c.suit==='midnight'&&state.chain[c.suit]>=2&&c.name.includes('Whisper'))p.grendels++;if(c.suit==='midnight'&&state.chain[c.suit]>=3&&c.name.includes('Courier'))draw(p);if(c.suit==='crimson'&&state.chain[c.suit]>=2&&c.name==='Rallying Cry')p.power++;if(c.suit==='velvet'&&state.chain[c.suit]>=2&&c.name==='False Smile')p.power++;if(c.suit==='gilded'&&state.chain[c.suit]>=2&&c.name==='Silver-Tongued Factor')p.grendels++;if(c.name==='Profitable Venture'&&state.chain[c.suit]>=2)p.prestige++;if(c.name==='Hostile Takeover')p.prestige++;if(c.name==='Hundred Watching Eyes')p.grendels+=3;if(c.name==='Honored Dead')p.power++;if(c.name==='No Weakness'&&p.draw.length+p.discard.length<13)p.power+=2}
function playCard(i,isAI=false){
  const p=isAI?state.ai:state.player;
  if(state.over||(!isAI&&state.turn!=='player'))return;
  const c=p.hand.splice(i,1)[0];if(!c)return;
  if(c.type==='champion'||c.type==='guard')p.champions.push(c);
  else{
    apply(p,c,isAI);
    if(c.type==='contract'||c.oneTimeUse)c.returnToStock=true;
    // Resolve first, then rest: a draw effect cannot immediately redraw itself.
    p.discard.push(c);
    (p.playedThisTurn??=[]).push(c.id);
  }
  if(!isAI){log(`You played ${c.name}.`);render();}
}
function activateChampion(i,isAI=false){const p=isAI?state.ai:state.player,c=p.champions[i];if(!c||!c.ready)return;c.ready=false;apply(p,c,isAI);if(!isAI){log(`${c.name} answers your call.`);render()}}
function buy(i,isAI=false){const p=isAI?state.ai:state.player,c=state.market[i];if(!c)return false;const cost=Math.max(0,c.cost-p.discount);if(p.grendels<cost)return false;p.grendels-=cost;p.discount=0;p.discard.push(c);state.market.splice(i,1);refill();if(!isAI){log(`You recruited ${c.name}.`);render()}return true}
function attackChampion(i){const c=state.ai.champions[i];if(!c)return;const guards=state.ai.champions.filter(x=>x.type==='guard');if(guards.length&&c.type!=='guard'){log('A Guard protects that Champion.');return}if(state.player.power<c.durability){log(`You need ${c.durability} Power to defeat ${c.name}.`);return}state.player.power-=c.durability;state.ai.discard.push(...state.ai.champions.splice(i,1));log(`You defeated ${c.name}.`);render()}
function invoke(k,isAI=false){const p=isAI?state.ai:state.player,foe=isAI?state.player:state.ai;if(state.invoked)return false;let paid=false;if(k==='gilded'&&p.played.length){const c=p.played.sort((a,b)=>b.cost-a.cost)[0],ix=p.played.indexOf(c);p.played.splice(ix,1);p.prestige+=Math.ceil(c.cost/2);paid=true}else if(k==='midnight'&&p.grendels>=3){p.power+=Math.ceil(p.grendels/2);p.grendels=0;paid=true}else if(k==='hours'&&p.grendels>=4&&foe.champions.length){p.grendels-=4;foe.discard.push(foe.champions.shift());paid=true}else if(k==='crimson'&&p.power>=2){p.power-=2;const ix=p.discard.findIndex(x=>x.type==='champion'||x.type==='guard');if(ix>=0)p.hand.push(...p.discard.splice(ix,1));else p.power+=1;paid=true}else if(k==='velvet'&&p.grendels>=3){p.grendels-=3;if(state.legends[k]===(isAI?'ai':'player'))foe.discard.push(doubt());else foe.prestige=Math.max(0,foe.prestige-1);paid=true}else if(k==='ashen'&&p.power>=2&&p.played.length){p.power-=2;p.played.shift();draw(p);paid=true}if(paid){state.legends[k]=state.legends[k]===(isAI?'ai':'player')?null:(isAI?'ai':'player');state.invoked=true;if(!isAI){log(`You invoked ${CHRONICLES[k].legend}.`);render()}}return paid}
function endTurn(){if(state.turn!=='player'||state.over)return;state.player.prestige+=state.player.power;state.player.power=0;cleanup(state.player);if(checkWin('player'))return;state.turn='ai';render();log('The Rival considers the Crossroads…');setTimeout(aiTurn,650)}
function cleanup(p){p.discard.push(...p.played.splice(0),...p.hand.splice(0));p.grendels=0;p.power=0;p.discount=0;p.champions.forEach(c=>c.ready=true);draw(p,5)}
function aiTurn(){if(state.over)return;state.invoked=false;state.chain={};while(state.ai.hand.length)playCard(0,true);state.ai.champions.forEach((_,i)=>activateChampion(i,true));let bought=true;while(bought){bought=false;const options=state.market.map((c,i)=>({c,i})).filter(x=>x.c.cost<=state.ai.grendels+state.ai.discount).sort((a,b)=>b.c.cost-a.c.cost);if(options.length){buy(options[0].i,true);bought=true}}const invokable=shuffle([...state.selected]);for(const k of invokable)if(invoke(k,true))break;while(state.ai.power>0&&state.player.champions.length){let ix=state.player.champions.findIndex(c=>c.type==='guard'&&c.durability<=state.ai.power);if(ix<0)ix=state.player.champions.findIndex(c=>c.durability<=state.ai.power);if(ix<0)break;const c=state.player.champions[ix];state.ai.power-=c.durability;state.player.discard.push(...state.player.champions.splice(ix,1))}state.ai.prestige+=state.ai.power;state.ai.power=0;cleanup(state.ai);if(checkWin('ai'))return;state.turn='player';state.invoked=false;state.chain={};log('Your turn. The Crossroads await.');render()}
function checkWin(who){
 const p=state[who],other=who==='player'?'ai':'player',foe=state[other];
 if(state.selected.length===4&&state.selected.every(k=>state.legends[k]===who)){finish(who,`${p.name} secured the Allegiance of all four Legends.`);return true;}
 state.prestigeTarget=state.prestigeTarget===80?80:40;
 if(state.prestigeTarget===40&&p.prestige>=40&&foe.prestige>=40){
  state.prestigeTarget=80;state.finale=null;
  log('Both players reached 40 Prestige. The final target is now 80.');
 }
 if(state.finale&&state.finale!==who){
  if(Math.max(p.prestige,foe.prestige)>=state.prestigeTarget){
   const winner=p.prestige===foe.prestige?'draw':p.prestige>foe.prestige?who:other;
   finish(winner,winner==='draw'?`A draw: both players finished with ${p.prestige} Prestige at the final ${state.prestigeTarget}-point target.`:`${state[winner].name} wins after the response turn: ${p.prestige}–${foe.prestige} Prestige (target ${state.prestigeTarget}).`);return true;
  }
  state.finale=null;
 }
 if(!state.finale){if(p.prestige>=state.prestigeTarget)state.finale=who;else if(foe.prestige>=state.prestigeTarget)state.finale=other;}
 return false;
}
function finish(who,text){state.over=true;state.winner=who;$('#resultTitle').textContent=who==='draw'?'The tale ends in a draw':who==='player'?'Your sacrifice becomes legend':'The Rival claims the tale';$('#resultText').textContent=text;$('#resultDialog').showModal()}
function log(t){state.message=t;$('#log').textContent=t}
function renderCard(c,mode,i){const affordable=mode==='market'&&state.player.grendels+state.player.discount<c.cost;const d=document.createElement('article');d.className=`card ${affordable?'unaffordable':''}`;d.style.borderTopColor=CHRONICLES[c.suit]?.color||'#b99b61';d.innerHTML=`<span class="suit">${CHRONICLES[c.suit]?.name||'Common Purse'}</span>${mode==='market'?`<span class="cost">${c.cost}</span>`:''}<h3>${c.name}</h3><span class="type">${c.type}${c.durability?` · ${c.durability} durability`:''}</span><p class="effect">${c.text}</p>${c.type==='guard'?'<span class="durability">◆ Guard</span>':''}`;d.onclick=()=>mode==='market'?buy(i):playCard(i);return d}
function panel(p,isAI){const champs=p.champions.map((c,i)=>`<span class="mini-champion ${c.type==='guard'?'guard':''}" data-i="${i}" title="${c.text}">${c.name} · ${c.durability}◆</span>`).join('');return `<strong>${p.name}</strong><div class="champions">${champs||'<span style="color:#777">No Champions</span>'}</div><div class="player-stats"><span>Deck <b>${p.draw.length}</b></span><span>Rest <b>${p.discard.length}</b></span>${isAI?`<span>Grendels <b>${p.grendels}</b></span><span>Power <b>${p.power}</b></span><span>Prestige <b>${p.prestige}</b></span>`:''}</div>`}
function render(){if(!state.player)return;$('#market').replaceChildren(...state.market.map((c,i)=>renderCard(c,'market',i)));const hand=$('#hand');syncHandCards(hand,state.player.hand,(c,i)=>renderCard(c,'hand',i));hand.classList.toggle('empty',!state.player.hand.length);if(!state.player.hand.length)hand.textContent='Your hand is empty. Recruit, invoke a Legend, or end your turn.';$('#playerPanel').innerHTML=panel(state.player,false);$('#aiPanel').innerHTML=panel(state.ai,true);$$('#aiPanel .mini-champion').forEach(el=>el.onclick=()=>attackChampion(+el.dataset.i));$$('#playerPanel .mini-champion').forEach(el=>el.onclick=()=>activateChampion(+el.dataset.i));$('#grendels').textContent=state.player.grendels;$('#power').textContent=state.player.power;$('#prestige').textContent=state.player.prestige;$('#turnBanner').textContent=state.turn==='player'?'Your turn':'Rival’s turn';$('#endTurn').disabled=state.turn!=='player';$('#playAll').disabled=state.turn!=='player'||!state.player.hand.length;const legends=$('#legends');if(legends.querySelector('.character-placard'))return;legends.innerHTML='';state.selected.forEach(k=>{const c=CHRONICLES[k],owner=state.legends[k];const d=document.createElement('article');d.className=`legend ${owner||''}`;d.innerHTML=`<h3>${c.legend}</h3><p>${legendText(k)}</p><button ${state.turn!=='player'||state.invoked?'disabled':''}>Invoke</button>`;d.querySelector('button').onclick=()=>{if(!invoke(k))log('You cannot pay this Legend’s price right now.')};legends.append(d)})}
function legendText(k){return{gilded:'Sacrifice a played card: gain half its cost as Prestige.',midnight:'Pay all Grendels (minimum 3): gain half as Power.',hours:'Pay 4 Grendels: defeat a rival Champion.',crimson:'Pay 2 Power: recover a Champion.',velvet:'Pay 3 Grendels: diminish Prestige or create Doubt.',ashen:'Pay 2 Power and sacrifice a played card: draw.'}[k]}
setupChoices();state.legends={};$('#startGame').onclick=start;$('#playAll').onclick=()=>{while(state.player.hand.length)playCard(0);render()};$('#endTurn').onclick=endTurn;$('#newGame').onclick=()=>location.reload();$('#resultRestart').onclick=()=>location.reload();$('#rulesButton').onclick=()=>$('#rulesDialog').showModal();$('#rulesDialog .dialog-close').onclick=()=>$('#rulesDialog').close();

// Optional browser-agent controls. They invoke the same actions as the visible board.
if(document.modelContext?.registerTool){
  const register=(tool)=>Promise.resolve(document.modelContext.registerTool(tool)).catch(()=>{});
  register({name:'start_story_game',title:'Start story game',description:'Start a new Stories of Sacrifice match with exactly four Chronicle IDs.',inputSchema:{type:'object',properties:{chronicles:{type:'array',items:{type:'string',enum:Object.keys(CHRONICLES)},minItems:4,maxItems:4,uniqueItems:true}},required:['chronicles'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute({chronicles}){if(!Array.isArray(chronicles)||chronicles.length!==4||new Set(chronicles).size!==4||chronicles.some(k=>!CHRONICLES[k]))throw new Error('Choose four unique valid Chronicles.');state.selected=[...chronicles];start();return{status:'started',chronicles:state.selected,turn:state.turn}}});
  register({name:'play_all_cards',title:'Play all cards',description:'Play cards until the hand is empty or a target choice is required.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},async execute(){if(globalThis.onlineMatch?.room){await $('#playAll').onclick();return{status:state.choice?'choose_target':'played'};}if(!state.player||state.turn!=='player'||state.over||(typeof motion!=='undefined'&&motion.busy))throw new Error('Cards cannot be played right now.');let count=0;while(state.player.hand.some(canPlayCard)&&!(typeof pendingCardChoice!=='undefined'&&pendingCardChoice)){playCard(state.player.hand.findIndex(canPlayCard));count++;}render();return{status:typeof pendingCardChoice!=='undefined'&&pendingCardChoice?'choose_target':'played',count,grendels:state.player.grendels,power:state.player.power,prestige:state.player.prestige}}});
}

const SUIT_COLORS={gilded:'#d4ad3f',midnight:'#7652a7',hours:'#3f91c7',crimson:'#c63f38',velvet:'#d37832',ashen:'#7f3029',common:'#9b8c6b'};
const startBeforePrestigeTarget=start;
start=function(){state.prestigeTarget=40;state.winner=null;return startBeforePrestigeTarget();};
$('#startGame').onclick=()=>start();
Object.entries(SUIT_COLORS).forEach(([key,color])=>{if(CHRONICLES[key])CHRONICLES[key].color=color});
$$('.choice').forEach(tile=>tile.style.setProperty('--suit',SUIT_COLORS[tile.dataset.key]));
const renderWithoutSuitColors=render;
render=function(){
  renderWithoutSuitColors();
  $$('.card').forEach(cardElement=>{
    const label=cardElement.querySelector('.suit')?.textContent;
    const key=Object.keys(CHRONICLES).find(id=>CHRONICLES[id].name===label)||'common';
    cardElement.style.setProperty('--suit',SUIT_COLORS[key]);
  });
  $$('.legend').forEach((legendElement,index)=>legendElement.style.setProperty('--suit',SUIT_COLORS[state.selected[index]]));
  $$('.legend').forEach((legendElement,index)=>{
    if(legendElement.classList.contains('character-placard'))return;
    const owner=state.legends[state.selected[index]];
    const token=document.createElement('div');
    token.className=`legend-token ${owner||'neutral'}`;
    token.setAttribute('aria-label',owner==='player'?'Dial points toward you':owner==='ai'?'Dial points toward the rival':'Dial is neutral');
    token.innerHTML='<span class="dial-pointer"></span><span class="dial-center"></span>';
    legendElement.prepend(token);
    const status=document.createElement('span');
    status.className='allegiance-status';
    status.textContent=owner==='player'?'Points to you':owner==='ai'?'Points to rival':'Neutral';
    legendElement.querySelector('p').append(status);
  });
  $$('.card').forEach(cardElement=>{
    const coinName=cardElement.querySelector('h3')?.textContent;
    if(!['Copper','Silver'].includes(coinName)||cardElement.querySelector('.grendel-coin'))return;
    cardElement.classList.add('has-grendel-token');
    const token=document.createElement('div');
    token.className=`grendel-coin coin-${coinName.toLowerCase()}`;
    token.title=`${coinName} Grendel — G face; hover to see the griffin reverse`;
    token.innerHTML='<div class="grendel-coin-inner"><span class="grendel-coin-face g-face"></span><span class="grendel-coin-face griffin-face"></span></div>';
    cardElement.querySelector('.effect').before(token);
  });
};

// Allegiance always moves exactly one dial position toward the invoking player.
const invokeWithoutDialSteps=invoke;
invoke=function(key,isAI=false){
  const previous=state.legends[key];
  const caller=isAI?'ai':'player';
  const opponent=isAI?'player':'ai';
  const succeeded=invokeWithoutDialSteps(key,isAI);
  if(!succeeded)return false;
  state.legends[key]=previous===opponent?null:caller;
  if(!isAI)render();
  return true;
};

const COMMON_LIBRARY=[
  {name:'Copper',cost:'Starting',type:'Action',text:'+1 Grendels.',qty:'6 per player'},
  {name:'Silver',cost:'Created',type:'Action',text:'+2 Grendels.',qty:'Supply'},
  {name:'Open Market',cost:2,type:'Action',text:'+2 Grendels.',qty:3},
  {name:'Traveling Broker',cost:3,type:'Action',text:'+2 Grendels.',qty:3},
  {name:'Call in a Favor',cost:4,type:'Action',text:'+2 Grendels.',qty:3},
  {name:'Public Bounty',cost:5,type:'Action',text:'+3 Power.',qty:3}
];
let libraryFilter='all';
function libraryEntries(key){
  if(key==='common')return COMMON_LIBRARY;
  const chronicle=CHRONICLES[key];
  return [
    {name:chronicle.start.name,cost:'Starting',type:'Action',text:chronicle.start.text,qty:'1 per player'},
    ...chronicle.cards.map(raw=>({name:raw[0],cost:raw[1],type:raw[2]==='guard'?'Champion · Guard':raw[2][0].toUpperCase()+raw[2].slice(1),text:raw[5],qty:2,durability:raw[6]}))
  ];
}
function openCardLibrary(){libraryFilter='all';renderLibrary();$('#cardLibraryDialog').showModal()}
function renderLibrary(){
  const filters=[['all','All Cards'],['common','Common Purse'],...Object.entries(CHRONICLES).map(([key,c])=>[key,c.name])];
  $('#libraryFilters').innerHTML='';
  filters.forEach(([key,label])=>{const button=document.createElement('button');button.className=`library-filter ${libraryFilter===key?'active':''}`;button.textContent=label;button.style.setProperty('--suit',key==='all'?'#d7af5c':SUIT_COLORS[key]);button.onclick=()=>{libraryFilter=key;renderLibrary()};$('#libraryFilters').append(button)});
  const keys=libraryFilter==='all'?['common',...Object.keys(CHRONICLES)]:[libraryFilter];
  const entries=keys.flatMap(key=>libraryEntries(key).map(entry=>({...entry,key})));
  const title=libraryFilter==='all'?'Complete Prototype Set':libraryFilter==='common'?'The Common Purse':CHRONICLES[libraryFilter].name;
  $('#librarySummary').innerHTML=`<strong>${title}</strong>${entries.length} unique cards · ${libraryFilter==='all'?'Choose a Chronicle to narrow the list.':'Quantities show copies included in the prototype.'}`;
  $('#libraryCards').innerHTML='';
entries.forEach(entry=>{const article=document.createElement('article');article.className='library-card';article.style.setProperty('--suit',SUIT_COLORS[entry.key]);article.innerHTML=`<span class="library-cost">${typeof entry.cost==='number'?`${entry.cost} Grendels`:entry.cost}</span><span class="quantity">×${entry.qty}</span><h3>${entry.name}</h3><span class="type">${entry.type}${entry.durability?` · ${entry.durability} durability`:''}</span>${['Copper','Silver'].includes(entry.name)?`<div class="grendel-coin coin-${entry.name.toLowerCase()}" title="Grendel coin — hover to see the griffin face"><div class="grendel-coin-inner"><span class="grendel-coin-face g-face"></span><span class="grendel-coin-face griffin-face"></span></div></div><span class="grendel-coin-caption">G face · Griffin reverse</span>`:''}<p>${entry.text}</p>`;$('#libraryCards').append(article)});
}
$$('.card-library-button').forEach(button=>button.onclick=openCardLibrary);
$('#cardLibraryDialog .dialog-close').onclick=()=>$('#cardLibraryDialog').close();

function commonPurseUnavailable(isAI=false){
  const player=isAI?state.ai:state.player;
  if(!player||state.over)return 'No active match.';
  if(state.turn!==(isAI?'ai':'player'))return 'Wait for your turn.';
  if(state.invoked)return 'Your Legend invocation is already used.';
  if(player.grendels<2)return 'Requires 2 Grendels.';
  if(!player.discard.some(c=>c.name==='Copper'&&c.suit==='common'))return 'Requires a Copper in your Rest pile.';
  return '';
}

function invokeCommonPurse(isAI=false){
  const unavailable=commonPurseUnavailable(isAI);
  if(unavailable){if(!isAI)log(unavailable);return false;}
  const player=isAI?state.ai:state.player;
  const index=player.discard.findIndex(c=>c.name==='Copper'&&c.suit==='common');
  const silver=basic('Silver');
  player.grendels-=2;
  player.discard.splice(index,1,silver);
  state.invoked=true;
  if(!isAI){log('Common Purse: paid 2 Grendels and replaced a Copper in your Rest pile with a Silver (+2 Grendels).');render();}
  return true;
}

const renderBeforeCommonPurse=render;
render=function(){
  renderBeforeCommonPurse();
  if(!state.player)return;
  const existing=$('#legends .common-purse.character-placard');
  if(existing){
    const unavailable=commonPurseUnavailable(),button=existing.querySelector('button');
    button.disabled=Boolean(unavailable);button.title=unavailable||'Uses your one Legend invocation this turn.';
    let reason=existing.querySelector('.exchange-reason');
    if(!reason){reason=document.createElement('span');reason.className='exchange-reason';existing.append(reason);}
    reason.textContent=unavailable;
    return;
  }
  const exchange=document.createElement('article');
  exchange.className='legend common-purse';
  exchange.style.setProperty('--suit',SUIT_COLORS.common);
  exchange.innerHTML='<div class="grendel-coin"><div class="grendel-coin-inner"><span class="grendel-coin-face g-face"></span><span class="grendel-coin-face griffin-face"></span></div></div><h3>The Common Purse</h3><p>Pay 2 Grendels. Replace a Copper in your Rest pile with a Silver worth 2 Grendels.<span class="allegiance-status">No dial</span></p><button>Exchange Copper → Silver</button>';
  const button=exchange.querySelector('button');
  const unavailable=commonPurseUnavailable();
  button.disabled=Boolean(unavailable);
  button.title=unavailable||'Uses your one Legend invocation this turn.';
  button.onclick=()=>invokeCommonPurse();
  if(unavailable){const reason=document.createElement('span');reason.className='exchange-reason';reason.textContent=unavailable;exchange.append(reason);}
  $('#legends').append(exchange);
};

// The rival may spend its remaining resources on the same exchange before cleanup.
const cleanupBeforeCommonPurse=cleanup;
cleanup=function(player){
  if(player===state.ai)invokeCommonPurse(true);
  player.playedThisTurn=[];
  returnUsedContracts(player);
  cleanupBeforeCommonPurse(player);
};

// Sacrifice eligible actions from Rest without treating their history as another pile.
const invokeBeforeImmediateRest=invoke;
invoke=function(key,isAI=false,chosenId=null){
  if(key!=='gilded'&&key!=='ashen')return invokeBeforeImmediateRest(key,isAI);
  const player=isAI?state.ai:state.player;
  if(!player||state.over||state.invoked||state.turn!==(isAI?'ai':'player'))return false;
  const eligible=player.discard.filter(c=>(player.playedThisTurn||[]).includes(c.id));
  if(!eligible.length||(key==='ashen'&&player.power<2))return false;
  if(key==='gilded'&&!isAI&&!state.legends[key]&&chosenId===null){openSeraphineSacrifice();return true;}
  const sacrificed=chosenId!==null?eligible.find(c=>c.id===chosenId):key==='gilded'?eligible.reduce((a,b)=>a.cost>=b.cost?a:b):eligible[0];
  if(!sacrificed)return false;
  player.discard.splice(player.discard.indexOf(sacrificed),1);
  player.playedThisTurn=player.playedThisTurn.filter(id=>id!==sacrificed.id);
  if(key==='gilded')player.prestige+=Math.ceil(sacrificed.cost/2);
  else{player.power-=2;draw(player);}
  const caller=isAI?'ai':'player',opponent=isAI?'player':'ai';
  state.legends[key]=state.legends[key]===opponent?null:caller;
  state.invoked=true;
  if(!isAI){log(`You invoked ${CHRONICLES[key].legend}.`);render();}
  return true;
};

function openSeraphineSacrifice(){
  const dialog=$('#sacrificeDialog'),list=$('#sacrificeCards');
  list.replaceChildren();
  state.player.discard.forEach(c=>{
    const eligible=(state.player.playedThisTurn||[]).includes(c.id);
    const button=document.createElement('button');button.type='button';button.disabled=!eligible;
    button.textContent=`${c.name} · Cost ${c.cost} · ${eligible?`Sacrifice for ${Math.ceil(c.cost/2)} Prestige`:'Not played this turn'}`;
    button.onclick=()=>{
      if(state.legends.gilded||!invoke('gilded',false,c.id)){dialog.close();log('That sacrifice is no longer available.');return;}
      dialog.close();log(`Seraphine sacrificed ${c.name} for ${Math.ceil(c.cost/2)} Prestige.`);
    };
    list.append(button);
  });
  dialog.showModal();
}

// Explain shared invocation limits and Corven's price directly in the Hall.
const renderBeforeInvocationStatus=render;
render=function(){
  renderBeforeInvocationStatus();
  if(!state.player)return;
  $$('#legends .legend').forEach((element,index)=>{
    const key=state.selected[index];
    if(!key)return;
    const button=element.querySelector('button');
    const reason=state.over?'Game finished':state.turn!=='player'?'Rival’s turn':state.invoked?'Invocation used this turn':key==='midnight'&&state.player.grendels<3?'Requires at least 3 Grendels':'';
    button.disabled=!!reason;
    button.textContent=reason||'Invoke';
    button.title=reason||(key==='midnight'?`Spend all ${state.player.grendels} Grendels to gain ${Math.ceil(state.player.grendels/2)} Power.`:'Invoke this Legend');
  });
};
