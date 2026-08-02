const router = require('express').Router();
const ctrl = require('../controllers/categoryController');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/', ctrl.getBrands);
router.post('/', protect, restrictTo('ADMIN'), ctrl.createBrand);
router.delete('/:id', protect, restrictTo('ADMIN'), ctrl.deleteBrand);

module.exports = router;
