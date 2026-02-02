# Vercel KV (Redis) Integration for Authentication

## Overview

The authentication system now uses **Vercel KV (Redis)** to persist verification codes across serverless function invocations.

## Why the Change?

**Problem:**  
- Serverless functions run in isolation - each function call may run on a different server
- In-memory Maps (`new Map()`) are not shared between function invocations
- Codes stored in `send-code.ts` were never accessible in `verify.ts`

**Solution:**  
- Use Vercel KV (Redis) as a shared, persistent storage layer
- Codes are stored with automatic expiration (10 minutes)
- Both `send-code` and `verify` functions access the same Redis instance

## Setup Required

### 1. Create Vercel KV Database

1. Go to https://vercel.com/dashboard
2. Select your project: `engineering-org-manager`
3. Go to **Storage** tab
4. Click **Create Database** → **KV (Redis)**
5. Name it: `auth-codes`
6. Click **Create**

### 2. Connect to Project

Vercel will automatically add these environment variables:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`
- `KV_URL`

No manual configuration needed! ✅

### 3. Redeploy

Your app will auto-redeploy when you push to GitHub. The KV variables are already connected.

## How It Works

### Code Storage (send-code.ts)

```typescript
// Store code with 10-minute expiration
const codeKey = `passcode:${email}`;
await kv.set(codeKey, code, { ex: 600 }); // expires in 600 seconds
```

### Code Retrieval (verify.ts)

```typescript
// Get code from Redis
const codeKey = `passcode:${email}`;
const storedCode = await kv.get<string>(codeKey);

if (!storedCode) {
  // Code not found or expired
}
```

### Rate Limiting

```typescript
// Track attempts per email
const rateLimitKey = `rate_limit:${email}`;
await kv.set(rateLimitKey, { attempts: 1, lastAttempt: Date.now() }, { ex: 3600 });
```

## Data Structure

### Keys Used

| Key Pattern | Value Type | Expiration | Purpose |
|-------------|------------|------------|---------|
| `passcode:{email}` | `string` (6 digits) | 10 minutes | Verification code |
| `rate_limit:{email}` | `{ attempts, lastAttempt }` | 1 hour | Rate limiting |

### Example Data

```
passcode:john@example.com = "123456"  (expires in 10min)
rate_limit:john@example.com = { attempts: 2, lastAttempt: 1706839200000 }  (expires in 1hr)
```

##  Benefits

✅ **Persistent:** Codes survive function restarts  
✅ **Shared:** All serverless instances access same data  
✅ **Auto-expiring:** Redis handles cleanup automatically  
✅ **Fast:** Sub-millisecond read/write operations  
✅ **Free tier:** Generous limits (100K commands/day)

## Testing

### Local Development (Optional)

For local testing, Vercel KV automatically works with `vercel dev`:

```bash
vercel dev
```

The KV connection uses your production database by default.

### Alternative: Mock KV for Local Dev

If you want to avoid using production KV locally, create `.env.local`:

```bash
# Mock KV URLs for local development
KV_REST_API_URL=http://localhost:6379
KV_REST_API_TOKEN=local-dev-token
```

Then run a local Redis instance:

```bash
docker run -p 6379:6379 redis:latest
```

## Troubleshooting

### "KV_REST_API_URL is not defined"

**Solution:** Create the KV database in Vercel dashboard (see Setup step 1)

### Codes still not working

1. Check Vercel KV dashboard shows recent activity
2. Verify environment variables are set
3. Check function logs in Vercel dashboard
4. Ensure both functions deployed successfully

### Local dev not connecting to KV

Use `vercel dev` instead of `npm run dev` to test with KV locally.

## Monitoring

### View KV Data

1. Go to Vercel Dashboard → Storage → KV
2. Click on `auth-codes` database
3. Use the built-in browser to inspect keys

### Check Usage

- Storage → Your KV → Metrics
- Monitor:
  - Commands per day
  - Storage used
  - Connection count

##  Limits (Free Tier)

- **Commands:** 100,000/day
- **Storage:** 256 MB
- **Bandwidth:** 100 MB/day
- **Databases:** 1

**More than enough** for authentication! 🎉

---

## Migration Impact

✅ **No breaking changes** for users  
✅ **Same API endpoints** (`/api/send-code`, `/api/verify`)  
✅ **Same user experience**  
✅ **Better reliability** - codes now persist properly

---

**Status:** Ready to deploy once KV database is created!
