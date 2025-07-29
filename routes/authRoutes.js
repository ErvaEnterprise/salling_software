const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Expense = require('../models/Expense');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

router.get('/add-admin', (req, res) => {
  res.render('add-admin');
});

router.post('/add-admin', async (req, res) => {
  const { name, email, password } = req.body;

  // Save logic here (e.g., hashing password, inserting into DB)
  await Admin.create({ name, email, password }); // Adjust to your DB schema

  res.redirect('/auth/dashboard'); // or wherever you want to go
});

// Check Login or not
function requireLogin(req, res, next) {
  if (!req.session.adminId) {
    return res.redirect('/login');
  }
  next();
}

// GET: Login Page
router.get('/', (req, res) => {
  res.render('login');
});

// POST: Login
router.post('/', async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ email });
  if (!admin) return res.status(400).send("Admin not found");

  if (admin.password != req.body.password) {
    return res.status(401).send("Invalid password");
  }

  req.session.adminId = admin._id;
  req.session.adminName = admin.name;

  req.session.user = {
    username: admin.name, // or use `user.username` or `user.email` based on your schema
    id: admin._id
  };
  res.redirect('/auth/dashboard'); // or send success
});

// Logout

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// Helper Function
function getSalesGroupedByAdmin(sales) {
  const data = {};
  sales.forEach(sale => {
    const name = sale.adminName || 'Unknown';
    data[name] = (data[name] || 0) + sale.amount;
  });
  return data;
}

function getPurchasesGroupedByAdmin(purchases) {
  const purchaseData = {};
  purchases.forEach(purchase => {
    const name = purchase.adminId?.name || 'Unknown';
    purchaseData[name] = (purchaseData[name] || 0) + (parseFloat(purchase.total) || 0);
  });
  return purchaseData;
}


// GET: Dashboard

router.get('/dashboard', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session || !req.session.user || !req.session.user.id) {
      return res.redirect('/auth'); // or show an error
    }

    const { startDate, endDate, admin } = req.query;

    const query = {};
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (admin) {
      query.adminId = admin;
    }

    const adminIdFromSession = req.session.user.id;

    const admin1 = await Admin.findById(adminIdFromSession);

    const sales = await Sale.find(query).populate('admin');
    const purchases = await Purchase.find(query).populate('admin');

    const adminNames = await Admin.find().select('name');
    const totalAdmins = adminNames.length;

    const salesData = await getSalesGroupedByAdmin(sales);
    const purchaseData = await getPurchasesGroupedByAdmin(purchases);

    const totalSales = sales.reduce((sum, s) => {
      const amount = parseFloat(s.total);
      return sum + (isNaN(amount) ? 0 : total);
    }, 0);

    const totalPurchases = purchases.reduce((sum, p) => {
      const amount = parseFloat(p.total);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    res.render('dashboard', {
      adminName: admin,
      adminsList: adminNames,
      adminNames: Object.keys(salesData),
      salesData: Object.values(salesData),
      purchaseData: Object.values(purchaseData),
      totalAdmins,
      totalSales,
      totalPurchases,
      admin1
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).send('Internal Server Error');
  }
});


// GET: Wallet Page
router.get('/wallet', async (req, res) => {
  const admin = await Admin.findOne(); // Temporary: only 1 admin for now
  res.render('wallet', { admin, adminName: admin.name });
});

// POST: Add Money
router.post('/wallet', async (req, res) => {
  const { amount } = req.body;
  const admin = await Admin.findOne(); // Replace later with session/jwt admin ID

  admin.wallet += parseFloat(amount);
  await admin.save();
  res.redirect('/auth/wallet');
});

// GET: Sales Form
router.get('/sale', async (req, res) => {
  const admin = await Admin.findOne();
  res.render('sale', { adminName: admin.name });
});

// POST: Save Sale
router.post('/sale', async (req, res) => {
  const { product, quantity, customer, price } = req.body;
  const total = parseFloat(quantity) * parseFloat(price);

  const admin = await Admin.findOne(); // Replace with session later

  const newSale = new Sale({
    product,
    quantity,
    customer,
    price,
    total,
    addedBy: admin._id,
  });

  await newSale.save();
  res.redirect('/sale');
});

// GET: Purchase Form
router.get('/purchase', async (req, res) => {
  try {
    const adminsList = await Admin.find(); // get all admins from DB
    res.render('purchase', { adminsList }); // pass to EJS
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// GET: Expense Form
router.get('/expense', (req, res) => {
  res.render('expense');
});

// POST: Save Expense
router.post('/expense', async (req, res) => {
  const { category, amount, note } = req.body;

  const admin = await Admin.findOne(); // Replace with session later

  const newExpense = new Expense({
    category,
    amount,
    note,
    addedBy: admin._id,
  });

  await newExpense.save();
  res.redirect('/expense');
});

//Expense
router.get('/history', async (req, res) => {
  const sales = await Sale.find().populate('addedBy');
  const purchases = await Purchase.find().populate('addedBy');
  const expenses = await Expense.find().populate('addedBy');

  res.render('history', { sales, purchases, expenses });
});

// All Summary Report
router.get('/summary', async (req, res) => {
  const admins = await Admin.find();
  const summary = [];

  for (const admin of admins) {
    const sales = await Sale.find({ addedBy: admin._id });
    const purchases = await Purchase.find({ addedBy: admin._id });
    const expenses = await Expense.find({ addedBy: admin._id });

    const totalSales = sales.reduce((acc, s) => acc + s.total, 0);
    const totalPurchases = purchases.reduce((acc, p) => acc + p.total, 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    const profit = totalSales - (totalPurchases + totalExpenses);

    summary.push({
      adminName: admin.name,
      invested: admin.wallet,
      totalSales,
      totalPurchases,
      totalExpenses,
      profit,
    });
  }

  res.render('summary', { summary });
});


// generate Rport - Excel

router.get('/export/excel', requireLogin, async (req, res) => {
  const purchases = await Purchase.find({ addedBy: req.session.adminId });
  const sales = await Sale.find({ addedBy: req.session.adminId });
  const expenses = await Expense.find({ addedBy: req.session.adminId });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Admin Report');

  sheet.columns = [
    { header: 'Type', key: 'type', width: 15 },
    { header: 'Product', key: 'product', width: 25 },
    { header: 'Amount', key: 'total', width: 15 },
    { header: 'Date', key: 'date', width: 20 },
  ];

  purchases.forEach(p => {
    sheet.addRow({ type: 'Purchase', product: p.product, total: p.total, date: p.date });
  });
  sales.forEach(s => {
    sheet.addRow({ type: 'Sale', product: s.product, total: s.total, date: s.date });
  });
  expenses.forEach(e => {
    sheet.addRow({ type: 'Expense', product: e.reason, total: e.amount, date: e.date });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=report.xlsx');
  await workbook.xlsx.write(res);
  res.end();
});


//Generate Report - PDF
router.get('/export/pdf', requireLogin, async (req, res) => {
  const purchases = await Purchase.find({ addedBy: req.session.adminId });
  const sales = await Sale.find({ addedBy: req.session.adminId });
  const expenses = await Expense.find({ addedBy: req.session.adminId });

  const doc = new PDFDocument();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=report.pdf');

  doc.pipe(res);
  doc.fontSize(20).text('Admin Report', { align: 'center' });

  const writeData = (title, data) => {
    doc.addPage().fontSize(16).text(title, { underline: true });
    data.forEach(d => {
      doc.fontSize(12).text(`• ${d.product || d.reason} - ₹${d.total || d.amount} on ${d.date.toDateString()}`);
    });
  };

  writeData('Sales', sales);
  writeData('Purchases', purchases);
  writeData('Expenses', expenses);

  doc.end();
});



module.exports = router;
