// ============================================================
// Contrôleur Contact & Newsletter
// ============================================================
const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendResponse } = require('../utils/sendResponse');
const { getPagination, buildMeta } = require('../utils/pagination');

const prisma = new PrismaClient();

exports.sendMessage = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;
  const contact = await prisma.contactMessage.create({ data: { name, email, subject, message } });
  sendResponse(res, 201, true, 'Message envoyé ! Nous vous répondrons sous 24-48h.', contact);
});

exports.getMessages = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req, 20);
  const [messages, total] = await Promise.all([
    prisma.contactMessage.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.contactMessage.count(),
  ]);
  sendResponse(res, 200, true, 'Messages récupérés.', messages, { meta: buildMeta(total, page, limit) });
});

exports.markMessageRead = asyncHandler(async (req, res) => {
  const message = await prisma.contactMessage.update({ where: { id: req.params.id }, data: { isRead: true } });
  sendResponse(res, 200, true, 'Message marqué comme lu.', message);
});

exports.subscribeNewsletter = asyncHandler(async (req, res) => {
  const { email } = req.body;
  try {
    const sub = await prisma.newsletter.create({ data: { email: email.toLowerCase() } });
    sendResponse(res, 201, true, 'Inscription à la newsletter réussie !', sub);
  } catch (e) {
    if (e.code === 'P2002') return sendResponse(res, 409, false, 'Cet email est déjà inscrit.');
    throw e;
  }
});
