const express = require('express');
const router = express.Router();
const db = require('../config/db');
const requireAuth = require('./authMiddleware');
// Middleware to check authentication
 

// **Fetch all suppliers**
router.get('/supplier', requireAuth, (req, res) => {
  const query = "SELECT SupplierID, SupplierCode, SupplierName, SupplierAddress, EmailAddress FROM furniture_db.supplier";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      return res.status(500).json({ error: "Unable to get data" });
    }
    return res.json(results);
  });
});
// **Add a new supplier**
router.post('/supplier', requireAuth, async (req, res) => {
  const { SupplierCode, SupplierName, SupplierAddress, EmailAddress, Created_by } = req.body;

  try {
      await new Promise((resolve, reject) => {
          db.beginTransaction((err) => {
              if (err) return reject(err);
              resolve();
          });
      });

      const query = `INSERT INTO furniture_db.supplier 
          (SupplierCode, SupplierName, SupplierAddress, Created_by, Created_date, Created_time, EmailAddress) 
          VALUES (?, ?, ?, ?, CURDATE(), CURTIME(), ?)`;

      const result = await new Promise((resolve, reject) => {
          db.query(query, [SupplierCode, SupplierName, SupplierAddress, Created_by, EmailAddress], (err, result) => {
              if (err) return reject(err);
              resolve(result);
          });
      });

      await new Promise((resolve, reject) => {
          db.commit((err) => {
              if (err) return reject(err);
              resolve();
          });
      });

      res.status(201).json({ msg: "Supplier added successfully", SupplierID: result.insertId });
  } catch (error) {
      console.error("Error inserting supplier:", error);
      db.rollback(() => {
          res.status(500).json({ error: "Unable to add supplier" });
      });
  }
});

// **Update an existing supplier**
router.put('/supplier/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { SupplierCode, SupplierName, SupplierAddress, EmailAddress, Changed_by } = req.body;

  try {
      await new Promise((resolve, reject) => {
          db.beginTransaction((err) => {
              if (err) return reject(err);
              resolve();
          });
      });

      const query = `UPDATE furniture_db.supplier 
          SET SupplierCode = ?, SupplierName = ?, SupplierAddress = ?, Changed_by = ?, 
          Changed_date = CURDATE(), Changed_time = CURTIME(), EmailAddress = ? 
          WHERE SupplierID = ?`;

      const result = await new Promise((resolve, reject) => {
          db.query(query, [SupplierCode, SupplierName, SupplierAddress, Changed_by, EmailAddress, id], (err, result) => {
              if (err) return reject(err);
              resolve(result);
          });
      });

      if (result.affectedRows === 0) {
          throw new Error("Supplier not found");
      }

      await new Promise((resolve, reject) => {
          db.commit((err) => {
              if (err) return reject(err);
              resolve();
          });
      });

      res.json({ msg: "Supplier updated successfully" });
  } catch (error) {
      console.error("Error updating supplier:", error);
      db.rollback(() => {
          res.status(error.message === "Supplier not found" ? 404 : 500).json({ error: error.message || "Unable to update supplier" });
      });
  }
});

// **Delete a supplier**
router.delete('/supplier/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
      await new Promise((resolve, reject) => {
          db.beginTransaction((err) => {
              if (err) return reject(err);
              resolve();
          });
      });

      const query = "DELETE FROM furniture_db.supplier WHERE SupplierID = ?";
      
      const result = await new Promise((resolve, reject) => {
          db.query(query, [id], (err, result) => {
              if (err) return reject(err);
              resolve(result);
          });
      });

      if (result.affectedRows === 0) {
          throw new Error("Supplier not found");
      }

      await new Promise((resolve, reject) => {
          db.commit((err) => {
              if (err) return reject(err);
              resolve();
          });
      });

      res.json({ msg: "Supplier deleted successfully" });
  } catch (error) {
      console.error("Error deleting supplier:", error);
      db.rollback(() => {
          res.status(error.message === "Supplier not found" ? 404 : 500).json({ error: error.message || "Unable to delete supplier" });
      });
  }
});
// Search Suppliers with Pagination
router.get('/supplier/search', (req, res) => {
  const { query } = req.query;

  let sql = `SELECT * FROM supplier e 
             WHERE e.SupplierCode LIKE ? 
             OR e.SupplierName LIKE ? 
             OR e.EmailAddress Like ?
             OR e.SupplierAddress LIKE ?`;

  db.query(sql, [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`], (err, results) => {
      if (err) {
          console.error('Search Error:', err);
          return res.status(500).json({ error: 'Database search failed' });
      }
      res.json(results);
  });
});


// Sort Suppliers with Pagination
router.get('/supplier/sort', (req, res) => {
    const { column = 'SupplierID', order = 'asc', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const allowedColumns = ['SupplierID', 'SupplierCode', 'SupplierName', 'SupplierAddress'];
    if (!allowedColumns.includes(column)) {
        return res.status(400).json({ error: 'Invalid sort column' });
    }

    let sql = `SELECT * FROM supplier ORDER BY ${column} ${order.toUpperCase()} LIMIT ? OFFSET ?`;

    db.query(sql, [parseInt(limit), parseInt(offset)], (err, results) => {
        if (err) {
            console.error('Sort Error:', err);
            return res.status(500).json({ error: 'Sorting failed' });
        }
        res.json(results);
    });
});

module.exports = router;
