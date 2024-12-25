const roles = {
      admin: ['read', 'write', 'delete'],
      lecturer: ['read', 'write'],
      student: ['read'],
    };

const checkPermission = (action) => (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  
    const { role } = req.session.user;
    if (roles[role] && roles[role].includes(action)) {
      return next();
    }
  
    res.status(403).json({ message: 'Forbidden: You do not have permission to perform this action' });
  };

module.exports = checkPermission
  