const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  connectionLimit: 15, 
});
 
db.getConnection((err, connection) => {
  if (err) {
    console.error('MySQL Pool connection failed:', err);
  } else {
    console.log('MySQL Pool Connected');
    connection.release();  
  }
});

module.exports = db;
