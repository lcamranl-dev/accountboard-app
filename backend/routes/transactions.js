import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireManager } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Get all transactions
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, type, status, startDate, endDate, search } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = ['t.company_id = ?', 't.deleted_at IS NULL'];
    let queryParams = [req.user.companyId];

    // Filter by type
    if (type && ['Income', 'Expense'].includes(type)) {
      whereConditions.push('t.type = ?');
      queryParams.push(type);
    }

    // Filter by approval status
    if (status && ['Pending', 'Approved'].includes(status)) {
      whereConditions.push('t.approval_status = ?');
      queryParams.push(status);
    }

    // Filter by date range
    if (startDate) {
      whereConditions.push('t.date >= ?');
      queryParams.push(startDate);
    }
    if (endDate) {
      whereConditions.push('t.date <= ?');
      queryParams.push(endDate);
    }

    // Search in description
    if (search) {
      whereConditions.push('(t.description LIKE ? OR c.name LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    // For employees, only show their own transactions or approved ones
    if (req.user.role === 'Employee') {
      whereConditions.push('(t.employee_id = ? OR t.approval_status = "Approved")');
      queryParams.push(req.user.id);
    }

    const whereClause = whereConditions.join(' AND ');

    const [transactions] = await pool.execute(`
      SELECT t.*, 
             c.name as customer_name,
             a.name as account_name,
             e.name as employee_name,
             col.name as collaborator_name
      FROM transactions t
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN employees e ON t.employee_id = e.id
      LEFT JOIN collaborators col ON t.collaborator_id = col.id
      WHERE ${whereClause}
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, parseInt(limit), parseInt(offset)]);

    // Get line items for income transactions
    for (const transaction of transactions) {
      if (transaction.type === 'Income') {
        const [lineItems] = await pool.execute(`
          SELECT li.*, s.name_en, s.name_fa, s.name_tr,
                 e.name as employee_name, col.name as collaborator_name
          FROM line_items li
          LEFT JOIN services s ON li.service_id = s.id
          LEFT JOIN employees e ON li.employee_id = e.id
          LEFT JOIN collaborators col ON li.collaborator_id = col.id
          WHERE li.transaction_id = ?
        `, [transaction.id]);

        const [payments] = await pool.execute(`
          SELECT p.*, a.name as account_name
          FROM payments p
          LEFT JOIN accounts a ON p.account_id = a.id
          WHERE p.transaction_id = ?
          ORDER BY p.date
        `, [transaction.id]);

        transaction.items = lineItems;
        transaction.payments = payments;
      }
    }

    // Get total count
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total 
      FROM transactions t
      LEFT JOIN customers c ON t.customer_id = c.id
      WHERE ${whereClause}
    `, queryParams);

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
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get transaction by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [transactions] = await pool.execute(`
      SELECT t.*, 
             c.name as customer_name,
             a.name as account_name,
             e.name as employee_name,
             col.name as collaborator_name
      FROM transactions t
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN employees e ON t.employee_id = e.id
      LEFT JOIN collaborators col ON t.collaborator_id = col.id
      WHERE t.id = ? AND t.company_id = ? AND t.deleted_at IS NULL
    `, [req.params.id, req.user.companyId]);

    if (transactions.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = transactions[0];

    // Check access for employees
    if (req.user.role === 'Employee' && transaction.employee_id !== req.user.id && transaction.approval_status === 'Pending') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get line items for income transactions
    if (transaction.type === 'Income') {
      const [lineItems] = await pool.execute(`
        SELECT li.*, s.name_en, s.name_fa, s.name_tr,
               e.name as employee_name, col.name as collaborator_name
        FROM line_items li
        LEFT JOIN services s ON li.service_id = s.id
        LEFT JOIN employees e ON li.employee_id = e.id
        LEFT JOIN collaborators col ON li.collaborator_id = col.id
        WHERE li.transaction_id = ?
      `, [transaction.id]);

      const [payments] = await pool.execute(`
        SELECT p.*, a.name as account_name
        FROM payments p
        LEFT JOIN accounts a ON p.account_id = a.id
        WHERE p.transaction_id = ?
        ORDER BY p.date
      `, [transaction.id]);

      transaction.items = lineItems;
      transaction.payments = payments;
    }

    res.json({ transaction });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new transaction
router.post('/',
  authenticateToken,
  [
    body('date').isISO8601().withMessage('Valid date is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be positive'),
    body('type').isIn(['Income', 'Expense']).withMessage('Valid type is required'),
    body('category').optional().trim(),
    body('customerId').optional().trim(),
    body('accountId').optional().trim(),
    body('employeeId').optional().trim(),
    body('collaboratorId').optional().trim(),
    body('items').optional().isArray().withMessage('Items must be an array'),
    body('paymentStatus').optional().isIn(['Paid', 'Partial', 'Due'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        date,
        description,
        amount,
        type,
        category,
        internalNotes,
        customerId,
        accountId,
        employeeId,
        collaboratorId,
        items,
        paymentStatus
      } = req.body;

      const transactionId = `txn_${Date.now()}`;
      const approvalStatus = req.user.role === 'Manager' ? 'Approved' : 'Pending';

      // Validate foreign keys
      if (customerId) {
        const [customers] = await pool.execute(
          'SELECT id FROM customers WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
          [customerId, req.user.companyId]
        );
        if (customers.length === 0) {
          return res.status(400).json({ error: 'Customer not found' });
        }
      }

      if (accountId) {
        const [accounts] = await pool.execute(
          'SELECT id, balance FROM accounts WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
          [accountId, req.user.companyId]
        );
        if (accounts.length === 0) {
          return res.status(400).json({ error: 'Account not found' });
        }

        // Check sufficient balance for expenses
        if (type === 'Expense' && accounts[0].balance < amount) {
          return res.status(400).json({ error: 'Insufficient account balance' });
        }
      }

      if (employeeId) {
        const [employees] = await pool.execute(
          'SELECT id FROM employees WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
          [employeeId, req.user.companyId]
        );
        if (employees.length === 0) {
          return res.status(400).json({ error: 'Employee not found' });
        }
      }

      if (collaboratorId) {
        const [collaborators] = await pool.execute(
          'SELECT id FROM collaborators WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
          [collaboratorId, req.user.companyId]
        );
        if (collaborators.length === 0) {
          return res.status(400).json({ error: 'Collaborator not found' });
        }
      }

      await pool.execute('START TRANSACTION');

      try {
        // Create transaction
        await pool.execute(`
          INSERT INTO transactions 
          (id, company_id, date, description, amount, type, category, internal_notes,
           approval_status, customer_id, account_id, employee_id, collaborator_id, payment_status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          transactionId,
          req.user.companyId,
          date,
          description,
          amount,
          type,
          category || '',
          internalNotes || '',
          approvalStatus,
          customerId || null,
          accountId || null,
          employeeId || req.user.id,
          collaboratorId || null,
          paymentStatus || 'Due'
        ]);

        // Create line items for income transactions
        if (type === 'Income' && items && items.length > 0) {
          for (const item of items) {
            const lineItemId = `li_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            await pool.execute(`
              INSERT INTO line_items 
              (id, transaction_id, service_id, description, subtotal, legal_costs, 
               vat_rate, vat_amount, employee_id, commission_rate, commission_amount,
               collaborator_id, collaborator_fee)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              lineItemId,
              transactionId,
              item.serviceId,
              item.description || '',
              item.subtotal || 0,
              item.legalCosts || 0,
              item.vatRate || 0,
              item.vatAmount || 0,
              item.employeeId || null,
              item.commissionRate || 0,
              item.commissionAmount || 0,
              item.collaboratorId || null,
              item.collaboratorFee || 0
            ]);
          }
        }

        // Update account balance if approved and account is specified
        if (approvalStatus === 'Approved' && accountId) {
          if (type === 'Income') {
            await pool.execute(
              'UPDATE accounts SET balance = balance + ? WHERE id = ?',
              [amount, accountId]
            );
          } else {
            await pool.execute(
              'UPDATE accounts SET balance = balance - ? WHERE id = ?',
              [amount, accountId]
            );
          }
        }

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
          `Created ${type.toLowerCase()} transaction: ${description} (${amount})`
        ]);

        // Get the created transaction
        const [newTransaction] = await pool.execute(`
          SELECT t.*, 
                 c.name as customer_name,
                 a.name as account_name,
                 e.name as employee_name,
                 col.name as collaborator_name
          FROM transactions t
          LEFT JOIN customers c ON t.customer_id = c.id
          LEFT JOIN accounts a ON t.account_id = a.id
          LEFT JOIN employees e ON t.employee_id = e.id
          LEFT JOIN collaborators col ON t.collaborator_id = col.id
          WHERE t.id = ?
        `, [transactionId]);

        res.status(201).json({
          message: 'Transaction created successfully',
          transaction: newTransaction[0]
        });

      } catch (error) {
        await pool.execute('ROLLBACK');
        throw error;
      }

    } catch (error) {
      console.error('Create transaction error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update transaction
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const transactionId = req.params.id;

    // Get current transaction
    const [currentTransaction] = await pool.execute(
      'SELECT * FROM transactions WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
      [transactionId, req.user.companyId]
    );

    if (currentTransaction.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = currentTransaction[0];

    // Check permissions
    if (req.user.role === 'Employee' && transaction.employee_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only allow updates to pending transactions or if user is manager
    if (transaction.approval_status === 'Approved' && req.user.role !== 'Manager') {
      return res.status(403).json({ error: 'Cannot edit approved transaction' });
    }

    const updateFields = [];
    const updateValues = [];

    // Build dynamic update query
    for (const [key, value] of Object.entries(req.body)) {
      if (value !== undefined) {
        switch (key) {
          case 'date':
            updateFields.push('date = ?');
            updateValues.push(value);
            break;
          case 'description':
            updateFields.push('description = ?');
            updateValues.push(value);
            break;
          case 'amount':
            updateFields.push('amount = ?');
            updateValues.push(parseFloat(value));
            break;
          case 'category':
            updateFields.push('category = ?');
            updateValues.push(value);
            break;
          case 'internalNotes':
            updateFields.push('internal_notes = ?');
            updateValues.push(value);
            break;
          case 'customerId':
            updateFields.push('customer_id = ?');
            updateValues.push(value || null);
            break;
          case 'accountId':
            updateFields.push('account_id = ?');
            updateValues.push(value || null);
            break;
          case 'paymentStatus':
            updateFields.push('payment_status = ?');
            updateValues.push(value);
            break;
        }
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(transactionId, req.user.companyId);

    await pool.execute(`
      UPDATE transactions 
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
      `Updated transaction: ${transaction.description}`
    ]);

    res.json({ message: 'Transaction updated successfully' });

  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve/reject transaction (Manager only)
router.put('/:id/approval',
  authenticateToken,
  requireManager,
  [
    body('status').isIn(['Approved', 'Pending']).withMessage('Valid status is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const transactionId = req.params.id;
      const { status } = req.body;

      // Get current transaction
      const [transactions] = await pool.execute(
        'SELECT * FROM transactions WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
        [transactionId, req.user.companyId]
      );

      if (transactions.length === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      const transaction = transactions[0];

      await pool.execute('START TRANSACTION');

      try {
        // Update approval status
        await pool.execute(
          'UPDATE transactions SET approval_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [status, transactionId]
        );

        // Update account balance if being approved
        if (status === 'Approved' && transaction.approval_status === 'Pending' && transaction.account_id) {
          if (transaction.type === 'Income') {
            await pool.execute(
              'UPDATE accounts SET balance = balance + ? WHERE id = ?',
              [transaction.amount, transaction.account_id]
            );
          } else {
            await pool.execute(
              'UPDATE accounts SET balance = balance - ? WHERE id = ?',
              [transaction.amount, transaction.account_id]
            );
          }
        }

        // Reverse account balance if being unapproved
        if (status === 'Pending' && transaction.approval_status === 'Approved' && transaction.account_id) {
          if (transaction.type === 'Income') {
            await pool.execute(
              'UPDATE accounts SET balance = balance - ? WHERE id = ?',
              [transaction.amount, transaction.account_id]
            );
          } else {
            await pool.execute(
              'UPDATE accounts SET balance = balance + ? WHERE id = ?',
              [transaction.amount, transaction.account_id]
            );
          }
        }

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
          `${status === 'Approved' ? 'Approved' : 'Rejected'} transaction: ${transaction.description}`
        ]);

        res.json({ message: `Transaction ${status.toLowerCase()} successfully` });

      } catch (error) {
        await pool.execute('ROLLBACK');
        throw error;
      }

    } catch (error) {
      console.error('Approve transaction error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete transaction
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const transactionId = req.params.id;

    // Get transaction info
    const [transactions] = await pool.execute(
      'SELECT * FROM transactions WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
      [transactionId, req.user.companyId]
    );

    if (transactions.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = transactions[0];

    // Check permissions
    if (req.user.role === 'Employee' && transaction.employee_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only managers can delete approved transactions
    if (transaction.approval_status === 'Approved' && req.user.role !== 'Manager') {
      return res.status(403).json({ error: 'Cannot delete approved transaction' });
    }

    await pool.execute('START TRANSACTION');

    try {
      // Reverse account balance if transaction was approved
      if (transaction.approval_status === 'Approved' && transaction.account_id) {
        if (transaction.type === 'Income') {
          await pool.execute(
            'UPDATE accounts SET balance = balance - ? WHERE id = ?',
            [transaction.amount, transaction.account_id]
          );
        } else {
          await pool.execute(
            'UPDATE accounts SET balance = balance + ? WHERE id = ?',
            [transaction.amount, transaction.account_id]
          );
        }
      }

      // Soft delete transaction
      await pool.execute(
        'UPDATE transactions SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?',
        [transactionId]
      );

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
        `Deleted transaction: ${transaction.description}`
      ]);

      res.json({ message: 'Transaction deleted successfully' });

    } catch (error) {
      await pool.execute('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add payment to transaction
router.post('/:id/payments',
  authenticateToken,
  [
    body('date').isISO8601().withMessage('Valid date is required'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be positive'),
    body('accountId').notEmpty().withMessage('Account is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const transactionId = req.params.id;
      const { date, amount, accountId } = req.body;

      // Verify transaction exists and is income type
      const [transactions] = await pool.execute(
        'SELECT * FROM transactions WHERE id = ? AND company_id = ? AND type = "Income" AND deleted_at IS NULL',
        [transactionId, req.user.companyId]
      );

      if (transactions.length === 0) {
        return res.status(404).json({ error: 'Income transaction not found' });
      }

      // Verify account exists
      const [accounts] = await pool.execute(
        'SELECT id FROM accounts WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
        [accountId, req.user.companyId]
      );

      if (accounts.length === 0) {
        return res.status(404).json({ error: 'Account not found' });
      }

      const paymentId = `pay_${Date.now()}`;

      // Create payment
      await pool.execute(`
        INSERT INTO payments (id, transaction_id, date, amount, account_id)
        VALUES (?, ?, ?, ?, ?)
      `, [paymentId, transactionId, date, amount, accountId]);

      // Update account balance
      await pool.execute(
        'UPDATE accounts SET balance = balance + ? WHERE id = ?',
        [amount, accountId]
      );

      // Calculate total payments and update transaction payment status
      const [paymentSummary] = await pool.execute(
        'SELECT SUM(amount) as total_paid FROM payments WHERE transaction_id = ?',
        [transactionId]
      );

      const totalPaid = paymentSummary[0].total_paid || 0;
      const transactionAmount = transactions[0].amount;

      let paymentStatus = 'Due';
      if (totalPaid >= transactionAmount) {
        paymentStatus = 'Paid';
      } else if (totalPaid > 0) {
        paymentStatus = 'Partial';
      }

      await pool.execute(
        'UPDATE transactions SET payment_status = ? WHERE id = ?',
        [paymentStatus, transactionId]
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
        `Added payment of ${amount} to transaction: ${transactions[0].description}`
      ]);

      res.status(201).json({
        message: 'Payment added successfully',
        paymentId,
        paymentStatus
      });

    } catch (error) {
      console.error('Add payment error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;