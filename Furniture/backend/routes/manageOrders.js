const express = require('express');
const router = express.Router();
const db = require('../config/db');
const nodemailer = require("nodemailer");
const requireAuth = require('./authMiddleware');

router.get('/manageOrders',requireAuth,  (req, res) => {
    const query = 
    `SELECT st.SalesID, st.SONumber, st.ProductID, pm.ProductName, st.SupplierID, st.Qty, st.Price, st.GST, 
    st.TotalPrice, st.ShipToParty, st.CustomerEmail, st.Delivery_date, st.Payment_Status, st.Created_date 
    FROM salestable st
    JOIN productmaster pm ON st.ProductID = pm.ProductID`;
    
    console.log(query);
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).json({ error: 'Database query error' });
        } else {
            res.json(results);
        }
    });
});

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.USER_GMAIL,
        pass: process.env.USER_PASSWORD,
    },
});

router.post('/manageOrders/send-mails',requireAuth,  async (req, res) => {
    const selectedOrders = req.body.orders;
    console.log(selectedOrders);

    if (!selectedOrders || selectedOrders.length === 0) {
        return res.status(400).json({ message: "No orders selected" });
    }

    try {
        // Start MySQL transaction
        await new Promise((resolve, reject) => {
            db.beginTransaction((err) => {
                if (err) return reject(err);
                resolve();
            });
        });

        const emailPromises = selectedOrders.map((order) => {
            return new Promise((resolve, reject) => {
                const mailOptions = {
                    from: process.env.USER_GMAIL,
                    to: order.CustomerEmail, // Send to customer email
                    subject: "Order Update",
                    text: `Dear Customer, \n\nYour order with Product ID: ${order.ProductID} and Order ID: ${order.SalesID} is being processed.\n\nThank you for shopping with us!`,
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error("Error sending email:", error);
                        return reject(error);
                    }
                    console.log(`Email sent for SalesID ${order.SalesID}:`, info.response);
                    resolve(order.SalesID);
                });
            });
        });

        // Wait for all emails to be sent
        await Promise.all(emailPromises);

        

        // Commit transaction if everything succeeds
        await new Promise((resolve, reject) => {
            db.commit((err) => {
                if (err) return reject(err);
                resolve();
            });
        });

        res.status(200).json({ message: "Emails sent and order status updated successfully" });

    } catch (error) {
        console.error("Transaction failed:", error);

        // Rollback transaction if any error occurs
        db.rollback(() => {
            res.status(500).json({ message: "Error processing request", error: error.message });
        });
    }
});

module.exports = router;
