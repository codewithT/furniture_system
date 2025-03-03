const express = require('express');
const session = require('express-session');
const authRoutes = require('./routes/auth'); 
const dashboardRoutes = require('./routes/dashboardRoutes'); // Import new dashboard route
const supplier = require('./routes/supplier');
const addOrders = require('./routes/addOrders');
const manageOrders = require('./routes/manageOrders');
const cors = require('cors');
const app = express();
const bodyParser = require("body-parser");
const purchase = require('./routes/purchases')
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// cors 
app.use(cors({
  origin: 'http://localhost:4200', // Allow requests from this origin
  credentials: true, // Allow cookies and authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'] // Allowed headers
}));
 // **Configure Express Session**
 app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key', // Use environment variable
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// Mount authentication and dashboard routes
app.use('/furniture/auth', authRoutes);
app.use('/furniture', dashboardRoutes); // Add dashboard route under `/furniture/`
app.use('/furniture', supplier);
app.use('/furniture', addOrders);
app.use('/furniture', purchase);
app.use('/furniture' , manageOrders);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
