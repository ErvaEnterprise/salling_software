const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  product: String,
  quantity: Number,
  customer: String,
  price: Number,
  total: Number,
  date: {
    type: Date,
    default: Date.now,
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
});

module.exports = mongoose.model('Sale', SaleSchema);
