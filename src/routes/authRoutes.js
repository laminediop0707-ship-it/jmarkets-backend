const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/security');

router.post('/register', authLimiter, [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('firstName').notEmpty().withMessage('Le prénom est requis'),
  body('lastName').notEmpty().withMessage('Le nom est requis'),
], validate, ctrl.register);

router.post('/login', authLimiter, [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe requis'),
], validate, ctrl.login);

router.post('/logout', ctrl.logout);
router.get('/me', protect, ctrl.getMe);
router.put('/me', protect, ctrl.updateMe);
router.put('/change-password', protect, ctrl.changePassword);

module.exports = router;
