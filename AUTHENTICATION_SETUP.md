# Email Authentication Setup Guide

## 🚀 Quick Start

This guide will help you set up email-based authentication for the Engineering Org Manager using Resend (free).

---

## Step 1: Create Resend Account

1. Go to https://resend.com
2. Click "Sign Up" (free, no credit card required)
3. Verify your email address
4. Log in to your dashboard

---

## Step 2: Get API Key

1. In Resend dashboard, click "API Keys"
2. Click "Create API Key"
3. Name it: `org-manager-production`
4. Copy the API key (starts with `re_...`)
5. **Save it somewhere safe** - you'll need it for Vercel

---

## Step 3: Configure Environment Variables Locally (Optional - for testing)

Create a `.env.local` file in the project root:

```bash
# .env.local (DO NOT commit this file!)
RESEND_API_KEY=re_your_api_key_here
JWT_SECRET=your-secure-random-string-min-32-characters
ALLOWED_EMAILS=geminiabhijeet@gmail.com
```

**Generate a secure JWT_SECRET:**
```bash
# On Mac/Linux
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Step 4: Add Environment Variables to Vercel

1. Go to https://vercel.com/dashboard
2. Select your project: `engineering-org-manager`
3. Go to Settings → Environment Variables
4. Add the following variables:

| Key | Value | Environment |
|-----|-------|-------------|
| `RESEND_API_KEY` | `re_your_key_here` | Production, Preview, Development |
| `JWT_SECRET` | `your-32-char-secret` | Production, Preview, Development |
| `ALLOWED_EMAILS` | `geminiabhijeet@gmail.com` | Production, Preview, Development |

**Important:** Click "Add" after each variable.

---

## Step 5: Verify Domain (Optional - Recommended for Production)

For better email deliverability:

1. In Resend dashboard, go to "Domains"
2. Click "Add Domain"
3. Enter your domain (e.g., `shipt-org.com`)
4. Follow the DNS setup instructions
5. Wait for verification (~5-10 minutes)

**Using Resend Sandbox (for testing):**
- Emails sent from `onboarding@resend.dev`
- Can only send to **your verified email**
- No domain setup needed
- Perfect for testing!

---

## Step 6: Deploy to Vercel

```bash
# Commit your changes
git add -A
git commit -m "Add email authentication"
git push origin main
```

Vercel will automatically deploy with your new environment variables.

---

## Step 7: Test Authentication

1. Visit your live app: https://engineering-org-manager.vercel.app/
2. You should see the login page
3. Enter: `geminiabhijeet@gmail.com`
4. Click "Send Verification Code"
5. Check your email for the 6-digit code
6. Enter the code
7. You should be logged in!

---

## Adding More Users

### Method 1: Update Environment Variable

1. Go to Vercel → Settings → Environment Variables
2. Edit `ALLOWED_EMAILS`
3. Add emails separated by commas:
   ```
   geminiabhijeet@gmail.com,teammate@shipt.com,manager@shipt.com
   ```
4. Redeploy your app

### Method 2: Direct in Code (Quick but requires redeploy)

Edit `api/send-code.ts`:
```typescript
const ALLOWED_EMAILS = [
  'geminiabhijeet@gmail.com',
  'teammate@shipt.com',
  'manager@shipt.com',
].map(e => e.trim().toLowerCase());
```

Then commit and push.

---

## 🔒 Security Best Practices

### ✅ DO:
- Keep `RESEND_API_KEY` and `JWT_SECRET` secret
- Use strong, random `JWT_SECRET` (32+ characters)
- Verify domain for production use
- Monitor Resend dashboard for usage
- Use HTTPS only (enforced by Vercel)

### ❌ DON'T:
- Commit `.env.local` to Git
- Share API keys publicly
- Use weak JWT secrets
- Exceed Resend free tier (3,000/month)

---

## Troubleshooting

### Email Not Received

1. **Check spam folder**
2. **Verify email in ALLOWED_EMAILS**
   - Go to Vercel → Environment Variables
   - Check spelling and case (should be lowercase)
3. **Check Resend dashboard**
   - Go to "Logs" to see sent emails
   - Look for errors

### "Email not authorized" Error

- The email you entered is not in `ALLOWED_EMAILS`
- Add it via Vercel environment variables
- Redeploy the app

### Code Expired

- Codes expire after 10 minutes
- Click "Resend Code" to get a new one

### Rate Limited

- Max 3 login attempts per hour
- Wait 1 hour or clear localStorage:
  ```javascript
  // In browser console
  localStorage.clear()
  ```

---

## 📊 Usage Limits (Free Tier)

**Resend Free:**
- 3,000 emails/month
- 100 emails/day
- Perfect for small teams!

**Your Usage:**
- ~10 users × 2 logins/week = ~80 emails/month
- Well within limits ✅

---

## 🎯 Next Steps

### Phase 2 Features (Optional):
1. **Admin Panel** - Manage allowed emails via UI
2. **Audit Logs** - Track login attempts
3. **Email Templates** - Customize email design
4. **Session Management** - View active sessions

---

## Support

**Questions?**
- Check Resend docs: https://resend.com/docs
- Vercel env vars: https://vercel.com/docs/environment-variables

**Common Issues:**
- Emails in spam → Domain verification helps
- API key invalid → Regenerate in Resend dashboard
- JWT errors → Generate new secret, update Vercel

---

✅ **Setup Complete!** Your app is now secured with email authentication.
