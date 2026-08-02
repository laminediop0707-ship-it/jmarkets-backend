// ============================================================
// Contrôleur d'authentification
// ============================================================
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendResponse } = require('../utils/sendResponse');

const prisma = new PrismaClient();

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const publicUser = (user) => {
  const { password, ...rest } = user;
  return rest;
};

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, phone } = req.body;

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return sendResponse(res, 409, false, "Un compte existe déjà avec cet email.");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      phone,
    },
  });

  const token = generateAccessToken(user.id);
  res.cookie('token', token, cookieOptions);

  await prisma.activityLog.create({
    data: { userId: user.id, action: 'INSCRIPTION', details: `Nouveau compte créé (${user.email})` },
  });

  sendResponse(res, 201, true, 'Compte créé avec succès. Bienvenue sur JMARKET\'S !', {
    user: publicUser(user),
    token,
  });
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    return sendResponse(res, 401, false, "Email ou mot de passe incorrect.");
  }

  if (!user.isActive) {
    return sendResponse(res, 403, false, "Ce compte a été désactivé. Contactez le support.");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return sendResponse(res, 401, false, "Email ou mot de passe incorrect.");
  }

  const token = generateAccessToken(user.id);
  res.cookie('token', token, cookieOptions);

  await prisma.activityLog.create({
    data: { userId: user.id, action: 'CONNEXION', details: `Connexion réussie` },
  });

  sendResponse(res, 200, true, 'Connexion réussie.', { user: publicUser(user), token });
});

// POST /api/auth/logout
exports.logout = asyncHandler(async (req, res) => {
  res.clearCookie('token');
  sendResponse(res, 200, true, 'Déconnexion réussie.');
});

// GET /api/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  sendResponse(res, 200, true, 'Profil récupéré.', { user: publicUser(req.user) });
});

// PUT /api/auth/me
exports.updateMe = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, avatar } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { firstName, lastName, phone, avatar },
  });

  sendResponse(res, 200, true, 'Profil mis à jour.', { user: publicUser(user) });
});

// PUT /api/auth/change-password
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const isMatch = await bcrypt.compare(currentPassword, req.user.password);
  if (!isMatch) {
    return sendResponse(res, 401, false, "Mot de passe actuel incorrect.");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: req.user.id }, data: { password: hashedPassword } });

  sendResponse(res, 200, true, 'Mot de passe mis à jour avec succès.');
});
