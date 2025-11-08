import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireManager } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Get all customers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = ['company_id = ?', 'deleted_at IS NULL'];
    let queryParams = [req.user.companyId];

    // Search in name or email
    if (search) {
      whereConditions.push('(name LIKE ? OR email LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.join(' AND ');

    const [customers] = await pool.execute(`
      SELECT c.*, 
             COUNT(t.id) as transaction_count,
             COALESCE(SUM(CASE WHEN t.type = 'Income' THEN t.amount ELSE 0 END), 0) as total_revenue
      FROM customers c
      LEFT JOIN transactions t ON c.id = t.customer_id AND t.deleted_at IS NULL AND t.approval_status = 'Approved'
      WHERE ${whereClause}
      GROUP BY c.id
      ORDER BY c.name
      LIMIT ? OFFSET ?
    `, [...queryParams, parseInt(limit), parseInt(offset)]);

    // Get total count
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total FROM customers WHERE ${whereClause}
    `, queryParams);

    res.json({
      customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get customer by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [customers] = await pool.execute(`
      SELECT c.*, 
             COUNT(t.id) as transaction_count,
             COALESCE(SUM(CASE WHEN t.type = 'Income' THEN t.amount ELSE 0 END), 0) as total_revenue
      FROM customers c
      LEFT JOIN transactions t ON c.id = t.customer_id AND t.deleted_at IS NULL AND t.approval_status = 'Approved'
      WHERE c.id = ? AND c.company_id = ? AND c.deleted_at IS NULL
      GROUP BY c.id
    `, [req.params.id, req.user.companyId]);

    if (customers.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ customer: customers[0] });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new customer
router.post('/',
  authenticateToken,
  [
    body('name').trim().notEmpty().withMessage('Customer name is required'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('phone').optional().trim(),
    body('address').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, phone, address } = req.body;
      const customerId = `cus_${Date.now()}`;

      // Check for duplicate email if provided
      if (email) {
        const [existingCustomers] = await pool.execute(
          'SELECT id FROM customers WHERE email = ? AND company_id = ? AND deleted_at IS NULL',
          [email, req.user.companyId]
        );
        if (existingCustomers.length > 0) {
          return res.status(409).json({ error: 'Customer with this email already exists' });
        }
      }

      await pool.execute(`
        INSERT INTO customers (id, company_id, name, email, phone, address)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        customerId,
        req.user.companyId,
        name,
        email || null,
        phone || null,
        address || null
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
        `Created new customer: ${name}`
      ]);

      // Get the created customer
      const [customers] = await pool.execute(`
        SELECT * FROM customers WHERE id = ?
      `, [customerId]);

      res.status(201).json({
        message: 'Customer created successfully',
        customer: customers[0]
      });

    } catch (error) {
      console.error('Create customer error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update customer
router.put('/:id',
  authenticateToken,
  [
    body('name').optional().trim().notEmpty().withMessage('Customer name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('phone').optional().trim(),
    body('address').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const customerId = req.params.id;

      // Get current customer
      const [currentCustomer] = await pool.execute(
        'SELECT * FROM customers WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
        [customerId, req.user.companyId]
      );

      if (currentCustomer.length === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // Check for duplicate email if provided and different from current
      if (req.body.email && req.body.email !== currentCustomer[0].email) {
        const [existingCustomers] = await pool.execute(
          'SELECT id FROM customers WHERE email = ? AND company_id = ? AND id != ? AND deleted_at IS NULL',
          [req.body.email, req.user.companyId, customerId]
        );
        if (existingCustomers.length > 0) {
          return res.status(409).json({ error: 'Customer with this email already exists' });
        }
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
            case 'email':
              updateFields.push('email = ?');
              updateValues.push(value || null);
              break;
            case 'phone':
              updateFields.push('phone = ?');
              updateValues.push(value || null);
              break;
            case 'address':
              updateFields.push('address = ?');
              updateValues.push(value || null);
              break;
          }
        }
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(customerId, req.user.companyId);

      await pool.execute(`
        UPDATE customers 
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
        `Updated customer: ${currentCustomer[0].name}`
      ]);

      // Get updated customer
      const [customers] = await pool.execute(`
        SELECT * FROM customers WHERE id = ?
      `, [customerId]);

      res.json({
        message: 'Customer updated successfully',
        customer: customers[0]
      });

    } catch (error) {
      console.error('Update customer error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete customer
router.delete('/:id', authenticateToken, requireManager, async (req, res) => {
  try {
    const customerId = req.params.id;

    // Check if customer has transactions
    const [transactions] = await pool.execute(
      'SELECT COUNT(*) as count FROM transactions WHERE customer_id = ? AND deleted_at IS NULL',
      [customerId]
    );

    if (transactions[0].count > 0) {
      return res.status(400).json({ error: 'Cannot delete customer with existing transactions' });
    }

    // Get customer info before deletion
    const [customers] = await pool.execute(
      'SELECT name FROM customers WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
      [customerId, req.user.companyId]
    );

    if (customers.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Soft delete
    await pool.execute(
      'UPDATE customers SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND company_id = ?',
      [customerId, req.user.companyId]
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
      `Deleted customer: ${customers[0].name}`
    ]);

    res.json({ message: 'Customer deleted successfully' });

  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get customer transactions
router.get('/:id/transactions', authenticateToken, async (req, res) => {
  try {
    const customerId = req.params.id;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Verify customer exists
    const [customers] = await pool.execute(
      'SELECT id, name FROM customers WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
      [customerId, req.user.companyId]
    );

    if (customers.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const [transactions] = await pool.execute(`
      SELECT t.*, a.name as account_name, e.name as employee_name
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN employees e ON t.employee_id = e.id
      WHERE t.customer_id = ? AND t.deleted_at IS NULL
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT ? OFFSET ?
    `, [customerId, parseInt(limit), parseInt(offset)]);

    // Get total count
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM transactions WHERE customer_id = ? AND deleted_at IS NULL',
      [customerId]
    );

    res.json({
      customer: customers[0],
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Get customer transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export customers to CSV (Manager only)
router.get('/export/csv', authenticateToken, requireManager, async (req, res) => {
  try {
    const [customers] = await pool.execute(`
      SELECT c.name, c.email, c.phone, c.address, c.created_at,
             COUNT(t.id) as transaction_count,
             COALESCE(SUM(CASE WHEN t.type = 'Income' THEN t.amount ELSE 0 END), 0) as total_revenue
      FROM customers c
      LEFT JOIN transactions t ON c.id = t.customer_id AND t.deleted_at IS NULL AND t.approval_status = 'Approved'
      WHERE c.company_id = ? AND c.deleted_at IS NULL
      GROUP BY c.id
      ORDER BY c.name
    `, [req.user.companyId]);

    // Create CSV content
    const csvHeaders = 'Name,Email,Phone,Address,Created Date,Transaction Count,Total Revenue\n';
    const csvRows = customers.map(customer => 
      `"${customer.name}","${customer.email || ''}","${customer.phone || ''}","${customer.address || ''}","${customer.created_at}","${customer.transaction_count}","${customer.total_revenue}"`
    ).join('\n');

    const csvContent = csvHeaders + csvRows;

    // Log action
    await pool.execute(`
      INSERT INTO audit_log (id, company_id, user_id, user_name, action)
      VALUES (?, ?, ?, ?, ?)
    `, [
      `log_${Date.now()}`,
      req.user.companyId,
      req.user.id,
      req.user.name,
      'Exported customers to CSV'
    ]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=customers-export.csv');
    res.send(csvContent);

  } catch (error) {
    console.error('Export customers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;