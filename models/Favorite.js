const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book is required'],
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate favorites
favoriteSchema.index({ user: 1, book: 1 }, { unique: true });

// Index for efficient queries
favoriteSchema.index({ user: 1 });
favoriteSchema.index({ book: 1 });

module.exports = mongoose.model('Favorite', favoriteSchema);

