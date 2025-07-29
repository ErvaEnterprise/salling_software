const express = require('express');
const router = express.Router();
const Purchase = require('../models/Purchase');
const Admin = require('../models/Admin');

// POST /purchase
router.post('/purchase', async (req, res) => {
  try {
    const { product, quantity, total, supplier } = req.body;
    const adminId = req.session.adminId; // from session

    // Create purchase
    const purchase = new Purchase({
      product,
      quantity,
      total,
      supplier,
      investedBy: adminId
    });

    await purchase.save();

    // Deduct money from admin wallet
    await Admin.findByIdAndUpdate(adminId, { $inc: { wallet: -total } });

    res.redirect('/dashboard');
  } catch (err) {
    console.error('Purchase Error:', err);
    res.status(500).send('Failed to save purchase');
  }
});
