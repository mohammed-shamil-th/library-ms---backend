const mongoose = require('mongoose');

const borrowSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book is required'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    borrowDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    returnDate: {
      type: Date,
    },
    status: {
      type: String,
      required: true,
      enum: ['borrowed', 'returned', 'overdue'],
      default: 'borrowed',
    },
    fine: {
      type: Number,
      default: 0,
      min: [0, 'Fine cannot be negative'],
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
borrowSchema.index({ user: 1, status: 1 });
borrowSchema.index({ book: 1 });
borrowSchema.index({ dueDate: 1 });
borrowSchema.index({ status: 1 });

// Pre-save hook to calculate due date if not provided
borrowSchema.pre('save', function (next) {
  if (!this.dueDate && this.borrowDate) {
    // Default: 14 days from borrow date
    this.dueDate = new Date(this.borrowDate);
    this.dueDate.setDate(this.dueDate.getDate() + 14);
  }
  next();
});

// Method to check if overdue and update status
borrowSchema.methods.checkOverdue = function () {
  if (this.status === 'borrowed' && !this.returnDate) {
    const now = new Date();
    if (now > this.dueDate) {
      this.status = 'overdue';
      // Calculate fine: $1 per day overdue
      const daysOverdue = Math.ceil((now - this.dueDate) / (1000 * 60 * 60 * 24));
      this.fine = daysOverdue * 1; // $1 per day
      return true;
    }
  }
  return false;
};

// Method to calculate fine on return
borrowSchema.methods.calculateFine = function () {
  if (this.returnDate && this.dueDate && this.returnDate > this.dueDate) {
    const daysOverdue = Math.ceil((this.returnDate - this.dueDate) / (1000 * 60 * 60 * 24));
    this.fine = daysOverdue * 1; // $1 per day
    if (this.status === 'borrowed') {
      this.status = 'overdue';
    }
    return this.fine;
  }
  return 0;
};

module.exports = mongoose.model('Borrow', borrowSchema);

