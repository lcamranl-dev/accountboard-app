import pool from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const createTables = async () => {
  try {
    console.log('🔄 Starting database migration...');

    // Create companies table (for multiuser support)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS companies (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        phone VARCHAR(50),
        email VARCHAR(255),
        website VARCHAR(255),
        tax_number VARCHAR(100),
        logo_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create employees table (users)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS employees (
        id VARCHAR(50) PRIMARY KEY,
        company_id VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role ENUM('Manager', 'Employee') NOT NULL,
        avatar_url VARCHAR(500),
        default_commission_rate DECIMAL(5,2) DEFAULT 0,
        monthly_salary DECIMAL(12,2) DEFAULT 0,
        salary_due_date VARCHAR(100),
        outstanding_balance DECIMAL(12,2) DEFAULT 0,
        default_language ENUM('en', 'fa', 'tr') DEFAULT 'en',
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        INDEX idx_company_id (company_id),
        INDEX idx_role (role)
      )
    `);

    // Create accounts table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS accounts (
        id VARCHAR(50) PRIMARY KEY,
        company_id VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        type ENUM('Bank', 'Cash') NOT NULL,
        currency ENUM('TRY', 'USD', 'EUR') NOT NULL,
        balance DECIMAL(15,2) DEFAULT 0,
        account_number VARCHAR(100),
        owner_employee_id VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        FOREIGN KEY (owner_employee_id) REFERENCES employees(id) ON DELETE SET NULL,
        INDEX idx_company_id (company_id),
        INDEX idx_type (type),
        INDEX idx_owner (owner_employee_id)
      )
    `);

    // Update employees table to add cash_account_id
    await pool.execute(`
      ALTER TABLE employees 
      ADD COLUMN IF NOT EXISTS cash_account_id VARCHAR(50),
      ADD FOREIGN KEY (cash_account_id) REFERENCES accounts(id) ON DELETE SET NULL
    `);

    // Create customers table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(50) PRIMARY KEY,
        company_id VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(100),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        INDEX idx_company_id (company_id),
        INDEX idx_name (name),
        INDEX idx_email (email)
      )
    `);

    // Create collaborators table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS collaborators (
        id VARCHAR(50) PRIMARY KEY,
        company_id VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        type ENUM('Broker', 'Translator') NOT NULL,
        outstanding_balance DECIMAL(12,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        INDEX idx_company_id (company_id),
        INDEX idx_type (type)
      )
    `);

    // Create services table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS services (
        id VARCHAR(50) PRIMARY KEY,
        company_id VARCHAR(50) NOT NULL,
        name_en VARCHAR(255),
        name_fa VARCHAR(255),
        name_tr VARCHAR(255),
        default_price DECIMAL(12,2) DEFAULT 0,
        legal_costs DECIMAL(12,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        INDEX idx_company_id (company_id)
      )
    `);

    // Create expense_categories table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS expense_categories (
        id VARCHAR(50) PRIMARY KEY,
        company_id VARCHAR(50) NOT NULL,
        name_en VARCHAR(255),
        name_fa VARCHAR(255),
        name_tr VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        INDEX idx_company_id (company_id)
      )
    `);

    // Create projects table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(50) PRIMARY KEY,
        company_id VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        assigner_id VARCHAR(50) NOT NULL,
        status ENUM('Active', 'Finished') DEFAULT 'Active',
        transaction_id VARCHAR(50),
        due_date TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        FOREIGN KEY (assigner_id) REFERENCES employees(id) ON DELETE CASCADE,
        INDEX idx_company_id (company_id),
        INDEX idx_assigner_id (assigner_id),
        INDEX idx_status (status)
      )
    `);

    // Create project_assignees table (many-to-many)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS project_assignees (
        project_id VARCHAR(50),
        employee_id VARCHAR(50),
        PRIMARY KEY (project_id, employee_id),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
      )
    `);

    // Create transactions table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(50) PRIMARY KEY,
        company_id VARCHAR(50) NOT NULL,
        date DATE NOT NULL,
        description TEXT NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        type ENUM('Income', 'Expense') NOT NULL,
        category VARCHAR(255),
        internal_notes TEXT,
        approval_status ENUM('Pending', 'Approved') DEFAULT 'Approved',
        customer_id VARCHAR(50),
        account_id VARCHAR(50),
        employee_id VARCHAR(50),
        collaborator_id VARCHAR(50),
        payment_status ENUM('Paid', 'Partial', 'Due') DEFAULT 'Due',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL,
        FOREIGN KEY (collaborator_id) REFERENCES collaborators(id) ON DELETE SET NULL,
        INDEX idx_company_id (company_id),
        INDEX idx_date (date),
        INDEX idx_type (type),
        INDEX idx_approval_status (approval_status),
        INDEX idx_customer_id (customer_id)
      )
    `);

    // Create line_items table (for invoice items)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS line_items (
        id VARCHAR(50) PRIMARY KEY,
        transaction_id VARCHAR(50) NOT NULL,
        service_id VARCHAR(50) NOT NULL,
        description TEXT,
        subtotal DECIMAL(12,2) NOT NULL,
        legal_costs DECIMAL(12,2) DEFAULT 0,
        vat_rate DECIMAL(5,2) DEFAULT 0,
        vat_amount DECIMAL(12,2) DEFAULT 0,
        employee_id VARCHAR(50),
        commission_rate DECIMAL(5,2) DEFAULT 0,
        commission_amount DECIMAL(12,2) DEFAULT 0,
        collaborator_id VARCHAR(50),
        collaborator_fee DECIMAL(12,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL,
        FOREIGN KEY (collaborator_id) REFERENCES collaborators(id) ON DELETE SET NULL,
        INDEX idx_transaction_id (transaction_id),
        INDEX idx_service_id (service_id)
      )
    `);

    // Create payments table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(50) PRIMARY KEY,
        transaction_id VARCHAR(50) NOT NULL,
        date DATE NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        account_id VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
        INDEX idx_transaction_id (transaction_id),
        INDEX idx_account_id (account_id)
      )
    `);

    // Create notifications table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(50) PRIMARY KEY,
        company_id VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        employee_id VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        INDEX idx_company_id (company_id),
        INDEX idx_employee_id (employee_id),
        INDEX idx_is_read (is_read)
      )
    `);

    // Create audit_log table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id VARCHAR(50) PRIMARY KEY,
        company_id VARCHAR(50) NOT NULL,
        user_id VARCHAR(50) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        action TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES employees(id) ON DELETE CASCADE,
        INDEX idx_company_id (company_id),
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at)
      )
    `);

    // Create settings table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        id VARCHAR(50) PRIMARY KEY,
        company_id VARCHAR(50) NOT NULL,
        setting_key VARCHAR(100) NOT NULL,
        setting_value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        UNIQUE KEY unique_company_setting (company_id, setting_key),
        INDEX idx_company_id (company_id)
      )
    `);

    console.log('✅ Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createTables()
    .then(() => {
      console.log('Migration completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { createTables };