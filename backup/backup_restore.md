# Varundamine ja taastamine (backup_restore.md)

## 5.1 Varundamine

### MariaDB/MySQL

```bash
# Varukoopia loomine
mysqldump -u root -p arvutiklass > backup/backup_2025-01-20.sql

# Kompressitud varukoopia
mysqldump -u root -p arvutiklass | gzip > backup/backup_2025-01-20.sql.gz
```

### SQLite (rakenduse dev-andmebaas)

```bash
# Lihtne koopia
cp app/arvutiklass.db backup/backup_2025-01-20.db

# Või SQLite dump-käsuga
sqlite3 app/arvutiklass.db .dump > backup/backup_2025-01-20.sql
```

**Loodud fail:** `backup/backup_2025-01-20.sql`

---

## 5.2 Taastamine

### Samm 1 — enne taastamist (kontroll)

```sql
-- Mitme broneeringu on andmebaasis?
SELECT COUNT(*) AS broneeringuid FROM booking;
-- Tulemus: 8
```

### Samm 2 — andmete kustutamine (kontrollitud test)

```sql
-- Kustutame kõik broneeringud (tabeli struktuur jääb alles)
DELETE FROM booking WHERE booking_date >= '2025-01-15';
-- Kustutatud: 5 rida

-- Kontroll pärast kustutamist:
SELECT COUNT(*) AS broneeringuid FROM booking;
-- Tulemus: 3  ← andmed on kadunud
```

### Samm 3 — taastamine backupist

```bash
# MariaDB/MySQL
mysql -u root -p arvutiklass < backup/backup_2025-01-20.sql

# SQLite
sqlite3 app/arvutiklass.db < backup/backup_2025-01-20.sql
# või faili koopia:
cp backup/backup_2025-01-20.db app/arvutiklass.db
```

### Samm 4 — tõendus (pärast taastamist)

```sql
-- Kontroll pärast taastamist:
SELECT COUNT(*) AS broneeringuid FROM booking;
-- Tulemus: 8  ← kõik andmed tagasi ✓

-- Detailne kontroll:
SELECT id, booking_date, classroom_id, status FROM booking ORDER BY id;
-- Tulemus:
-- 1 | 2025-01-13 | 1 | completed
-- 2 | 2025-01-13 | 2 | completed
-- 3 | 2025-01-14 | 3 | active
-- 4 | 2025-01-15 | 4 | active   ← taastatud
-- 5 | 2025-01-15 | 5 | active   ← taastatud
-- 6 | 2025-01-16 | 1 | active   ← taastatud
-- 7 | 2025-01-16 | 2 | active   ← taastatud
-- 8 | 2025-01-20 | 1 | active   ← taastatud
```

## Kokkuvõte

| Samm | Tegevus | Tulemus |
|------|---------|---------|
| Enne | `COUNT(*) FROM booking` | 8 rida |
| Kustutamine | `DELETE WHERE booking_date >= '2025-01-15'` | 3 rida alles |
| Taastamine | `mysql < backup_2025-01-20.sql` | — |
| Pärast | `COUNT(*) FROM booking` | 8 rida ✓ |

**Tõendus:** Kõik 8 broneeringut on pärast taastamist tagasi, sealhulgas 5 kustutatud rida kuupäevadega 2025-01-15 kuni 2025-01-20.
