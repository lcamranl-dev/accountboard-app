import pool from '../config/database.js';
import bcrypt from 'bcryptjs';
import { createTables } from './migrate.js';
import dotenv from 'dotenv';

dotenv.config();

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // First run migration to ensure tables exist
    await createTables();

    // Create default company
    const companyId = 'comp_default';
    await pool.execute(`
      INSERT IGNORE INTO companies (id, name, address, phone, email, website, tax_number)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      companyId,
      'Sample Accounting Company',
      '123 Business Street, City, Country',
      '+90 555 123 4567',
      'info@company.com',
      'https://company.com',
      '1234567890'
    ]);

    // Create default accounts
    const accounts = [
      { id: 'acc001', name: 'Main Business Lira Account', type: 'Bank', currency: 'TRY', balance: 152340.75, accountNumber: 'TR...5001' },
      { id: 'acc002', name: 'Company USD Account', type: 'Bank', currency: 'USD', balance: 25450.00, accountNumber: 'TR...3012' },
      { id: 'acc003', name: 'Company EUR Account', type: 'Bank', currency: 'EUR', balance: 18200.50, accountNumber: 'TR...3013' },
      { id: 'acc004', name: 'Petty Cash Fund', type: 'Cash', currency: 'TRY', balance: 1250.00 },
      { id: 'acc_kamran', name: "Kamran's Cash Wallet", type: 'Cash', currency: 'TRY', balance: 0 },
      { id: 'acc_reza', name: "Reza's Cash Wallet", type: 'Cash', currency: 'TRY', balance: 350.50 },
      { id: 'acc_linda', name: "Linda's Cash Wallet", type: 'Cash', currency: 'TRY', balance: 125.00 },
    ];

    for (const account of accounts) {
      await pool.execute(`
        INSERT IGNORE INTO accounts (id, company_id, name, type, currency, balance, account_number, owner_employee_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        account.id,
        companyId,
        account.name,
        account.type,
        account.currency,
        account.balance,
        account.accountNumber || null,
        account.id.includes('_') ? account.id.split('_')[1] === 'kamran' ? 'emp001' : 
        account.id.split('_')[1] === 'reza' ? 'emp002' : 
        account.id.split('_')[1] === 'linda' ? 'emp003' : null : null
      ]);
    }

    // Create default employees with hashed passwords
    const defaultPassword = await bcrypt.hash('password123', 10);
    const employees = [
      { 
        id: 'emp001', 
        name: 'Kamran', 
        role: 'Manager', 
        avatarUrl: 'https://picsum.photos/seed/kamran/40/40',
        defaultCommissionRate: 0,
        monthlySalary: 15000,
        salaryDueDate: '28th of each month',
        outstandingBalance: 0,
        cashAccountId: 'acc_kamran',
        defaultLanguage: 'en'
      },
      { 
        id: 'emp002', 
        name: 'Reza', 
        role: 'Employee', 
        avatarUrl: 'https://picsum.photos/seed/reza/40/40',
        defaultCommissionRate: 20,
        monthlySalary: 7000,
        salaryDueDate: '28th of each month',
        outstandingBalance: -500,
        cashAccountId: 'acc_reza',
        defaultLanguage: 'fa'
      },
      { 
        id: 'emp003', 
        name: 'Linda', 
        role: 'Employee', 
        avatarUrl: 'https://picsum.photos/seed/linda/40/40',
        defaultCommissionRate: 25,
        monthlySalary: 7000,
        salaryDueDate: '28th of each month',
        outstandingBalance: 1200,
        cashAccountId: 'acc_linda',
        defaultLanguage: 'tr'
      }
    ];

    for (const employee of employees) {
      await pool.execute(`
        INSERT IGNORE INTO employees 
        (id, company_id, name, role, avatar_url, default_commission_rate, monthly_salary, 
         salary_due_date, outstanding_balance, cash_account_id, default_language, password_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        employee.id,
        companyId,
        employee.name,
        employee.role,
        employee.avatarUrl,
        employee.defaultCommissionRate,
        employee.monthlySalary,
        employee.salaryDueDate,
        employee.outstandingBalance,
        employee.cashAccountId,
        employee.defaultLanguage,
        defaultPassword
      ]);
    }

    // Create default collaborators
    const collaborators = [
      { id: 'col001', name: 'Ahmad Karimi', type: 'Broker', outstandingBalance: 0 },
      { id: 'col002', name: 'Sara Translation Services', type: 'Translator', outstandingBalance: 0 }
    ];

    for (const collaborator of collaborators) {
      await pool.execute(`
        INSERT IGNORE INTO collaborators (id, company_id, name, type, outstanding_balance)
        VALUES (?, ?, ?, ?, ?)
      `, [collaborator.id, companyId, collaborator.name, collaborator.type, collaborator.outstandingBalance]);
    }

    // Create default customers
    const customers = [
      { id: 'cus001', name: 'Client X Solutions', email: 'contact@clientx.com', phone: '+90 555 123 4567' },
      { id: 'cus002', name: 'Global Tech Inc.', email: 'info@globaltech.net', phone: '+1 415 555 8901' },
      { id: 'cus003', name: 'Innovate Group', email: 'hello@innovate.co', phone: '+44 20 7946 0123' }
    ];

    for (const customer of customers) {
      await pool.execute(`
        INSERT IGNORE INTO customers (id, company_id, name, email, phone)
        VALUES (?, ?, ?, ?, ?)
      `, [customer.id, companyId, customer.name, customer.email, customer.phone]);
    }

    // Create default services
    const services = [
      { id: 'srv001', nameEn: 'Marriage Registration', nameFa: 'ثبت ازدواج', nameTr: 'Evlilik Kaydı', defaultPrice: 500, legalCosts: 50 },
      { id: 'srv002', nameEn: 'Divorce Registration', nameFa: 'ثبت طلاق', nameTr: 'Boşanma Kaydı', defaultPrice: 750, legalCosts: 100 },
      { id: 'srv003', nameEn: 'Birth Certificate', nameFa: 'شناسنامه', nameTr: 'Doğum Belgesi', defaultPrice: 200, legalCosts: 25 },
      { id: 'srv004', nameEn: 'Apostille Service', nameFa: 'خدمات آپوستیل', nameTr: 'Apostil Hizmeti', defaultPrice: 300, legalCosts: 30 },
      { id: 'srv005', nameEn: 'Document Translation', nameFa: 'ترجمه اسناد', nameTr: 'Belge Çevirisi', defaultPrice: 150, legalCosts: 0 }
    ];

    for (const service of services) {
      await pool.execute(`
        INSERT IGNORE INTO services (id, company_id, name_en, name_fa, name_tr, default_price, legal_costs)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [service.id, companyId, service.nameEn, service.nameFa, service.nameTr, service.defaultPrice, service.legalCosts]);
    }

    // Create default expense categories
    const expenseCategories = [
      { id: 'exp_cat_1', nameEn: 'Office Supplies', nameFa: 'لوازم اداری', nameTr: 'Ofis Malzemeleri' },
      { id: 'exp_cat_2', nameEn: 'Travel & Transportation', nameFa: 'سفر و حمل و نقل', nameTr: 'Seyahat ve Ulaşım' },
      { id: 'exp_cat_3', nameEn: 'Utilities', nameFa: 'خدمات شهری', nameTr: 'Kamu Hizmetleri' },
      { id: 'exp_cat_4', nameEn: 'Marketing', nameFa: 'بازاریابی', nameTr: 'Pazarlama' },
      { id: 'exp_cat_5', nameEn: 'Legal Fees', nameFa: 'هزینه های حقوقی', nameTr: 'Hukuki Ücretler' }
    ];

    for (const category of expenseCategories) {
      await pool.execute(`
        INSERT IGNORE INTO expense_categories (id, company_id, name_en, name_fa, name_tr)
        VALUES (?, ?, ?, ?, ?)
      `, [category.id, companyId, category.nameEn, category.nameFa, category.nameTr]);
    }

    // Create sample notifications
    const notifications = [
      { id: 'notif1', message: 'Kamran completed the financial report for Q3.', isRead: false, employeeId: null },
      { id: 'notif2', message: 'New customer registration: Innovate Group', isRead: true, employeeId: null },
      { id: 'notif3', message: 'Reza added a payment for a client.', isRead: false, employeeId: null }
    ];

    for (const notification of notifications) {
      await pool.execute(`
        INSERT IGNORE INTO notifications (id, company_id, message, is_read, employee_id)
        VALUES (?, ?, ?, ?, ?)
      `, [notification.id, companyId, notification.message, notification.isRead, notification.employeeId]);
    }

    console.log('✅ Database seeding completed successfully!');
    console.log('📋 Default login credentials:');
    console.log('   Manager - Name: Kamran, Password: password123');
    console.log('   Employee - Name: Reza, Password: password123');
    console.log('   Employee - Name: Linda, Password: password123');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
};

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedData()
    .then(() => {
      console.log('Seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

export { seedData };