const express = require('express');
const router = express.Router();
const {
  addFavorite,
  getFavorites,
  removeFavorite,
  toggleReadStatus,
  checkFavorite,
} = require('../controllers/favoriteController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.post('/', addFavorite);
router.get('/', getFavorites);
router.get('/check/:bookId', checkFavorite);
router.patch('/:id/read', toggleReadStatus);
router.delete('/:id', removeFavorite);

module.exports = router;

