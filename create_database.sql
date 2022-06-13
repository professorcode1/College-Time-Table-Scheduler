DROP DATABASE IF EXISTS `collegeScheduler`;
CREATE DATABASE `collegeScheduler`;
USE `collegeScheduler`;

SET NAMES utf8 ;
SET character_set_client = utf8mb4 ;

CREATE TABLE `university`(
    `university_id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `periods_per_day`  TINYINT NOT NULL,
    `days_per_week`  TINYINT NOT NULL,
    PRIMARY KEY (`university_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `room`(
    `room_id` INT NOT NULL AUTO_INCREMENT,
    `university_id` INT NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `capacity`  SMALLINT NOT NULL,
    PRIMARY KEY (`room_id`),
    KEY `fk_university_id_idx` (`university_id`),
    CONSTRAINT `fk_university_id` FOREIGN KEY (`university_id`) REFERENCES `university` (`university_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `room_ban_times`(
    `room_id` INT NOT NULL,
    `ban_time` INT NOT NULL ,
    PRIMARY KEY(`room_id`, `ban_time`),
    KEY `fk_room_id_idx` (`room_id`),
    CONSTRAINT `fk_room_id` FOREIGN KEY (`room_id`) REFERENCES `room` (`room_id`) ON DELETE CASCADE
)ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `group`(
    `group_id` INT NOT NULL AUTO_INCREMENT,
    `university_id` INT NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `number_of_students`  SMALLINT NOT NULL,
    PRIMARY KEY (`group_id`),
    KEY `fk_university_id_idx` (`university_id`),
    CONSTRAINT `fk_university_id_1` FOREIGN KEY (`university_id`) REFERENCES `university` (`university_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `group_ban_times`(
    `group_id` INT NOT NULL,
    `ban_time` INT NOT NULL ,
    PRIMARY KEY(`group_id`, `ban_time`),
    KEY `fk_group_id_idx` (`group_id`),
    CONSTRAINT `fk_group_id` FOREIGN KEY (`group_id`) REFERENCES `group` (`group_id`) ON DELETE CASCADE
)ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `professor`(
    `professor_id` INT NOT NULL AUTO_INCREMENT,
    `university_id` INT NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    PRIMARY KEY (`professor_id`),
    KEY `fk_university_id_idx` (`university_id`),
    CONSTRAINT `fk_university_id_2` FOREIGN KEY (`university_id`) REFERENCES `university` (`university_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `professor_ban_times`(
    `professor_id` INT NOT NULL,
    `ban_time` INT NOT NULL ,
    PRIMARY KEY(`professor_id`, `ban_time`),
    KEY `fk_professor_id_idx` (`professor_id`),
    CONSTRAINT `fk_professor_id` FOREIGN KEY (`professor_id`) REFERENCES `professor` (`professor_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `course`(
    `course_id` INT NOT NULL AUTO_INCREMENT,
    `university_id` INT NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    PRIMARY KEY (`course_id`),
    KEY `fk_university_id_idx` (`university_id`),
    CONSTRAINT `fk_university_id_3` FOREIGN KEY (`university_id`) REFERENCES `university` (`university_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `course_professor`(
    `course_id` INT NOT NULL ,
    `professor_id` INT NOT NULL,
    PRIMARY KEY (`course_id`, `professor_id`),
    KEY `fk_course_id_idx` (`course_id`),
    KEY `fk_professor_id_idx` (`professor_id`),
    CONSTRAINT `fk_course_id_1` FOREIGN KEY (`course_id`) REFERENCES `course` (`course_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_professor_id_1` FOREIGN KEY (`professor_id`) REFERENCES `professor` (`professor_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `course_group`(
    `course_id` INT NOT NULL ,
    `group_id` INT NOT NULL,
    PRIMARY KEY (`course_id`, `group_id`),
    KEY `fk_course_id_idx` (`course_id`),
    KEY `fk_group_id_idx` (`group_id`),
    CONSTRAINT `fk_course_id_2` FOREIGN KEY (`course_id`) REFERENCES `course` (`course_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_group_id_1` FOREIGN KEY (`group_id`) REFERENCES `group` (`group_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `period`(
    `period_id` INT NOT NULL AUTO_INCREMENT,
    `course_id` INT NOT NULL,
    `professor_id` INT NOT NULL,
    `room_id` INT NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `length`  TINYINT NOT NULL,
    `frequency`  TINYINT NOT NULL,
    `set_time`  TINYINT DEFAULT NULL,
    `color`  TINYINT DEFAULT NULL,
    PRIMARY KEY (`period_id`),
    KEY `fk_course_id_idx` (`course_id`),
    KEY `fk_professor_id_idx` (`professor_id`),
    KEY `fk_room_id_idx` (`room_id`),
    CONSTRAINT `fk_professor_id_2` FOREIGN KEY (`professor_id`) REFERENCES `professor` (`professor_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_course_id_3` FOREIGN KEY (`course_id`) REFERENCES `course` (`course_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_room_id_1` FOREIGN KEY (`room_id`) REFERENCES `room` (`room_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `period_group`(
    `group_id` INT NOT NULL,
    `period_id` INT NOT NULL,
    PRIMARY KEY (`group_id`, `period_id`),
    KEY `fk_group_id_idx` (`group_id`),
    KEY `fk_period_id_idx` (`period_id`),
    CONSTRAINT `fk_group_id_2` FOREIGN KEY (`group_id`) REFERENCES `group` (`group_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_period_id` FOREIGN KEY (`period_id`) REFERENCES `period` (`period_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `period_ban_times`(
    `period_id` INT NOT NULL,
    `ban_time` INT NOT NULL ,
    PRIMARY KEY(`period_id`, `ban_time`),
    KEY `fk_period_id_idx` (`period_id`),
    CONSTRAINT `fk_period_id_1` FOREIGN KEY (`period_id`) REFERENCES `period` (`period_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;