// ============================================================
// Contrôleur Admin - Dashboard statistiques, utilisateurs, journal
// ============================================================
const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendResponse } = require('../utils/sendResponse');
const { getPagination, buildMeta } = require('../utils/pagination');

const prisma = new PrismaClient();

// GET /api/admin/dashboard
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalRevenue, totalOrders, totalProducts, totalCustomers,
    recentOrders, lowStockProducts, ordersByStatus, topProducts,
  ] = await Promise.all([
    prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: 'PAID' } }),
    prisma.order.count(),
    prisma.product.count(),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.order.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { user: { select: { firstName: true, lastName: true } } } }),
    prisma.product.findMany({ where: { stock: { lte: 5 } }, take: 5, orderBy: { stock: 'asc' } }),
    prisma.order.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.product.findMany({ orderBy: { soldCount: 'desc' }, take: 5 }),
  ]);

  // Revenus des 7 derniers jours pour le graphique
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const recentOrdersForChart = await prisma.order.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { createdAt: true, total: true },
  });

  const chartMap = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    chartMap[key] = 0;
  }
  recentOrdersForChart.forEach((o) => {
    const key = o.createdAt.toISOString().slice(0, 10);
    if (chartMap[key] !== undefined) chartMap[key] += o.total;
  });

  sendResponse(res, 200, true, 'Statistiques récupérées.', {
    totalRevenue: totalRevenue._sum.total || 0,
    totalOrders,
    totalProducts,
    totalCustomers,
    recentOrders,
    lowStockProducts,
    ordersByStatus,
    topProducts,
    revenueChart: Object.entries(chartMap).map(([date, total]) => ({ date, total })),
  });
});

// GET /api/admin/users
exports.getUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req, 20);
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip, take: limit, orderBy: { createdAt: 'desc' },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, isActive: true, createdAt: true },
    }),
    prisma.user.count(),
  ]);
  sendResponse(res, 200, true, 'Utilisateurs récupérés.', users, { meta: buildMeta(total, page, limit) });
});

// PUT /api/admin/users/:id/toggle-active
exports.toggleUserActive = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) return sendResponse(res, 404, false, 'Utilisateur introuvable.');
  const updated = await prisma.user.update({ where: { id: req.params.id }, data: { isActive: !user.isActive } });
  sendResponse(res, 200, true, `Utilisateur ${updated.isActive ? 'activé' : 'désactivé'}.`, updated);
});

// PUT /api/admin/users/:id/role
exports.updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { role } });
  sendResponse(res, 200, true, 'Rôle mis à jour.', user);
});

// GET /api/admin/logs
exports.getActivityLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req, 30);
  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      skip, take: limit, orderBy: { createdAt: 'desc' },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    }),
    prisma.activityLog.count(),
  ]);
  sendResponse(res, 200, true, 'Journal récupéré.', logs, { meta: buildMeta(total, page, limit) });
});
