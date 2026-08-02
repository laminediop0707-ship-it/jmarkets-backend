// ============================================================
// Helper de pagination réutilisable
// ============================================================
exports.getPagination = (req, defaultLimit = 12) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || defaultLimit, 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

exports.buildMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit) || 1,
});
