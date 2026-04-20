// ===== DATA INIT =====
const PAPER_IDS = {
  'paper-1': { name: 'English & GK', color: '#00c8ff' },
  'paper-2': { name: 'Mathematics', color: '#ff6b35' },
  'paper-3': { name: 'General Science', color: '#4ade80' }
};

const MOTIVATIONS = [
  "🎯 Great job, Sailor! Keep pushing forward!",
  "⚓ Anchors aweigh! You're making progress!",
  "🌊 Steady as she goes — you're on course!",
  "🏅 Outstanding discipline! Navy spirit!",
  "🚀 One topic at a time — victory is near!",
  "💪 Strong work! The NEA is within reach!",
  "🔱 Jai Hind! You're getting closer every day!",
  "⭐ Excellent! Keep up the momentum!",
  "🛡️ Discipline wins battles — and exams!",
  "🎖️ Well done! A true artificer in the making!"
];

let completedTopics = {};
let plannerTasks = [];
let streak = 0;
let lastStudyDate = null;

// ===== STORAGE HELPERS =====
function save() {
  localStorage.setItem('nea_completed', JSON.stringify(completedTopics));
  localStorage.setItem('nea_planner', JSON.stringify(plannerTasks));
  localStorage.setItem('nea_streak', streak);
  localStorage.setItem('nea_last_date', lastStudyDate || '');
  localStorage.setItem('nea_target', document.getElementById('target-date').value || '');
  const dark = document.body.classList.contains('dark');
  localStorage.setItem('nea_dark', dark ? '1' : '0');
}

function load() {
  try {
    const c = localStorage.getItem('nea_completed');
    if (c) completedTopics = JSON.parse(c);
    const p = localStorage.getItem('nea_planner');
    if (p) plannerTasks = JSON.parse(p);
    streak = parseInt(localStorage.getItem('nea_streak') || '0');
    lastStudyDate = localStorage.getItem('nea_last_date') || null;
    const t = localStorage.getItem('nea_target');
    if (t) document.getElementById('target-date').value = t;
    const dark = localStorage.getItem('nea_dark');
    if (dark === '0') {
      document.body.classList.remove('dark');
      document.body.classList.add('light');
      document.getElementById('dark-toggle').textContent = '☀️';
    }
  } catch (e) { console.log('Load error', e); }
}

// ===== TOPIC MANAGEMENT =====
function getAllTopicIds() {
  return Array.from(document.querySelectorAll('.topic-item')).map(el => el.dataset.id);
}

function getTopicsInPaper(paperId) {
  const body = document.getElementById('body-' + paperId);
  return body ? Array.from(body.querySelectorAll('.topic-item')).map(el => el.dataset.id) : [];
}

function countDone(ids) {
  return ids.filter(id => completedTopics[id]).length;
}

function toggleTopic(el) {
  const id = el.dataset.id;
  if (completedTopics[id]) {
    delete completedTopics[id];
    el.classList.remove('done', 'just-checked');
  } else {
    completedTopics[id] = true;
    el.classList.add('done');
    el.classList.remove('just-checked');
    void el.offsetWidth; // reflow for animation
    el.classList.add('just-checked');
    updateStreak();
    showMotivation();
    setTimeout(() => el.classList.remove('just-checked'), 400);
  }
  updateAllProgress();
  save();
}

// ===== RENDER TOPICS FROM STORAGE =====
function applyStoredState() {
  document.querySelectorAll('.topic-item').forEach(el => {
    if (completedTopics[el.dataset.id]) {
      el.classList.add('done');
    }
  });
}

// ===== PROGRESS UPDATES =====
function updateAllProgress() {
  const all = getAllTopicIds();
  const totalDone = countDone(all);
  const total = all.length;
  const pct = total > 0 ? Math.round((totalDone / total) * 100) : 0;

  document.getElementById('overall-pct').textContent = pct + '%';
  document.getElementById('overall-count').textContent = `${totalDone} / ${total} topics done`;
  document.getElementById('overall-bar').style.width = pct + '%';

  ['paper-1', 'paper-2', 'paper-3'].forEach(pid => {
    const ids = getTopicsInPaper(pid);
    const done = countDone(ids);
    const p = ids.length > 0 ? Math.round((done / ids.length) * 100) : 0;
    document.getElementById('prog-' + pid).style.width = p + '%';
    document.getElementById('pct-' + pid).textContent = p + '%';
  });

  updateStats();
  updateRemaining();
}

// ===== STREAK =====
function updateStreak() {
  const today = new Date().toDateString();
  if (lastStudyDate === today) return;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (lastStudyDate === yesterday.toDateString()) {
    streak++;
  } else if (lastStudyDate !== today) {
    streak = 1;
  }
  lastStudyDate = today;
  document.getElementById('streak-num').textContent = streak;
  document.getElementById('stat-streak').textContent = streak;
}

// ===== MOTIVATION TOAST =====
let toastTimer = null;
function showMotivation() {
  const done = countDone(getAllTopicIds());
  if (done % 5 !== 0) return; // every 5 topics
  const msg = MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)];
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 3000);
}

// ===== COLLAPSIBLE PAPERS =====
function togglePaper(id) {
  const card = document.getElementById(id);
  card.classList.toggle('open');
}

// ===== COLLAPSIBLE GROUPS =====
function toggleGroup(header) {
  const group = header.closest('.topic-group');
  group.classList.toggle('open');
}

// ===== TABS =====
function initTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
      if (tab.dataset.tab === 'stats') updateStats();
      if (tab.dataset.tab === 'planner') renderPlanner();
    });
  });
}

// ===== TARGET DATE =====
function updateDaysLeft() {
  const val = document.getElementById('target-date').value;
  const el = document.getElementById('days-left');
  if (!val) { el.textContent = ''; return; }
  const target = new Date(val);
  const today = new Date();
  today.setHours(0,0,0,0);
  target.setHours(0,0,0,0);
  const diff = Math.round((target - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) el.textContent = `Exam was ${Math.abs(diff)} days ago`;
  else if (diff === 0) el.textContent = '🚨 Exam is TODAY!';
  else el.textContent = `⏳ ${diff} days remaining`;
  save();
}

// ===== DARK MODE =====
function initDarkToggle() {
  document.getElementById('dark-toggle').addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark');
    document.body.classList.toggle('dark', !isDark);
    document.body.classList.toggle('light', isDark);
    document.getElementById('dark-toggle').textContent = isDark ? '🌙' : '☀️';
    save();
  });
}

// ===== RESET =====
function initReset() {
  document.getElementById('reset-btn').addEventListener('click', () => {
    if (!confirm('Reset ALL progress? This cannot be undone.')) return;
    completedTopics = {};
    plannerTasks = [];
    streak = 0;
    lastStudyDate = null;
    document.querySelectorAll('.topic-item').forEach(el => el.classList.remove('done', 'just-checked'));
    document.getElementById('streak-num').textContent = '0';
    save();
    updateAllProgress();
    renderPlanner();
    alert('Progress reset. Good luck with your fresh start! ⚓');
  });
}

// ===== PLANNER =====
function renderPlanner() {
  const today = new Date();
  document.getElementById('today-label').textContent = today.toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const list = document.getElementById('plan-list');
  if (plannerTasks.length === 0) {
    list.innerHTML = '<div class="empty-msg">No tasks yet. Add your study plan above!</div>';
    return;
  }

  list.innerHTML = plannerTasks.map((task, i) => `
    <div class="plan-task">
      <span class="plan-badge ${task.sub}">${task.sub.toUpperCase()}</span>
      <span class="plan-text">${task.text}</span>
      <span class="plan-del" onclick="deletePlanTask(${i})">✕</span>
    </div>
  `).join('');

  updateRemaining();
}

function updateRemaining() {
  const rem = document.getElementById('remaining-list');
  if (!rem) return;
  const rows = ['paper-1','paper-2','paper-3'].map(pid => {
    const ids = getTopicsInPaper(pid);
    const done = countDone(ids);
    const left = ids.length - done;
    return `<div class="remaining-row">
      <span>${PAPER_IDS[pid].name}</span>
      <span class="remaining-count">${left} remaining</span>
    </div>`;
  });
  rem.innerHTML = rows.join('');
}

document.addEventListener('DOMContentLoaded', () => {
  const addBtn = document.getElementById('plan-add-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const sub = document.getElementById('plan-subject').value;
      const text = document.getElementById('plan-topic').value.trim();
      if (!sub || !text) { alert('Please select a paper and enter a topic.'); return; }
      plannerTasks.push({ sub, text });
      document.getElementById('plan-topic').value = '';
      save();
      renderPlanner();
    });
  }
});

function deletePlanTask(i) {
  plannerTasks.splice(i, 1);
  save();
  renderPlanner();
}

// ===== STATS =====
function updateStats() {
  const all = getAllTopicIds();
  const done = countDone(all);
  document.getElementById('stat-total').textContent = all.length;
  document.getElementById('stat-done').textContent = done;
  document.getElementById('stat-left').textContent = all.length - done;
  document.getElementById('stat-streak').textContent = streak;
  document.getElementById('streak-num').textContent = streak;

  // Paper breakdown
  const psl = document.getElementById('paper-stats-list');
  if (!psl) return;
  psl.innerHTML = ['paper-1','paper-2','paper-3'].map(pid => {
    const info = PAPER_IDS[pid];
    const ids = getTopicsInPaper(pid);
    const d = countDone(ids);
    const pct = ids.length > 0 ? Math.round((d / ids.length) * 100) : 0;
    return `<div class="paper-stat-row">
      <div class="psr-title">
        <span>${info.name}</span>
        <span class="psr-pct" style="color:${info.color}">${pct}% (${d}/${ids.length})</span>
      </div>
      <div class="psr-bar-bg">
        <div class="psr-bar" style="width:${pct}%;background:${info.color}"></div>
      </div>
    </div>`;
  }).join('');

  // Motivational message
  const mEl = document.getElementById('stats-motivation');
  const pct = all.length > 0 ? Math.round((done / all.length) * 100) : 0;
  let msg = '';
  if (pct === 0) msg = "⚓ Start strong today — your Navy career begins here!";
  else if (pct < 25) msg = "🌊 Good start! You've begun your journey. Keep sailing!";
  else if (pct < 50) msg = "🚀 You're 25%+ done! Momentum is building, sailor!";
  else if (pct < 75) msg = "💪 Halfway there! The NEA is within your reach!";
  else if (pct < 100) msg = "🏅 Almost there! Final stretch — give it everything!";
  else msg = "🎖️ SYLLABUS COMPLETE! Report for duty, Artificer! Jai Hind!";
  mEl.textContent = msg;
}

// ===== TODAY DATE LABEL =====
function setTodayLabel() {
  const el = document.getElementById('today-label');
  if (el) {
    const today = new Date();
    el.textContent = today.toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  load();
  applyStoredState();
  updateAllProgress();
  updateStreak();
  initTabs();
  initDarkToggle();
  initReset();
  setTodayLabel();
  renderPlanner();
  updateDaysLeft();

  // Topic click events
  document.querySelectorAll('.topic-item').forEach(el => {
    el.addEventListener('click', () => toggleTopic(el));
  });

  // Target date
  document.getElementById('target-date').addEventListener('change', updateDaysLeft);

  // Open first paper by default
  document.getElementById('paper-1').classList.add('open');
});

// ===== SERVICE WORKER =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(() => console.log('SW registered'))
      .catch(err => console.log('SW error', err));
  });
}
