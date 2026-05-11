-- ============================================================
-- Renewable Energy Grid & Maintenance Network
-- SQL Server Schema
-- ============================================================

CREATE DATABASE EnergyGrid;
GO
USE EnergyGrid;
GO

CREATE TABLE Energy_Site (
  Site_ID       INT IDENTITY(1,1) PRIMARY KEY,
  Site_name     VARCHAR(255) NOT NULL,
  Latitude      DECIMAL(9,6) NOT NULL,
  longitude     DECIMAL(9,6) NOT NULL,
  Terrain_Type  VARCHAR(255) NOT NULL
);

CREATE TABLE Technician (
  Technician_ID INT IDENTITY(1,1) PRIMARY KEY,
  first_Name    VARCHAR(255) NOT NULL,
  last_Name     VARCHAR(255) NOT NULL,
  Contact_Info  VARCHAR(20)  NOT NULL
);

CREATE TABLE certification (
  certification_ID INT IDENTITY(1,1) PRIMARY KEY,
  Technician_ID    INT NOT NULL REFERENCES Technician(Technician_ID),
  Unit_Type        VARCHAR(255) NOT NULL
);

CREATE TABLE Power_Unit (
  Unit_ID              INT IDENTITY(1,1) PRIMARY KEY,
  site_ID              INT NOT NULL REFERENCES Energy_Site(Site_ID),
  installation_date    DATE NOT NULL,
  max_kilowatt_output  FLOAT NOT NULL,
  manufacturer         VARCHAR(255) NOT NULL,
  [Type]               VARCHAR(255) NOT NULL
);

CREATE TABLE Inspection_Round (
  Inspection_ID   INT IDENTITY(1,1) PRIMARY KEY,
  Site_ID         INT NOT NULL REFERENCES Energy_Site(Site_ID),
  Technician_ID   INT NOT NULL REFERENCES Technician(Technician_ID),
  Inspection_Date DATE NOT NULL,
  Notes           VARCHAR(255)
);

CREATE TABLE Inspection_Detail (
  Detail_ID       INT IDENTITY(1,1) PRIMARY KEY,
  Unit_ID         INT NOT NULL REFERENCES Power_Unit(Unit_ID),
  Inspection_ID   INT NOT NULL REFERENCES Inspection_Round(Inspection_ID),
  [Status]          VARCHAR(25) NOT NULL,
  Current_reading FLOAT NOT NULL
);

CREATE TABLE Component (
  Component_ID     INT IDENTITY(1,1) PRIMARY KEY,
  Unit_ID          INT NOT NULL REFERENCES Power_Unit(Unit_ID),
  Detail_ID        INT NOT NULL REFERENCES Inspection_Detail(Detail_ID),
  Component_Name   VARCHAR(255) NOT NULL,
  Serial_number    VARCHAR(255) NOT NULL,
  Replacement_date DATE NOT NULL
);

CREATE TABLE Part (
  Part_ID       INT IDENTITY(1,1) PRIMARY KEY,
  Component_ID  INT NOT NULL REFERENCES Component(Component_ID),
  Part_Name     VARCHAR(255) NOT NULL,
  Part_category VARCHAR(255) NOT NULL
);
GO
