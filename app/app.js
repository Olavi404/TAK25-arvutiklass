// app.js — Arvutiklasside broneerimissüsteem (sql.js versioon)
const express = require('express');
const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');
const { z } = require('zod');

const app = express();
const PORT = Number(process.env.PORT ?? 3000);
const DB_FILE = process.env.CLASSROOM_DB_FILE || path.join(__dirname, 'arvutiklass.db.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Andmebaas (mälu + JSON faili) ──────────────────────────
let DB = null;

function loadDB() {
  if (fs.existsSync(DB_FILE)) {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  }
  const data = {
    lesson_types: [
      { id: 1, name: 'Loeng', description: 'Õpetaja-juhitud loeng' },
      { id: 2, name: 'Praktikum', description: 'Iseseisvad harjutused' },
      { id: 3, name: 'Eksam', description: 'Kirjalik või arvutieksam' },
      { id: 4, name: 'Konsultatsioon', description: 'Individuaalne nõustamine' },
    ],
    classrooms: [
      { id: 1, name: 'A101', capacity: 30, location: 'A-korpus 1. korrus', equipment: 'PC x30, projektor' },
      { id: 2, name: 'A102', capacity: 25, location: 'A-korpus 1. korrus', equipment: 'PC x25, projektor' },
      { id: 3, name: 'B201', capacity: 20, location: 'B-korpus 2. korrus', equipment: 'PC x20, tahvel' },
      { id: 4, name: 'B202', capacity: 35, location: 'B-korpus 2. korrus', equipment: 'PC x35, projektor x2' },
      { id: 5, name: 'C301', capacity: 15, location: 'C-korpus 3. korrus', equipment: 'MacBook x15' },
    ],
    users: [
      { id: 1, name: 'Mari Mägi',   type: 'teacher', email: 'mari@kool.ee',   department: 'Infotehnoloogia' },
      { id: 2, name: 'Jüri Jõgi',   type: 'teacher', email: 'jyri@kool.ee',   department: 'Matemaatika' },
      { id: 3, name: 'TAK25',       type: 'group',   email: 'tak25@kool.ee',  department: null },
      { id: 4, name: 'TAR24',       type: 'group',   email: 'tar24@kool.ee',  department: null },
      { id: 5, name: 'Peeter Pärn', type: 'teacher', email: 'peeter@kool.ee', department: 'Infotehnoloogia' },
    ],
    bookings: [
      { id: 1, classroom_id: 1, user_group_id: 3, lesson_type_id: 2, booking_date: '2025-01-13', start_time: '08:00', end_time: '09:30', participant_count: 28, status: 'completed', notes: '' },
      { id: 2, classroom_id: 2, user_group_id: 4, lesson_type_id: 1, booking_date: '2025-01-13', start_time: '10:00', end_time: '11:30', participant_count: 22, status: 'completed', notes: '' },
      { id: 3, classroom_id: 3, user_group_id: 1, lesson_type_id: 2, booking_date: '2025-01-14', start_time: '12:00', end_time: '13:30', participant_count: 18, status: 'active',    notes: 'Python' },
      { id: 4, classroom_id: 4, user_group_id: 2, lesson_type_id: 3, booking_date: '2025-01-15', start_time: '09:00', end_time: '11:00', participant_count: 30, status: 'active',    notes: 'Eksam' },
      { id: 5, classroom_id: 1, user_group_id: 4, lesson_type_id: 1, booking_date: '2025-01-16', start_time: '08:00', end_time: '09:30', participant_count: 25, status: 'active',    notes: '' },
    ],
    nextId: { bookings: 6 }
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  return data;
}

function saveDB() { fs.writeFileSync(DB_FILE, JSON.stringify(DB, null, 2)); }

DB = loadDB();

// ── UI ──────────────────────────────────────────────────────
const HTML = `<!DOCTYPE html>
<html lang="et">
<head>
<meta charset="UTF-8">
<title>Arvutiklasside broneerimissüsteem</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,sans-serif;background:#f5f5f5;color:#222}
  header{background:#1a3a6b;color:#fff;padding:16px 32px}
  header h1{font-size:1.3rem;font-weight:500}
  nav{display:flex;gap:8px;margin-top:10px}
  nav button{background:rgba(255,255,255,.15);color:#fff;border:none;padding:6px 16px;border-radius:6px;cursor:pointer;font-size:.9rem}
  nav button.active,nav button:hover{background:rgba(255,255,255,.35)}
  main{max-width:1100px;margin:24px auto;padding:0 16px}
  .card{background:#fff;border-radius:10px;padding:20px;margin-bottom:20px;box-shadow:0 1px 4px rgba(0,0,0,.08)}
  .card h2{font-size:1rem;font-weight:500;margin-bottom:14px;color:#1a3a6b}
  table{width:100%;border-collapse:collapse;font-size:.88rem}
  th{background:#f0f4ff;text-align:left;padding:8px 10px;font-weight:500;border-bottom:2px solid #dde3f0}
  td{padding:8px 10px;border-bottom:1px solid #eee}
  tr:hover td{background:#fafbff}
  .btn{padding:6px 14px;border:none;border-radius:6px;cursor:pointer;font-size:.85rem}
  .btn-primary{background:#1a3a6b;color:#fff}
  .btn-danger{background:#c0392b;color:#fff}
  .btn-edit{background:#2980b9;color:#fff}
  .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .form-group{display:flex;flex-direction:column;gap:4px}
  .form-group label{font-size:.82rem;color:#555}
  .form-group input,.form-group select,.form-group textarea{padding:7px 10px;border:1px solid #ccc;border-radius:6px;font-size:.9rem}
  .span-2{grid-column:span 2}
  .stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px}
  .stat-box{background:#f0f4ff;border-radius:8px;padding:16px;text-align:center}
  .stat-num{font-size:2rem;font-weight:500;color:#1a3a6b}
  .stat-lbl{font-size:.82rem;color:#555;margin-top:4px}
  .badge{padding:2px 8px;border-radius:10px;font-size:.78rem}
  .badge-active{background:#d5f5e3;color:#1e8449}
  .badge-cancelled{background:#fde8e8;color:#c0392b}
  .badge-completed{background:#eaf3fb;color:#1a5276}
  .hidden{display:none}
  #msgBox{padding:8px 14px;border-radius:6px;margin-bottom:12px}
  .msg-ok{background:#d5f5e3;color:#1e8449}
  .msg-err{background:#fde8e8;color:#c0392b}
  canvas{max-height:260px}
</style>
</head>
<body>
<header>
  <h1>Arvutiklasside broneerimissüsteem</h1>
  <nav>
    <button class="active" onclick="showPage('bookings')">Broneeringud</button>
    <button onclick="showPage('add')">Lisa uus</button>
    <button onclick="showPage('stats')">Statistika</button>
    <button onclick="showPage('classrooms')">Klassid</button>
  </nav>
</header>
<main>
  <div id="msgBox" class="hidden"></div>

  <div id="page-bookings" class="card">
    <h2>Kõik broneeringud</h2>
    <table>
      <thead><tr><th>#</th><th>Klass</th><th>Kasutaja/Grupp</th><th>Tüüp</th><th>Kuupäev</th><th>Aeg</th><th>Osalejaid</th><th>Staatus</th><th>Toimingud</th></tr></thead>
      <tbody id="bookingBody"></tbody>
    </table>
  </div>

  <div id="page-add" class="card hidden">
    <h2 id="formTitle">Lisa uus broneering</h2>
    <div class="form-grid">
      <div class="form-group"><label>Klass</label><select id="f_classroom"></select></div>
      <div class="form-group"><label>Kasutaja/Grupp</label><select id="f_user"></select></div>
      <div class="form-group"><label>Tunni tüüp</label><select id="f_type"></select></div>
      <div class="form-group"><label>Kuupäev</label><input type="date" id="f_date"></div>
      <div class="form-group"><label>Algusaeg</label><input type="time" id="f_start"></div>
      <div class="form-group"><label>Lõppaeg</label><input type="time" id="f_end"></div>
      <div class="form-group"><label>Osalejaid</label><input type="number" id="f_count" min="0" value="1"></div>
      <div class="form-group"><label>Staatus</label>
        <select id="f_status"><option value="active">Active</option><option value="cancelled">Cancelled</option><option value="completed">Completed</option></select>
      </div>
      <div class="form-group span-2"><label>Märkused</label><textarea id="f_notes" rows="2"></textarea></div>
    </div>
    <div style="margin-top:16px;display:flex;gap:8px">
      <button class="btn btn-primary" onclick="saveBooking()">Salvesta</button>
      <button class="btn" onclick="showPage('bookings')">Tühista</button>
    </div>
    <input type="hidden" id="f_id">
  </div>

  <div id="page-stats" class="card hidden">
    <h2>Statistika</h2>
    <div class="stat-grid" id="statBoxes"></div>
    <div style="margin-top:20px"><h2 style="margin-bottom:14px">Klasside kasutus (tunnid kokku)</h2><canvas id="chart"></canvas></div>
    <div style="margin-top:20px"><h2 style="margin-bottom:12px">Top 5 kasutatumad klassid</h2>
      <table><thead><tr><th>Klass</th><th>Broneeringuid</th><th>Tunde kokku</th></tr></thead><tbody id="top5"></tbody></table>
    </div>
  </div>

  <div id="page-classrooms" class="card hidden">
    <h2>Klassid</h2>
    <table><thead><tr><th>Nimi</th><th>Maht</th><th>Asukoht</th><th>Varustus</th></tr></thead><tbody id="classBody"></tbody></table>
  </div>
</main>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>
<script>
let chartInst = null, editId = null;

function showPage(p) {
  document.querySelectorAll('[id^="page-"]').forEach(e => e.classList.add('hidden'));
  document.getElementById('page-'+p).classList.remove('hidden');
  document.querySelectorAll('nav button').forEach((b,i) => b.classList.toggle('active', ['bookings','add','stats','classrooms'][i]===p));
  if(p==='bookings') loadBookings();
  if(p==='add') loadDropdowns();
  if(p==='stats') loadStats();
  if(p==='classrooms') loadClassrooms();
}

function msg(t, ok=true) {
  const el=document.getElementById('msgBox');
  el.textContent=t; el.className=ok?'msg-ok':'msg-err';
  el.classList.remove('hidden');
  setTimeout(()=>el.classList.add('hidden'),3000);
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
async function loadBookings() {
  const r = await fetch('/api/bookings').then(r=>r.json());
  document.getElementById('bookingBody').innerHTML = r.map(b=>\`
    <tr><td>\${escapeHTML(b.id)}</td><td>\${escapeHTML(b.classroom_name)}</td><td>\${escapeHTML(b.user_name)}</td><td>\${escapeHTML(b.type_name)}</td>
    <td>\${escapeHTML(b.booking_date)}</td><td>\${escapeHTML(b.start_time)}–\${escapeHTML(b.end_time)}</td><td>\${escapeHTML(b.participant_count)}</td>
    <td><span class="badge badge-\${escapeHTML(b.status)}">\${escapeHTML(b.status)}</span></td>
    <td style="display:flex;gap:4px">
      <button class="btn btn-edit" onclick="editBooking(\${Number.isSafeInteger(b.id) ? b.id : 0})">Muuda</button>
      <button class="btn btn-danger" onclick="delBooking(\${Number.isSafeInteger(b.id) ? b.id : 0})">Kustuta</button>
    </td></tr>\`).join('');
}

async function loadDropdowns() {
  const [cls, usr, typ] = await Promise.all([
    fetch('/api/classrooms').then(r=>r.json()),
    fetch('/api/users').then(r=>r.json()),
    fetch('/api/types').then(r=>r.json()),
  ]);
  document.getElementById('f_classroom').innerHTML = cls.map(c=>\`<option value="\${escapeHTML(c.id)}">\${escapeHTML(c.name)} (maht \${escapeHTML(c.capacity)})</option>\`).join('');
  document.getElementById('f_user').innerHTML = usr.map(u=>\`<option value="\${escapeHTML(u.id)}">\${escapeHTML(u.name)} (\${escapeHTML(u.type)})</option>\`).join('');
  document.getElementById('f_type').innerHTML = '<option value="">— vali tüüp —</option>'+typ.map(t=>\`<option value="\${escapeHTML(t.id)}">\${escapeHTML(t.name)}</option>\`).join('');
}

async function editBooking(id) {
  editId = id;
  await loadDropdowns();
  const b = await fetch('/api/bookings/'+id).then(r=>r.json());
  document.getElementById('formTitle').textContent = 'Muuda broneeringut #'+id;
  document.getElementById('f_classroom').value = b.classroom_id;
  document.getElementById('f_user').value = b.user_group_id;
  document.getElementById('f_type').value = b.lesson_type_id||'';
  document.getElementById('f_date').value = b.booking_date;
  document.getElementById('f_start').value = b.start_time;
  document.getElementById('f_end').value = b.end_time;
  document.getElementById('f_count').value = b.participant_count;
  document.getElementById('f_status').value = b.status;
  document.getElementById('f_notes').value = b.notes||'';
  showPage('add');
}

async function saveBooking() {
  const data = {
    classroom_id: +document.getElementById('f_classroom').value,
    user_group_id: +document.getElementById('f_user').value,
    lesson_type_id: +document.getElementById('f_type').value||null,
    booking_date: document.getElementById('f_date').value,
    start_time: document.getElementById('f_start').value,
    end_time: document.getElementById('f_end').value,
    participant_count: +document.getElementById('f_count').value,
    status: document.getElementById('f_status').value,
    notes: document.getElementById('f_notes').value,
  };
  if(!data.booking_date||!data.start_time||!data.end_time){msg('Täida kõik kohustuslikud väljad!',false);return;}
  const url = editId ? '/api/bookings/'+editId : '/api/bookings';
  const method = editId ? 'PUT' : 'POST';
  const res = await fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  if(res.ok){msg(editId?'Broneering uuendatud':'Broneering lisatud');editId=null;document.getElementById('formTitle').textContent='Lisa uus broneering';showPage('bookings');}
  else{const e=await res.json();msg('Viga: '+(e.error||'?'),false);}
}

async function delBooking(id) {
  if(!confirm('Kustuta broneering #'+id+'?')) return;
  await fetch('/api/bookings/'+id,{method:'DELETE'});
  msg('Kustutatud'); loadBookings();
}

async function loadStats() {
  const s = await fetch('/api/stats').then(r=>r.json());
  document.getElementById('statBoxes').innerHTML = \`
    <div class="stat-box"><div class="stat-num">\${s.total}</div><div class="stat-lbl">Broneeringuid kokku</div></div>
    <div class="stat-box"><div class="stat-num">\${s.active}</div><div class="stat-lbl">Aktiivseid</div></div>
    <div class="stat-box"><div class="stat-num">\${s.classrooms}</div><div class="stat-lbl">Klasse</div></div>
    <div class="stat-box"><div class="stat-num">\${s.users}</div><div class="stat-lbl">Kasutajaid/gruppe</div></div>\`;
  document.getElementById('top5').innerHTML = s.top5.map(r=>\`<tr><td>\${escapeHTML(r.name)}</td><td>\${escapeHTML(r.cnt)}</td><td>\${escapeHTML(r.hours)}h</td></tr>\`).join('');
  if(chartInst) chartInst.destroy();
  chartInst = new Chart(document.getElementById('chart').getContext('2d'),{
    type:'bar',
    data:{labels:s.top5.map(r=>r.name),datasets:[{label:'Tunnid',data:s.top5.map(r=>r.hours),backgroundColor:'#1a3a6b',borderRadius:6}]},
    options:{plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}
  });
}

async function loadClassrooms() {
  const r = await fetch('/api/classrooms').then(r=>r.json());
  document.getElementById('classBody').innerHTML = r.map(c=>\`<tr><td>\${escapeHTML(c.name)}</td><td>\${escapeHTML(c.capacity)}</td><td>\${escapeHTML(c.location)}</td><td>\${escapeHTML(c.equipment)}</td></tr>\`).join('');
}

showPage('bookings');
</script>
</body>
</html>`;

// ── API ─────────────────────────────────────────────────────
app.get('/', (req, res) => res.send(HTML));

app.get('/api/bookings', (req, res) => {
  const result = DB.bookings.map(b => ({
    ...b,
    classroom_name: DB.classrooms.find(c => c.id === b.classroom_id)?.name || '?',
    user_name:      DB.users.find(u => u.id === b.user_group_id)?.name || '?',
    type_name:      DB.lesson_types.find(t => t.id === b.lesson_type_id)?.name || null,
  })).sort((a,b) => b.booking_date.localeCompare(a.booking_date));
  res.json(result);
});

app.get('/api/bookings/:id', (req, res) => {
  const b = DB.bookings.find(b => b.id === +req.params.id);
  b ? res.json(b) : res.status(404).json({ error: 'Ei leitud' });
});

const bookingSchema = z.object({
  classroom_id: z.number().int().positive(),
  user_group_id: z.number().int().positive(),
  lesson_type_id: z.number().int().positive().nullable(),
  booking_date: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  participant_count: z.number().int().positive(),
  status: z.enum(['active','cancelled','completed']),
  notes: z.string().max(2000).default('')
});

function validateBooking(body) {
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) return null;
  body = parsed.data;
  const { classroom_id, user_group_id, lesson_type_id, booking_date, start_time, end_time, participant_count, status, notes = '' } = body;
  if (!Number.isSafeInteger(classroom_id) || !DB.classrooms.some(c => c.id === classroom_id) ||
      !Number.isSafeInteger(user_group_id) || !DB.users.some(u => u.id === user_group_id) ||
      (lesson_type_id !== null && !DB.lesson_types.some(t => t.id === lesson_type_id)) ||
      typeof booking_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(booking_date) ||
      !Number.isFinite(Date.parse(booking_date)) || new Date(booking_date).toISOString().slice(0,10) !== booking_date ||
      typeof start_time !== 'string' || typeof end_time !== 'string' ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(start_time) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(end_time) || end_time <= start_time ||
      !Number.isSafeInteger(participant_count) || participant_count < 1 ||
      !['active','cancelled','completed'].includes(status) || typeof notes !== 'string' || notes.length > 2000) return null;
  return {classroom_id,user_group_id,lesson_type_id,booking_date,start_time,end_time,participant_count,status,notes};
}

app.post('/api/bookings', (req, res) => {
  const validated = validateBooking(req.body);
  if (!validated) return res.status(400).json({ error: 'Vigased broneeringu andmed' });
  const b = { ...validated, id: DB.nextId.bookings++ };
  DB.bookings.push(b);
  saveDB();
  res.json({ id: b.id });
});

app.put('/api/bookings/:id', (req, res) => {
  const idx = DB.bookings.findIndex(b => b.id === +req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Ei leitud' });
  const validated = validateBooking(req.body);
  if (!validated) return res.status(400).json({ error: 'Vigased broneeringu andmed' });
  DB.bookings[idx] = { ...validated, id: +req.params.id };
  saveDB();
  res.json({ ok: true });
});

app.delete('/api/bookings/:id', (req, res) => {
  DB.bookings = DB.bookings.filter(b => b.id !== +req.params.id);
  saveDB();
  res.json({ ok: true });
});

app.get('/api/classrooms', (req, res) => res.json(DB.classrooms));
app.get('/api/users',      (req, res) => res.json(DB.users));
app.get('/api/types',      (req, res) => res.json(DB.lesson_types));

app.get('/api/stats', (req, res) => {
  const top5 = [...DB.classrooms].map(c => {
    const bs = DB.bookings.filter(b => b.classroom_id === c.id);
    const hours = bs.reduce((sum, b) => {
      const [sh, sm] = b.start_time.split(':').map(Number);
      const [eh, em] = b.end_time.split(':').map(Number);
      return sum + (eh * 60 + em - sh * 60 - sm) / 60;
    }, 0);
    return { name: c.name, cnt: bs.length, hours: Math.round(hours * 10) / 10 };
  }).sort((a, b) => b.cnt - a.cnt).slice(0, 5);

  res.json({
    total:      DB.bookings.length,
    active:     DB.bookings.filter(b => b.status === 'active').length,
    classrooms: DB.classrooms.length,
    users:      DB.users.length,
    top5,
  });
});

if (require.main === module) app.listen(PORT, () => console.log(`Rakendus käivitatud: http://localhost:${PORT}`));
module.exports = app;
