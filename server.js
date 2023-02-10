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

// authentication router
app.post('/authenticate', (req, res) => {
    const {username, password} = req.body;
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
    return res.status(200).json({ message: 'Authentication successful' });
})

app.listen(PORT, () =>{
    console.log('Bank API Server Running.................')
})

module.exports.app