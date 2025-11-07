const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [1, 'Title must be at least 1 character'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
    },
    isbn: {
      type: String,
      required: [true, 'ISBN is required'],
      unique: true,
      trim: true,
      validate: {
        validator: function (v) {
          // ISBN-13 should be 13 digits (can include hyphens, but we'll strip them)
          const digits = v.replace(/-/g, '');
          return /^\d{13}$/.test(digits);
        },
        message: 'ISBN must be exactly 13 digits',
      },
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Fiction',
        'Non-Fiction',
        'Science',
        'Technology',
        'History',
        'Biography',
        'Philosophy',
        'Religion',
        'Art',
        'Literature',
        'Education',
        'Business',
        'Health',
        'Travel',
        'Cooking',
        'Sports',
        'Other',
      ],
    },
    description: {
      type: String,
      trim: true,
    },
    coverImage: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return true; // Optional field
          // Basic URL validation
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Cover image must be a valid URL',
      },
    },
    publishedYear: {
      type: Number,
      min: [1000, 'Published year must be a valid year'],
      max: [new Date().getFullYear() + 1, 'Published year cannot be in the future'],
    },
    totalCopies: {
      type: Number,
      required: [true, 'Total copies is required'],
      default: 1,
      min: [0, 'Total copies cannot be negative'],
    },
    availableCopies: {
      type: Number,
      required: [true, 'Available copies is required'],
      default: 1,
      min: [0, 'Available copies cannot be negative'],
      validate: {
        validator: function (v) {
          return v <= this.totalCopies;
        },
        message: 'Available copies cannot exceed total copies',
      },
    },
    language: {
      type: String,
      default: 'English',
      trim: true,
    },
    pages: {
      type: Number,
      min: [1, 'Pages must be at least 1'],
    },
    publisher: {
      type: String,
      trim: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for search optimization
bookSchema.index({ title: 'text', author: 'text', isbn: 'text' });
bookSchema.index({ category: 1 });
bookSchema.index({ isbn: 1 });

// Virtual for availability status
bookSchema.virtual('availabilityStatus').get(function () {
  if (this.availableCopies === 0) {
    return 'out_of_stock';
  } else if (this.availableCopies <= 2) {
    return 'low_stock';
  } else {
    return 'available';
  }
});

// Ensure virtuals are included in JSON
bookSchema.set('toJSON', { virtuals: true });

// Pre-save hook to normalize ISBN (remove hyphens)
bookSchema.pre('save', function (next) {
  if (this.isModified('isbn')) {
    this.isbn = this.isbn.replace(/-/g, '');
  }
  next();
});

module.exports = mongoose.model('Book', bookSchema);

