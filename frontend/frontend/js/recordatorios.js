/* ==========================================
   AURAHEALTH – recordatorios.js
   ========================================== */

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

/* ── Reminders data store ────────────────── */
let reminders = [
  { id:1, name:'Chequeo médico',          type:'medical',  dateStr:'2026-05-10', timeStr:'08:00', done:false },
  { id:2, name:'Pastillas – Omeprazol',   type:'medicine', dateStr:'2026-05-10', timeStr:'20:00', done:false },
  { id:3, name:'Exámenes de laboratorio', type:'exam',     dateStr:'2026-05-15', timeStr:'06:30', done:false },
  { id:4, name:'Vacuna Influenza',        type:'vaccine',  dateStr:'2026-05-17', timeStr:'10:00', done:false },
  { id:5, name:'Pastillas – Metformina',  type:'medicine', dateStr:'2026-05-22', timeStr:'20:00', done:false },
];
let nextRemId    = 6;
let editingRemId = null;
let selectedDateStr = null; // "YYYY-MM-DD" when a calendar day is selected

const TAG_MAP = {
  medical:  { label:'Médico',    cls:'tag-medical'  },
  medicine: { label:'Pastillas', cls:'tag-medicine' },
  exam:     { label:'Examen',    cls:'tag-exam'     },
  vaccine:  { label:'Vacuna',    cls:'tag-vaccine'  },
};

/* ── Calendar ────────────────────────────── */
let calDate = new Date();

function getEventDaysForMonth(year, month) {
  const days = new Set();
  reminders.forEach(r => {
    const d = new Date(r.dateStr + 'T00:00:00');
    if (d.getFullYear() === year && d.getMonth() === month) days.add(d.getDate());
  });
  return days;
}

function renderCalendar() {
  const year  = calDate.getFullYear();
  const month = calDate.getMonth();
  const today = new Date();
  const eventDays = getEventDaysForMonth(year, month);

  document.getElementById('calMonth').textContent = `${MONTHS[month]}, ${year}`;

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay + 6) % 7; // convert to Monday-based

  const grid = document.getElementById('calGrid');
  if (!grid) return;
  grid.innerHTML = '';

  for (let i = 0; i < startOffset; i++) {
    const d = document.createElement('div');
    d.className = 'cal-day empty';
    grid.appendChild(d);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement('div');
    cell.className = 'cal-day';
    cell.textContent = d;

    const isToday = (d === today.getDate() && month === today.getMonth() && year === today.getFullYear());
    if (isToday)        cell.classList.add('today');
    if (eventDays.has(d)) cell.classList.add('has-event');

    const cellDateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    if (selectedDateStr === cellDateStr) cell.classList.add('selected');

    cell.addEventListener('click', () => {
      document.querySelectorAll('.cal-day.selected').forEach(el => el.classList.remove('selected'));
      if (selectedDateStr === cellDateStr) {
        // Second click → clear filter
        selectedDateStr = null;
        renderReminderList();
      } else {
        cell.classList.add('selected');
        selectedDateStr = cellDateStr;
        renderReminderList(cellDateStr);
      }
    });

    grid.appendChild(cell);
  }
}

document.getElementById('calPrev')?.addEventListener('click', () => {
  calDate.setMonth(calDate.getMonth() - 1);
  renderCalendar();
});
document.getElementById('calNext')?.addEventListener('click', () => {
  calDate.setMonth(calDate.getMonth() + 1);
  renderCalendar();
});

/* ── Reminder list renderer ──────────────── */
function renderReminderList(filterDate = null) {
  const el = document.getElementById('reminderList');
  if (!el) return;

  // Sort by date+time ascending
  let list = [...reminders].sort((a, b) =>
    (a.dateStr + a.timeStr).localeCompare(b.dateStr + b.timeStr)
  );
  if (filterDate) list = list.filter(r => r.dateStr === filterDate);

  if (!list.length) {
    el.innerHTML = `<p style="text-align:center;font-size:.85rem;color:var(--text-muted);padding:16px 0;">
      ${filterDate ? 'Sin recordatorios para este día.' : 'No hay recordatorios aún.'}</p>`;
    updateDonut();
    return;
  }

  el.innerHTML = list.map(r => {
    const tag = TAG_MAP[r.type] || TAG_MAP.medical;
    const d   = new Date(r.dateStr + 'T' + r.timeStr);
    const fmt = d.toLocaleDateString('es-PE', { day:'numeric', month:'long' }) + ', ' +
                d.toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit' });
    return `
      <div class="reminder-item${r.done ? ' done' : ''}" data-id="${r.id}">
        <button class="reminder-check${r.done ? ' checked' : ''}" onclick="toggleReminder(${r.id})" aria-label="Marcar completado">
          <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
            <polyline points="1.5,5 5,8.5 11.5,1.5" stroke="#fff" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="reminder-info">
          <div class="reminder-name">${r.name}</div>
          <span class="reminder-time">${fmt}</span>
        </div>
        <span class="reminder-tag ${tag.cls}">${tag.label}</span>
        <div class="rem-actions">
          <button class="rem-edit-btn" onclick="editReminder(${r.id})" title="Editar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="rem-del-btn" onclick="deleteReminder(${r.id})" title="Eliminar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
      </div>`;
  }).join('');

  updateDonut();
}

/* ── Donut ───────────────────────────────── */
function updateDonut() {
  const total = reminders.length;
  const done  = reminders.filter(r => r.done).length;
  const pct   = total === 0 ? 0 : Math.round((done / total) * 100);

  const pctEl  = document.getElementById('donutPct');
  const doneEl = document.getElementById('doneCount');
  if (pctEl)  pctEl.textContent  = pct + '%';
  if (doneEl) doneEl.textContent = `${done}/${total} completados`;

  const svgEl = document.getElementById('donutProgress');
  if (!svgEl) return;
  const r = 62, circ = 2 * Math.PI * r, fill = circ * (pct / 100);
  svgEl.setAttribute('viewBox','0 0 160 160');
  svgEl.innerHTML = `
    <circle cx="80" cy="80" r="${r}" fill="none" stroke="var(--turquoise-light)" stroke-width="14"/>
    <circle cx="80" cy="80" r="${r}" fill="none"
      stroke="url(#pgrad)" stroke-width="14"
      stroke-dasharray="${fill} ${circ}" stroke-linecap="round"
      style="transition:stroke-dasharray .8s ease"/>
    <defs>
      <linearGradient id="pgrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#4db8c8"/>
        <stop offset="100%" stop-color="#1a3a6e"/>
      </linearGradient>
    </defs>`;
}

/* ── Actions ─────────────────────────────── */
function toggleReminder(id) {
  const r = reminders.find(x => x.id === id);
  if (r) { r.done = !r.done; renderReminderList(selectedDateStr); }
}

function deleteReminder(id) {
  reminders = reminders.filter(x => x.id !== id);
  renderReminderList(selectedDateStr);
  renderCalendar(); // refresh calendar dots
}

function editReminder(id) {
  const r = reminders.find(x => x.id === id);
  if (!r) return;
  editingRemId = id;
  document.getElementById('modalTitle').textContent = 'Editar Recordatorio';
  document.getElementById('rName').value  = r.name;
  document.getElementById('rType').value  = r.type;
  document.getElementById('rDate').value  = r.dateStr;
  document.getElementById('rTime').value  = r.timeStr;
  document.getElementById('modalOverlay').classList.add('show');
}

/* ── Modal ───────────────────────────────── */
function openModal() {
  editingRemId = null;
  document.getElementById('modalTitle').textContent = 'Nuevo Recordatorio';
  document.getElementById('reminderForm').reset();
  document.getElementById('modalOverlay').classList.add('show');
  setTimeout(() => document.getElementById('rName').focus(), 100);
}
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('show');
  editingRemId = null;
}

document.getElementById('newReminderBtn')?.addEventListener('click', openModal);
document.getElementById('modalClose')?.addEventListener('click', closeModal);
document.getElementById('modalCancel')?.addEventListener('click', closeModal);
document.getElementById('modalOverlay')?.addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});

document.getElementById('reminderForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const name    = document.getElementById('rName').value.trim();
  const type    = document.getElementById('rType').value;
  const dateStr = document.getElementById('rDate').value;
  const timeStr = document.getElementById('rTime').value;
  if (!name || !dateStr || !timeStr) return;

  if (editingRemId !== null) {
    // Update existing
    const r = reminders.find(x => x.id === editingRemId);
    if (r) { r.name = name; r.type = type; r.dateStr = dateStr; r.timeStr = timeStr; }
  } else {
    // Create new
    reminders.push({ id: nextRemId++, name, type, dateStr, timeStr, done: false });
  }

  renderReminderList(selectedDateStr);
  renderCalendar();
  closeModal();
});

/* ── Init ────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  renderCalendar();
  renderReminderList();
});
