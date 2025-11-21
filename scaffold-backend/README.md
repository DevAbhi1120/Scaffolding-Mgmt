# Scaffold Management Backend

A backend system for managing scaffolding operations, built with **NestJS**, **TypeORM**, **MySQL**, and **Redis**.

---

## 📦 Setup

1. **Copy environment variables template:**

```bash
cp .env.example .env
Edit .env to match your local credentials for MySQL, Redis, JWT, etc.

🐳 Run Local Services
bash
Copy code
docker-compose up -d
This will start your MySQL and Redis services as defined in docker-compose.yml.

💻 Install Dependencies
bash
Copy code
npm install
🔧 Database Setup
There are two approaches: Migration-based (recommended) or synchronize (quick dev setup).

1️⃣ Migration-Based (Recommended)
a) Generate Initial Migration
bash
Copy code
npm run typeorm -- migration:generate -d ormconfig.ts migrations/initial-schema
This scans your entities and creates a migration file in the migrations/ folder.

b) Run Migrations
bash
Copy code
npm run typeorm -- migration:run -d ormconfig.ts
This creates all database tables according to your entities.

2️⃣ Quick Dev Setup (Optional)
Only for local development
Do not use in production.

In ormconfig.ts:

ts
Copy code
synchronize: true
Then run your seed script; TypeORM will automatically create tables.

🌱 Seed Superadmin
bash
Copy code
npm run seed
This inserts a default superadmin user into the database.

🚀 Start Development Server
bash
Copy code
npm run start:dev
Server will run at:

arduino
Copy code
http://localhost:3000
⚙ Available Commands
Command	Description
npm run start:dev	Start NestJS server in development mode
npm run migration:generate -d ormconfig.ts <name>	Generate a new migration from entities
npm run migration:run -d ormconfig.ts	Run pending migrations
npm run seed	Seed default superadmin user
docker-compose up -d	Start database and Redis services locally

📝 Notes
Make sure your MySQL service is running and the credentials in .env match.

Always use migrations for production instead of synchronize: true.

The superadmin credentials are defined in scripts/seed-superadmin.ts.

🗂 Project Structure
css
Copy code
scaffold-backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── database/
│   │   └── entities/
│   ├── users/
│   ├── auth/
│   ├── products/
│   ├── categories/
│   └── ...
├── migrations/
├── scripts/
│   └── seed-superadmin.ts
├── ormconfig.ts
├── package.json
└── docker-compose.yml
⚡ Tips
To create additional migrations after modifying entities:

bash
Copy code
npm run typeorm -- migration:generate -d ormconfig.ts migrations/<name>
To revert the last migration:

bash
Copy code
npm run typeorm -- migration:revert -d ormconfig.ts
Ensure your database (DB_DATABASE) exists in MySQL before running migrations.

yaml
Copy code

---

If you want, I can also **add a “one-shot setup command section”** so a new developer can get the project running from scratch with **one or two commands**.  

Do you want me to do that?
Here’s a polished version of your README including a one-shot setup section for quick project initialization:

markdown
Copy code
# Scaffold Management Backend

A backend system for managing scaffolding operations, built with **NestJS**, **TypeORM**, **MySQL**, and **Redis**.

---

## 📦 Setup

1. **Copy environment variables template:**

```bash
cp .env.example .env
Edit .env to match your local credentials for MySQL, Redis, JWT, etc.

🐳 Run Local Services
bash
Copy code
docker-compose up -d
This will start your MySQL and Redis services as defined in docker-compose.yml.

💻 Install Dependencies
bash
Copy code
npm install
🔧 Database Setup
1️⃣ Migration-Based (Recommended)
a) Generate Initial Migration
bash
Copy code
npm run typeorm -- migration:generate -d ormconfig.ts migrations/initial-schema
This scans your entities and creates a migration file in the migrations/ folder.

b) Run Migrations
bash
Copy code
npm run typeorm -- migration:run -d ormconfig.ts
This creates all database tables according to your entities.

2️⃣ Quick Dev Setup (Optional)
Only for local development
Do not use in production.

In ormconfig.ts:

ts
Copy code
synchronize: true
Then run your seed script; TypeORM will automatically create tables.

🌱 Seed Superadmin
bash
Copy code
npm run seed
This inserts a default superadmin user into the database.

🚀 Start Development Server
bash
Copy code
npm run start:dev
Server will run at:

arduino
Copy code
http://localhost:3000
⚙ Available Commands
Command	Description
npm run start:dev	Start NestJS server in development mode
npm run migration:generate -d ormconfig.ts <name>	Generate a new migration from entities
npm run migration:run -d ormconfig.ts	Run pending migrations
npm run migration:revert -d ormconfig.ts	Revert the last migration
npm run seed	Seed default superadmin user
docker-compose up -d	Start database and Redis services locally

🏁 One-Shot Setup (New Developer)
For quick local setup:

bash
Copy code
cp .env.example .env
docker-compose up -d
npm install
npm run typeorm -- migration:run -d ormconfig.ts
npm run seed
npm run start:dev
This sets up the database, runs migrations, seeds the superadmin, and starts the dev server.

🗂 Project Structure
css
Copy code
scaffold-backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── database/
│   │   └── entities/
│   ├── users/
│   ├── auth/
│   ├── products/
│   ├── categories/
│   └── ...
├── migrations/
├── scripts/
│   └── seed-superadmin.ts
├── ormconfig.ts
├── package.json
└── docker-compose.yml
⚡ Tips
Always use migrations for production instead of synchronize: true.

The superadmin credentials are defined in scripts/seed-superadmin.ts.

Ensure your database (DB_DATABASE) exists in MySQL before running migrations.

To generate additional migrations after modifying entities:

bash
Copy code
npm run typeorm -- migration:generate -d ormconfig.ts migrations/<name>
To revert the last migration:

bash
Copy code
npm run typeorm -- migration:revert -d ormconfig.ts
css
Copy code

This gives a **complete, developer-friendly README**, including all commands we discussed, migration handling, seeding, and even a single-step setup section.  

If you want, I can also **add badges for Docker, Node, and TypeORM status** at the top to make it more pr