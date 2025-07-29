const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const authRoutes = require('./routes/authRoutes');
const voiceRoutes = require('./routes/voice');
require('dotenv').config();

const app = express();


// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(session({
  secret: 'secure_secret_key',
  resave: false,
  saveUninitialized: false
}))

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// Routes
app.use('/Auth', authRoutes);
app.use(express.static('public'));


app.use(express.json());
app.use('/', voiceRoutes);

// MongoDB Connect
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => app.listen(3000, () => console.log('Server started on http://localhost:3000')))
  .catch((err) => console.log(err));
