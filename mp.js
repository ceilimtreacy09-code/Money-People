const GHOST=new Proxy(function(){},{get:(t,p)=>p==='value'?'':p==='style'?GHOST:p==='dataset'?{}:p==='classList'?{add(){},remove(){},toggle(){},contains(){return false}}:p===Symbol.toPrimitive?()=>'':()=>GHOST,set:()=>true,apply:()=>GHOST});
const byId=id=>document.getElementById(id)||GHOST;
// ---------- storage helpers (localStorage, per-browser) ----------
const STORAGE_KEY = 'moneyPeopleOS_v2';

let state = {
  xp: 0,
  categoryXp: { MONEY:0, PEOPLE:0, BUSINESS:0, DISCIPLINE:0, REVIEW:0 },
  doneDrills: {},
  lastDrillDate: null,
  customDrills: [],
  entries: [],
  weeklyReviews: [],
  streakCurrent: 0,
  streakBest: 0,
  lastStreakDate: null,
  firstUseDate: null
};

function safeLoad(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      state = Object.assign({}, state, parsed);
      state.categoryXp = Object.assign({ MONEY:0, PEOPLE:0, BUSINESS:0, DISCIPLINE:0, REVIEW:0 }, parsed.categoryXp || {});
    }
  }catch(e){ /* no saved state yet, or storage unavailable */ }
}

function safePersist(){
  const footer = byId('footerStatus');
  if(footer) footer.textContent = 'SAVING…';
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if(footer) footer.textContent = 'SYNCED';
  }catch(e){
    if(footer) footer.textContent = 'SAVE FAILED';
  }
}

function allDrills(){
  return drills.concat(state.customDrills);
}

function todayStr(){ return new Date().toDateString(); }

function checkDailyReset(){
  const today = todayStr();
  if(state.lastDrillDate !== today){
    state.doneDrills = {};
    state.lastDrillDate = today;
  }
  if(!state.firstUseDate){
    state.firstUseDate = today;
  }
}

function daysActiveCount(){
  if(!state.firstUseDate) return 1;
  const first = new Date(state.firstUseDate);
  const today = new Date(todayStr());
  const diff = Math.round((today - first) / 86400000);
  return Math.max(1, diff + 1);
}

function loadState(){
  safeLoad();
  checkDailyReset();
  safePersist();
  render();
  renderDrills();
  renderEntries();
  renderWeeklyEntries();
}

// ---------- levels ----------
function levelFor(x){ return Math.floor(x/100)+1; }
function render(){
  byId('xpTotal').textContent = state.xp;
  byId('xpMeter').style.width = (state.xp % 100) + '%';
  byId('moneyLvl').textContent = levelFor(state.categoryXp.MONEY);
  byId('peopleLvl').textContent = levelFor(state.categoryXp.PEOPLE);
  byId('bizLvl').textContent = levelFor(state.categoryXp.BUSINESS);
  byId('discLvl').textContent = levelFor(state.categoryXp.DISCIPLINE + state.categoryXp.REVIEW);

  byId('moneyMeter').style.width = (state.categoryXp.MONEY % 100) + '%';
  byId('peopleMeter').style.width = (state.categoryXp.PEOPLE % 100) + '%';
  byId('bizMeter').style.width = (state.categoryXp.BUSINESS % 100) + '%';
  byId('discMeter').style.width = ((state.categoryXp.DISCIPLINE + state.categoryXp.REVIEW) % 100) + '%';

  byId('daysActive').textContent = daysActiveCount();
  byId('streakCurrent').textContent = state.streakCurrent;
  byId('streakBest').textContent = state.streakBest;
  const doneCount = Object.keys(state.doneDrills).length;
  byId('drillsDoneToday').textContent = doneCount;
  byId('entryCount').textContent = state.entries.length;
  byId('weeklyCount').textContent = state.weeklyReviews.length;
  byId('customDrillCount').textContent = state.customDrills.length;
}

function bumpStreakIfNeeded(){
  const today = todayStr();
  if(state.lastStreakDate === today) return; // already counted today
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if(state.lastStreakDate === yesterday){
    state.streakCurrent += 1;
  } else {
    state.streakCurrent = 1;
  }
  state.lastStreakDate = today;
  if(state.streakCurrent > state.streakBest) state.streakBest = state.streakCurrent;
}

// ---------- drills ----------
const drills = [
  ["MONEY","Build or update a 30-day zero-based budget.",20],
  ["MONEY","List every recurring expense and mark it essential / useful / optional.",15],
  ["MONEY","Explain compounding out loud in 3 plain sentences, no jargon.",15],
  ["PEOPLE","Ask 3 genuine questions before giving advice in a real conversation today.",20],
  ["PEOPLE","In a disagreement, restate the other side's position until they say you got it right.",25],
  ["PEOPLE","Practise a 60-second intro: who you are, what you do, who you help.",20],
  ["BUSINESS","Write one client offer: problem → outcome → proof → price.",25],
  ["BUSINESS","Find one bottleneck in current work and turn it into a checklist.",25],
  ["DISCIPLINE","Do one task you've been avoiding for 20 minutes, phone out of reach.",15],
  ["REVIEW","Write one mistake from this week and the system that prevents it next time.",20]
];

function renderDrills(){
  const el = byId('drillList');
  el.innerHTML = '';
  const list = allDrills();
  list.forEach((d,i)=>{
    const isDone = !!state.doneDrills[i];
    const isCustom = i >= drills.length;
    const row = document.createElement('div');
    row.className = 'drill' + (isDone ? ' done' : '');
    row.innerHTML = `
      <input type="checkbox" ${isDone?'checked':''} data-idx="${i}">
      <div class="body">
        <span class="cat">${d[0]}</span><span class="xp">+${d[2]} XP</span>
        <p>${escapeHtml(d[1])}</p>
      </div>
      ${isCustom ? `<button class="del" data-custom-idx="${i - drills.length}" title="Delete custom drill">×</button>` : ''}`;
    el.appendChild(row);
  });
  el.querySelectorAll('input[type=checkbox]').forEach(cb=>{
    cb.addEventListener('change', (e)=>{
      const idx = Number(e.target.dataset.idx);
      const d = allDrills()[idx];
      const cat = d[0];
      if(e.target.checked && !state.doneDrills[idx]){
        state.doneDrills[idx] = 1;
        state.xp += d[2];
        state.categoryXp[cat] = (state.categoryXp[cat] || 0) + d[2];
        bumpStreakIfNeeded();
      } else if(!e.target.checked && state.doneDrills[idx]){
        delete state.doneDrills[idx];
        state.xp -= d[2];
        state.categoryXp[cat] = (state.categoryXp[cat] || 0) - d[2];
      }
      render(); renderDrills(); safePersist();
    });
  });
  el.querySelectorAll('[data-custom-idx]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const cIdx = Number(btn.dataset.customIdx);
      const globalIdx = drills.length + cIdx;
      // If it was checked, refund the XP before removing
      if(state.doneDrills[globalIdx]){
        const d = state.customDrills[cIdx];
        state.xp -= d[2];
        state.categoryXp[d[0]] = (state.categoryXp[d[0]] || 0) - d[2];
        delete state.doneDrills[globalIdx];
      }
      state.customDrills.splice(cIdx,1);
      // Reindex doneDrills for custom drills after the removed one
      const newDone = {};
      Object.keys(state.doneDrills).forEach(k=>{
        const n = Number(k);
        if(n < drills.length) newDone[n] = state.doneDrills[k];
        else if(n < globalIdx) newDone[n] = state.doneDrills[k];
        else if(n > globalIdx) newDone[n-1] = state.doneDrills[k];
      });
      state.doneDrills = newDone;
      render(); renderDrills(); safePersist();
    });
  });
}

byId('resetDrills').addEventListener('click', ()=>{
  if(!confirm("Reset today's checkmarks? This won't remove earned XP, just un-checks today's boxes.")) return;
  state.doneDrills = {};
  render(); renderDrills(); safePersist();
});

byId('addDrill').addEventListener('click', ()=>{
  const cat = byId('newDrillCat').value;
  const text = byId('newDrillText').value.trim();
  const xp = Math.max(1, Math.min(100, Number(byId('newDrillXp').value) || 15));
  if(!text) return;
  state.customDrills.push([cat, text, xp]);
  byId('newDrillText').value = '';
  renderDrills(); safePersist();
});

// ---------- journal ----------
let logFilter = 'all';

function renderEntries(){
  const el = byId('logEntries');
  const filtered = state.entries.filter(e => logFilter === 'all' || e.type === logFilter);
  if(!filtered.length){ el.innerHTML = '<p class="muted">No entries yet.</p>'; return; }
  el.innerHTML = '';
  [...filtered].reverse().forEach(entry=>{
    const realIdx = state.entries.indexOf(entry);
    const div = document.createElement('div');
    div.className = 'log-entry';
    div.innerHTML = `<div>
        <span class="ts">${entry.type.toUpperCase()} — ${entry.date}</span>
        <p><b>${escapeHtml(entry.what)}</b></p>
        <p>${escapeHtml(entry.why)}</p>
      </div>
      <button class="del" data-entry-idx="${realIdx}" title="Delete entry">×</button>`;
    el.appendChild(div);
  });
  el.querySelectorAll('[data-entry-idx]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const idx = Number(btn.dataset.entryIdx);
      state.entries.splice(idx,1);
      renderEntries(); safePersist();
    });
  });
}

document.querySelectorAll('[data-filter]').forEach(chip=>{
  chip.addEventListener('click', ()=>{
    document.querySelectorAll('[data-filter]').forEach(c=>c.classList.remove('active'));
    chip.classList.add('active');
    logFilter = chip.dataset.filter;
    renderEntries();
  });
});

function escapeHtml(s){
  const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML;
}

document.querySelectorAll('[data-log]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const type = btn.dataset.log;
    const whatEl = byId(type+'Decision');
    const whyEl = byId(type+'Reason');
    if(!whatEl.value.trim()) return;
    state.entries.push({
      type, what: whatEl.value.trim(), why: whyEl.value.trim(),
      date: new Date().toLocaleDateString()
    });
    whatEl.value=''; whyEl.value='';
    renderEntries(); safePersist();
    const note = byId(type+'Note');
    note.classList.add('show');
    setTimeout(()=>note.classList.remove('show'), 1800);
  });
});

// ---------- weekly review history ----------
function renderWeeklyEntries(){
  const el = byId('weeklyEntries');
  if(!state.weeklyReviews.length){ el.innerHTML = ''; return; }
  el.innerHTML = '<h4 style="font-family:var(--mono); font-size:11px; color:var(--paper-dim); letter-spacing:.04em; margin-bottom:10px">PAST REVIEWS</h4>';
  [...state.weeklyReviews].reverse().forEach(r=>{
    const div = document.createElement('div');
    div.className = 'review-entry';
    div.innerHTML = `<span class="ts">${r.date}</span><p>${escapeHtml(r.text)}</p>`;
    el.appendChild(div);
  });
}

byId('saveWeekly').addEventListener('click', ()=>{
  const text = byId('weeklyReview').value.trim();
  if(!text) return;
  state.weeklyReviews.push({ date: new Date().toLocaleDateString(), text });
  byId('weeklyReview').value = '';
  renderWeeklyEntries(); safePersist();
  const note = byId('weeklyNote');
  note.classList.add('show');
  setTimeout(()=>note.classList.remove('show'), 1800);
});

// ---------- money quick calculator (not persisted, scratch only) ----------
byId('calcRun').addEventListener('click', ()=>{
  const income = Number(byId('calcIncome').value) || 0;
  const fixed = Number(byId('calcFixed').value) || 0;
  const savePct = Number(byId('calcSavePct').value) || 0;
  const remaining = income - fixed;
  const save = remaining * (savePct/100);
  const discretionary = remaining - save;
  const out = byId('calcResult');
  if(income <= 0){ out.textContent = 'Enter an income to calculate.'; return; }
  out.textContent =
`Income:           €${income.toFixed(2)}
Fixed costs:      €${fixed.toFixed(2)}
Left after fixed: €${remaining.toFixed(2)}
Save/invest (${savePct}%): €${save.toFixed(2)}
Discretionary:    €${discretionary.toFixed(2)}`;
});

// ---------- offer builder (not persisted, scratch only) ----------
byId('offerBuild').addEventListener('click', ()=>{
  const who = byId('offerWho').value.trim();
  const problem = byId('offerProblem').value.trim();
  const outcome = byId('offerOutcome').value.trim();
  const proof = byId('offerProof').value.trim();
  const out = byId('offerResult');
  if(!who || !problem || !outcome){
    out.textContent = 'Fill in at least Who, Problem, and Outcome.';
    return;
  }
  out.textContent = `"I help ${who} who are dealing with ${problem} get ${outcome}` + (proof ? ` — ${proof}.` : '.') + '"';
});

// ---------- data: export / import / wipe ----------
byId('exportBtn').addEventListener('click', ()=>{
  try{
    const blob = new Blob([JSON.stringify(state, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `money-people-backup-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(url), 2000);
  }catch(e){
    alert('Export failed in this browser.');
  }
});

byId('importBtn').addEventListener('click', ()=>{
  const fileInput = byId('importFile');
  const note = byId('importNote');
  const file = fileInput.files[0];
  if(!file){ note.textContent = 'Choose a file first.'; return; }
  const reader = new FileReader();
  reader.onload = (e)=>{
    try{
      const parsed = JSON.parse(e.target.result);
      if(typeof parsed !== 'object' || parsed === null){ throw new Error('bad format'); }
      state = Object.assign({
        xp:0, categoryXp:{MONEY:0,PEOPLE:0,BUSINESS:0,DISCIPLINE:0,REVIEW:0},
        doneDrills:{}, lastDrillDate:null, customDrills:[], entries:[], weeklyReviews:[],
        streakCurrent:0, streakBest:0, lastStreakDate:null, firstUseDate:null
      }, parsed);
      checkDailyReset();
      safePersist();
      render(); renderDrills(); renderEntries(); renderWeeklyEntries();
      note.textContent = 'Restored successfully.';
    }catch(err){
      note.textContent = 'Could not read that file — is it a valid backup?';
    }
  };
  reader.readAsText(file);
});

byId('wipeBtn').addEventListener('click', ()=>{
  if(!confirm('This deletes everything on this device permanently. Are you sure?')) return;
  if(!confirm('Really sure? There is no undo.')) return;
  try{ localStorage.removeItem(STORAGE_KEY); }catch(e){}
  state = {
    xp:0, categoryXp:{MONEY:0,PEOPLE:0,BUSINESS:0,DISCIPLINE:0,REVIEW:0},
    doneDrills:{}, lastDrillDate:null, customDrills:[], entries:[], weeklyReviews:[],
    streakCurrent:0, streakBest:0, lastStreakDate:null, firstUseDate:null
  };
  checkDailyReset();
  safePersist();
  render(); renderDrills(); renderEntries(); renderWeeklyEntries();
});

loadState();
