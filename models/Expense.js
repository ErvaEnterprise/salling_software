const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  category: String,
  amount: Number,
  note: String,
  date: {
    type: Date,
    default: Date.now,
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  }
});

module.exports = mongoose.model('Expense', ExpenseSchema);
