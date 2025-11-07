const Favorite = require('../models/Favorite');
const Book = require('../models/Book');

// @desc    Add book to favorites
// @route   POST /api/favorites
// @access  Private
const addFavorite = async (req, res) => {
  try {
    const { bookId } = req.body;
    const userId = req.user.id;

    if (!bookId) {
      return res.status(400).json({
        success: false,
        message: 'Book ID is required',
      });
    }

    // Check if book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    // Check if already favorited
    const existingFavorite = await Favorite.findOne({
      user: userId,
      book: bookId,
    });

    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: 'Book is already in your favorites',
      });
    }

    // Create favorite
    const favorite = await Favorite.create({
      user: userId,
      book: bookId,
    });

    // Populate book details
    await favorite.populate('book', 'title author coverImage isbn category description availableCopies totalCopies');

    res.status(201).json({
      success: true,
      message: 'Book added to favorites',
      data: favorite,
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get user's favorites
// @route   GET /api/favorites
// @access  Private
const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { isRead } = req.query;

    const query = { user: userId };
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    const favorites = await Favorite.find(query)
      .populate('book', 'title author coverImage isbn category description availableCopies totalCopies publishedYear publisher language pages')
      .sort({ addedAt: -1 });

    res.status(200).json({
      success: true,
      count: favorites.length,
      data: favorites,
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Remove book from favorites
// @route   DELETE /api/favorites/:id
// @access  Private
const removeFavorite = async (req, res) => {
  try {
    const favoriteId = req.params.id;
    const userId = req.user.id;

    const favorite = await Favorite.findById(favoriteId);

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found',
      });
    }

    // Check if user owns this favorite
    if (favorite.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to remove this favorite',
      });
    }

    await Favorite.findByIdAndDelete(favoriteId);

    res.status(200).json({
      success: true,
      message: 'Book removed from favorites',
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Toggle read status
// @route   PATCH /api/favorites/:id/read
// @access  Private
const toggleReadStatus = async (req, res) => {
  try {
    const favoriteId = req.params.id;
    const userId = req.user.id;
    const { isRead } = req.body;

    const favorite = await Favorite.findById(favoriteId);

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found',
      });
    }

    // Check if user owns this favorite
    if (favorite.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this favorite',
      });
    }

    favorite.isRead = isRead !== undefined ? isRead : !favorite.isRead;
    if (favorite.isRead && !favorite.readAt) {
      favorite.readAt = new Date();
    } else if (!favorite.isRead) {
      favorite.readAt = null;
    }

    await favorite.save();
    await favorite.populate('book', 'title author coverImage isbn category');

    res.status(200).json({
      success: true,
      message: favorite.isRead ? 'Book marked as read' : 'Book marked as unread',
      data: favorite,
    });
  } catch (error) {
    console.error('Toggle read status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Check if book is favorited
// @route   GET /api/favorites/check/:bookId
// @access  Private
const checkFavorite = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;

    const favorite = await Favorite.findOne({
      user: userId,
      book: bookId,
    });

    res.status(200).json({
      success: true,
      isFavorited: !!favorite,
      data: favorite,
    });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  addFavorite,
  getFavorites,
  removeFavorite,
  toggleReadStatus,
  checkFavorite,
};

