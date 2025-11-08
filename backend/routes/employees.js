import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireManager, requireEmployeeAccess } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Get all employees for the company
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [employees] = await pool.execute(`
      SELECT e.id, e.name, e.role, e.avatar_url, e.default_commission_rate,
             e.monthly_salary, e.salary_due_date, e.outstanding_balance,
             e.cash_account_id, e.default_language, e.created_at,
             a.name as cash_account_name
      FROM employees e
      LEFT JOIN accounts a ON e.cash_account_id = a.id
      WHERE e.company_id = ? AND e.deleted_at IS NULL
      ORDER BY e.role DESC, e.name
    `, [req.user.companyId]);

    res.json({ employees });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get employee by ID
router.get('/:id', authenticateToken, requireEmployeeAccess, async (req, res) => {
  try {
    const [employees] = await pool.execute(`
      SELECT e.id, e.name, e.role, e.avatar_url, e.default_commission_rate,
             e.monthly_salary, e.salary_due_date, e.outstanding_balance,
             e.cash_account_id, e.default_language, e.created_at,
             a.name as cash_account_name
      FROM employees e
      LEFT JOIN accounts a ON e.cash_account_id = a.id
      WHERE e.id = ? AND e.company_id = ? AND e.deleted_at IS NULL
    `, [req.params.id, req.user.companyId]);

    if (employees.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ employee: employees[0] });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new employee (Manager only)
router.post('/', 
  authenticateToken, 
  requireManager,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('role').isIn(['Manager', 'Employee']).withMessage('Valid role is required'),
    body('defaultCommissionRate').isFloat({ min: 0, max: 100 }).withMessage('Commission rate must be between 0 and 100'),
    body('monthlySalary').isFloat({ min: 0 }).withMessage('Monthly salary must be positive'),
    body('salaryDueDate').optional().trim(),
    body('defaultLanguage').optional().isIn(['en', 'fa', 'tr']),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        name,
        role,
        avatarUrl,
        defaultCommissionRate,
        monthlySalary,
        salaryDueDate,
        defaultLanguage,
        password
      } = req.body;

      const employeeId = `emp${Date.now()}`;
      const passwordHash = await bcrypt.hash(password, 10);

      // Create cash account for employee
      const cashAccountId = `acc_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
      
      await pool.execute(`
        INSERT INTO accounts (id, company_id, name, type, currency, balance, owner_employee_id)
        VALUES (?, ?, ?, 'Cash', 'TRY', 0, ?)
      `, [cashAccountId, req.user.companyId, `${name}'s Cash Wallet`, employeeId]);

      // Create employee
      await pool.execute(`
        INSERT INTO employees 
        (id, company_id, name, role, avatar_url, default_commission_rate, monthly_salary,
         salary_due_date, outstanding_balance, cash_account_id, default_language, password_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
      `, [
        employeeId,
        req.user.companyId,
        name,
        role,
        avatarUrl || `https://picsum.photos/seed/${name}/40/40`,
        defaultCommissionRate || 0,
        monthlySalary || 0,
        salaryDueDate || '',
        cashAccountId,
        defaultLanguage || 'en',
        passwordHash
      ]);

      // Log action
      await pool.execute(`
        INSERT INTO audit_log (id, company_id, user_id, user_name, action)
        VALUES (?, ?, ?, ?, ?)
      `, [
        `log_${Date.now()}`,
        req.user.companyId,
        req.user.id,
        req.user.name,
        `Created new employee: ${name}`
      ]);

      // Get the created employee
      const [employees] = await pool.execute(`
        SELECT e.id, e.name, e.role, e.avatar_url, e.default_commission_rate,
               e.monthly_salary, e.salary_due_date, e.outstanding_balance,
               e.cash_account_id, e.default_language, e.created_at,
               a.name as cash_account_name
        FROM employees e
        LEFT JOIN accounts a ON e.cash_account_id = a.id
        WHERE e.id = ?
      `, [employeeId]);

      res.status(201).json({ 
        message: 'Employee created successfully',
        employee: employees[0]
      });

    } catch (error) {
      console.error('Create employee error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update employee
router.put('/:id',
  authenticateToken,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('role').optional().isIn(['Manager', 'Employee']).withMessage('Valid role is required'),
    body('defaultCommissionRate').optional().isFloat({ min: 0, max: 100 }).withMessage('Commission rate must be between 0 and 100'),
    body('monthlySalary').optional().isFloat({ min: 0 }).withMessage('Monthly salary must be positive'),
    body('defaultLanguage').optional().isIn(['en', 'fa', 'tr']),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const employeeId = req.params.id;
      
      // Check if user can edit this employee
      if (req.user.role !== 'Manager' && req.user.id !== employeeId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get current employee
      const [currentEmployee] = await pool.execute(
        'SELECT * FROM employees WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
        [employeeId, req.user.companyId]
      );

      if (currentEmployee.length === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      const updateFields = [];
      const updateValues = [];

      // Build dynamic update query
      for (const [key, value] of Object.entries(req.body)) {
        if (value !== undefined) {
          switch (key) {
            case 'name':
              updateFields.push('name = ?');
              updateValues.push(value);
              break;
            case 'role':
              // Only managers can change roles
              if (req.user.role === 'Manager') {
                updateFields.push('role = ?');
                updateValues.push(value);
              }
              break;
            case 'avatarUrl':
              updateFields.push('avatar_url = ?');
              updateValues.push(value);
              break;
            case 'defaultCommissionRate':
              updateFields.push('default_commission_rate = ?');
              updateValues.push(value);
              break;
            case 'monthlySalary':
              updateFields.push('monthly_salary = ?');
              updateValues.push(value);
              break;
            case 'salaryDueDate':
              updateFields.push('salary_due_date = ?');
              updateValues.push(value);
              break;
            case 'outstandingBalance':
              // Only managers can change outstanding balance
              if (req.user.role === 'Manager') {
                updateFields.push('outstanding_balance = ?');
                updateValues.push(value);
              }
              break;
            case 'defaultLanguage':
              updateFields.push('default_language = ?');
              updateValues.push(value);
              break;
            case 'password':
              if (value) {
                updateFields.push('password_hash = ?');
                updateValues.push(await bcrypt.hash(value, 10));
              }
              break;
          }
        }
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(employeeId, req.user.companyId);

      await pool.execute(`
        UPDATE employees 
        SET ${updateFields.join(', ')}
        WHERE id = ? AND company_id = ? AND deleted_at IS NULL
      `, updateValues);

      // Log action
      await pool.execute(`
        INSERT INTO audit_log (id, company_id, user_id, user_name, action)
        VALUES (?, ?, ?, ?, ?)
      `, [
        `log_${Date.now()}`,
        req.user.companyId,
        req.user.id,
        req.user.name,
        `Updated details for employee: ${currentEmployee[0].name}`
      ]);

      // Get updated employee
      const [employees] = await pool.execute(`
        SELECT e.id, e.name, e.role, e.avatar_url, e.default_commission_rate,
               e.monthly_salary, e.salary_due_date, e.outstanding_balance,
               e.cash_account_id, e.default_language, e.updated_at,
               a.name as cash_account_name
        FROM employees e
        LEFT JOIN accounts a ON e.cash_account_id = a.id
        WHERE e.id = ?
      `, [employeeId]);

      res.json({ 
        message: 'Employee updated successfully',
        employee: employees[0]
      });

    } catch (error) {
      console.error('Update employee error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete employee (Manager only)
router.delete('/:id', authenticateToken, requireManager, async (req, res) => {
  try {
    const employeeId = req.params.id;

    // Prevent deleting yourself
    if (employeeId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Get employee info before deletion
    const [employees] = await pool.execute(
      'SELECT name FROM employees WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
      [employeeId, req.user.companyId]
    );

    if (employees.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Soft delete
    await pool.execute(
      'UPDATE employees SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND company_id = ?',
      [employeeId, req.user.companyId]
    );

    // Log action
    await pool.execute(`
      INSERT INTO audit_log (id, company_id, user_id, user_name, action)
      VALUES (?, ?, ?, ?, ?)
    `, [
      `log_${Date.now()}`,
      req.user.companyId,
      req.user.id,
      req.user.name,
      `Deleted employee: ${employees[0].name}`
    ]);

    res.json({ message: 'Employee deleted successfully' });

  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Make payment to employee (Manager only)
router.post('/:id/payment',
  authenticateToken,
  requireManager,
  [
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be positive'),
    body('sourceAccountId').notEmpty().withMessage('Source account is required'),
    body('description').optional().trim(),
    body('category').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const employeeId = req.params.id;
      const { amount, sourceAccountId, description, category } = req.body;

      // Verify employee exists
      const [employees] = await pool.execute(
        'SELECT name, cash_account_id FROM employees WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
        [employeeId, req.user.companyId]
      );

      if (employees.length === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      // Verify source account exists and has sufficient balance
      const [sourceAccounts] = await pool.execute(
        'SELECT balance FROM accounts WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
        [sourceAccountId, req.user.companyId]
      );

      if (sourceAccounts.length === 0) {
        return res.status(404).json({ error: 'Source account not found' });
      }

      if (sourceAccounts[0].balance < amount) {
        return res.status(400).json({ error: 'Insufficient balance in source account' });
      }

      const transactionId = `txn_${Date.now()}`;

      // Create expense transaction
      await pool.execute(`
        INSERT INTO transactions 
        (id, company_id, date, description, amount, type, category, 
         account_id, employee_id, approval_status)
        VALUES (?, ?, CURDATE(), ?, ?, 'Expense', ?, ?, ?, 'Approved')
      `, [
        transactionId,
        req.user.companyId,
        description || `Payment to ${employees[0].name}`,
        amount,
        category || 'Salary',
        sourceAccountId,
        employeeId
      ]);

      // Update account balances
      await pool.execute(
        'UPDATE accounts SET balance = balance - ? WHERE id = ?',
        [amount, sourceAccountId]
      );

      if (employees[0].cash_account_id) {
        await pool.execute(
          'UPDATE accounts SET balance = balance + ? WHERE id = ?',
          [amount, employees[0].cash_account_id]
        );
      }

      // Update employee outstanding balance
      await pool.execute(
        'UPDATE employees SET outstanding_balance = outstanding_balance - ? WHERE id = ?',
        [amount, employeeId]
      );

      // Log action
      await pool.execute(`
        INSERT INTO audit_log (id, company_id, user_id, user_name, action)
        VALUES (?, ?, ?, ?, ?)
      `, [
        `log_${Date.now()}`,
        req.user.companyId,
        req.user.id,
        req.user.name,
        `Made payment to ${employees[0].name}: ${amount}`
      ]);

      res.json({ 
        message: 'Payment made successfully',
        transactionId 
      });

    } catch (error) {
      console.error('Make payment error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;