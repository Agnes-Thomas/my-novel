window.SUPABASE_URL = 'https://jozxvmmsykuihnjmxuok.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impvenh2bW1zeWt1aWhuam14dW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NTY3NzksImV4cCI6MjA5NTIzMjc3OX0.l23Anzx-XuR1GCgtOVTx5crBKyoT2nuWIvlIKRJccLE';

/* ══════════════════════════════════════════
   THEME TOGGLE  ☀ / 🌙
══════════════════════════════════════════ */
function getTheme() {
  return localStorage.getItem('novel_theme') || 'light';
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
  /* update all toggle buttons on the page */
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.innerHTML = theme === 'dark'
      ? '<span class="icon">☀️</span>'
      : '<span class="icon">🌙</span>';
    btn.setAttribute('title', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  });
}

function toggleTheme() {
  const current = getTheme();
  const next    = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem('novel_theme', next);
  applyTheme(next);
}

/* Apply theme immediately on page load — before anything renders */
applyTheme(getTheme());

/* ══════════════════════════════════════════
   SUPABASE FETCH
══════════════════════════════════════════ */
async function sbFetch(path, opts = {}) {
  const res = await fetch(`${window.SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      'apikey':        window.SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + window.SUPABASE_ANON_KEY,
      'Content-Type':  'application/json',
      'Prefer':        opts.prefer || 'return=representation'
    },
    method: opts.method || 'GET',
    ...(opts.body ? { body: JSON.stringify(opts.body) } : {})
  });
  if (!res.ok) throw new Error(await res.text());
  const t = await res.text();
  return t ? JSON.parse(t) : null;
}

/* ══════════════════════════════════════════
   SETTINGS
══════════════════════════════════════════ */
async function getSettings() {
  const rows = await sbFetch('settings?id=eq.1');
  return rows?.[0] || {};
}

function applySettings(s) {
  const title = s.title || 'My Novel';
  document.querySelectorAll('.site-logo').forEach(el => {
    const words = title.split(' ');
    el.innerHTML = words.length > 1
      ? words.slice(0,-1).join(' ') + ' <em>' + words.slice(-1)[0] + '</em>'
      : title + ' <em>◆</em>';
  });
  document.querySelectorAll('.footer-logo').forEach(el => el.textContent = title + ' ◆');
  document.querySelectorAll('.footer-desc-txt').forEach(el => el.textContent = s.tagline || 'A serialized novel.');
  const fc = document.getElementById('footer-copy');
  if (fc) fc.textContent = '© ' + new Date().getFullYear() + (s.author_name ? ' · ' + s.author_name : '') + ' · All rights reserved';
  const pt = document.getElementById('page-title');
  if (pt && pt.dataset.suffix) pt.textContent = title + ' — ' + pt.dataset.suffix;
  else if (pt) pt.textContent = title + ' — Read Online';
  const gh = document.getElementById('gate-heading');
  const gs = document.getElementById('gate-subtext');
  if (gh) gh.textContent = s.gate_title || 'Unlock All Chapters';
  if (gs) gs.textContent = s.gate_msg   || 'Join free — instant access plus weekly updates.';
  return s;
}

/* ══════════════════════════════════════════
   NAV HELPERS
══════════════════════════════════════════ */
function setActiveNav() {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link, #mobile-nav a').forEach(a => {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });
}

function initHamburger() {
  const btn = document.getElementById('hamburger-btn');
  const mob = document.getElementById('mobile-nav');
  if (!btn || !mob) return;
  btn.addEventListener('click', () => {
    const open = mob.style.display === 'flex';
    mob.style.display = open ? 'none' : 'flex';
  });
}

/* ══════════════════════════════════════════
   GATE
══════════════════════════════════════════ */
function openGate()  {
  document.getElementById('gate-overlay')?.classList.add('active');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('gate-email')?.focus(), 60);
}
function closeGate() {
  document.getElementById('gate-overlay')?.classList.remove('active');
  document.body.style.overflow = '';
}
function isUnlocked() { return sessionStorage.getItem('novel_unlocked') === '1'; }

async function submitGate() {
  const el  = document.getElementById('gate-email');
  const em  = el.value.trim();
  if (!em || !em.includes('@') || !em.includes('.')) {
    el.style.borderColor = 'var(--red)'; el.focus(); return;
  }
  el.style.borderColor = '';
  const btn = document.getElementById('gate-submit-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>'; }
  try {
    await sbFetch('readers', { method: 'POST', body: { email: em }, prefer: 'return=minimal' });
  } catch(e) {}
  sessionStorage.setItem('novel_unlocked', '1');
  document.getElementById('gate-form-wrap').style.display = 'none';
  document.getElementById('gate-success').style.display   = 'block';
}

/* ══════════════════════════════════════════
   UTILS
══════════════════════════════════════════ */
function toast(msg, dur = 2800) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), dur);
}

function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeGate(); });

/* Apply theme again after DOM is ready (catches body class edge cases) */
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(getTheme());
});
