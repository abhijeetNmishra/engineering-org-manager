# Deployment Guide - Engineering Org Manager

## 🚀 Deployment Options

This guide covers multiple deployment strategies for your React + Vite application.

---

## Option 1: Vercel (Recommended ⭐)

**Best for:** React/Vite apps, automatic deployments, edge network, zero config

### Setup Steps

1. **Install Vercel CLI** (optional)
   ```bash
   npm install -g vercel
   ```

2. **Deploy via GitHub Integration** (Easiest)
   
   a. Go to [vercel.com](https://vercel.com)
   
   b. Sign up/login with your GitHub account
   
   c. Click "Add New Project"
   
   d. Import `abhijeetNmishra/engineering-org-manager`
   
   e. Vercel auto-detects Vite settings:
      - **Framework Preset:** Vite
      - **Build Command:** `npm run build`
      - **Output Directory:** `dist`
      - **Install Command:** `npm install`
   
   f. Click "Deploy"
   
   ✅ **That's it!** Your app will be live at `https://engineering-org-manager.vercel.app`

3. **Automatic CI/CD**
   - Every push to `main` → auto-deploy to production
   - Pull requests → preview deployments with unique URLs
   - Rollback to any previous deployment with one click

### Vercel CLI Deployment

```bash
# One-time setup
vercel login

# Deploy to production
vercel --prod

# Deploy preview
vercel
```

---

## Option 2: Netlify

**Best for:** Great DX, form handling, serverless functions, free SSL

### Setup Steps

1. **Via Netlify UI**
   
   a. Go to [netlify.com](https://netlify.com)
   
   b. Click "Add new site" → "Import an existing project"
   
   c. Connect to GitHub and select `engineering-org-manager`
   
   d. Configure build settings:
      - **Build command:** `npm run build`
      - **Publish directory:** `dist`
   
   e. Click "Deploy site"
   
   ✅ Live at `https://engineering-org-manager.netlify.app`

2. **Via Netlify CLI**
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify init
   netlify deploy --prod
   ```

3. **Add `netlify.toml` for SPA routing**

   Create in project root:
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

---

## Option 3: GitHub Pages

**Best for:** Free hosting, simple static sites

### Setup Steps

1. **Install gh-pages package**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Update `vite.config.ts`**
   ```typescript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'

   export default defineConfig({
     plugins: [react()],
     base: '/engineering-org-manager/', // ← Add this
   })
   ```

3. **Add scripts to `package.json`**
   ```json
   {
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

4. **Deploy**
   ```bash
   npm run deploy
   ```

5. **Configure GitHub Pages**
   - Go to repo Settings → Pages
   - Source: Deploy from branch
   - Branch: `gh-pages` / root
   
   ✅ Live at `https://abhijeetnmishra.github.io/engineering-org-manager/`

---

## Option 4: Cloudflare Pages

**Best for:** Global CDN, fast edge deployments, integrated with Workers

### Setup Steps

1. Go to [pages.cloudflare.com](https://pages.cloudflare.com)

2. "Create a project" → Connect to GitHub

3. Select `engineering-org-manager`

4. Build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** (leave empty)

5. Deploy!

✅ Live at `https://engineering-org-manager.pages.dev`

---

## GitHub Actions CI/CD

For custom workflows, create `.github/workflows/deploy.yml`:

### Vercel with GitHub Actions

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests (if you have them)
        run: npm test --if-present
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Generic Build + Test CI

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Type check
        run: npx tsc --noEmit
      
      - name: Build
        run: npm run build
      
      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
```

---

## Build Optimization

### 1. Check build output

```bash
npm run build
```

Output will be in `dist/` folder.

### 2. Preview production build locally

```bash
npm run preview
```

### 3. Analyze bundle size

Add to `package.json`:
```json
{
  "scripts": {
    "analyze": "vite build --mode analyze"
  },
  "devDependencies": {
    "rollup-plugin-visualizer": "^5.12.0"
  }
}
```

Update `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true }) // Opens bundle analysis
  ]
})
```

---

## Environment Variables

### For Deployment Platforms

Most platforms auto-detect these files:
- `.env` - Default environment
- `.env.production` - Production build
- `.env.development` - Dev server

**Example `.env.production`:**
```bash
VITE_API_URL=https://api.production.com
VITE_APP_NAME=Engineering Org Manager
```

**Usage in code:**
```typescript
const apiUrl = import.meta.env.VITE_API_URL
```

### Platform-Specific Settings

**Vercel:**
- Dashboard → Project → Settings → Environment Variables

**Netlify:**
- Site settings → Build & deploy → Environment

**GitHub Pages:**
- Repo → Settings → Secrets and variables → Actions

---

## Custom Domain

### Vercel
1. Dashboard → Project → Settings → Domains
2. Add domain: `orgmanager.yourcompany.com`
3. Add DNS records from Vercel to your domain provider

### Netlify
1. Site settings → Domain management → Add custom domain
2. Configure DNS

### GitHub Pages
1. Add `CNAME` file to `public/` folder with your domain
2. Configure DNS A records to GitHub IPs

---

## Performance Best Practices

1. **Enable compression** (most platforms do this automatically)

2. **Cache headers** (configured by platform)

3. **Asset optimization**
   ```typescript
   // vite.config.ts
   export default defineConfig({
     build: {
       rollupOptions: {
         output: {
           manualChunks: {
             'react-vendor': ['react', 'react-dom'],
             'antd-vendor': ['antd', '@ant-design/icons'],
             'chart-vendor': ['reactflow', '@antv/g6']
           }
         }
       }
     }
   })
   ```

4. **Lazy load routes**
   ```typescript
   const Dashboard = lazy(() => import('./pages/Dashboard'))
   const OrgChart = lazy(() => import('./pages/OrgChart'))
   ```

---

## Monitoring & Analytics

### Add Vercel Analytics

```bash
npm install @vercel/analytics
```

```typescript
// main.tsx
import { Analytics } from '@vercel/analytics/react'

root.render(
  <>
    <App />
    <Analytics />
  </>
)
```

### Google Analytics (any platform)

```typescript
// Add to index.html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
```

---

## Recommended Deployment Strategy

**For this project, I recommend:**

1. **Vercel** for production (best DX for React/Vite)
2. **GitHub Actions** for CI (testing, linting)
3. **Preview deployments** for every PR

**Workflow:**
```
Push to main → GitHub Actions runs tests → Vercel auto-deploys
PR opened → Preview deployment created → Review → Merge → Production
```

---

## Quick Start Checklist

- [ ] Choose deployment platform (Vercel recommended)
- [ ] Connect GitHub repository
- [ ] Configure build settings (auto-detected for Vite)
- [ ] Deploy!
- [ ] (Optional) Add custom domain
- [ ] (Optional) Set up GitHub Actions for CI
- [ ] (Optional) Add analytics

---

## Troubleshooting

**Build fails:**
```bash
# Test build locally first
npm run build
npm run preview
```

**SPA routing issues (404 on refresh):**
- Vercel: Auto-handled
- Netlify: Add `netlify.toml` (see above)
- GitHub Pages: May need hash routing

**Large bundle size:**
```bash
npm run analyze
# Split code, lazy load, tree-shake unused deps
```

---

## Next Steps

1. Choose your deployment platform
2. Connect your GitHub repo
3. Deploy with one click
4. Share your live URL!

Your live app will be accessible worldwide in minutes! 🚀
