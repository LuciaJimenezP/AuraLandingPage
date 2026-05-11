/* ==========================================
   AURAHEALTH – partner.js
   Partner health tracking & reminders
   ========================================== */

/* ── Donut Chart ─────────────────────────── */
function buildDonut(svgId, pct, c1='#4db8c8', c2='#1a3a6e') {
  const svg = document.getElementById(svgId);
  if (!svg) return;
  const r=62, circ=2*Math.PI*r, fill=circ*(pct/100);
  svg.setAttribute('viewBox','0 0 160 160');
  svg.innerHTML = `
    <circle cx="80" cy="80" r="${r}" fill="none" stroke="var(--turquoise-light,#c8eef3)" stroke-width="14"/>
    <circle cx="80" cy="80" r="${r}" fill="none" stroke="url(#pg_${svgId})" stroke-width="14"
      stroke-dasharray="${fill} ${circ}" stroke-linecap="round"
      style="transition:stroke-dasharray 1.2s ease"/>
    <defs>
      <linearGradient id="pg_${svgId}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c2}"/>
      </linearGradient>
    </defs>`;
}

/* ── Partner data store ──────────────────── */
const DEMO_PARTNERS = {
  'ana.garcia@email.com': {
    name:'Ana García', initials:'AG', email:'ana.garcia@email.com',
    lastSeen: 'Hace 2h',
    meds: [
      { id:1, name:'Metformina 500mg',  freq:'2x día',        done:true  },
      { id:2, name:'Vitamina D 1000UI', freq:'1x día',        done:true  },
      { id:3, name:'Omeprazol 20mg',    freq:'Antes de comer',done:false },
    ],
    activity: {
      pasos:    { curr:7200, goal:10000, unit:'pasos', label:'Pasos'    },
      agua:     { curr:1.8,  goal:2.5,   unit:'L',     label:'Agua'     },
      sueño:    { curr:7,    goal:8,     unit:'h',     label:'Sueño'    },
      calorias: { curr:1650, goal:2200,  unit:'kcal',  label:'Calorías' },
    },
    reminders: [
      { name:'Chequeo médico anual',  time:'9:00 AM',  done:true  },
      { name:'Pastillas – Omeprazol', time:'8:00 PM',  done:false },
    ],
  },
  'carlos.lopez@email.com': {
    name:'Carlos López', initials:'CL', email:'carlos.lopez@email.com',
    lastSeen: 'Hace 45 min',
    meds: [
      { id:1, name:'Losartán 50mg',   freq:'1x día',  done:true  },
      { id:2, name:'Aspirina 100mg',  freq:'1x día',  done:false },
    ],
    activity: {
      pasos:    { curr:4500, goal:8000, unit:'pasos', label:'Pasos'    },
      agua:     { curr:1.2,  goal:2.0,  unit:'L',     label:'Agua'     },
      sueño:    { curr:5.5,  goal:8,    unit:'h',     label:'Sueño'    },
      calorias: { curr:2100, goal:2500, unit:'kcal',  label:'Calorías' },
    },
    reminders: [
      { name:'Control de presión', time:'10:00 AM', done:false },
      { name:'Aspirina 100mg',     time:'9:00 PM',  done:false },
    ],
  },
};

const DEFAULT_PARTNER = {
  name:'María Rodríguez', initials:'MR', email:'',
  lastSeen: 'Hace 30 min',
  meds: [
    { id:1, name:'Enalapril 5mg',    freq:'2x día',  done:true  },
    { id:2, name:'Metformina 850mg', freq:'1x día',  done:false },
  ],
  activity: {
    pasos:    { curr:5800, goal:10000, unit:'pasos', label:'Pasos'    },
    agua:     { curr:2.1,  goal:2.5,   unit:'L',     label:'Agua'     },
    sueño:    { curr:6.5,  goal:8,     unit:'h',     label:'Sueño'    },
    calorias: { curr:1900, goal:2000,  unit:'kcal',  label:'Calorías' },
  },
  reminders: [
    { name:'Medicamentos – Enalapril', time:'8:00 AM',  done:true  },
    { name:'Metformina 850mg',         time:'9:00 PM',  done:false },
  ],
};

let currentPartner = null;

/* ── Connect / Disconnect ────────────────── */
function connectPartner(emailOrId) {
  const key = emailOrId.toLowerCase().trim();
  const data = DEMO_PARTNERS[key];
  currentPartner = data
    ? { ...data }
    : { ...DEFAULT_PARTNER, email: emailOrId,
        name: DEFAULT_PARTNER.name + ' (' + emailOrId + ')' };
  localStorage.setItem('aura_partner', JSON.stringify(currentPartner));
  showConnected();
}

function disconnectPartner() {
  currentPartner = null;
  localStorage.removeItem('aura_partner');
  showDisconnected();
}

function showConnected() {
  document.getElementById('stateDisconnected').style.display = 'none';
  document.getElementById('stateConnected').style.display   = 'block';
  renderPartnerDashboard();
}

function showDisconnected() {
  document.getElementById('stateDisconnected').style.display = 'block';
  document.getElementById('stateConnected').style.display   = 'none';
}

/* ── Render partner dashboard ────────────── */
function renderPartnerDashboard() {
  const p = currentPartner;
  if (!p) return;

  /* ── Header ── */
  document.getElementById('ptnInitials').textContent = p.initials;
  document.getElementById('ptnName').textContent     = p.name;
  document.getElementById('ptnEmail').textContent    = p.email || 'Demo Partner';
  document.getElementById('modalPartnerName').textContent = p.name;
  const ctaEl = document.getElementById('ptnNameCta');
  if (ctaEl) ctaEl.textContent = p.name;

  /* ── Stats ── */
  const totalMeds = p.meds.length;
  const doneMeds  = p.meds.filter(m => m.done).length;
  const medPct    = totalMeds === 0 ? 0 : Math.round((doneMeds / totalMeds) * 100);

  const actVals = Object.values(p.activity);
  const actAvg  = Math.round(
    actVals.reduce((s, a) => s + Math.min(100, (a.curr / a.goal) * 100), 0) / actVals.length
  );

  const pendingRem = p.reminders.filter(r => !r.done).length;

  const vMed = document.getElementById('ptnStatMedVal');
  const sMed = document.getElementById('ptnStatMedSub');
  const vAct = document.getElementById('ptnStatActVal');
  const sAct = document.getElementById('ptnStatActSub');
  const vRem = document.getElementById('ptnStatRemVal');
  const sRem = document.getElementById('ptnStatRemSub');
  const vSeen= document.getElementById('ptnLastSeen');

  if (vMed)  vMed.textContent  = `${doneMeds}/${totalMeds}`;
  if (sMed)  sMed.textContent  = `${medPct}% tomados`;
  if (vAct)  vAct.textContent  = `${actAvg}%`;
  if (sAct)  sAct.textContent  = actAvg >= 80 ? '¡Excelente!' : actAvg >= 50 ? 'Buen progreso' : 'Necesita ayuda';
  if (vRem)  vRem.textContent  = pendingRem;
  if (sRem)  sRem.textContent  = pendingRem === 0 ? '¡Todo al día! 🎉' : 'pendientes hoy';
  if (vSeen) vSeen.textContent = p.lastSeen || 'Reciente';

  /* ── Donut ── */
  buildDonut('ptnDonut', medPct);
  const pctEl = document.getElementById('ptnDonutPct');
  if (pctEl) {
    let v = 0;
    const step = Math.max(1, Math.ceil(medPct / 40));
    const t = setInterval(() => {
      v = Math.min(v + step, medPct);
      pctEl.textContent = v + '%';
      if (v >= medPct) clearInterval(t);
    }, 30);
  }

  /* ── Medications list ── */
  const MED_COLORS = ['#4db8c8','#1a3a6e','#22b573','#f07030','#9b59b6'];
  const medList = document.getElementById('ptnMedList');
  if (medList) {
    medList.innerHTML = p.meds.map((m, i) => `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;
        background:var(--bg);border-radius:var(--radius-sm);border:1px solid var(--border);">
        <div style="width:9px;height:9px;border-radius:50%;background:${MED_COLORS[i % MED_COLORS.length]};flex-shrink:0;"></div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:.85rem;font-weight:600;color:var(--text);
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${m.name}</div>
          <div style="font-size:.72rem;color:var(--text-muted);">${m.freq}</div>
        </div>
        <div style="display:flex;align-items:center;gap:4px;font-size:.78rem;font-weight:600;
          flex-shrink:0;color:${m.done ? '#22b573' : '#e05050'};">
          ${m.done
            ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22b573" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`
            : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#e05050" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`}
          ${m.done ? 'Tomado' : 'Pendiente'}
        </div>
      </div>`).join('');
  }

  /* ── Activity ── */
  const actList = document.getElementById('ptnActivityList');
  if (actList) {
    actList.innerHTML = Object.values(p.activity).map(a => {
      const pct   = Math.min(100, Math.round((a.curr / a.goal) * 100));
      const color = pct >= 80 ? '#22b573' : pct >= 50 ? 'var(--turquoise,#4db8c8)' : '#f07030';
      return `
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
            <span style="font-size:.86rem;font-weight:600;color:var(--text);">${a.label}</span>
            <span style="font-size:.78rem;color:var(--text-muted);">
              ${a.curr} / ${a.goal} ${a.unit}
              <span style="margin-left:4px;font-weight:700;color:${color};">${pct}%</span>
            </span>
          </div>
          <div class="act-bar-wrap">
            <div class="act-bar-fill" data-w="${pct}" style="background:${color};"></div>
          </div>
        </div>`;
    }).join('');
    setTimeout(() => {
      actList.querySelectorAll('.act-bar-fill').forEach(b => { b.style.width = b.dataset.w + '%'; });
    }, 100);
  }

  /* ── Reminders ── */
  const remList = document.getElementById('ptnReminderList');
  if (remList) {
    if (!p.reminders.length) {
      remList.innerHTML = '<p style="text-align:center;font-size:.85rem;color:var(--text-muted);padding:12px 0;">Sin recordatorios para hoy.</p>';
    } else {
      remList.innerHTML = p.reminders.map(r => `
        <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;
          background:var(--bg);border-radius:var(--radius-sm);border:1px solid var(--border);">
          <div style="width:22px;height:22px;border-radius:50%;flex-shrink:0;
            background:${r.done ? '#22b573' : 'var(--border,#e2e8f0)'};
            display:flex;align-items:center;justify-content:center;">
            ${r.done
              ? `<svg width="11" height="9" viewBox="0 0 13 10" fill="none">
                   <polyline points="1.5,5 5,8.5 11.5,1.5" stroke="#fff" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round"/>
                 </svg>` : ''}
          </div>
          <div style="flex:1;font-size:.88rem;font-weight:600;color:var(--text);
            ${r.done ? 'text-decoration:line-through;opacity:.55;' : ''}">
            ${r.name}
          </div>
          <span style="font-size:.78rem;color:var(--text-muted);flex-shrink:0;">${r.time}</span>
          <span style="font-size:.74rem;font-weight:700;padding:3px 9px;border-radius:99px;flex-shrink:0;
            background:${r.done ? 'rgba(34,181,115,.12)' : 'rgba(224,80,80,.10)'};
            color:${r.done ? '#22b573' : '#e05050'};">
            ${r.done ? '✓ Cumplido' : '⏳ Pendiente'}
          </span>
        </div>`).join('');
    }
  }
}

/* ── Reminder Modal ──────────────────────── */
let selectedPreset = null;

function openReminderModal() {
  selectedPreset = null;
  document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
  document.getElementById('customMsg').value = '';
  document.getElementById('reminderModal').classList.add('show');
  setTimeout(() => document.querySelector('.preset-chip')?.focus(), 100);
}
function closeReminderModal() {
  document.getElementById('reminderModal').classList.remove('show');
}

function sendReminder() {
  const custom  = document.getElementById('customMsg').value.trim();
  const message = custom || selectedPreset;

  if (!message) {
    /* Visual shake on the chip row if nothing selected */
    const wrap = document.querySelector('.preset-chips-wrap');
    if (wrap) {
      wrap.style.animation = 'none';
      wrap.offsetHeight; // reflow
      wrap.style.animation = 'shake .3s ease';
    }
    document.getElementById('customMsg').focus();
    return;
  }

  closeReminderModal();

  /* Toast */
  const toast = document.getElementById('toast');
  const name  = currentPartner?.name || 'tu compañero';
  toast.textContent      = `✓ Recordatorio enviado a ${name}`;
  toast.style.opacity    = '1';
  toast.style.transform  = 'translateX(-50%) translateY(0)';
  setTimeout(() => {
    toast.style.opacity   = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
  }, 2800);

  /* Push to notification bell */
  if (typeof window.addNotification === 'function') {
    window.addNotification({
      icon:  '👥',
      title: `Recordatorio enviado a ${name}`,
      body:  message.length > 55 ? message.slice(0, 55) + '…' : message,
      time:  'Ahora',
    });
  }
}

/* ── Init ────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  /* Restore linked partner from localStorage */
  const saved = localStorage.getItem('aura_partner');
  if (saved) {
    try {
      currentPartner = JSON.parse(saved);
      showConnected();
    } catch (e) {
      showDisconnected();
    }
  } else {
    showDisconnected();
  }

  /* Connect form */
  document.getElementById('connectForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const val = document.getElementById('partnerInput').value.trim();
    if (!val) return;
    connectPartner(val);
  });

  /* Quick-connect chips */
  document.querySelectorAll('.quick-chip').forEach(btn => {
    btn.addEventListener('click', () => connectPartner(btn.dataset.email));
  });

  /* Disconnect */
  document.getElementById('btnDisconnect')?.addEventListener('click', disconnectPartner);

  /* Open reminder modal (hero button) */
  document.getElementById('btnSendReminder')?.addEventListener('click', openReminderModal);

  /* Preset chips selection */
  document.querySelectorAll('.preset-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedPreset = chip.dataset.msg;
    });
  });

  /* Send button */
  document.getElementById('btnSend')?.addEventListener('click', sendReminder);

  /* Close modal on backdrop / close button */
  document.getElementById('reminderModal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeReminderModal();
  });
  document.getElementById('btnCloseModal')?.addEventListener('click', closeReminderModal);

  /* Add shake keyframe */
  const style = document.createElement('style');
  style.textContent = `@keyframes shake {
    0%,100% { transform:translateX(0); }
    25%      { transform:translateX(-6px); }
    75%      { transform:translateX(6px); }
  }`;
  document.head.appendChild(style);
});
