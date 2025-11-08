import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { body, validationResult } from 'express-validator';
import { authLimiter } from '../middleware/rateLimiting.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Login endpoint
router.post('/login', 
  authLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body('companyId').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, password, companyId } = req.body;
      
      // Query for employee by name (and optionally company)
      let query = `
        SELECT e.*, c.name as company_name 
        FROM employees e 
        JOIN companies c ON e.company_id = c.id 
        WHERE e.name = ? AND e.deleted_at IS NULL
      `;
      let params = [name];
      
      if (companyId) {
        query += ' AND e.company_id = ?';
        params.push(companyId);
      }

      const [employees] = await pool.execute(query, params);

      if (employees.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const employee = employees[0];
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, employee.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Create JWT token
      const token = jwt.sign(
        { 
          userId: employee.id, 
          companyId: employee.company_id,
          role: employee.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Log the login action
      await pool.execute(`
        INSERT INTO audit_log (id, company_id, user_id, user_name, action)
        VALUES (?, ?, ?, ?, ?)
      `, [
        `log_${Date.now()}`,
        employee.company_id,
        employee.id,
        employee.name,
        'Logged in'
      ]);

      // Return user info and token (excluding password)
      const { password_hash, ...userWithoutPassword } = employee;
      
      res.json({
        message: 'Login successful',
        token,
        user: {
          id: userWithoutPassword.id,
          name: userWithoutPassword.name,
          role: userWithoutPassword.role,
          companyId: userWithoutPassword.company_id,
          companyName: userWithoutPassword.company_name,
          avatarUrl: userWithoutPassword.avatar_url,
          defaultCommissionRate: userWithoutPassword.default_commission_rate,
          monthlySalary: userWithoutPassword.monthly_salary,
          salaryDueDate: userWithoutPassword.salary_due_date,
          outstandingBalance: userWithoutPassword.outstanding_balance,
          cashAccountId: userWithoutPassword.cash_account_id,
          defaultLanguage: userWithoutPassword.default_language
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get current user info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.execute(`
      SELECT e.*, c.name as company_name 
      FROM employees e 
      JOIN companies c ON e.company_id = c.id 
      WHERE e.id = ? AND e.deleted_at IS NULL
    `, [req.user.id]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password_hash, ...userWithoutPassword } = users[0];
    
    res.json({
      user: {
        id: userWithoutPassword.id,
        name: userWithoutPassword.name,
        role: userWithoutPassword.role,
        companyId: userWithoutPassword.company_id,
        companyName: userWithoutPassword.company_name,
        avatarUrl: userWithoutPassword.avatar_url,
        defaultCommissionRate: userWithoutPassword.default_commission_rate,
        monthlySalary: userWithoutPassword.monthly_salary,
        salaryDueDate: userWithoutPassword.salary_due_date,
        outstandingBalance: userWithoutPassword.outstanding_balance,
        cashAccountId: userWithoutPassword.cash_account_id,
        defaultLanguage: userWithoutPassword.default_language
      }
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.put('/change-password',
  authenticateToken,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { currentPassword, newPassword } = req.body;

      // Get current user password
      const [users] = await pool.execute(
        'SELECT password_hash FROM employees WHERE id = ?',
        [req.user.id]
      );

      if (users.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, users[0].password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Update password
      await pool.execute(
        'UPDATE employees SET password_hash = ? WHERE id = ?',
        [newPasswordHash, req.user.id]
      );

      // Log the action
      await pool.execute(`
        INSERT INTO audit_log (id, company_id, user_id, user_name, action)
        VALUES (?, ?, ?, ?, ?)
      `, [
        `log_${Date.now()}`,
        req.user.companyId,
        req.user.id,
        req.user.name,
        'Changed password'
      ]);

      res.json({ message: 'Password changed successfully' });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Logout (optional - client handles token removal)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Log the logout action
    await pool.execute(`
      INSERT INTO audit_log (id, company_id, user_id, user_name, action)
      VALUES (?, ?, ?, ?, ?)
    `, [
      `log_${Date.now()}`,
      req.user.companyId,
      req.user.id,
      req.user.name,
      'Logged out'
    ]);

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get list of companies (for multi-tenant support)
router.get('/companies', async (req, res) => {
  try {
    const [companies] = await pool.execute(
      'SELECT id, name FROM companies ORDER BY name'
    );

    res.json({ companies });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;