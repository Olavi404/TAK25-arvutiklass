-- ============================================================
-- Varukoopia: backup_2025-01-20.sql
-- Loodud: 2025-01-20
-- Andmebaas: arvutiklass
-- Tööriist: mysqldump (MariaDB)
-- Käsk: mysqldump -u root -p arvutiklass > backup/backup_2025-01-20.sql
-- ============================================================

SET FOREIGN_KEY_CHECKS=0;

-- ── lesson_type ─────────────────────────────────────────────
DROP TABLE IF EXISTS `lesson_type`;
CREATE TABLE `lesson_type` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `lesson_type` VALUES
(1,'Loeng','Õpetaja-juhitud loeng'),
(2,'Praktikum','Iseseisvad harjutused arvutis'),
(3,'Eksam','Kirjalik või arvutieksam'),
(4,'Konsultatsioon','Individuaalne nõustamine');

-- ── classroom ───────────────────────────────────────────────
DROP TABLE IF EXISTS `classroom`;
CREATE TABLE `classroom` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `capacity` int(11) NOT NULL,
  `location` varchar(100) DEFAULT NULL,
  `equipment` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  CONSTRAINT `chk_capacity` CHECK (`capacity` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `classroom` VALUES
(1,'A101',30,'A-korpus, 1. korrus','PC x30, projektor, tahvel'),
(2,'A102',25,'A-korpus, 1. korrus','PC x25, projektor'),
(3,'B201',20,'B-korpus, 2. korrus','PC x20, interaktiivne tahvel'),
(4,'B202',35,'B-korpus, 2. korrus','PC x35, projektor x2'),
(5,'C301',15,'C-korpus, 3. korrus','MacBook x15, projektor');

-- ── user_or_group ───────────────────────────────────────────
DROP TABLE IF EXISTS `user_or_group`;
CREATE TABLE `user_or_group` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `type` enum('teacher','group','external') NOT NULL DEFAULT 'teacher',
  `email` varchar(150) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `user_or_group` VALUES
(1,'Mari Mägi','teacher','mari.magi@kool.ee','Infotehnoloogia'),
(2,'Jüri Jõgi','teacher','jyri.jogi@kool.ee','Matemaatika'),
(3,'TAK25','group','tak25@kool.ee',NULL),
(4,'TAR24','group','tar24@kool.ee',NULL),
(5,'Peeter Pärn','teacher','peeter.parn@kool.ee','Infotehnoloogia');

-- ── booking ─────────────────────────────────────────────────
DROP TABLE IF EXISTS `booking`;
CREATE TABLE `booking` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `classroom_id` int(11) NOT NULL,
  `user_group_id` int(11) NOT NULL,
  `lesson_type_id` int(11) DEFAULT NULL,
  `booking_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `participant_count` int(11) NOT NULL DEFAULT 1,
  `status` enum('active','cancelled','completed') NOT NULL DEFAULT 'active',
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_booking_classroom`  FOREIGN KEY (`classroom_id`)  REFERENCES `classroom`(`id`),
  CONSTRAINT `fk_booking_user`       FOREIGN KEY (`user_group_id`) REFERENCES `user_or_group`(`id`),
  CONSTRAINT `fk_booking_lessontype` FOREIGN KEY (`lesson_type_id`) REFERENCES `lesson_type`(`id`),
  CONSTRAINT `chk_time_order`   CHECK (`end_time` > `start_time`),
  CONSTRAINT `chk_participants` CHECK (`participant_count` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `booking` VALUES
(1,1,3,2,'2025-01-13','08:00:00','09:30:00',28,'completed',NULL),
(2,2,4,1,'2025-01-13','10:00:00','11:30:00',22,'completed',NULL),
(3,3,1,2,'2025-01-14','12:00:00','13:30:00',18,'active',NULL),
(4,4,2,3,'2025-01-15','09:00:00','11:00:00',30,'active',NULL),
(5,5,5,4,'2025-01-15','13:00:00','14:00:00',5,'active',NULL),
(6,1,4,1,'2025-01-16','08:00:00','09:30:00',25,'active',NULL),
(7,2,3,2,'2025-01-16','10:00:00','11:30:00',20,'active',NULL),
(8,1,1,2,'2025-01-20','08:00:00','09:30:00',28,'active',NULL);

SET FOREIGN_KEY_CHECKS=1;

-- ============================================================
-- Varukoopia lõpp
-- ============================================================
