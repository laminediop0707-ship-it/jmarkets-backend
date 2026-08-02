const router = require('express').Router();
const ctrl = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

router.delete('/:id', protect, ctrl.deleteReview);

module.exports = router;
