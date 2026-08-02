// ============================================================
// Contrôleur Produits - catalogue public + gestion admin
// ============================================================
const { PrismaClient } = require('@prisma/client');
const slugify = require('slugify');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendResponse } = require('../utils/sendResponse');
const { getPagination, buildMeta } = require('../utils/pagination');

const prisma = new PrismaClient();

const parseProduct = (p) => ({
  ...p,
  images: p.images ? JSON.parse(p.images) : [],
  colors: p.colors ? JSON.parse(p.colors) : [],
  sizes: p.sizes ? JSON.parse(p.sizes) : [],
});

// GET /api/products  (recherche, filtres, tri, pagination)
exports.getProducts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req);
  const {
    q, category, brand, minPrice, maxPrice, sort, featured, isNew, minRating,
  } = req.query;

  const where = { isActive: true };

  if (q) {
    where.OR = [
      { name: { contains: q } },
      { description: { contains: q } },
    ];
  }
  if (category) where.category = { slug: category };
  if (brand) where.brand = { slug: brand };
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = parseFloat(minPrice);
    if (maxPrice) where.price.lte = parseFloat(maxPrice);
  }
  if (featured === 'true') where.isFeatured = true;
  if (isNew === 'true') where.isNew = true;
  if (minRating) where.rating = { gte: parseFloat(minRating) };

  let orderBy = { createdAt: 'desc' };
  if (sort === 'price_asc') orderBy = { price: 'asc' };
  if (sort === 'price_desc') orderBy = { price: 'desc' };
  if (sort === 'popular') orderBy = { soldCount: 'desc' };
  if (sort === 'rating') orderBy = { rating: 'desc' };
  if (sort === 'newest') orderBy = { createdAt: 'desc' };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where, orderBy, skip, take: limit,
      include: { category: true, brand: true },
    }),
    prisma.product.count({ where }),
  ]);

  sendResponse(res, 200, true, 'Produits récupérés.', products.map(parseProduct), {
    meta: buildMeta(total, page, limit),
  });
});

// GET /api/products/:slug
exports.getProductBySlug = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: {
      category: true,
      brand: true,
      reviews: { include: { user: { select: { firstName: true, lastName: true, avatar: true } } }, orderBy: { createdAt: 'desc' } },
    },
  });

  if (!product) return sendResponse(res, 404, false, 'Produit introuvable.');

  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, id: { not: product.id }, isActive: true },
    take: 4,
  });

  sendResponse(res, 200, true, 'Produit récupéré.', {
    ...parseProduct(product),
    related: related.map(parseProduct),
  });
});

// GET /api/products/search/suggestions?q=
exports.searchSuggestions = asyncHandler(async (req, res) => {
  const q = req.query.q || '';
  if (q.length < 2) return sendResponse(res, 200, true, 'ok', []);

  const products = await prisma.product.findMany({
    where: { isActive: true, name: { contains: q } },
    select: { id: true, name: true, slug: true, price: true, images: true },
    take: 6,
  });

  sendResponse(res, 200, true, 'Suggestions récupérées.', products.map(p => ({
    ...p, images: p.images ? JSON.parse(p.images) : [],
  })));
});

// ---------- ADMIN ----------

// POST /api/products (admin)
exports.createProduct = asyncHandler(async (req, res) => {
  const body = req.body;
  const slug = slugify(`${body.name}-${Date.now()}`, { lower: true, strict: true });

  const product = await prisma.product.create({
    data: {
      name: body.name,
      slug,
      description: body.description,
      price: parseFloat(body.price),
      oldPrice: body.oldPrice ? parseFloat(body.oldPrice) : null,
      stock: parseInt(body.stock) || 0,
      sku: body.sku || null,
      images: JSON.stringify(body.images || []),
      colors: JSON.stringify(body.colors || []),
      sizes: JSON.stringify(body.sizes || []),
      isFeatured: !!body.isFeatured,
      isNew: body.isNew !== undefined ? !!body.isNew : true,
      categoryId: body.categoryId,
      brandId: body.brandId || null,
      metaTitle: body.metaTitle || body.name,
      metaDesc: body.metaDesc || body.description?.slice(0, 150),
    },
  });

  sendResponse(res, 201, true, 'Produit créé avec succès.', parseProduct(product));
});

// PUT /api/products/:id (admin)
exports.updateProduct = asyncHandler(async (req, res) => {
  const body = req.body;
  const data = {};

  ['name', 'description', 'sku', 'categoryId', 'brandId', 'metaTitle', 'metaDesc'].forEach((f) => {
    if (body[f] !== undefined) data[f] = body[f];
  });
  ['price', 'oldPrice'].forEach((f) => {
    if (body[f] !== undefined) data[f] = body[f] === null ? null : parseFloat(body[f]);
  });
  if (body.stock !== undefined) data.stock = parseInt(body.stock);
  if (body.images !== undefined) data.images = JSON.stringify(body.images);
  if (body.colors !== undefined) data.colors = JSON.stringify(body.colors);
  if (body.sizes !== undefined) data.sizes = JSON.stringify(body.sizes);
  if (body.isFeatured !== undefined) data.isFeatured = !!body.isFeatured;
  if (body.isNew !== undefined) data.isNew = !!body.isNew;
  if (body.isActive !== undefined) data.isActive = !!body.isActive;

  const product = await prisma.product.update({ where: { id: req.params.id }, data });
  sendResponse(res, 200, true, 'Produit mis à jour.', parseProduct(product));
});

// DELETE /api/products/:id (admin)
exports.deleteProduct = asyncHandler(async (req, res) => {
  await prisma.product.delete({ where: { id: req.params.id } });
  sendResponse(res, 200, true, 'Produit supprimé.');
});
