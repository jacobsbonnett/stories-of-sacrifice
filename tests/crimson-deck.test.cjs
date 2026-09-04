const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const elements=new Map();
const node=()=>({dataset:{},style:{setProperty(){}},classList:{add(){},remove(){}},append(){},prepend(){},replaceChildren(){},showModal(){},close(){},querySelector:()=>node(),setAttribute(){}});
const context=vm.createContext({document:{querySelector:s=>{if(!elements.has(s))elements.set(s,node());return elements.get(s)},querySelectorAll:()=>[],createElement:()=>node()},crypto:require('node:crypto').webcrypto,console,setTimeout,matchMedia:()=>({matches:true}),addEventListener(){}});context.window=context;
for(const f of ['game.js','crimson-deck.js','table-motion.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),context);
const run=s=>vm.runInContext(s,context);
run(`render=()=>{};log=()=>{};state.selected=['crimson'];function reset(){state.player=makePlayer('You');state.ai=makePlayer('Rival');state.turn='player';state.over=false;state.chain={};state.market=[];state.marketDeck=[];state.invoked=false;pendingCardChoice=null;}function cc(name){return createCard(CRIMSON_CARDS.find(c=>c[0]===name),'crimson');}reset();`);
assert.equal(run('CRIMSON_CARDS.length'),12);
assert.equal(run('CHRONICLES.crimson.cards.length'),11);
for(const name of ['Shield Maiden','Galahad','Joan of Ark','The Assassin']){
 run(`reset();state.player.hand=[cc(${JSON.stringify(name)})];playCard(0);`);
 assert.equal(run('state.player.champions[0].ready'),false,name);
 assert.equal(run('state.player.champions[0].durability'),name==='The Assassin'?4:5,name);
}
run(`reset();state.turn='ai';state.player.champions=[cc('Galahad')];state.chain.crimson=1;state.ai.hand=[cc('The Assassin')];playCard(0,true);`);
assert.equal(run('state.player.champions[0].durability'),3,'Rival Assassin');
assert.equal(run('pendingCardChoice'),null);
const expected=[['Barricade',0,1],['City Gates',1,2],['King’s Army',2,3],['Hero’s Call',2,2],['Battering Rams',1,3],['Catapult',1,4],['The Assassin',1,0],['Galahad',0,3],['Shield Maiden',0,1],['Graveyard',0,7],['Muster',0,4],['Joan of Ark',0,3]];
for(const [name,coins,power] of expected){run(`reset();state.chain.crimson=1;state.player.hand=[cc(${JSON.stringify(name)})];playCard(0);`);assert.equal(run('state.player.grendels'),coins,name);assert.equal(run('state.player.power'),power,name);}
run(`reset();state.player.draw=[basic(),basic(),basic()];state.player.hand=[cc('Barricade'),cc('Hero’s Call'),cc('City Gates')];playCard(0);playCard(0);playCard(0);`);
assert.equal(run('state.player.hand.length'),0,'No retroactive Combo 2');
run(`state.player.hand=[cc('Hero’s Call')];playCard(0)`);assert.equal(run('state.player.hand.length'),1,'Third or later draws');
run(`reset();state.player.draw=[basic(),basic()];state.chain.crimson=1;state.player.hand=[cc('Muster')];playCard(0)`);assert.equal(run('state.player.hand.length'),2);
run(`reset();state.player.hand=[cc('Galahad')];playCard(0);activateChampion(0)`);assert.equal(run('state.player.power'),3,'Placement once');
run(`damageChampion(state.player,state.player.champions[0].id,3);state.player.champions[0].ready=true;state.chain.crimson=1;activateChampion(0)`);assert.equal(run('state.player.champions[0].durability'),4);
assert.ok(run('panel(state.player,false)').includes('current-health damaged'));
run(`state.player.champions[0].ready=true;activateChampion(0)`);assert.equal(run('state.player.champions[0].durability'),5);
run(`reset();state.ai.champions=[cc('Galahad'),cc('Shield Maiden')];state.chain.crimson=1;state.player.hand=[cc('The Assassin')];playCard(0);`);assert.equal(run('!!pendingCardChoice'),true);
run('resolveAssassinTarget(state.ai.champions[1].id)');assert.equal(run('state.ai.champions[0].durability'),5);assert.equal(run('state.ai.champions[1].durability'),3);
run(`state.player.power=1;attackChampion(1)`);assert.equal(run('state.ai.champions[1].durability'),2);
run(`state.player.power=2;attackChampion(1)`);assert.equal(run('state.ai.champions.length'),1);assert.equal(run('state.ai.discard.length'),1);
(async()=>{
 run(`reset();state.player.champions=[cc('Galahad')];damageChampion(state.player,state.player.champions[0].id,2);`);await run('discardAndDraw(state.player)');assert.equal(run('state.player.champions[0].durability'),3);assert.equal(run('state.player.champions[0].ready'),true);
 run(`reset();state.ai.champions=[cc('Galahad')];state.chain.crimson=1;state.player.hand=[cc('The Assassin'),cc('Barricade')];`);
 const playing=elements.get('#playAll').onclick();assert.equal(run('!!pendingCardChoice'),true);run('resolveAssassinTarget(state.ai.champions[0].id)');await playing;assert.equal(run('state.player.hand.length'),0);assert.equal(run('motion.busy'),false);
 console.log('Crimson tests passed: 12 effects, activation-only combos, placement/manual effects, chosen damage, persistent health, healing cap, and Play all target selection.');
})().catch(e=>{console.error(e);process.exitCode=1});
