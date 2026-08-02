const router = require('express').Router();
const upload = require('../middleware/upload');
const ctrl = require('../controllers/uploadController');
const { protect, restrictTo } = require('../middleware/auth');

router.post('/', protect, restrictTo('ADMIN'), upload.single('image'), ctrl.uploadImage);
router.post('/multiple', protect, restrictTo('ADMIN'), upload.array('images', 10), ctrl.uploadImages);

module.exports = router;
