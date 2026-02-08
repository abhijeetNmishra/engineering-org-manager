# Shipt Intranet App: Org Manager - Fork & Deploy Guide

## 1. Overview
This guide documents how to fork the `shipt-org-manager` repository and deploy it to the **Shipt Intranet** (GCP/Docker). The goal is to run an internal instance of the Org Manager on our own infrastructure.

**Important**: This application was originally designed for a serverless runtime. To run it in a standard Docker container on GCP, you must use a Node.js server adapter (like Express) to serve the API endpoints.

## 2. Prerequisites
- **Node.js**: v20 (LTS) or higher.
- **Infrastructure**:
  - **Postgres Database**: Cloud SQL or similar.
  - **Redis**: Memorystore or similar (for session management).
- **Git**: Access to [Shipt GitHub Organization](https://github.com/shipt).
- **Docker**: For containerizing the application.

## 3. Forking Strategy (Critical)
1. Fork `abhijeetNmishra/engineering-org-manager` to the **Shipt** GitHub organization.
2. **Naming**: `shipt-intranet-org-manager` (recommended).
3. **No Push Upstream**: This fork is for internal Shipt consumption only.
   - **Do:** Pull changes from upstream to get latest features.
   - **Do NOT:** Push internal configuration, secrets, or Shipt-specific data to the public upstream repo.

## 4. Local Development Setup
1. **Clone**: `git clone git@github.com:shipt/shipt-intranet-org-manager.git`
2. **Install**: `npm install` (or `pnpm install`)
3. **Environment**: Copy `.env.example` to `.env.local`
   ```bash
   cp .env.example .env.local
   ```
4. **Local DBs** (Docker):
   ```bash
   # Run Postgres & Redis containers
   docker run --name shipt-org-db -e POSTGRES_PASSWORD=docker -e POSTGRES_USER=postgres -e POSTGRES_DB=shipt_org -p 5432:5432 -d postgres
   docker run --name shipt-org-redis -p 6379:6379 -d redis
   ```
5. **Config**: Update `.env.local` with local connection strings:
   ```env
   POSTGRES_URL="postgresql://postgres:docker@localhost:5432/shipt_org"
   KV_REDIS_URL="redis://localhost:6379"
   ALLOWED_EMAILS="user@shipt.com"
   # JWT_SECRET: Generate secure string
   ```
6. **Init DB**: `npx tsx api/setup-db.ts`
7. **Run**: `npm run dev`

## 5. Environment Variables for Production (GCP)

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_URL` | Cloud SQL Connection String | `postgresql://user:pass@10.x.x.x:5432/db` |
| `KV_REDIS_URL` | Memorystore Connection String | `redis://10.x.x.x:6379` |
| `JWT_SECRET` | Secret for signing auth tokens | Log into Vault to generate/retrieve |
| `ALLOWED_EMAILS` | Auth allowlist (comma-separated) | `*@shipt.com` (Requires code change) or strict list |
| `PORT` | Port for the container to listen on | `3000` (Default) |

### ⚠️ Critical Code Changes Needed
Before deploying, you **must** modify the following files:

1.  **Email Service (`api/send-code.ts`)**:
    The upstream repo depends on an external service. Replace the `Resend` implementation with Shipt's internal SMTP relay or approved email service.
    ```typescript
    // REMOVE: import { Resend } from 'resend';
    // ADD: import { sendEmail } from './internal-mailer';
    ```

2.  **API Entrypoint**:
    The generic `api/` files are written for a serverless runtime. Create a `server.js` (Express/Fastify) to serve these endpoints in a Docker container.

## 6. Docker Deployment

### 1. Create Server Entrypoint (`server.js`)
Create a simple Express server to handle API routes and serve the static frontend.

```javascript
/* Simple Adapter for Docker Runtime */
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import setupDb from './api/setup-db.js'; // Ensure this exports a function
import authHandler from './api/verify.js'; // Adapt handlers as needed

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('dist'));

// API Routes (Adapt your handlers here)
app.post('/api/verify', async (req, res) => {
    // Call verification logic
});

// SPA Fallback
app.get('*', (req, res) => {
    res.sendFile(join(dirname(fileURLToPath(import.meta.url)), 'dist', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

### 2. Dockerfile
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/api ./api
COPY server.js ./server.js

EXPOSE 3000
CMD ["node", "server.js"]
```

## 7. Database Migrations (GCP)
Tasks like table creation should be run as a **Job** or strictly controlled process, not on app startup (to avoid race conditions).

**Command**:
```bash
POSTGRES_URL="<CLOUD_SQL_URL>" npx tsx api/setup-db.ts
```

## 9. Troubleshooting
- **Email Not Delivering (Resend)**:
  - **Issue**: Emails only arrive at the account owner's address.
  - **Cause**: Resend Sandbox Mode restricts recipients to the verified account email only.
  - **Fix (External)**: Verify a domain in Resend dashboard.
  - **Fix (Internal)**: Switch to internal SMTP (see Section 5).

## 10. Engineer Checklist
- [ ] **Fork**: Repo exists in Shipt Org.
- [ ] **Email Replaced**: Updated `api/send-code.ts` to use internal SMTP.
- [ ] **Server Adapter**: Created `server.js` to serve API/Frontend in Docker.
- [ ] **Secrets**: Added keys to GCP Secret Manager.
- [ ] **CI/CD**: Configuring Cloud Build to push to GCR.
