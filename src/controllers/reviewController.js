// ============================================================
// Contrôleur Avis produits
// ============================================================
const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendResponse } = require('../utils/sendResponse');

const prisma = new PrismaClient();

async function recomputeRating(productId) {
  const reviews = await prisma.review.findMany({ where: { productId } });
  const count = reviews.length;
  const avg = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  await prisma.product.update({
    where: { id: productId },
    data: { rating: Math.round(avg * 10) / 10, reviewCount: count },
  });
}

// POST /api/products/:productId/reviews
exports.addReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { rating, comment } = req.body;

  const review = await prisma.review.create({
    data: { productId, userId: req.user.id, rating: parseInt(rating), comment },
    include: { user: { select: { firstName: true, lastName: true, avatar: true } } },
  });

  await recomputeRating(productId);
  sendResponse(res, 201, true, 'Avis publié. Merci pour votre retour !', review);
});

// DELETE /api/reviews/:id
exports.deleteReview = asyncHandler(async (req, res) => {
  const review = await prisma.review.findUnique({ where: { id: req.params.id } });
  if (!review) return sendResponse(res, 404, false, 'Avis introuvable.');
  if (review.userId !== req.user.id && req.user.role !== 'ADMIN') {
    return sendResponse(res, 403, false, 'Action non autorisée.');
  }
  await prisma.review.delete({ where: { id: req.params.id } });
  await recomputeRating(review.productId);
  sendResponse(res, 200, true, 'Avis supprimé.');
});
