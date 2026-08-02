// ============================================================
// Contrôleur Coupons de réduction (admin)
// ============================================================
const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendResponse } = require('../utils/sendResponse');

const prisma = new PrismaClient();

exports.getCoupons = asyncHandler(async (req, res) => {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  sendResponse(res, 200, true, 'Coupons récupérés.', coupons);
});

exports.createCoupon = asyncHandler(async (req, res) => {
  const { code, type, value, minOrderValue, maxUses, expiresAt } = req.body;
  const coupon = await prisma.coupon.create({
    data: {
      code: code.toUpperCase(), type, value: parseFloat(value),
      minOrderValue: parseFloat(minOrderValue) || 0,
      maxUses: parseInt(maxUses) || 100,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });
  sendResponse(res, 201, true, 'Coupon créé.', coupon);
});

exports.updateCoupon = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const coupon = await prisma.coupon.update({ where: { id: req.params.id }, data: { isActive } });
  sendResponse(res, 200, true, 'Coupon mis à jour.', coupon);
});

exports.deleteCoupon = asyncHandler(async (req, res) => {
  await prisma.coupon.delete({ where: { id: req.params.id } });
  sendResponse(res, 200, true, 'Coupon supprimé.');
});

// POST /api/coupons/validate  (public - vérifie un code au checkout)
exports.validateCoupon = asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body;
  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });

  if (!coupon || !coupon.isActive) return sendResponse(res, 404, false, 'Code promo invalide.');
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return sendResponse(res, 400, false, 'Code promo expiré.');
  if (coupon.usedCount >= coupon.maxUses) return sendResponse(res, 400, false, 'Code promo épuisé.');
  if (subtotal < coupon.minOrderValue) {
    return sendResponse(res, 400, false, `Montant minimum requis : ${coupon.minOrderValue} FCFA.`);
  }

  const discount = coupon.type === 'PERCENT' ? (subtotal * coupon.value) / 100 : coupon.value;
  sendResponse(res, 200, true, 'Code promo appliqué !', { discount, coupon });
});
