const jwt = require('jsonwebtoken');
const { securityLog } = require('../utils/audit');

module.exports = function (req, res, next) {
  // Get token from header
  let token = req.header('Authorization');

  if (token && token.startsWith('Bearer ')) {
    // Remove Bearer from string
    token = token.slice(7, token.length);
  }

  console.log('Auth middleware: Token received:', token ? 'Token present' : 'No token');
  console.log('Auth middleware: Full Authorization header:', req.header('Authorization'));

  // Check if not token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    // It's a good practice to include the JWT secret in your .env file
    // and access it via process.env.JWT_SECRET
    console.log('Auth middleware: JWT_SECRET available:', !!process.env.JWT_SECRET);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware: Token decoded successfully');
    console.log('Auth middleware: Decoded payload:', JSON.stringify(decoded, null, 2));
    console.log('Auth middleware: User ID:', decoded.user?.id);
    console.log('Auth middleware: User role:', decoded.user?.role);

    req.user = decoded.user;
    next();
  } catch (err) {
    console.log('Auth middleware: JWT verification failed:', err.message);
    console.log('Auth middleware: Error details:', err);
    // Check for expired token specifically
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ msg: 'Token has expired' });
    }
    res.status(401).json({ msg: 'Token is not valid' });
  }
};