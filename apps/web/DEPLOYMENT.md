# DineLink Deployment Guide

## Vercel Deployment Setup

### Step 1: Connect GitHub to Vercel

1. **Go to**: https://vercel.com/dashboard
2. **Click**: "Add New..." → "Project"
3. **Import** your GitHub repository: `cuculi-hongkong/Claudable`
4. **Configure**:
   - Framework Preset: Next.js
   - Root Directory: `apps/web`
   - Build Command: `npm run build`
   - Output Directory: `.next`

### Step 2: Configure Environment Variables

In your Vercel project settings → Environment Variables, add:

```
NEXT_PUBLIC_SUPABASE_URL=https://ijdjbdixofeuxgspitmy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqZGpiZGl4b2ZldXhnc3BpdG15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMzY5MjUsImV4cCI6MjA3MTcxMjkyNX0.zBrTTXuJY3v4x7-k3AYiX8nWgUdh7S6vsHSy67CcErU
```

### Step 3: Set up GitHub Actions (Optional)

To enable automated deployments, add these secrets to your GitHub repository:

1. **Go to**: GitHub repo → Settings → Secrets and variables → Actions
2. **Add Repository Secrets**:
   - `VERCEL_TOKEN`: Your Vercel token (from Vercel → Settings → Tokens)
   - `VERCEL_ORG_ID`: Your Vercel organization ID
   - `VERCEL_PROJECT_ID`: Your Vercel project ID

Get the IDs by running in your project:
```bash
npx vercel link
```

## Domain Configuration

### Production Domain
- Vercel will provide: `https://your-project-name.vercel.app`
- Configure custom domain in Vercel dashboard if needed

### Supabase Authentication URLs
Update in Supabase dashboard → Authentication → URL Configuration:
- Site URL: `https://your-domain.vercel.app`
- Redirect URLs: `https://your-domain.vercel.app/**`

## Deployment Commands

### Manual Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Deploy preview
vercel
```

### Automatic Deployment
- Push to `main` branch → Production deployment  
- Open Pull Request → Preview deployment

## Health Checks

After deployment, verify:
1. ✅ App loads without errors
2. ✅ Database connection works (check restaurants page)
3. ✅ Authentication flow works (phone verification)
4. ✅ All environment variables are set correctly

## Monitoring

- **Vercel Analytics**: Automatic performance monitoring
- **Supabase Dashboard**: Database and auth monitoring
- **GitHub Actions**: Build and deployment logs