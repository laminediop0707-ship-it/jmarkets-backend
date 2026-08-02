// ============================================================
// Génère un numéro de commande lisible et unique
// Format: JM-20260731-XXXXX
// ============================================================
exports.generateOrderNumber = () => {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `JM-${y}${m}${d}-${rand}`;
};
