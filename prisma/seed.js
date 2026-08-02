// ============================================================
// JMARKET'S - Script de peuplement de la base de données
// Crée : admin, catégories, marques, produits, avis, coupons, bannières
// Lancer avec : npm run seed
// ============================================================
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const slugify = require('slugify');

const prisma = new PrismaClient();

// Images libres de droits (Unsplash) - catégories & produits
const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

const categories = [
  { name: 'Électronique', image: img('photo-1498049794561-7780e7231661') },
  { name: 'Mode Homme', image: img('photo-1516257984-b1b4d707412e') },
  { name: 'Mode Femme', image: img('photo-1483985988355-763728e1935b') },
  { name: 'Maison & Cuisine', image: img('photo-1556911220-e15b29be8c8f') },
  { name: 'Beauté & Santé', image: img('photo-1522335789203-aabd1fc54bc9') },
  { name: 'Sport & Loisirs', image: img('photo-1517649763962-0c623066013b') },
  { name: 'Chaussures', image: img('photo-1595950653106-6c9ebd614d3a') },
  { name: 'Téléphonie', image: img('photo-1511707171634-5f897ff02aa9') },
];

const brands = ['Samsung', 'Apple', 'Nike', 'Adidas', 'Xiaomi', 'Zara', 'JBL', 'Sony'];

const productsData = [
  { name: 'Smartphone Galaxy A54 5G 128Go', category: 'Téléphonie', brand: 'Samsung', price: 189000, oldPrice: 219000, images: ['photo-1610945265064-0e34e5519bbf', 'photo-1598327105666-5b89351aff97'] },
  { name: 'iPhone 14 Pro 256Go', category: 'Téléphonie', brand: 'Apple', price: 649000, oldPrice: 699000, images: ['photo-1663499482523-1c0c1bae4ce1', 'photo-1592286927505-1def25115481'] },
  { name: 'Casque Bluetooth JBL Tune 760NC', category: 'Électronique', brand: 'JBL', price: 39900, oldPrice: 49900, images: ['photo-1583394838336-acd977736f90', 'photo-1546435770-a3e426bf472b'] },
  { name: 'Ordinateur Portable 15.6" 8Go RAM', category: 'Électronique', brand: 'Xiaomi', price: 349000, oldPrice: null, images: ['photo-1496181133206-80ce9b88a853', 'photo-1587614382346-4ec70e388b28'] },
  { name: 'Montre connectée Sport Watch', category: 'Électronique', brand: 'Xiaomi', price: 45000, oldPrice: 59900, images: ['photo-1523275335684-37898b6baf30', 'photo-1546868871-7041f2a55e12'] },
  { name: 'Enceinte Bluetooth portable JBL Flip 6', category: 'Électronique', brand: 'JBL', price: 65000, oldPrice: null, images: ['photo-1608043152269-423dbba4e7e1', 'photo-1608043152269-423dbba4e7e1'] },
  { name: 'T-shirt Homme Coton Premium', category: 'Mode Homme', brand: 'Nike', price: 12500, oldPrice: 15000, images: ['photo-1521572163474-6864f9cf17ab', 'photo-1503341504253-dff4815485f1'] },
  { name: 'Veste Homme Casual', category: 'Mode Homme', brand: 'Zara', price: 35000, oldPrice: 42000, images: ['photo-1551028719-00167b16eac5', 'photo-1544022613-e87ca75a784a'] },
  { name: 'Jean Slim Homme', category: 'Mode Homme', brand: 'Zara', price: 22000, oldPrice: null, images: ['photo-1542272604-787c3835535d', 'photo-1541099649105-f69ad21f3246'] },
  { name: 'Robe Élégante Femme', category: 'Mode Femme', brand: 'Zara', price: 28000, oldPrice: 34000, images: ['photo-1595777457583-95e059d581b8', 'photo-1572804013309-59a88b7e92f1'] },
  { name: 'Sac à Main Femme Cuir', category: 'Mode Femme', brand: 'Zara', price: 42000, oldPrice: null, images: ['photo-1584917865442-de89df76afd3', 'photo-1548036328-c9fa89d128fa'] },
  { name: 'Chemisier Femme Chic', category: 'Mode Femme', brand: 'Zara', price: 18500, oldPrice: 23000, images: ['photo-1551163943-3f6a855d1153', 'photo-1485968579580-b6d095142e6e'] },
  { name: 'Basket Nike Air Max', category: 'Chaussures', brand: 'Nike', price: 79000, oldPrice: 95000, images: ['photo-1542291026-7eec264c27ff', 'photo-1600185365483-26d7a4cc7519'] },
  { name: 'Basket Adidas Ultraboost', category: 'Chaussures', brand: 'Adidas', price: 85000, oldPrice: null, images: ['photo-1595950653106-6c9ebd614d3a', 'photo-1465453869711-7e174808ace9'] },
  { name: 'Sandales Femme Été', category: 'Chaussures', brand: 'Zara', price: 15000, oldPrice: 19000, images: ['photo-1603487742131-4160ec999306', 'photo-1543163521-1bf539c55dd2'] },
  { name: 'Blender Multifonction 1.5L', category: 'Maison & Cuisine', brand: 'Xiaomi', price: 29900, oldPrice: 36000, images: ['photo-1570222094114-d054a817e56b', 'photo-1570222094288-32d8e59f8b6b'] },
  { name: 'Set de Casseroles Inox (5 pièces)', category: 'Maison & Cuisine', brand: 'Samsung', price: 45000, oldPrice: null, images: ['photo-1584990347449-a2d4c2761a83', 'photo-1584990347449-a2d4c2761a83'] },
  { name: 'Lampe de Bureau LED', category: 'Maison & Cuisine', brand: 'Xiaomi', price: 12000, oldPrice: 15500, images: ['photo-1507473885765-e6ed057f782c', 'photo-1524634126442-357e0eac3c14'] },
  { name: 'Crème Hydratante Visage Bio', category: 'Beauté & Santé', brand: 'Zara', price: 8500, oldPrice: 11000, images: ['photo-1556228720-195a672e8a03', 'photo-1571781926291-c477ebfd024b'] },
  { name: 'Parfum Homme Élégance 100ml', category: 'Beauté & Santé', brand: 'Zara', price: 32000, oldPrice: 38000, images: ['photo-1541643600914-78b084683601', 'photo-1523293182086-7651a899d37f'] },
  { name: 'Kit Maquillage Professionnel', category: 'Beauté & Santé', brand: 'Zara', price: 25000, oldPrice: null, images: ['photo-1596462502278-27bfdc403348', 'photo-1512496015851-a90fb38ba796'] },
  { name: 'Ballon de Football Officiel', category: 'Sport & Loisirs', brand: 'Adidas', price: 15000, oldPrice: 18500, images: ['photo-1614632537197-38a17061c2bd', 'photo-1579952363873-27f3bade9f55'] },
  { name: 'Tapis de Yoga Antidérapant', category: 'Sport & Loisirs', brand: 'Nike', price: 13500, oldPrice: null, images: ['photo-1592432678016-e910b452f9a2', 'photo-1518611012118-696072aa579a'] },
  { name: 'Haltères Réglables 20kg (paire)', category: 'Sport & Loisirs', brand: 'Adidas', price: 55000, oldPrice: 65000, images: ['photo-1638536532686-d610adfc8e5c', 'photo-1584735175315-9d5df23860e6'] },
];

const reviewComments = [
  { rating: 5, comment: "Excellent produit, conforme à la description. Livraison rapide, je recommande vivement !" },
  { rating: 4, comment: "Très bon rapport qualité-prix. Quelques petits détails à améliorer mais globalement satisfait." },
  { rating: 5, comment: "Qualité au rendez-vous, exactement ce que je cherchais. Le service client a été très réactif." },
  { rating: 3, comment: "Correct sans plus. La livraison a pris un peu plus de temps que prévu." },
  { rating: 5, comment: "Je suis ravi(e) de mon achat, je recommande cette boutique sans hésiter !" },
];

async function main() {
  console.log('🌱 Début du peuplement de la base de données JMARKET\'S...\n');

  // Nettoyage (ordre important pour respecter les contraintes de clés étrangères)
  await prisma.$transaction([
    prisma.activityLog.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.review.deleteMany(),
    prisma.favorite.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.product.deleteMany(),
    prisma.brand.deleteMany(),
    prisma.category.deleteMany(),
    prisma.coupon.deleteMany(),
    prisma.banner.deleteMany(),
    prisma.address.deleteMany(),
    prisma.contactMessage.deleteMany(),
    prisma.newsletter.deleteMany(),
    prisma.user.deleteMany(),
  ]);
  console.log('🧹 Anciennes données supprimées.');

  // ---------- Admin ----------
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'ChangeMoi123!', 12);
  const admin = await prisma.user.create({
    data: {
      firstName: 'Admin',
      lastName: "JMARKET'S",
      email: process.env.ADMIN_EMAIL || 'admin@jmarkets.com',
      password: adminPassword,
      role: 'ADMIN',
      phone: '+221770000000',
    },
  });
  console.log(`👤 Administrateur créé : ${admin.email}`);

  // ---------- Client de démo ----------
  const demoPassword = await bcrypt.hash('Client123!', 12);
  const demoUser = await prisma.user.create({
    data: {
      firstName: 'Fatou', lastName: 'Diop', email: 'client@jmarkets.com',
      password: demoPassword, phone: '+221771234567',
      addresses: {
        create: [{ fullName: 'Fatou Diop', phone: '+221771234567', street: 'Rue 10, Sacré-Cœur', city: 'Dakar', region: 'Dakar', isDefault: true }],
      },
    },
  });
  console.log(`👤 Client de démo créé : ${demoUser.email} (mot de passe : Client123!)`);

  // ---------- Catégories ----------
  const catMap = {};
  for (const c of categories) {
    const cat = await prisma.category.create({
      data: { name: c.name, slug: slugify(c.name, { lower: true, strict: true }), image: c.image, description: `Découvrez notre sélection ${c.name}.` },
    });
    catMap[c.name] = cat.id;
  }
  console.log(`📁 ${categories.length} catégories créées.`);

  // ---------- Marques ----------
  const brandMap = {};
  for (const b of brands) {
    const brand = await prisma.brand.create({ data: { name: b, slug: slugify(b, { lower: true, strict: true }) } });
    brandMap[b] = brand.id;
  }
  console.log(`🏷️  ${brands.length} marques créées.`);

  // ---------- Produits ----------
  const createdProducts = [];
  for (const p of productsData) {
    const isFeatured = Math.random() > 0.6;
    const isNew = Math.random() > 0.5;
    const stock = Math.floor(Math.random() * 60) + (Math.random() > 0.85 ? 0 : 5);
    const soldCount = Math.floor(Math.random() * 200);

    const product = await prisma.product.create({
      data: {
        name: p.name,
        slug: slugify(`${p.name}`, { lower: true, strict: true }) + '-' + Math.floor(Math.random() * 10000),
        description: `${p.name} — Produit de haute qualité, sélectionné avec soin pour vous offrir le meilleur rapport qualité-prix. Livraison rapide partout à Dakar et dans les grandes villes du Sénégal. Garantie satisfait ou remboursé sous 7 jours.`,
        price: p.price,
        oldPrice: p.oldPrice,
        stock,
        sku: 'JM-' + Math.random().toString(36).slice(2, 9).toUpperCase(),
        images: JSON.stringify(p.images.map(img)),
        colors: JSON.stringify(['Noir', 'Blanc', 'Bleu'].slice(0, Math.floor(Math.random() * 3) + 1)),
        sizes: JSON.stringify(['Mode Homme', 'Mode Femme', 'Chaussures'].includes(p.category) ? ['S', 'M', 'L', 'XL'] : []),
        isFeatured, isNew,
        soldCount,
        categoryId: catMap[p.category],
        brandId: brandMap[p.brand],
        metaTitle: `${p.name} | JMARKET'S`,
        metaDesc: `Achetez ${p.name} au meilleur prix sur JMARKET'S. Livraison rapide, paiement sécurisé.`,
      },
    });
    createdProducts.push(product);
  }
  console.log(`📦 ${createdProducts.length} produits créés.`);

  // ---------- Avis clients (fictifs) ----------
  let reviewCount = 0;
  for (const product of createdProducts) {
    const numReviews = Math.floor(Math.random() * 4);
    for (let i = 0; i < numReviews; i++) {
      const r = reviewComments[Math.floor(Math.random() * reviewComments.length)];
      await prisma.review.create({
        data: { productId: product.id, userId: demoUser.id, rating: r.rating, comment: r.comment },
      });
      reviewCount++;
    }
    const reviews = await prisma.review.findMany({ where: { productId: product.id } });
    if (reviews.length) {
      const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
      await prisma.product.update({ where: { id: product.id }, data: { rating: Math.round(avg * 10) / 10, reviewCount: reviews.length } });
    }
  }
  console.log(`⭐ ${reviewCount} avis créés.`);

  // ---------- Coupons ----------
  await prisma.coupon.createMany({
    data: [
      { code: 'BIENVENUE10', type: 'PERCENT', value: 10, minOrderValue: 10000, maxUses: 500 },
      { code: 'JMARKETS20', type: 'PERCENT', value: 20, minOrderValue: 50000, maxUses: 200 },
      { code: 'LIVRAISON', type: 'FIXED', value: 2000, minOrderValue: 15000, maxUses: 1000 },
    ],
  });
  console.log('🎟️  3 coupons créés.');

  // ---------- Bannières Hero ----------
  await prisma.banner.createMany({
    data: [
      { title: "Soldes d'été jusqu'à -50%", subtitle: 'Sur toute la mode et l\'électronique', image: img('photo-1607082349566-187342175e2f'), link: '/produits', position: 'hero', order: 1 },
      { title: 'Nouveaux smartphones disponibles', subtitle: 'Découvrez les derniers modèles', image: img('photo-1511707171634-5f897ff02aa9'), link: '/produits?category=telephonie', position: 'hero', order: 2 },
      { title: 'Livraison gratuite dès 15 000 FCFA', subtitle: 'Partout à Dakar sous 48h', image: img('photo-1601924994987-69e26d50dc26'), link: '/produits', position: 'hero', order: 3 },
    ],
  });
  console.log('🖼️  3 bannières créées.');

  console.log('\n✅ Peuplement terminé avec succès !\n');
  console.log('----------------------------------------');
  console.log(`🔐 Connexion admin : ${admin.email} / ${process.env.ADMIN_PASSWORD || 'ChangeMoi123!'}`);
  console.log(`🔐 Connexion client démo : client@jmarkets.com / Client123!`);
  console.log('----------------------------------------\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du peuplement :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
