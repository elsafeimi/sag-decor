const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 3000;
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) { console.error('Vendos ADMIN_PASSWORD në variablat e mjedisit.'); process.exit(1); }

const db = new DatabaseSync(process.env.DB_PATH || path.join(__dirname, 'data.db'));
db.exec(`CREATE TABLE IF NOT EXISTS requests(
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, phone TEXT, service TEXT,
  area REAL, message TEXT, status TEXT DEFAULT 'e re', created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);

let mailer = null;
if (process.env.SMTP_HOST && process.env.NOTIFY_EMAIL) {
  const port = Number(process.env.SMTP_PORT || 587);
  mailer = require('nodemailer').createTransport({
    host: process.env.SMTP_HOST, port, secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

const SERVICES = ['Panele dekorative', 'Panele akustike', 'Panele WPC', 'PVC pllaka fleksibël 3D', 'Nuk jam i sigurt'];
const STATUSES = ['e re', 'kontaktuar', 'mbyllur'];
const hash = s => crypto.createHash('sha256').update(String(s)).digest();
const same = (a, b) => crypto.timingSafeEqual(hash(a), hash(b));

function auth(req, res, next) {
  const raw = Buffer.from((req.headers.authorization || '').split(' ')[1] || '', 'base64').toString();
  const i = raw.indexOf(':');
  if (i > -1 && same(raw.slice(0, i), ADMIN_USER) && same(raw.slice(i + 1), ADMIN_PASSWORD)) return next();
  res.set('WWW-Authenticate', 'Basic realm="S.A.G Decor Admin"').status(401).send('Duhet hyrje.');
}

const hits = new Map(); // kufizim i thjeshtë: 5 kërkesa për IP në 10 minuta
function limit(req, res, next) {
  const now = Date.now(), list = (hits.get(req.ip) || []).filter(t => now - t < 600000);
  if (list.length >= 5) return res.status(429).json({ error: 'Shumë kërkesa. Provoni pas pak minutash.' });
  list.push(now); hits.set(req.ip, list); next();
}

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '10kb' }));

app.post('/api/quote', limit, (req, res) => {
  const b = req.body || {};
  if (b.w) return res.json({ ok: true }); // honeypot kundër botëve
  const name = String(b.name || '').trim(), phone = String(b.phone || '').trim();
  const message = String(b.message || '').trim().slice(0, 1000);
  const area = b.area === '' || b.area == null ? null : Number(b.area);
  if (name.length < 2 || name.length > 80) return res.status(400).json({ error: 'Shkruani emrin.' });
  if (!/^[+\d\s()-]{6,20}$/.test(phone)) return res.status(400).json({ error: 'Numri i telefonit nuk është i vlefshëm.' });
  if (!SERVICES.includes(b.service)) return res.status(400).json({ error: 'Zgjidhni shërbimin.' });
  if (area !== null && !(area > 0 && area < 10000)) return res.status(400).json({ error: 'Sipërfaqja nuk është e vlefshme.' });

  db.prepare('INSERT INTO requests(name,phone,service,area,message) VALUES(?,?,?,?,?)')
    .run(name, phone, b.service, area, message);
  if (mailer) mailer.sendMail({
    from: process.env.SMTP_USER, to: process.env.NOTIFY_EMAIL,
    subject: `Kërkesë e re nga ${name}`,
    text: `Emri: ${name}\nTelefoni: ${phone}\nShërbimi: ${b.service}\nSipërfaqja: ${area ?? '-'} m²\nMesazhi: ${message || '-'}`
  }).catch(e => console.error('Email nuk u dërgua:', e.message));
  res.json({ ok: true });
});

app.get('/api/admin/requests', auth, (req, res) =>
  res.json(db.prepare('SELECT * FROM requests ORDER BY id DESC').all()));
app.patch('/api/admin/requests/:id', auth, express.json(), (req, res) => {
  if (!STATUSES.includes(req.body.status)) return res.status(400).json({ error: 'Status i pavlefshëm' });
  db.prepare('UPDATE requests SET status=? WHERE id=?').run(req.body.status, req.params.id);
  res.json({ ok: true });
});
app.delete('/api/admin/requests/:id', auth, (req, res) => {
  db.prepare('DELETE FROM requests WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

app.get('/admin', auth, (req, res) => res.sendFile(path.join(__dirname, 'private', 'admin.html')));
app.use(express.static(path.join(__dirname, 'public')));
app.listen(PORT, () => console.log(`S.A.G Decor në http://localhost:${PORT}  |  Admin: /admin`));
