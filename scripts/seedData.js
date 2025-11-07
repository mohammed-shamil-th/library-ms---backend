require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Book = require('../models/Book');
const Borrow = require('../models/Borrow');
const connectDB = require('../config/db');

// Sample books data
const sampleBooks = [
  {
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    isbn: '9780743273565',
    category: 'Fiction',
    description: 'A classic American novel about the Jazz Age and the American Dream.',
    publishedYear: 1925,
    totalCopies: 5,
    availableCopies: 3,
    language: 'English',
    pages: 180,
    publisher: 'Scribner',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/I/81QuEGw8VPL.jpg',
  },
  {
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    isbn: '9780061120084',
    category: 'Fiction',
    description: 'A gripping tale of racial injustice and childhood innocence in the American South.',
    publishedYear: 1960,
    totalCopies: 4,
    availableCopies: 2,
    language: 'English',
    pages: 376,
    publisher: 'J.B. Lippincott & Co.',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/I/81aY1lxk+9L.jpg',
  },
  {
    title: '1984',
    author: 'George Orwell',
    isbn: '9780451524935',
    category: 'Fiction',
    description: 'A dystopian social science fiction novel about totalitarian surveillance.',
    publishedYear: 1949,
    totalCopies: 6,
    availableCopies: 4,
    language: 'English',
    pages: 328,
    publisher: 'Secker & Warburg',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/I/81StSOpmkjL.jpg',
  },
  {
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    isbn: '9780141439518',
    category: 'Fiction',
    description: 'A romantic novel of manners that follows the character development of Elizabeth Bennet.',
    publishedYear: 1813,
    totalCopies: 5,
    availableCopies: 3,
    language: 'English',
    pages: 432,
    publisher: 'T. Egerton',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/I/71Q1tPupKjL.jpg',
  },
  {
    title: 'The Catcher in the Rye',
    author: 'J.D. Salinger',
    isbn: '9780316769488',
    category: 'Fiction',
    description: 'A controversial novel about teenage rebellion and alienation.',
    publishedYear: 1951,
    totalCopies: 4,
    availableCopies: 1,
    language: 'English',
    pages: 277,
    publisher: 'Little, Brown and Company',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/I/81OthjkJBuL.jpg',
  },
  {
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    isbn: '9780062316097',
    category: 'Non-Fiction',
    description: 'An exploration of how Homo sapiens conquered the world.',
    publishedYear: 2014,
    totalCopies: 3,
    availableCopies: 2,
    language: 'English',
    pages: 443,
    publisher: 'Harper',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/I/713jIoM3ykL.jpg',
  },
  {
    title: 'The Art of War',
    author: 'Sun Tzu',
    isbn: '9780486425576',
    category: 'Philosophy',
    description: 'An ancient Chinese military treatise on strategy and tactics (originally written around 5th century BC).',
    // publishedYear omitted - ancient text, original date is before 1000 AD
    totalCopies: 5,
    availableCopies: 4,
    language: 'English',
    pages: 273,
    publisher: 'Dover Publications',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/I/71Q1tPupKjL.jpg',
  },
  {
    title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    author: 'Robert C. Martin',
    isbn: '9780132350884',
    category: 'Technology',
    description: 'A guide to writing clean, maintainable code.',
    publishedYear: 2008,
    totalCopies: 4,
    availableCopies: 2,
    language: 'English',
    pages: 464,
    publisher: 'Prentice Hall',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/I/515iEcDr1GL.jpg',
  },
  {
    title: 'The Design of Everyday Things',
    author: 'Don Norman',
    isbn: '9780465050659',
    category: 'Technology',
    description: 'A book about the design of user-friendly products.',
    publishedYear: 1988,
    totalCopies: 3,
    availableCopies: 1,
    language: 'English',
    pages: 368,
    publisher: 'Basic Books',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/I/81zpLhP1gvL.jpg',
  },
  {
    title: 'A Brief History of Time',
    author: 'Stephen Hawking',
    isbn: '9780553380163',
    category: 'Science',
    description: 'A popular science book about cosmology and theoretical physics.',
    publishedYear: 1988,
    totalCopies: 5,
    availableCopies: 3,
    language: 'English',
    pages: 256,
    publisher: 'Bantam Books',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/I/81+4rt0m8FL.jpg',
  },
  {
    title: 'The Selfish Gene',
    author: 'Richard Dawkins',
    isbn: '9780192860927',
    category: 'Science',
    description: 'A book on evolution that explains how genes drive evolution.',
    publishedYear: 1976,
    totalCopies: 4,
    availableCopies: 2,
    language: 'English',
    pages: 360,
    publisher: 'Oxford University Press',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/I/81QpkIctqPL.jpg',
  },
  {
    title: 'The Immortal Life of Henrietta Lacks',
    author: 'Rebecca Skloot',
    isbn: '9781400052189',
    category: 'Biography',
    description: 'The story of how one woman\'s cells changed medical science forever.',
    publishedYear: 2010,
    totalCopies: 3,
    availableCopies: 1,
    language: 'English',
    pages: 381,
    publisher: 'Crown Publishing Group',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/I/81QpkIctqPL.jpg',
  },
  {
    title: 'Steve Jobs',
    author: 'Walter Isaacson',
    isbn: '9781451648539',
    category: 'Biography',
    description: 'The exclusive biography of the Apple co-founder.',
    publishedYear: 2011,
    totalCopies: 5,
    availableCopies: 3,
    language: 'English',
    pages: 656,
    publisher: 'Simon & Schuster',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/I/81VStYnDGrL.jpg',
  },
  {
    title: 'The World Wars: A Complete History',
    author: 'Martin Gilbert',
    isbn: '9780805076233',
    category: 'History',
    description: 'A comprehensive history of both World Wars.',
    publishedYear: 2004,
    totalCopies: 4,
    availableCopies: 2,
    language: 'English',
    pages: 848,
    publisher: 'Henry Holt and Company',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/I/81VStYnDGrL.jpg',
  },
  {
    title: 'Guns, Germs, and Steel',
    author: 'Jared Diamond',
    isbn: '9780393317558',
    category: 'History',
    description: 'A book about how geography and environment shaped human history.',
    publishedYear: 1997,
    totalCopies: 3,
    availableCopies: 1,
    language: 'English',
    pages: 480,
    publisher: 'W.W. Norton & Company',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/I/81VStYnDGrL.jpg',
  },
  {
    title: 'The Lean Startup',
    author: 'Eric Ries',
    isbn: '9780307887894',
    category: 'Business',
    description: 'A methodology for developing businesses and products.',
    publishedYear: 2011,
    totalCopies: 5,
    availableCopies: 4,
    language: 'English',
    pages: 336,
    publisher: 'Crown Business',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/I/81VStYnDGrL.jpg',
  },
  {
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    isbn: '9780374533557',
    category: 'Business',
    description: 'A book about two systems of thinking and decision-making.',
    publishedYear: 2011,
    totalCopies: 4,
    availableCopies: 2,
    language: 'English',
    pages: 499,
    publisher: 'Farrar, Straus and Giroux',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/I/81VStYnDGrL.jpg',
  },
  {
    title: 'The Joy of Cooking',
    author: 'Irma S. Rombauer',
    isbn: '9780743246262',
    category: 'Cooking',
    description: 'A comprehensive cookbook with thousands of recipes.',
    publishedYear: 1931,
    totalCopies: 3,
    availableCopies: 1,
    language: 'English',
    pages: 1152,
    publisher: 'Scribner',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/I/81VStYnDGrL.jpg',
  },
  {
    title: 'The Complete Guide to Running',
    author: 'Earl Fee',
    isbn: '9781554074090',
    category: 'Sports',
    description: 'A comprehensive guide to running techniques and training.',
    publishedYear: 2005,
    totalCopies: 4,
    availableCopies: 3,
    language: 'English',
    pages: 320,
    publisher: 'Firefly Books',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/I/81VStYnDGrL.jpg',
  },
  {
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    isbn: '9780061122415',
    category: 'Fiction',
    description: 'A philosophical novel about a young Andalusian shepherd\'s journey.',
    publishedYear: 1988,
    totalCopies: 6,
    availableCopies: 4,
    language: 'English',
    pages: 163,
    publisher: 'HarperOne',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/I/71aFt4+OTOL.jpg',
  },
  {
    title: 'The Lord of the Rings',
    author: 'J.R.R. Tolkien',
    isbn: '9780544003415',
    category: 'Fiction',
    description: 'An epic high fantasy novel about the quest to destroy the One Ring.',
    publishedYear: 1954,
    totalCopies: 5,
    availableCopies: 2,
    language: 'English',
    pages: 1178,
    publisher: 'Allen & Unwin',
    coverImage: 'https://images-na.ssl-images-amazon.com/images/I/71jLBXtWJWL.jpg',
  },
];

// Sample users data
const sampleUsers = [
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'user123',
    role: 'user',
    phone: '+1234567890',
    address: '123 Main Street, New York, NY 10001',
    isActive: true,
    maxBooksAllowed: 3,
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    password: 'user123',
    role: 'user',
    phone: '+1234567891',
    address: '456 Oak Avenue, Los Angeles, CA 90001',
    isActive: true,
    maxBooksAllowed: 3,
  },
];

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Connect to database
    await connectDB();

    // Clear existing data (optional - comment out if you want to keep existing data)
    const clearData = process.argv.includes('--clear');
    if (clearData) {
      console.log('🗑️  Clearing existing data...');
      await Book.deleteMany({});
      await Borrow.deleteMany({});
      // Don't delete users to keep admin
      await User.deleteMany({ role: 'user' });
      console.log('✅ Existing data cleared\n');
    }

    // 1. Create Admin User (if not exists)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@library.com';
    let admin = await User.findOne({ email: adminEmail });

    if (!admin) {
      console.log('👤 Creating admin user...');
      admin = await User.create({
        name: process.env.ADMIN_NAME || 'Admin User',
        email: adminEmail,
        password: process.env.ADMIN_PASSWORD || 'admin123',
        role: 'admin',
        isActive: true,
        maxBooksAllowed: 10,
      });
      console.log(`✅ Admin created: ${admin.email}\n`);
    } else {
      console.log(`ℹ️  Admin already exists: ${admin.email}\n`);
    }

    // 2. Create Sample Users
    console.log('👥 Creating sample users...');
    const createdUsers = [admin]; // Include admin in users array
    for (const userData of sampleUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const user = await User.create(userData);
        createdUsers.push(user);
        console.log(`  ✅ Created user: ${user.email}`);
      } else {
        createdUsers.push(existingUser);
        console.log(`  ℹ️  User already exists: ${userData.email}`);
      }
    }
    console.log(`✅ ${createdUsers.length} users ready (including admin)\n`);

    // 3. Create Sample Books
    console.log('📚 Creating sample books...');
    const createdBooks = [];
    for (const bookData of sampleBooks) {
      const existingBook = await Book.findOne({ isbn: bookData.isbn });
      if (!existingBook) {
        const book = await Book.create({
          ...bookData,
          addedBy: admin._id,
        });
        createdBooks.push(book);
        console.log(`  ✅ Created book: ${book.title}`);
      } else {
        createdBooks.push(existingBook);
        console.log(`  ℹ️  Book already exists: ${bookData.title}`);
      }
    }
    console.log(`✅ ${createdBooks.length} books ready\n`);

    // 4. Create Sample Borrow Records
    console.log('📖 Creating sample borrow records...');
    const borrowRecords = [];
    const today = new Date();
    
    // Filter out admin users for borrowing
    const regularUsers = createdUsers.filter(u => u.role === 'user');
    
    // Create some active borrows
    for (let i = 0; i < Math.min(5, regularUsers.length); i++) {
      const user = regularUsers[i];
      const book = createdBooks[i % createdBooks.length];
      
      // Check if user can borrow more books
      const activeBorrows = await Borrow.countDocuments({
        user: user._id,
        status: { $in: ['borrowed', 'overdue'] },
      });

      if (activeBorrows < user.maxBooksAllowed && book.availableCopies > 0) {
        const borrowDate = new Date(today);
        borrowDate.setDate(borrowDate.getDate() - (i + 1) * 2); // Different borrow dates
        
        const dueDate = new Date(borrowDate);
        dueDate.setDate(dueDate.getDate() + 14);

        const borrow = await Borrow.create({
          book: book._id,
          user: user._id,
          borrowDate,
          dueDate,
          status: 'borrowed',
          fine: 0,
        });

        // Update book available copies
        book.availableCopies -= 1;
        await book.save();

        borrowRecords.push(borrow);
        console.log(`  ✅ Created borrow: ${user.name} borrowed "${book.title}"`);
      }
    }

    // Create some returned borrows
    for (let i = 0; i < Math.min(3, regularUsers.length); i++) {
      const user = regularUsers[i];
      const book = createdBooks[(i + 5) % createdBooks.length];
      
      if (book.availableCopies > 0) {
        const borrowDate = new Date(today);
        borrowDate.setDate(borrowDate.getDate() - 30 - i * 5);
        
        const dueDate = new Date(borrowDate);
        dueDate.setDate(dueDate.getDate() + 14);
        
        const returnDate = new Date(dueDate);
        returnDate.setDate(returnDate.getDate() - 2); // Returned 2 days before due

        const borrow = await Borrow.create({
          book: book._id,
          user: user._id,
          borrowDate,
          dueDate,
          returnDate,
          status: 'returned',
          fine: 0,
        });

        borrowRecords.push(borrow);
        console.log(`  ✅ Created returned borrow: ${user.name} returned "${book.title}"`);
      }
    }

    // Create some overdue borrows
    for (let i = 0; i < Math.min(2, regularUsers.length); i++) {
      const user = regularUsers[i];
      const book = createdBooks[(i + 8) % createdBooks.length];
      
      if (book.availableCopies > 0) {
        const borrowDate = new Date(today);
        borrowDate.setDate(borrowDate.getDate() - 20 - i * 3);
        
        const dueDate = new Date(borrowDate);
        dueDate.setDate(dueDate.getDate() + 14);
        
        // Due date is in the past (overdue)
        const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
        const fine = daysOverdue * 1; // $1 per day

        const borrow = await Borrow.create({
          book: book._id,
          user: user._id,
          borrowDate,
          dueDate,
          status: 'overdue',
          fine: fine,
        });

        // Update book available copies
        book.availableCopies -= 1;
        await book.save();

        borrowRecords.push(borrow);
        console.log(`  ✅ Created overdue borrow: ${user.name} - "${book.title}" (${daysOverdue} days overdue, $${fine} fine)`);
      }
    }

    console.log(`✅ ${borrowRecords.length} borrow records created\n`);

    // Summary
    console.log('📊 Seeding Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👤 Users: ${(await User.countDocuments())} total`);
    console.log(`   - Admin: ${(await User.countDocuments({ role: 'admin' }))}`);
    console.log(`   - Regular Users: ${(await User.countDocuments({ role: 'user' }))}`);
    console.log(`📚 Books: ${(await Book.countDocuments())} total`);
    console.log(`📖 Borrows: ${(await Borrow.countDocuments())} total`);
    console.log(`   - Active: ${(await Borrow.countDocuments({ status: 'borrowed' }))}`);
    console.log(`   - Returned: ${(await Borrow.countDocuments({ status: 'returned' }))}`);
    console.log(`   - Overdue: ${(await Borrow.countDocuments({ status: 'overdue' }))}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📝 Default Credentials:');
    console.log('   Admin:');
    console.log(`     Email: ${adminEmail}`);
    console.log(`     Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    console.log('   Regular Users:');
    sampleUsers.forEach((user) => {
      console.log(`     Email: ${user.email}, Password: ${user.password}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    console.error(error);
    process.exit(1);
  }
};

// Run seed function
seedData();

