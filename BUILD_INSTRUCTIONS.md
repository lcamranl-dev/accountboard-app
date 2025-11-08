# Production Build Instructions

Due to npm permission issues on this system, here are manual steps to create the production build:

## Option 1: Manual Build Process

Since `npm run build` is encountering permission issues, you can manually prepare the files for production:

### 1. Copy Static Files

Copy these files to your `dist` folder for production:

```bash
# Core application files
- index.html (already created in dist/)
- App.tsx → App.js (copy and rename)
- types.ts → types.js (copy and rename)
- index.tsx → index.js (copy and rename)

# Copy entire directories
- components/ (copy to dist/components/)
- contexts/ (copy to dist/contexts/)
- services/ (copy to dist/services/)
```

### 2. Update Import Statements

For production, ensure all `.tsx` files are copied as `.js` files and update imports:

- Change `import './Component.tsx'` to `import './Component.js'`
- Update relative paths as needed

### 3. Production Configuration

The `dist/index.html` already includes:
- ✅ Production API URL detection
- ✅ CDN imports for React and Recharts
- ✅ Tailwind CSS from CDN
- ✅ Font imports
- ✅ Service worker setup

## Option 2: Alternative Build Methods

### Using Different Terminal/Admin Rights
```bash
# Try running as administrator
Run-As-Administrator PowerShell
cd f:\Apps\accountboard
npm install --force
npm run build
```

### Using Yarn (if available)
```bash
yarn install
yarn build
```

### Using Alternative Package Managers
```bash
# Using pnpm
npx pnpm install
npx pnpm run build

# Using bun (if available)
bun install
bun run build
```

## Option 3: Deploy Without Traditional Build

Since this is a modern ESM-based application using import maps, you can deploy directly:

1. **Copy all source files** to your hosting directory
2. **Use the provided `dist/index.html`** which includes:
   - CDN-based dependencies
   - Production API configuration
   - Proper import maps

3. **File structure for hosting:**
   ```
   /accountboard/
   ├── index.html          # Use the one from dist/
   ├── App.tsx             # Your main app file
   ├── components/         # All components
   ├── contexts/           # Context providers
   ├── services/           # API service layer
   └── types.ts           # TypeScript types
   ```

## Production Checklist

- [ ] Backend API running on port 3001
- [ ] Database migrated and seeded
- [ ] Environment variables configured
- [ ] Frontend files uploaded to hosting
- [ ] API URLs updated for production domain
- [ ] SSL certificate configured
- [ ] Test login functionality

## Quick Deploy to cPanel

1. **Backend Setup:**
   ```bash
   # Upload backend/ folder to your hosting
   # Set up Node.js app in cPanel pointing to backend/server.js
   # Configure environment variables
   # Run database migration
   ```

2. **Frontend Setup:**
   ```bash
   # Upload dist/index.html and source files
   # Update API base URL in services/api.js
   # Test the application
   ```

## Testing Locally

Even without a proper build, you can test by serving the files:

```bash
# Simple HTTP server
python -m http.server 3000
# or
npx serve . -p 3000
```

Then navigate to `http://localhost:3000` to test the application.

## Troubleshooting npm Issues

If you continue having npm permission issues:

1. **Clear npm cache:**
   ```bash
   npm cache clean --force
   ```

2. **Use different npm registry:**
   ```bash
   npm install --registry https://registry.npmjs.org/
   ```

3. **Try with --no-optional flag:**
   ```bash
   npm install --no-optional --legacy-peer-deps
   ```

4. **Use npx for one-time build:**
   ```bash
   npx --yes vite build
   ```

The application is designed to work in production even without a traditional build step due to its modern ESM architecture and CDN dependencies.