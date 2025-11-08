import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    console.log('Creating PostgreSQL tables for AccountBoard...');

    // Companies table
    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50),
        address TEXT,
        currency VARCHAR(3) DEFAULT 'TRY',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Companies table created');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'employee',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Users table created');

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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Employees table created');

    // Accounts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('cash', 'bank', 'credit_card', 'asset', 'liability', 'equity')),
        balance DECIMAL(15,2) DEFAULT 0,
        currency VARCHAR(3) DEFAULT 'TRY',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Accounts table created');

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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Customers table created');

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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Services table created');

    // Transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
        customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
        service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')),
        category VARCHAR(100),
        amount DECIMAL(15,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'TRY',
        description TEXT,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Transactions table created');

    // Projects table
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold', 'cancelled')),
        budget DECIMAL(15,2),
        currency VARCHAR(3) DEFAULT 'TRY',
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Projects table created');

    // Collaborators table
    await client.query(`
      CREATE TABLE IF NOT EXISTS collaborators (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
        role VARCHAR(255),
        commission_rate DECIMAL(5,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, employee_id)
      )
    `);
    console.log('✓ Collaborators table created');

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
        period_month INTEGER CHECK (period_month >= 1 AND period_month <= 12),
        period_year INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Commission calculations table created');

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
      CREATE INDEX IF NOT EXISTS idx_employees_company_id ON employees(company_id);
      CREATE INDEX IF NOT EXISTS idx_accounts_company_id ON accounts(company_id);
      CREATE INDEX IF NOT EXISTS idx_customers_company_id ON customers(company_id);
      CREATE INDEX IF NOT EXISTS idx_services_company_id ON services(company_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_company_id ON transactions(company_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
      CREATE INDEX IF NOT EXISTS idx_projects_company_id ON projects(company_id);
      CREATE INDEX IF NOT EXISTS idx_collaborators_company_id ON collaborators(company_id);
      CREATE INDEX IF NOT EXISTS idx_commission_calculations_company_id ON commission_calculations(company_id);
    `);
    console.log('✓ Database indexes created');

    console.log('\\n🎉 All tables created successfully!');

    // Create a default company and admin user
    console.log('\\nCreating demo company and admin user...');
    
    const companyResult = await client.query(
      'INSERT INTO companies (name, email, currency) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING RETURNING id',
      ['Demo Company', 'admin@demo.com', 'TRY']
    );

    if (companyResult.rows.length > 0) {
      const companyId = companyResult.rows[0].id;
      
      // Hash the default password
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await client.query(
        'INSERT INTO users (company_id, email, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
        [companyId, 'admin@demo.com', hashedPassword, 'manager']
      );
      
      // Create some default accounts
      await client.query(`
        INSERT INTO accounts (company_id, name, type, balance, currency) VALUES 
        ($1, 'Cash', 'cash', 10000, 'TRY'),
        ($1, 'Bank Account', 'bank', 25000, 'TRY'),
        ($1, 'Credit Card', 'credit_card', -5000, 'TRY')
        ON CONFLICT DO NOTHING
      `, [companyId]);
      
      console.log('✓ Demo company created with:');
      console.log('  - Email: admin@demo.com');
      console.log('  - Password: admin123');
      console.log('  - Default accounts added');
    } else {
      console.log('✓ Demo company already exists');
    }

  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

const main = async () => {
  try {
    await createTables();
    console.log('\\n✅ PostgreSQL migration completed successfully!');
    console.log('\\n📋 Next steps:');
    console.log('1. Deploy your backend to Render');
    console.log('2. Set DATABASE_URL environment variable');
    console.log('3. Your app will be ready to use!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

main();