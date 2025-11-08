# Git Repository Setup for Render.com Deployment

This guide will help you set up a Git repository for your AccountBoard application to deploy on Render.com.

## Quick Setup Commands

### 1. Initialize Git Repository (if not already done)

```powershell
# Navigate to your project directory
cd f:\Apps\accountboard

# Initialize git repository
git init

# Check git status
git status
```

### 2. Stage and Commit Your Files

```powershell
# Add all files to staging
git add .

# Commit files
git commit -m "Initial commit: AccountBoard full-stack multiuser accounting app

- Complete backend with Node.js/Express and JWT authentication
- MySQL/PostgreSQL database support with migration scripts  
- React frontend with multi-language support (EN/FA/TR)
- Multi-currency system (TRY/USD/EUR)
- Role-based access control (Manager/Employee)
- Features: Accounts, Transactions, Customers, Services, Projects, Collaborators"
```

### 3. Create Repository on GitHub

1. **Go to GitHub.com**
   - Sign in to your GitHub account
   - Click the "+" icon → "New repository"

2. **Repository Settings**
   - Repository name: `accountboard-app`
   - Description: `Multi-user accounting dashboard with Node.js backend and React frontend`
   - Set to Public or Private (your choice)
   - **Don't** initialize with README (you already have files)
   - Click "Create repository"

3. **Connect Local Repository to GitHub**

```powershell
# Add your GitHub repository as remote origin
git remote add origin https://github.com/yourusername/accountboard-app.git

# Verify remote was added
git remote -v

# Push to GitHub (first time)
git push -u origin main
```

### 4. Alternative: Using GitHub CLI (if installed)

```powershell
# Create repository and push in one go
gh repo create accountboard-app --public --source=. --remote=origin --push
```

## File Structure Check

Before pushing, ensure these key files are present:

```
accountboard/
├── .gitignore                    ✓ (updated for Render)
├── package.json                  ✓ (frontend)
├── README.md                     ✓
├── RENDER_DEPLOYMENT_GUIDE.md    ✓ (new)
├── backend/
│   ├── package.json              ✓ (updated with PostgreSQL)
│   ├── server.js                 ✓
│   ├── config/database.js        ✓ (updated for both MySQL/PostgreSQL)
│   ├── scripts/postgres-migrate.js ✓ (new)
│   └── ...
├── dist/                         ✓ (production build)
└── services/api.js               ✓ (updated for Render URLs)
```

## Environment Variables for Render

When you deploy to Render, you'll need these environment variables:

### Backend Service Environment Variables:
```env
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long-and-random
PORT=3001
DATABASE_URL=postgresql://username:password@host:port/database
```

### Frontend Static Site:
No environment variables needed for static deployment.

## Next Steps After Git Setup

1. **Deploy Backend to Render**
   - Create Web Service from your Git repository
   - Set root directory to `backend`
   - Configure environment variables
   - Deploy and get your backend URL

2. **Update Frontend API URL**
   - Replace `accountboard-backend.onrender.com` in `services/api.js` with your actual backend URL

3. **Deploy Frontend to Render**
   - Create Static Site from same Git repository
   - Set root directory to `dist`
   - Deploy and get your frontend URL

4. **Test Your Application**
   - Visit your frontend URL
   - Try logging in with: admin@demo.com / admin123
   - Test all features

## Troubleshooting

### If git init fails:
```powershell
# Check if already a git repository
ls -la .git

# If exists, you can skip git init
```

### If push fails:
```powershell
# Set git credentials if needed
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Try pushing again
git push -u origin main
```

### If main branch doesn't exist:
```powershell
# Create main branch
git branch -M main
git push -u origin main
```

## Repository URL

After setup, your repository will be available at:
`https://github.com/yourusername/accountboard-app`

This URL is what you'll use when connecting to Render.com for deployment.

## Important Notes

- Render deploys from Git repositories automatically
- Every push to your main branch will trigger a new deployment
- Make sure to update the backend URL in `services/api.js` after backend deployment
- Your `.env` files are ignored by Git for security (environment variables are set in Render dashboard)

Your AccountBoard application is now ready for Render.com deployment! 🚀