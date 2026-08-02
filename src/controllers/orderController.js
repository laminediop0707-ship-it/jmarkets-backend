// ============================================================
// Contrôleur Commandes - checkout, suivi, gestion admin
// ============================================================
const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendResponse } = require('../utils/sendResponse');
const { generateOrderNumber } = require('../utils/generateOrderNumber');
const { getPagination, buildMeta } = require('../utils/pagination');

const prisma = new PrismaClient();
const SHIPPING_FEE = 2000; // FCFA, livraison standard Dakar
const TAX_RATE = 0; // pas de TVA appliquée par défaut (à ajuster selon la loi locale)

const parseOrder = (o) => ({
  ...o,
  trackingSteps: o.trackingSteps ? JSON.parse(o.trackingSteps) : [],
});

// POST /api/orders  (créer une commande à partir du panier)
exports.createOrder = asyncHandler(async (req, res) => {
  const { addressId, addressData, paymentMethod, couponCode } = req.body;

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: req.user.id },
    include: { product: true },
  });

  if (cartItems.length === 0) {
    return sendResponse(res, 400, false, 'Votre panier est vide.');
  }

  for (const item of cartItems) {
    if (item.product.stock < item.quantity) {
      return sendResponse(res, 400, false, `Stock insuffisant pour "${item.product.name}".`);
    }
  }

  let finalAddressId = addressId || null;
  if (!finalAddressId && addressData) {
    const newAddress = await prisma.address.create({
      data: {
        userId: req.user.id,
        fullName: addressData.fullName,
        phone: addressData.phone,
        street: addressData.street,
        city: addressData.city,
        region: addressData.region || null,
        postalCode: addressData.postalCode || null,
        country: addressData.country || 'Sénégal',
      },
    });
    finalAddressId = newAddress.id;
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  let discount = 0;
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
    if (coupon && coupon.isActive && subtotal >= coupon.minOrderValue &&
        coupon.usedCount < coupon.maxUses && (!coupon.expiresAt || coupon.expiresAt > new Date())) {
      discount = coupon.type === 'PERCENT' ? (subtotal * coupon.value) / 100 : coupon.value;
      await prisma.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
    }
  }

  const tax = subtotal * TAX_RATE;
  const total = Math.max(subtotal + SHIPPING_FEE + tax - discount, 0);

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId: req.user.id,
      addressId: finalAddressId,
      subtotal, shippingFee: SHIPPING_FEE, tax, discount, total,
      couponCode: couponCode || null,
      paymentMethod: paymentMethod || 'CASH_ON_DELIVERY',
      trackingSteps: JSON.stringify([
        { status: 'PENDING', date: new Date().toISOString(), note: 'Commande reçue' },
      ]),
      items: {
        create: cartItems.map((item) => ({
          productId: item.productId,
          name: item.product.name,
          image: item.product.images ? JSON.parse(item.product.images)[0] || '' : '',
          price: item.product.price,
          quantity: item.quantity,
          color: item.color,
          size: item.size,
        })),
      },
    },
    include: { items: true },
  });

  // Décrémenter le stock + incrémenter les ventes
  for (const item of cartItems) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity }, soldCount: { increment: item.quantity } },
    });
  }

  await prisma.cartItem.deleteMany({ where: { userId: req.user.id } });

  await prisma.notification.create({
    data: {
      userId: req.user.id,
      title: 'Commande confirmée',
      message: `Votre commande ${order.orderNumber} a bien été enregistrée.`,
    },
  });

  sendResponse(res, 201, true, 'Commande passée avec succès !', parseOrder(order));
});

// GET /api/orders  (mes commandes)
exports.getMyOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req);
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: true }, orderBy: { createdAt: 'desc' }, skip, take: limit,
    }),
    prisma.order.count({ where: { userId: req.user.id } }),
  ]);
  sendResponse(res, 200, true, 'Commandes récupérées.', orders.map(parseOrder), { meta: buildMeta(total, page, limit) });
});

// GET /api/orders/:id  (détail + suivi)
exports.getOrderById = asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: true, address: true, user: { select: { firstName: true, lastName: true, email: true } } },
  });
  if (!order) return sendResponse(res, 404, false, 'Commande introuvable.');
  if (order.userId !== req.user.id && req.user.role !== 'ADMIN') {
    return sendResponse(res, 403, false, 'Accès non autorisé.');
  }
  sendResponse(res, 200, true, 'Commande récupérée.', parseOrder(order));
});

// ---------- ADMIN ----------

// GET /api/admin/orders
exports.getAllOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req, 20);
  const { status } = req.query;
  const where = status ? { status } : {};

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where, include: { items: true, user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' }, skip, take: limit,
    }),
    prisma.order.count({ where }),
  ]);
  sendResponse(res, 200, true, 'Commandes récupérées.', orders.map(parseOrder), { meta: buildMeta(total, page, limit) });
});

const STATUS_LABELS = {
  PENDING: 'En attente', CONFIRMED: 'Confirmée', PROCESSING: 'En préparation',
  SHIPPED: 'Expédiée', DELIVERED: 'Livrée', CANCELLED: 'Annulée', REFUNDED: 'Remboursée',
};

// PUT /api/admin/orders/:id/status
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;

  const existing = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!existing) return sendResponse(res, 404, false, 'Commande introuvable.');

  const steps = existing.trackingSteps ? JSON.parse(existing.trackingSteps) : [];
  steps.push({ status, date: new Date().toISOString(), note: note || STATUS_LABELS[status] });

  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { status, trackingSteps: JSON.stringify(steps) },
  });

  await prisma.notification.create({
    data: {
      userId: order.userId,
      title: 'Mise à jour de commande',
      message: `Votre commande ${order.orderNumber} est maintenant : ${STATUS_LABELS[status]}.`,
    },
  });

  sendResponse(res, 200, true, 'Statut mis à jour.', parseOrder(order));
});
