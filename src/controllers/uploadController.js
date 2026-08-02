// ============================================================
// Contrôleur Upload d'images (admin) - retourne l'URL publique
// ============================================================
const { sendResponse } = require('../utils/sendResponse');

exports.uploadImage = (req, res) => {
  if (!req.file) return sendResponse(res, 400, false, 'Aucun fichier reçu.');
  const url = `/uploads/${req.file.filename}`;
  sendResponse(res, 201, true, 'Image téléversée.', { url });
};

exports.uploadImages = (req, res) => {
  if (!req.files || req.files.length === 0) return sendResponse(res, 400, false, 'Aucun fichier reçu.');
  const urls = req.files.map((f) => `/uploads/${f.filename}`);
  sendResponse(res, 201, true, 'Images téléversées.', { urls });
};
