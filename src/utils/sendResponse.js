// ============================================================
// Formatteur de réponse API standardisé
// ============================================================
exports.sendResponse = (res, statusCode, success, message, data = null, extra = {}) => {
  const payload = { success, message, ...extra };
  if (data !== null) payload.data = data;
  return res.status(statusCode).json(payload);
};
