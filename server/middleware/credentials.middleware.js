const  allowedOrigins  = require('../config/allowedOrigins.config');

function credentialsMiddleware(req, res, next) {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }

  next();
}

module.exports = credentialsMiddleware;