const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        status: 'error',
        message: 'No authorization header'
      });
    }

    // Check API key authentication
    if (authHeader.startsWith('Bearer ')) {
      const apiKey = authHeader.split(' ')[1];
      if (apiKey === process.env.API_KEY) {
        return next();
      }
    }

    // Fallback to JWT authentication
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid authentication token'
    });
  }
};

module.exports = auth;