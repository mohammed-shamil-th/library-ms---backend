const express = require('express');
const router = express.Router();
const {
  addBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
  searchBooks,
  updateBookStock,
  getRelatedBooks,
} = require('../controllers/bookController');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/books
// @desc    Add a new book
// @access  Private/Admin
router.post('/', protect, authorize('admin'), addBook);

// @route   GET /api/books
// @desc    Get all books with pagination and filters
// @access  Public
router.get('/', getBooks);

// @route   GET /api/books/search
// @desc    Search books by title, author, or ISBN
// @access  Public
router.get('/search', searchBooks);

// @route   PATCH /api/books/:id/stock
// @desc    Update book stock quantity
// @access  Private/Admin
// Note: This must be defined before /:id route to avoid route conflicts
router.patch('/:id/stock', protect, authorize('admin'), updateBookStock);

// @route   GET /api/books/:id/related
// @desc    Get related books by category
// @access  Public
// Note: This must be defined before /:id route to avoid route conflicts
router.get('/:id/related', getRelatedBooks);

// @route   GET /api/books/:id
// @desc    Get single book by ID
// @access  Public
router.get('/:id', getBookById);

// @route   PUT /api/books/:id
// @desc    Update book details
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), updateBook);

// @route   DELETE /api/books/:id
// @desc    Delete a book
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), deleteBook);

module.exports = router;

