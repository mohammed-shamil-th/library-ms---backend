const User = require('../models/User');
const Borrow = require('../models/Borrow');

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update fields
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;

    await user.save();

    // Remove password from response
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/:id/stats
// @access  Private (user sees own, admin sees any)
const getUserStats = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;
    const userRole = req.user.role;

    // Check authorization
    if (userRole !== 'admin' && id !== currentUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this user\'s statistics',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get borrow statistics
    const totalBorrowed = await Borrow.countDocuments({ user: id });
    const activeBorrows = await Borrow.countDocuments({
      user: id,
      status: { $in: ['borrowed', 'overdue'] },
    });
    const overdueBorrows = await Borrow.countDocuments({
      user: id,
      status: 'overdue',
    });
    const returnedBorrows = await Borrow.countDocuments({
      user: id,
      status: 'returned',
    });

    // Calculate total fine
    const overdueRecords = await Borrow.find({
      user: id,
      status: 'overdue',
    });
    const totalFine = overdueRecords.reduce((sum, record) => sum + (record.fine || 0), 0);

    // Get most borrowed category
    const borrowHistory = await Borrow.find({ user: id })
      .populate('book', 'category')
      .select('book');
    
    const categoryCount = {};
    borrowHistory.forEach((borrow) => {
      if (borrow.book && borrow.book.category) {
        categoryCount[borrow.book.category] = (categoryCount[borrow.book.category] || 0) + 1;
      }
    });
    
    const favoriteCategory = Object.keys(categoryCount).reduce((a, b) =>
      categoryCount[a] > categoryCount[b] ? a : b,
      null
    );

    res.status(200).json({
      success: true,
      data: {
        user: {
          name: user.name,
          email: user.email,
          membershipDate: user.membershipDate,
          maxBooksAllowed: user.maxBooksAllowed,
        },
        stats: {
          totalBorrowed,
          activeBorrows,
          overdueBorrows,
          returnedBorrows,
          totalFine: totalFine.toFixed(2),
          favoriteCategory: favoriteCategory || 'N/A',
        },
      },
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const { search, role, isActive, page = 1, limit = 10 } = req.query;
    const query = {};

    // Filter by role (exclude admin from regular user list, but admin can see all)
    if (role) {
      query.role = role;
    }

    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
      data: users,
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Update user (Admin only)
// @route   PATCH /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address, isActive, maxBooksAllowed, role } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent changing admin role or deactivating last admin
    if (role && role !== user.role) {
      if (user.role === 'admin') {
        const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
        if (adminCount <= 1) {
          return res.status(400).json({
            success: false,
            message: 'Cannot change role of the last active admin',
          });
        }
      }
      user.role = role;
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (isActive !== undefined) {
      // Prevent deactivating last admin
      if (user.role === 'admin' && !isActive) {
        const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
        if (adminCount <= 1) {
          return res.status(400).json({
            success: false,
            message: 'Cannot deactivate the last active admin',
          });
        }
      }
      user.isActive = isActive;
    }
    if (maxBooksAllowed !== undefined) {
      user.maxBooksAllowed = Math.max(1, parseInt(maxBooksAllowed));
    }

    await user.save();
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent deleting admin users
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete admin users',
      });
    }

    // Check if user has active borrows
    const activeBorrows = await Borrow.countDocuments({
      user: id,
      status: { $in: ['borrowed', 'overdue'] },
    });

    if (activeBorrows > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete user with active borrows. Please return all books first.',
      });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getUserStats,
  getAllUsers,
  updateUser,
  deleteUser,
};

