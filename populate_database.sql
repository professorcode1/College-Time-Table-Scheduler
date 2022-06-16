-- intended to be called immediately after create database

INSERT INTO university(`university_id`,`name`, `email`, `password`, `periods_per_day`, `days_per_week`) 
VALUES (1, "Thapar", "raghkum2000@gmail.com", "$2b$10$sEzCeYE0vIN7cdVE3wHRdeUHhKSa.erZU1Th9j3M6n/uibb0Hm/5G", 8, 5);

INSERT INTO room(`university_id`, `name`, `capacity`) VALUES
(1, "S1", 75),
(1, "S2", 75),
(1, "S3", 75),
(1, "S4", 75),
(1, "Computer Lab", 75),
(1, "Physics Lab", 75),
(1, "Manufacturing Lab", 75),
(1, "Engineering Drawing Lab", 75),
(1, "Computer Lab 1", 75),
(1, "Computer Lab 2", 75),
(1, "Chemistry Lab", 75),
(1, "Electrical Lab", 75),
(1, "Conference Hall B", 75);


INSERT INTO professor(`university_id`, `name`) VALUES 
(1, "Pankaj Sir"),
(1, "Prabal Sir"),
(1, "Priya Maam"),
(1, "Deep Maam"),
(1, "Electrical Proff"),
(1, "Mechanical Prof"),
(1, "Abhishek Sir"),
(1, "Arshpreet Sir"),
(1, "Diler Sir"),
(1, "Manisha Maam"),
(1, "Vishal Sir"),
(1, "NF2");

INSERT INTO `group`(`university_id`, `name`, `number_of_students`) VALUES 
(1, "L1" , 35),
(1, "L2" , 35),
(1, "M1" , 35),
(1, "M2" , 35),
(1, "2CS1" , 33),
(1, "2CS2" , 33),
(1, "2CS3" , 34);
