# Data Persistence Strategy

**Architecture:** Vercel Postgres + Optimistic React State

This project uses **Vercel Postgres** as the single source of truth for organization data. 
The frontend maintains an in-memory copy of the state for instant (optimistic) UI updates, and asynchronously syncs changes to the backend.

## 1. Database Schema

We use a relational database with JSONB columns for flexible data (skills, tags).

### `employees` Table
| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT (PK) | UUID or string ID |
| `name` | TEXT | |
| `title` | TEXT | |
| `manager_id`| TEXT | Self-referencing Foreign Key |
| `workstreams`| JSONB | Array of strings |
| `module_ids` | JSONB | Array of owned modules strings |
| `status` | TEXT | 'active', 'on_leave', 'open' |

### `modules` Table
| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT (PK) | Module ID |
| `name` | TEXT | |
| `workstream`| TEXT | |
| `director_id`| TEXT | FK to employees.id |
| `tags` | JSONB | Array of strings |

### `ownership` Table
| Column | Type | Notes |
|--------|------|-------|
| `module_id` | TEXT (PK) | FK to modules |
| `owner_id` | TEXT (PK) | FK to employees |
| `ownership_type`| TEXT | 'Primary', 'Secondary' |

---

## 2. API Architecture

The API functions as a thin CRUD layer over the database.

- `GET /api/employees` - List all
- `POST /api/employees` - Create/Update (Upsert)
- `DELETE /api/employees` - Delete (reassigns reports to manager)
- `GET /api/org-state` - Full state fetch (Initial Load)
- `PUT /api/org-state` - Bulk Replace (Import/Reset)

---

## 3. Local Development

You have two options for local development:

### Option A: Connect to Vercel (Recommended)
This is the simplest way. Your local app connects to the remote Vercel database.

1. **Create Database in Vercel Dashboard:**
   - Go to your Vercel Project Dashboard
   - Click **Storage** tab
   - Click **Create Database** -> Select **Postgres** (or **Neon** / **Supabase**)
     - *Note: Vercel now uses marketplace providers. Neon is the default "serverless Postgres", but Supabase works too.*
   - Accept the defaults (Region, Plan) and click **Create**
   - Choose "Connect" to your project

2. **Link & Pull Credentials:**
   Run these commands in your terminal:
   ```bash
   npm i -g vercel
   vercel link
   vercel env pull .env.local
   ```
   *Note: If you chose Supabase, you might need to manually map variables in Vercel settings if the names differ, but usually Vercel normalizes them to `POSTGRES_URL`.*
3. **Run Dev:**
   ```bash
   npm run dev
   ```

### Option B: Local Docker Postgres
For offline development or isolation.

1. Update `.env.local` with local Postgres credentials:
   ```env
   POSTGRES_URL="postgres://user:pass@localhost:5432/shipt_org"
   ```
2. Run database setup:
   ```bash
   npx tsx api/setup-db.ts
   ```

---

## 4. Deployment

Deployment is automatic via Vercel.

1. Ensure the Vercel Project has a Postgres database connected.
2. The `POSTGRES_*` environment variables will be auto-populated.
3. Access the app at your specific deployment URL.

## 5. Data Integrity

- **Manager Cycles:** Prevented by UI logic validation before dispatch.
- **Orphans:** When an employee is deleted, their direct reports are reassigned to their manager (or set to top-level if no manager).
- **Foreign Keys:** Database enforces module/owner relationships.

---

## 6. Frontend Sync

We use an **Optimistic UI** pattern:
1. User performs action (e.g., Drag & Drop)
2. `useReducer` updates local state immediately -> UI updates instantly.
3. `OrgStoreProvider` intercepts the action and calls the API in the background.
4. If API fails, an error is logged (TODO: Add toast notifications/rollback).
