// middleware/authMiddleware.js
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({ msg: 'Unauthorized, please log in' });
    }
    next(); // Continue to the next middleware/route
  };
  
  module.exports = requireAuth;
  