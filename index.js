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
    `SELECT pd.mnt_brand AS mnt_brand, g.mnt_group AS mnt_group, pd.mnt_curve AS mnt_curve, pd.mnt_model AS mnt_model, pd.mnt_panel AS mnt_panel, pd.mnt_size AS mnt_size, pd.mnt_refresh_rate AS mnt_refresh_rate, pd.mnt_resolution AS mnt_resolution, pd.mnt_price_srp AS mnt_price_srp, pd.mnt_price_w_com AS mnt_price_w_com, pd.mnt_href AS mnt_href, pd.mnt_img AS mnt_img 
    FROM pd_monitor pd LEFT JOIN pd_group g ON g.mnt_group_id = pd.mnt_group 
    WHERE pd.mnt_status="Y" ORDER BY pd.mnt_group, pd.mnt_price_w_com ASC`,
    function(err, results, fields) {
      res.send(results)
    }
  )
})

app.get('/admin_data' , (req, res) => {
  connection.query(
    `SELECT * FROM pd_monitor ORDER BY mnt_brand ASC`,
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

app.put('/update_img_mnt/:id' , (req, res) => {
  const { id }  = req.params
  const { imageUrl } = req.body;
  connection.query(
    `UPDATE pd_monitor SET mnt_img = ? WHERE mnt_id = ?`,
    [imageUrl, id], (err, result) => {
      if(err) throw err
      res.send("Image uploaded successfully!")
    }
    
  )
})

//----------------- CASE 

app.get('/case' , (req, res) => {
  connection.query(
    `SELECT * FROM pd_case WHERE case_status="Y" ORDER BY CASE case_group WHEN "ZONE iHAVECPU" THEN 1 WHEN "ZONE A" THEN 2 WHEN "ZONE B" THEN 3 WHEN "ZONE C" THEN 4 end, case_brand, case_model, case_color ASC`,
    function(err, results, fields) {
      res.send(results)
    }
  )
});

app.get('/admin_data_case' , (req, res) => {
  connection.query(
    `SELECT * FROM pd_case ORDER BY case_brand,case_model,case_color ASC`,
    function(err, results, fields) {
      res.send(results)
    }
  )
});

app.put('/edit_status_case/:id' , (req, res) => {
  const { id }  = req.params
  const { status } = req.body
  connection.query(
    `UPDATE pd_case SET case_status = ? WHERE case_id = ?`,
    [status, id], (err, result) => {
      if(err) throw err
      res.send("Data updated successsfully")
    }
    
  )
});

app.put('/edit_case/:id' , (req, res) => {
  const { id }  = req.params
  const { group, brand, model, color, status, price_srp } = req.body
  connection.query(
    `UPDATE pd_case SET case_group = ?, case_brand = ?, case_model = ?, case_color = ?, 
     case_status = ?, case_price_srp = ? WHERE case_id = ?`,
    [group, brand, model, color, status, price_srp, id], (err, result) => {
      if(err) throw err
      res.send("Data updated successsfully")
    }
    
  )
})

app.put('/update_img_case/:id' , (req, res) => {
  const { id }  = req.params
  const { imageUrl } = req.body;
  connection.query(
    `UPDATE pd_case SET case_img = ? WHERE case_id = ?`,
    [imageUrl, id], (err, result) => {
      if(err) throw err
      res.send("Image uploaded successfully!")
    }
    
  )
})


app.post('/upload_case', upload.single('file'), (req, res) => {
  readXlsxFile(req.file.buffer).then((rows) => {
    //connection.connect();
    rows.forEach(row => {
      connection.query(`INSERT INTO pd_case (case_id, case_group, case_brand, case_model, case_color, case_img, case_status, case_href, case_price_srp) 
      VALUES ('${row[0]}', '${row[1]}', '${row[2]}', '${row[3]}', '${row[4]}', '${row[5]}', '${row[6]}', '${row[7]}', '${row[8]}') 
      ON DUPLICATE KEY UPDATE case_id = '${row[0]}', case_group = '${row[1]}', case_brand = '${row[2]}', case_model = '${row[3]}', case_color = '${row[4]}', case_img = '${row[5]}', case_status = '${row[6]}', case_href = '${row[7]}', case_price_srp = '${row[8]}'`),
      (err, result) => {
        if (err) throw err;
        console.log(`Inserted ${result.affectedRows} row(s)`);
      };
    });
    //connection.end();
    res.status(200).send({ status: 'done' });
  })
});


app.post("/test_upload", async (req, res) => {
  try {
    const data = await readXlsxFile(req.files.file.data);
    data.forEach((row) => {
      connection.query(`INSERT INTO pd_test (case_id, case_group, case_brand, case_model, case_color, case_img, case_status, case_href, case_price_srp) 
      VALUES ('${row[0]}', '${row[1]}', '${row[2]}', '${row[3]}', '${row[4]}', '${row[5]}', '${row[6]}', '${row[7]}', '${row[8]}') 
      ON DUPLICATE KEY UPDATE case_id = '${row[0]}', case_group = '${row[1]}', case_brand = '${row[2]}', case_model = '${row[3]}', case_color = '${row[4]}', case_img = '${row[5]}', case_status = '${row[6]}', case_href = '${row[7]}', case_price_srp = '${row[8]}'`),
      function (err, results, fields) {
        if (err) throw err;
      }
    })
    res.send("File uploaded and data inserted into the database");

  } catch (err) {
    res.status(500).send(err.message);
  }
})

app.listen(process.env.PORT || 3000)
