const Book = require('../models/Book');
const Borrow = require('../models/Borrow');
const User = require('../models/User');
const { isOverdue } = require('../utils/fineCalculator');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    // Total books
    const totalBooks = await Book.countDocuments();

    // Total borrows (all time)
    const totalBorrows = await Borrow.countDocuments();

    // Active users (users with active borrows)
    const activeUsers = await User.distinct('_id', {
      _id: {
        $in: await Borrow.distinct('user', {
          status: { $in: ['borrowed', 'overdue'] },
        }),
      },
    });

    // Overdue books count
    const now = new Date();
    const overdueBorrows = await Borrow.countDocuments({
      status: { $in: ['borrowed', 'overdue'] },
      dueDate: { $lt: now },
    });

    // Active borrows
    const activeBorrows = await Borrow.countDocuments({
      status: { $in: ['borrowed', 'overdue'] },
    });

    // Total users
    const totalUsers = await User.countDocuments();

    // Books with low stock (availableCopies <= 2)
    const lowStockBooks = await Book.countDocuments({
      availableCopies: { $lte: 2 },
    });

    res.status(200).json({
      success: true,
      data: {
        totalBooks,
        totalBorrows,
        activeUsers: activeUsers.length,
        overdueBooks: overdueBorrows,
        activeBorrows,
        totalUsers,
        lowStockBooks,
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get popular books
// @route   GET /api/dashboard/popular-books
// @access  Private/Admin
const getPopularBooks = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Aggregate to get most borrowed books
    const popularBooks = await Borrow.aggregate([
      {
        $group: {
          _id: '$book',
          borrowCount: { $sum: 1 },
        },
      },
      {
        $sort: { borrowCount: -1 },
      },
      {
        $limit: limit,
      },
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: '_id',
          as: 'bookDetails',
        },
      },
      {
        $unwind: '$bookDetails',
      },
      {
        $project: {
          _id: '$bookDetails._id',
          title: '$bookDetails.title',
          author: '$bookDetails.author',
          coverImage: '$bookDetails.coverImage',
          isbn: '$bookDetails.isbn',
          category: '$bookDetails.category',
          availableCopies: '$bookDetails.availableCopies',
          totalCopies: '$bookDetails.totalCopies',
          borrowCount: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      count: popularBooks.length,
      data: popularBooks,
    });
  } catch (error) {
    console.error('Get popular books error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get active users (users with active borrows)
// @route   GET /api/dashboard/active-users
// @access  Private/Admin
const getActiveUsers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get users with active borrows
    const activeUserIds = await Borrow.distinct('user', {
      status: { $in: ['borrowed', 'overdue'] },
    });

    const activeUsers = await User.find({
      _id: { $in: activeUserIds },
    })
      .select('name email membershipDate maxBooksAllowed')
      .limit(limit);

    // Get borrow count for each user
    const usersWithBorrowCount = await Promise.all(
      activeUsers.map(async (user) => {
        const activeBorrowCount = await Borrow.countDocuments({
          user: user._id,
          status: { $in: ['borrowed', 'overdue'] },
        });
        return {
          ...user.toObject(),
          activeBorrows: activeBorrowCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: usersWithBorrowCount.length,
      data: usersWithBorrowCount,
    });
  } catch (error) {
    console.error('Get active users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get borrowing trends (for charts)
// @route   GET /api/dashboard/trends
// @access  Private/Admin
const getBorrowingTrends = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get borrows grouped by date
    const trends = await Borrow.aggregate([
      {
        $match: {
          borrowDate: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$borrowDate' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          date: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: trends,
    });
  } catch (error) {
    console.error('Get borrowing trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
  getPopularBooks,
  getActiveUsers,
  getBorrowingTrends,
};

