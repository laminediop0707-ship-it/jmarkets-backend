// ============================================================
// JMARKET'S - Point d'entrée du serveur API
// ============================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');

const { helmetConfig, globalLimiter, hppProtection, sanitizeInputs } = require('./middleware/security');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// ---------- Sécurité & middlewares globaux ----------
app.use(helmetConfig);
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(hppProtection);
app.use(sanitizeInputs);
app.use(globalLimiter);
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// Fichiers statiques (images uploadées)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---------- Routes API ----------
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/brands', require('./routes/brandRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/favorites', require('./routes/favoriteRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));
app.use('/api/banners', require('./routes/bannerRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Vérification santé de l'API
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: "JMARKET'S API opérationnelle", timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.send("JMARKET'S API — voir /api/health pour le statut.");
});

// ---------- Gestion des erreurs ----------
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🛍️  JMARKET'S API démarrée sur http://localhost:${PORT}`);
  console.log(`📦 Environnement : ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
