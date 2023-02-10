const express = require('express')
const sqlite3 = require('sqlite3').verbose();

const app = express()
const PORT = 3000;

const db = new sqlite3.Database(':memory:');

db.serialize(function() {
    db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, balance REAL)");
    db.run("CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY, user_id INTEGER, type TEXT, amount REAL, date TEXT)");
  });

app.listen(PORT, () =>{
    console.log('Bank API Server Running.................')
})

module.exports.app