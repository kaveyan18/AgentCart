const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ message: 'Authentication required. Please sign in.' });
  }

  try {
    const token = header.replace(/^Bearer\s+/i, '').trim();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token. Please log in again.' });
  }
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) {
    return next();
  }

  try {
    const token = header.replace(/^Bearer\s+/i, '').trim();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
  } catch {
    // ignore invalid token for optional endpoints
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
