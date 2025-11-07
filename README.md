# Library Management System - Backend

A comprehensive Node.js + Express + MongoDB backend API for a Library Management System where users can browse books, borrow them, return them, and manage their reading history. Admins can manage the book inventory and track borrowing statistics.

## 🚀 Features Implemented

### Core Features
- ✅ **User Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (user vs admin)
  - Password hashing with bcrypt
  - Protected routes with middleware

- ✅ **Books Management**
  - CRUD operations for books
  - Search by title, author, or ISBN
  - Filter by category, language, availability
  - Sort by title, author, year, popularity
  - Pagination support
  - Stock management
  - Related books recommendation

- ✅ **Borrowing System**
  - Borrow books with automatic due date calculation (14 days)
  - Return books with fine calculation ($1/day overdue)
  - Track active borrows and history
  - Overdue book tracking
  - Export borrow history to CSV

- ✅ **User Management**
  - User profile management
  - User statistics (borrowing history, favorite category)
  - Admin user management
  - Configurable max books allowed per user

- ✅ **Dashboard & Analytics**
  - Overall statistics (total books, borrows, users, overdue)
  - Popular books tracking
  - Active users list
  - Borrowing trends

- ✅ **Favorites System**
  - Add/remove books from favorites
  - Mark books as read/unread
  - Track reading history

## 🛠️ Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js 5.1.0
- **Database**: MongoDB with Mongoose 8.19.3
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Password Hashing**: bcryptjs 2.4.3
- **Testing**: Jest 29.7.0, Supertest 7.0.0
- **Environment**: dotenv 17.2.3

## 📋 Prerequisites

- **Node.js**: v14.0.0 or higher
- **MongoDB**: v4.4 or higher (or MongoDB Atlas account)
- **npm**: v6.0.0 or higher

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd library-ms---backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/library-management
   MONGODB_URI_TEST=mongodb://localhost:27017/library-test
   JWT_SECRET=your-secret-key-change-in-production
   PORT=5000
   NODE_ENV=development
   ```

4. **Start MongoDB**
   
   Make sure MongoDB is running on your system:
   ```bash
   # On Windows (if installed as service, it should start automatically)
   # On Linux/Mac
   sudo systemctl start mongod
   # Or
   mongod
   ```

5. **Seed the database** (Optional but recommended)
   ```bash
   # Create admin user
   npm run seed:admin
   
   # Seed sample data (books, users, borrows)
   npm run seed:data
   ```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```
The server will start on `http://localhost:5000` (or the port specified in `.env`)

### Production Mode
```bash
npm start
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (returns JWT token)

### Books Management
- `GET /api/books` - Get all books (with pagination, filters, sorting)
- `GET /api/books/:id` - Get single book with availability
- `GET /api/books/search` - Search books by title, author, or ISBN
- `GET /api/books/:id/related` - Get related books (same category)
- `POST /api/books` - Add new book (Admin only)
- `PUT /api/books/:id` - Update book details (Admin only)
- `DELETE /api/books/:id` - Delete book (Admin only)
- `PATCH /api/books/:id/stock` - Update book stock (Admin only)

### Borrowing System
- `POST /api/borrows` - Borrow a book
- `GET /api/borrows` - Get all borrow records (Admin sees all, User sees own)
- `GET /api/borrows/active` - Get currently borrowed books by user
- `GET /api/borrows/history/:userId` - Get borrowing history for a user
- `GET /api/borrows/history/:userId/export` - Export borrow history to CSV
- `PATCH /api/borrows/:id/return` - Return a borrowed book
- `GET /api/borrows/overdue` - Get overdue books (Admin only)
- `POST /api/borrows/admin` - Create borrow record (Admin only)
- `DELETE /api/borrows/:id` - Delete borrow record (Admin only)

### Users
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/:id/stats` - Get user statistics
- `GET /api/users` - Get all users (Admin only)
- `PATCH /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Dashboard & Analytics (Admin)
- `GET /api/dashboard/stats` - Overall statistics
- `GET /api/dashboard/popular-books` - Most borrowed books
- `GET /api/dashboard/active-users` - Users with active borrows
- `GET /api/dashboard/trends` - Borrowing trends
- `GET /api/dashboard/active-members-count` - Active members count (Public)

### Favorites
- `POST /api/favorites` - Add book to favorites
- `GET /api/favorites` - Get user's favorite books
- `DELETE /api/favorites/:id` - Remove from favorites
- `PATCH /api/favorites/:id/read` - Toggle read status
- `GET /api/favorites/check/:bookId` - Check if book is favorited

## 🔐 Default Admin Credentials

After running `npm run seed:admin`, you can login with:
- **Email**: `admin@library.com`
- **Password**: `admin123`

**⚠️ Important**: Change these credentials in production!

## 📊 Sample Data

The seed script (`scripts/seedData.js`) includes:
- **37+ sample books** across various categories
- **3 sample users** (1 admin, 2 regular users)
- **10+ sample borrow records** (active, returned, overdue)

To seed the database:
```bash
npm run seed:data
```

To clear and reseed:
```bash
npm run seed:clear
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Database
Tests use a separate test database (`library-test`) to avoid affecting production data. Make sure to set `MONGODB_URI_TEST` in your `.env` file.

See `README_TESTING.md` for detailed testing documentation.

## 📁 Project Structure

```
library-ms---backend/
├── __tests__/           # Test files
├── config/             # Configuration files (database)
├── controllers/        # Route controllers
├── middleware/         # Custom middleware
├── models/              # Mongoose models
├── routes/             # API routes
├── scripts/            # Seed scripts
├── utils/              # Utility functions
├── app.js              # Express app configuration
├── index.js            # Server entry point
└── package.json        # Dependencies
```

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Role-based access control
- Input validation
- Protected routes
- CORS configuration

## 📦 Dependencies

### Production
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `cors` - CORS middleware
- `dotenv` - Environment variables

### Development
- `nodemon` - Development server
- `jest` - Testing framework
- `supertest` - HTTP assertion library

## 🐛 Known Issues

- None currently reported

## 🚧 Future Improvements

- Email notification system for due dates
- Book reservation system
- Reading recommendations based on history
- Book rating and review system
- Automatic overdue status update (scheduled task)
- Advanced search with full-text indexing
- API rate limiting
- Request logging and monitoring

## 🤖 AI Tools Used

This project was developed with assistance from:
- **Cursor AI** - Code generation, refactoring, and debugging
- **GitHub Copilot** - Code suggestions and autocomplete

AI tools helped with:
- Initial project structure setup
- API endpoint implementation
- Database schema design
- Error handling patterns
- Code optimization and refactoring
- Test case generation

## 📄 License

ISC

## 👤 Author

Library Management System Development Team

## 📞 Support

For issues and questions, please open an issue on the GitHub repository.
