# Deployment Guide

This guide covers different ways to deploy the Etheria Survival Calculator.

## Quick Deploy Options

### GitHub Pages (Recommended for Free Hosting)

1. **Enable GitHub Pages** in your repository settings
2. **Set source** to "GitHub Actions"
3. **Create deployment workflow**:

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: npm
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./build

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

4. **Update package.json** for GitHub Pages:
```json
{
  "homepage": "https://yourusername.github.io/etheria-survival-calculator"
}
```

### Vercel (Recommended for Easy Deployment)

1. **Connect your GitHub repository** to Vercel
2. **Deploy automatically** on every push to main
3. **Zero configuration** required

### Netlify

1. **Connect your GitHub repository** to Netlify
2. **Build settings**:
   - Build command: `npm run build`
   - Publish directory: `build`
3. **Deploy automatically** on every push

## Manual Deployment

### Building for Production
```bash
npm run build
```

This creates a `build/` folder with optimized production files.

### Static File Hosting
Upload the contents of the `build/` folder to any static hosting service:
- GitHub Pages
- Netlify
- Vercel
- AWS S3 + CloudFront
- Firebase Hosting

## Environment Configuration

The app is designed to work without server-side configuration. All data files are included in the build.

### Custom Domain (Optional)

If using a custom domain:
1. **Add CNAME file** to `public/` folder with your domain
2. **Configure DNS** to point to your hosting service
3. **Enable HTTPS** through your hosting provider

## Performance Optimization

The build process automatically:
- ✅ Minifies JavaScript and CSS
- ✅ Optimizes images
- ✅ Generates service worker for caching
- ✅ Splits code for faster loading

## Troubleshooting

### Build Failures
- Check Node.js version (requires 16+)
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`

### Routing Issues (404s)
If using client-side routing, configure your hosting service:

**Netlify**: Add `_redirects` file to `public/`:
```
/*    /index.html   200
```

**Apache**: Add `.htaccess` to `public/`:
```
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
```

### Large Bundle Size
The app includes several data files. Consider:
- Lazy loading components
- Code splitting
- Compressing text data files

## Monitoring

After deployment, monitor:
- **Loading times** on different devices
- **JavaScript errors** in browser console
- **User feedback** on functionality

## Updates

To update your deployed app:
1. **Push changes** to main branch
2. **Automatic deployment** triggers
3. **Verify functionality** on live site
4. **Monitor** for any issues

The app includes a service worker for caching, so users may need to refresh to see updates.
