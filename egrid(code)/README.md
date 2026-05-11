# Renewable Energy Grid & Maintenance Network

Full-stack web app built with **Node.js**, **Express.js**, plain **JavaScript**, and **Microsoft SQL Server**.
No ORM — all database access uses raw SQL via the `mssql` driver.

## Stack
| Layer    | Technology                     |
|----------|-------------------------------|
| Backend  | Node.js + Express.js           |
| Database | Microsoft SQL Server (`mssql`) |
| Frontend | Vanilla HTML + CSS + JavaScript|
| Queries  | Raw SQL (no ORM)               |

## Project Structure
```
energy-grid/
├── server.js              # Express entry point
├── db.js                  # SQL Server connection pool
├── package.json
├── .env.example           # Environment variable template
├── routes/
│   ├── energy-sites.js
│   ├── power-units.js
│   ├── technicians.js
│   ├── certifications.js
│   ├── inspection-rounds.js
│   ├── inspection-details.js
│   ├── components.js
│   ├── parts.js
│   ├── dashboard.js       # Summary stats + recent inspections
│   └── inquiries.js       # 6 analytical SQL queries
├── database/
│   ├── schema.sql         # CREATE TABLE statements (run first)
│   └── seed.sql           # Sample data (optional)
└── public/
    ├── index.html         # Single-page app shell
    ├── style.css          # Full dark/light theme
    └── app.js             # All frontend logic (vanilla JS)
```

## Setup & Run

### 1. Set up SQL Server
Run the schema script on your SQL Server instance:
```sql
-- In SQL Server Management Studio or sqlcmd:
sqlcmd -S localhost -U sa -P YourPassword -i database/schema.sql
sqlcmd -S localhost -U sa -P YourPassword -i database/seed.sql
```

### 2. Install Node dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
```
Edit `.env` with your SQL Server connection details:
```
DB_SERVER=localhost
DB_PORT=1433
DB_DATABASE=EnergyGrid
DB_USER=sa
DB_PASSWORD=YourPassword123!
DB_ENCRYPT=false
DB_TRUST_CERT=true
PORT=3000
```

### 4. Start the server
```bash
npm start
```

Open **http://localhost:3000** in your browser.

## Pages & Features
| Page              | Features                                              |
|-------------------|-------------------------------------------------------|
| Dashboard         | Live stat counters, recent inspections feed           |
| Energy Sites      | Full CRUD with search, terrain type badges            |
| Power Units       | Full CRUD, linked to sites                            |
| Technicians       | Full CRUD + inline certification management           |
| Inspection Rounds | Full CRUD, linked to sites and technicians            |
| Inspection Details| Full CRUD, status badges, kW readings                 |
| Components        | Full CRUD, replacement tracking                       |
| Spare Parts       | Full CRUD, category color tags                        |
| Analytics         | 6 live SQL inquiry queries (see below)                |

## Analytical Inquiries (Raw SQL)
1. **Manufacturer Below Average** — Which manufacturer had the most efficiency readings below average?
2. **Sites No Inspection** — Which sites had no inspections last calendar month?
3. **Top Technician** — Which technician completed the most inspections last month?
4. **Units No Replacement** — Which power units had no component replacements last month?
5. **Components by Site** — What components were installed at each site last month?
6. **Technician Profiles** — Each technician with total number of distinct units inspected.

## Database Schema (8 Tables)
```
Energy_Site  ←  Power_Unit  ←  Inspection_Detail  ←  Component  ←  Part
                                       ↑
Technician  ←  certification   Inspection_Round  ─────────────────────┘
                                       ↑
                               Energy_Site + Technician
```
