// The Burning Judge: approved roster, private deck-order choices, and Anukar invocation.
const JUDGE_CARDS=[
 ['Lost Soul',0,'action','grendels',1,'Effect: Gain 1 Grendel.',0,'lost-soul'],
 ['Anukar, Judge of Souls',8,'champion','judge-return',1,"Effect: Choose 1 card from your Rest pile and place it on top of your draw pile. Combo: Place 1 random card from your opponent's hand into their Rest pile. Combo 2: Draw 2 cards.",4,'anukar-judge-of-souls'],
 ['Final Judgment',7,'action','power',3,"Effect: Gain 3 Power. Combo: Look at the top 3 cards of your draw pile and place them back in any order. Combo 2: Place 1 random card from your opponent's hand into their Rest pile.",0,'final-judgment'],
 ['Keeper of Souls',6,'champion','power',2,'Effect: Gain 2 Power. Combo: Choose 1 card from your Rest pile and place it on top of your draw pile. Combo 2: Draw 1 card.',3,'keeper-of-souls'],
 ['Scales of Judgment',6,'action','judge-order',3,'Effect: Look at the top 3 cards of your draw pile and place them back in any order. Combo: Draw 1 card. Combo 2: Gain 3 Power.',0,'scales-of-judgment'],
 ['Condemned Soul',5,'action','power',2,"Effect: Gain 2 Power. Combo: Place 1 random card from your opponent's hand into their Rest pile. Combo 2: Gain 2 Power.",0,'condemned-soul'],
 ['Flames of Judgment',5,'action','power',3,'Effect: Gain 3 Power. Combo: Look at the top 3 cards of your draw pile and place them back in any order. Combo 2: Draw 1 card.',0,'flames-of-judgment'],
 ['Soul Collector',5,'champion','power',1,'Effect: Gain 1 Power. Combo: Choose 1 card from your Rest pile and place it on top of your draw pile. Combo 2: Gain 2 Power.',3,'soul-collector'],
 ['Weigh the Soul',4,'action','judge-order',3,"Effect: Look at the top 3 cards of your draw pile and place them back in any order. Combo: Gain 2 Power. Combo 2: Place 1 random card from your opponent's hand into their Rest pile.",0,'weigh-the-soul'],
 ['Passage Beyond',4,'action','grendels',1,'Effect: Gain 1 Grendel. Combo: Choose 1 card from your Rest pile and place it on top of your draw pile. Combo 2: Draw 1 card.',0,'passage-beyond'],
 ['Burning Verdict',4,'action','power',2,"Effect: Gain 2 Power. Combo: Gain 1 Grendel. Combo 2: Place 1 random card from your opponent's hand into their Rest pile.",0,'burning-verdict'],
 ['Glimpse of Fate',3,'action','judge-order',3,'Effect: Look at the top 3 cards of your draw pile and place them back in any order. Combo: Gain 1 Power. Combo 2: Draw 1 card.',0,'glimpse-of-fate']
];
const judgeDefinition=c=>c.suit==='ashen'?JUDGE_CARDS.find(r=>r[0]===c.name):null;
Object.assign(CHRONICLES.ashen,{name:'The Burning Judge',legend:'Anukar, Judge of Souls',color:'#ed732e',pitch:'Recall cards from Rest, reorder fate, and condemn cards from the rival hand.',start:{name:'Lost Soul',effect:'grendels',value:1,text:'Effect: Gain 1 Grendel.'},cards:JUDGE_CARDS.slice(1)});
SUIT_COLORS.ashen='#ed732e';

function judgeFillTopThree(p){
 if(p.draw.length>=3)return;
 const recyclable=p.discard.filter(c=>!c.returnToStock);p.discard=p.discard.filter(c=>c.returnToStock);
 // The shuffled Rest pile goes beneath cards already in Draw; the array's end is the top.
 p.draw=[...shuffle(recyclable),...p.draw];
}
function randomRivalDiscard(foe){if(!foe.hand.length)return null;const i=Math.floor(Math.random()*foe.hand.length);return foe.discard.push(...foe.hand.splice(i,1))[0];}
function finishJudgeChoice(q){const p=q.isAI?state.ai:state.player;if(q.after?.draw)draw(p,q.after.draw);const done=q.resolve;pendingCardChoice=null;const d=$('#judgeChoiceDialog');if(d?.open)d.close();render();if(done)done();}
function resolveJudgeChoice(id){
 const q=pendingCardChoice;if(!q||!['judge-rest','judge-order'].includes(q.kind))return false;const p=q.isAI?state.ai:state.player;
 const pool=q.kind==='judge-rest'?p.discard:q.cards,index=pool.findIndex(c=>c.id===id);if(index<0)return false;
 q.selected.push(...pool.splice(index,1));q.remaining--;
 if(q.remaining>0&&pool.length){showJudgeChoice();return true;}
 if(q.kind==='judge-rest')for(const c of [...q.selected].reverse())p.draw.push(c);
 else for(const c of [...q.selected].reverse())p.draw.push(c);
 finishJudgeChoice(q);return true;
}
function showJudgeChoice(){
 const q=pendingCardChoice;if(!q||q.isAI)return;let d=$('#judgeChoiceDialog');
 if(!d){d=document.createElement('dialog');d.id='judgeChoiceDialog';d.innerHTML='<h2></h2><p></p><div class="judge-choice-list"></div>';d.oncancel=e=>e.preventDefault();document.body.append(d);}
 d.querySelector('h2').textContent=q.title;d.querySelector('p').textContent=q.kind==='judge-order'?'Choose the next card to draw. Then choose the cards that follow.':'Choose the next card to place on top of your Draw pile.';
 const pool=q.kind==='judge-rest'?state.player.discard:q.cards,buttons=pool.map(c=>{const b=document.createElement('button');b.className='judge-choice-card';const img=document.createElement('img');img.src=cardArtwork(c);img.alt='';const name=document.createElement('strong');name.textContent=c.name;const effect=document.createElement('span');effect.textContent=c.text;b.append(img,name,effect);b.setAttribute('aria-label',`${c.name}. ${c.text}`);b.onclick=()=>resolveJudgeChoice(c.id);return b;});d.querySelector('.judge-choice-list').replaceChildren(...buttons);if(!d.open)d.showModal();
}
function openJudgeChoice(kind,p,isAI,count,title,after=null){
 const pool=kind==='judge-rest'?p.discard:null;if(kind==='judge-rest'&&!pool.length)return false;
 if(kind==='judge-order'){judgeFillTopThree(p);if(!p.draw.length)return false;const cards=p.draw.splice(Math.max(0,p.draw.length-3));if(isAI){p.draw.push(...cards);if(after?.draw)draw(p,after.draw);return true;}cardChoiceFinished=new Promise(resolve=>{pendingCardChoice={kind,cards,selected:[],remaining:cards.length,title,isAI:false,after,resolve};});showJudgeChoice();return true;}
 const amount=Math.min(count,pool.length);if(isAI){const chosen=[...pool].sort((a,b)=>b.cost-a.cost).slice(0,amount);for(const c of [...chosen].reverse())p.draw.push(...pool.splice(pool.findIndex(x=>x.id===c.id),1));if(after?.draw)draw(p,after.draw);return true;}
 cardChoiceFinished=new Promise(resolve=>{pendingCardChoice={kind,selected:[],remaining:amount,title,isAI:false,after,resolve};});showJudgeChoice();return true;
}
const applyBeforeJudge=apply;
apply=function(p,c,isAI=false){
 if(!judgeDefinition(c))return applyBeforeJudge(p,c,isAI);const count=state.chain.ashen=(state.chain.ashen||0)+1,foe=isAI?state.player:state.ai;
 if(c.effect==='grendels')p.grendels+=c.value;if(c.effect==='power')p.power+=c.value;
 if(c.effect==='judge-return')openJudgeChoice('judge-rest',p,isAI,1,`${c.name} — choose from Rest`,count>=3?{draw:2}:null);
 if(c.effect==='judge-order')openJudgeChoice('judge-order',p,isAI,3,`${c.name} — order the top cards`);
 if(count>=3){
  if(c.name==='Final Judgment')randomRivalDiscard(foe);if(c.name==='Keeper of Souls')draw(p,1);if(c.name==='Scales of Judgment')p.power+=3;if(c.name==='Condemned Soul')p.power+=2;if(c.name==='Flames of Judgment')draw(p,1);if(c.name==='Soul Collector')p.power+=2;if(c.name==='Weigh the Soul')randomRivalDiscard(foe);if(c.name==='Passage Beyond')draw(p,1);if(c.name==='Burning Verdict')randomRivalDiscard(foe);if(c.name==='Glimpse of Fate')draw(p,1);
 }else if(count>=2){
  if(['Anukar, Judge of Souls','Condemned Soul'].includes(c.name))randomRivalDiscard(foe);
  if(['Final Judgment','Flames of Judgment'].includes(c.name))openJudgeChoice('judge-order',p,isAI,3,`${c.name} — order the top cards`);
  if(['Keeper of Souls','Soul Collector','Passage Beyond'].includes(c.name))openJudgeChoice('judge-rest',p,isAI,1,`${c.name} — choose from Rest`);
  if(c.name==='Scales of Judgment')draw(p,1);if(c.name==='Weigh the Soul')p.power+=2;if(c.name==='Burning Verdict')p.grendels++;if(c.name==='Glimpse of Fate')p.power++;
 }
};
function anukarCount(isAI=false){return state.legends.ashen===(isAI?'player':'ai')?1:state.legends.ashen===(isAI?'ai':'player')?2:1;}
const invokeBeforeJudge=invoke;
invoke=function(key,isAI=false,...args){
 if(key!=='ashen')return invokeBeforeJudge(key,isAI,...args);const p=isAI?state.ai:state.player,side=isAI?'ai':'player',other=isAI?'player':'ai';
 if(state.invoked||state.turn!==side||p.grendels<4||!p.discard.length||pendingCardChoice)return false;
 const amount=anukarCount(isAI);p.grendels-=4;state.legends.ashen=state.legends.ashen===other?null:side;state.invoked=true;openJudgeChoice('judge-rest',p,isAI,amount,'Anukar — choose from Rest');if(!isAI){log(`Anukar: paid 4 Grendels. Choose ${amount} card${amount===1?'':'s'} from Rest.`);render();}return true;
};
const legendTextBeforeJudge=legendText;legendText=function(key){if(key!=='ashen')return legendTextBeforeJudge(key);const n=state.player?anukarCount():1;return `Pay 4 Grendels: place ${n} card${n===1?'':'s'} from your Rest pile on top of your Draw pile${n===2?' in your chosen order':''}.`;};
const artworkBeforeJudge=cardArtwork;cardArtwork=function(c){const def=judgeDefinition(c);return def?`assets/judge/${def[7]}.png`:artworkBeforeJudge(c);};
const libraryBeforeJudge=renderLibrary;renderLibrary=function(){libraryBeforeJudge();$$('#libraryCards .library-card').forEach(el=>{const name=el.querySelector('h3')?.textContent,src=cardArtwork({name,suit:'ashen'});if(!src||el.querySelector('.library-printed-card'))return;const img=document.createElement('img');img.src=src;img.alt=name;img.className='library-printed-card';el.prepend(img);});};
