const router = require('express').Router();
const ctrl = require('../controllers/productController');
const reviewCtrl = require('../controllers/reviewController');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/', ctrl.getProducts);
router.get('/search/suggestions', ctrl.searchSuggestions);
router.get('/:slug', ctrl.getProductBySlug);

router.post('/', protect, restrictTo('ADMIN'), ctrl.createProduct);
router.put('/:id', protect, restrictTo('ADMIN'), ctrl.updateProduct);
router.delete('/:id', protect, restrictTo('ADMIN'), ctrl.deleteProduct);

router.post('/:productId/reviews', protect, reviewCtrl.addReview);

module.exports = router;
