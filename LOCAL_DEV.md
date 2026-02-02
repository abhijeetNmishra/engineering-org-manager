# Local Development with Authentication

## Quick Start

**Use Vercel CLI for local development** (it properly runs the serverless API functions):

```bash
# Install Vercel CLI globally (one time only)
npm install -g vercel

# Start local development server with API support
vercel dev
```

Then visit: **http://localhost:3000** (note: port 3000, not 5173)

---

## Why Not `npm run dev`?

The regular Vite dev server (`npm run dev`) doesn't support Vercel serverless functions. The `/api/*` routes won't work, causing the authentication to fail with:

```
Failed to execute 'json' on 'Response': Unexpected end of JSON input
```

**Solution:** Use `vercel dev` instead, which runs both:
- Your React frontend (Vite)
- Your serverless API functions (`/api/*`)

---

## First Time Setup

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Link to Vercel project** (first time only):
   ```bash
   vercel link
   ```
   - Select your Vercel account
   - Link to existing project: `engineering-org-manager`

3. **Pull environment variables** (optional, but recommended):
   ```bash
   vercel env pull .env.local
   ```
   This downloads your production env vars to `.env.local`

4. **Start dev server:**
   ```bash
   vercel dev
   ```

---

## Local Development Workflow

```bash
# Start the dev server with API support
vercel dev

# Visit in browser
open http://localhost:3000

# Test authentication
# 1. Enter your email
# 2. Check inbox for code
# 3. Enter code to login
```

---

## Alternative: Skip Auth in Local Development

If you want to use the regular `npm run dev` without authentication:

1. Comment out the auth check in `src/App.tsx`:
   ```tsx
   export default function App() {
     // TEMPORARY: Skip auth in local dev
     // const { isAuthenticated, checkAuth } = useAuthStore();
     // if (!isAuthenticated || !checkAuth()) {
     //   return <OrgStoreProvider><Login /></OrgStoreProvider>;
     // }
     
     return (
       <OrgStoreProvider>
         <AppShell />
       </OrgStoreProvider>
     );
   }
   ```

2. Use `npm run dev` as normal
3. **Remember to uncomment** before deploying!

---

## Troubleshooting

**Port already in use:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
vercel dev --listen 3001
```

**Environment variables not loaded:**
```bash
# Make sure .env.local exists and has values
cat .env.local

# Or pull from Vercel
vercel env pull .env.local
```

**API routes still not working:**
```bash
# Verify Vercel CLI version
vercel --version

# Re-link project
vercel link --yes
```

---

## Recommended Setup

For the best development experience:

**package.json scripts:**
```json
{
  "scripts": {
    "dev": "vite",
    "dev:vercel": "vercel dev",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

Then use:
- `npm run dev:vercel` - **For testing auth** (uses Vercel CLI)
- `npm run dev` - For quick UI changes (no auth, faster)
- `npm run build` - Build for production

---

✅ **Next:** Run `vercel dev` and test the authentication flow!
