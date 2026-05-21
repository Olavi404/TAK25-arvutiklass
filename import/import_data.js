#!/usr/bin/env node
// import_data.js — Impordib CSV, JSON ja XML andmeid andmebaasi
// Käivita: node import_data.js

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const { DOMParser } = require('@xmldom/xmldom');

const DB_PATH = path.join(__dirname, '..', 'app', 'arvutiklass.db');
const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

// ── 1. CSV → classroom ──────────────────────────────────────
console.log('\n=== 1. Importin classes.csv → classroom ===');
const csvText = fs.readFileSync(path.join(__dirname, 'classes.csv'), 'utf8');
const csvLines = csvText.trim().split('\n');
const csvHeaders = csvLines[0].split(',');

const insertClassroom = db.prepare(`
  INSERT OR IGNORE INTO classroom (id, name, capacity, location, equipment)
  VALUES (@id, @name, @capacity, @location, @equipment)
`);

const importCSV = db.transaction(() => {
  let count = 0;
  for (let i = 1; i < csvLines.length; i++) {
    // Lihtne CSV parser (arvestab jutumärkidega)
    const vals = csvLines[i].match(/(".*?"|[^,]+)(?=,|$)/g)
      .map(v => v.replace(/^"|"$/g, '').trim());
    const row = {};
    csvHeaders.forEach((h, idx) => { row[h.trim()] = vals[idx] || null; });
    insertClassroom.run(row);
    count++;
  }
  return count;
});

console.log(`Imporditud ${importCSV()} klassiruumi.`);

// ── 2. JSON → user_or_group ────────────────────────────────
console.log('\n=== 2. Importin teachers.json → user_or_group ===');
const jsonData = JSON.parse(fs.readFileSync(path.join(__dirname, 'teachers.json'), 'utf8'));

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO user_or_group (id, name, type, email, department)
  VALUES (@id, @name, @type, @email, @department)
`);

const importJSON = db.transaction(() => {
  jsonData.forEach(u => insertUser.run(u));
  return jsonData.length;
});

console.log(`Imporditud ${importJSON()} kasutajat/gruppi.`);

// ── 3. XML → booking ───────────────────────────────────────
console.log('\n=== 3. Importin bookings.xml → booking ===');
const xmlText = fs.readFileSync(path.join(__dirname, 'bookings.xml'), 'utf8');
const parser = new DOMParser();
const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

const insertBooking = db.prepare(`
  INSERT OR IGNORE INTO booking
    (classroom_id, user_group_id, lesson_type_id, booking_date,
     start_time, end_time, participant_count, status, notes)
  VALUES (@classroom_id, @user_group_id, @lesson_type_id, @booking_date,
          @start_time, @end_time, @participant_count, @status, @notes)
`);

function getVal(el, tag) {
  const node = el.getElementsByTagName(tag)[0];
  return node ? node.textContent.trim() : null;
}

const importXML = db.transaction((doc) => {
  const items = doc.getElementsByTagName('booking');
  let count = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    insertBooking.run({
      classroom_id:     parseInt(getVal(item, 'classroom_id')),
      user_group_id:    parseInt(getVal(item, 'user_group_id')),
      lesson_type_id:   parseInt(getVal(item, 'lesson_type_id')) || null,
      booking_date:     getVal(item, 'booking_date'),
      start_time:       getVal(item, 'start_time'),
      end_time:         getVal(item, 'end_time'),
      participant_count:parseInt(getVal(item, 'participant_count')),
      status:           getVal(item, 'status') || 'active',
      notes:            getVal(item, 'notes') || null,
    });
    count++;
  }
  return count;
});

console.log(`Imporditud ${importXML(xmlDoc)} broneeringut.`);

console.log('\n✓ Import lõpetatud!');
db.close();
