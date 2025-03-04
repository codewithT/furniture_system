const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // Ensure db.js exports a MySQL pool instance
const requireAuth = require('./authMiddleware');

// Search supplier codes based on product codes
router.get('/supplier/:productCode', requireAuth, async (req, res) => {
    const productCode = req.params.productCode;
    const query = `
      SELECT sm.SupplierID, sm.SupplierCode 
      FROM supplier sm
      JOIN productmaster pm ON pm.SupplierID = sm.SupplierID
      WHERE pm.ProductCode = ?;
    `;

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error acquiring connection:', err);
            return res.status(500).json({ error: 'Database connection error' });
        }

        connection.query(query, [productCode], (err, results) => {
            connection.release(); // Release the connection back to the pool

            if (err) {
                console.error('Error fetching data:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            res.json(results);
        });
    });
});

// Fetch ProductID based on ProductCode and SupplierID
router.post('/supplier/getProductID', requireAuth, (req, res) => {
    const { ProductCode, SupplierID } = req.body;

    if (!ProductCode || !SupplierID) {
        return res.status(400).json({ error: 'ProductCode and SupplierID are required' });
    }

    const query = `
        SELECT ProductID, ProductName, SupplierPrice 
        FROM productmaster 
        WHERE ProductCode = ? AND SupplierID = ?
    `;

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error acquiring connection:', err);
            return res.status(500).json({ error: 'Database connection error' });
        }

        connection.query(query, [ProductCode, SupplierID], (err, results) => {
            connection.release(); // Release the connection back to the pool

            if (err) {
                console.error('Database query error:', err);
                return res.status(500).json({ error: 'Database query error' });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: 'No matching product found' });
            }

            res.status(200).json({
                ProductID: results[0].ProductID,
                ProductName: results[0].ProductName,
                SupplierPrice: results[0].SupplierPrice,
            });
        });
    });
});

// Route to handle purchase order submission
router.post('/addOrders/submit-purchase', (req, res) => {
    const { Created_by, Delivery_date, POStatus, PONumber, CustomerEmail, Payment_Status, GST, ShipToParty, InternalNote, items } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ error: 'No items to insert' });
    }

    const insertQueryPurchase = `
        INSERT INTO purchasemaster 
        (SONumber, ProductID, SupplierID, RecordMargin, Created_by, Created_date, Created_time, Delivery_date, POStatus, PONumber, ProductCode, SupplierCode, Time_stamp, Ordered_Qty) 
        VALUES ?
    `;

    const insertQuerySales = `
        INSERT INTO salestable 
        (ProductID, SupplierID, SONumber, Qty, Price, GST, TotalPrice, SoldToParty, ShipToParty, CustomerEmail, InternalNote, Created_by, Created_date, Created_time, Time_stamp, Delivery_date, Payment_Status) 
        VALUES ?
    `;

    const currentDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const currentTime = new Date().toISOString().slice(11, 19); // HH:MM:SS
    const formattedTimestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const timestamp = Date.now();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const SONumber = `SO-${timestamp}-${randomNum}`;

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 21);
    const formattedDeliveryDate = deliveryDate.toISOString().slice(0, 10);

    const recordMargin = 0;
    const purchaseValues = items
        .filter(item => Boolean(item.Check) === false)
        .map(item => [
            SONumber || '',
            item.ProductID || null,
            item.SupplierID || null,
            recordMargin || 0.00,
            Created_by || 'Unknown',
            currentDate,
            currentTime,
            formattedDeliveryDate,
            POStatus || 'Not Ordered',
            PONumber || '',
            item.ProductCode || '',
            item.SupplierCode || '',
            formattedTimestamp,
            item.Qty,
        ]);

    const salesValues = items
        .filter(item => Boolean(item.Check) === true)
        .map(item => [
            item.ProductID || null,
            item.SupplierID || null,
            SONumber || '',
            item.Qty || 0,
            item.Price || 0,
            GST || 0,
            item.TotalPrice || 0,
            '', // Placeholder for SoldToParty
            ShipToParty || 'DefaultParty',
            CustomerEmail || '',
            InternalNote || '',
            Created_by || 'Unknown',
            currentDate,
            currentTime,
            formattedTimestamp,
            formattedDeliveryDate,
            Payment_Status || 'pending'
        ]);

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error acquiring connection:', err);
            return res.status(500).json({ error: 'Database connection error' });
        }

        connection.beginTransaction(err => {
            if (err) {
                connection.release();
                return res.status(500).json({ error: 'Transaction error', details: err });
            }

            connection.query(insertQuerySales, [salesValues], (err, result) => {
                if (err) {
                    return connection.rollback(() => {
                        connection.release();
                        console.error('Error inserting into salestable:', err);
                        res.status(500).json({ error: 'Database error', details: err });
                    });
                }

                connection.query(insertQueryPurchase, [purchaseValues], (err, result) => {
                    if (err) {
                        return connection.rollback(() => {
                            connection.release();
                            console.error('Error inserting into purchasemaster:', err);
                            res.status(500).json({ error: 'Database error', details: err });
                        });
                    }

                    connection.commit(err => {
                        if (err) {
                            return connection.rollback(() => {
                                connection.release();
                                console.error('Transaction commit error:', err);
                                res.status(500).json({ error: 'Transaction commit error', details: err });
                            });
                        }

                        connection.release(); // Release the connection after the transaction
                        res.json({ message: 'Order placed successfully!', insertedRows: result.affectedRows });
                    });
                });
            });
        });
    });
});

module.exports = router;
