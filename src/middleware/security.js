// ============================================================
// Middlewares de sécurité globaux
// - Helmet (en-têtes HTTP sécurisés)
// - Rate limiting (anti brute-force / DDoS léger)
// - Anti pollution des paramètres HTTP (hpp)
// - Sanitisation basique contre les injections NoSQL/XSS dans le body
// ============================================================
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');

exports.helmetConfig = helmet({
  contentSecurityPolicy: false, // géré finement côté frontend/CDN si besoin
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

// Limite globale : 300 requêtes / 15 min / IP
exports.globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Trop de requêtes. Réessayez dans quelques minutes." },
});

// Limite stricte sur les routes sensibles (login, register, reset password)
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Trop de tentatives. Réessayez dans 15 minutes." },
});

exports.hppProtection = hpp();

// Nettoie récursivement les clés dangereuses ($, .) dans req.body/query/params
function clean(obj) {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
      continue;
    }
    if (typeof obj[key] === 'object') clean(obj[key]);
  }
}

exports.sanitizeInputs = (req, res, next) => {
  clean(req.body);
  clean(req.query);
  clean(req.params);
  next();
};
