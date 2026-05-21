-- ============================================================
-- permissions.sql — Kasutajate ja õiguste haldus
-- Grupp: TAK25
-- ============================================================
-- NB: See skript on mõeldud MariaDB/MySQL jaoks.
--     SQLite ei toeta andmebaasitasandi kasutajaid/õigusi.
-- ============================================================

-- ── 1. Rollide/kasutajate loomine ──────────────────────────

-- Admin — täisõigused
CREATE USER IF NOT EXISTS 'arvuti_admin'@'localhost'
  IDENTIFIED BY 'AdminParool123!';

-- Viewer — ainult lugemine
CREATE USER IF NOT EXISTS 'arvuti_viewer'@'localhost'
  IDENTIFIED BY 'ViewerParool456!';

-- ── 2. Õiguste andmine (GRANT) ─────────────────────────────

-- Admin saab kõik teha arvutiklass andmebaasis
GRANT ALL PRIVILEGES ON arvutiklass.* TO 'arvuti_admin'@'localhost';

-- Viewer saab ainult lugeda kõiki tabeleid
GRANT SELECT ON arvutiklass.classroom     TO 'arvuti_viewer'@'localhost';
GRANT SELECT ON arvutiklass.user_or_group TO 'arvuti_viewer'@'localhost';
GRANT SELECT ON arvutiklass.lesson_type   TO 'arvuti_viewer'@'localhost';
GRANT SELECT ON arvutiklass.booking       TO 'arvuti_viewer'@'localhost';

-- Viewer saab ka vaateid kasutada (kui on loodud)
-- GRANT SELECT ON arvutiklass.v_booking_summary TO 'arvuti_viewer'@'localhost';

-- ── 3. REVOKE näide ────────────────────────────────────────

-- Eemaldame viewerilt DELETE õiguse (kui see oli antud ekslikult)
-- (Selles näites vieweril DELETE ei olnud, aga näide näitab süntaksi)
-- REVOKE DELETE ON arvutiklass.booking FROM 'arvuti_viewer'@'localhost';

-- Näide: eemaldame adminilt DROP-õigus (liigne turvalisus)
REVOKE DROP ON arvutiklass.* FROM 'arvuti_admin'@'localhost';

-- ── 4. Õiguste aktiveerimine ───────────────────────────────
FLUSH PRIVILEGES;

-- ── 5. Kontrollimine ───────────────────────────────────────
-- Näita admini õigused:
SHOW GRANTS FOR 'arvuti_admin'@'localhost';

-- Näita vieweri õigused:
SHOW GRANTS FOR 'arvuti_viewer'@'localhost';
