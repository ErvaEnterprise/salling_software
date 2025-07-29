const express = require('express');
const router = express.Router();
const nlp = require('compromise');

router.post('/parse-voice', (req, res) => {
  const text = req.body.text;
  const doc = nlp(text);

  const numbers = doc.numbers().values().out('array');
  const people = doc.people().out('array');
  const products = doc.match('#Noun').out('array');

  res.json({
    type: text.includes('purchase') ? 'purchase' : 'sale',
    quantity: numbers[0] || '',
    product: products[1] || products[0] || '',
    person: people[0] || '',
    total: numbers[1] || '',
  });
});

module.exports = router;
