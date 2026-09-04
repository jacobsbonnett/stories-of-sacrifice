// Artwork and lore are separate from Chronicle rules and stable game IDs.
const CHARACTER_TOKENS={
  midnight:{name:'The Midnight Parliament',legend:'The Veiled Council',asset:'midnight',color:'#9b62d5',lore:'A secret assembly of ancient beasts that gathers beneath the midnight moon. Led by the enigmatic Owl Sovereign, they trade in secrets, prophecy, and carefully chosen truths.'},
  crimson:{name:'The Crimson Standard',legend:'Sir Aurelius, the Unbroken',asset:'crimson',color:'#bd304d',lore:'A legendary commander who carried the Crimson Standard into battles others believed lost. His followers believe sacrifice in defense of another is the highest form of honor.'},
  hours:{name:'The Keeper of Hours',legend:'Chronarch Vaelor',asset:'hours',color:'#77caff',lore:'An ancient keeper entrusted with the passage of time. Vaelor watches countless possible futures through his enchanted hourglass, knowing that changing even one moment may demand a terrible price.'},
  gilded:{name:'The Gilded Gorgon',legend:'Seraphine, the Gilded Gorgon',asset:'gorgon',color:'#eee3bc',lore:'Once a revered oracle, Seraphine was cursed so that those who sought her divine visions risked becoming stone. She now guards sacred knowledge from those who would abuse it.'},
  ashen:{name:'The Burning Judge',legend:'Anukar, Judge of Souls',asset:'judge',color:'#ed732e',lore:'Guardian of the passage between life and death. Anukar weighs every soul against the deeds of its lifetime, and neither wealth, title, nor deception can influence his judgment.'},
  velvet:{name:'The Golden Deceiver',legend:'Vaelis, Lord of Masks',asset:'deceiver',color:'#e7bd39',lore:'A charming trickster who can become whatever his victim most wants to see. Vaelis rarely tells a complete lie; instead, he manipulates fragments of truth until others deceive themselves.'}
};
for(const [key,character] of Object.entries(CHARACTER_TOKENS)){
  Object.assign(CHRONICLES[key],{name:character.name,legend:character.legend,color:character.color});
  SUIT_COLORS[key]=character.color;
}
function tokenImage(character){const img=document.createElement('img');img.className='character-art';img.src=`assets/${character.asset}.png`;img.alt=character.legend;return img;}
$('#chronicleChoices').replaceChildren();setupChoices();
$$('#chronicleChoices .choice').forEach(choice=>{
  const key=choice.dataset.key,c=CHARACTER_TOKENS[key];choice.style.setProperty('--suit',c.color);
  choice.prepend(tokenImage(c));choice.querySelector('p').textContent=c.lore;
  choice.tabIndex=0;choice.setAttribute('role','checkbox');choice.setAttribute('aria-checked',state.selected.includes(key));
  choice.onclick=()=>{toggleChoice(key,choice);choice.setAttribute('aria-checked',state.selected.includes(key));};
  choice.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choice.click();}};
});
const tokenPresentation={seen:new Set(),angles:{}};
const renderBeforeCharacters=render;
render=function(){
  renderBeforeCharacters();if(!state.player)return;
  $$('#legends .legend').forEach((placard,index)=>{
    const key=state.selected[index],c=CHARACTER_TOKENS[key];
    placard.classList.add('character-placard');
    if(!c){
      const coin=placard.querySelector('.grendel-coin');
      if(coin)coin.replaceWith(tokenImage({asset:'purse',legend:'The Common Purse'}));
      return;
    }
    const token=placard.querySelector('.legend-token');
    let rotor=token.querySelector('.edge-rotor');
    if(!rotor){
    token.className='legend-token character-token';token.replaceChildren(tokenImage(c));
    rotor=document.createElement('span');rotor.className='edge-rotor';
    const arrow=document.createElement('img');arrow.src='assets/edge-dial.png';arrow.alt='';arrow.className='edge-arrow';rotor.append(arrow);token.append(rotor);
    }
    const owner=state.legends[key];
    placard.classList.toggle('player',owner==='player');placard.classList.toggle('ai',owner==='ai');
    const status=placard.querySelector('.allegiance-status');
    if(status)status.textContent=owner==='player'?'Points to you':owner==='ai'?'Points to rival':'Neutral';
    token.setAttribute('aria-label',status?.textContent||'Neutral');
    const angle={ai:0,player:180}[state.legends[key]]??90;
    rotor.style.transform=`rotate(${angle}deg)`;
    const previous=tokenPresentation.angles[key]??90;
    if(previous!==angle&&!reducedMotion())rotor.animate([{transform:`rotate(${previous}deg)`},{transform:`rotate(${angle}deg)`}],{duration:500,easing:'ease-in-out'});
    tokenPresentation.angles[key]=angle;
    if(!tokenPresentation.seen.has(key)&&!reducedMotion())token.animate([{transform:'translateY(-55px) scale(1.08)',opacity:0},{transform:'translateY(3px)',opacity:1,offset:.8},{transform:'translateY(0)'}],{duration:550,delay:index*90,fill:'backwards'});
    tokenPresentation.seen.add(key);
    if(placard.querySelector('.character-lore'))return;
    const lore=document.createElement('details');lore.className='character-lore';
    const summary=document.createElement('summary');summary.textContent='Character story';
    const text=document.createElement('p');text.textContent=c.lore;lore.append(summary,text);placard.append(lore);
  });
};
const startBeforeCharacters=start;
start=function(){if(motion.busy)return startBeforeCharacters();$('#legends').replaceChildren();tokenPresentation.seen.clear();tokenPresentation.angles={};return startBeforeCharacters();};
$('#startGame').onclick=()=>start();
