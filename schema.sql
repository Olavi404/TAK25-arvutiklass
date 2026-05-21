-- ============================================================
-- Arvutiklasside kasutuse andmebaas
-- Grupp: TAK25
-- ============================================================

CREATE DATABASE IF NOT EXISTS arvutiklass CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE arvutiklass;

-- ------------------------------------------------------------
-- 1. lesson_type (lookup-tabel tüüpide jaoks)
-- ------------------------------------------------------------
CREATE TABLE lesson_type (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(50)  NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- ------------------------------------------------------------
-- 2. classroom (arvutiklass)
-- ------------------------------------------------------------
CREATE TABLE classroom (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(50)  NOT NULL UNIQUE,
    capacity    INT          NOT NULL,
    location    VARCHAR(100),
    equipment   VARCHAR(255),
    CONSTRAINT chk_capacity CHECK (capacity > 0)
);

-- ------------------------------------------------------------
-- 3. user_or_group (õpetaja/grupp)
-- ------------------------------------------------------------
CREATE TABLE user_or_group (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    type        ENUM('teacher','group','external') NOT NULL DEFAULT 'teacher',
    email       VARCHAR(150) UNIQUE,
    department  VARCHAR(100)
);

-- ------------------------------------------------------------
-- 4. booking (broneering)
-- ------------------------------------------------------------
CREATE TABLE booking (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    classroom_id     INT  NOT NULL,
    user_group_id    INT  NOT NULL,
    lesson_type_id   INT,
    booking_date     DATE NOT NULL,
    start_time       TIME NOT NULL,
    end_time         TIME NOT NULL,
    participant_count INT NOT NULL DEFAULT 1,
    status           ENUM('active','cancelled','completed') NOT NULL DEFAULT 'active',
    notes            TEXT,

    CONSTRAINT fk_booking_classroom   FOREIGN KEY (classroom_id)   REFERENCES classroom(id),
    CONSTRAINT fk_booking_user        FOREIGN KEY (user_group_id)  REFERENCES user_or_group(id),
    CONSTRAINT fk_booking_lessontype  FOREIGN KEY (lesson_type_id) REFERENCES lesson_type(id),

    -- Ärireeglid
    CONSTRAINT chk_time_order        CHECK (end_time > start_time),
    CONSTRAINT chk_participants      CHECK (participant_count >= 0)
);

-- ------------------------------------------------------------
-- Indeksid jõudluse parandamiseks
-- ------------------------------------------------------------
CREATE INDEX idx_booking_date       ON booking(booking_date);
CREATE INDEX idx_booking_classroom  ON booking(classroom_id);
CREATE INDEX idx_booking_user       ON booking(user_group_id);

-- ------------------------------------------------------------
-- Näidisandmed
-- ------------------------------------------------------------
INSERT INTO lesson_type (name, description) VALUES
  ('Loeng',       'Õpetaja-juhitud loeng'),
  ('Praktikum',   'Iseseisvad harjutused arvutis'),
  ('Eksam',       'Kirjalik või arvutieksam'),
  ('Konsultatsioon', 'Individuaalne nõustamine');

INSERT INTO classroom (name, capacity, location, equipment) VALUES
  ('A101', 30, 'A-korpus, 1. korrus', 'PC x30, projektor, tahvel'),
  ('A102', 25, 'A-korpus, 1. korrus', 'PC x25, projektor'),
  ('B201', 20, 'B-korpus, 2. korrus', 'PC x20, interaktiivne tahvel'),
  ('B202', 35, 'B-korpus, 2. korrus', 'PC x35, projektor x2'),
  ('C301', 15, 'C-korpus, 3. korrus', 'MacBook x15, projektor');

INSERT INTO user_or_group (name, type, email, department) VALUES
  ('Mari Mägi',    'teacher', 'mari.magi@kool.ee',    'Infotehnoloogia'),
  ('Jüri Jõgi',    'teacher', 'jyri.jogi@kool.ee',    'Matemaatika'),
  ('TAK25',        'group',   'tak25@kool.ee',         NULL),
  ('TAR24',        'group',   'tar24@kool.ee',         NULL),
  ('Peeter Pärn',  'teacher', 'peeter.parn@kool.ee',  'Infotehnoloogia');

INSERT INTO booking (classroom_id, user_group_id, lesson_type_id, booking_date, start_time, end_time, participant_count, status) VALUES
  (1, 3, 2, '2025-01-13', '08:00', '09:30', 28, 'completed'),
  (2, 4, 1, '2025-01-13', '10:00', '11:30', 22, 'completed'),
  (3, 1, 2, '2025-01-14', '12:00', '13:30', 18, 'active'),
  (4, 2, 3, '2025-01-15', '09:00', '11:00', 30, 'active'),
  (5, 5, 4, '2025-01-15', '13:00', '14:00',  5, 'active'),
  (1, 4, 1, '2025-01-16', '08:00', '09:30', 25, 'active'),
  (2, 3, 2, '2025-01-16', '10:00', '11:30', 20, 'active'),
  (1, 1, 2, '2025-01-20', '08:00', '09:30', 28, 'active');
