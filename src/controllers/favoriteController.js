// ============================================================
// Contrôleur Favoris (Wishlist)
// ============================================================
const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendResponse } = require('../utils/sendResponse');

const prisma = new PrismaClient();

const parseFav = (f) => ({
  ...f,
  product: f.product ? { ...f.product, images: f.product.images ? JSON.parse(f.product.images) : [] } : null,
});

// GET /api/favorites
exports.getFavorites = asyncHandler(async (req, res) => {
  const favorites = await prisma.favorite.findMany({
    where: { userId: req.user.id },
    include: { product: { include: { category: true } } },
    orderBy: { createdAt: 'desc' },
  });
  sendResponse(res, 200, true, 'Favoris récupérés.', favorites.map(parseFav));
});

// POST /api/favorites
exports.addFavorite = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  try {
    const favorite = await prisma.favorite.create({
      data: { userId: req.user.id, productId },
      include: { product: true },
    });
    sendResponse(res, 201, true, 'Ajouté aux favoris.', parseFav(favorite));
  } catch (e) {
    if (e.code === 'P2002') return sendResponse(res, 409, false, 'Déjà dans vos favoris.');
    throw e;
  }
});

// DELETE /api/favorites/:productId
exports.removeFavorite = asyncHandler(async (req, res) => {
  await prisma.favorite.deleteMany({ where: { userId: req.user.id, productId: req.params.productId } });
  sendResponse(res, 200, true, 'Retiré des favoris.');
});
