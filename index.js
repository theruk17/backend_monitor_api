const express = require('express')
const cors = require('cors')
const mysql = require('mysql2')
require('dotenv').config()
const app = express()

app.use(cors())

const connection = mysql.createConnection(process.env.DATABASE_URL)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/monitor' , (req, res) => {
  connection.query(
    'SELECT * FROM pd_monitor WHERE mnt_status="Y"',
    function(err, results, fields) {
      res.send(results)
    }
  )
})

app.get('/admin_data' , (req, res) => {
  connection.query(
    'SELECT * FROM pd_monitor',
    function(err, results, fields) {
      res.send(results)
    }
  )
})

app.get('/data_group' , (req, res) => {
  connection.query(
    'SELECT * FROM pd_monitor',
    function(err, results, fields) {
      res.send(results)
    }
  )
})

app.listen(process.env.PORT || 3000)
