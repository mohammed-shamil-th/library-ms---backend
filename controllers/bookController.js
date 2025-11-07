const Book = require('../models/Book');

// @desc    Add a new book
// @route   POST /api/books
// @access  Private/Admin
const addBook = async (req, res) => {
  try {
    const {
      title,
      author,
      isbn,
      category,
      description,
      coverImage,
      publishedYear,
      totalCopies,
      availableCopies,
      language,
      pages,
      publisher,
    } = req.body;

    // Validation
    if (!title || !author || !isbn || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, author, ISBN, and category',
      });
    }

    // Check if ISBN already exists
    const existingBook = await Book.findOne({ isbn: isbn.replace(/-/g, '') });
    if (existingBook) {
      return res.status(400).json({
        success: false,
        message: 'Book with this ISBN already exists',
      });
    }

    // Set availableCopies if not provided (default to totalCopies)
    const finalTotalCopies = totalCopies || 1;
    const finalAvailableCopies =
      availableCopies !== undefined ? availableCopies : finalTotalCopies;

    // Validate availableCopies doesn't exceed totalCopies
    if (finalAvailableCopies > finalTotalCopies) {
      return res.status(400).json({
        success: false,
        message: 'Available copies cannot exceed total copies',
      });
    }

    // Create book
    const book = await Book.create({
      title,
      author,
      isbn,
      category,
      description,
      coverImage,
      publishedYear,
      totalCopies: finalTotalCopies,
      availableCopies: finalAvailableCopies,
      language: language || 'English',
      pages,
      publisher,
      addedBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Book added successfully',
      data: book,
    });
  } catch (error) {
    console.error('Add book error:', error);
    
    // Handle duplicate ISBN error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Book with this ISBN already exists',
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while adding book',
      error: error.message,
    });
  }
};

// @desc    Get all books with pagination and filters
// @route   GET /api/books
// @access  Public
const getBooks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      language,
      availability,
      sort = 'title',
      order = 'asc',
    } = req.query;

    // Build query
    const query = {};

    if (category) {
      query.category = category;
    }

    if (language) {
      query.language = language;
    }

    if (availability === 'available') {
      query.availableCopies = { $gt: 0 };
    } else if (availability === 'out_of_stock') {
      query.availableCopies = 0;
    } else if (availability === 'low_stock') {
      query.availableCopies = { $lte: 2, $gt: 0 };
    }

    // Build sort object
    const sortOrder = order === 'desc' ? -1 : 1;
    let sortObj = {};

    switch (sort) {
      case 'title':
        sortObj = { title: sortOrder };
        break;
      case 'author':
        sortObj = { author: sortOrder };
        break;
      case 'year':
        sortObj = { publishedYear: sortOrder };
        break;
      case 'popularity':
        // For now, sort by createdAt (newest first)
        // Can be enhanced with actual borrow count later
        sortObj = { createdAt: -1 };
        break;
      default:
        sortObj = { title: sortOrder };
    }

    // Calculate pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const books = await Book.find(query)
      .populate('addedBy', 'name email')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const total = await Book.countDocuments(query);

    // Add availability status to each book
    const booksWithStatus = books.map((book) => {
      let status = 'available';
      if (book.availableCopies === 0) {
        status = 'out_of_stock';
      } else if (book.availableCopies <= 2) {
        status = 'low_stock';
      }
      return {
        ...book,
        availabilityStatus: status,
      };
    });

    res.status(200).json({
      success: true,
      data: booksWithStatus,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching books',
      error: error.message,
    });
  }
};

// @desc    Get single book by ID
// @route   GET /api/books/:id
// @access  Public
const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate(
      'addedBy',
      'name email'
    );

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    // Add availability status
    let status = 'available';
    if (book.availableCopies === 0) {
      status = 'out_of_stock';
    } else if (book.availableCopies <= 2) {
      status = 'low_stock';
    }

    const bookWithStatus = {
      ...book.toObject(),
      availabilityStatus: status,
    };

    res.status(200).json({
      success: true,
      data: bookWithStatus,
    });
  } catch (error) {
    console.error('Get book by ID error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid book ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching book',
      error: error.message,
    });
  }
};

// @desc    Get related books by category
// @route   GET /api/books/:id/related
// @access  Public
const getRelatedBooks = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    // Find books in the same category, excluding the current book
    const relatedBooks = await Book.find({
      category: book.category,
      _id: { $ne: req.params.id },
    })
      .limit(5)
      .select('title author coverImage category availableCopies totalCopies isbn description')
      .lean();

    // Add availability status to each related book
    const booksWithStatus = relatedBooks.map((book) => {
      let status = 'available';
      if (book.availableCopies === 0) {
        status = 'out_of_stock';
      } else if (book.availableCopies <= 2) {
        status = 'low_stock';
      }
      return {
        ...book,
        availabilityStatus: status,
      };
    });

    res.status(200).json({
      success: true,
      data: booksWithStatus,
    });
  } catch (error) {
    console.error('Get related books error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid book ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching related books',
      error: error.message,
    });
  }
};

// @desc    Update book details
// @route   PUT /api/books/:id
// @access  Private/Admin
const updateBook = async (req, res) => {
  try {
    const {
      title,
      author,
      isbn,
      category,
      description,
      coverImage,
      publishedYear,
      language,
      pages,
      publisher,
      availableCopies,
      totalCopies,
    } = req.body;

    // Find book
    let book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    // Check if ISBN is being changed and if it's unique
    if (isbn && isbn !== book.isbn) {
      const normalizedISBN = isbn.replace(/-/g, '');
      const existingBook = await Book.findOne({ isbn: normalizedISBN });
      if (existingBook) {
        return res.status(400).json({
          success: false,
          message: 'Book with this ISBN already exists',
        });
      }
    }

    // Update fields
    if (title !== undefined) book.title = title;
    if (author !== undefined) book.author = author;
    if (isbn !== undefined) book.isbn = isbn;
    if (category !== undefined) book.category = category;
    if (description !== undefined) book.description = description;
    if (coverImage !== undefined) book.coverImage = coverImage;
    if (publishedYear !== undefined) book.publishedYear = publishedYear;
    if (language !== undefined) book.language = language;
    if (pages !== undefined) book.pages = pages;
    if (publisher !== undefined) book.publisher = publisher;

    // Update stock quantities if provided
    if (totalCopies !== undefined) {
      const finalTotalCopies = parseInt(totalCopies);
      if (finalTotalCopies < 0) {
        return res.status(400).json({
          success: false,
          message: 'Total copies cannot be negative',
        });
      }
      book.totalCopies = finalTotalCopies;
      
      // If totalCopies is reduced, adjust availableCopies if needed
      if (book.availableCopies > finalTotalCopies) {
        book.availableCopies = finalTotalCopies;
      }
    }

    if (availableCopies !== undefined) {
      const finalAvailableCopies = parseInt(availableCopies);
      if (finalAvailableCopies < 0) {
        return res.status(400).json({
          success: false,
          message: 'Available copies cannot be negative',
        });
      }
      
      const finalTotalCopies = totalCopies !== undefined ? parseInt(totalCopies) : book.totalCopies;
      if (finalAvailableCopies > finalTotalCopies) {
        return res.status(400).json({
          success: false,
          message: 'Available copies cannot exceed total copies',
        });
      }
      
      book.availableCopies = finalAvailableCopies;
    }

    await book.save();

    res.status(200).json({
      success: true,
      message: 'Book updated successfully',
      data: book,
    });
  } catch (error) {
    console.error('Update book error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Book with this ISBN already exists',
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid book ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating book',
      error: error.message,
    });
  }
};

// @desc    Delete a book
// @route   DELETE /api/books/:id
// @access  Private/Admin
const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    // TODO: Check if book has active borrows
    // For now, we'll allow deletion
    // When Borrow model is created, check:
    // const activeBorrows = await Borrow.countDocuments({ 
    //   book: req.params.id, 
    //   status: 'borrowed' 
    // });
    // if (activeBorrows > 0) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Cannot delete book with active borrows',
    //   });
    // }

    await Book.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Book deleted successfully',
    });
  } catch (error) {
    console.error('Delete book error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid book ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while deleting book',
      error: error.message,
    });
  }
};

// @desc    Search books by title, author, or ISBN
// @route   GET /api/books/search
// @access  Public
const searchBooks = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    // Build search query (case-insensitive)
    const searchRegex = new RegExp(q.trim(), 'i');
    const query = {
      $or: [
        { title: searchRegex },
        { author: searchRegex },
        { isbn: q.trim().replace(/-/g, '') }, // Exact match for ISBN
      ],
    };

    // Calculate pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Execute search
    const books = await Book.find(query)
      .populate('addedBy', 'name email')
      .sort({ title: 1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count
    const total = await Book.countDocuments(query);

    // Add availability status
    const booksWithStatus = books.map((book) => {
      let status = 'available';
      if (book.availableCopies === 0) {
        status = 'out_of_stock';
      } else if (book.availableCopies <= 2) {
        status = 'low_stock';
      }
      return {
        ...book,
        availabilityStatus: status,
      };
    });

    res.status(200).json({
      success: true,
      data: booksWithStatus,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Search books error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching books',
      error: error.message,
    });
  }
};

// @desc    Update book stock quantity
// @route   PATCH /api/books/:id/stock
// @access  Private/Admin
const updateBookStock = async (req, res) => {
  try {
    const { totalCopies, availableCopies } = req.body;

    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    // Validate input
    if (totalCopies !== undefined && totalCopies < 0) {
      return res.status(400).json({
        success: false,
        message: 'Total copies cannot be negative',
      });
    }

    if (availableCopies !== undefined && availableCopies < 0) {
      return res.status(400).json({
        success: false,
        message: 'Available copies cannot be negative',
      });
    }

    // Update totalCopies if provided
    if (totalCopies !== undefined) {
      book.totalCopies = totalCopies;
    }

    // Update availableCopies if provided
    if (availableCopies !== undefined) {
      // Ensure availableCopies doesn't exceed totalCopies
      const finalTotalCopies = totalCopies !== undefined ? totalCopies : book.totalCopies;
      if (availableCopies > finalTotalCopies) {
        return res.status(400).json({
          success: false,
          message: 'Available copies cannot exceed total copies',
        });
      }
      book.availableCopies = availableCopies;
    } else if (totalCopies !== undefined) {
      // If only totalCopies is updated, adjust availableCopies if needed
      if (book.availableCopies > book.totalCopies) {
        book.availableCopies = book.totalCopies;
      }
    }

    await book.save();

    res.status(200).json({
      success: true,
      message: 'Book stock updated successfully',
      data: book,
    });
  } catch (error) {
    console.error('Update book stock error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid book ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating book stock',
      error: error.message,
    });
  }
};

module.exports = {
  addBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
  searchBooks,
  updateBookStock,
  getRelatedBooks,
};

