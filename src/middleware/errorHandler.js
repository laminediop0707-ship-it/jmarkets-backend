// ============================================================
// Gestion centralisée des erreurs
// ============================================================

exports.notFound = (req, res, next) => {
  res.status(404).json({ success: false, message: `Route introuvable: ${req.originalUrl}` });
};

exports.errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Erreur interne du serveur';

  if (err.code === 'P2002') {
    statusCode = 409;
    message = `Cette valeur existe déjà (${err.meta?.target?.join(', ') || 'champ unique'}).`;
  }
  if (err.code === 'P2025') {
    statusCode = 404;
    message = "Ressource introuvable.";
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

exports.asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
