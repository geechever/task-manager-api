const logger = require('../utils/logger');

const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
      }

      next();
    } catch (err) {
      logger.error('Authorization Error:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};

module.exports = authorize;