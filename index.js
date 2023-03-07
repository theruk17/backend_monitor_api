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

app.put('/update_stock_mnt' , (req, res) => {
  connection.query(
    "UPDATE pd_monitor SET mnt_status = 'N' WHERE mnt_stock = 0",
    (err, result) => {
      if(err) throw err
      res.send("Stock updated.")
    }
    
  )
})

/* app.post('/create_mnt' , (req, res) => {
  const { id, group, brand, model, size, hz, panel, resolution, curve, status, price_srp, price_w_com } = req.body
  connection.query(
    `INSERT INTO pd_monitor (mnt_id, mnt_group, mnt_brand, mnt_model, mnt_size, mnt_refresh_rate, mnt_panel, mnt_resolution, mnt_curve, mnt_status, mnt_price_srp, mnt_price_w_com) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )`,
    [id, group, brand, model, size, hz, panel, resolution, curve, status, price_srp, price_w_com], (err, result) => {
      if(err) throw err
      res.send("Data updated successsfully")
    }
    
  )
}) */

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
  const { group, brand, model, size, hz, panel, resolution, curve, status, href, price_srp, price_w_com } = req.body
  connection.query(
    `UPDATE pd_monitor SET mnt_group = ?, mnt_brand = ?, mnt_model = ?, mnt_size = ?, mnt_refresh_rate = ?, 
    mnt_panel = ?, mnt_resolution = ?, mnt_curve = ?, mnt_status = ?, mnt_href = ?, mnt_price_srp = ?, mnt_price_w_com = ? WHERE mnt_id = ?`,
    [group, brand, model, size, hz, panel, resolution, curve, status, href, price_srp, price_w_com, id], (err, result) => {
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

app.post('/upload', upload.single('file'), async (req, res) => {
  await readXlsxFile(req.file.buffer, { sheet: 'UPDATE MNT DATA' }).then((rows) => {
    //connection.connect();
    
    rows = rows.slice(1);
    rows.forEach(row => {
      if (!row[0]) {
        return;
      }
      connection.query(`INSERT INTO pd_monitor (mnt_id, mnt_brand, mnt_model, mnt_resolution, mnt_size, mnt_refresh_rate, mnt_price_srp, mnt_price_w_com, mnt_stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) 
      ON DUPLICATE KEY UPDATE mnt_id = ?, mnt_brand = ?, mnt_size = ?, mnt_refresh_rate = ?, mnt_price_srp = ?, mnt_price_w_com = ?, mnt_stock = ?`,
      [row[0], row[5], row[1], row[2], row[3], row[4], row[9], row[10], row[6],
        row[0], row[5], row[3], row[4], row[9], row[10], row[6]],
      function (err, result) {
        if (err) throw err;
        console.log(`Inserted ${result.affectedRows} row(s)`);
      });
    
    });
    //connection.end();
  })

  await readXlsxFile(req.file.buffer, { sheet: 'CASE' }).then((rows) => {
    //connection.connect();
    rows = rows.slice(1);
    rows.forEach((row) => {
      if (!row[0]) {
        return;
      }
      connection.query(`INSERT INTO pd_case (case_id, case_model, case_price_srp) VALUES (?, ?, ?) 
      ON DUPLICATE KEY UPDATE case_id = ?, case_price_srp = ?`,
      [row[0], row[1], row[5], row[0], row[5]],
      function (err, result, fields) {
        if (err) throw err;
        console.log(`Inserted ${result.affectedRows} row(s)`)
      })
    });
    //connection.end();
  })

  await readXlsxFile(req.file.buffer, { sheet: 'NOTEBOOK' }).then((rows) => {
    //connection.connect();
    rows = rows.slice(3);
    rows.forEach((row) => {
      if (!row[0]) {
        return;
      }
      connection.query(`INSERT INTO pd_nb (nb_id, nb_group, nb_model, nb_cpu, nb_vga, nb_ram, nb_size, nb_hz, nb_storage, nb_os, nb_price_srp, nb_dis_price, nb_stock_nny, nb_stock_ramintra, nb_stock_bangphlat, nb_stock_thefloat, nb_stock_sum) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
      ON DUPLICATE KEY UPDATE nb_id = ?, nb_group = ?, nb_cpu = ?, nb_vga = ?, nb_ram = ?, nb_size = ?, nb_hz= ?, nb_storage = ?, nb_os = ?, nb_price_srp = ?, nb_dis_price = ?, nb_stock_nny = ?, nb_stock_ramintra = ?, nb_stock_bangphlat = ?, nb_stock_thefloat = ?, nb_stock_sum = ?`,
      [row[0], row[12], row[1], row[13], row[14], row[16], row[17], row[18], row[19], row[20], row[8], row[9], row[2], row[3], row[4], row[5], row[21],
      row[0], row[12], row[13], row[14], row[16], row[17], row[18], row[19], row[20], row[8], row[9], row[2], row[3], row[4], row[5], row[21]],
      function (err, result, fields) {
        if (err) throw err;
        console.log(`Inserted ${result.affectedRows} row(s)`)
      })
    });
    //connection.end();
    
  })

  await readXlsxFile(req.file.buffer, { sheet: 'LIQUID CS' }).then((rows) => {
    //connection.connect();
    rows = rows.slice(3);
    rows.forEach((row) => {
      if (!row[0]) {
        return;
      }
      connection.query(`INSERT INTO pd_liquid (lc_id, lc_group, lc_brand, lc_model, lc_price_srp, lc_discount, lc_stock_nny, lc_stock_ramintra, lc_stock_bangphlat, lc_stock_thefloat, lc_stock_sum) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
      ON DUPLICATE KEY UPDATE lc_id = ?, lc_group = ?, lc_price_srp = ?, lc_discount = ?, lc_stock_nny = ?, lc_stock_ramintra = ?, lc_stock_bangphlat = ?, lc_stock_thefloat = ?, lc_stock_sum = ?`,
      [row[0], row[7], row[8], row[1], row[11], row[12], row[2], row[3], row[4], row[5], row[6], 
      row[0], row[7], row[11], row[12], row[2], row[3], row[4], row[5], row[6]],
      function (err, result, fields) {
        if (err) throw err;
        console.log(`Inserted ${result.affectedRows} row(s)`)
      })
    });
    //connection.end();
    
  })
  res.status(200).send({ status: 'done' });
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
    `SELECT * FROM pd_case WHERE case_status="Y" ORDER BY CASE case_group WHEN "ZONE iHAVECPU" THEN 1 WHEN "ZONE A" THEN 2 WHEN "ZONE B" THEN 3 WHEN "ZONE C" THEN 4 WHEN "ZONE ITX" THEN 5 end, case_brand, case_model, case_color ASC`,
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
  const { group, brand, model, color, status, href, price_srp } = req.body
  connection.query(
    `UPDATE pd_case SET case_group = ?, case_brand = ?, case_model = ?, case_color = ?, 
     case_status = ?, case_href = ?, case_price_srp = ? WHERE case_id = ?`,
    [group, brand, model, color, status, href, price_srp, id], (err, result) => {
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


//----------------- NOTEBOOK ----------------

app.get('/nb' , (req, res) => {
  connection.query(
    `SELECT * FROM pd_nb WHERE nb_status="Y" ORDER BY CASE nb_group WHEN "Gaming" THEN 1 WHEN "Non-gaming" THEN 2 END, nb_brand, nb_price_srp ASC`,
    function(err, results, fields) {
      res.send(results)
    }
  )
});

app.get('/admin_data_nb' , (req, res) => {
  connection.query(
    `SELECT * FROM pd_nb ORDER BY nb_brand ASC`,
    function(err, results, fields) {
      res.send(results)
    }
  )
});

app.put('/edit_nb/:id' , (req, res) => {
  const { id }  = req.params
  const { group, brand, model, color, status, href, price_srp, dis_price } = req.body
  connection.query(
    `UPDATE pd_nb SET nb_group = ?, nb_brand = ?, nb_model = ?, nb_color = ?, 
     nb_status = ?, nb_href = ?, nb_price_srp = ?, nb_dis_price = ? WHERE nb_id = ?`,
    [group, brand, model, color, status, href, price_srp, dis_price, id], (err, result) => {
      if(err) throw err
      res.send("Data updated successsfully")
    }
    
  )
})

app.put('/edit_status_nb/:id' , (req, res) => {
  const { id }  = req.params
  const { status } = req.body
  connection.query(
    `UPDATE pd_nb SET nb_status = ? WHERE nb_id = ?`,
    [status, id], (err, result) => {
      if(err) throw err
      res.send("Data updated successsfully")
    }
    
  )
});

app.put('/update_img_nb/:id' , (req, res) => {
  const { id }  = req.params
  const { imageUrl } = req.body;
  connection.query(
    `UPDATE pd_nb SET nb_img = ? WHERE nb_id = ?`,
    [imageUrl, id], (err, result) => {
      if(err) throw err
      res.send("Image uploaded successfully!")
    }
    
  )
})

app.delete("/admin_del_nb/:id", (req, res) => {
  const id = req.params.id
  connection.query("DELETE FROM pd_nb WHERE nb_id = ?", id, (error, result) => {
    if (error) throw error;
    res.send("Delete Data Successsfully");
  });
});

app.put('/update_stock_nb' , (req, res) => {
  connection.query(
    "UPDATE pd_nb SET nb_status = 'N' WHERE nb_stock_sum = 0",
    (err, result) => {
      if(err) throw err
      res.send("Stock updated.")
    }
    
  )
})

//----------------- LIQUID COOLING ----------------

app.get('/lc' , (req, res) => {
  connection.query(
    `SELECT * FROM pd_liquid WHERE lc_status="Y" ORDER BY lc_group ASC`,
    function(err, results, fields) {
      res.send(results)
    }
  )
});

app.get('/admin_data_lc' , (req, res) => {
  connection.query(
    `SELECT * FROM pd_liquid ORDER BY lc_brand ASC`,
    function(err, results, fields) {
      res.send(results)
    }
  )
});

app.put('/edit_lc/:id' , (req, res) => {
  const { id }  = req.params
  const { group, brand, model, color, status, href, price_srp, discount } = req.body
  connection.query(
    `UPDATE pd_liquid SET lc_group = ?, lc_brand = ?, lc_model = ?, lc_color = ?, 
     lc_status = ?, lc_href = ?, lc_price_srp = ?, lc_discount = ? WHERE lc_id = ?`,
    [group, brand, model, color, status, href, price_srp, discount, id], (err, result) => {
      if(err) throw err
      res.send("Data updated successsfully")
    }
    
  )
})

app.put('/edit_status_lc/:id' , (req, res) => {
  const { id }  = req.params
  const { status } = req.body
  connection.query(
    `UPDATE pd_liquid SET lc_status = ? WHERE lc_id = ?`,
    [status, id], (err, result) => {
      if(err) throw err
      res.send("Data updated successsfully")
    }
    
  )
});

app.put('/update_img_lc/:id' , (req, res) => {
  const { id }  = req.params
  const { imageUrl } = req.body;
  connection.query(
    `UPDATE pd_liquid SET lc_img = ? WHERE lc_id = ?`,
    [imageUrl, id], (err, result) => {
      if(err) throw err
      res.send("Image uploaded successfully!")
    }
    
  )
})

app.delete("/admin_del_lc/:id", (req, res) => {
  const id = req.params.id
  connection.query("DELETE FROM pd_liquid WHERE lc_id = ?", id, (error, result) => {
    if (error) throw error;
    res.send("Delete Data Successsfully");
  });
});

app.put('/update_stock_lc' , (req, res) => {
  connection.query(
    "UPDATE pd_liquid SET lc_status = 'N' WHERE lc_stock_sum = 0",
    (err, result) => {
      if(err) throw err
      res.send("Stock updated.")
    }
    
  )
})

app.listen(process.env.PORT || 3000)
