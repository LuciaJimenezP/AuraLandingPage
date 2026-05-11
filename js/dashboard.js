/* ==========================================
   AURAHEALTH – dashboard.js
   ========================================== */

/* ── Donut Chart ─────────────────────────── */
function buildDonut(svgId, pct, color1 = '#4db8c8', color2 = '#1a3a6e') {
  const svg = document.getElementById(svgId);
  if (!svg) return;
  const r = 62, circ = 2 * Math.PI * r, fill = circ * (pct / 100);
  svg.setAttribute('viewBox', '0 0 160 160');
  svg.innerHTML = `
    <circle cx="80" cy="80" r="${r}" fill="none" stroke="var(--turquoise-light)" stroke-width="14"/>
    <circle cx="80" cy="80" r="${r}" fill="none"
      stroke="url(#grad_${svgId})" stroke-width="14"
      stroke-dasharray="${fill} ${circ}" stroke-linecap="round"
      style="transition:stroke-dasharray 1.2s ease"/>
    <defs>
      <linearGradient id="grad_${svgId}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${color1}"/>
        <stop offset="100%" stop-color="${color2}"/>
      </linearGradient>
    </defs>`;
}

/* ── Medications ─────────────────────────── */
const MED_COLORS = ['#4db8c8','#1a3a6e','#22b573','#f07030','#9b59b6','#e74c3c'];

let medications = [
  { id:1, name:'Metformina', dose:'500mg', freq:'2 veces al día',  done:false },
  { id:2, name:'Losartán',   dose:'50mg',  freq:'1 vez al día',    done:false },
  { id:3, name:'Omeprazol',  dose:'20mg',  freq:'Antes de comer',  done:true  },
];
let nextMedId = 4;

function renderMedList() {
  const el = document.getElementById('medList');
  if (!el) return;

  if (!medications.length) {
    el.innerHTML = `<p style="font-size:.85rem;color:var(--text-muted);text-align:center;padding:16px 0;">
      Sin medicamentos. Pulsa + para agregar uno.</p>`;
  } else {
    el.innerHTML = medications.map((m, i) => `
      <div class="med-row">
        <div class="med-dot" style="background:${MED_COLORS[i % MED_COLORS.length]}"></div>
        <div class="med-info">
          <div class="med-name">${m.name}${m.dose ? ' ' + m.dose : ''}</div>
          <div class="med-desc">${m.freq}</div>
        </div>
        <button class="med-done-btn${m.done ? ' done' : ''}" onclick="toggleMed(${m.id})" title="Marcar tomado">
          <svg width="12" height="10" viewBox="0 0 13 10" fill="none">
            <polyline points="1.5,5 5,8.5 11.5,1.5" stroke="#fff" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="med-del-btn" onclick="deleteMed(${m.id})" title="Eliminar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/>
            <path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>`).join('');
  }

  updateMedDonut();
  updateStatMed();
}

function updateMedDonut() {
  const total = medications.length;
  const done  = medications.filter(m => m.done).length;
  const pct   = total === 0 ? 0 : Math.round((done / total) * 100);
  buildDonut('donutMeds', pct);

  const el = document.getElementById('donutPct');
  if (!el) return;
  let v = 0;
  const step = Math.max(1, Math.ceil(pct / 40));
  const t = setInterval(() => {
    v = Math.min(v + step, pct);
    el.textContent = v + '%';
    if (v >= pct) clearInterval(t);
  }, 30);
}

function updateStatMed() {
  const total = medications.length;
  const done  = medications.filter(m => m.done).length;
  const pct   = total === 0 ? 0 : Math.round((done / total) * 100);
  const vEl = document.getElementById('statMedValue');
  const sEl = document.getElementById('statMedSub');
  if (vEl) vEl.textContent = `${done}/${total}`;
  if (sEl) sEl.textContent = `${pct}% completado`;
}

function toggleMed(id) {
  const m = medications.find(x => x.id === id);
  if (m) { m.done = !m.done; renderMedList(); }
}

function deleteMed(id) {
  medications = medications.filter(x => x.id !== id);
  renderMedList();
}

function openMedModal() {
  document.getElementById('medModal').classList.add('show');
  setTimeout(() => document.getElementById('mName').focus(), 100);
}
function closeMedModal() {
  document.getElementById('medModal').classList.remove('show');
  document.getElementById('medForm').reset();
}

/* ── Activity ────────────────────────────── */
let activity = {
  pasos:    { curr:6240,  goal:10000, unit:'pasos', label:'Pasos'    },
  agua:     { curr:1.4,   goal:2.5,   unit:'L',     label:'Agua'     },
  sueño:    { curr:6.5,   goal:8,     unit:'h',     label:'Sueño'    },
  calorias: { curr:1820,  goal:2200,  unit:'kcal',  label:'Calorías' },
};

const WEEK_STEPS = [5200, 8100, 6700, 9300, 7800, 6240, 0]; // Lu→Do

function renderActivityList() {
  const el = document.getElementById('activityList');
  if (!el) return;

  el.innerHTML = Object.entries(activity).map(([key, a]) => {
    const pct = Math.min(100, Math.round((a.curr / a.goal) * 100));
    return `
      <div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-size:.88rem;font-weight:600;color:var(--text);">${a.label}</span>
            <span class="act-label-unit">${a.curr} / ${a.goal} ${a.unit}</span>
          </div>
          <div style="display:flex;align-items:center;gap:4px;">
            <span style="font-size:.8rem;color:var(--text-muted);">${pct}%</span>
            <button class="act-edit-btn" onclick="openActModal('${key}')" title="Editar ${a.label}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          </div>
        </div>
        <div style="height:8px;background:var(--bg);border-radius:99px;overflow:hidden;border:1px solid var(--border);">
          <div class="progress-fill" data-pct="${pct}"
            style="height:100%;border-radius:99px;background:linear-gradient(90deg,var(--turquoise),var(--blue-dark));
                   width:0;transition:width 1.2s ease;">
          </div>
        </div>
      </div>`;
  }).join('');

  // Animate bars
  setTimeout(() => {
    el.querySelectorAll('.progress-fill').forEach(b => { b.style.width = b.dataset.pct + '%'; });
  }, 100);

  renderWeekBars();
  updateStatSteps();
}

function renderWeekBars() {
  const el = document.getElementById('weekBars');
  if (!el) return;
  const days = ['L','M','X','J','V','S','D'];
  const maxVal = Math.max(...WEEK_STEPS, 1);
  el.innerHTML = days.map((d, i) => {
    const hPct = Math.max(Math.round((WEEK_STEPS[i] / maxVal) * 100), 3);
    const isToday = (i === 4); // Viernes = hoy (demo)
    return `
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;">
        <div style="width:100%;border-radius:4px 4px 0 0;
          background:${isToday ? 'var(--blue-dark)' : 'var(--turquoise)'};
          opacity:${WEEK_STEPS[i] === 0 ? '.25' : '1'};
          height:${hPct}%;transition:height 1s ease;">
        </div>
        <span style="font-size:.7rem;color:var(--text-muted);">${d}</span>
      </div>`;
  }).join('');
}

function updateStatSteps() {
  const vEl = document.getElementById('statSteps');
  const sEl = document.getElementById('statStepsSub');
  if (vEl) vEl.textContent = activity.pasos.curr.toLocaleString('es-PE');
  if (sEl) sEl.textContent = `Meta: ${activity.pasos.goal.toLocaleString('es-PE')}`;
}

function openActModal(key) {
  const a = activity[key];
  if (!a) return;
  document.getElementById('actModalTitle').textContent = `Editar: ${a.label}`;
  document.getElementById('actKey').value            = key;
  document.getElementById('actCurrLabel').textContent = `Valor actual (${a.unit})`;
  document.getElementById('actGoalLabel').textContent = `Meta (${a.unit})`;
  document.getElementById('actCurr').value           = a.curr;
  document.getElementById('actGoal').value           = a.goal;
  document.getElementById('actModal').classList.add('show');
  setTimeout(() => document.getElementById('actCurr').focus(), 100);
}
function closeActModal() {
  document.getElementById('actModal').classList.remove('show');
  document.getElementById('actForm').reset();
}

/* ── Init ────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  renderMedList();
  renderActivityList();

  /* Med form */
  document.getElementById('medForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('mName').value.trim();
    const dose = document.getElementById('mDose').value.trim();
    const freq = document.getElementById('mFreq').value.trim();
    if (!name) return;
    medications.push({ id: nextMedId++, name, dose, freq, done: false });
    renderMedList();
    closeMedModal();
  });

  /* Activity form */
  document.getElementById('actForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const key  = document.getElementById('actKey').value;
    const curr = parseFloat(document.getElementById('actCurr').value);
    const goal = parseFloat(document.getElementById('actGoal').value);
    if (!key || isNaN(curr) || isNaN(goal) || goal <= 0) return;
    activity[key].curr = curr;
    activity[key].goal = goal;
    if (key === 'pasos') WEEK_STEPS[4] = curr; // update today's bar
    renderActivityList();
    closeActModal();
  });

  /* Close modals by clicking backdrop */
  document.getElementById('medModal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeMedModal();
  });
  document.getElementById('actModal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeActModal();
  });
});
