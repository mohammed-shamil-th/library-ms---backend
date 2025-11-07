const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getUserStats, getAllUsers, updateUser, deleteUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Admin routes
router.get('/', authorize('admin'), getAllUsers);
router.patch('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

// Stats route (user sees own, admin sees any)
router.get('/:id/stats', getUserStats);

module.exports = router;

