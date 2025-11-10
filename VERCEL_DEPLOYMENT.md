# Vercel Deployment Guide for XAM-HEID Frontend

This guide covers deploying the XAM-HEID frontend to Vercel while connecting to the Google Cloud Run backend.

## Prerequisites

- Vercel account (free tier works)
- GitHub repository with your code
- Backend deployed to Google Cloud Run (see DEPLOYMENT.md)

## Quick Deploy

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New" → "Project"
   - Import your GitHub repository (`XAM-HEID`)

2. **Configure Build Settings**
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (project root)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

3. **Set Environment Variables**
   Click "Environment Variables" and add:
   
   | Name | Value | Environment |
   |------|-------|-------------|
   | `VITE_API_BASE_URL` | `https://your-backend-xyz.run.app` | Production |
   | `VITE_ENABLE_AI_FEATURES` | `true` | Production |
   | `VITE_API_BASE_URL` | `http://localhost:8000` | Preview |
   | `VITE_API_BASE_URL` | `http://localhost:8000` | Development |

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Get your deployment URL: `https://your-app.vercel.app`

5. **Update Backend CORS**
   After deployment, update your Cloud Run backend's CORS settings:
   ```bash
   gcloud run services update xam-heid-backend \
     --region us-central1 \
     --update-env-vars ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-app-*.vercel.app
   ```

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Follow prompts to configure project
```

## Environment Variables Explained

### `VITE_API_BASE_URL`
**Required**: URL of your backend API
- **Production**: `https://your-backend-service.run.app` (Cloud Run URL)
- **Preview/Dev**: `http://localhost:8000`

### `VITE_ENABLE_AI_FEATURES`
**Optional**: Enable/disable AI features
- Default: `true`
- Set to `false` to use ML-only mode

## Vercel Configuration File

The project includes `vercel.json` for routing configuration:

```json
{
  "rewrites": [
    {
      "source": "/((?!assets/).*)",
      "destination": "/index.html"
    }
  ]
}
```

This ensures client-side routing works correctly for the React SPA.

## Custom Domain (Optional)

### Add Custom Domain

1. Go to your project in Vercel Dashboard
2. Navigate to "Settings" → "Domains"
3. Click "Add"
4. Enter your domain (e.g., `xamheid.com`)
5. Follow DNS configuration instructions
6. Wait for SSL certificate provisioning (~5 minutes)

### Update Backend CORS for Custom Domain

```bash
gcloud run services update xam-heid-backend \
  --region us-central1 \
  --update-env-vars ALLOWED_ORIGINS=https://xamheid.com,https://www.xamheid.com
```

## Continuous Deployment

Vercel automatically deploys:
- **Production**: Every push to `main` branch
- **Preview**: Every pull request

### Configure Branch Deployment

1. Go to "Settings" → "Git"
2. Set production branch: `main`
3. Enable preview deployments for all branches

### Deployment Workflow

```
Developer pushes to `feature-branch`
         ↓
Vercel creates preview deployment
         ↓
Preview URL: https://xam-heid-git-feature-branch-user.vercel.app
         ↓
Review changes, test with backend
         ↓
Merge to `main`
         ↓
Production deployment: https://your-app.vercel.app
```

## Testing Deployment

### 1. Check Frontend Loads
```bash
curl https://your-app.vercel.app
```

### 2. Test API Connection
Open browser console on your Vercel URL and run:
```javascript
fetch('/api/health_check').then(r => r.json()).then(console.log)
```

Should fail with CORS error if backend isn't configured.

### 3. Test Backend Connection
```javascript
const apiUrl = 'https://your-backend.run.app/api/health_check';
fetch(apiUrl).then(r => r.json()).then(console.log);
```

### 4. Test Full Integration
- Navigate to your Vercel app
- Select a disease and year
- Click "Analyze" in AI Policy Advisor
- Verify insights load (check browser console for errors)

## Troubleshooting

### Issue: "Failed to fetch" or CORS Error

**Cause**: Backend CORS not configured for Vercel URL

**Solution**:
```bash
# Check current CORS settings
gcloud run services describe xam-heid-backend --region us-central1 --format='value(spec.template.spec.containers[0].env)'

# Update CORS
gcloud run services update xam-heid-backend \
  --region us-central1 \
  --update-env-vars ALLOWED_ORIGINS=https://your-app.vercel.app
```

### Issue: Build fails with "Module not found"

**Cause**: Missing dependencies

**Solution**:
```bash
# Locally, clear and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build

# If successful, commit package-lock.json and push
git add package-lock.json
git commit -m "Update dependencies"
git push
```

### Issue: Environment variables not working

**Cause**: Env vars not prefixed with `VITE_`

**Solution**: In Vite, all environment variables must start with `VITE_` to be exposed to the client.

### Issue: 404 on page refresh

**Cause**: SPA routing not configured

**Solution**: Ensure `vercel.json` exists with rewrite rules (already included in project).

### Issue: Preview deployments use production backend

**Cause**: Same env var for all environments

**Solution**: Set different values for Production, Preview, and Development environments in Vercel dashboard.

## Performance Optimization

### Enable Caching

Vercel automatically caches:
- Static assets (images, CSS, JS)
- Build outputs
- Serverless function responses

### Build Performance

```bash
# Check build time
vercel logs your-deployment-url

# Optimize by reducing dependencies
npm install --save-dev vite-plugin-compression
```

### CDN Configuration

Vercel's Edge Network automatically distributes your app globally. No configuration needed.

## Security Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **API Keys**: Store only in Vercel environment variables
3. **CORS**: Limit to your specific domain(s)
4. **HTTPS**: Always use HTTPS (Vercel provides free SSL)
5. **Authentication**: Consider adding auth for sensitive features

## Monitoring

### Analytics

Enable Vercel Analytics:
1. Go to "Analytics" tab
2. Enable Web Analytics
3. View traffic, performance, and Core Web Vitals

### Logs

View deployment and runtime logs:
```bash
# Install Vercel CLI
vercel logs your-deployment-url

# Or view in dashboard
# Projects → Your Project → Deployments → Click deployment → Logs
```

## Cost

Vercel Free Tier includes:
- Unlimited deployments
- 100 GB bandwidth/month
- Automatic HTTPS
- Global CDN
- Preview deployments

Pro tier ($20/month) adds:
- Increased bandwidth
- Team collaboration
- Advanced analytics
- Password protection

## Architecture Diagram

```
┌──────────────────┐
│   Developer      │
│   Pushes Code    │
└────────┬─────────┘
         │
         ↓
┌──────────────────┐
│   GitHub Repo    │
└────────┬─────────┘
         │
         ↓
┌──────────────────┐
│   Vercel         │
│   Build & Deploy │
├──────────────────┤
│ • npm install    │
│ • npm run build  │
│ • Deploy to CDN  │
└────────┬─────────┘
         │
         ↓
┌──────────────────┐      HTTPS       ┌──────────────────┐
│   Vercel Edge    │ ←──────────────→ │   Users          │
│   Network (CDN)  │                  │   (Global)       │
└────────┬─────────┘                  └──────────────────┘
         │
         │ API Calls
         ↓
┌──────────────────┐
│  Cloud Run       │
│  Backend API     │
│  (us-central1)   │
└──────────────────┘
```

## Next Steps

1. ✅ Deploy frontend to Vercel
2. ✅ Configure environment variables
3. ✅ Update backend CORS
4. ✅ Test full integration
5. ⚙️ Set up custom domain (optional)
6. ⚙️ Enable analytics
7. ⚙️ Configure team access
8. ⚙️ Set up branch protection rules

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Documentation](https://vitejs.dev/)
- [GitHub Issues](https://github.com/supzammy/XAM-HEID/issues)
