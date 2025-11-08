# Production Deployment Guide for cPanel

This guide will help you deploy the Accountboard application to a cPanel shared hosting environment.

## Directory Structure on cPanel

Your hosting structure should look like this:
```
/home/username/
├── public_html/               # This is your main domain
├── accountboard/              # Create this directory for your app
│   ├── frontend/              # Built React app files
│   │   ├── index.html
│   │   ├── assets/
│   │   └── ...
│   ├── backend/               # Node.js API files
│   │   ├── server.js
│   │   ├── package.json
│   │   ├── config/
│   │   ├── routes/
│   │   └── ...
│   └── node_modules/          # Backend dependencies
```

## Deployment Steps

### 1. Prepare Frontend for Production

On your local machine:

```bash
# Navigate to frontend directory
cd f:\Apps\accountboard

# Install dependencies if not already done
npm install

# Build for production
npm run build
```

This creates a `dist` folder with optimized files.

### 2. Prepare Backend for Production

```bash
# Navigate to backend directory
cd f:\Apps\accountboard\backend

# Create production package.json (without devDependencies)
npm install --production
```

### 3. Upload Files to cPanel

1. **Via File Manager or FTP:**
   - Upload the `dist` folder contents to `/accountboard/frontend/`
   - Upload the entire `backend` folder to `/accountboard/backend/`
   - Upload `node_modules` to `/accountboard/node_modules/`

2. **File structure on server:**
   ```
   /home/username/accountboard/
   ├── frontend/
   │   ├── index.html
   │   └── assets/
   ├── backend/
   │   ├── server.js
   │   ├── package.json
   │   ├── config/
   │   ├── routes/
   │   └── scripts/
   └── node_modules/
   ```

### 4. Setup MySQL Database

1. **Create Database in cPanel:**
   - Go to MySQL Databases
   - Create database: `username_accountboard`
   - Create user: `username_accuser`
   - Grant all privileges to the user for the database

2. **Import Database Schema:**
   - Upload and run the migration script OR
   - Import the SQL schema manually via phpMyAdmin

### 5. Configure Environment Variables

Create `.env` file in `/accountboard/backend/`:

```env
NODE_ENV=production
PORT=3001

# Database Configuration (update with your cPanel details)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=username_accountboard
DB_USER=username_accuser
DB_PASSWORD=your_database_password

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secure-production-jwt-secret-key-here
JWT_EXPIRES_IN=7d

# CORS Configuration (update with your domain)
FRONTEND_URL=https://yourdomain.com/accountboard

# File Upload
MAX_FILE_SIZE=5000000
UPLOAD_PATH=uploads/

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 6. Setup Node.js in cPanel

1. **Enable Node.js:**
   - Go to "Setup Node.js App" in cPanel
   - Create new application:
     - Node.js version: Latest LTS (18.x or 20.x)
     - Application mode: Production
     - Application root: `/accountboard/backend`
     - Application URL: Leave empty for main domain
     - Application startup file: `server.js`

2. **Install Dependencies:**
   - In the Node.js app interface, click "Run NPM Install"
   - Or via terminal: `npm install --production`

### 7. Configure Frontend Access

Create `.htaccess` in `/accountboard/frontend/`:

```apache
# Enable GZIP compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Cache static files
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>

# Handle React Router
RewriteEngine On
RewriteBase /accountboard/
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /accountboard/index.html [L]
```

### 8. Setup Database

Run database setup commands via cPanel Terminal or Node.js app:

```bash
# Navigate to backend directory
cd /home/username/accountboard/backend

# Run database migration
node scripts/migrate.js

# Seed initial data
node scripts/seed.js
```

### 9. Configure API Proxy (if needed)

If you need to proxy API requests, create `.htaccess` in `/public_html/`:

```apache
# Proxy API requests to Node.js app
RewriteEngine On
RewriteCond %{REQUEST_URI} ^/api/(.*)$
RewriteRule ^api/(.*)$ http://localhost:3001/api/$1 [P,L]
```

### 10. Update Frontend Configuration

Update your React app's API base URL for production. Create a production config:

```javascript
// In your React app
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://yourdomain.com/api'  // or your Node.js app URL
  : 'http://localhost:3001/api';
```

## Access Your Application

- **Frontend:** `https://yourdomain.com/accountboard/`
- **API:** `https://yourdomain.com:3001/api/` (or proxied through main domain)

## Default Login Credentials

After deployment and database seeding:
- **Manager:** Name: `Kamran`, Password: `password123`
- **Employee:** Name: `Reza`, Password: `password123`
- **Employee:** Name: `Linda`, Password: `password123`

## Security Checklist

1. ✅ Change default passwords immediately
2. ✅ Use strong JWT secret in production
3. ✅ Enable HTTPS for your domain
4. ✅ Restrict database access
5. ✅ Update CORS settings for your domain
6. ✅ Set up regular database backups
7. ✅ Monitor error logs regularly

## Troubleshooting

### Common Issues:

1. **Database Connection Failed:**
   - Check database credentials in `.env`
   - Ensure database user has proper privileges
   - Verify database name format (usually prefixed with username)

2. **Node.js App Won't Start:**
   - Check error logs in cPanel Node.js app interface
   - Verify all dependencies are installed
   - Check file permissions

3. **Frontend Shows Blank Page:**
   - Check browser console for errors
   - Verify `.htaccess` configuration
   - Ensure all static files uploaded correctly

4. **API Requests Failing:**
   - Check CORS configuration
   - Verify API URLs in frontend
   - Check Node.js app status

## Maintenance

### Regular Tasks:
- Monitor database size and optimize
- Review audit logs
- Update dependencies (security patches)
- Backup database regularly
- Monitor server resource usage

### Updating the Application:
1. Build new frontend locally
2. Upload new `dist` files
3. Upload updated backend files
4. Restart Node.js app in cPanel
5. Run any new database migrations