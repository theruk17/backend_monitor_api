const express = require('express')
const cors = require('cors')
const multer = require('multer')
const readXlsxFile = require('read-excel-file/node')
const mysql = require('mysql2')
require('dotenv').config()
const app = express()

app.use(cors())
app.use(express.json())

const upload = multer()

const connection = mysql.createConnection(process.env.DATABASE_URL)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/monitor' , (req, res) => {
  connection.query(
    'SELECT * FROM pd_monitor WHERE mnt_status="Y" ORDER BY mnt_group, mnt_price_w_com ASC',
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
  const { group, brand, model, size, hz, panel, resolution, curve, status, price_srp, price_w_com } = req.body
  connection.query(
    `UPDATE pd_monitor SET mnt_group = ?, mnt_brand = ?, mnt_model = ?, mnt_size = ?, mnt_refresh_rate = ?, 
    mnt_panel = ?, mnt_resolution = ?, mnt_curve = ?, mnt_status = ?, mnt_price_srp = ?, mnt_price_w_com = ? WHERE mnt_id = ?`,
    [group, brand, model, size, hz, panel, resolution, curve, status, price_srp, price_w_com, id], (err, result) => {
      if(err) throw err
      res.send("Data updated successsfully")
    }
    
  )
})

app.put('/edit_status/:id' , (req, res) => {
  const { id }  = req.params
  const { status } = req.body
  connection.query(
    `UPDATE pd_monitor SET mnt_status = ? WHERE mnt_id = ?`,
    [status, id], (err, result) => {
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

app.post('/upload', upload.single('file'), (req, res) => {
  readXlsxFile(req.file.buffer).then((rows) => {
    //connection.connect();
    rows.forEach(row => {
      connection.query(`INSERT INTO pd_monitor (mnt_id, mnt_group, mnt_brand) VALUES ('${row[0]}', '${row[1]}', '${row[2]}') ON DUPLICATE KEY UPDATE mnt_id = '${row[0]}', mnt_group = '${row[1]}', mnt_brand = '${row[2]}'`),
      (err, result) => {
        if (err) throw err;
        console.log(`Inserted ${result.affectedRows} row(s)`);
      };
    });
    //connection.end();
    res.status(200).send({ status: 'done' });
  })
})

app.listen(process.env.PORT || 3000)
