# S.A.G Decor – website + backend

## Nisja në kompjuterin tënd
1. Instalo Node.js 18+ (nodejs.org)
2. Në këtë folder: `npm install`
3. Krijo skedarin `.env` nga `.env.example` dhe vendos ADMIN_PASSWORD
4. `ADMIN_PASSWORD=fjalekalimi-yt npm start` (Windows PowerShell: `$env:ADMIN_PASSWORD="fjalekalimi-yt"; npm start`)
5. Hap http://localhost:3000 (faqja) dhe http://localhost:3000/admin (kërkesat)

## Online
Përdor Railway ose një VPS (Render falas e fshin databazën kur rindizet).
- Build: `npm install`  |  Start: `npm start`
- Variablat: ADMIN_PASSWORD (detyrueshëm), ADMIN_USER, SMTP_* + NOTIFY_EMAIL për email
- Shto një Volume/Disk dhe vendos `DB_PATH=/data/data.db` që kërkesat të mos humbin.
- Lidh domain-in (p.sh. sagdecor.al) nga paneli i hostingut.
