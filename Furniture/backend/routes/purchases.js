const express = require('express');
const router = express.Router();
const db = require('../config/db');
const requireAuth = require('./authMiddleware');
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const moment = require("moment");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.USER_GMAIL,
      pass: process.env.USER_PASSWORD,
    },
  });

router.get('/purchase', (req, res) => {
    const query = `SELECT PurchaseID, SONumber, Delivery_date, POStatus, PONumber, ProductCode, SupplierCode , Ordered_Qty FROM purchasemaster`;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).json({ error: 'Database query error' });
        } else {
            res.json(results);
        }
    });
});

router.post("/purchase/send-mails", requireAuth, async (req, res) => {
    const selectedPurchases = req.body;

    if (!selectedPurchases || selectedPurchases.length === 0) {
        return res.status(400).json({ message: "No purchases selected" });
    }

    try {
        // Fetch supplier emails, PO Number, and Ordered_Qty
        const emailQueries = selectedPurchases.map((purchase) => {
            return new Promise((resolve, reject) => {
                const query = `
                    SELECT sup.EmailAddress, pm.Created_date, pm.SupplierCode, pm.Ordered_Qty
                    FROM supplier sup
                    JOIN purchasemaster pm ON sup.SupplierID = pm.SupplierID
                    WHERE pm.PurchaseID = ?`;

                db.query(query, [purchase.PurchaseID], (err, results) => {
                    if (err) return reject(err);
                    if (results.length === 0) return reject("No email found");

                    const supplierEmail = results[0].EmailAddress;
                    const createdDate = results[0].Created_date;
                    const deliveryDate = new Date(createdDate);
                    deliveryDate.setDate(deliveryDate.getDate() + 21); // Add 21 days

                    const vendorCode = results[0].SupplierCode;
                    const orderedQty = results[0].Ordered_Qty;
                    const poNumber = `${moment().format("YYYYMMDD")}-${vendorCode}`; // Format: YYYYMMDD-VendorCode

                    resolve({ purchase, supplierEmail, deliveryDate, poNumber, orderedQty });
                });
            });
        });

        const emailResults = await Promise.allSettled(emailQueries);
        const successfulEmails = emailResults
            .filter((result) => result.status === "fulfilled")
            .map((result) => result.value);

        if (successfulEmails.length === 0) {
            return res.status(500).json({ message: "No emails found for selected purchases" });
        }

        // Send Emails
        const emailPromises = successfulEmails.map(({ purchase, supplierEmail, orderedQty }) => {
            return new Promise((resolve) => {
                const mailOptions = {
                    from: process.env.USER_GMAIL,
                    to: supplierEmail,
                    subject: "New Purchase Order Notification",
                    text: `Dear Supplier,\n\nYou have a new order with details:\n\n
                    - Product Code: ${purchase.ProductCode}
                    - Supplier Code: ${purchase.SupplierCode}
                    - Ordered Quantity: ${orderedQty}
                    
                    Thank you!`,
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error(`Error sending email for PurchaseID ${purchase.PurchaseID}:`, error);
                        return resolve({ purchaseID: purchase.PurchaseID, status: "failed" });
                    }
                    console.log(`Email sent for PurchaseID ${purchase.PurchaseID}:`, info.response);
                    resolve({ purchaseID: purchase.PurchaseID, status: "sent" });
                });
            });
        });

        await Promise.all(emailPromises);

        // Start transaction for updating PONumber, Ordered Status, and Delivery Date
        await new Promise((resolve, reject) => {
            db.beginTransaction((err) => {
                if (err) return reject(err);
                resolve();
            });
        });

        // Update PONumber, Ordered Status, and Delivery Date
        const updateQueries = successfulEmails.map(({ purchase, deliveryDate, poNumber }) => {
            return new Promise((resolve, reject) => {
                const updateQuery = `UPDATE purchasemaster SET PONumber = ?, Delivery_date = ?, POStatus = 'Ordered' WHERE PurchaseID = ?`;

                db.query(updateQuery, [poNumber, deliveryDate, purchase.PurchaseID], (updateErr, result) => {
                    if (updateErr) return reject(updateErr);
                    resolve(result);
                });
            });
        });

        await Promise.all(updateQueries);

        // Commit transaction
        await new Promise((resolve, reject) => {
            db.commit((err) => {
                if (err) return reject(err);
                resolve();
            });
        });

        res.status(200).json({ message: "Emails sent, PO Number assigned, and Ordered Status updated", PONumber: successfulEmails[0].poNumber });
    } catch (error) {
        console.error("Transaction failed:", error);

        // Rollback transaction if any error occurs
        db.rollback(() => {
            res.status(500).json({ message: "Error processing request", error: error.message });
        });
    }
});
 
router.put("/purchase/:id", requireAuth, async(req, res)=>{
    const {id} = req.params;

    const {ProductCode, SupplierCode, SONumber, Delivery_date, POStatus, PONumber,
        Changed_by
    } = req.body;
    console.log(req.body);
  try {
    await new Promise((resolve, reject) => {
        db.beginTransaction((err) => {
            if (err) return reject(err);
            resolve();
        });
    });

    const query = `UPDATE furniture_db.purchasemaster 
        SET SupplierCode = ?, ProductCode = ?, SONumber = ?, Changed_by = ?, 
        Changed_date = CURDATE(), Changed_time = CURTIME(), PONUmber = ?, POStatus = ?, Delivery_date =?
        WHERE PurchaseID = ?`;

    const result = await new Promise((resolve, reject) => {
        db.query(query, [SupplierCode, ProductCode, SONumber, Changed_by, PONumber, POStatus,Delivery_date,  id], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });

    if (result.affectedRows === 0) {
        throw new Error("purchase not found");
    }

    await new Promise((resolve, reject) => {
        db.commit((err) => {
            if (err) return reject(err);
            resolve();
        });
    });

    res.json({ msg: "Purchases updated successfully" });
} catch (error) {
    console.error("Error updating Purchase:", error);
    db.rollback(() => {
        res.status(error.message === "Purchase record not found" ? 404 : 500).json({ error: error.message || "Unable to update purchase" });
    });
}
    
});

// Search purchases by query string
router.get("/purchase/search", requireAuth, (req, res) => {
    const {query }= req.query; // Extract query string from request
    
    const sql = `
      SELECT * FROM purchasemaster
      WHERE 
        SONumber LIKE ? OR 
        PurchaseID LIKE ? OR
        ProductCode LIKE ? OR
        SupplierCode LIKE ? OR
        Delivery_date LIKE ?
    `;
  
    const searchTerm = `%${query}%`;
  
    // Execute query
    db.query(sql, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm], (err, results) => {
      if (err) {
        console.error("Error executing search query:", err);
        return res.status(500).json({ message: "Internal Server Error" });
      }
      res.json(results);
    });
  });

  
router.delete("/purchase/:id", requireAuth, async (req, res)=>{
    const {id} = req.params;
   
    try{
        await new Promise((resolve, reject) => {
            db.beginTransaction((err) => {
                if (err) return reject(err);
                resolve();
            });
        });
        const sqlQuery = `DELETE from furniture_db.purchasemaster where PurchaseID = ?`;
        const result = await new Promise((resolve, reject) => {
            db.query(sqlQuery, [id], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
  
        if (result.affectedRows === 0) {
            throw new Error("purchase not found");
        }
  
        await new Promise((resolve, reject) => {
            db.commit((err) => {
                if (err) return reject(err);
                resolve();
            });
        });
  
        res.json({ msg: "Purchase deleted successfully" });
    }catch(error){
        console.error("Error deleting purchase:", error);
        db.rollback(() => {
            res.status(error.message === "Purchase not found" ? 404 : 500).json({ error: error.message || "Unable to delete purchase" });
        });
    }
});
module.exports = router;
