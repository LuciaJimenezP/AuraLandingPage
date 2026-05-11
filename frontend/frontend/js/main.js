/* ==========================================
   AURAHEALTH – main.js
   Shared logic: sidebar, dark mode, font size, AuraBot
   ========================================== */

/* ── Dark mode ───────────────────────────── */
const darkToggle = document.getElementById('darkToggle');
const body = document.body;

function applyDark(on) {
  body.classList.toggle('dark', on);
  if (darkToggle) darkToggle.classList.toggle('on', on);
  localStorage.setItem('aura_dark', on ? '1' : '0');
}

if (localStorage.getItem('aura_dark') === '1') applyDark(true);

darkToggle?.addEventListener('click', () => applyDark(!body.classList.contains('dark')));

/* ── Font size ───────────────────────────── */
let fontSize = parseInt(localStorage.getItem('aura_font') || '16', 10);
document.documentElement.style.setProperty('--font-size', fontSize + 'px');

document.getElementById('fontUp')?.addEventListener('click', () => {
  fontSize = Math.min(fontSize + 2, 22);
  document.documentElement.style.setProperty('--font-size', fontSize + 'px');
  localStorage.setItem('aura_font', fontSize);
});
document.getElementById('fontDown')?.addEventListener('click', () => {
  fontSize = Math.max(fontSize - 2, 12);
  document.documentElement.style.setProperty('--font-size', fontSize + 'px');
  localStorage.setItem('aura_font', fontSize);
});

/* ── Sidebar toggle (mobile) ─────────────── */
const sidebar  = document.getElementById('sidebar');
const overlay  = document.getElementById('sidebarOverlay');
const hamburger = document.getElementById('hamburger');

function openSidebar()  { sidebar?.classList.add('open');  overlay?.classList.add('show'); }
function closeSidebar() { sidebar?.classList.remove('open'); overlay?.classList.remove('show'); }

hamburger?.addEventListener('click', openSidebar);
overlay?.addEventListener('click', closeSidebar);

/* ── AuraBot ─────────────────────────────── */
const botFab    = document.getElementById('botFab');
const botWindow = document.getElementById('botWindow');
const botClose  = document.getElementById('botClose');
const botInput  = document.getElementById('botInput');
const botSend   = document.getElementById('botSend');
const botMsgs   = document.getElementById('botMessages');

const botResponses = {
  default: [
    '¡Hola! Soy AuraBot 🌿 Tu asistente de salud. ¿En qué puedo ayudarte hoy?',
    'Recuerda mantener una hidratación adecuada: al menos 8 vasos de agua al día.',
    'Para una mejor salud cardiovascular, te recomiendo 30 minutos de actividad física diaria.',
    'Asegúrate de tomar tus medicamentos a la hora indicada. ¡Tus recordatorios te ayudarán!',
    'Dormir entre 7 y 9 horas es fundamental para tu bienestar.',
  ],
  pastillas: 'Recuerda tomar tus pastillas con abundante agua y a la misma hora cada día. 💊',
  vacuna:    'Las vacunas son esenciales para tu protección. Revisa tu calendario de vacunación en la sección de Recordatorios. 🛡️',
  ejercicio: 'Se recomienda al menos 150 minutos de ejercicio moderado a la semana. ¡Tú puedes! 💪',
  nutricion: 'Una dieta balanceada incluye frutas, verduras, proteínas y carbohidratos complejos. 🥦',
  cita:      'Para agendar una cita, ve a la sección de Recordatorios y presiona "Nuevo recordatorio". 📅',
};

function addMsg(text, type) {
  const div = document.createElement('div');
  div.className = `msg ${type}`;
  div.textContent = text;
  botMsgs?.appendChild(div);
  botMsgs.scrollTop = botMsgs.scrollHeight;
}

function getBotReply(text) {
  const t = text.toLowerCase();
  if (t.includes('pastilla') || t.includes('medicamento')) return botResponses.pastillas;
  if (t.includes('vacuna'))    return botResponses.vacuna;
  if (t.includes('ejercicio') || t.includes('correr')) return botResponses.ejercicio;
  if (t.includes('nutrici') || t.includes('comer') || t.includes('dieta')) return botResponses.nutricion;
  if (t.includes('cita') || t.includes('médico') || t.includes('doctor')) return botResponses.cita;
  return botResponses.default[Math.floor(Math.random() * botResponses.default.length)];
}

function sendBotMsg() {
  const text = botInput?.value.trim();
  if (!text) return;
  addMsg(text, 'user');
  botInput.value = '';
  setTimeout(() => addMsg(getBotReply(text), 'bot'), 600);
}

botFab?.addEventListener('click', () => {
  botWindow?.classList.toggle('open');
});

botClose?.addEventListener('click', () => botWindow?.classList.remove('open'));

botSend?.addEventListener('click', sendBotMsg);
botInput?.addEventListener('keydown', e => { if (e.key === 'Enter') sendBotMsg(); });

document.querySelectorAll('.sug-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    if (botInput) botInput.value = chip.textContent;
    sendBotMsg();
  });
});

/* ── Notification Panel ──────────────────── */
(function initNotifications() {
  const bell = document.querySelector('.topbar-right .icon-btn');
  const badge = document.querySelector('.topbar-right .icon-btn .badge');
  if (!bell) return;

  /* ── Sample notifications data ── */
  let notifications = [
    { id:1, read:false, icon:'📅', title:'Chequeo médico mañana',      body:'Dr. Ramírez – 8:00 AM',               time:'Hace 5 min'  },
    { id:2, read:false, icon:'💊', title:'Hora de tu Omeprazol',        body:'Recuerda tomarlo antes de comer',      time:'Hace 20 min' },
    { id:3, read:false, icon:'👟', title:'Meta de pasos al 62%',        body:'Te faltan 3,760 pasos para hoy',       time:'Hace 1 h'    },
    { id:4, read:true,  icon:'✅', title:'Cita confirmada',             body:'Dr. Ramírez confirmó para el 15 May',  time:'Ayer'        },
    { id:5, read:true,  icon:'💧', title:'Hidratación baja',            body:'Registra más agua hoy',                time:'Ayer'        },
  ];

  /* ── Inject CSS once ── */
  const style = document.createElement('style');
  style.textContent = `
    /* Notification panel */
    .notif-panel {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      width: 340px;
      background: var(--surface, #fff);
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,.18), 0 2px 8px rgba(0,0,0,.08);
      border: 1px solid var(--border, #e2e8f0);
      z-index: 400;
      overflow: hidden;
      transform: translateY(-8px) scale(.97);
      opacity: 0;
      pointer-events: none;
      transition: transform .22s ease, opacity .22s ease;
    }
    .notif-panel.open {
      transform: translateY(0) scale(1);
      opacity: 1;
      pointer-events: auto;
    }
    .notif-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 18px 12px;
      border-bottom: 1px solid var(--border, #e2e8f0);
    }
    .notif-header h4 {
      font-family: 'Poppins', sans-serif;
      font-size: .95rem;
      font-weight: 700;
      color: var(--blue-dark, #1a3a6e);
    }
    .notif-mark-all {
      background: none;
      border: none;
      font-size: .75rem;
      color: var(--turquoise, #4db8c8);
      cursor: pointer;
      font-family: 'Roboto', sans-serif;
      font-weight: 600;
      padding: 0;
    }
    .notif-mark-all:hover { text-decoration: underline; }
    .notif-list {
      max-height: 340px;
      overflow-y: auto;
    }
    .notif-list::-webkit-scrollbar { width: 4px; }
    .notif-list::-webkit-scrollbar-thumb { background: var(--turquoise, #4db8c8); border-radius: 2px; }
    .notif-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 13px 18px;
      border-bottom: 1px solid var(--border, #e2e8f0);
      transition: background .15s;
      cursor: pointer;
      position: relative;
    }
    .notif-item:last-child { border-bottom: none; }
    .notif-item:hover { background: var(--bg, #f0fbfc); }
    .notif-item.unread { background: rgba(77,184,200,.07); }
    .notif-item.unread:hover { background: rgba(77,184,200,.13); }
    .notif-emoji {
      font-size: 1.4rem;
      line-height: 1;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .notif-body { flex: 1; min-width: 0; }
    .notif-title {
      font-size: .87rem;
      font-weight: 600;
      color: var(--text, #1a1a2e);
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .notif-item.unread .notif-title { color: var(--blue-dark, #1a3a6e); }
    .notif-desc {
      font-size: .78rem;
      color: var(--text-muted, #64748b);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .notif-time {
      font-size: .72rem;
      color: var(--text-muted, #94a3b8);
      flex-shrink: 0;
      margin-top: 1px;
    }
    .notif-dot {
      position: absolute;
      top: 50%;
      right: 14px;
      transform: translateY(-50%);
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--turquoise, #4db8c8);
    }
    .notif-empty {
      padding: 28px 18px;
      text-align: center;
      font-size: .88rem;
      color: var(--text-muted, #94a3b8);
    }
    .notif-footer {
      padding: 10px 18px;
      border-top: 1px solid var(--border, #e2e8f0);
      text-align: center;
    }
    .notif-footer a {
      font-size: .8rem;
      color: var(--turquoise, #4db8c8);
      font-weight: 600;
      text-decoration: none;
      font-family: 'Roboto', sans-serif;
    }
    .notif-footer a:hover { text-decoration: underline; }
    /* Badge update */
    .topbar-right .icon-btn { position: relative; }
    .topbar-right .icon-btn .badge {
      position: absolute;
      top: 4px; right: 4px;
      width: 8px; height: 8px;
      border-radius: 50%;
      background: #e05050;
      border: 1.5px solid var(--surface, #fff);
      display: block;
    }
    .topbar-right .icon-btn .badge.hidden { display: none; }
    /* Make icon-btn container relative */
    .topbar-right { position: relative; }
  `;
  document.head.appendChild(style);

  /* ── Build the panel ── */
  const panel = document.createElement('div');
  panel.className = 'notif-panel';
  panel.id = 'notifPanel';

  function unreadCount() { return notifications.filter(n => !n.read).length; }

  function updateBadge() {
    const count = unreadCount();
    if (badge) badge.classList.toggle('hidden', count === 0);
  }

  function renderPanel() {
    const unread = unreadCount();
    panel.innerHTML = `
      <div class="notif-header">
        <h4>Notificaciones ${unread > 0 ? `<span style="font-size:.75rem;background:var(--turquoise,#4db8c8);color:#fff;border-radius:99px;padding:1px 7px;margin-left:4px;">${unread}</span>` : ''}</h4>
        <button class="notif-mark-all" id="notifMarkAll">Marcar todas como leídas</button>
      </div>
      <div class="notif-list" id="notifList">
        ${notifications.length === 0
          ? '<div class="notif-empty">No tienes notificaciones 🎉</div>'
          : notifications.map(n => `
            <div class="notif-item${n.read ? '' : ' unread'}" data-id="${n.id}">
              <div class="notif-emoji">${n.icon}</div>
              <div class="notif-body">
                <div class="notif-title">${n.title}</div>
                <div class="notif-desc">${n.body}</div>
              </div>
              <div class="notif-time">${n.time}</div>
              ${!n.read ? '<div class="notif-dot"></div>' : ''}
            </div>`).join('')
        }
      </div>
      <div class="notif-footer"><a href="recordatorios.html">Ver todos los recordatorios →</a></div>
    `;

    /* Mark individual as read on click */
    panel.querySelectorAll('.notif-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = parseInt(item.dataset.id, 10);
        const n = notifications.find(x => x.id === id);
        if (n && !n.read) {
          n.read = true;
          renderPanel();
          updateBadge();
        }
      });
    });

    /* Mark all as read */
    panel.querySelector('#notifMarkAll')?.addEventListener('click', e => {
      e.stopPropagation();
      notifications.forEach(n => { n.read = true; });
      renderPanel();
      updateBadge();
    });
  }

  /* ── Expose globally so other modules can push notifications ── */
  window.addNotification = function(notif) {
    notifications.unshift({
      id:    Date.now(),
      read:  false,
      icon:  notif.icon  || '🔔',
      title: notif.title || 'Nueva notificación',
      body:  notif.body  || '',
      time:  notif.time  || 'Ahora',
    });
    renderPanel();
    updateBadge();
  };

  /* Attach panel next to the bell button */
  bell.style.position = 'relative';
  bell.parentElement.style.position = 'relative';
  bell.parentElement.appendChild(panel);

  renderPanel();
  updateBadge();

  /* ── Toggle panel ── */
  bell.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = panel.classList.toggle('open');
    if (isOpen) renderPanel(); // refresh on each open
  });

  /* Close when clicking outside */
  document.addEventListener('click', e => {
    if (!panel.contains(e.target) && e.target !== bell) {
      panel.classList.remove('open');
    }
  });
})();

/* ── Active nav highlighting ─────────────── */
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-item[data-page]').forEach(item => {
  if (item.dataset.page === currentPage) item.classList.add('active');
});
document.querySelectorAll('.mobile-nav-item[data-page]').forEach(item => {
  if (item.dataset.page === currentPage) item.classList.add('active');
});
