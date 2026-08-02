// ============================================================
// Contrôleur Catégories & Marques
// ============================================================
const { PrismaClient } = require('@prisma/client');
const slugify = require('slugify');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendResponse } = require('../utils/sendResponse');

const prisma = new PrismaClient();

// GET /api/categories
exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: 'asc' },
  });
  sendResponse(res, 200, true, 'Catégories récupérées.', categories);
});

// GET /api/categories/:slug
exports.getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await prisma.category.findUnique({ where: { slug: req.params.slug } });
  if (!category) return sendResponse(res, 404, false, 'Catégorie introuvable.');
  sendResponse(res, 200, true, 'Catégorie récupérée.', category);
});

// POST /api/categories (admin)
exports.createCategory = asyncHandler(async (req, res) => {
  const { name, description, image } = req.body;
  const slug = slugify(name, { lower: true, strict: true });
  const category = await prisma.category.create({ data: { name, slug, description, image } });
  sendResponse(res, 201, true, 'Catégorie créée.', category);
});

// PUT /api/categories/:id (admin)
exports.updateCategory = asyncHandler(async (req, res) => {
  const { name, description, image } = req.body;
  const data = { description, image };
  if (name) { data.name = name; data.slug = slugify(name, { lower: true, strict: true }); }
  const category = await prisma.category.update({ where: { id: req.params.id }, data });
  sendResponse(res, 200, true, 'Catégorie mise à jour.', category);
});

// DELETE /api/categories/:id (admin)
exports.deleteCategory = asyncHandler(async (req, res) => {
  await prisma.category.delete({ where: { id: req.params.id } });
  sendResponse(res, 200, true, 'Catégorie supprimée.');
});

// ---------- MARQUES ----------

// GET /api/brands
exports.getBrands = asyncHandler(async (req, res) => {
  const brands = await prisma.brand.findMany({ orderBy: { name: 'asc' } });
  sendResponse(res, 200, true, 'Marques récupérées.', brands);
});

// POST /api/brands (admin)
exports.createBrand = asyncHandler(async (req, res) => {
  const { name, logo } = req.body;
  const slug = slugify(name, { lower: true, strict: true });
  const brand = await prisma.brand.create({ data: { name, slug, logo } });
  sendResponse(res, 201, true, 'Marque créée.', brand);
});

// DELETE /api/brands/:id (admin)
exports.deleteBrand = asyncHandler(async (req, res) => {
  await prisma.brand.delete({ where: { id: req.params.id } });
  sendResponse(res, 200, true, 'Marque supprimée.');
});
