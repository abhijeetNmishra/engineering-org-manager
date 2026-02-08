# Shipt Intranet App: Org Manager - Fork & Deploy Guide

## 1. Overview
This guide documents how to fork the `shipt-org-manager` repository, set it up for local development, and deploy it to a **Staging** environment (Vercel). The goal is to run a copy of the Org Manager for internal Shipt intranet use.

**Staging Definition**: A cloud-hosted environment (Vercel) connected to a test database (Vercel Postgres) and test cache (Vercel KV), protected by email authentication.

## 2. Prerequisites
- **Node.js**: v20 (LTS) or higher.
- **Package Manager**: `pnpm` (preferred) or `npm`.
- **Git**: Access to [Shipt GitHub Organization](https://github.com/<SHIPT_GITHUB_ORG>).
- **Vercel Account**: Access to Shipt Vercel team (for staging deployment).
- **Docker** (Optional): For running local Postgres/Redis containers.

## 3. Forking the Repo
1. Navigate to the upstream repository: `https://github.com/abhijeetNmishra/engineering-org-manager`
2. Click **Fork** in the top-right corner.
3. Select **Shipt** organization as the owner.
4. Repository Name: `shipt-intranet-org-manager` (recommended convention).
5. Click **Create fork**.

### CLI Alternative
```bash
git clone https://github.com/abhijeetNmishra/engineering-org-manager.git shipt-intranet-org-manager
cd shipt-intranet-org-manager
git remote rename origin upstream
git remote add origin git@github.com:<SHIPT_GITHUB_ORG>/shipt-intranet-org-manager.git
git push -u origin main
```

## 4. Local Development Setup

### 1. Clone & Install
```bash
git clone git@github.com:<SHIPT_GITHUB_ORG>/shipt-intranet-org-manager.git
cd shipt-intranet-org-manager
pnpm install
# OR
npm install
```

### 2. Environment Variables
Create `.env.local` by copying the example:
```bash
cp .env.example .env.local
```
Fill in the `RESEND_API_KEY` and `JWT_SECRET` (see Section 5 for details).

### 3. Local Database (Docker)
Start a local Postgres and Redis instance:
```bash
# Run Postgres
docker run --name shipt-org-db -e POSTGRES_PASSWORD=docker -e POSTGRES_USER=postgres -e POSTGRES_DB=shipt_org -p 5432:5432 -d postgres

# Run Redis
docker run --name shipt-org-redis -p 6379:6379 -d redis
```
Update `.env.local` with local connection strings:
```env
POSTGRES_URL="postgresql://postgres:docker@localhost:5432/shipt_org"
KV_URL="redis://localhost:6379"
```

### 4. Initialize Database
Run the setup script to create tables:
```bash
# If using pnpm
pnpm dlx tsx api/setup-db.ts

# If using npm
npx -y tsx api/setup-db.ts
```

### 5. Run Application
```bash
pnpm dev
# App will run at http://localhost:5173
```

## 5. Environment Variables

| Variable | Description | Example / Note |
|----------|-------------|----------------|
| `POSTGRES_URL` | Connection string for Postgres DB | Local: `postgresql://...`<br>Staging: Auto-set by Vercel Integration |
| `KV_URL` | Connection string for Redis | Local: `redis://...`<br>Staging: Auto-set by Vercel Integration |
| `RESEND_API_KEY` | API Key for [Resend](https://resend.com) (Email sending) | `re_12345...` |
| `JWT_SECRET` | Secret key for signing Auth tokens | Generate: `openssl rand -base64 32` |
| `ALLOWED_EMAILS` | Comma-separated list of allowed domains/emails | `user@shipt.com,admin@shipt.com` |
| `VITE_APP_URL` | Base URL of the application | `http://localhost:5173` or Staging URL |

**Note**: `POSTGRES_URL_*` and `KV_Rest_*` references in `.env.example` are specific to Vercel's managed services but standard connection strings work for the core libraries.

## 6. Database & Migrations
This project uses **Raw SQL** via `@vercel/postgres` for schema management. There is no ORM (Prisma/Drizzle) migration tool.

**Migration Strategy**:
- The schema is defined in `api/setup-db.ts`.
- The script uses `CREATE TABLE IF NOT EXISTS`, making it idempotent (safe to run multiple times).

**How to Apply Changes (Local & Staging):**
1. Modify `api/setup-db.ts` with new columns/tables.
2. Run the script against the target database environment.

```bash
# Apply to Local
npx tsx api/setup-db.ts

# Apply to Staging (Connect local script to staging DB)
# 1. Pull staging env vars
vercel env pull .env.staging
# 2. Run script using staging env
dotenv -e .env.staging -- npx tsx api/setup-db.ts
```

## 7. Staging Deployment (Vercel)

### 1. Import Project
1. Go to Vercel Dashboard -> **Add New...** -> **Project**.
2. Select the `shipt-intranet-org-manager` repo.
3. Framework Preset: **Vite**.

### 2. Configure Resources
1. **Storage**: In the storage tab, add **Vercel Postgres** and **Vercel KV** databases. This automatically populates `POSTGRES_*` and `KV_*` env vars.
2. **Environment Variables**: Add the manual secrets:
   - `RESEND_API_KEY`
   - `JWT_SECRET`
   - `ALLOWED_EMAILS` (e.g., `@shipt.com`)

### 3. Deploy
Click **Deploy**. Once finished, you will get a deployment URL (e.g., `https://shipt-org-manager-staging.vercel.app`).

### 4. Initialize Staging DB
Since the database is fresh, you must run the setup script.
**Option A: Local Tunnel (Easiest)**
On your local machine, link to the Vercel project and run the script:
```bash
npm install -g vercel
vercel login
vercel link
vercel env pull .env.staging
POSTGRES_URL=$(grep POSTGRES_URL .env.staging | cut -d= -f2-) npx tsx api/setup-db.ts
```

## 8. Shipt Intranet Considerations
- **Access Control**: Ensure `ALLOWED_EMAILS` is strict (e.g., `*@shipt.com` only).
- **Data Privacy**: Do NOT import real production HRIS dumps into Staging. Use mock data or anonymized datasets.
- **SSO**: This app uses Magic Links. For stricter control, enable **Vercel Password Protection** on the deployment or put it behind Shipt VPN access if hosted differently.

## 9. Operational Workflows
- **Branching**: Use `main` for production-ready code. Use `feature/xyz` for development.
- **Promotion**: Merging PR to `main` automatically deploys to Staging (if Vercel Git integration is active).
- **Troubleshooting**:
  - **Redirect Loop**: Check `ALLOWED_EMAILS` and ensure your email is valid.
  - **"Relation does not exist"**: You forgot to run `api/setup-db.ts` against the database.
  - **Connection Timeout**: Whitelist IP addresses if using corporate VPN/Firewall with external DBs (Vercel DB is public-accessible with creds).

## 10. Verification Checklist
- [ ] **Fork**: Repo exists in Shipt Org.
- [ ] **Local Build**: `pnpm build` passes.
- [ ] **Local DB**: `api/setup-db.ts` runs without error.
- [ ] **Staging Deploy**: Vercel deployment is "Ready" (green).
- [ ] **Auth**: You can log in with a Shipt email.
- [ ] **CRUD**: Can create a new Module/Employee in Staging.
- [ ] **Clean Slate**: (If implemented) "Reset Data" button works and re-seeds correctly.
