const router = require('express').Router();
const ctrl = require('../controllers/bannerController');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/', ctrl.getBanners);
router.get('/all', protect, restrictTo('ADMIN'), ctrl.getAllBanners);
router.post('/', protect, restrictTo('ADMIN'), ctrl.createBanner);
router.put('/:id', protect, restrictTo('ADMIN'), ctrl.updateBanner);
router.delete('/:id', protect, restrictTo('ADMIN'), ctrl.deleteBanner);

module.exports = router;
