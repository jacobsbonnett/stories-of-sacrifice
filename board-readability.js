// Read-only previews remain available on either turn, even after using an Effect.
const championPreview=document.createElement('aside');championPreview.id='championPreview';championPreview.hidden=true;document.body.append(championPreview);
const inspectDialog=document.createElement('dialog');inspectDialog.id='inspectChampion';inspectDialog.setAttribute('aria-label','Champion details');
const inspectContent=document.createElement('div'),inspectClose=document.createElement('button');inspectClose.textContent='Close';inspectClose.onclick=()=>inspectDialog.close();inspectDialog.append(inspectContent,inspectClose);document.body.append(inspectDialog);
let inspectedChampion=null;
function fillChampionDetails(container,c){
 container.replaceChildren();const imagePath=cardArtwork(c);
 if(imagePath){const img=document.createElement('img');img.src=imagePath;img.alt=c.name;container.append(img);}
 const title=document.createElement('h2');title.textContent=c.name;
 const stats=document.createElement('p');stats.textContent=`Cost: ${c.cost} Grendels · Health: ${c.durability}/${championMaxHealth(c)}`;stats.className=c.durability<championMaxHealth(c)?'damaged':'';
 const effects=document.createElement('p');effects.textContent=c.text;
 const status=document.createElement('p');status.textContent=c.ready?'Effect available on its owner’s turn.':'Effect used this turn.';
 container.append(title,stats,effects,status);
}
function inspectChampion(side,id){const c=state[side]?.champions.find(c=>c.id===id);if(!c)return;inspectedChampion={side,id};fillChampionDetails(inspectContent,c);championPreview.hidden=true;inspectDialog.showModal();}
const renderBeforeReadability=render;
render=function(){
 championPreview.hidden=true;renderBeforeReadability();if(!state.player)return;
 for(const side of ['player','ai'])document.querySelectorAll(`#${side==='ai'?'aiPanel':'playerPanel'} .mini-champion`).forEach((el,i)=>{
  const c=state[side].champions[i];if(!c)return;
  const show=()=>{fillChampionDetails(championPreview,c);championPreview.hidden=false;const rect=el.getBoundingClientRect(),width=championPreview.offsetWidth,height=championPreview.offsetHeight;championPreview.style.left=`${Math.max(8,Math.min(rect.right+12,innerWidth-width-8))}px`;championPreview.style.top=`${Math.max(8,Math.min(rect.top,innerHeight-height-8))}px`;};
  el.onmouseenter=show;el.onfocus=show;el.onmouseleave=()=>championPreview.hidden=true;el.onblur=()=>championPreview.hidden=true;
  const button=document.createElement('button');button.className='inspect-champion-button';button.textContent='Inspect';button.setAttribute('aria-label',`Inspect ${c.name}`);button.onclick=()=>inspectChampion(side,c.id);el.after(button);
 });
 if(inspectDialog.open&&inspectedChampion){const c=state[inspectedChampion.side].champions.find(c=>c.id===inspectedChampion.id);if(c)fillChampionDetails(inspectContent,c);else inspectContent.textContent='This Champion is no longer on the field.';}
 let target=document.querySelector('#prestigeTarget');if(!target){target=document.createElement('span');target.id='prestigeTarget';document.querySelector('.resources').append(target);}
 target.textContent=`Target: ${state.prestigeTarget||40} Prestige${state.finale?' · Response turn':''}`;
};
