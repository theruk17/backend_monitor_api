const express = require('express')
const cors = require('cors')
const mysql = require('mysql2')
require('dotenv').config()
const app = express()

app.use(cors())
app.use(express.json())

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

app.put('/edit/:id' , (req, res) => {
  //const { id} = req.params.id
  connection.query(
    `UPDATE pd_monitor SET 'mnt_group' = ?, 'mnt_brand' = ?, 'mnt_model' = ?, 'mnt_size' = ?, 'mnt_refresh_rate' = ?, 
    'mnt_panel' = ?, 'mnt_resolution' = ?, mnt_price_srp = ?, mnt_price_w_com = ? WHERE mnt_id = ?`,
    ["test", req.body.brand, req.body.model, req.body.size, req.body.hz, req.body.panel, req.body.resolution,req.body.price_srp, req.body.price, req.body.id], (err, result) => {
      if(err) throw err
      res.send("Data updated")
      console.log(result)
    }
    
  )
})

app.listen(process.env.PORT || 3000)
