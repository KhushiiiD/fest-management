// authentication middleware
// verifies jwt tokens and protects routes

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// middleware to verify jwt token and authenticate user
const auth = async (req, res, next) => {
  try {
    // get token from authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'no token provided, authorization denied'
      });
    }
    
    // extract token
    const token = authHeader.split(' ')[1];
    
    // verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // find user from token payload
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'user not found, token invalid'
      });
    }
    
    // check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'account is deactivated'
      });
    }
    
    // attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'token expired'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'authentication failed'
    });
  }
};

// middleware to check if user has required role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'user not authenticated'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'access denied, insufficient permissions'
      });
    }
    
    next();
  };
};

// optional auth middleware - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // no token, continue without user
      req.user = null;
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (user && user.isActive) {
      req.user = user;
    } else {
      req.user = null;
    }
    
    next();
  } catch (error) {
    // if token is invalid, just continue without user
    req.user = null;
    next();
  }
};

module.exports = { auth, authorize, optionalAuth };
