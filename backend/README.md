# Accountboard Backend

Backend API server for the multiuser accounting dashboard application.

## Features

- **Multi-tenant Architecture**: Support for multiple companies with data isolation
- **JWT Authentication**: Secure login system with role-based access control
- **RESTful API**: Full CRUD operations for all accounting entities
- **MySQL Database**: Robust relational database with proper foreign key constraints
- **Input Validation**: Comprehensive request validation using express-validator
- **Security**: Helmet, CORS, rate limiting, and password hashing
- **Audit Logging**: Track all user actions for compliance

## Quick Start

### Prerequisites

- Node.js (v18+ recommended)
- MySQL 8.0+
- npm or yarn

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Setup environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your database credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=accountboard
   DB_USER=your_username
   DB_PASSWORD=your_password
   JWT_SECRET=your-super-secret-jwt-key
   ```

3. **Setup database**:
   ```bash
   # Create database tables
   npm run db:migrate
   
   # Insert sample data
   npm run db:seed
   ```

4. **Start the server**:
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

The API server will be available at `http://localhost:3001`

### Default Login Credentials

After running the seed script, you can login with:

- **Manager**: Name: `Kamran`, Password: `password123`
- **Employee**: Name: `Reza`, Password: `password123`
- **Employee**: Name: `Linda`, Password: `password123`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/change-password` - Change user password
- `POST /api/auth/logout` - User logout

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get employee by ID
- `POST /api/employees` - Create new employee (Manager only)
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee (Manager only)
- `POST /api/employees/:id/payment` - Make payment to employee (Manager only)

### Accounts
- `GET /api/accounts` - Get all accounts
- `POST /api/accounts` - Create new account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account
- `POST /api/accounts/transfer` - Transfer between accounts

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Services
- `GET /api/services` - Get all services
- `POST /api/services` - Create new service
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service

### And more...

## Database Schema

The application uses a comprehensive MySQL schema with the following main tables:

- `companies` - Multi-tenant company data
- `employees` - User accounts with role-based access
- `accounts` - Bank and cash accounts
- `transactions` - Income and expense records
- `customers` - Customer information
- `services` - Service catalog
- `collaborators` - External partners
- `projects` - Project management
- `line_items` - Invoice line items
- `payments` - Payment records
- `notifications` - System notifications
- `audit_log` - User action tracking

## Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input validation and sanitization
- SQL injection prevention
- CORS configuration
- Helmet security headers

## Deployment

### Development
```bash
npm run dev
```

### Production (cPanel/Shared Hosting)
1. Build the application
2. Upload files to your hosting directory
3. Setup environment variables in cPanel
4. Configure MySQL database
5. Run migrations and seeding

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3001` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `3306` |
| `DB_NAME` | Database name | `accountboard` |
| `DB_USER` | Database username | `root` |
| `DB_PASSWORD` | Database password | `` |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | Token expiration | `7d` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |

## Contributing

1. Follow the existing code style
2. Add proper error handling
3. Include input validation
4. Update documentation
5. Test thoroughly

## License

ISC