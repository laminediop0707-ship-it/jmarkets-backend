// ============================================================
// Contrôleur Panier
// ============================================================
const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendResponse } = require('../utils/sendResponse');

const prisma = new PrismaClient();

const parseItem = (item) => ({
  ...item,
  product: item.product ? { ...item.product, images: item.product.images ? JSON.parse(item.product.images) : [] } : null,
});

// GET /api/cart
exports.getCart = asyncHandler(async (req, res) => {
  const items = await prisma.cartItem.findMany({
    where: { userId: req.user.id },
    include: { product: true },
    orderBy: { createdAt: 'desc' },
  });
  sendResponse(res, 200, true, 'Panier récupéré.', items.map(parseItem));
});

// POST /api/cart
exports.addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, color, size } = req.body;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return sendResponse(res, 404, false, 'Produit introuvable.');
  if (product.stock < quantity) return sendResponse(res, 400, false, 'Stock insuffisant.');

  const existing = await prisma.cartItem.findFirst({
    where: { userId: req.user.id, productId, color: color || null, size: size || null },
  });

  let item;
  if (existing) {
    item = await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + parseInt(quantity) },
      include: { product: true },
    });
  } else {
    item = await prisma.cartItem.create({
      data: { userId: req.user.id, productId, quantity: parseInt(quantity), color, size },
      include: { product: true },
    });
  }

  sendResponse(res, 201, true, 'Produit ajouté au panier.', parseItem(item));
});

// PUT /api/cart/:id
exports.updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const item = await prisma.cartItem.findFirst({ where: { id: req.params.id, userId: req.user.id } });
  if (!item) return sendResponse(res, 404, false, 'Article introuvable.');

  const updated = await prisma.cartItem.update({
    where: { id: item.id },
    data: { quantity: parseInt(quantity) },
    include: { product: true },
  });
  sendResponse(res, 200, true, 'Panier mis à jour.', parseItem(updated));
});

// DELETE /api/cart/:id
exports.removeFromCart = asyncHandler(async (req, res) => {
  await prisma.cartItem.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
  sendResponse(res, 200, true, 'Article retiré du panier.');
});

// DELETE /api/cart
exports.clearCart = asyncHandler(async (req, res) => {
  await prisma.cartItem.deleteMany({ where: { userId: req.user.id } });
  sendResponse(res, 200, true, 'Panier vidé.');
});
