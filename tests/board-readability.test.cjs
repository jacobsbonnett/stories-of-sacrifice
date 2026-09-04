const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function node(){return {children:[],style:{},hidden:false,open:false,offsetWidth:370,offsetHeight:600,append(...items){this.children.push(...items);},replaceChildren(...items){this.children=items;},setAttribute(){},showModal(){this.open=true;},close(){this.open=false;},after(button){this.inspectButton=button;},getBoundingClientRect(){return {right:120,top:60};}};}
test('both field sides can inspect used Champions without playing or attacking',()=>{
 const playerButton=node(),rivalButton=node(),resources=node();
 const snapshot={player:{champions:[{id:'own',name:'Galahad',cost:5,durability:3,maxHealth:5,text:'Gain 3 Power. Combo: heal 2.',ready:false}]},ai:{champions:[{id:'foe',name:'Enemy',cost:6,durability:2,maxHealth:2,text:'Draw a card.',ready:true}]},prestigeTarget:80};
 const context=vm.createContext({document:{body:node(),createElement:node,querySelector:s=>s==='.resources'?resources:null,querySelectorAll:s=>s.includes('#aiPanel')?[rivalButton]:[playerButton]},snapshot,innerWidth:1200,innerHeight:900});
 vm.runInContext('const state=snapshot;let render=()=>{};const cardArtwork=()=>null;const championMaxHealth=c=>c.maxHealth;',context);
 vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../board-readability.js'),'utf8'),context);
 const before=JSON.stringify(snapshot);vm.runInContext('render()',context);
 playerButton.inspectButton.onclick();assert.equal(vm.runInContext('inspectDialog.open',context),true);
 assert.ok(vm.runInContext('inspectContent.children.some(el=>el.textContent?.includes("3/5"))',context));
 vm.runInContext('inspectDialog.close()',context);rivalButton.inspectButton.onclick();
 assert.ok(vm.runInContext('inspectContent.children.some(el=>el.textContent==="Draw a card.")',context));
 assert.equal(JSON.stringify(snapshot),before);
 assert.equal(resources.children[0].textContent,'Target: 80 Prestige');
});
