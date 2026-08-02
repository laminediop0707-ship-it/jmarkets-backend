const router = require('express').Router();
const ctrl = require('../controllers/favoriteController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', ctrl.getFavorites);
router.post('/', ctrl.addFavorite);
router.delete('/:productId', ctrl.removeFavorite);

module.exports = router;
