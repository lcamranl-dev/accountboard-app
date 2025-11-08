import mysql from 'mysql2/promise';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Determine which database to use
const usePostgreSQL = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgresql://');

let db;

if (usePostgreSQL) {
  // PostgreSQL configuration for Render/Heroku
  console.log('🐘 Using PostgreSQL database');
  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
} else {
  // MySQL configuration for local/traditional hosting
  console.log('🐬 Using MySQL database');
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'accountboard',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
  
  db = mysql.createPool(dbConfig);
}

// Universal query function that works with both MySQL and PostgreSQL
export const query = async (sql, params = []) => {
  try {
    if (usePostgreSQL) {
      // PostgreSQL style - returns { rows, rowCount }
      const client = await db.connect();
      try {
        const result = await client.query(sql, params);
        return result.rows;
      } finally {
        client.release();
      }
    } else {
      // MySQL style - returns [rows, fields]
      const [rows] = await db.execute(sql, params);
      return rows;
    }
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Test connection
export const testConnection = async () => {
  try {
    if (usePostgreSQL) {
      const client = await db.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('✅ PostgreSQL database connected successfully');
    } else {
      const connection = await db.getConnection();
      await connection.execute('SELECT 1');
      connection.release();
      console.log('✅ MySQL database connected successfully');
    }
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

export default db;