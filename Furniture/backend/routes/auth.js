const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const db = require('../config/db');
const { promisify } = require('util'); 
require('dotenv').config();

const router = express.Router();

// Convert `db.query()` to return Promises
const queryAsync = promisify(db.query).bind(db);

// **Register User**
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    const results = await queryAsync('SELECT * FROM furniture_db.users WHERE email = ?', [email]);

    if (results.length > 0) return res.status(400).json({ msg: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    await queryAsync('INSERT INTO furniture_db.users (email, password) VALUES (?, ?)', [email, hashedPassword]);

    res.status(201).json({ msg: 'User registered successfully' });

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// **Login User (Creates a Session)**
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const results = await queryAsync('SELECT * FROM furniture_db.users WHERE email = ?', [email]);

    if (results.length === 0) return res.status(400).json({ msg: 'Invalid credentials' });

    const user = results[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    // Store user session with all necessary user data
    req.session.user = { id: user.id, email: user.email };
    
    // Make sure the session is saved before responding
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ msg: 'Session error' });
      }
      res.json({ 
        msg: 'Logged in successfully', 
        user: { id: user.id, email: user.email } 
      });
    });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// **Logout User (Destroys Session)**
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ msg: 'Logout failed' });
    }
    res.clearCookie('connect.sid'); // Clear the session cookie
    res.json({ msg: 'Logged out successfully' });
  });
});

// **Check Authentication Status**
router.get('/is-authenticated', (req, res) => {
  // Debug logging
  console.log('Session in is-authenticated:', req.session);
  console.log('User in session:', req.session?.user);
  console.log('Checking authentication status...');
  console.log('Session exists:', !!req.session);
  console.log('User in session:', req.session?.user);
  if (req.session && req.session.user) {
    res.json({ isAuthenticated: true, user: req.session.user });
  } else {
    res.status(401).json({ isAuthenticated: false });
  }
});

// **Protected Route**
router.get('/protected', (req, res) => {
  console.log('Session in protected route:', req.session);
  
  if (!req.session || !req.session.user) {
    return res.status(401).json({ msg: 'Unauthorized' });
  }
  res.json({ msg: 'You accessed a protected route!', user: req.session.user });
});

module.exports = router;