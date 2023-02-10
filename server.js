const express = require('express')
const sqlite3 = require('sqlite3').verbose();

const app = express()
const PORT = 3000;

const MAX_DEPOSIT_AMOUNT = 40000;
const MAX_DEPOSIT_FREQUENCY = 4;
const MAX_DEPOSIT_TOTAL = 150000;
const MAX_WITHDRAWAL_AMOUNT = 20000;
const MAX_WITHDRAWAL_FREQUENCY = 3;
const MAX_WITHDRAWAL_TOTAL = 50000;

const db = new sqlite3.Database(':memory:', (err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Connected to the in-memory SQlite database.');
  });

db.serialize(function() {
    db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, balance REAL)");
    db.run("CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY, user_id INTEGER, type TEXT, amount REAL, date TEXT)");
  });

// middleware function
const authenticate = (req, res, next) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'An error occurred while authenticating user' });
      }
      if (!row) {
        return res.status(401).json({ error: 'Incorrect username or password' });
      }
      req.user = row;
      next();
    });
  };

// authentication router
app.post('/authenticate', (req, res) => {
    authenticate(req, res, () => {
        return res.status(200).json({ message: 'Authentication successful' });
      });
})

// balance router
app.get('/balance', authenticate, (req, res) => {
    return res.status(200).json({ balance: req.user.balance });
  });


// deposit router
app.post('/deposit', authenticate, (req, res) => {
    const { amount } = req.body;
    if (amount > MAX_DEPOSIT_AMOUNT) {
      return res.status(400).json({ error: 'Exceeded Maximum Deposit Per Transaction' });
    }
    db.all("SELECT * FROM transactions WHERE user_id = ? AND type = 'deposit' AND date = ?", [req.user.id, new Date().toDateString()], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'An error occurred while checking deposit transactions' });
      }
      if (rows.length >= MAX_DEPOSIT_FREQUENCY) {
        return res.status(400).json({ error: 'Exceeded Maximum Deposit Frequency' });
      }
      let totalDeposit = rows.reduce((sum, row) => sum + row.amount, 0);
      totalDeposit += amount;
      if (totalDeposit > MAX_DEPOSIT_TOTAL) {
          return res.status(400).json({ error: 'Exceeded Maximum Deposit For The Day' });
      }
      db.run("UPDATE users SET balance = balance + ? WHERE id = ?", [amount, req.user.id], function(err) {
      if (err) {
          return res.status(500).json({ error: 'An error occurred while updating balance' });
      }
      db.run("INSERT INTO transactions (user_id, type, amount, date) VALUES (?, 'deposit', ?, ?)", [req.user.id, amount, new Date().toDateString()], function(err) {
      if (err) {
          return res.status(500).json({ error: 'An error occurred while adding deposit transaction' });
      }
      return res.status(200).json({ message: 'Deposit successful' });
              });
          });
      });
  });

app.listen(PORT, () =>{
    console.log('Bank API Server Running.................')
})

module.exports.app