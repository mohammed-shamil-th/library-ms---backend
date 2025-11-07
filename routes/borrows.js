const express = require('express');
const router = express.Router();
const {
  borrowBook,
  returnBook,
  getActiveBorrows,
  getAllBorrows,
  getBorrowHistory,
  getOverdueBorrows,
  createBorrowAdmin,
  deleteBorrow,
  exportBorrowHistory,
} = require('../controllers/borrowController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// User routes
router.post('/', borrowBook);
router.get('/active', getActiveBorrows);
router.patch('/:id/return', returnBook);

// Admin and user routes (with different access levels)
router.get('/', getAllBorrows);
router.get('/history/:userId', getBorrowHistory);
router.get('/history/:userId/export', exportBorrowHistory);

// Admin only routes
router.post('/admin', authorize('admin'), createBorrowAdmin);
router.get('/overdue', authorize('admin'), getOverdueBorrows);
router.delete('/:id', authorize('admin'), deleteBorrow);

module.exports = router;

