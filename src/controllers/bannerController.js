// ============================================================
// Contrôleur Bannières (Hero / Promo)
// ============================================================
const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendResponse } = require('../utils/sendResponse');

const prisma = new PrismaClient();

exports.getBanners = asyncHandler(async (req, res) => {
  const where = { isActive: true };
  if (req.query.position) where.position = req.query.position;
  const banners = await prisma.banner.findMany({ where, orderBy: { order: 'asc' } });
  sendResponse(res, 200, true, 'Bannières récupérées.', banners);
});

exports.getAllBanners = asyncHandler(async (req, res) => {
  const banners = await prisma.banner.findMany({ orderBy: { order: 'asc' } });
  sendResponse(res, 200, true, 'Bannières récupérées.', banners);
});

exports.createBanner = asyncHandler(async (req, res) => {
  const banner = await prisma.banner.create({ data: req.body });
  sendResponse(res, 201, true, 'Bannière créée.', banner);
});

exports.updateBanner = asyncHandler(async (req, res) => {
  const banner = await prisma.banner.update({ where: { id: req.params.id }, data: req.body });
  sendResponse(res, 200, true, 'Bannière mise à jour.', banner);
});

exports.deleteBanner = asyncHandler(async (req, res) => {
  await prisma.banner.delete({ where: { id: req.params.id } });
  sendResponse(res, 200, true, 'Bannière supprimée.');
});
