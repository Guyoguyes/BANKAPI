const express = require('express')

const app = express()
const PORT = 3000;

app.listen(PORT, () =>{
    console.log('Bank API Server Running.................')
})

module.exports.app