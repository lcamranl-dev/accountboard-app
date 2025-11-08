import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user still exists in database
    const [users] = await pool.execute(
      'SELECT id, name, role, default_language FROM employees WHERE id = ? AND deleted_at IS NULL',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = {
      id: decoded.userId,
      name: users[0].name,
      role: users[0].role,
      defaultLanguage: users[0].default_language
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const requireManager = (req, res, next) => {
  if (req.user.role !== 'Manager') {
    return res.status(403).json({ error: 'Manager role required' });
  }
  next();
};

export const requireEmployeeAccess = (req, res, next) => {
  const employeeId = req.params.employeeId || req.params.id;
  
  // Managers can access all employees, employees can only access their own data
  if (req.user.role === 'Manager' || req.user.id === employeeId) {
    next();
  } else {
    return res.status(403).json({ error: 'Access denied' });
  }
};