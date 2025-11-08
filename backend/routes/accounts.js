import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireManager } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Get all accounts for the company
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT a.*, e.name as owner_name
      FROM accounts a
      LEFT JOIN employees e ON a.owner_employee_id = e.id
      WHERE a.company_id = ? AND a.deleted_at IS NULL
      ORDER BY a.type, a.name
    `;

    // If employee role, filter to show only their cash account and company accounts
    if (req.user.role === 'Employee') {
      query = `
        SELECT a.*, e.name as owner_name
        FROM accounts a
        LEFT JOIN employees e ON a.owner_employee_id = e.id
        WHERE a.company_id = ? AND a.deleted_at IS NULL 
        AND (a.owner_employee_id IS NULL OR a.owner_employee_id = ?)
        ORDER BY a.type, a.name
      `;
    }

    const params = req.user.role === 'Employee' 
      ? [req.user.companyId, req.user.id] 
      : [req.user.companyId];

    const [accounts] = await pool.execute(query, params);

    res.json({ accounts });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get account by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [accounts] = await pool.execute(`
      SELECT a.*, e.name as owner_name
      FROM accounts a
      LEFT JOIN employees e ON a.owner_employee_id = e.id
      WHERE a.id = ? AND a.company_id = ? AND a.deleted_at IS NULL
    `, [req.params.id, req.user.companyId]);

    if (accounts.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Check access for employees
    if (req.user.role === 'Employee' && accounts[0].owner_employee_id && accounts[0].owner_employee_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ account: accounts[0] });
  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new account
router.post('/',
  authenticateToken,
  requireManager,
  [
    body('name').trim().notEmpty().withMessage('Account name is required'),
    body('type').isIn(['Bank', 'Cash']).withMessage('Valid account type is required'),
    body('currency').isIn(['TRY', 'USD', 'EUR']).withMessage('Valid currency is required'),
    body('balance').isFloat({ min: 0 }).withMessage('Balance must be positive'),
    body('accountNumber').optional().trim(),
    body('ownerEmployeeId').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, type, currency, balance, accountNumber, ownerEmployeeId } = req.body;
      const accountId = `acc_${Date.now()}`;

      // Verify owner employee exists if provided
      if (ownerEmployeeId) {
        const [employees] = await pool.execute(
          'SELECT id FROM employees WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
          [ownerEmployeeId, req.user.companyId]
        );
        if (employees.length === 0) {
          return res.status(400).json({ error: 'Owner employee not found' });
        }
      }

      await pool.execute(`
        INSERT INTO accounts (id, company_id, name, type, currency, balance, account_number, owner_employee_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        accountId,
        req.user.companyId,
        name,
        type,
        currency,
        balance || 0,
        accountNumber || null,
        ownerEmployeeId || null
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
        `Created new account: ${name}`
      ]);

      // Get the created account
      const [accounts] = await pool.execute(`
        SELECT a.*, e.name as owner_name
        FROM accounts a
        LEFT JOIN employees e ON a.owner_employee_id = e.id
        WHERE a.id = ?
      `, [accountId]);

      res.status(201).json({
        message: 'Account created successfully',
        account: accounts[0]
      });

    } catch (error) {
      console.error('Create account error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update account
router.put('/:id',
  authenticateToken,
  requireManager,
  [
    body('name').optional().trim().notEmpty().withMessage('Account name cannot be empty'),
    body('type').optional().isIn(['Bank', 'Cash']).withMessage('Valid account type is required'),
    body('currency').optional().isIn(['TRY', 'USD', 'EUR']).withMessage('Valid currency is required'),
    body('balance').optional().isFloat({ min: 0 }).withMessage('Balance must be positive'),
    body('accountNumber').optional().trim(),
    body('ownerEmployeeId').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const accountId = req.params.id;

      // Get current account
      const [currentAccount] = await pool.execute(
        'SELECT * FROM accounts WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
        [accountId, req.user.companyId]
      );

      if (currentAccount.length === 0) {
        return res.status(404).json({ error: 'Account not found' });
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
            case 'type':
              updateFields.push('type = ?');
              updateValues.push(value);
              break;
            case 'currency':
              updateFields.push('currency = ?');
              updateValues.push(value);
              break;
            case 'balance':
              updateFields.push('balance = ?');
              updateValues.push(value);
              break;
            case 'accountNumber':
              updateFields.push('account_number = ?');
              updateValues.push(value);
              break;
            case 'ownerEmployeeId':
              // Verify employee exists if provided
              if (value) {
                const [employees] = await pool.execute(
                  'SELECT id FROM employees WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
                  [value, req.user.companyId]
                );
                if (employees.length === 0) {
                  return res.status(400).json({ error: 'Owner employee not found' });
                }
              }
              updateFields.push('owner_employee_id = ?');
              updateValues.push(value || null);
              break;
          }
        }
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(accountId, req.user.companyId);

      await pool.execute(`
        UPDATE accounts 
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
        `Updated account: ${currentAccount[0].name}`
      ]);

      // Get updated account
      const [accounts] = await pool.execute(`
        SELECT a.*, e.name as owner_name
        FROM accounts a
        LEFT JOIN employees e ON a.owner_employee_id = e.id
        WHERE a.id = ?
      `, [accountId]);

      res.json({
        message: 'Account updated successfully',
        account: accounts[0]
      });

    } catch (error) {
      console.error('Update account error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete account
router.delete('/:id', authenticateToken, requireManager, async (req, res) => {
  try {
    const accountId = req.params.id;

    // Check if account has transactions
    const [transactions] = await pool.execute(
      'SELECT COUNT(*) as count FROM transactions WHERE account_id = ? AND deleted_at IS NULL',
      [accountId]
    );

    if (transactions[0].count > 0) {
      return res.status(400).json({ error: 'Cannot delete account with existing transactions' });
    }

    // Get account info before deletion
    const [accounts] = await pool.execute(
      'SELECT name FROM accounts WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
      [accountId, req.user.companyId]
    );

    if (accounts.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Soft delete
    await pool.execute(
      'UPDATE accounts SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND company_id = ?',
      [accountId, req.user.companyId]
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
      `Deleted account: ${accounts[0].name}`
    ]);

    res.json({ message: 'Account deleted successfully' });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Transfer between accounts
router.post('/transfer',
  authenticateToken,
  requireManager,
  [
    body('fromAccountId').notEmpty().withMessage('Source account is required'),
    body('toAccountId').notEmpty().withMessage('Destination account is required'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be positive'),
    body('description').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { fromAccountId, toAccountId, amount, description } = req.body;

      if (fromAccountId === toAccountId) {
        return res.status(400).json({ error: 'Cannot transfer to the same account' });
      }

      // Verify both accounts exist and get their details
      const [accounts] = await pool.execute(`
        SELECT id, name, balance, currency FROM accounts 
        WHERE id IN (?, ?) AND company_id = ? AND deleted_at IS NULL
      `, [fromAccountId, toAccountId, req.user.companyId]);

      if (accounts.length !== 2) {
        return res.status(404).json({ error: 'One or both accounts not found' });
      }

      const fromAccount = accounts.find(a => a.id === fromAccountId);
      const toAccount = accounts.find(a => a.id === toAccountId);

      // Check sufficient balance
      if (fromAccount.balance < amount) {
        return res.status(400).json({ error: 'Insufficient balance in source account' });
      }

      // Warn if currencies are different
      if (fromAccount.currency !== toAccount.currency) {
        console.warn(`Currency mismatch in transfer: ${fromAccount.currency} to ${toAccount.currency}`);
      }

      // Perform transfer
      await pool.execute('START TRANSACTION');

      try {
        // Update account balances
        await pool.execute(
          'UPDATE accounts SET balance = balance - ? WHERE id = ?',
          [amount, fromAccountId]
        );

        await pool.execute(
          'UPDATE accounts SET balance = balance + ? WHERE id = ?',
          [amount, toAccountId]
        );

        // Create transfer transactions
        const timestamp = Date.now();
        const transferDescription = description || `Transfer from ${fromAccount.name} to ${toAccount.name}`;

        // Outgoing transaction
        await pool.execute(`
          INSERT INTO transactions 
          (id, company_id, date, description, amount, type, category, account_id, approval_status)
          VALUES (?, ?, CURDATE(), ?, ?, 'Expense', 'Transfer', ?, 'Approved')
        `, [
          `txn_out_${timestamp}`,
          req.user.companyId,
          transferDescription,
          amount,
          fromAccountId
        ]);

        // Incoming transaction
        await pool.execute(`
          INSERT INTO transactions 
          (id, company_id, date, description, amount, type, category, account_id, approval_status)
          VALUES (?, ?, CURDATE(), ?, ?, 'Income', 'Transfer', ?, 'Approved')
        `, [
          `txn_in_${timestamp}`,
          req.user.companyId,
          transferDescription,
          amount,
          toAccountId
        ]);

        await pool.execute('COMMIT');

        // Log action
        await pool.execute(`
          INSERT INTO audit_log (id, company_id, user_id, user_name, action)
          VALUES (?, ?, ?, ?, ?)
        `, [
          `log_${Date.now()}`,
          req.user.companyId,
          req.user.id,
          req.user.name,
          `Transferred ${amount} from ${fromAccount.name} to ${toAccount.name}`
        ]);

        res.json({
          message: 'Transfer completed successfully',
          transfer: {
            from: fromAccount.name,
            to: toAccount.name,
            amount,
            description: transferDescription
          }
        });

      } catch (error) {
        await pool.execute('ROLLBACK');
        throw error;
      }

    } catch (error) {
      console.error('Transfer error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get account transaction history
router.get('/:id/transactions', authenticateToken, async (req, res) => {
  try {
    const accountId = req.params.id;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Verify account access
    const [accounts] = await pool.execute(`
      SELECT id, name, owner_employee_id FROM accounts 
      WHERE id = ? AND company_id = ? AND deleted_at IS NULL
    `, [accountId, req.user.companyId]);

    if (accounts.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Check access for employees
    if (req.user.role === 'Employee' && accounts[0].owner_employee_id && accounts[0].owner_employee_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [transactions] = await pool.execute(`
      SELECT t.*, c.name as customer_name, e.name as employee_name
      FROM transactions t
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN employees e ON t.employee_id = e.id
      WHERE t.account_id = ? AND t.deleted_at IS NULL
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT ? OFFSET ?
    `, [accountId, parseInt(limit), parseInt(offset)]);

    // Get total count
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM transactions WHERE account_id = ? AND deleted_at IS NULL',
      [accountId]
    );

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Get account transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;