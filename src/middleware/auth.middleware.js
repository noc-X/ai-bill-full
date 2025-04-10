const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Middleware to authenticate JWT token
const authenticateJWT = async (req, res, next) => {
  try {
    console.log('Auth middleware - Request headers:', {
      path: req.path,
      method: req.method,
      authorization: req.headers.authorization ? 'Present' : 'Missing',
      timestamp: new Date().toISOString()
    });
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.log('Auth middleware - Authorization header missing');
      return res.status(401).json({ message: 'Authorization header missing' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      console.log('Auth middleware - Token missing from Authorization header');
      return res.status(401).json({ message: 'Token missing' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by ID
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is inactive' });
    }
    
    // Attach user to request object
    req.user = user;
    next();
    
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Invalid or expired token', error: error.message });
  }
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
};

// Middleware to check if user is technician or admin
const isTechnician = (req, res, next) => {
  if (req.user && (req.user.role === 'technician' || req.user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied. Technician or admin role required.' });
  }
};

// Middleware to check if user is finance or admin
const isFinance = (req, res, next) => {
  if (req.user && (req.user.role === 'finance' || req.user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied. Finance or admin role required.' });
  }
};

// Middleware to check if user is collector or admin
const isCollector = (req, res, next) => {
  if (req.user && (req.user.role === 'collector' || req.user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied. Collector or admin role required.' });
  }
};

// Middleware to check if user has any finance-related role
const hasFinanceAccess = (req, res, next) => {
  if (req.user && (
    req.user.role === 'admin' ||
    req.user.role === 'finance' ||
    req.user.role === 'collector'
  )) {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied. Finance-related role required.' });
  }
};

module.exports = {
  authenticateJWT,
  isAdmin,
  isTechnician,
  isFinance,
  isCollector,
  hasFinanceAccess
};