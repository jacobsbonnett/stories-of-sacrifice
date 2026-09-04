const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const elements=new Map();
const node=()=>({dataset:{},style:{setProperty(){}},classList:{add(){},remove(){}},append(){},prepend(){},replaceChildren(){},showModal(){this.open=true},close(){this.open=false},querySelector:()=>node(),setAttribute(){}});
const context=vm.createContext({document:{querySelector:s=>{if(!elements.has(s))elements.set(s,node());return elements.get(s)},querySelectorAll:()=>[],createElement:()=>node()},crypto:require('node:crypto').webcrypto,console,setTimeout,matchMedia:()=>({matches:true}),addEventListener(){}});context.window=context;
for(const f of ['game.js','crimson-deck.js','midnight-deck.js','table-motion.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),context);
const run=s=>vm.runInContext(s,context),plain=s=>JSON.parse(JSON.stringify(run(s)));
run(`render=()=>{};log=()=>{};state.selected=['midnight','crimson','hours','velvet'];
function mc(name){return createCard(MIDNIGHT_CARDS.find(c=>c[0]===name),'midnight');}
function reset(){state.player=makePlayer('You');state.ai=makePlayer('Rival');for(const p of [state.player,state.ai]){p.hand=[];p.draw=[];p.discard=[];}state.turn='player';state.over=false;state.finale=null;state.legends={};state.chain={};state.market=[];state.marketDeck=[];state.invoked=false;pendingCardChoice=null;motion.busy=false;motion.internal=false;}
reset();`);
// Independent expected totals: [Grendels, Power, cards drawn, opponent discard queued].
const cases=[
 ['Puppy',0,0,[[1,0,0,0],[1,0,0,0],[1,0,0,0],[1,0,0,0]]],
 ['Eagles Nest',6,2,[[1,0,0,0],[1,0,0,0],[1,0,1,0],[1,0,1,0]]],
 ['Lions Pride',6,2,[[2,0,0,0],[2,0,0,0],[2,0,1,0],[2,0,1,0]]],
 ['Bears Decree',6,3,[[1,0,0,0],[1,0,0,0],[3,2,0,0],[3,2,0,0]]],
 ['Law in Effect',4,0,[[0,0,1,0],[0,0,1,0],[0,0,1,1],[0,0,1,1]]],
 ['Wolf Pack',4,0,[[1,0,0,0],[3,2,0,0],[3,4,0,0],[3,4,0,0]]],
 ["Monkey's Deceit",6,0,[[0,0,1,0],[0,0,1,0],[0,0,2,0],[0,0,2,0]]],
 ['Sweeping Seagull',6,0,[[0,0,1,0],[0,0,1,0],[0,0,2,0],[0,0,3,0]]],
 ['Watering Hole',4,0,[[0,2,0,0],[0,2,1,0],[0,2,1,0],[3,2,1,0]]],
 ['Talon',4,0,[[1,0,0,0],[3,2,0,0],[3,2,0,0],[3,2,0,0]]],
 ['Hyena Screech',6,0,[[0,0,1,0],[0,0,1,0],[0,0,2,0],[0,4,2,0]]],
 ['Carnivorous Cat',4,0,[[2,0,0,0],[2,0,1,0],[2,0,1,0],[2,0,1,0]]],
 ['Racoons Horde',4,0,[[2,0,0,0],[2,0,1,0],[3,0,1,0],[3,0,1,0]]]
];
for(const [name,cost,health,levels] of cases){
 assert.equal(run(`mc(${JSON.stringify(name)}).cost`),cost);assert.equal(run(`mc(${JSON.stringify(name)}).durability`),health);
 for(const ai of [false,true])for(let prior=0;prior<4;prior++){
  run(`reset();state.turn=${ai?"'ai'":"'player'"};state.chain.midnight=${prior};var p=${ai?'state.ai':'state.player'};var foe=${ai?'state.player':'state.ai'};p.draw=Array.from({length:8},()=>basic());var c=mc(${JSON.stringify(name)});`);
  if(name==='Law in Effect')run(`p.grendels=4;state.market=[c];buy(0,${ai});`);
  else run(`p.hand=[c];playCard(0,${ai});`);
  assert.deepEqual(plain('[p.grendels,p.power,p.hand.length,foe.pendingDiscards||0]'),levels[prior],`${name}, activation ${prior+1}, ${ai?'Rival':'human'}`);
  assert.equal(run('state.chain.midnight'),prior+1);
  if(health){assert.equal(run('p.champions[0].ready'),false);run(`activateChampion(0,${ai})`);assert.equal(run('state.chain.midnight'),prior+1,'Placement cannot activate twice');}
  else if(name!=='Law in Effect')assert.equal(run('p.discard[0].id===c.id'),true);
 }
 const art=run(`cardArtwork(mc(${JSON.stringify(name)}))`);assert.ok(fs.existsSync(path.join(__dirname,'..',art)));
 console.log(`PASS ${name}: cost, health, both players, activation levels 1–4, artwork`);
}
// New starter and market composition replace all old Midnight cards.
assert.equal(run('CHRONICLES.midnight.cards.length'),12);
assert.equal(run("makePlayer('Test').draw.filter(c=>c.name==='Puppy').length"),1);
assert.equal(run("CHRONICLES.midnight.cards.some(c=>c[0]==='Puppy')"),false);
// Earlier cards never gain retroactive bonuses; another suit never counts.
run(`reset();state.player.draw=Array.from({length:6},()=>basic());state.player.hand=[mc('Puppy'),mc('Sweeping Seagull'),mc('Puppy'),mc('Puppy')];playCard(0);playCard(0);playCard(0);playCard(0);`);
assert.equal(run('state.player.hand.length'),1);
run(`reset();state.chain.crimson=4;state.player.hand=[mc('Talon')];playCard(0)`);assert.equal(run('state.player.power'),0);
// Card doing the drawing is not itself in the recyclable Rest pile yet.
run(`reset();state.player.hand=[mc("Monkey's Deceit")];playCard(0)`);assert.equal(run('state.player.hand.length'),0);assert.equal(run('state.player.discard.length'),1);
// Cost and discount are consumed once; Law never enters owned piles.
run(`reset();state.market=[mc('Law in Effect')];state.player.grendels=2;state.player.discount=1;`);assert.equal(run('buy(0)'),false);assert.equal(run('state.player.discount'),1);
run('state.player.grendels=3');assert.equal(run('buy(0)'),true);assert.equal(run('state.player.grendels'),0);assert.equal(run('state.player.discount'),0);
assert.equal(run('[...state.player.hand,...state.player.draw,...state.player.discard].length'),0);
assert.equal(run("[...state.market,...state.marketDeck].filter(c=>c.name==='Law in Effect').length"),1);
// Two applications queue two discards, never retroactively in the current turn.
run(`reset();state.chain.midnight=2;state.player.grendels=8;state.market=[mc('Law in Effect'),mc('Law in Effect')];state.ai.hand=[basic(),basic(),basic()];buy(0);buy(0);`);assert.equal(run('state.ai.hand.length'),3);assert.equal(run('state.ai.pendingDiscards'),2);
(async()=>{
 await run('resolveStartOfTurnDiscards(state.ai,true)');assert.equal(run('state.ai.hand.length'),1);assert.equal(run('state.ai.pendingDiscards'),0);
 await run('resolveStartOfTurnDiscards(state.ai,true)');assert.equal(run('state.ai.hand.length'),1,'Do not repeat next turn');
 run(`reset();state.player.hand=[mc('Puppy'),mc('Talon'),mc('Wolf Pack')];state.player.pendingDiscards=2;state.player.grendels=9;state.market=[mc('Talon')];`);
 const choice=run('resolveStartOfTurnDiscards(state.player)');
 assert.equal(run('pendingCardChoice.remaining'),2);assert.equal(run('buy(0)'),false);assert.equal(run('playCard(0)'),false);
 assert.equal(run("resolveLawDiscard('not-a-card')"),false);
 run('resolveLawDiscard(state.player.hand[1].id)');assert.equal(run('state.player.discard[0].name'),'Talon');
 run('resolveLawDiscard(state.player.hand[1].id)');await choice;assert.equal(run('pendingCardChoice'),null);assert.equal(run('state.player.hand[0].name'),'Puppy');
 run(`reset();state.player.pendingDiscards=9`);await run('resolveStartOfTurnDiscards(state.player)');assert.equal(run('pendingCardChoice'),null);
 // Persist damage and reset readiness; manual Effect fires only once next turn.
 for(const name of ['Eagles Nest','Lions Pride','Bears Decree']){
  run(`reset();state.player.hand=[mc(${JSON.stringify(name)})];playCard(0);damageChampion(state.player,state.player.champions[0].id,1);`);
  const hp=run('state.player.champions[0].durability');await run('discardAndDraw(state.player)');assert.equal(run('state.player.champions[0].durability'),hp);
  run(`state.chain={};activateChampion(0);activateChampion(0)`);assert.equal(run('state.chain.midnight'),1);
  assert.ok(run('panel(state.player,false)').includes('current-health damaged'));
 }
 // Whole turn: Rival buys Law after its plays, draws and plays another card;
 // human must discard before the next turn unlocks.
 run(`reset();state.player.hand=Array.from({length:5},()=>basic());state.ai.hand=Array.from({length:4},()=>mc('Puppy'));state.ai.draw=[basic()];state.market=[mc('Law in Effect')];`);
 const turn=run('endTurn()');
 for(let i=0;i<100&&!run('!!pendingCardChoice');i++)await new Promise(r=>setTimeout(r,5));
 assert.equal(run('pendingCardChoice?.kind'),'law-discard');assert.equal(run('motion.busy'),true);
 assert.equal(run('state.ai.hand.length'),5,'Rival drew a new five-card hand after using the purchase draw');
 run('resolveLawDiscard(state.player.hand[0].id)');await turn;
 assert.equal(run('state.player.hand.length'),4);assert.equal(run('motion.busy'),false);assert.equal(run('state.turn'),'player');assert.deepEqual(plain('state.chain'),{});
 console.log('PASS integration: starter, no retroactive/cross-suit combos, contract purchase, stacked discard choices, Champion readiness/health, and full turn unlock.');
})().catch(e=>{console.error(e);process.exitCode=1});
