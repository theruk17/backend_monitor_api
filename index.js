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
    `SELECT pd.mnt_brand AS mnt_brand, g.mnt_group AS mnt_group, pd.mnt_curve AS mnt_curve, pd.mnt_model AS mnt_model, pd.mnt_panel AS mnt_panel, pd.mnt_size AS mnt_size, pd.mnt_refresh_rate AS mnt_refresh_rate, pd.mnt_resolution AS mnt_resolution, pd.mnt_price_srp AS mnt_price_srp, pd.mnt_price_w_com AS mnt_price_w_com, pd.mnt_href AS mnt_href, pd.mnt_img AS mnt_img 
    FROM pd_monitor pd LEFTJOIN pd_group g ON g.mnt_group_id = pd.mnt_group 
    WHERE pd.mnt_status="Y" ORDER BY pd.mnt_group, pd.mnt_price_w_com ASC`,
    function(err, results, fields) {
      res.send(results)
    }
  )
})

app.get('/admin_data' , (req, res) => {
  connection.query(
    'SELECT * FROM pd_monitor ORDER BY mnt_brand ASC',
    function(err, results, fields) {
      res.send(results)
    }
  )
})

app.get('/edit_data/:id' , (req, res) => {
  const { id }  = req.params
  connection.query(
    'SELECT * FROM pd_monitor WHERE mnt_id = ?',
    [id],
    function(err, results, fields) {
      res.send(results)
    }
  )
})

app.put('/edit/:id' , (req, res) => {
  const { id }  = req.params
  const { group, brand, model, size, hz, panel, resolution, curve, status, price_srp, price_w_com, } = req.body
  connection.query(
    `UPDATE pd_monitor SET mnt_group = ?, mnt_brand = ?, mnt_model = ?, mnt_size = ?, mnt_refresh_rate = ?, 
    mnt_panel = ?, mnt_resolution = ?, mnt_curve = ?, mnt_status = ?, mnt_price_srp = ?, mnt_price_w_com = ? WHERE mnt_id = ?`,
    [group, brand, model, size, hz, panel, resolution, curve, status, price_srp, price_w_com, id], (err, result) => {
      if(err) throw err
      res.send("Data updated successsfully")
    }
    
  )
})

app.delete("/admin_del/:id", (req, res) => {
  const id = req.params.id
  connection.query("DELETE FROM pd_monitor WHERE mnt_id = ?", id, (error, result) => {
    if (error) throw error;
    res.send("Delete Data Successsfully");
  });
});

app.listen(process.env.PORT || 3000)
