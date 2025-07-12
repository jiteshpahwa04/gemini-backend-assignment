const jwt = require('jsonwebtoken');
const { serverConfig } = require('../config/index.js');
const { Unauthorized } = require('../utils/error/index.js');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Unauthorized('Authorization token missing or malformed');
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, serverConfig.JWT_SECRET);
    
    req.user = { userId: payload.userId, phone: payload.phone };
    next();
  } catch (err) {
    throw new Unauthorized('Invalid or expired token');
  }
}

module.exports = authMiddleware;