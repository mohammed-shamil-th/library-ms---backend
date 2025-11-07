# Testing Guide - Backend

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up test database:
   - Create a separate MongoDB database for testing (e.g., `library-test`)
   - Set `MONGODB_URI_TEST` in your `.env` file:
   ```
   MONGODB_URI_TEST=mongodb://localhost:27017/library-test
   ```

3. Set JWT_SECRET in `.env`:
   ```
   JWT_SECRET=your-secret-key-for-testing
   ```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Structure

Tests are located in `__tests__/` directory:
- `__tests__/controllers/bookController.test.js` - Tests for book creation API

## Test Coverage

The tests cover:
- ✅ Successful book creation with valid data
- ✅ Default values assignment
- ✅ Required field validation
- ✅ ISBN uniqueness validation
- ✅ Available copies validation
- ✅ Authentication & authorization
- ✅ Edge cases (long titles, optional fields)

## Notes

- Tests use a separate test database to avoid affecting production data
- All test data is cleaned up after each test run
- Make sure MongoDB is running before executing tests

