const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Book = require('../../models/Book');
const User = require('../../models/User');

const app = require('../../app');
let adminToken;
let adminUser;
let regularUser;
let regularToken;

// Test database connection
const TEST_MONGODB_URI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/library-test';

describe('POST /api/books - Create Book', () => {
  beforeAll(async () => {
    // Connect to test database
    try {
      await mongoose.connect(TEST_MONGODB_URI);
      console.log('Test database connected');
    } catch (error) {
      console.error('Test database connection error:', error);
    }

    // Create admin user for testing
    adminUser = await User.create({
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'testpassword123',
      role: 'admin',
      isActive: true,
    });

    // Create regular user for testing
    regularUser = await User.create({
      name: 'Test User',
      email: 'user@test.com',
      password: 'testpassword123',
      role: 'user',
      isActive: true,
    });

    // Generate tokens
    adminToken = jwt.sign(
      { id: adminUser._id, role: 'admin' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    regularToken = jwt.sign(
      { id: regularUser._id, role: 'user' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Clean up
    await Book.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear books before each test
    await Book.deleteMany({});
  });

  describe('Success Cases', () => {
    test('should create a book with valid data', async () => {
      const bookData = {
        title: 'Test Book',
        author: 'Test Author',
        isbn: '9781234567890',
        category: 'Fiction',
        description: 'Test description',
        totalCopies: 5,
        availableCopies: 5,
        language: 'English',
        pages: 200,
        publisher: 'Test Publisher',
        publishedYear: 2020,
      };

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bookData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Book added successfully');
      expect(response.body.data.title).toBe(bookData.title);
      expect(response.body.data.author).toBe(bookData.author);
      expect(response.body.data.isbn).toBe(bookData.isbn);
      expect(response.body.data.category).toBe(bookData.category);
    });

    test('should set default values correctly', async () => {
      const bookData = {
        title: 'Minimal Book',
        author: 'Author',
        isbn: '9781234567891',
        category: 'Fiction',
      };

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bookData)
        .expect(201);

      expect(response.body.data.totalCopies).toBe(1);
      expect(response.body.data.availableCopies).toBe(1);
      expect(response.body.data.language).toBe('English');
    });

    test('should handle ISBN with hyphens', async () => {
      const bookData = {
        title: 'Book with Hyphen ISBN',
        author: 'Author',
        isbn: '978-1234-5678-92',
        category: 'Fiction',
      };

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bookData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Validation Errors', () => {
    test('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Incomplete Book',
          // Missing author, isbn, category
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    test('should return 400 if ISBN already exists', async () => {
      // Create existing book
      await Book.create({
        title: 'Existing Book',
        author: 'Author',
        isbn: '9781234567893',
        category: 'Fiction',
        totalCopies: 1,
        availableCopies: 1,
        addedBy: adminUser._id,
      });

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'New Book',
          author: 'Author',
          isbn: '9781234567893',
          category: 'Fiction',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('ISBN already exists');
    });

    test('should return 400 if availableCopies > totalCopies', async () => {
      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Book',
          author: 'Author',
          isbn: '9781234567894',
          category: 'Fiction',
          totalCopies: 5,
          availableCopies: 10,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Available copies cannot exceed total copies');
    });

    test('should return 400 for invalid ISBN format', async () => {
      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Book',
          author: 'Author',
          isbn: '123', // Invalid ISBN
          category: 'Fiction',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Authentication & Authorization', () => {
    test('should return 401 if no token provided', async () => {
      const response = await request(app)
        .post('/api/books')
        .send({
          title: 'Test Book',
          author: 'Author',
          isbn: '9781234567895',
          category: 'Fiction',
        })
        .expect(401);
    });

    test('should return 401 if invalid token provided', async () => {
      const response = await request(app)
        .post('/api/books')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          title: 'Test Book',
          author: 'Author',
          isbn: '9781234567896',
          category: 'Fiction',
        })
        .expect(401);
    });

    test('should return 403 if user is not admin', async () => {
      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          title: 'Test Book',
          author: 'Author',
          isbn: '9781234567897',
          category: 'Fiction',
        })
        .expect(403);
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long title', async () => {
      const longTitle = 'A'.repeat(201); // Exceeds max length
      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: longTitle,
          author: 'Author',
          isbn: '9781234567898',
          category: 'Fiction',
        })
        .expect(400);
    });

    test('should handle optional fields', async () => {
      const bookData = {
        title: 'Book with Optional Fields',
        author: 'Author',
        isbn: '9781234567899',
        category: 'Fiction',
        description: 'Optional description',
        coverImage: 'https://example.com/image.jpg',
        publishedYear: 2021,
        pages: 300,
        publisher: 'Test Publisher',
      };

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bookData)
        .expect(201);

      expect(response.body.data.description).toBe(bookData.description);
      expect(response.body.data.coverImage).toBe(bookData.coverImage);
      expect(response.body.data.publishedYear).toBe(bookData.publishedYear);
    });
  });
});

