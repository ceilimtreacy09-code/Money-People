const GHOST=new Proxy(function(){},{get:(t,p)=>p==='value'?'':p==='style'?GHOST:p==='dataset'?{}:p==='classList'?{add(){},remove(){},toggle(){},contains(){return false}}:p===Symbol.toPrimitive?()=>'':()=>GHOST,set:()=>true,apply:()=>GHOST});
const byId=id=>document.getElementById(id)||GHOST;
const $=id=>byId(id), KEY='ironPrepArmy_v1', T={water:3000,protein:199,steps:15000};
let S={days:{},sessions:[],runs:[],tests:[]}, sel=new Date().getDay();
function load(){try{const r=localStorage.getItem(KEY);if(r)S=Object.assign(S,JSON.parse(r))}catch(e){}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
const pad=n=>String(n).padStart(2,'0');
const dk=(d=new Date())=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const esc=s=>{const d=document.createElement('div');d.textContent=s||'';return d.innerHTML};
function D(k=dk()){return S.days[k]||(S.days[k]={water:0,protein:0,steps:0,prot:[],checks:{}})}
const CK=[['wake','Up at 5:45'],['mob','10 min mobility'],['train','Session or run done'],['supps','Creatine, collagen, multi, vitamin D'],['bed','In bed by 22:45']];
function score(d){let n=CK.filter(c=>d.checks[c[0]]).length;n+=(d.water>=T.water)+(d.protein>=T.protein)+(d.steps>=T.steps);return n/(CK.length+3)}
function streaks(){let cur=0,best=0,run=0;const keys=Object.keys(S.days).sort();
  if(keys.length){const a=new Date(keys[0]+'T00:00:00'),e=new Date();for(let d=new Date(a);d<=e;d.setDate(d.getDate()+1)){const x=S.days[dk(d)];if(x&&score(x)>=.75){run++;best=Math.max(best,run)}else run=0}}
  let d=new Date();const t=S.days[dk(d)];if(!(t&&score(t)>=.75))d.setDate(d.getDate()-1);
  while(true){const x=S.days[dk(d)];if(x&&score(x)>=.75){cur++;d.setDate(d.getDate()-1)}else break}
  return [cur,best]}
const sec=s=>{const m=/^(\d+):(\d{2})$/.exec((s||'').trim());return m?+m[1]*60+ +m[2]:null};
const fmt=s=>pad(Math.floor(s/60))+':'+pad(Math.round(s%60));
const wkStart=()=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return d};
const inWeek=k=>new Date(k+'T00:00:00')>=wkStart();

/* ---------- plan ---------- */
const PLAN={
1:{n:'Upper A',f:'Strength — pull and press',ex:[['Pull-ups','5 × near max'],['Bench press','4 × 6–8'],['Barbell / DB row','4 × 8'],['Overhead press','3 × 8'],['Push-ups','3 × max, stop 2 shy'],['Face pulls','3 × 15'],['Hanging leg raises','3 × 10'],['Side plank (s each)','3 × 40']]},
2:{n:'Lower A',f:'Strength — legs and trunk',ex:[['Back squat','4 × 6'],['Romanian deadlift','3 × 8'],['Walking lunges (per leg)','3 × 10'],['Calf raises','4 × 12'],['Farmer carry (m)','3 × 40'],['Sit-ups','3 × max'],['Plank (s)','3 × 60']]},
3:{n:'Intervals',f:'Run — speed (the one that cuts your 3.2km time)',run:'10 min easy warm-up. 6 × 400m at 1:49–1:52, 90s walk/jog rest. 10 min cool-down. Then 3 × max sit-ups. Log it in the RUN tab.'},
4:{n:'Upper B',f:'Strength — volume and shape',ex:[['Pull-up ladder (total reps)','5 rounds'],['Incline DB press','4 × 8'],['Lat pulldown / chin-ups','4 × 10'],['Dips','3 × 8–10'],['Lateral raises','3 × 15'],['Curls','3 × 12'],['Ab wheel','3 × 10'],['Russian twists','3 × 20']]},
5:{n:'Lower B',f:'Strength — posterior chain',ex:[['Deadlift','3 × 5'],['Bulgarian split squat (per leg)','3 × 8'],['Hip thrust','3 × 10'],['Step-ups (per leg)','3 × 10'],['Calf raises','3 × 15'],['Hanging knee raises','3 × 12']]},
6:{n:'Long run / ruck',f:'Aerobic base — build the engine',run:'6–8 km at conversational pace, or a loaded ruck at a steady march. Add 0.5–1 km a week. 20 min mobility after. Log it in the RUN tab.'},
0:{n:'Rest',f:'Recover. Walk, stretch, eat, sleep.',run:'No training. Do the daily checklist, hit protein and water, and get to bed on time.'}};
const DN=['SUN','MON','TUE','WED','THU','FRI','SAT'];

function lastFor(name){for(let i=S.sessions.length-1;i>=0;i--){const e=S.sessions[i].ex.find(x=>x.n===name);if(e)return e.kg+' kg × '+e.reps}return null}

/* ---------- render ---------- */
function bar(id,v,t){$(id).style.width=Math.min(100,v/t*100)+'%'}
function renderToday(){
  const d=D(),sc=score(d),[c,b]=streaks();
  $('score').textContent=Math.round(sc*100)+'%';bar('scoreM',sc,1);
  $('streak').textContent=c;$('best').textContent=b;
  $('wk').textContent=S.sessions.filter(s=>inWeek(s.date)).length;
  $('wTxt').textContent=d.water+' / '+T.water+' ml';bar('wM',d.water,T.water);
  $('pTxt').textContent=d.protein+' / '+T.protein+' g';bar('pM',d.protein,T.protein);
  $('sTxt').textContent=d.steps+' / '+T.steps;bar('sM',d.steps,T.steps);
  const auto=[['Water target hit',d.water>=T.water],['Protein target hit',d.protein>=T.protein],['Steps target hit',d.steps>=T.steps]];
  $('checks').innerHTML=CK.map(c=>`<label class="chk ${d.checks[c[0]]?'done':''}"><input type="checkbox" data-c="${c[0]}" ${d.checks[c[0]]?'checked':''}><span>${c[1]}</span></label>`).join('')+
    auto.map(a=>`<div class="chk auto ${a[1]?'done':''}"><input type="checkbox" disabled ${a[1]?'checked':''}><span>${a[0]} (auto)</span></div>`).join('');
  $('dateLine').textContent=DN[new Date().getDay()]+' '+dk();
}
function renderChips(){
  $('dayChips').innerHTML=[1,2,3,4,5,6,0].map(i=>`<button class="chip ${i===sel?'on':''} ${i===new Date().getDay()?'today':''}" data-d="${i}">${DN[i]}</button>`).join('')}
function renderDay(){
  const p=PLAN[sel];let h=`<h3>${p.n}</h3><p class="lede" style="margin-bottom:12px">${p.f}</p>`;
  if(p.run){h+=`<div class="card" style="margin-bottom:10px"><p style="margin:0">${p.run}</p></div>`;if(sel!==0)h+=`<button class="a" id="goRun">OPEN RUN LOG</button>`}
  else{h+=p.ex.map((e,i)=>{const l=lastFor(e[0]);return `<div class="ex"><div>${e[0]}<small>${e[1]}</small>${l?`<small class="last">last: ${l}</small>`:''}</div><input type="number" step="0.5" placeholder="kg" id="kg${i}"><input type="number" placeholder="reps" id="rp${i}"></div>`}).join('')+
    `<div class="row"><button class="a" id="doneSess">COMPLETE SESSION</button><span class="lbl">Enter top-set kg and reps. Bodyweight lifts: kg 0.</span></div>`}
  $('dayView').innerHTML=h;
  const g=$('goRun');if(g)g.onclick=()=>location.href='prep-run.html';
  const ds=$('doneSess');if(ds)ds.onclick=()=>{
    const ex=p.ex.map((e,i)=>({n:e[0],kg:$('kg'+i).value,reps:$('rp'+i).value})).filter(e=>e.reps!==''||e.kg!=='');
    if(!ex.length){alert('Log at least one exercise first.');return}
    S.sessions.push({date:dk(),name:p.n,ex});D().checks.train=true;save();renderAll()}
}
function renderHist(){
  const l=[...S.sessions].reverse().slice(0,10);
  $('hist').innerHTML=l.length?l.map(s=>{const i=S.sessions.indexOf(s);return `<div class="hist"><div><div class="t">${s.date} — ${esc(s.name).toUpperCase()}</div>${s.ex.map(e=>esc(e.n)+' '+(e.kg||0)+'×'+(e.reps||0)).join(' · ')}</div><button class="x" data-ds="${i}">×</button></div>`}).join(''):'<p class="lbl">No sessions logged yet.</p>'}
function renderRuns(){
  const wk=S.runs.filter(r=>inWeek(r.date)).reduce((a,r)=>a+(+r.km||0),0);$('kmWk').textContent=wk.toFixed(1);
  const t=S.tests.map(x=>sec(x.run)).concat(S.runs.filter(r=>r.type==='3.2km test'||(+r.km===3.2)).map(r=>sec(r.time))).filter(Boolean);
  $('bestRun').textContent=t.length?fmt(Math.min(...t)):'—';
  const l=[...S.runs].reverse().slice(0,15);
  $('runs').innerHTML=l.length?l.map(r=>{const i=S.runs.indexOf(r),s=sec(r.time),pace=s&&+r.km?fmt(s/ +r.km)+'/km':'';return `<div class="hist"><div><div class="t">${r.date} — ${esc(r.type).toUpperCase()}</div>${r.km} km${r.time?' in '+esc(r.time):''}${pace?' ('+pace+')':''}${r.load?' with '+r.load+' kg':''}${r.note?' — '+esc(r.note):''}</div><button class="x" data-dr="${i}">×</button></div>`}).join(''):'<p class="lbl">No runs logged yet.</p>'}
function renderBench(){
  const L=S.tests[S.tests.length-1]||{};
  const cards=[['PULL-UPS',L.pull,'> 6',L.pull/6],['PUSH-UPS',L.push,'> 36',L.push/36],['SIT-UPS',L.sit,'> 30',L.sit/30],['3.2KM',L.run,'< 14:36',sec(L.run)?876/sec(L.run):0]];
  $('benchCards').innerHTML=cards.map(c=>`<div class="card"><div class="num">${c[1]||'—'}</div><div class="lbl">${c[0]} — standard ${c[2]}</div><div class="meter"><div class="fill" style="width:${Math.min(100,(c[3]||0)*100)}%"></div></div>${(c[3]||0)>=1?'<span class="ok mono" style="font-size:11px">STANDARD MET</span>':''}</div>`).join('');
  const l=[...S.tests].reverse().slice(0,10);
  $('tests').innerHTML=l.length?l.map(x=>{const i=S.tests.indexOf(x);return `<div class="hist"><div><div class="t">${x.date}</div>Pull ${x.pull||'—'} · Push ${x.push||'—'} · Sit ${x.sit||'—'} · 3.2km ${esc(x.run)||'—'}${x.bw?' · '+x.bw+' kg':''}</div><button class="x" data-dt="${i}">×</button></div>`}).join(''):'<p class="lbl">No tests logged yet.</p>'}
function renderAll(){renderToday();renderChips();renderDay();renderHist();renderRuns();renderBench()}

/* ---------- events ---------- */
document.body.addEventListener('click',e=>{
  const t=e.target,w=t.dataset.w,d=t.dataset.d;
  if(w){const x=D();x.water=Math.max(0,x.water+ +w);save();renderToday()}
  else if(t.dataset.p){const x=D();const last=x.prot.pop();if(last){x.protein=Math.max(0,x.protein-last)}save();renderToday()}
  else if(d!==undefined&&t.classList.contains('chip')){sel=+d;renderChips();renderDay()}
  else if(t.dataset.ds){S.sessions.splice(+t.dataset.ds,1);save();renderAll()}
  else if(t.dataset.dr){S.runs.splice(+t.dataset.dr,1);save();renderRuns()}
  else if(t.dataset.dt){S.tests.splice(+t.dataset.dt,1);save();renderBench()}
});
$('checks').onchange=e=>{const c=e.target.dataset.c;if(c){D().checks[c]=e.target.checked;save();renderToday()}};
$('pAdd').onclick=()=>{const v=+$('pIn').value;if(!v)return;const x=D();x.protein+=v;x.prot.push(v);$('pIn').value='';save();renderToday()};
$('sSet').onclick=()=>{const v=+$('sIn').value;if(v<0||$('sIn').value==='')return;D().steps=v;$('sIn').value='';save();renderToday()};
$('rAdd').onclick=()=>{const km=$('rKm').value;if(!km)return;
  S.runs.push({date:dk(),type:$('rType').value,km,time:$('rTime').value.trim(),load:$('rLoad').value,note:$('rNote').value.trim()});
  D().checks.train=true;['rKm','rTime','rLoad','rNote'].forEach(i=>$(i).value='');save();renderAll()};
$('bAdd').onclick=()=>{const o={date:dk(),pull:$('bPull').value,push:$('bPush').value,sit:$('bSit').value,run:$('bRun').value.trim(),bw:$('bBw').value};
  if(!(o.pull||o.push||o.sit||o.run||o.bw))return;S.tests.push(o);['bPull','bPush','bSit','bRun','bBw'].forEach(i=>$(i).value='');save();renderBench()};
$('exp').onclick=()=>{try{const b=new Blob([JSON.stringify(S,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='iron-prep-backup-'+dk()+'.json';document.body.appendChild(a);a.click();a.remove()}catch(e){alert('Export failed in this browser.')}};
$('imp').onclick=()=>{const f=$('impF').files[0];if(!f){$('impN').textContent='Choose a file first.';return}
  const r=new FileReader();r.onload=e=>{try{const p=JSON.parse(e.target.result);S=Object.assign({days:{},sessions:[],runs:[],tests:[]},p);save();renderAll();$('impN').textContent='Restored.'}catch(x){$('impN').textContent='Not a valid backup file.'}};r.readAsText(f)};
$('wipe').onclick=()=>{if(!confirm('Delete everything on this device?')||!confirm('Really sure? No undo.'))return;S={days:{},sessions:[],runs:[],tests:[]};save();renderAll()};

load();renderAll();
