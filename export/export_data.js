#!/usr/bin/env node
// export_data.js — Ekspordib andmed CSV ja JSON formaati
// Käivita: node export_data.js

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'app', 'arvutiklass.db');
const db = new Database(DB_PATH, { readonly: true });

// ── 1. CSV eksport — broneeringute koondtabel ───────────────
console.log('\n=== 1. Exportin bookings_summary.csv ===');
const bookings = db.prepare(`
  SELECT
    b.booking_date AS kuupäev,
    c.name AS klass,
    u.name AS kasutaja,
    COALESCE(lt.name, '—') AS tüüp,
    b.start_time AS algus,
    b.end_time AS lõpp,
    b.participant_count AS osalejaid,
    b.status AS staatus
  FROM booking b
  JOIN classroom c ON c.id = b.classroom_id
  JOIN user_or_group u ON u.id = b.user_group_id
  LEFT JOIN lesson_type lt ON lt.id = b.lesson_type_id
  ORDER BY b.booking_date, b.start_time
`).all();

const csvHeader = Object.keys(bookings[0]).join(',');
const csvRows = bookings.map(r =>
  Object.values(r).map(v => `"${v}"`).join(',')
);
const csvContent = [csvHeader, ...csvRows].join('\n');
fs.writeFileSync(path.join(__dirname, 'bookings_summary.csv'), csvContent, 'utf8');
console.log(`Kirjutatud ${bookings.length} rida → bookings_summary.csv`);

// ── 2. JSON eksport — top 5 klassid ────────────────────────
console.log('\n=== 2. Exportin top5_classes.json ===');
const top5 = db.prepare(`
  SELECT
    ROW_NUMBER() OVER (ORDER BY COUNT(b.id) DESC) AS rank,
    c.name AS classroom,
    COUNT(b.id) AS bookings_count,
    ROUND(SUM(
      (CAST(substr(b.end_time,1,2) AS INTEGER) * 60 + CAST(substr(b.end_time,4,2) AS INTEGER)) -
      (CAST(substr(b.start_time,1,2) AS INTEGER) * 60 + CAST(substr(b.start_time,4,2) AS INTEGER))
    ) / 60.0, 1) AS total_hours,
    c.location
  FROM booking b
  JOIN classroom c ON c.id = b.classroom_id
  GROUP BY c.id
  ORDER BY bookings_count DESC
  LIMIT 5
`).all();

fs.writeFileSync(
  path.join(__dirname, 'top5_classes.json'),
  JSON.stringify(top5, null, 2),
  'utf8'
);
console.log(`Kirjutatud ${top5.length} klassi → top5_classes.json`);

console.log('\n✓ Eksport lõpetatud!');
db.close();
