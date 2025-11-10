const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: 'Z'
});


// Test the DB connection when app starts
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL database connection established successfully.');
    connection.release(); // Important to release the connection back to pool
  } catch (err) {
    console.error('❌ Failed to connect to the MySQL database:', err.message);
    process.exit(1); // Stop the app if DB connection fails
  }
})();


module.exports = pool;