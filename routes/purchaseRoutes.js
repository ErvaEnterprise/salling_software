const express = require('express');
const router = express.Router();
const Purchase = require('../models/Purchase');

router.post('/purchase', async (req, res) => {
  try {
    const { product, quantity, total, supplier, adminId } = req.body;

    const purchase = new Purchase({
      product,
      quantity,
      total,
      supplier,
      admin: adminId
    });

    await purchase.save();

    res.redirect('/auth/dashboard');
  } catch (err) {
    console.error('Purchase save error:', err);
    res.status(500).send('Server error');
  }
});

router.get('/view-purchases', async (req, res) => {
  try {
    const purchases = await Purchase.find().populate('admin', 'name').sort({ date: -1 });
    res.render('view-purchases', {
      purchases
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
