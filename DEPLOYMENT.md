# Deployment Strategy

## Vercel Configuration

### Branch Deployment Settings

Our Vercel configuration ensures that only the `main` branch triggers production deployments:

```json
{
  "git": {
    "deploymentEnabled": {
      "main": true,
      "beta": false
    }
  }
}
```

### What This Means:

- ✅ **Main Branch**: Automatically deploys to production
- ❌ **Beta Branch**: No automatic deployments
- 🔒 **Production Safety**: Only stable, tested code reaches production

## Deployment Workflow

### 1. Development (Beta Branch)
```bash
# Work on beta branch
git checkout beta

# Make changes and push
git add .
git commit -m "feat: new feature"
git push origin beta

# Vercel will NOT deploy these changes
```

### 2. Release to Production (Main Branch)
```bash
# Use release script to merge beta to main
npm run release

# Vercel will automatically deploy from main branch
```

## Vercel Dashboard Configuration

### Manual Configuration Steps:

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select Your Project**: sunrise-2025
3. **Go to Settings** → **Git**
4. **Configure Branch Deployments**:
   - ✅ Enable deployments for `main`
   - ❌ Disable deployments for `beta`

### Environment Variables:

Ensure all environment variables are configured in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `TELEGRAM_BOT_TOKEN`
- `STRIPE_SECRET_KEY`
- `RESEND_API_KEY`
- And any other required variables

## Deployment Verification

### Check Deployment Status:

1. **Vercel Dashboard**: Monitor deployment status
2. **GitHub Integration**: Check deployment links in PRs
3. **Custom Domain**: Verify your domain is working

### Pre-deployment Checklist:

- [ ] All tests pass
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Performance acceptable
- [ ] Security review completed

## Troubleshooting

### If Beta Branch Deploys:

1. Check `vercel.json` configuration
2. Verify Vercel dashboard settings
3. Ensure beta branch is disabled in Vercel

### If Main Branch Doesn't Deploy:

1. Check Vercel project settings
2. Verify GitHub integration
3. Check build logs for errors

## Preview Deployments

### For Testing Beta Features:

You can manually trigger preview deployments for beta features:

1. **Vercel CLI**:
   ```bash
   npm i -g vercel
   vercel --prod
   ```

2. **Manual Deployment**:
   - Go to Vercel dashboard
   - Click "Deploy" → "Import Git Repository"
   - Select beta branch for preview

## Best Practices

1. **Never push directly to main**: Always use the release process
2. **Test thoroughly on beta**: Ensure features work before release
3. **Monitor deployments**: Check Vercel dashboard regularly
4. **Keep environment variables updated**: Sync with production needs
5. **Use preview deployments**: For testing beta features

## Current Configuration

- **Production Branch**: `main`
- **Development Branch**: `beta`
- **Auto-deploy**: Only from `main`
- **Framework**: Next.js 15
- **Build Command**: `npm run build`
- **Output Directory**: `.next` 