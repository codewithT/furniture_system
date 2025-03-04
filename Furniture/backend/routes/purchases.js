const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Assuming db is a connection pool
const requireAuth = require('./authMiddleware');
const nodemailer = require("nodemailer");
const moment = require("moment");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.USER_GMAIL,
        pass: process.env.USER_PASSWORD,
    },
});

// Get all purchases
router.get('/purchase', (req, res) => {
    const query = `SELECT PurchaseID, SONumber, Delivery_date, POStatus, PONumber, ProductCode, SupplierCode, Ordered_Qty FROM purchasemaster`;
    
    db.getConnection((err, connection) => {
        if (err) {
            console.error("Database connection error:", err);
            return res.status(500).json({ error: "Database connection failed" });
        }

        connection.query(query, (error, results) => {
            connection.release();
            if (error) {
                console.error("Error fetching data:", error);
                return res.status(500).json({ error: "Database query error" });
            }
            res.json(results);
        });
    });
});

// Send purchase order emails
router.post("/purchase/send-mails", requireAuth, async (req, res) => {
    const selectedPurchases = req.body;

    if (!selectedPurchases || selectedPurchases.length === 0) {
        return res.status(400).json({ message: "No purchases selected" });
    }

    try {
        const emailQueries = selectedPurchases.map((purchase) => {
            return new Promise((resolve, reject) => {
                db.getConnection((err, connection) => {
                    if (err) return reject(err);

                    const query = `
                        SELECT sup.EmailAddress, pm.Created_date, pm.SupplierCode, pm.Ordered_Qty
                        FROM supplier sup
                        JOIN purchasemaster pm ON sup.SupplierID = pm.SupplierID
                        WHERE pm.PurchaseID = ?`;

                    connection.query(query, [purchase.PurchaseID], (error, results) => {
                        connection.release();
                        if (error) return reject(error);
                        if (results.length === 0) return reject("No email found");

                        const supplierEmail = results[0].EmailAddress;
                        const createdDate = results[0].Created_date;
                        const deliveryDate = new Date(createdDate);
                        deliveryDate.setDate(deliveryDate.getDate() + 21);

                        const vendorCode = results[0].SupplierCode;
                        const orderedQty = results[0].Ordered_Qty;
                        const poNumber = `${moment().format("YYYYMMDD")}-${vendorCode}`;

                        resolve({ purchase, supplierEmail, deliveryDate, poNumber, orderedQty });
                    });
                });
            });
        });

        const emailResults = await Promise.allSettled(emailQueries);
        const successfulEmails = emailResults.filter(result => result.status === "fulfilled").map(result => result.value);

        if (successfulEmails.length === 0) {
            return res.status(500).json({ message: "No emails found for selected purchases" });
        }

        // Send Emails
        await Promise.all(successfulEmails.map(({ purchase, supplierEmail, orderedQty }) => {
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
        }));

        // Update database records
        db.getConnection((err, connection) => {
            if (err) {
                console.error("Database connection error:", err);
                return res.status(500).json({ error: "Database connection failed" });
            }

            connection.beginTransaction(async (err) => {
                if (err) return connection.rollback(() => res.status(500).json({ error: "Transaction failed" }));

                try {
                    await Promise.all(successfulEmails.map(({ purchase, deliveryDate, poNumber }) => {
                        return new Promise((resolve, reject) => {
                            const updateQuery = `UPDATE purchasemaster SET PONumber = ?, Delivery_date = ?, POStatus = 'Ordered' WHERE PurchaseID = ?`;
                            connection.query(updateQuery, [poNumber, deliveryDate, purchase.PurchaseID], (updateErr, result) => {
                                if (updateErr) return reject(updateErr);
                                resolve(result);
                            });
                        });
                    }));

                    connection.commit((err) => {
                        connection.release();
                        if (err) return res.status(500).json({ error: "Commit failed" });
                        res.status(200).json({ message: "Emails sent, PO Number assigned, and Ordered Status updated" });
                    });
                } catch (error) {
                    connection.rollback(() => {
                        connection.release();
                        res.status(500).json({ error: "Error updating records" });
                    });
                }
            });
        });

    } catch (error) {
        console.error("Transaction failed:", error);
        res.status(500).json({ message: "Error processing request", error: error.message });
    }
});

// Delete purchase
router.delete("/purchase/:id", requireAuth, async (req, res) => {
    const { id } = req.params;

    db.getConnection((err, connection) => {
        if (err) {
            console.error("Database connection error:", err);
            return res.status(500).json({ error: "Database connection failed" });
        }

        connection.beginTransaction(async (err) => {
            if (err) return res.status(500).json({ error: "Transaction failed" });

            try {
                const sqlQuery = `DELETE FROM purchasemaster WHERE PurchaseID = ?`;
                connection.query(sqlQuery, [id], (deleteErr, result) => {
                    if (deleteErr) {
                        connection.rollback(() => res.status(500).json({ error: "Unable to delete purchase" }));
                    }

                    if (result.affectedRows === 0) {
                        return connection.rollback(() => res.status(404).json({ error: "Purchase not found" }));
                    }

                    connection.commit((commitErr) => {
                        connection.release();
                        if (commitErr) return res.status(500).json({ error: "Commit failed" });

                        res.json({ msg: "Purchase deleted successfully" });
                    });
                });
            } catch (error) {
                connection.rollback(() => {
                    connection.release();
                    res.status(500).json({ error: "Error processing request" });
                });
            }
        });
    });
});

module.exports = router;
