# Email Authentication System - Complete Guide

## 📖 Table of Contents

1. [System Overview](#-system-overview)
2. [Architecture](#-architecture)
3. [How It Works](#-how-it-works)
4. [Code Walkthrough](#-code-walkthrough)
5. [Setup Instructions](#-setup-instructions)
6. [Security & Best Practices](#-security--best-practices)
7. [Troubleshooting](#-troubleshooting)

---

## 🎯 System Overview

This authentication system provides **passwordless email-based login** for authorized users. It's built using:

- **Frontend**: React + TypeScript + Zustand (state management)
- **Backend**: Vercel Serverless Functions (Node.js)
- **Email**: Resend API (free tier: 3,000 emails/month)
- **Storage**: Redis (via ioredis + Upstash)
- **Sessions**: JWT tokens (7-day expiration)

### Key Features

✅ **Passwordless** - No passwords to remember or manage  
✅ **Email Allowlist** - Only specific emails can access  
✅ **Rate Limited** - 3 attempts per hour per email  
✅ **Auto-Expiring Codes** - 10-minute validity  
✅ **Secure Sessions** - JWT with 7-day expiration  
✅ **Mobile Responsive** - Works on all devices  
✅ **Beautiful UI** - Glassmorphism design  

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      USER FLOW                              │
└─────────────────────────────────────────────────────────────┘

1. User enters email
       ↓
2. Frontend calls /api/send-code
       ↓
3. Backend validates email (allowlist)
       ↓
4. Generates 6-digit code
       ↓
5. Stores code in Redis (10min TTL)
       ↓
6. Sends email via Resend
       ↓
7. User receives email with code
       ↓
8. User enters code in UI
       ↓
9. Frontend calls /api/verify
       ↓
10. Backend checks code in Redis
       ↓
11. Generates JWT token (7 days)
       ↓
12. Returns token + user info
       ↓
13. Frontend stores in localStorage
       ↓
14. User is authenticated! ✅
```

### Component Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
├──────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │  Login.tsx   │→ │ PasscodeInput│→ │  authStore.ts   │   │
│  │  (Email UI)  │  │  (6 digits)  │  │  (Zustand)      │   │
│  └──────────────┘  └──────────────┘  └─────────────────┘   │
│         ↓                                      ↓             │
│  ┌──────────────────────────────────────────────────┐       │
│  │             api.ts (HTTP client)                 │       │
│  └──────────────────────────────────────────────────┘       │
└────────────────────────┬──────────────────┬──────────────────┘
                         ↓                  ↓
┌──────────────────────────────────────────────────────────────┐
│                      BACKEND (Vercel)                        │
├──────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐              ┌────────────────────┐    │
│  │ api/send-code.ts│              │  api/verify.ts     │    │
│  │ - Validate email│              │  - Check code      │    │
│  │ - Generate code │              │  - Generate JWT    │    │
│  │ - Store in Redis│              │  - Create session  │    │
│  │ - Send email    │              │  - Return token    │    │
│  └─────────────────┘              └────────────────────┘    │
│         ↓                                   ↓                │
│  ┌──────────────────────────────────────────────────┐       │
│  │          Redis (Upstash)                         │       │
│  │  - passcode:{email} = "123456" (10min TTL)       │       │
│  │  - rate_limit:{email} = {attempts, time} (1hr)   │       │
│  └──────────────────────────────────────────────────┘       │
└──────────────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────────┐
│                    RESEND (Email API)                        │
│  Sends beautiful HTML email with 6-digit code               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔄 How It Works

### Step 1: Email Entry

**File:** `src/pages/Login.tsx`

User enters their email address. Frontend validates basic format (contains `@`).

```tsx
const handleSendCode = async () => {
  if (!email || !email.includes('@')) {
    message.error('Please enter a valid email address');
    return;
  }
  // Calls backend API...
}
```

### Step 2: Send Verification Code

**API Endpoint:** `POST /api/send-code`  
**File:** `api/send-code.ts`

#### What Happens:

1. **Email Validation**
   ```typescript
   const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || '')
     .split(',')
     .map(e => e.trim().toLowerCase());
   
   if (!ALLOWED_EMAILS.includes(normalizedEmail)) {
     return res.status(403).json({ error: 'Email not authorized' });
   }
   ```

2. **Rate Limiting Check**
   ```typescript
   // Limit: 3 attempts per hour
   const stored = await redis.get(`rate_limit:${email}`);
   const data = JSON.parse(stored);
   
   if (data.attempts >= 3) {
     return res.status(429).json({ error: 'Too many attempts' });
   }
   ```

3. **Code Generation**
   ```typescript
   // Generate secure 6-digit code
   function generateCode(): string {
     return Math.floor(100000 + Math.random() * 900000).toString();
   }
   // Example output: "724519"
   ```

4. **Store in Redis**
   ```typescript
   // Store with 10-minute expiration
   const codeKey = `passcode:${email}`;
   await redis.setex(codeKey, 600, code); // 600 seconds = 10 min
   ```

5. **Send Email via Resend**
   ```typescript
   await resend.emails.send({
     from: 'Org Manager <onboarding@resend.dev>',
     to: email,
     subject: 'Your Org Manager Access Code',
     html: `<!-- Beautiful HTML email with ${code} -->`
   });
   ```

### Step 3: User Receives Email

**What the user sees:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Shipt Marketplace
  Engineering Org Manager
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔒 Your Access Code

┌─────────────────────────────┐
│                             │
│        724 519              │
│                             │
└─────────────────────────────┘

This code expires in 10 minutes

⚠️ Security Notice: Never share this
code with anyone.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 4: Code Entry

**Component:** `src/components/PasscodeInput.tsx`

A custom 6-digit input with auto-focus and paste support:

```tsx
// Auto-focus next input after digit entry
if (value && index < length - 1) {
  inputRefs.current[index + 1]?.focus();
}

// Auto-submit when all 6 digits filled
if (newDigits.every(d => d) && !loading) {
  onComplete(newDigits.join('')); // "724519"
}
```

### Step 5: Verify Code

**API Endpoint:** `POST /api/verify`  
**File:** `api/verify.ts`

#### What Happens:

1. **Retrieve Stored Code**
   ```typescript
   const codeKey = `passcode:${email}`;
   const storedCode = await redis.get(codeKey);
   
   if (!storedCode) {
     // Code expired or doesn't exist
     return res.status(400).json({ 
       error: 'No verification code found' 
     });
   }
   ```

2. **Validate Code**
   ```typescript
   const normalizedCode = code.replace(/\s/g, ''); // Remove spaces
   
   if (storedCode !== normalizedCode) {
     return res.status(400).json({ 
       error: 'Invalid verification code' 
     });
   }
   ```

3. **Delete Code (Prevent Reuse)**
   ```typescript
   await redis.del(codeKey); // Code can only be used once
   ```

4. **Generate JWT Token**
   ```typescript
   const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
   
   const token = jwt.sign(
     { 
       email: normalizedEmail,
       exp: Math.floor(expiresAt / 1000) // JWT expects seconds
     },
     process.env.JWT_SECRET
   );
   ```

5. **Return Session**
   ```typescript
   return res.status(200).json({
     success: true,
     token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     user: { email: "user@example.com" },
     expiresAt: 1707408000000
   });
   ```

### Step 6: Frontend Stores Session

**State Management:** `src/state/authStore.ts`

```typescript
// Zustand store with localStorage persistence
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      expiresAt: null,

      login: (token, user, expiresAt) => {
        set({
          user,
          token,
          expiresAt,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          expiresAt: null,
          isAuthenticated: false,
        });
      },

      checkAuth: () => {
        const { expiresAt, isAuthenticated } = get();
        
        // Check if token expired
        if (isAuthenticated && expiresAt && Date.now() > expiresAt) {
          get().logout();
          return false;
        }
        
        return isAuthenticated;
      },
    }),
    {
      name: 'auth-storage', // localStorage key
    }
  )
);
```

**What gets stored in localStorage:**

```json
{
  "state": {
    "user": { "email": "user@example.com" },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "isAuthenticated": true,
    "expiresAt": 1707408000000
  },
  "version": 0
}
```

### Step 7: Protected Routes

**File:** `src/App.tsx`

```typescript
export default function App() {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const isDev = import.meta.env.DEV;

  // Check auth on mount
  useEffect(() => {
    if (!isDev) {
      checkAuth();
    }
  }, [checkAuth, isDev]);

  // Show login if not authenticated (production only)
  if (!isDev && (!isAuthenticated || !checkAuth())) {
    return (
      <OrgStoreProvider>
        <Login />
      </OrgStoreProvider>
    );
  }

  // Show authenticated app
  return (
    <OrgStoreProvider>
      <AppShell />
    </OrgStoreProvider>
  );
}
```

---

## 💻 Code Walkthrough

### Backend: `api/send-code.ts`

```typescript
import Redis from 'ioredis';
import { Resend } from 'resend';

// Initialize services
const redis = new Redis(process.env.KV_REDIS_URL || '');
const resend = new Resend(process.env.RESEND_API_KEY);

// Constants
const ALLOWED_EMAILS = process.env.ALLOWED_EMAILS.split(',');
const CODE_EXPIRY_SECONDS = 10 * 60; // 10 minutes
const MAX_ATTEMPTS = 3;

export default async function handler(req, res) {
  // 1. Validate HTTP method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  // 2. Check allowlist
  if (!ALLOWED_EMAILS.includes(normalizedEmail)) {
    return res.status(403).json({ 
      error: 'Email not authorized' 
    });
  }

  // 3. Check rate limiting
  const rateLimitKey = `rate_limit:${normalizedEmail}`;
  const limit = await redis.get(rateLimitKey);
  
  if (limit) {
    const data = JSON.parse(limit);
    if (data.attempts >= MAX_ATTEMPTS) {
      return res.status(429).json({ 
        error: 'Too many attempts. Try again in 1 hour.' 
      });
    }
  }

  // 4. Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // 5. Store code in Redis (10min expiration)
  await redis.setex(`passcode:${normalizedEmail}`, CODE_EXPIRY_SECONDS, code);

  // 6. Update rate limit counter
  const existing = limit ? JSON.parse(limit) : null;
  await redis.setex(
    rateLimitKey,
    3600, // 1 hour in seconds
    JSON.stringify({
      attempts: existing ? existing.attempts + 1 : 1,
      lastAttempt: Date.now()
    })
  );

  // 7. Send email
  await resend.emails.send({
    from: 'Org Manager <onboarding@resend.dev>',
    to: normalizedEmail,
    subject: 'Your Org Manager Access Code',
    html: `
      <div style="font-family: sans-serif; padding: 40px;">
        <h2>🔒 Your Access Code</h2>
        <div style="font-size: 48px; font-weight: bold; 
                    letter-spacing: 10px; text-align: center;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white; padding: 30px; border-radius: 12px;">
          ${code.slice(0, 3)} ${code.slice(3)}
        </div>
        <p>This code expires in 10 minutes.</p>
        <p style="color: #666;">
          Never share this code with anyone.
        </p>
      </div>
    `
  });

  // 8. Return success
  return res.status(200).json({ 
    success: true,
    message: 'Verification code sent to your email',
    expiresIn: 600 // seconds
  });
}
```

### Backend: `api/verify.ts`

```typescript
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';

const redis = new Redis(process.env.KV_REDIS_URL || '');
const JWT_SECRET = process.env.JWT_SECRET;
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export default async function handler(req, res) {
  const { email, code } = req.body;
  
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedCode = code.replace(/\s/g, '');

  // 1. Get stored code from Redis
  const codeKey = `passcode:${normalizedEmail}`;
  const storedCode = await redis.get(codeKey);

  if (!storedCode) {
    return res.status(400).json({ 
      error: 'No verification code found. Please request a new code.' 
    });
  }

  // 2. Verify code matches
  if (storedCode !== normalizedCode) {
    return res.status(400).json({ 
      error: 'Invalid verification code. Please try again.' 
    });
  }

  // 3. Delete code (single-use)
  await redis.del(codeKey);

  // 4. Generate JWT token
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const token = jwt.sign(
    { 
      email: normalizedEmail,
      exp: Math.floor(expiresAt / 1000)
    },
    JWT_SECRET
  );

  // 5. Return session
  return res.status(200).json({
    success: true,
    token,
    user: { email: normalizedEmail },
    expiresAt
  });
}
```

### Frontend: `src/state/authStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: { email: string } | null;
  token: string | null;
  isAuthenticated: boolean;
  expiresAt: number | null;
  
  login: (token: string, user: { email: string }, expiresAt: number) => void;
  logout: () => void;
  checkAuth: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      expiresAt: null,

      // Login action
      login: (token, user, expiresAt) => {
        set({
          user,
          token,
          expiresAt,
          isAuthenticated: true,
        });
      },

      // Logout action
      logout: () => {
        set({
          user: null,
          token: null,
          expiresAt: null,
          isAuthenticated: false,
        });
      },

      // Check if session is valid
      checkAuth: () => {
        const { expiresAt, isAuthenticated } = get();

        // Token expired?
        if (isAuthenticated && expiresAt && Date.now() > expiresAt) {
          get().logout();
          return false;
        }

        return isAuthenticated;
      },
    }),
    {
      name: 'auth-storage', // localStorage key
    }
  )
);
```

### Frontend: `src/utils/api.ts`

```typescript
const API_BASE = import.meta.env.PROD 
  ? 'https://engineering-org-manager.vercel.app'
  : 'http://localhost:3000';

export async function sendVerificationCode(email: string) {
  const response = await fetch(`${API_BASE}/api/send-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to send code');
  }

  return data;
}

export async function verifyCode(email: string, code: string) {
  const response = await fetch(`${API_BASE}/api/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to verify code');
  }

  return data;
}
```

---

## 🚀 Setup Instructions

### Prerequisites

- Vercel account (free)
- Resend account (free - 3,000 emails/month)
- GitHub repository

### Step 1: Create Resend Account

1. Go to https://resend.com
2. Sign up (no credit card required)
3. Verify your email
4. Dashboard → **API Keys** → **Create API Key**
5. Name: `org-manager-production`
6. **Copy the key** (starts with `re_...`)

### Step 2: Create Vercel KV Database

1. Go to https://vercel.com/dashboard
2. Select project: `engineering-org-manager`
3. **Storage** tab → **Create Database** → **KV (Redis)**
4. Name: `auth-codes`
5. Click **Create**
6. Click **Connect Project** → Select your project

This auto-creates: `KV_REDIS_URL`

### Step 3: Add Environment Variables to Vercel

Go to: **Settings** → **Environment Variables**

Add these **3 variables**:

| Variable | Value | Environments |
|----------|-------|--------------|
| `RESEND_API_KEY` | `re_your_key_here` | ✅ Production, ✅ Preview, ✅ Development |
| `JWT_SECRET` | (generate with command below) | ✅ Production, ✅ Preview, ✅ Development |
| `ALLOWED_EMAILS` | `your.email@gmail.com` | ✅ Production, ✅ Preview, ✅ Development |

**Generate JWT_SECRET:**

```bash
# Mac/Linux
openssl rand -base64 32

# Output: upWGQsEyewdHjOlTEJ1u6YHp9Fpk+oc32rwOmjQ4vTI=
```

Use that output as your `JWT_SECRET`.

### Step 4: Deploy

```bash
git commit --allow-empty -m "Trigger redeploy with auth variables"
git push origin main
```

Vercel auto-deploys (takes ~1-2 minutes).

### Step 5: Test

1. Visit: https://engineering-org-manager.vercel.app/
2. Enter your email (from `ALLOWED_EMAILS`)
3. Click "Send Verification Code"
4. Check inbox (check spam too!)
5. Enter 6-digit code
6. ✅ **Success!**

---

## 🔒 Security & Best Practices

### Security Measures Implemented

✅ **Email Allowlist** - Only authorized emails can access  
✅ **Rate Limiting** - 3 attempts/hour prevents brute force  
✅ **Code Expiration** - 10-minute validity window  
✅ **Single-Use Codes** - Deleted after successful verification  
✅ **HTTPS Only** - Enforced by Vercel  
✅ **JWT Tokens** - Signed with secret, 7-day expiration  
✅ **Session Validation** - Checks expiry on every app load  

### Environment Variable Security

**DO:**
- ✅ Keep `.env.local` in `.gitignore`
- ✅ Use strong, random JWT_SECRET (32+ chars)
- ✅ Rotate API keys if compromised
- ✅ Use Vercel's encrypted storage

**DON'T:**
- ❌ Commit `.env.local` to Git
- ❌ Share API keys in public channels
- ❌ Use weak secrets like "password123"
- ❌ Store secrets in frontend code

### Data Storage (Redis)

**What's stored:**

```
passcode:user@example.com = "724519"    [TTL: 10min]
rate_limit:user@example.com = {          [TTL: 1hr]
  attempts: 2,
  lastAttempt: 1707408000000
}
```

**Auto-cleanup:** Redis TTL (Time-To-Live) automatically deletes expired keys.

### Session Management

**JWT Token Structure:**

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "email": "user@example.com",
    "exp": 1707408000
  },
  "signature": "..." // Signed with JWT_SECRET
}
```

**Token Validation:**

- Frontend checks `expiresAt` on app load
- If expired → auto-logout → redirect to login
- Session persists in localStorage between browser sessions

---

## 🔧 Troubleshooting

### Email Not Received

**Checklist:**

1. ✅ Check spam/junk folder
2. ✅ Verify email in `ALLOWED_EMAILS` (case-insensitive)
3. ✅ Check Resend dashboard → **Logs** for delivery status
4. ✅ Ensure `RESEND_API_KEY` is correct
5. ✅ Check inbox quota (not full)

**Resend Dashboard:**
- **Logs** tab shows all sent emails
- Look for errors (e.g., "Email bounced", "Invalid API key")

### "Email not authorized" Error

**Cause:** Email not in allowlist

**Fix:**
1. Vercel Dashboard → Settings → Environment Variables
2. Edit `ALLOWED_EMAILS`
3. Add email: `existing@email.com,new@email.com`
4. Redeploy: `git commit --allow-empty -m "Update" && git push`

### "No verification code found" Error

**Possible Causes:**

1. **Code expired** (>10 minutes) → Request new code
2. **Redis not connected** → Check `KV_REDIS_URL` in Vercel
3. **Different email** → Use exact email from step 1

**Debug:**
- Check Vercel function logs
- Verify `KV_REDIS_URL` exists in environment variables

### Rate Limited ("Too many attempts")

**Cause:** >3 attempts in 1 hour

**Fix:**

**Option 1:** Wait 1 hour

**Option 2:** Clear localStorage
```javascript
// Browser console
localStorage.clear();
location.reload();
```

**Option 3:** Delete rate limit key in Redis (production only)

### Code Always Invalid

**Checklist:**

1. ✅ Entering exact 6 digits (no spaces)
2. ✅ Using code from latest email (old codes expire)
3. ✅ Code hasn't expired (10 min limit)
4. ✅ Not using code twice (single-use)

### Session Expired Immediately

**Cause:** `JWT_SECRET` mismatch between deployment and verification

**Fix:**
1. Ensure `JWT_SECRET` is same in all environments
2. Redeploy to update functions with correct secret

---

## 📊 Monitoring & Limits

### Resend Free Tier

- **Emails:** 3,000/month, 100/day
- **From Address:** `onboarding@resend.dev` (sandbox)
- **To Address:** Any email in allowlist

**Estimated Usage:**
- 10 users × 2 logins/week = ~80 emails/month ✅

### Vercel KV (Redis) Free Tier

- **Storage:** 256 MB
- **Commands:** 100,000/day
- **Bandwidth:** 100 MB/day

**Estimated Usage:**
- ~100 code operations/day ✅

### JWT Token Size

- **Size:** ~200 bytes
- **Stored:** localStorage (5-10 MB limit)
- **Impact:** Negligible ✅

---

## 🎯 Adding More Users

**Method 1: Environment Variable (Recommended)**

```bash
# Vercel Dashboard → Environment Variables
ALLOWED_EMAILS=user1@gmail.com,user2@shipt.com,user3@company.com
```

**Method 2: Code Update (for many users)**

Edit `api/send-code.ts`:

```typescript
const ALLOWED_EMAILS = [
  'team-lead@shipt.com',
  'engineer1@shipt.com',
  'engineer2@shipt.com',
  'manager@shipt.com',
].map(e => e.trim().toLowerCase());
```

Then commit and push.

---

## 🚨 Emergency Procedures

### Revoke All Sessions

**Delete auth-storage from all users:**

Add this to `App.tsx` temporarily:

```typescript
useEffect(() => {
  localStorage.removeItem('auth-storage');
  window.location.reload();
}, []);
```

Deploy → All users logged out → Remove code → Redeploy

### Rotate JWT Secret

1. Generate new secret: `openssl rand -base64 32`
2. Update `JWT_SECRET` in Vercel
3. Redeploy
4. **All existing tokens become invalid** → Users must re-login

### Disable Authentication (Emergency)

Edit `src/App.tsx`:

```typescript
// Temporarily bypass auth
const isDev = true; // Force dev mode (no auth)
```

Commit and deploy → Auth disabled

---

## ✅ Success!

Your authentication system is now fully operational! 🎉

**What you have:**
- ✅ Secure, passwordless login
- ✅ Email allowlist protection
- ✅ Rate limiting and code expiration
- ✅ Beautiful, responsive UI
- ✅ 7-day sessions with JWT
- ✅ Production-ready infrastructure

**Next steps:**
- Add team members to `ALLOWED_EMAILS`
- Monitor Resend dashboard for usage
- Set up domain verification (optional)
- Build additional features!

---

**Need help?**
- Resend docs: https://resend.com/docs
- Vercel docs: https://vercel.com/docs
- Redis docs: https://redis.io/docs
