const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  product: String,
  quantity: Number,
  total: Number,
  supplier: String,
  amount:Number,
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Purchase', purchaseSchema);
