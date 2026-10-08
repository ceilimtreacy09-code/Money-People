const GHOST=new Proxy(function(){},{get:(t,p)=>p==='value'?'':p==='style'?GHOST:p==='dataset'?{}:p==='classList'?{add(){},remove(){},toggle(){},contains(){return false}}:p===Symbol.toPrimitive?()=>'':()=>GHOST,set:()=>true,apply:()=>GHOST});
const byId=id=>document.getElementById(id)||GHOST;
const $=id=>byId(id),KEY='commandHub_v1';
const SC=['Food','Transport','Gear & training','Supplements','Business & tech','Fun','Other'],IC=['Wages','Client work','Gift','Other'];
const fresh=()=>({tx:[],goals:[{id:1,name:'Emergency buffer',target:500}],budgets:{},logs:{},tasks:[],links:[{n:'Iron Prep — Army Training',u:'prep.html'},{n:'Money & People',u:'index.html'}]});
let S=fresh(),ty='spend',en=0;
function load(){try{const r=localStorage.getItem(KEY);if(r)S=Object.assign(fresh(),JSON.parse(r))}catch(e){}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
const pad=n=>String(n).padStart(2,'0'),dk=(d=new Date())=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const E=n=>'€'+(+n||0).toFixed(2),esc=s=>{const d=document.createElement('div');d.textContent=s||'';return d.innerHTML};
const sum=(l,f)=>l.reduce((a,t)=>a+(f(t)?+t.amt:0),0);
const wk0=()=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return dk(d)};
const mo=()=>dk().slice(0,7);

function catOptions(){
  $('tCat').innerHTML=ty==='spend'?SC.map(c=>`<option>${c}</option>`).join(''):ty==='income'?IC.map(c=>`<option>${c}</option>`).join(''):S.goals.map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join('')+'<option value="0">General savings</option>';
  $('qCat').innerHTML=SC.map(c=>`<option>${c}</option>`).join('')}
function renderHub(){
  const all=S.tx,m=all.filter(t=>t.date.startsWith(mo())),w=all.filter(t=>t.date>=wk0());
  const avail=sum(all,t=>t.type==='income')-sum(all,t=>t.type==='spend')-sum(all,t=>t.type==='save');
  $('hAvail').textContent=E(avail);$('hAvail').className='num'+(avail<0?' neg':'');
  $('hSpent').textContent=E(sum(m,t=>t.type==='spend'));$('hSaved').textContent=E(sum(all,t=>t.type==='save'));
  $('hTasks').textContent=S.tasks.filter(t=>!t.done).length;
  let s=0,d=new Date();if(!S.logs[dk(d)])d.setDate(d.getDate()-1);while(S.logs[dk(d)]){s++;d.setDate(d.getDate()-1)}$('hStreak').textContent=s;
  $('wSpent').textContent=E(sum(w,t=>t.type==='spend'));$('wSaved').textContent=E(sum(w,t=>t.type==='save'));$('wInc').textContent=E(sum(w,t=>t.type==='income'));
  $('wLogs').textContent=Object.keys(S.logs).filter(k=>k>=wk0()).length;
  $('links').innerHTML=S.links.map((l,i)=>`<div class="link"><a href="${esc(l.u)}" ${/^https?:/i.test(l.u)?' target="_blank" rel="noopener"':''}>${esc(l.n)} ↗</a><button class="x" data-dl="${i}">×</button></div>`).join('')||'<p class="lbl">No pages yet.</p>'}
function renderMoney(){
  const m=S.tx.filter(t=>t.date.startsWith(mo())),inc=sum(m,t=>t.type==='income'),sp=sum(m,t=>t.type==='spend'),sv=sum(m,t=>t.type==='save');
  $('mInc').textContent=E(inc);$('mSpend').textContent=E(sp);$('mSave').textContent=E(sv);$('mRate').textContent=inc>0?Math.round(sv/inc*100)+'%':'—';
  $('budgets').innerHTML=SC.map(c=>{const sc=sum(m,t=>t.type==='spend'&&t.cat===c),lim=+S.budgets[c]||0,p=lim?Math.min(100,sc/lim*100):0;
    return `<div class="brow"><div><span>${c}</span> <span class="lbl">${E(sc)}${lim?' / '+E(lim):''}</span><div class="meter"><div class="fill ${lim&&sc>lim?'over':''}" style="width:${p}%"></div></div></div><input type="number" data-b="${c}" value="${lim||''}" placeholder="limit"></div>`}).join('');
  const l=[...S.tx].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,30);
  $('txs').innerHTML=l.length?l.map(t=>{const i=S.tx.indexOf(t),g=t.type==='save'?(S.goals.find(x=>x.id==t.cat)||{name:'General savings'}).name:t.cat;
    return `<div class="hist"><div><div class="t">${t.date} — ${t.type.toUpperCase()} — ${esc(g)}</div><span class="${t.type==='income'?'inc':t.type==='save'?'sav':'exp'}">${t.type==='income'?'+':'−'}${E(t.amt)}</span>${t.note?' · '+esc(t.note):''}</div><button class="x" data-dt="${i}">×</button></div>`}).join(''):'<p class="lbl">Nothing logged yet.</p>'}
function renderGoals(){
  $('goals').innerHTML=S.goals.map((g,i)=>{const s=sum(S.tx,t=>t.type==='save'&&t.cat==g.id),p=g.target?Math.min(100,s/g.target*100):0;
    return `<div class="card" style="margin-bottom:8px"><div class="row" style="justify-content:space-between;margin:0"><h3 style="margin:0">${esc(g.name)}</h3><button class="x" data-dg="${i}">×</button></div><div class="num">${E(s)} <span class="lbl">/ ${E(g.target)}</span></div><div class="meter"><div class="fill" style="width:${p}%"></div></div><div class="lbl">${Math.round(p)}% — ${E(Math.max(0,g.target-s))} to go</div></div>`}).join('')||'<p class="lbl">No goals yet.</p>'}
function renderLog(){
  const e=S.logs[dk()]||{};$('lSleep').value=e.sleep||'';$('lWins').value=e.wins||'';$('lLess').value=e.less||'';$('lTop').value=e.top||'';en=e.energy||0;chipsE();
  const k=Object.keys(S.logs).sort().reverse().slice(0,14);
  $('logs').innerHTML=k.length?k.map(d=>{const x=S.logs[d];return `<div class="hist"><div><div class="t">${d} — SLEEP ${x.sleep||'—'}H — ENERGY ${x.energy||'—'}/5</div>${x.wins?'<b>Wins:</b> '+esc(x.wins)+'<br>':''}${x.less?'<b>Lessons:</b> '+esc(x.less)+'<br>':''}${x.top?'<b>Next:</b> '+esc(x.top):''}</div><button class="x" data-dlg="${d}">×</button></div>`}).join(''):'<p class="lbl">No entries yet.</p>';renderTasks()}
function chipsE(){$('eChips').innerHTML=[1,2,3,4,5].map(n=>`<button class="chip ${en===n?'on':''}" data-en="${n}" style="padding:8px 11px">${n}</button>`).join('')}
function renderTasks(){$('tasks').innerHTML=S.tasks.map((t,i)=>`<div class="task ${t.done?'done':''}"><input type="checkbox" data-k="${i}" ${t.done?'checked':''}><span>${esc(t.text)}</span><button class="x" data-dk="${i}" style="padding:0">×</button></div>`).join('')||'<p class="lbl">No tasks.</p>'}
function all(){$('dateLine').textContent=dk();catOptions();renderHub();renderMoney();renderGoals();renderLog();$('tDate').value=dk()}

function addTx(type,amt,cat,note,date){if(!(+amt>0))return false;S.tx.push({type,amt:+(+amt).toFixed(2),cat,note,date:date||dk()});save();return true}
$('qAdd').onclick=()=>{if(addTx('spend',$('qAmt').value,$('qCat').value,$('qNote').value.trim())){$('qAmt').value=$('qNote').value='';all()}};
$('tAdd').onclick=()=>{if(addTx(ty,$('tAmt').value,$('tCat').value,$('tNote').value.trim(),$('tDate').value)){$('tAmt').value=$('tNote').value='';all()}};
$('tChips').onclick=e=>{if(!e.target.dataset.ty)return;ty=e.target.dataset.ty;document.querySelectorAll('#tChips .chip').forEach(c=>c.classList.toggle('on',c.dataset.ty===ty));catOptions()};
$('gAdd').onclick=()=>{const n=$('gName').value.trim(),t=+$('gTarget').value;if(!n||!(t>0))return;S.goals.push({id:Date.now(),name:n,target:t});$('gName').value=$('gTarget').value='';save();all()};
$('lSave').onclick=()=>{S.logs[dk()]={sleep:$('lSleep').value,energy:en,wins:$('lWins').value.trim(),less:$('lLess').value.trim(),top:$('lTop').value.trim()};save();all()};
$('kAdd').onclick=()=>{const t=$('kText').value.trim();if(!t)return;S.tasks.push({text:t,done:false});$('kText').value='';save();renderTasks();renderHub()};
$('kClear').onclick=()=>{S.tasks=S.tasks.filter(t=>!t.done);save();renderTasks();renderHub()};
$('lnAdd').onclick=()=>{const n=$('lnName').value.trim(),u=$('lnUrl').value.trim();if(!n||!/^(https?:\/\/|[\w\-\/.]+\.html)/i.test(u)){alert('Enter a name and a full link starting with https:// or a page like prep.html');return}S.links.push({n,u});$('lnName').value=$('lnUrl').value='';save();renderHub()};
document.body.addEventListener('click',e=>{const d=e.target.dataset;
  if(d.en){en=+d.en;chipsE()}
  else if(d.dt!==undefined){S.tx.splice(+d.dt,1);save();all()}
  else if(d.dg!==undefined){S.goals.splice(+d.dg,1);save();all()}
  else if(d.dl!==undefined){S.links.splice(+d.dl,1);save();renderHub()}
  else if(d.dk!==undefined){S.tasks.splice(+d.dk,1);save();renderTasks();renderHub()}
  else if(d.dlg){delete S.logs[d.dlg];save();all()}});
document.body.addEventListener('change',e=>{const d=e.target.dataset;
  if(d.k!==undefined){S.tasks[+d.k].done=e.target.checked;save();renderTasks();renderHub()}
  else if(d.b){const v=+e.target.value;if(v>0)S.budgets[d.b]=v;else delete S.budgets[d.b];save();renderMoney()}});
$('exp').onclick=()=>{try{const b=new Blob([JSON.stringify(S,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='command-hub-backup-'+dk()+'.json';document.body.appendChild(a);a.click();a.remove()}catch(e){alert('Export failed in this browser.')}};
$('imp').onclick=()=>{const f=$('impF').files[0];if(!f){$('impN').textContent='Choose a file first.';return}const r=new FileReader();r.onload=e=>{try{S=Object.assign(fresh(),JSON.parse(e.target.result));save();all();$('impN').textContent='Restored.'}catch(x){$('impN').textContent='Not a valid backup file.'}};r.readAsText(f)};
$('wipe').onclick=()=>{if(!confirm('Delete everything on this device?')||!confirm('Really sure? No undo.'))return;S=fresh();save();all()};
load();all();
