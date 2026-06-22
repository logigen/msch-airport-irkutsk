const jwt = require('jsonwebtoken');

const auth = (roles = []) => (req, res, next) => {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Нет токена' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (roles.length && !roles.includes(payload.role)) {
      return res.status(403).json({ message: 'Нет доступа' });
    }
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: 'Токен недействителен' });
  }
};

module.exports = auth;
