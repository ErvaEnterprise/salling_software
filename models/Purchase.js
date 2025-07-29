const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  product: String,
  quantity: Number,
  total: Number,
  supplier: String,
  date: { type: Date, default: Date.now },
  investedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' } // Link to Admin
});

module.exports = mongoose.model('Purchase', purchaseSchema);
