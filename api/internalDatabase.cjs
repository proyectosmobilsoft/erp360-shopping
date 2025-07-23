const { Pool } = require('pg');

const pool = new Pool({
  user: 'your_username',
  host: '179.33.214.86',
  database: 'your_database',
  password: 'your_password',
  port: 5432,
});

const queryDatabase = async (query, params) => {
  try {
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

module.exports = {
  queryDatabase,
};