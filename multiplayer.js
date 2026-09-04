// Online mode sends intents only. The server owns cards, shuffles, and resources.
const online={room:null,token:null,revision:-1,ready:false,busy:false,invite:null,timer:null,shownResult:false};
globalThis.onlineMatch=online;
const onlineLobby=document.createElement('section');onlineLobby.className='online-lobby';
onlineLobby.innerHTML='<h2>Play with a friend</h2><p>Each player chooses two decks. Create a room, then share its invitation with one friend.</p><label>Your name <input id="onlineName" maxlength="24" value="Player" autocomplete="nickname"></label><div id="onlineDecks"></div><div><button id="onlineHost">Create private room</button><button id="onlineJoin" hidden>Join your friend</button></div><p id="onlineHelp">Online rooms last 24 hours. Keep this browser to reconnect to your seat.</p>';
$('#chronicleChoices').before(onlineLobby);
function onlineDeckChoices(excluded=[]){$('#onlineDecks').replaceChildren(...Object.entries(CHRONICLES).map(([key,deck])=>{const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.value=key;input.disabled=excluded.includes(key);label.append(input,document.createTextNode(deck.name+(input.disabled?' — friend’s choice':'')));return label;}));}
const selectedOnline=()=>[...document.querySelectorAll('#onlineDecks input:checked')].map(input=>input.value);
onlineDeckChoices();
const onlineStatus=document.createElement('div');onlineStatus.className='online-status';document.body.append(onlineStatus);
const onlineChoice=document.createElement('dialog');onlineChoice.id='onlineChoice';onlineChoice.innerHTML='<h2 id="onlineChoiceTitle"></h2><div id="onlineChoiceList"></div>';onlineChoice.oncancel=e=>e.preventDefault();document.body.append(onlineChoice);
function sessionKey(room){return `sacrifice-room-${room}`;}
function setStatus(text){onlineStatus.replaceChildren(document.createTextNode(text));if(online.invite){const b=document.createElement('button');b.textContent='Copy invite';b.onclick=async()=>{try{await navigator.clipboard.writeText(online.invite);b.textContent='Copied!';}catch{prompt('Copy this private invitation:',online.invite);}};onlineStatus.append(b);}}
async function api(path,body){
 const response=await fetch(path,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(online.token?{Authorization:`Bearer ${online.token}`}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store',signal:AbortSignal.timeout(15000)});
 const data=await response.json();if(!response.ok){const error=new Error(data.error||'Connection failed.');error.status=response.status;throw error;}return data;
}
function showOnlineChoice(){
 const choice=state.choice;if(!choice||state.turn!=='player'){onlineChoice.close();return;}
 const cards=choice.kind==='assassin'?state.ai.champions:choice.kind==='sacrifice'?state.player.discard.filter(c=>(state.player.playedThisTurn||[]).includes(c.id)):state.player.hand;
 $('#onlineChoiceTitle').textContent=choice.kind==='assassin'?'The Assassin — deal 2 damage':choice.kind==='sacrifice'?'Seraphine — choose a sacrifice':`Law in Effect — discard ${choice.remaining} card(s)`;
 $('#onlineChoiceList').replaceChildren(...cards.map(c=>{const button=document.createElement('button');button.textContent=`${c.name} — ${choice.kind==='assassin'?`${c.durability} health`:choice.kind==='sacrifice'?`${Math.ceil(c.cost/2)} Prestige`:c.text}`;button.onclick=()=>sendOnline({type:'choose',id:c.id});return button;}));
 if(!onlineChoice.open)onlineChoice.showModal();
}
function acceptOnline(data){
 if(data.revision<online.revision)return;
 online.ready=data.ready;
 if(!data.state){online.revision=data.revision;$('#onlineHost').disabled=true;$('#onlineName').disabled=true;$('#onlineHelp').textContent='Your two decks are locked in. Copy the invitation above and send it to your friend.';setStatus('Waiting for your friend to choose two decks…');return;}
 if(data.revision!==online.revision){
  online.revision=data.revision;Object.assign(state,data.state);
  $('#setup').classList.add('hidden');$('#game').classList.remove('hidden');
  render();$('#log').textContent=state.message;showOnlineChoice();
  if(state.over&&!online.shownResult){online.shownResult=true;$('#resultTitle').textContent=state.winner==='draw'?'The match is a draw':state.winner==='player'?'You won!':'Your friend won';$('#resultText').textContent=state.message;$('#resultDialog').showModal();}
 }
 setStatus(!online.ready?'Waiting for your friend…':state.over?'Match finished':state.turn==='player'?'Online · Your turn':`Online · ${state.ai.name}’s turn`);
 $('#endTurn').disabled=!online.ready||state.turn!=='player'||!!state.choice||state.over;
 $('#playAll').disabled=!online.ready||state.turn!=='player'||!!state.choice||state.over;
}
async function pollOnline(){
 if(!online.room)return;
 try{if(!online.busy)acceptOnline(await api(`/api/rooms/${online.room}`));}
 catch(error){setStatus(error.status===404?'Room expired. Start a new match.':'Connection interrupted — reconnecting…');}
 clearTimeout(online.timer);online.timer=setTimeout(pollOnline,1200);
}
function enterOnline(data){
 online.room=data.room;online.token=data.token||online.token;
 if(data.invite)online.invite=`${location.origin}${location.pathname}#room=${data.room}&invite=${data.invite}`;
 localStorage.setItem(sessionKey(data.room),JSON.stringify({token:online.token,invite:online.invite}));
 history.replaceState(null,'',`#room=${data.room}`);acceptOnline(data);pollOnline();
}
async function sendOnline(action){
 if(online.busy||!online.ready||state.over||state.turn!=='player')return false;
 online.busy=true;const body={action,revision:online.revision,requestId:crypto.randomUUID()};
 try{
  let data;try{data=await api(`/api/rooms/${online.room}/actions`,body);}catch(error){if(error.status)throw error;data=await api(`/api/rooms/${online.room}/actions`,body);}
  acceptOnline(data);return true;
 }catch(error){setStatus(error.message);try{const data=await api(`/api/rooms/${online.room}`);acceptOnline(data);setStatus(error.message);}catch{}return false;}
 finally{online.busy=false;}
}
const soloActions={playCard,activateChampion,buy,attackChampion,invoke,invokeCommonPurse,endTurn,start};
playCard=function(i,...args){return online.room?sendOnline({type:'play',id:state.player.hand[i]?.id}):soloActions.playCard(i,...args);};
activateChampion=function(i,...args){return online.room?sendOnline({type:'effect',id:state.player.champions[i]?.id}):soloActions.activateChampion(i,...args);};
buy=function(i,...args){return online.room?sendOnline({type:'buy',id:state.market[i]?.id}):soloActions.buy(i,...args);};
attackChampion=function(i,...args){return online.room?sendOnline({type:'attack',id:state.ai.champions[i]?.id}):soloActions.attackChampion(i,...args);};
invoke=function(key,...args){return online.room?sendOnline({type:'invoke',key}):soloActions.invoke(key,...args);};
invokeCommonPurse=function(...args){return online.room?sendOnline({type:'exchange'}):soloActions.invokeCommonPurse(...args);};
endTurn=function(...args){return online.room?sendOnline({type:'end'}):soloActions.endTurn(...args);};
start=function(...args){if(online.room)throw new Error('Leave the online match before starting a solo game.');return soloActions.start(...args);};
$('#endTurn').onclick=()=>endTurn();
const soloPlayAll=$('#playAll').onclick;
$('#playAll').onclick=async()=>{
 if(!online.room)return soloPlayAll();
 while(state.player.hand.some(canPlayCard)&&!state.choice&&state.turn==='player'&&!state.over){if(!await playCard(state.player.hand.findIndex(canPlayCard)))break;}
};
$('#onlineHost').onclick=async()=>{
 if(online.busy)return;online.busy=true;
 try{if(selectedOnline().length!==2)throw new Error('Choose exactly two decks in the multiplayer section.');enterOnline(await api('/api/rooms',{selected:selectedOnline(),name:$('#onlineName').value}));}
 catch(error){$('#onlineHelp').textContent=error.message;}finally{online.busy=false;}
};
const invitation=new URLSearchParams(location.hash.slice(1));
if(invitation.get('room')){
 const room=invitation.get('room');let saved;try{saved=JSON.parse(localStorage.getItem(sessionKey(room)));}catch{}
 if(saved?.token){online.room=room;online.token=saved.token;online.invite=saved.invite;pollOnline();}
 else if(invitation.get('invite')){
  $('#onlineJoin').hidden=false;$('#onlineJoin').disabled=true;$('#onlineHost').hidden=true;$('#onlineHelp').textContent='Your friend invited you. Enter your name and choose two available decks.';onlineLobby.scrollIntoView({block:'center'});
  api(`/api/rooms/${room}/invite`,{invite:invitation.get('invite')}).then(data=>{onlineDeckChoices(data.selected);$('#onlineJoin').disabled=false;}).catch(error=>$('#onlineHelp').textContent=error.message);
  $('#onlineJoin').onclick=async()=>{if(online.busy)return;online.busy=true;try{enterOnline(await api(`/api/rooms/${room}/join`,{invite:invitation.get('invite'),name:$('#onlineName').value,selected:selectedOnline()}));}catch(error){$('#onlineHelp').textContent=error.message;}finally{online.busy=false;}};
 }
}
for(const selector of ['#newGame','#resultRestart'])$(selector).onclick=()=>{if(!online.room||confirm('Leave this match? You can reconnect using this room address in the same browser.'))location.assign(location.pathname);};
