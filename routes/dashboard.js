const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getPopularBooks,
  getActiveUsers,
  getBorrowingTrends,
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/popular-books', getPopularBooks);
router.get('/active-users', getActiveUsers);
router.get('/trends', getBorrowingTrends);

module.exports = router;

