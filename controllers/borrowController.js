const Borrow = require('../models/Borrow');
const Book = require('../models/Book');
const User = require('../models/User');
const { calculateFine, isOverdue } = require('../utils/fineCalculator');

// @desc    Borrow a book
// @route   POST /api/borrows
// @access  Private
const borrowBook = async (req, res) => {
  try {
    const { bookId } = req.body;
    const userId = req.user.id;

    if (!bookId) {
      return res.status(400).json({
        success: false,
        message: 'Book ID is required',
      });
    }

    // Find the book
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    // Check if book is available
    if (book.availableCopies <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Book is not available',
      });
    }

    // Get user with maxBooksAllowed
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user has active borrows exceeding limit
    const activeBorrows = await Borrow.countDocuments({
      user: userId,
      status: { $in: ['borrowed', 'overdue'] },
    });

    if (activeBorrows >= user.maxBooksAllowed) {
      return res.status(400).json({
        success: false,
        message: `You have reached your borrowing limit of ${user.maxBooksAllowed} books`,
      });
    }

    // Check if user already borrowed this book and hasn't returned it
    const existingBorrow = await Borrow.findOne({
      user: userId,
      book: bookId,
      status: { $in: ['borrowed', 'overdue'] },
    });

    if (existingBorrow) {
      return res.status(400).json({
        success: false,
        message: 'You have already borrowed this book',
      });
    }

    // Check if user has overdue books
    const overdueBorrows = await Borrow.countDocuments({
      user: userId,
      status: 'overdue',
    });

    if (overdueBorrows > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have overdue books. Please return them before borrowing new books',
      });
    }

    // Create borrow record
    const borrowDate = new Date();
    const dueDate = new Date(borrowDate);
    dueDate.setDate(dueDate.getDate() + 14); // 14 days from borrow date

    const borrow = await Borrow.create({
      book: bookId,
      user: userId,
      borrowDate,
      dueDate,
      status: 'borrowed',
    });

    // Decrement available copies
    book.availableCopies -= 1;
    await book.save();

    // Populate book and user details
    await borrow.populate('book', 'title author coverImage isbn');
    await borrow.populate('user', 'name email');

    // Simulate email notification (console.log)
    console.log(`📧 Email notification: Book "${book.title}" borrowed by ${user.name}. Due date: ${dueDate.toLocaleDateString()}`);

    res.status(201).json({
      success: true,
      message: 'Book borrowed successfully',
      data: borrow,
    });
  } catch (error) {
    console.error('Borrow book error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Return a book
// @route   PATCH /api/borrows/:id/return
// @access  Private
const returnBook = async (req, res) => {
  try {
    const borrowId = req.params.id;
    const userId = req.user.id;

    const borrow = await Borrow.findById(borrowId).populate('book');

    if (!borrow) {
      return res.status(404).json({
        success: false,
        message: 'Borrow record not found',
      });
    }

    // Check if user owns this borrow or is admin
    if (borrow.user.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to return this book',
      });
    }

    if (borrow.status === 'returned') {
      return res.status(400).json({
        success: false,
        message: 'Book has already been returned',
      });
    }

    // Set return date
    const returnDate = new Date();
    borrow.returnDate = returnDate;

    // Calculate fine if overdue
    const fine = borrow.calculateFine();
    borrow.status = 'returned';

    await borrow.save();

    // Increment available copies
    const book = await Book.findById(borrow.book._id);
    if (book) {
      book.availableCopies += 1;
      await book.save();
    }

    // Populate user details
    await borrow.populate('user', 'name email');
    await borrow.populate('book', 'title author coverImage isbn');

    res.status(200).json({
      success: true,
      message: 'Book returned successfully',
      data: borrow,
      fine: fine > 0 ? `Fine of $${fine.toFixed(2)} applied` : null,
    });
  } catch (error) {
    console.error('Return book error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get active borrows for current user
// @route   GET /api/borrows/active
// @access  Private
const getActiveBorrows = async (req, res) => {
  try {
    const userId = req.user.id;

    const borrows = await Borrow.find({
      user: userId,
      status: { $in: ['borrowed', 'overdue'] },
    })
      .populate('book', 'title author coverImage isbn category')
      .sort({ dueDate: 1 });

    // Check and update overdue status
    for (const borrow of borrows) {
      if (borrow.status === 'borrowed') {
        if (isOverdue(borrow.dueDate)) {
          borrow.status = 'overdue';
          borrow.fine = calculateFine(borrow.dueDate);
          await borrow.save();
        }
      }
    }

    // Refresh borrows after update
    const updatedBorrows = await Borrow.find({
      user: userId,
      status: { $in: ['borrowed', 'overdue'] },
    })
      .populate('book', 'title author coverImage isbn category')
      .sort({ dueDate: 1 });

    res.status(200).json({
      success: true,
      count: updatedBorrows.length,
      data: updatedBorrows,
    });
  } catch (error) {
    console.error('Get active borrows error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get all borrows (admin sees all, user sees own)
// @route   GET /api/borrows
// @access  Private
const getAllBorrows = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Query filters
    const { status, userId: filterUserId } = req.query;
    const query = {};

    // If admin, can see all or filter by user
    if (userRole === 'admin') {
      if (filterUserId) {
        query.user = filterUserId;
      }
    } else {
      // Regular users only see their own borrows
      query.user = userId;
    }

    if (status) {
      query.status = status;
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const borrows = await Borrow.find(query)
      .populate('book', 'title author coverImage isbn category')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Borrow.countDocuments(query);

    res.status(200).json({
      success: true,
      count: borrows.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      data: borrows,
    });
  } catch (error) {
    console.error('Get all borrows error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get borrow history for a user
// @route   GET /api/borrows/history/:userId
// @access  Private (user sees own, admin sees any)
const getBorrowHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    const userRole = req.user.role;

    // Check authorization
    if (userRole !== 'admin' && userId !== currentUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this history',
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const borrows = await Borrow.find({ user: userId })
      .populate('book', 'title author coverImage isbn category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Borrow.countDocuments({ user: userId });

    res.status(200).json({
      success: true,
      count: borrows.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      data: borrows,
    });
  } catch (error) {
    console.error('Get borrow history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get overdue books
// @route   GET /api/borrows/overdue
// @access  Private/Admin
const getOverdueBorrows = async (req, res) => {
  try {
    // Find all borrowed books that are past due date
    const now = new Date();
    const overdueBorrows = await Borrow.find({
      status: { $in: ['borrowed', 'overdue'] },
      dueDate: { $lt: now },
    })
      .populate('book', 'title author coverImage isbn')
      .populate('user', 'name email phone')
      .sort({ dueDate: 1 });

    // Update status and calculate fines
    for (const borrow of overdueBorrows) {
      if (borrow.status === 'borrowed') {
        borrow.status = 'overdue';
        borrow.fine = calculateFine(borrow.dueDate);
        await borrow.save();
      }
    }

    // Refresh after update
    const updatedBorrows = await Borrow.find({
      status: 'overdue',
      dueDate: { $lt: now },
    })
      .populate('book', 'title author coverImage isbn')
      .populate('user', 'name email phone')
      .sort({ dueDate: 1 });

    res.status(200).json({
      success: true,
      count: updatedBorrows.length,
      data: updatedBorrows,
    });
  } catch (error) {
    console.error('Get overdue borrows error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Create borrow record (Admin only - manual assignment)
// @route   POST /api/borrows/admin
// @access  Private/Admin
const createBorrowAdmin = async (req, res) => {
  try {
    const { bookId, userId } = req.body;

    if (!bookId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Book ID and User ID are required',
      });
    }

    // Find the book
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    // Check if book is available
    if (book.availableCopies <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Book is not available',
      });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user has active borrows exceeding limit
    const activeBorrows = await Borrow.countDocuments({
      user: userId,
      status: { $in: ['borrowed', 'overdue'] },
    });

    if (activeBorrows >= user.maxBooksAllowed) {
      return res.status(400).json({
        success: false,
        message: `User has reached their borrowing limit of ${user.maxBooksAllowed} books`,
      });
    }

    // Check if user already borrowed this book and hasn't returned it
    const existingBorrow = await Borrow.findOne({
      user: userId,
      book: bookId,
      status: { $in: ['borrowed', 'overdue'] },
    });

    if (existingBorrow) {
      return res.status(400).json({
        success: false,
        message: 'User has already borrowed this book',
      });
    }

    // Create borrow record
    const borrowDate = new Date();
    const dueDate = new Date(borrowDate);
    dueDate.setDate(dueDate.getDate() + 14); // 14 days from borrow date

    const borrow = await Borrow.create({
      book: bookId,
      user: userId,
      borrowDate,
      dueDate,
      status: 'borrowed',
    });

    // Decrement available copies
    book.availableCopies -= 1;
    await book.save();

    // Populate book and user details
    await borrow.populate('book', 'title author coverImage isbn');
    await borrow.populate('user', 'name email');

    res.status(201).json({
      success: true,
      message: 'Book assigned successfully',
      data: borrow,
    });
  } catch (error) {
    console.error('Create borrow admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Delete borrow record (Admin only)
// @route   DELETE /api/borrows/:id
// @access  Private/Admin
const deleteBorrow = async (req, res) => {
  try {
    const borrowId = req.params.id;

    const borrow = await Borrow.findById(borrowId).populate('book');

    if (!borrow) {
      return res.status(404).json({
        success: false,
        message: 'Borrow record not found',
      });
    }

    // If book is not returned, increment available copies
    if (borrow.status !== 'returned' && borrow.book) {
      const book = await Book.findById(borrow.book._id);
      if (book) {
        book.availableCopies += 1;
        await book.save();
      }
    }

    await Borrow.findByIdAndDelete(borrowId);

    res.status(200).json({
      success: true,
      message: 'Borrow record deleted successfully',
    });
  } catch (error) {
    console.error('Delete borrow error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Export borrow history to CSV
// @route   GET /api/borrows/history/:userId/export
// @access  Private
const exportBorrowHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    const userRole = req.user.role;

    // Check authorization
    if (userRole !== 'admin' && userId !== currentUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to export this user\'s history',
      });
    }

    const borrows = await Borrow.find({ user: userId })
      .populate('book', 'title author isbn')
      .populate('user', 'name email')
      .sort({ borrowDate: -1 });

    // Convert to CSV
    const csvHeader = 'Borrow Date,Due Date,Return Date,Book Title,Author,ISBN,Status,Fine\n';
    const csvRows = borrows.map(borrow => {
      const borrowDate = borrow.borrowDate ? new Date(borrow.borrowDate).toLocaleDateString() : '';
      const dueDate = borrow.dueDate ? new Date(borrow.dueDate).toLocaleDateString() : '';
      const returnDate = borrow.returnDate ? new Date(borrow.returnDate).toLocaleDateString() : '';
      const title = borrow.book?.title || '';
      const author = borrow.book?.author || '';
      const isbn = borrow.book?.isbn || '';
      const status = borrow.status || '';
      const fine = borrow.fine || 0;
      
      // Escape quotes in CSV
      const escapeCSV = (str) => {
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };
      
      return `${escapeCSV(borrowDate)},${escapeCSV(dueDate)},${escapeCSV(returnDate)},${escapeCSV(title)},${escapeCSV(author)},${escapeCSV(isbn)},${escapeCSV(status)},${fine}`;
    }).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=borrow-history-${userId}-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export borrow history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  borrowBook,
  returnBook,
  getActiveBorrows,
  getAllBorrows,
  getBorrowHistory,
  getOverdueBorrows,
  createBorrowAdmin,
  deleteBorrow,
  exportBorrowHistory,
};

