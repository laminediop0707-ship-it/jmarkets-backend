const router = require('express').Router();
const ctrl = require('../controllers/adminController');
const orderCtrl = require('../controllers/orderController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect, restrictTo('ADMIN'));
router.get('/dashboard', ctrl.getDashboardStats);
router.get('/users', ctrl.getUsers);
router.put('/users/:id/toggle-active', ctrl.toggleUserActive);
router.put('/users/:id/role', ctrl.updateUserRole);
router.get('/logs', ctrl.getActivityLogs);
router.get('/orders', orderCtrl.getAllOrders);
router.put('/orders/:id/status', orderCtrl.updateOrderStatus);

module.exports = router;
