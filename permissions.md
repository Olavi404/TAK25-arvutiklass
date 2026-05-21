# Kasutajate õigused (permissions.md)

## Rollid

| Kasutaja | Roll | Õigused |
|----------|------|---------|
| `arvuti_admin` | Admin | `ALL PRIVILEGES` andmebaasil `arvutiklass.*` |
| `arvuti_viewer` | Vaataja | Ainult `SELECT` kõigil 4 tabelil |

## Kuidas testida (MariaDB/MySQL)

### 1. Käivita skript root-kasutajana

```bash
mysql -u root -p < permissions.sql
```

### 2. Testi admin-kasutajat

```bash
mysql -u arvuti_admin -p arvutiklass
```

```sql
-- Admin saab kirjutada:
INSERT INTO lesson_type(name) VALUES ('Test');
-- Peaks töötama ✓

-- Admin ei saa tabelit kustutada (REVOKE DROP):
DROP TABLE booking;
-- Peaks andma vea ✓
```

### 3. Testi viewer-kasutajat

```bash
mysql -u arvuti_viewer -p arvutiklass
```

```sql
-- Viewer saab lugeda:
SELECT * FROM booking LIMIT 5;
-- Peaks töötama ✓

-- Viewer EI SAA kirjutada:
INSERT INTO booking(classroom_id, user_group_id, booking_date, start_time, end_time)
VALUES (1, 1, '2025-02-01', '08:00', '09:00');
-- Peaks andma: ERROR 1142 (42000): INSERT command denied ✓

-- Viewer EI SAA kustutada:
DELETE FROM booking WHERE id = 1;
-- Peaks andma: ERROR 1142 (42000): DELETE command denied ✓
```

## REVOKE selgitus

`REVOKE DROP ON arvutiklass.* FROM 'arvuti_admin'@'localhost';`

Eemaldame admin-kasutajalt DROP-õiguse, sest tabelite kustutamine peaks olema ainult root-kasutaja privileeg — ka admin ei peaks saama kogemata tabeleid hävitada. See on hea turvapraktika tootmiskeskkonnas.

## SQLite märkus

Rakenduse `app.js` kasutab SQLite-i (better-sqlite3), mis ei toeta andmebaasitasandi kasutajaid. SQLite'i puhul lahendatakse õiguste kontroll **rakenduse tasemel**:
- Viewer-roll: rakendus kontrollib sessiooni enne igat muutmisoperatsiooni
- Admin-roll: kõik operatsioonid lubatud

Täielikuks õiguste testimiseks kasuta MariaDB/MySQL-i koos `permissions.sql` skriptiga.
