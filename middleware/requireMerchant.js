const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function requireMerchant(req, res, next) {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ message: 'Authentication required. No token provided.' });
  }

  try {
    const token = header.replace(/^Bearer\s+/i, '').trim();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.role !== 'merchant') {
      return res.status(403).json({ message: 'Access denied: Merchant privileges required.' });
    }

    req.userId = user._id;
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired session token.' });
  }
}

module.exports = requireMerchant;
