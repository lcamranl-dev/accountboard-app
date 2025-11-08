import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireManager } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Get all services and expense categories
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [services] = await pool.execute(`
      SELECT s.*, 
             COUNT(li.id) as usage_count,
             COALESCE(SUM(li.subtotal), 0) as total_revenue
      FROM services s
      LEFT JOIN line_items li ON s.id = li.service_id
      LEFT JOIN transactions t ON li.transaction_id = t.id AND t.deleted_at IS NULL AND t.approval_status = 'Approved'
      WHERE s.company_id = ? AND s.deleted_at IS NULL
      GROUP BY s.id
      ORDER BY s.name_en
    `, [req.user.companyId]);

    const [expenseCategories] = await pool.execute(`
      SELECT * FROM expense_categories 
      WHERE company_id = ? AND deleted_at IS NULL
      ORDER BY name_en
    `, [req.user.companyId]);

    res.json({ 
      services,
      expenseCategories 
    });

  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get service by ID
router.get('/services/:id', authenticateToken, async (req, res) => {
  try {
    const [services] = await pool.execute(`
      SELECT s.*, 
             COUNT(li.id) as usage_count,
             COALESCE(SUM(li.subtotal), 0) as total_revenue
      FROM services s
      LEFT JOIN line_items li ON s.id = li.service_id
      LEFT JOIN transactions t ON li.transaction_id = t.id AND t.deleted_at IS NULL AND t.approval_status = 'Approved'
      WHERE s.id = ? AND s.company_id = ? AND s.deleted_at IS NULL
      GROUP BY s.id
    `, [req.params.id, req.user.companyId]);

    if (services.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({ service: services[0] });
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new service
router.post('/services',
  authenticateToken,
  requireManager,
  [
    body('nameEn').trim().notEmpty().withMessage('English name is required'),
    body('nameFa').optional().trim(),
    body('nameTr').optional().trim(),
    body('defaultPrice').isFloat({ min: 0 }).withMessage('Price must be positive'),
    body('legalCosts').optional().isFloat({ min: 0 }).withMessage('Legal costs must be positive')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { nameEn, nameFa, nameTr, defaultPrice, legalCosts } = req.body;
      const serviceId = `srv_${Date.now()}`;

      await pool.execute(`
        INSERT INTO services (id, company_id, name_en, name_fa, name_tr, default_price, legal_costs)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        serviceId,
        req.user.companyId,
        nameEn,
        nameFa || null,
        nameTr || null,
        defaultPrice || 0,
        legalCosts || 0
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
        `Created new service: ${nameEn}`
      ]);

      // Get the created service
      const [services] = await pool.execute(`
        SELECT * FROM services WHERE id = ?
      `, [serviceId]);

      res.status(201).json({
        message: 'Service created successfully',
        service: services[0]
      });

    } catch (error) {
      console.error('Create service error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update service
router.put('/services/:id',
  authenticateToken,
  requireManager,
  [
    body('nameEn').optional().trim().notEmpty().withMessage('English name cannot be empty'),
    body('nameFa').optional().trim(),
    body('nameTr').optional().trim(),
    body('defaultPrice').optional().isFloat({ min: 0 }).withMessage('Price must be positive'),
    body('legalCosts').optional().isFloat({ min: 0 }).withMessage('Legal costs must be positive')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const serviceId = req.params.id;

      // Get current service
      const [currentService] = await pool.execute(
        'SELECT * FROM services WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
        [serviceId, req.user.companyId]
      );

      if (currentService.length === 0) {
        return res.status(404).json({ error: 'Service not found' });
      }

      const updateFields = [];
      const updateValues = [];

      // Build dynamic update query
      for (const [key, value] of Object.entries(req.body)) {
        if (value !== undefined) {
          switch (key) {
            case 'nameEn':
              updateFields.push('name_en = ?');
              updateValues.push(value);
              break;
            case 'nameFa':
              updateFields.push('name_fa = ?');
              updateValues.push(value || null);
              break;
            case 'nameTr':
              updateFields.push('name_tr = ?');
              updateValues.push(value || null);
              break;
            case 'defaultPrice':
              updateFields.push('default_price = ?');
              updateValues.push(value);
              break;
            case 'legalCosts':
              updateFields.push('legal_costs = ?');
              updateValues.push(value);
              break;
          }
        }
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(serviceId, req.user.companyId);

      await pool.execute(`
        UPDATE services 
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
        `Updated service: ${currentService[0].name_en}`
      ]);

      // Get updated service
      const [services] = await pool.execute(`
        SELECT * FROM services WHERE id = ?
      `, [serviceId]);

      res.json({
        message: 'Service updated successfully',
        service: services[0]
      });

    } catch (error) {
      console.error('Update service error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete service
router.delete('/services/:id', authenticateToken, requireManager, async (req, res) => {
  try {
    const serviceId = req.params.id;

    // Check if service is used in any line items
    const [lineItems] = await pool.execute(
      'SELECT COUNT(*) as count FROM line_items WHERE service_id = ?',
      [serviceId]
    );

    if (lineItems[0].count > 0) {
      return res.status(400).json({ error: 'Cannot delete service that is used in transactions' });
    }

    // Get service info before deletion
    const [services] = await pool.execute(
      'SELECT name_en FROM services WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
      [serviceId, req.user.companyId]
    );

    if (services.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Soft delete
    await pool.execute(
      'UPDATE services SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND company_id = ?',
      [serviceId, req.user.companyId]
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
      `Deleted service: ${services[0].name_en}`
    ]);

    res.json({ message: 'Service deleted successfully' });

  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new expense category
router.post('/expense-categories',
  authenticateToken,
  requireManager,
  [
    body('nameEn').trim().notEmpty().withMessage('English name is required'),
    body('nameFa').optional().trim(),
    body('nameTr').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { nameEn, nameFa, nameTr } = req.body;
      const categoryId = `exp_cat_${Date.now()}`;

      await pool.execute(`
        INSERT INTO expense_categories (id, company_id, name_en, name_fa, name_tr)
        VALUES (?, ?, ?, ?, ?)
      `, [
        categoryId,
        req.user.companyId,
        nameEn,
        nameFa || null,
        nameTr || null
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
        `Created expense category: ${nameEn}`
      ]);

      // Get the created category
      const [categories] = await pool.execute(`
        SELECT * FROM expense_categories WHERE id = ?
      `, [categoryId]);

      res.status(201).json({
        message: 'Expense category created successfully',
        expenseCategory: categories[0]
      });

    } catch (error) {
      console.error('Create expense category error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update expense category
router.put('/expense-categories/:id',
  authenticateToken,
  requireManager,
  [
    body('nameEn').optional().trim().notEmpty().withMessage('English name cannot be empty'),
    body('nameFa').optional().trim(),
    body('nameTr').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const categoryId = req.params.id;

      // Get current category
      const [currentCategory] = await pool.execute(
        'SELECT * FROM expense_categories WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
        [categoryId, req.user.companyId]
      );

      if (currentCategory.length === 0) {
        return res.status(404).json({ error: 'Expense category not found' });
      }

      const updateFields = [];
      const updateValues = [];

      // Build dynamic update query
      for (const [key, value] of Object.entries(req.body)) {
        if (value !== undefined) {
          switch (key) {
            case 'nameEn':
              updateFields.push('name_en = ?');
              updateValues.push(value);
              break;
            case 'nameFa':
              updateFields.push('name_fa = ?');
              updateValues.push(value || null);
              break;
            case 'nameTr':
              updateFields.push('name_tr = ?');
              updateValues.push(value || null);
              break;
          }
        }
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(categoryId, req.user.companyId);

      await pool.execute(`
        UPDATE expense_categories 
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
        `Updated expense category: ${currentCategory[0].name_en}`
      ]);

      // Get updated category
      const [categories] = await pool.execute(`
        SELECT * FROM expense_categories WHERE id = ?
      `, [categoryId]);

      res.json({
        message: 'Expense category updated successfully',
        expenseCategory: categories[0]
      });

    } catch (error) {
      console.error('Update expense category error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete expense category
router.delete('/expense-categories/:id', authenticateToken, requireManager, async (req, res) => {
  try {
    const categoryId = req.params.id;

    // Check if category is used in any transactions
    const [transactions] = await pool.execute(
      'SELECT COUNT(*) as count FROM transactions WHERE category = ? AND deleted_at IS NULL',
      [categoryId]
    );

    if (transactions[0].count > 0) {
      return res.status(400).json({ error: 'Cannot delete expense category that is used in transactions' });
    }

    // Get category info before deletion
    const [categories] = await pool.execute(
      'SELECT name_en FROM expense_categories WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
      [categoryId, req.user.companyId]
    );

    if (categories.length === 0) {
      return res.status(404).json({ error: 'Expense category not found' });
    }

    // Soft delete
    await pool.execute(
      'UPDATE expense_categories SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND company_id = ?',
      [categoryId, req.user.companyId]
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
      `Deleted expense category: ${categories[0].name_en}`
    ]);

    res.json({ message: 'Expense category deleted successfully' });

  } catch (error) {
    console.error('Delete expense category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get service usage statistics
router.get('/services/:id/statistics', authenticateToken, async (req, res) => {
  try {
    const serviceId = req.params.id;

    // Verify service exists
    const [services] = await pool.execute(
      'SELECT name_en FROM services WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
      [serviceId, req.user.companyId]
    );

    if (services.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Get usage statistics
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(li.id) as total_usage,
        COALESCE(SUM(li.subtotal), 0) as total_revenue,
        COALESCE(AVG(li.subtotal), 0) as average_price,
        COUNT(DISTINCT t.customer_id) as unique_customers,
        COUNT(DISTINCT li.employee_id) as employees_used
      FROM line_items li
      JOIN transactions t ON li.transaction_id = t.id
      WHERE li.service_id = ? 
        AND t.deleted_at IS NULL 
        AND t.approval_status = 'Approved'
        AND t.company_id = ?
    `, [serviceId, req.user.companyId]);

    // Get monthly usage for the last 12 months
    const [monthlyUsage] = await pool.execute(`
      SELECT 
        DATE_FORMAT(t.date, '%Y-%m') as month,
        COUNT(li.id) as usage_count,
        COALESCE(SUM(li.subtotal), 0) as revenue
      FROM line_items li
      JOIN transactions t ON li.transaction_id = t.id
      WHERE li.service_id = ? 
        AND t.deleted_at IS NULL 
        AND t.approval_status = 'Approved'
        AND t.company_id = ?
        AND t.date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(t.date, '%Y-%m')
      ORDER BY month
    `, [serviceId, req.user.companyId]);

    res.json({
      service: services[0],
      statistics: stats[0],
      monthlyUsage
    });

  } catch (error) {
    console.error('Get service statistics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;