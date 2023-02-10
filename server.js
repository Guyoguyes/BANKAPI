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
    db.run("insert into users (id, username, passsword, balance) values (1, 'anoddle0', 'aEkjrg', 526855);")
    db.run("insert into users (id, username, passsword, balance) values (2, 'acarpe1', 'TqEBrR2V', 690258);")
    db.run("insert into users (id, username, passsword, balance) values (3, 'wguerreiro2', '8nX01m', 153322);")
    db.run("insert into users (id, username, passsword, balance) values (4, 'favramovsky3', 'QsYDtY6e', 341152);")
    db.run("insert into users (id, username, passsword, balance) values (5, 'fjudkins4', 'xnLkXjPD', 758792)")
    db.run("insert into transactions (id, user_id, type, amount, date) values (1, 1, 'deposit', 129526, '4/9/2022')")
    db.run("insert into transactions (id, user_id, type, amount, date) values (2, 2, 'withdrawal', 368235, '11/15/2022')")
    db.run("insert into transactions (id, user_id, type, amount, date) values (3, 3, 'deposit', 942675, '10/6/2022')")
    db.run("insert into transactions (id, user_id, type, amount, date) values (4, 4, 'withdrawal', 161507, '1/4/2023')")
    db.run("insert into transactions (id, user_id, type, amount, date) values (5, 5, 'deposit', 673746, '10/20/2022')")
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

// withdrawal router
app.post('/withdrawal', authenticate, (req, res) => {
    const { amount } = req.body;
    if (amount > MAX_WITHDRAWAL_AMOUNT) {
        return res.status(400).json({ error: 'Exceeded Maximum Withdrawal Per Transaction' });
    }
    if (req.user.balance < amount) {
        return res.status(400).json({ error: 'Insufficient funds' });
    }
    db.all("SELECT * FROM transactions WHERE user_id = ? AND type = 'withdrawal' AND date = ?", [req.user.id, new Date().toDateString()], (err, rows) => {
    if (err) {
        return res.status(500).json({ error: 'An error occurred while checking withdrawal transactions' });
    }
    if (rows.length >= MAX_WITHDRAWAL_FREQUENCY) {
        return res.status(400).json({ error: 'Exceeded Maximum Withdrawal Frequency' });
    }
    

    let totalWithdrawal = rows.reduce((sum, row) => sum + row.amount, 0);
    totalWithdrawal += amount;
    if (totalWithdrawal > MAX_WITHDRAWAL_TOTAL) {
        return res.status(400).json({ error: 'Exceeded Maximum Withdrawal For The Day' });
    }
    db.run("UPDATE users SET balance = balance - ? WHERE id = ?", [amount, req.user.id], function(err) {
    if (err) {
        return res.status(500).json({ error: 'An error occurred while updating balance' });
    }
    db.run("INSERT INTO transactions (user_id, type, amount, date) VALUES (?, 'withdrawal', ?, ?)", [req.user.id, amount, new Date().toDateString()], function(err) {
    if (err) {
        return res.status(500).json({ error: 'An error occurred while adding withdrawal transaction' });
    }
    return res.status(200).json({ message: 'Withdrawal successful' });
  });
});
});
});

app.listen(PORT, () =>{
    console.log('Bank API Server Running.................')
})

module.exports.app