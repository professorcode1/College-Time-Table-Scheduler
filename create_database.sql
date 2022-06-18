DROP DATABASE IF EXISTS `collegeScheduler`;
CREATE DATABASE `collegeScheduler`;
USE `collegeScheduler`;

SET NAMES utf8 ;
SET character_set_client = utf8mb4 ;

CREATE TABLE IF NOT EXISTS `sessions` (
  `session_id` varchar(128) COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) unsigned NOT NULL,
  `data` mediumtext COLLATE utf8mb4_bin,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB;
-- to be used with express-mysql-session

CREATE TABLE `university`(
    `university_id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `password` VARCHAR(5000) NOT NULL,
    `periods_per_day`  TINYINT NOT NULL DEFAULT 1,
    `days_per_week`  TINYINT NOT NULL DEFAULT 1,
    PRIMARY KEY (`university_id`),
    UNIQUE (`email`)
) ENGINE=InnoDB AUTO_INCREMENT = 2 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
INSERT INTO university(`university_id`,`name`, `email`, `password`, `periods_per_day`, `days_per_week`) 
VALUES (1, "Thapar", "raghkum2000@gmail.com", "$2b$10$sEzCeYE0vIN7cdVE3wHRdeUHhKSa.erZU1Th9j3M6n/uibb0Hm/5G", 8, 5);

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
    `name` VARCHAR(50) NOT NULL,
    `course_id` INT NOT NULL,
    `professor_id` INT NOT NULL,
    `room_id` INT NOT NULL,
    `length`  TINYINT NOT NULL,
    `frequency`  TINYINT NOT NULL,
    `set_time`  TINYINT DEFAULT NULL,
    PRIMARY KEY (`period_id`),
    KEY `fk_course_id_idx` (`course_id`),
    KEY `fk_professor_id_idx` (`professor_id`),
    KEY `fk_room_id_idx` (`room_id`),
    CONSTRAINT `fk_professor_id_2` FOREIGN KEY (`professor_id`) REFERENCES `professor` (`professor_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_course_id_3` FOREIGN KEY (`course_id`) REFERENCES `course` (`course_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_room_id_1` FOREIGN KEY (`room_id`) REFERENCES `room` (`room_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `period_group`(
    `period_id` INT NOT NULL,
    `group_id` INT NOT NULL,
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

CREATE TABLE `period_coloring`(
    `period_id` INT NOT NULL,
    `length_value` INT NOT NULL,
    `frequency_value` INT NOT NULL,
    `color` TINYINT NOT NULL,
    PRIMARY KEY(`period_id`, `length_value`,`frequency_value`),
    KEY `fk_period_id_idx` (`period_id`),
    CONSTRAINT `fk_period_id_2` FOREIGN KEY (`period_id`) REFERENCES `period` (`period_id`) ON DELETE CASCADE
);

DELIMITER $$
CREATE PROCEDURE update_paramterers(
    id INT,
    periods_per_day_ TINYINT,
    days_per_week_ TINYINT
)
BEGIN
    UPDATE university SET periods_per_day = periods_per_day_, days_per_week = days_per_week_ WHERE university_id = id;

    DELETE FROM period_ban_times WHERE period_id IN 
        (SELECT period_id FROM 
            (SELECT course_id FROM course WHERE university_id = id) AS `this_university_courses` 
            INNER JOIN `period` ON `period`.course_id = this_university_courses.course_id 
        );  
    
    UPDATE `period` SET set_time = NULL WHERE period_id IN 
        (SELECT period_id FROM (SELECT course_id FROM course WHERE university_id = id) AS `this_university_courses` 
            INNER JOIN `period` ON `period`.course_id = this_university_courses.course_id 
        );  

    DELETE FROM room_ban_times WHERE room_id IN (SELECT room_id FROM room WHERE university_id = id);
    DELETE FROM professor_ban_times WHERE professor_id IN (SELECT professor_id FROM professor WHERE university_id = id);
    DELETE FROM group_ban_times WHERE group_id IN (SELECT group_id FROM `group` WHERE university_id = id);

END $$

CREATE PROCEDURE courses_information(
    university_id_ INT
)
BEGIN
    SELECT course_id,`name` FROM course WHERE university_id = university_id_;

    SELECT `this_university_courses`.course_id, professor.name 
        FROM (SELECT course_id FROM course WHERE university_id = university_id_ ) AS `this_university_courses` 
        INNER JOIN course_professor ON course_professor.course_id = `this_university_courses`.course_id 
        INNER JOIN professor ON professor.professor_id = course_professor.professor_id ;

    SELECT `this_university_courses`.course_id, group.name 
        FROM (SELECT course_id FROM course WHERE university_id = university_id_ ) AS `this_university_courses` 
        INNER JOIN course_group ON course_group.course_id = `this_university_courses`.course_id 
        INNER JOIN `group` ON `group`.group_id = course_group.group_id ;
END $$


CREATE PROCEDURE course_information(
    course_id_ INT
)
BEGIN
    SELECT course_id,`name` FROM course WHERE course_id = course_id_;

    SELECT professor.professor_id, professor.name 
        FROM (SELECT professor_id FROM course_professor WHERE course_id = course_id_ ) AS `this_course_professors` 
        INNER JOIN professor ON professor.professor_id = `this_course_professors`.professor_id ;

    SELECT `group`.group_id, `group`.`name` 
        FROM (SELECT group_id FROM course_group WHERE course_id = course_id_ ) AS `this_course_groups` 
        INNER JOIN `group` ON `group`.group_id = `this_course_groups`.group_id ;

    SELECT * FROM room WHERE university_id IN (SELECT university_id FROM course WHERE course_id = course_id_);
END $$


CREATE PROCEDURE periods_information(
    course_id_ INT
)
BEGIN
    SELECT `name` FROM course WHERE course_id = course_id_;

    SELECT     
        `this_course_periods`.`period_id` AS _id,
        `this_course_periods`.`name` AS periodName,
        `professor`.`name` AS profTaking,
        `this_course_periods`.`length` AS periodLength,
        `this_course_periods`.`frequency` AS periodFrequency,
        `room`.`name` AS roomUsed,
        `this_course_periods`.`set_time`
    FROM (SELECT * FROM `period` WHERE course_id = course_id_) AS `this_course_periods`
    INNER JOIN professor ON  `this_course_periods`.professor_id = professor.professor_id
    INNER JOIN room ON `this_course_periods`.room_id = room.room_id;

    SELECT `this_course_periods`.`period_id`, `group`.`name`
    FROM period_group
    INNER JOIN (SELECT period_id FROM `period` WHERE course_id = course_id_) AS `this_course_periods`  ON `this_course_periods`.period_id = period_group.period_id 
    INNER JOIN `group` ON period_group.group_id = `group`.group_id;

    SELECT `this_course_periods`.period_id, period_ban_times.ban_time
    FROM (SELECT period_id FROM `period` WHERE course_id = course_id_) AS `this_course_periods` 
    INNER JOIN period_ban_times ON `this_course_periods`.period_id = period_ban_times.period_id;
END $$

CREATE PROCEDURE entire_university_information(
    university_id_ INT
)
BEGIN
    
    SELECT university_id AS _id, periods_per_day AS periodsPerDay, days_per_week AS numberOfDays
    FROM university WHERE university_id = university_id_;

    SELECT room_id AS _id,  `name` AS roomName, capacity as roomCapacity 
    FROM room WHERE university_id = university_id_;

    SELECT * FROM room_ban_times WHERE room_id IN (SELECT room_id FROM room WHERE university_id = university_id_);

    SELECT group_id AS _id,  `name` AS groupName, number_of_students as groupQuantity 
    FROM `group` WHERE university_id = university_id_;

    SELECT * FROM group_ban_times WHERE group_id IN (SELECT group_id FROM `group` WHERE university_id = university_id_);

    SELECT professor_id AS _id,  `name` AS professorName 
    FROM professor WHERE university_id = university_id_;

    SELECT * FROM professor_ban_times WHERE professor_id IN (SELECT professor_id FROM professor WHERE university_id = university_id_);

    SELECT course_id AS _id, `name` AS courseName FROM course WHERE university_id = university_id_;

    SELECT     
        `period`.`period_id` AS _id,
        `period`.`name` AS periodName,
        `period`.`course_id` AS parentCourse,
        `period`.`professor_id` AS profTaking,
        `period`.`room_id` AS roomUsed,
        `period`.`length` AS periodLength,
        `period`.`frequency` AS periodFrequency,
        IFNULL(`period`.`set_time`, -1) AS periodTime 
    FROM (SELECT course_id FROM course WHERE university_id = university_id_) AS `this_university_courses`
    INNER JOIN `period` ON `period`.course_id = `this_university_courses`.course_id;  

    SELECT * FROM period_group WHERE period_id IN (
        SELECT `period`.`period_id`
        FROM (SELECT course_id FROM course WHERE university_id = university_id_) AS `this_university_courses`
        INNER JOIN `period` ON `period`.course_id = `this_university_courses`.course_id
    );

    SELECT * FROM period_ban_times WHERE period_id IN (
        SELECT `period`.`period_id`
        FROM (SELECT course_id FROM course WHERE university_id = university_id_) AS `this_university_courses`
        INNER JOIN `period` ON `period`.course_id = `this_university_courses`.course_id  
    );

END $$

CREATE PROCEDURE view_schedule( 
    university_id_ INT
)
BEGIN
    
    SELECT professor_id, `name` FROM professor WHERE university_id = university_id_;

    SELECT 
        `this_university_professors`.professor_id, 
        `period`.`name`, 
        -- period_coloring.period_id, 
        -- period_coloring.length_value,
        -- period_coloring.frequency_value,
        period_coloring.color
    FROM  (SELECT professor_id FROM professor WHERE university_id = university_id_) AS `this_university_professors`
    INNER JOIN `period` ON `period`.professor_id = `this_university_professors`.professor_id
    INNER JOIN period_coloring ON `period`.period_id = period_coloring.period_id;

    SELECT group_id, `name` FROM `group` WHERE university_id = university_id_;

    SELECT 
        `this_university_groups`.group_id,
        `period`.`name`, 
        -- period_coloring.period_id, 
        -- period_coloring.length_value,
        -- period_coloring.frequency_value,
        period_coloring.color
    FROM (SELECT group_id FROM `group` WHERE university_id = university_id_) AS `this_university_groups`
    INNER JOIN period_group ON period_group.group_id = `this_university_groups`.group_id
    INNER JOIN `period` ON `period`.period_id = period_group.period_id
    INNER JOIN period_coloring ON period_coloring.period_id = `period`.period_id;

END $$


DELIMITER ; 

