# Arvutiklasside broneerimissüsteem

**Grupp:** TAK25 | **Tehnoloogia:** Node.js + Express + SQLite (better-sqlite3)

## Käivitamine

```bash
cd app
npm install
node app.js
# või Bun-iga:
bun install && bun app.js
```

Ava brauser: **http://localhost:3000**

## Funktsionaalsus

| Leht | Kirjeldus |
|------|-----------|
| **Broneeringud** | Kõik broneeringud tabelina; muutmine ja kustutamine |
| **Lisa uus** | Uue broneeringu lisamise vorm valideerimisega |
| **Statistika** | Koondnäitajad, kasutuse graafik, top-5 klassid |
| **Klassid** | Klassid koos mahu ja asukohaga |

## Ekraanipildid

> Käivita rakendus ja tee ekraanipilt igalt leheküljelt.

## Andmebaas

SQLite andmefail luuakse automaatselt: `app/arvutiklass.db`  
Tabelid: `classroom`, `user_or_group`, `lesson_type`, `booking`

## API lõpp-punktid

| Meetod | URL | Kirjeldus |
|--------|-----|-----------|
| GET | `/api/bookings` | Kõik broneeringud |
| GET | `/api/bookings/:id` | Üks broneering |
| POST | `/api/bookings` | Lisa uus broneering |
| PUT | `/api/bookings/:id` | Uuenda broneeringut |
| DELETE | `/api/bookings/:id` | Kustuta broneering |
| GET | `/api/stats` | Statistika (top5, nädalane kasutus) |
| GET | `/api/classrooms` | Klassid |
| GET | `/api/users` | Kasutajad/grupid |
