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
  {
    title: 'The Silent Library',
    author: 'Elena Morris',
    isbn: '9780316769489',
    category: 'Fiction',
    description: 'A gripping mystery set in an old university library where secrets refuse to stay buried.',
    publishedYear: 2019,
    totalCopies: 5,
    availableCopies: 5,
    language: 'English',
    pages: 324,
    publisher: 'Aurora Press',
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794',
  },
  {
    title: 'Beyond the Stars',
    author: 'Lucas Grant',
    isbn: '9780143127741',
    category: 'Science',
    description: 'An interstellar journey through love, loss, and the limits of human exploration.',
    publishedYear: 2020,
    totalCopies: 4,
    availableCopies: 3,
    language: 'English',
    pages: 410,
    publisher: 'Orbit Books',
    coverImage: 'https://images.unsplash.com/photo-1473187983305-f615310e7daa',
  },
  {
    title: 'The Painter\'s Muse',
    author: 'Clara Jensen',
    isbn: '9780062457738',
    category: 'Fiction',
    description: 'A romantic tale between an artist and a writer set in Paris during the 1920s.',
    publishedYear: 2018,
    totalCopies: 6,
    availableCopies: 5,
    language: 'English',
    pages: 287,
    publisher: 'HarperCollins',
    coverImage: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d',
  },
  {
    title: 'Digital Fortress',
    author: 'Dan Brown',
    isbn: '9780312944924',
    category: 'Fiction',
    description: 'A code-breaking thriller that exposes the fine line between privacy and national security.',
    publishedYear: 2017,
    totalCopies: 10,
    availableCopies: 8,
    language: 'English',
    pages: 356,
    publisher: 'St. Martin\'s Press',
    coverImage: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f',
  },
  {
    title: 'The Whispering Woods',
    author: 'Nora Bell',
    isbn: '9780451524936',
    category: 'Fiction',
    description: 'A young girl discovers a hidden world of magical creatures in the forest behind her home.',
    publishedYear: 2021,
    totalCopies: 7,
    availableCopies: 6,
    language: 'English',
    pages: 398,
    publisher: 'Dreamscape Publishing',
    coverImage: 'https://images.unsplash.com/photo-1529651737248-dad5e23c7a52',
  },
  {
    title: 'Code of Shadows',
    author: 'Alex Carter',
    isbn: '9780307277671',
    category: 'Technology',
    description: 'A cyber-thriller exploring the dark web and the people who control it.',
    publishedYear: 2022,
    totalCopies: 5,
    availableCopies: 4,
    language: 'English',
    pages: 340,
    publisher: 'Penguin Tech Press',
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
  },
  {
    title: 'Ocean\'s Heart',
    author: 'Maya Thompson',
    isbn: '9780679732761',
    category: 'Fiction',
    description: 'An epic sea adventure about courage, love, and finding home across the waves.',
    publishedYear: 2016,
    totalCopies: 8,
    availableCopies: 8,
    language: 'English',
    pages: 412,
    publisher: 'Blue Horizon Press',
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
  },
  {
    title: 'The Art of Stillness',
    author: 'Pico Iyer',
    isbn: '9781476784722',
    category: 'Philosophy',
    description: 'A reflective exploration of finding peace and meaning in a busy modern world.',
    publishedYear: 2015,
    totalCopies: 6,
    availableCopies: 6,
    language: 'English',
    pages: 195,
    publisher: 'TED Books',
    coverImage: 'https://images.unsplash.com/photo-1483794344563-d27a8d18014e',
  },
  {
    title: 'Hidden Realms',
    author: 'Ethan Lee',
    isbn: '9780553386790',
    category: 'Fiction',
    description: 'An epic fantasy journey through multiple worlds connected by mysterious portals.',
    publishedYear: 2023,
    totalCopies: 9,
    availableCopies: 9,
    language: 'English',
    pages: 509,
    publisher: 'Galaxy Ink',
    coverImage: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66',
  },
  {
    title: 'The Quantum Thief',
    author: 'Hannu Rajaniemi',
    isbn: '9780575088894',
    category: 'Science',
    description: 'A thrilling post-human adventure where memories are currency and trust is scarce.',
    publishedYear: 2020,
    totalCopies: 5,
    availableCopies: 5,
    language: 'English',
    pages: 331,
    publisher: 'Gollancz',
    coverImage: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66',
  },
  {
    title: 'Mind Over Machine',
    author: 'Patrick Winston',
    isbn: '9780262521123',
    category: 'Technology',
    description: 'A deep dive into artificial intelligence, human cognition, and the future of automation.',
    publishedYear: 2018,
    totalCopies: 3,
    availableCopies: 3,
    language: 'English',
    pages: 268,
    publisher: 'MIT Press',
    coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475',
  },
  {
    title: 'Echoes of Eternity',
    author: 'Sarah Langdon',
    isbn: '9780743273566',
    category: 'History',
    description: 'A moving tale that intertwines generations across two world wars and one unbroken promise.',
    publishedYear: 2014,
    totalCopies: 7,
    availableCopies: 6,
    language: 'English',
    pages: 450,
    publisher: 'Crown Publishing',
    coverImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba',
  },
  {
    title: 'Winds of Change',
    author: 'Harper Doyle',
    isbn: '9780385490818',
    category: 'Fiction',
    description: 'A powerful family saga about ambition, betrayal, and redemption across generations.',
    publishedYear: 2021,
    totalCopies: 6,
    availableCopies: 5,
    language: 'English',
    pages: 376,
    publisher: 'Vintage Books',
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794',
  },
  {
    title: 'The Hidden Algorithm',
    author: 'Nina Patel',
    isbn: '9780670020553',
    category: 'Fiction',
    description: 'A suspenseful race against time to uncover the truth behind a deadly AI experiment.',
    publishedYear: 2023,
    totalCopies: 5,
    availableCopies: 4,
    language: 'English',
    pages: 298,
    publisher: 'BlackBox Books',
    coverImage: 'https://images.unsplash.com/photo-1556157382-97eda2f9e3b7',
  },
  {
    title: 'A Journey Within',
    author: 'Meera Shah',
    isbn: '9780143126560',
    category: 'Health',
    description: 'A personal guide to mindfulness and emotional healing through reflection and balance.',
    publishedYear: 2019,
    totalCopies: 8,
    availableCopies: 7,
    language: 'English',
    pages: 222,
    publisher: 'Harmony Books',
    coverImage: 'https://images.unsplash.com/photo-1504198458649-3128b932f49b',
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

