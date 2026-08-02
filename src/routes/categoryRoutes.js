const router = require('express').Router();
const ctrl = require('../controllers/categoryController');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/', ctrl.getCategories);
router.get('/:slug', ctrl.getCategoryBySlug);
router.post('/', protect, restrictTo('ADMIN'), ctrl.createCategory);
router.put('/:id', protect, restrictTo('ADMIN'), ctrl.updateCategory);
router.delete('/:id', protect, restrictTo('ADMIN'), ctrl.deleteCategory);

module.exports = router;
