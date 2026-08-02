const router = require('express').Router();
const ctrl = require('../controllers/contactController');
const { protect, restrictTo } = require('../middleware/auth');

router.post('/', ctrl.sendMessage);
router.post('/newsletter', ctrl.subscribeNewsletter);
router.get('/', protect, restrictTo('ADMIN'), ctrl.getMessages);
router.put('/:id/read', protect, restrictTo('ADMIN'), ctrl.markMessageRead);

module.exports = router;
