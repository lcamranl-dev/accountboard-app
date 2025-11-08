# Render.com Deployment Guide for AccountBoard

This guide will help you deploy your full-stack AccountBoard application to Render.com. Render.com is perfect for Node.js applications and offers free tier hosting.

## Overview

Your AccountBoard application consists of:
- **Backend**: Node.js/Express API server (port 3001)
- **Frontend**: React application (built to static files)
- **Database**: MySQL (we'll configure for PostgreSQL or external MySQL)

## Prerequisites

1. **Git Repository**: Render deploys from Git repositories (GitHub, GitLab, or Bitbucket)
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **Database**: PostgreSQL on Render (free tier) or external MySQL

## Step 1: Prepare Your Code for Git

### 1.1 Initialize Git Repository
```bash
# Navigate to your project root
cd f:\Apps\accountboard

# Initialize git repository
git init

# Create .gitignore file
```

### 1.2 Create .gitignore File
Create a `.gitignore` file in your project root:
```
# Dependencies
node_modules/
backend/node_modules/

# Environment variables
.env
.env.local
.env.production

# Build outputs
dist/
build/

# IDE
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
```

### 1.3 Commit Your Code
```bash
git add .
git commit -m "Initial commit: AccountBoard full-stack application"
```

### 1.4 Push to GitHub/GitLab
- Create a new repository on GitHub or GitLab
- Follow their instructions to push your local repository

## Step 2: Database Setup

### Option A: PostgreSQL on Render (Recommended)

1. **Create PostgreSQL Database**:
   - Go to Render Dashboard
   - Click "New" → "PostgreSQL"
   - Choose a name: `accountboard-db`
   - Select region closest to you
   - Choose "Free" plan
   - Click "Create Database"

2. **Get Database Connection Info**:
   - After creation, go to database dashboard
   - Copy the "External Database URL" (starts with `postgresql://`)

### Option B: External MySQL (Your Current Setup)

If you want to keep using your existing MySQL database:
- Ensure your MySQL server accepts external connections
- You'll need to whitelist Render's IP ranges
- Use your existing MySQL connection string

## Step 3: Backend Deployment

### 3.1 Update Backend for Production

Create a new file `backend/package.json` if it doesn't exist:
```json
{
  "name": "accountboard-backend",
  "version": "1.0.0",
  "description": "AccountBoard Backend API",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.0",
    "pg": "^8.11.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.7.0",
    "dotenv": "^16.3.1"
  }
}
```

### 3.2 Update Database Configuration

Update `backend/config/database.js` to support both MySQL and PostgreSQL:

```javascript
const mysql = require('mysql2/promise');
const { Pool } = require('pg');
require('dotenv').config();

const isDevelopment = process.env.NODE_ENV !== 'production';
const usePostgreSQL = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgresql://');

let db;

if (usePostgreSQL) {
  // PostgreSQL configuration for Render
  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
} else {
  // MySQL configuration
  db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'accountboard',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
}

module.exports = db;
```

### 3.3 Deploy Backend to Render

1. **Create Web Service**:
   - Go to Render Dashboard
   - Click "New" → "Web Service"
   - Connect your Git repository
   - Choose the repository with your code

2. **Configure Service**:
   - **Name**: `accountboard-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Choose "Free" for testing

3. **Environment Variables**:
   Click "Advanced" and add these environment variables:
   ```
   NODE_ENV=production
   JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
   PORT=3001
   
   # For PostgreSQL (if using Render database)
   DATABASE_URL=postgresql://username:password@host:port/database
   
   # For MySQL (if using external)
   DB_HOST=your-mysql-host
   DB_USER=your-mysql-username
   DB_PASSWORD=your-mysql-password
   DB_NAME=accountboard
   ```

4. **Deploy**:
   - Click "Create Web Service"
   - Render will automatically deploy your backend
   - You'll get a URL like: `https://accountboard-backend.onrender.com`

## Step 4: Database Migration

### For PostgreSQL on Render

Create `backend/scripts/postgres-migrate.js`:

```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    // Companies table
    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50),
        address TEXT,
        currency VARCHAR(3) DEFAULT 'TRY',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'employee',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Employees table
    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        surname VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        position VARCHAR(255),
        salary DECIMAL(15,2),
        commission_rate DECIMAL(5,2) DEFAULT 0,
        hire_date DATE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Accounts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        balance DECIMAL(15,2) DEFAULT 0,
        currency VARCHAR(3) DEFAULT 'TRY',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Customers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        surname VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        company_name VARCHAR(255),
        tax_number VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Services table
    await client.query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(15,2),
        currency VARCHAR(3) DEFAULT 'TRY',
        commission_rate DECIMAL(5,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
        customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
        service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
        type VARCHAR(50) NOT NULL,
        category VARCHAR(100),
        amount DECIMAL(15,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'TRY',
        description TEXT,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Projects table
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'active',
        budget DECIMAL(15,2),
        currency VARCHAR(3) DEFAULT 'TRY',
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Collaborators table
    await client.query(`
      CREATE TABLE IF NOT EXISTS collaborators (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
        role VARCHAR(255),
        commission_rate DECIMAL(5,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Commission calculations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS commission_calculations (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
        transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
        amount DECIMAL(15,2) NOT NULL,
        rate DECIMAL(5,2) NOT NULL,
        calculated_amount DECIMAL(15,2) NOT NULL,
        period_month INTEGER,
        period_year INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('All tables created successfully!');

    // Create a default company and admin user
    const companyResult = await client.query(
      'INSERT INTO companies (name, email, currency) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING RETURNING id',
      ['Demo Company', 'admin@demo.com', 'TRY']
    );

    if (companyResult.rows.length > 0) {
      const companyId = companyResult.rows[0].id;
      
      await client.query(
        'INSERT INTO users (company_id, email, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
        [companyId, 'admin@demo.com', '$2a$10$YourHashedPasswordHere', 'manager']
      );
      
      console.log('Demo company and admin user created!');
    }

  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    client.release();
    await pool.end();
  }
};

createTables();
```

Run migration after deployment:
```bash
# Add to your package.json scripts
"migrate": "node scripts/postgres-migrate.js"
```

## Step 5: Frontend Deployment

### 5.1 Update Frontend API Configuration

Update `services/api.js` to use your Render backend URL:

```javascript
// Replace the API_BASE_URL detection
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://accountboard-backend.onrender.com/api'  // Your actual Render backend URL
  : 'http://localhost:3001/api';
```

### 5.2 Build Frontend for Production

Since we had npm issues earlier, let's update the manual build in the `dist` folder to use the production API URL.

### 5.3 Deploy Frontend to Render

1. **Create Static Site**:
   - Go to Render Dashboard
   - Click "New" → "Static Site"
   - Connect your Git repository

2. **Configure Static Site**:
   - **Name**: `accountboard-frontend`
   - **Root Directory**: `dist`
   - **Build Command**: `# No build needed, files are pre-built`
   - **Publish Directory**: `.`

3. **Deploy**:
   - Click "Create Static Site"
   - You'll get a URL like: `https://accountboard-frontend.onrender.com`

## Step 6: Testing and Configuration

### 6.1 Test Backend
Visit your backend URL: `https://accountboard-backend.onrender.com/api/test`

### 6.2 Test Frontend
Visit your frontend URL and try logging in with:
- Email: admin@demo.com
- Password: admin123

### 6.3 CORS Configuration
Make sure your backend allows requests from your frontend domain.

## Step 7: Custom Domain (Optional)

1. Go to your Static Site settings
2. Add your custom domain
3. Configure DNS records as instructed by Render
4. Update CORS settings in backend to allow your custom domain

## Free Tier Limitations

Render's free tier includes:
- **Web Services**: Sleep after 15 minutes of inactivity
- **PostgreSQL**: 1GB storage, 100 concurrent connections
- **Static Sites**: Global CDN, custom domains

For production use, consider upgrading to paid plans for:
- Always-on services
- More database storage
- Better performance

## Troubleshooting

### Backend Won't Start
- Check logs in Render dashboard
- Verify environment variables
- Ensure all dependencies are in package.json

### Database Connection Issues
- Verify DATABASE_URL format
- Check if database is in same region
- Ensure SSL configuration is correct

### Frontend API Calls Failing
- Check CORS configuration
- Verify API_BASE_URL is correct
- Check if backend service is running

## Environment Variables Summary

### Backend Service
```env
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
PORT=3001
DATABASE_URL=postgresql://username:password@host:port/database
```

### Frontend (Static Site)
No environment variables needed for static deployment.

Your AccountBoard application will be fully deployed and accessible via Render.com URLs!