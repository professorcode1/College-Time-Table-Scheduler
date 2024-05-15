DROP DATABASE IF EXISTS `PersonalPortfolioWebTelemetry`;
CREATE DATABASE `PersonalPortfolioWebTelemetry`;
USE `PersonalPortfolioWebTelemetry`;

CREATE TABLE session_id(
    sessionId CHAR(36) NOT NULL,
    time CHAR(19) NOT NULL
);

CREATE TABLE Pageview(
    type VARCHAR(50) NOT NULL,
    sessionId CHAR(36) NOT NULL,
    time CHAR(19) NOT NULL,
    href VARCHAR(300) DEFAULT NULL,
    component_name VARCHAR(100) DEFAULT NULL
);