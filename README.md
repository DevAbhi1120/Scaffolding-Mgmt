# Scaffold Management — Backend (Node.js + NestJS + MySQL + React front-end ready)

[![Node.js](https://img.shields.io/badge/Node.js-24.4.0-green)](https://nodejs.org/) [![NestJS](https://img.shields.io/badge/NestJS-TypeScript-blue)](https://nestjs.com/) [![MySQL](https://img.shields.io/badge/MySQL-8%2B-orange)](https://www.mysql.com/) [![Docker](https://img.shields.io/badge/Docker-Compose-blue)](https://www.docker.com/)

**Status:** Production-ready backend scaffold for Packages 1–3 (users, inventory, orders, billing, safety checklists, SWMS, VOID protection, notifications, reports, returns, lost/damaged handling, scheduled jobs).

**Node (development) version:** 24.4.0

This README.md is a single-file developer / ops guide with everything you need to set up, run, test, build, and deploy the backend. It also includes a short API & workflow reference and troubleshooting tips.

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Repository Layout (High Level)](#repository-layout-high-level)
5. [Environment Variables (.env)](#environment-variables-env)
6. [Local Development (Fast Start)](#local-development-fast-start)
7. [Docker / docker-compose](#docker--docker-compose)
8. [Kubernetes (k8s) Manifests](#kubernetes-k8s-manifests)
9. [Database Migrations & Seeds](#database-migrations--seeds)
10. [Running Tests & CI](#running-tests--ci)
11. [Postman Collection & API Testing](#postman-collection--api-testing)
12. [Production Build & Image](#production-build--image)
13. [Key Modules & APIs (Quick Reference)](#key-modules--apis-quick-reference)
14. [Security & Best Practices](#security--best-practices)
15. [Troubleshooting & Common Errors](#troubleshooting--common-errors)
16. [Contributing](#contributing)
17. [License & Credits](#license--credits)

## Project Overview

This backend implements a scaffold rental / site provisioning system with features across Packages 1–3:

- **User management** (Super Admin / Admin / Team Role RBAC)
- **Product categories & products**
- **Serial-tracked inventory** (assign, return, track expiry)
- **Orders** (transactional creation, inventory reservation)
- **Safety checklists** (preserved after job completion)
- **VOID protection and SWMS** (forms + attachments + notifiers)
- **Notifications** (email + SMS hooks + schedulers)
- **Billing** (invoices, payments, advance payments, ledger, PDFs)
- **Lost & damaged item management** (fees & billing)
- **Returns & late-return invoicing** (scheduled job)
- **Reports** (inventory control, loss/damage summary)
- **Files module** (uploads & signed URLs)
- **Audit logs + scheduled background jobs**
- **CI** (GitHub Actions), migrations (TypeORM), Docker & k8s manifests

## Tech Stack

- **Node.js** 24.4.0
- **NestJS** (TypeScript)
- **TypeORM** (MySQL)
- **MySQL** / InnoDB
- **Redis** (optional — for notification/job queue)
- **Puppeteer** (PDF generation)
- **Jest + Supertest** (tests)
- **Docker** / docker-compose
- **Kubernetes manifests** (k8s/) for production
- **Postman collection** for manual API testing

## Prerequisites

Install locally:

- **Node.js** 24.4.0 (use nvm / fnm / volta)
- **npm** (bundled with Node)
- **MySQL** 8+ (or a Docker MySQL container)
- **Redis** (optional for queueing)
- **Docker & docker-compose** (for containerized dev)
- *(Optional)* Puppeteer dependencies if you run PDF generation locally (Xvfb in some Linux setups)

## Repository Layout (High Level)

```
.
├─ src/
│  ├─ auth/
│  ├─ users/
│  ├─ categories/
│  ├─ products/
│  ├─ inventory/
│  ├─ orders/
│  ├─ billing/
│  ├─ checklists/
│  ├─ swms/
│  ├─ voids/
│  ├─ notifications/
│  ├─ reports/
│  ├─ returns/
│  ├─ files/
│  ├─ common/
│  └─ database/entities/   # typeorm entities
├─ migrations/
├─ scripts/
│  └─ seed-superadmin.ts
├─ k8s/
├─ docker-compose.yml
├─ Dockerfile
├─ package.json
├─ tsconfig.json
└─ README.md
```

*(You also have a compiled `dist/` for production build artifacts — do not commit `dist/` to git; add to `.gitignore`.)*

## Environment Variables (.env)

Create `.env` from `.env.example` and set values. Key variables:

```env
NODE_ENV=development
PORT=3000

# Database (MySQL)
DB_TYPE=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=secret
DB_DATABASE=scaffolddb

# TypeORM
TYPEORM_SYNCHRONIZE=false
TYPEORM_LOGGING=false

# JWT
JWT_SECRET=replace_with_strong_secret
JWT_EXPIRES_IN=3600s

# SMTP (notifications)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=strongpass
ADMIN_NOTIFICATION_EMAIL=admin@example.com

# Redis (if used)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# App-specific
EXPIRY_ALERT_DAYS=14
LATE_RETURN_FEE_PER_DAY=20.0
LATE_RETURN_FLAT_FEE=0
LATE_RETURN_GRACE_DAYS=0
```

> **Important:** Never commit `.env` with secrets. Store secrets in Vault / GitHub Secrets / k8s Secret for production.

## Local Development (Fast Start)

1. **Install deps:**
   ```bash
   nvm use 24.4.0
   npm ci
   ```

2. **Start MySQL & Redis** (locally or via Docker). Quick Docker example:
   ```bash
   docker run --name scaffold-mysql -e MYSQL_ROOT_PASSWORD=rootpassword -e MYSQL_DATABASE=scaffolddb -p 3306:3306 -d mysql:8
   docker run --name scaffold-redis -p 6379:6379 -d redis:7
   ```

3. **Configure `.env`** with DB credentials.

4. **Run migrations:**
   ```bash
   npm run migration:run
   ```

5. **Seed superadmin** (if available, build then run compiled script or ts-node script):
   ```bash
   # If seed is TS and ts-node is configured:
   ts-node -r tsconfig-paths/register scripts/seed-superadmin.ts

   # or after build:
   npm run build
   node dist/scripts/seed-superadmin.js
   ```

6. **Start dev server:**
   ```bash
   npm run start:dev
   ```

API available at: http://localhost:3000.

## Docker / docker-compose

A `docker-compose.yml` is included to bring app + MySQL + Redis up quickly.

**Dev with docker-compose:**
```bash
# build image locally and run stack
docker-compose up --build
```

Common docker-compose services:

- **app** — Node app
- **mysql** — MySQL 8
- **redis** — Redis 7

In production you will prefer `Dockerfile` + k8s manifests (see [k8s/](#kubernetes-k8s-manifests)).

**Dockerfile (production build)** — example steps:

```dockerfile
FROM node:24.4.0-alpine3.19 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24.4.0-alpine3.19
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
RUN npm ci --production
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

## Kubernetes (k8s) Manifests

`k8s/` contains sample manifests:

- `deployment.yaml` — Deployment for the app
- `service.yaml` — Service (ClusterIP / LoadBalancer)
- `ingress.yaml` — Ingress rules
- `configmap.yaml & secret.yaml` — config and secret placeholders
- `hpa.yaml` — Horizontal Pod Autoscaler example

**Notes:**
- Replace image tags with your container registry image.
- Store DB and SMTP credentials as Kubernetes Secrets.
- Use a managed MySQL instance or a separate DB deployment for production.

## Database Migrations & Seeds

We use TypeORM migrations:

- **Generate migration:**
  ```bash
  npm run migration:generate -- -n MigrationName
  # or using ts-node/cli wrapper
  ```

- **Run migrations:**
  ```bash
  npm run migration:run
  ```

- **Revert:**
  ```bash
  npm run migration:revert
  ```

Seed utilities are under `scripts/`. For CI we build then run `node dist/scripts/seed-superadmin.js`.

## Running Tests & CI

- **Unit tests:** `npm test`
- **E2E tests:** `cross-env NODE_ENV=test npm run test:e2e` (requires test DB/containers to be running)

**CI:** GitHub Actions workflow in `.github/workflows/ci.yml` runs lint → build → migrations → tests. CI uses MySQL + Redis services.

## Postman Collection & API Testing

A complete Postman v2.1 collection JSON is included as `ScaffoldBackend.postman_collection.json` (or paste from the repo root). Import it into Postman. Set environment variables:

- `baseUrl` — http://localhost:3000
- `token` — JWT for an admin user
- `builderId, productId, orderId` etc. — populate after creating resources

## Production Build & Image

1. `npm ci --production`
2. `npm run build`
3. **Build Docker image:**
   ```bash
   docker build -t <registry>/scaffold-backend:latest .
   ```
4. Push to registry & deploy via k8s manifests or helm.

**Note about Puppeteer:** If PDF generation is used in production, ensure the container has necessary libs (use node:18-bullseye or install packages required by Puppeteer). Use `--no-sandbox` and `--disable-setuid-sandbox` flags when launching.

## Key Modules & APIs (Quick Reference)

**Major routers:**

- `/auth` — login/refresh
- `/users` — CRUD users & roles
- `/categories, /products` — product catalog
- `/orders` — create, list, close
- `/inventory` — create/assign/return, lost/damaged endpoints
- `/billing` — invoices, payments, advance payments, ledger, PDFs
- `/checklists` — safety checklists
- `/swms` — SWMS forms
- `/voids` — VOID protection forms
- `/files` — file upload / signed URLs
- `/notifications` — enqueue/list notifications
- `/reports` — inventory-control & loss/damage summary
- `/dashboard` — counts & summaries

*(For a full Postman collection see `ScaffoldBackend.postman_collection.json`.)*

## Security & Best Practices

- Keep `synchronize: false` in TypeORM for production. Use migrations.
- Keep secrets out of repo. Use k8s secrets, Vault, or CI secrets.
- Use HTTPS in production. Configure ingress / load balancer with TLS certs.
- Limit database user privileges (do not use root account in prod).
- Regularly rotate JWT secret and SMTP credentials.
- Monitor job executions & failed notifications.
- Add rate limiting and request validation if exposing public APIs.

## Troubleshooting & Common Errors

- **TypeScript compile errors referencing XService not found**  
  Usually caused by a constructor property named differently (e.g., `private svc: BillingService`) while controller code calls `this.billingService`. Either rename usage or constructor variable. **Fix:** make controller use same property or rename constructor parameter.

- **MySQL connection errors**  
  Ensure MySQL container is running and env is correct (`DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD`). Use `docker logs` to inspect.

- **Puppeteer errors in Docker**  
  Install additional libs (`libnss3, libatk1.0, libxss1, fonts`). Or use a Puppeteer-ready base image and run with `--no-sandbox`.

- **Circular module dependencies (Inventory ↔ Billing)**  
  Use `forwardRef(() => BillingModule)` in InventoryModule imports and `forwardRef(() => InventoryModule)` in BillingModule if both import each other.

- **Scheduler not firing**  
  Ensure `ScheduleModule.forRoot()` is imported in AppModule.

If you hit a compilation error, copy the first 10 lines of the TypeScript compiler output and paste here — I’ll provide a precise fix.

## Contributing

- Fork & branch from main.
- Run `npm ci` and `npm lint` locally.
- Add unit tests for new logic and e2e where appropriate.
- Run migrations: add migration files for schema changes.
- Open a PR with clear description and verification steps.

## License & Credits

MIT License — feel free to reuse and adapt.  
This project scaffolded & extended by the assistant to implement Package 1–3 requirements, including transactional order/inventory flows, billing features, reporting, scheduled jobs and CI/test automation.
