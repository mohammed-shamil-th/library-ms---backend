/**
 * Calculate fine for an overdue book
 * @param {Date} dueDate - The due date of the book
 * @param {Date} returnDate - The return date (optional, defaults to now)
 * @param {Number} finePerDay - Fine amount per day (default: 1)
 * @returns {Number} - Total fine amount
 */
const calculateFine = (dueDate, returnDate = new Date(), finePerDay = 1) => {
  if (!dueDate) return 0;
  
  const returnDateValue = returnDate instanceof Date ? returnDate : new Date(returnDate);
  const due = dueDate instanceof Date ? dueDate : new Date(dueDate);
  
  if (returnDateValue <= due) return 0;
  
  const daysOverdue = Math.ceil((returnDateValue - due) / (1000 * 60 * 60 * 24));
  return daysOverdue * finePerDay;
};

/**
 * Check if a book is overdue
 * @param {Date} dueDate - The due date
 * @param {Date} currentDate - Current date (optional, defaults to now)
 * @returns {Boolean} - True if overdue
 */
const isOverdue = (dueDate, currentDate = new Date()) => {
  if (!dueDate) return false;
  const due = dueDate instanceof Date ? dueDate : new Date(dueDate);
  const current = currentDate instanceof Date ? currentDate : new Date(currentDate);
  return current > due;
};

/**
 * Get days until due date (negative if overdue)
 * @param {Date} dueDate - The due date
 * @param {Date} currentDate - Current date (optional, defaults to now)
 * @returns {Number} - Days until due (negative if overdue)
 */
const daysUntilDue = (dueDate, currentDate = new Date()) => {
  if (!dueDate) return 0;
  const due = dueDate instanceof Date ? dueDate : new Date(dueDate);
  const current = currentDate instanceof Date ? currentDate : new Date(currentDate);
  const diffTime = due - current;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

module.exports = {
  calculateFine,
  isOverdue,
  daysUntilDue,
};

