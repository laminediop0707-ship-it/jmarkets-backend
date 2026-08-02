const router = require('express').Router();
const ctrl = require('../controllers/couponController');
const { protect, restrictTo } = require('../middleware/auth');

router.post('/validate', ctrl.validateCoupon);
router.get('/', protect, restrictTo('ADMIN'), ctrl.getCoupons);
router.post('/', protect, restrictTo('ADMIN'), ctrl.createCoupon);
router.put('/:id', protect, restrictTo('ADMIN'), ctrl.updateCoupon);
router.delete('/:id', protect, restrictTo('ADMIN'), ctrl.deleteCoupon);

module.exports = router;
