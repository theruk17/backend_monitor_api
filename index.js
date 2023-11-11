const { google } = require("googleapis");
const multer = require("multer");
const path = require("path");
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const fs = require("fs");
const { text } = require("body-parser");
require("dotenv").config();

const dir = path.join(__dirname, "uploads");
const saltRounds = 10;

const jwtConfig = {
  secret: process.env.JWT_SECRET,
  expirationTime: process.env.JWT_EXPIRATION,
  refreshTokenSecret: process.env.JWT_REFRESH_TOKEN_SECRET,
};

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(dir));

const connection = mysql.createConnection(process.env.DATABASE_URL);

const token = process.env.TOKEN;
const url = process.env.URL;

const jwtValidate = (req, res, next) => {
  try {
    const token = req.body.headers.Authorization || req.headers.Authorization;
    if (!token) return res.status(401).send({ message: "No Token" });

    const tokens = token.replace("Bearer ", "");

    jwt.verify(tokens, jwtConfig.secret, (err, decoded) => {
      if (err) throw new Error(err);
    });
    next();
  } catch (error) {
    return res.sendStatus(403);
  }
};

const jwtRefreshTokenValidate = (req, res, next) => {
  try {
    const token = req.body.headers.Authorization || req.headers.Authorization;
    if (!token) return res.sendStatus(401);

    const tokens = token.replace("Bearer ", "");

    jwt.verify(tokens, jwtConfig.refreshTokenSecret, (err, decoded) => {
      if (err) {
        const oldTokenDecoded = jwt.decode(token, { complete: true });

        const { id: userId } = oldTokenDecoded.payload;
        connection.query(
          "SELECT * FROM users",
          function (err, results, fields) {
            const user = results.find((u) => u.id === userId);
            const accessToken = jwt.sign(
              { id: userId },
              jwtConfig.refreshTokenSecret,
              {
                expiresIn: jwtConfig.expirationTime,
              }
            );
            const response = {
              accessToken,
              userData: { ...user, password: undefined },
            };

            res.status(200).send(response);
          }
        );
      }
    });
    next();
  } catch (error) {
    return res.sendStatus(403);
  }
};

// Multer configuration for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({ storage });

app.get("/", jwtValidate, (req, res) => {
  res.send("Hello World!");
});

// ** REGISTER
app.post("/auth/register", (req, res) => {
  const { username, password, fname, lname } = req.body;
  bcrypt.hash(password, saltRounds, function (err, hash) {
    connection.query(
      "INSERT INTO users (username, password, fname, lname) VALUES (?, ?, ?, ?)",
      [username, hash, fname, lname],
      function (err, results, fields) {
        res.send(results);
        console.log(user);
      }
    );
  });
});

// ** LOGIN
app.post("/auth/login", (req, res) => {
  const { username, password } = req.body;

  let error = {
    message: ["Something went wrong"],
  };
  connection.query(
    "SELECT * FROM users WHERE username = ?",
    [username],
    function (err, results, fields) {
      bcrypt.compare(password, results[0].password, function (err, isLogin) {
        if (isLogin) {
          const user = results.find((u) => u.username === username);

          if (user) {
            const accessToken = jwt.sign({ id: user.id }, jwtConfig.secret, {
              expiresIn: jwtConfig.expirationTime,
            });

            const response = {
              accessToken,
              userData: { ...user, password: undefined },
            };

            res.status(200).send(response);
          } else {
            error = {
              message: ["username or Password is Invalid"],
            };

            res.status(400).send(error);
          }
        } else {
          res.status(400).send({
            status: 400,
            message: "username or Password is Invalid",
          });
        }
      });
    }
  );
});

app.post("/auth/refresh", jwtRefreshTokenValidate, (req, res) => {});

app.post("/uploadimg", upload.single("file"), (req, res) => {
  const { filename } = req.file;
  const { id } = req.body;
  const { t_name } = req.body;
  const { c_name } = req.body;
  connection.query(
    `UPDATE pd_${t_name} SET ${c_name}_img = ? WHERE ${c_name}_id = ? `,
    [filename, id],
    function (err, results) {
      if (err) {
        console.error(err);
        res.sendStatus(500);
      } else {
        res.sendStatus(200);
      }
    }
  );
});

// ** UPLOAD IMAGES
app.post("/uploadimgnew", upload.single("file"), (req, res) => {
  try {
    const { filename } = req.file;
    const { sort } = req.body;
    const { id } = req.body;
    connection.execute(
      `INSERT INTO images_product (product_id, url, sort) VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE product_id = ?, url = ?, sort = ? `,
      [id, filename, sort, id, filename, sort]
    );

    res.status(200).send({ message: "OK" });
  } catch (error) {
    res.status(500).json({ status: 500, message: error });
  }
});

app.post("/updateimg", (req, res) => {
  try {
    const { file } = req.body;
    const { sort } = req.body;
    const { id } = req.body;
    connection.query(
      `UPDATE images_product SET sort = ? WHERE url = ? AND product_id = ?`,
      [sort, file, id]
    );
    res.status(200).send({ message: "OK" });
  } catch (error) {
    res.status(500).json({ status: 500, message: error });
  }
});

app.delete("/deleteimg/:filename", (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, "uploads", filename);

    if (filename !== "No-Image.jpg") {
      fs.unlink(filePath, (err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to delete image." });
        }
        connection.execute(`DELETE FROM images_product WHERE url = ?`, [
          filename,
        ]);

        res.status(200).json({ message: "Image deleted successfully." });
      });
    }
  } catch (error) {
    res.status(500).json({ status: 500, message: error });
  }
});

// ################ get Stock Itech ##############
app.post("/getStockItech", (req, res) => {
  for (let i = 1; i < 11; i++) {
    let data = JSON.stringify({
      BranchID: i,
    });

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: url,
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      data: data,
    };

    axios
      .request(config)
      .then((response) => {
        if (i == 1) {
          response.data.product.forEach(async (row) => {
            connection.query(
              `INSERT INTO productitech (productCode, productName, price, minPrice, stock_nny) VALUES (?, ?, ?, ?, ?) 
            ON DUPLICATE KEY UPDATE productCode = ?, productName = ?, price = ?, minPrice = ?, stock_nny = ?`,
              [
                row.productCode,
                row.productName,
                row.price,
                row.minPrice,
                row.numberStock,

                row.productCode,
                row.productName,
                row.price,
                row.minPrice,
                row.numberStock,
              ],
              function (err) {
                if (err) throw err;
              }
            );
          });
          console.log("Branch 1 Successsfully.");
        } else if (i == 2) {
          response.data.product.forEach(async (row) => {
            connection.query(
              `UPDATE productitech SET stock_ramintra = ? WHERE productCode = ?`,
              [row.numberStock, row.productCode],
              function (err) {
                if (err) throw err;
              }
            );
          });
          console.log("Branch 2 Successsfully.");
        } else if (i == 3) {
          response.data.product.forEach(async (row) => {
            connection.query(
              `UPDATE productitech SET stock_claim = ? WHERE productCode = ?`,
              [row.numberStock, row.productCode],
              function (err) {
                if (err) throw err;
              }
            );
          });
          console.log("Branch 3 Successsfully.");
        } else if (i == 4) {
          response.data.product.forEach(async (row) => {
            connection.query(
              `UPDATE productitech SET stock_bangphlat = ? WHERE productCode = ?`,
              [row.numberStock, row.productCode],
              function (err) {
                if (err) throw err;
              }
            );
          });
          console.log("Branch 4 Successsfully.");
        } else if (i == 5) {
          response.data.product.forEach(async (row) => {
            connection.query(
              `UPDATE productitech SET stock_thefloat = ? WHERE productCode = ?`,
              [row.numberStock, row.productCode],
              function (err) {
                if (err) throw err;
              }
            );
          });
          console.log("Branch 5 Successsfully.");
        } else if (i === 9) {
          response.data.product.forEach(async (row) => {
            connection.query(
              `UPDATE productitech SET stock_rama2 = ? WHERE productCode = ?`,
              [row.numberStock, row.productCode],
              function (err) {
                if (err) throw err;
                /* res.status(200).send({
                  status: 200,
                  message: "All Branch Successsfully.",
                }); */
              }
            );
          });
          console.log("Branch 9 Successsfully.");
        } else if (i == 7) {
          response.data.product.forEach(async (row) => {
            connection.query(
              `UPDATE productitech SET stock_rangsit = ? WHERE productCode = ?`,
              [row.numberStock, row.productCode],
              function (err) {
                if (err) throw err;
              }
            );
          });
          console.log("Branch 7 Successsfully.");
        } else if (i == 8) {
          response.data.product.forEach(async (row) => {
            connection.query(
              `UPDATE productitech SET stock_bangsaen = ? WHERE productCode = ?`,
              [row.numberStock, row.productCode],
              function (err) {
                if (err) throw err;
              }
            );
          });
          console.log("Branch 8 Successsfully.");
        } else if (i == 6) {
          response.data.product.forEach(async (row) => {
            connection.query(
              `UPDATE productitech SET stock_show = ? WHERE productCode = ?`,
              [row.numberStock, row.productCode],
              function (err) {
                if (err) throw err;
              }
            );
          });
          console.log("Branch 6 Successsfully.");
        } else if (i == 10) {
          response.data.product.forEach(async (row) => {
            connection.query(
              `UPDATE productitech SET stock_bangna = ? WHERE productCode = ?`,
              [row.numberStock, row.productCode],
              function (err) {
                if (err) throw err;
              }
            );
          });
          console.log("Branch 10 Successsfully.");
        }
      })
      .catch((error) => {
        res.status(500).json({ status: 500, message: error });
      });
  }
});

// ################ Sync Stock Itech to Admin ##############
app.put("/syncItechtoAdmin", (req, res) => {
  connection.query(
    `UPDATE products p1 
    LEFT JOIN productitech p2 ON p2.productCode = p1.product_id
    SET 
    p1.product_price = p2.price, 
    p1.product_minprice = p2.minPrice, 
    p1.stock_nny = p2.stock_nny, 
    p1.stock_ramintra = p2.stock_ramintra, 
    p1.stock_bangphlat = p2.stock_bangphlat, 
    p1.stock_thefloat = p2.stock_thefloat, 
    p1.stock_rangsit = p2.stock_rangsit,
    p1.stock_bangsaen = p2.stock_bangsaen, 
    p1.stock_rama2 = p2.stock_rama2,
    p1.stock_bangna = p2.stock_bangna  
    WHERE p1.product_id = p2.productCode`,
    (err) => {
      if (err) {
        res.status(500).json({ status: 500, message: err });
      } else {
        res.status(200).send({
          status: 200,
          message: "ซิงค์ข้อมูลจาก Itech สำเร็จ.",
        });
      }
    }
  );
});

// ################ Update Stock ##############
app.put("/update_stock", (req, res) => {
  connection.query(
    "UPDATE products SET status = 'N' WHERE (stock_nny+stock_ramintra+stock_bangphlat+stock_thefloat+stock_rangsit+stock_bangsaen+stock_rama2+stock_bangna) = 0",
    (err) => {
      if (err) throw err;
      res.send("สถานะสินค้าอัพเดท.");
    }
  );
});

// ################ Edit Status ##############
app.put("/edit_status/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  connection.query(
    `UPDATE products SET status = ? WHERE sku = ?`,
    [status, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

const serviceAccountKeyFile = "./amiable-poet-385904-447c730ebf42.json";
const sheetId = "1DrsdnymjDzeFjcFEcQEMp1TTtTqh-SYiZK1WzLvenjI";
const tabNames = [
  "UPDATE MNT DATA",
  "CASE",
  "NOTEBOOK",
  "LCS",
  "FAN",
  "HEADSET",
  "KB",
  "CHAIR",
  "MOUSE",
  "M-PAD",
  "MICE",
  "SINK",
  "HOLDER",
];
const range = "A3:AC";

app.get("/getdatasheet", async (req, res) => {
  try {
    const googleSheetClient = await _getGoogleSheetClient();
    const data = await _readGoogleSheet(
      googleSheetClient,
      sheetId,
      tabNames,
      range
    );
    res.status(200).send({
      status: 200,
      message: data,
    });
    async function _getGoogleSheetClient() {
      const auth = new google.auth.GoogleAuth({
        keyFile: serviceAccountKeyFile,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });
      const authClient = await auth.getClient();
      return google.sheets({
        version: "v4",
        auth: authClient,
      });
    }

    async function _readGoogleSheet(
      googleSheetClient,
      sheetId,
      tabNames,
      range
    ) {
      for (let tabName of tabNames) {
        const res = await googleSheetClient.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: `${tabName}!${range}`,
        });

        let index = 1;
        res.data.values.forEach(async (row) => {
          if (!row[0]) {
            return;
          }
          switch (tabName) {
            case "UPDATE MNT DATA":
              connection.query(
                `INSERT INTO pd_monitor (mnt_id, sku, mnt_brand, mnt_model, mnt_resolution, mnt_size, mnt_panel, mnt_refresh_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE mnt_id = ?, sku = ?`,
                [
                  row[0],
                  row[24],
                  row[21],
                  row[1],
                  row[17],
                  row[18],
                  row[19],
                  row[20],

                  row[0],
                  row[24],
                ],
                function (err) {
                  if (err) throw err;

                  console.log(index++ + `. ${row[1]}`);
                }
              );
              //------------------------------------------------
              connection.query(
                `INSERT INTO products (product_id, sku) VALUES (?, ?) ON DUPLICATE KEY UPDATE product_id = ?, sku = ?`,
                [row[0], row[24], row[0], row[24]],
                function (err) {
                  if (err) throw err;
                }
              );
              break;
            case "CASE":
              connection.query(
                `INSERT INTO pd_case (case_id, sku, case_brand, case_group, case_model) VALUES (?, ?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE case_id = ?, sku = ?, case_group = ?`,
                [
                  row[0],
                  row[18],
                  row[15],
                  row[16],
                  row[1],

                  row[0],
                  row[18],
                  row[16],
                ],
                function (err) {
                  if (err) throw err;
                  console.log(index++ + `. ${row[1]}`);
                }
              );
              //------------------------------------------------
              connection.query(
                `INSERT INTO products (product_id, sku) VALUES (?, ?) ON DUPLICATE KEY UPDATE product_id = ?, sku = ?`,
                [row[0], row[18], row[0], row[18]],
                function (err) {
                  if (err) throw err;
                }
              );
              break;
            case "NOTEBOOK":
              connection.query(
                `INSERT INTO pd_nb (nb_id, sku, nb_group, nb_brand, nb_model, nb_cpu, nb_vga, nb_ram, nb_size, nb_hz, nb_storage, nb_os) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE nb_id = ?, sku = ?, nb_group = ?`,
                [
                  row[0],
                  row[28],
                  row[17],
                  row[26],
                  row[1],
                  row[18],
                  row[19],
                  row[21],
                  row[22],
                  row[23],
                  row[24],
                  row[25],

                  row[0],
                  row[28],
                  row[17],
                ],
                function (err) {
                  if (err) throw err;
                  console.log(index++ + `. ${row[1]}`);
                }
              );
              //------------------------------------------------
              connection.query(
                `INSERT INTO products (product_id, sku) VALUES (?, ?) ON DUPLICATE KEY UPDATE product_id = ?, sku = ?`,
                [row[0], row[28], row[0], row[28]],
                function (err) {
                  if (err) throw err;
                }
              );
              break;
            case "LCS":
              connection.query(
                `INSERT INTO pd_liquid (lc_id, sku, lc_group, lc_brand, lc_model) VALUES (?, ?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE lc_id = ?, sku = ?, lc_group = ?`,
                [
                  row[0],
                  row[19],
                  row[11],
                  row[12],
                  row[1],

                  row[0],
                  row[19],
                  row[11],
                ],
                function (err) {
                  if (err) throw err;
                  console.log(index++ + `. ${row[1]}`);
                }
              );
              //------------------------------------------------
              connection.query(
                `INSERT INTO products (product_id, sku) VALUES (?, ?) ON DUPLICATE KEY UPDATE product_id = ?, sku = ?`,
                [row[0], row[19], row[0], row[19]],
                function (err) {
                  if (err) throw err;
                }
              );
              break;
            case "FAN":
              connection.query(
                `INSERT INTO pd_fan (f_id, sku, f_group, f_brand, f_model, f_color) VALUES (?, ?, ?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE f_id = ?, sku = ?, f_group = ?`,
                [
                  row[0],
                  row[18],
                  row[15],
                  row[16],
                  row[1],
                  row[17],

                  row[0],
                  row[18],
                  row[15],
                ],
                function (err) {
                  if (err) throw err;
                  console.log(index++ + `. ${row[1]}`);
                }
              );
              //------------------------------------------------
              connection.query(
                `INSERT INTO products (product_id, sku) VALUES (?, ?) ON DUPLICATE KEY UPDATE product_id = ?, sku = ?`,
                [row[0], row[18], row[0], row[18]],
                function (err) {
                  if (err) throw err;
                }
              );
              break;
            case "HEADSET":
              connection.query(
                `INSERT INTO pd_headset (hs_id, sku, hs_brand, hs_group, hs_model) VALUES (?, ?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE hs_id = ?, sku = ?`,
                [row[0], row[17], row[16], row[11], row[1], row[0], row[17]],
                function (err) {
                  if (err) throw err;
                  console.log(index++ + `. ${row[1]}`);
                }
              );
              //------------------------------------------------
              connection.query(
                `INSERT INTO products (product_id, sku) VALUES (?, ?) ON DUPLICATE KEY UPDATE product_id = ?, sku = ?`,
                [row[0], row[17], row[0], row[17]],
                function (err) {
                  if (err) throw err;
                }
              );
              break;
            case "KB":
              const text1 = row[1].split(" ");
              const a1 = text1[0];
              if (a1 === "KEYBOARD") {
                connection.query(
                  `INSERT INTO pd_kb (kb_id, sku, kb_connect, kb_group, kb_brand, kb_model) VALUES (?, ?, ?, ?, ?, ?) 
                ON DUPLICATE KEY UPDATE kb_id = ?, sku = ?, kb_group = ?`,
                  [
                    row[0],
                    row[18],
                    row[11],
                    row[12],
                    row[17],
                    row[1],

                    row[0],
                    row[18],
                    row[12],
                  ],
                  function (err) {
                    if (err) throw err;
                    console.log(index++ + `. ${row[1]}`);
                  }
                );
              } else if (a1 === "KEYCAP") {
                connection.query(
                  `INSERT INTO pd_keycap (kc_id, sku, kc_group, kc_brand, kc_model) VALUES (?, ?, ?, ?, ?) 
                ON DUPLICATE KEY UPDATE kc_id = ?, sku = ?, kc_group = ?`,
                  [
                    row[0],
                    row[18],
                    row[11],
                    row[17],
                    row[1],

                    row[0],
                    row[18],
                    row[11],
                  ],
                  function (err) {
                    if (err) throw err;
                    console.log(index++ + `. ${row[1]}`);
                  }
                );
              }

              //------------------------------------------------
              connection.query(
                `INSERT INTO products (product_id, sku) VALUES (?, ?) ON DUPLICATE KEY UPDATE product_id = ?, sku = ?`,
                [row[0], row[18], row[0], row[18]],
                function (err) {
                  if (err) throw err;
                }
              );
              break;
            case "CHAIR":
              connection.query(
                `INSERT INTO pd_chair (ch_id, sku, ch_group, ch_brand, ch_model) VALUES (?, ?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE ch_id = ?, sku = ?, ch_group = ?`,
                [
                  row[0],
                  row[17],
                  row[11],
                  row[16],
                  row[1],

                  row[0],
                  row[17],
                  row[11],
                ],
                function (err) {
                  if (err) throw err;
                  console.log(index++ + `. ${row[1]}`);
                }
              );
              //------------------------------------------------
              connection.query(
                `INSERT INTO products (product_id, sku) VALUES (?, ?) ON DUPLICATE KEY UPDATE product_id = ?, sku = ?`,
                [row[0], row[17], row[0], row[17]],
                function (err) {
                  if (err) throw err;
                }
              );
              break;
            case "MOUSE":
              connection.query(
                `INSERT INTO pd_mouse (m_id, sku, m_brand, m_model, m_type) VALUES (?, ?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE m_id = ?, sku = ?`,
                [row[0], row[17], row[16], row[1], row[11], row[0], row[17]],
                function (err) {
                  if (err) throw err;
                  console.log(index++ + `. ${row[1]}`);
                }
              );
              //------------------------------------------------
              connection.query(
                `INSERT INTO products (product_id, sku) VALUES (?, ?) ON DUPLICATE KEY UPDATE product_id = ?, sku = ?`,
                [row[0], row[17], row[0], row[17]],
                function (err) {
                  if (err) throw err;
                }
              );
              break;
            case "M-PAD":
              connection.query(
                `INSERT INTO pd_mousepad (mp_id, sku, mp_brand, mp_model, mp_group, mp_dimentions) VALUES (?, ?, ?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE mp_id = ?, sku = ?, mp_group = ?`,
                [
                  row[0],
                  row[18],
                  row[17],
                  row[1],
                  row[11],
                  row[12],

                  row[0],
                  row[18],
                  row[11],
                ],
                function (err) {
                  if (err) throw err;
                  console.log(index++ + `. ${row[1]}`);
                }
              );
              //------------------------------------------------
              connection.query(
                `INSERT INTO products (product_id, sku) VALUES (?, ?) ON DUPLICATE KEY UPDATE product_id = ?, sku = ?`,
                [row[0], row[18], row[0], row[18]],
                function (err) {
                  if (err) throw err;
                }
              );
              break;
            case "MICE":
              connection.query(
                `INSERT INTO pd_mic (mic_id, sku, mic_brand, mic_model) VALUES (?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE mic_id = ?, sku = ?`,
                [row[0], row[17], row[16], row[1], row[0], row[17]],
                function (err) {
                  if (err) throw err;
                  console.log(index++ + `. ${row[1]}`);
                }
              );
              //------------------------------------------------
              connection.query(
                `INSERT INTO products (product_id, sku) VALUES (?, ?) ON DUPLICATE KEY UPDATE product_id = ?, sku = ?`,
                [row[0], row[17], row[0], row[17]],
                function (err) {
                  if (err) throw err;
                }
              );
              break;
            case "SINK":
              connection.query(
                `INSERT INTO pd_sink (s_id, sku, s_brand, s_model) VALUES (?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE s_id = ?, sku = ?`,
                [row[0], row[18], row[16], row[1], row[0], row[18]],
                function (err) {
                  if (err) throw err;
                  console.log(index++ + `. ${row[1]}`);
                }
              );
              //------------------------------------------------
              connection.query(
                `INSERT INTO products (product_id, sku) VALUES (?, ?) ON DUPLICATE KEY UPDATE product_id = ?, sku = ?`,
                [row[0], row[18], row[0], row[18]],
                function (err) {
                  if (err) throw err;
                }
              );
              break;
            case "HOLDER":
              connection.query(
                `INSERT INTO pd_holder (holder_id, sku, holder_brand, holder_model) VALUES (?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE holder_id = ?, sku = ?`,
                [row[0], row[17], row[16], row[1], row[0], row[17]],
                function (err) {
                  if (err) throw err;
                  console.log(index++ + `. ${row[1]}`);
                }
              );
              //------------------------------------------------
              connection.query(
                `INSERT INTO products (product_id, sku) VALUES (?, ?) ON DUPLICATE KEY UPDATE product_id = ?, sku = ?`,
                [row[0], row[17], row[0], row[17]],
                function (err) {
                  if (err) throw err;
                }
              );
              break;
            default:
              break;
          }
        });
      }
      return "Data inserted into MySQL database";
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 500, message: err });
  }
});

app.get("/monitor", (req, res) => {
  connection.query(
    `SELECT pd.mnt_brand AS mnt_brand, g.mnt_group AS mnt_group, pd.mnt_curve AS mnt_curve, pd.mnt_model AS mnt_model, pd.mnt_panel AS mnt_panel, pd.mnt_size AS mnt_size, pd.mnt_refresh_rate AS mnt_refresh_rate, pd.mnt_resolution AS mnt_resolution, p.product_price, p.product_minprice, pd.mnt_href AS mnt_href, pd.mnt_img AS mnt_img 
    FROM pd_monitor pd 
    LEFT JOIN pd_group g ON g.mnt_group_id = pd.mnt_group 
    LEFT JOIN products p ON p.product_id = pd.mnt_id 
    WHERE p.status="Y" 
		ORDER BY CASE g.mnt_group_id 
		WHEN "001" THEN 1 
		WHEN "002" THEN 2 
		WHEN "003" THEN 3 
		WHEN "004" THEN 4 
		WHEN "005" THEN 5 
		WHEN "006" THEN 6 
		WHEN "008" THEN 7 
		WHEN "009" THEN 8 
		WHEN "010" THEN 9 
		WHEN "016" THEN 10 
		WHEN "011" THEN 11 
		WHEN "012" THEN 12 
		WHEN "013" THEN 13 
		WHEN "017" THEN 14
		WHEN "014" THEN 15 
		WHEN "015" THEN 16 
		END, 
		p.product_minprice ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.get("/monitor_group", (req, res) => {
  connection.query(
    `SELECT * FROM pd_group ORDER BY mnt_group ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.post("/admin_data", jwtValidate, (req, res) => {
  const { t_name, c_name } = req.body;
  connection.query(
    `SELECT p1.*,p2.*,
		SUM(stock_nny+stock_ramintra+stock_bangphlat+stock_thefloat+stock_rangsit+stock_bangsaen+stock_rama2) AS sumstock,i.url AS url_main 
    FROM pd_${t_name} p1 
    LEFT JOIN products p2 ON p2.product_id = p1.${c_name}_id 
    LEFT JOIN (SELECT product_id,url FROM images_product WHERE sort = 0) i ON i.product_id = p1.${c_name}_id
    GROUP BY p1.${c_name}_id, i.url
    ORDER BY p1.${c_name}_brand, p1.${c_name}_model ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.post("/getimages", (req, res) => {
  const { id } = req.body;
  connection.query(
    `SELECT * FROM images_product WHERE product_id = ? ORDER BY sort`,
    [id],
    function (err, results) {
      res.send(results);
    }
  );
});

app.post("/getimagefront", (req, res) => {
  const { t_name } = req.body;
  connection.query(
    `SELECT * FROM images_product WHERE product_id IN (SELECT ${t_name}_id FROM pd_${t_name}) ORDER BY sort ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.get("/new_stock", (req, res) => {
  connection.query(
    `SELECT p2.* 
    FROM products p1 
    LEFT JOIN productitech p2 ON p2.productCode = p1.product_id
    WHERE (p2.stock_nny || p2.stock_ramintra || p2.stock_bangphlat || p2.stock_thefloat || p2.stock_rangsit || p2.stock_bangsaen) > 0 AND p1.status="N" AND p2.productName NOT LIKE "%แถม%" 
    ORDER BY p2.productName`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.put("/edit/:id", (req, res) => {
  const { id } = req.params;
  const { group, brand, model, size, hz, panel, resolution, curve, href } =
    req.body;
  connection.query(
    `UPDATE pd_monitor SET mnt_group = ?, mnt_brand = ?, mnt_model = ?, mnt_size = ?, mnt_refresh_rate = ?, 
    mnt_panel = ?, mnt_resolution = ?, mnt_curve = ?, mnt_href = ? WHERE sku = ?`,
    [group, brand, model, size, hz, panel, resolution, curve, href, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

app.delete("/admin_del/:id", (req, res) => {
  const id = req.params.id;
  connection.query("DELETE FROM pd_monitor WHERE sku = ?", id, (error) => {
    if (error) throw error;
    res.send("Delete Data Successsfully");
  });
});

//----------------- CASE --------------------------------

app.get("/case", (req, res) => {
  connection.query(
    `SELECT * FROM pd_case p1
    LEFT JOIN products p ON p.product_id = p1.case_id 
    WHERE p.status="Y" ORDER BY CASE p1.case_group WHEN "ZONE D" THEN 1 WHEN "ZONE C" THEN 2 WHEN "ZONE A" THEN 3 WHEN "ZONE B" THEN 4 WHEN "ZONE EXPENSIVE" THEN 5 WHEN "ZONE ITX" THEN 6 end, 
    p1.case_brand, p1.case_model, p1.case_color ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.put("/edit_case/:id", (req, res) => {
  const { id } = req.params;
  const { group, brand, model, color, href } = req.body;
  connection.query(
    `UPDATE pd_case SET case_group = ?, case_brand = ?, case_model = ?, case_color = ?, 
     case_href = ? WHERE sku = ?`,
    [group, brand, model, color, href, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

app.delete("/admin_del_case/:id", (req, res) => {
  const id = req.params.id;
  connection.query("DELETE FROM pd_case WHERE sku = ?", id, (error) => {
    if (error) throw error;
    res.send("Delete Data Successsfully");
  });
});

//----------------- NOTEBOOK ----------------

app.get("/nb", (req, res) => {
  connection.query(
    `SELECT * FROM pd_nb p1
    LEFT JOIN products p2 ON p2.product_id = p1.nb_id 
    WHERE p2.status="Y" 
    ORDER BY CASE p1.nb_group WHEN "Gaming" THEN 1 WHEN "Non-gaming" THEN 2 END, p1.nb_brand, p2.product_price ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.put("/edit_nb/:id", (req, res) => {
  const { id } = req.params;
  const { group, brand, model, color, href } = req.body;
  connection.query(
    `UPDATE pd_nb SET nb_group = ?, nb_brand = ?, nb_model = ?, nb_color = ?, 
     nb_href = ? WHERE sku = ?`,
    [group, brand, model, color, href, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

app.delete("/admin_del_nb/:id", (req, res) => {
  const id = req.params.id;
  connection.query("DELETE FROM pd_nb WHERE sku = ?", id, (error) => {
    if (error) throw error;
    res.send("Delete Data Successsfully");
  });
});

//----------------- LIQUID COOLING ----------------

app.get("/lc", (req, res) => {
  connection.query(
    `SELECT * FROM pd_liquid p1 
    LEFT JOIN products p2 ON p2.product_id = p1.lc_id
    WHERE p2.status="Y" ORDER BY p1.lc_group, p2.product_minprice ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.put("/edit_lc/:id", (req, res) => {
  const { id } = req.params;
  const { group, brand, model, color, href } = req.body;
  connection.query(
    `UPDATE pd_liquid SET lc_group = ?, lc_brand = ?, lc_model = ?, lc_color = ?, 
     lc_href = ? WHERE sku = ?`,
    [group, brand, model, color, href, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

app.delete("/admin_del_lc/:id", (req, res) => {
  const id = req.params.id;
  connection.query("DELETE FROM pd_liquid WHERE sku = ?", id, (error) => {
    if (error) throw error;
    res.send("Delete Data Successsfully");
  });
});

//----------------- FAN ----------------

app.get("/fan", (req, res) => {
  connection.query(
    `SELECT * FROM pd_fan p1 
    LEFT JOIN products p2 ON p2.product_id = p1.f_id 
    WHERE p2.status="Y" ORDER BY p1.f_group, p2.product_minprice ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.put("/edit_fan/:id", (req, res) => {
  const { id } = req.params;
  const { group, brand, model, color, href } = req.body;
  connection.query(
    `UPDATE pd_fan SET f_group = ?, f_brand = ?, f_model = ?, f_color = ?, 
     f_href = ? WHERE sku = ?`,
    [group, brand, model, color, href, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

app.delete("/admin_del_fan/:id", (req, res) => {
  const id = req.params.id;
  connection.query("DELETE FROM pd_fan WHERE sku = ?", id, (error) => {
    if (error) throw error;
    res.send("Delete Data Successsfully");
  });
});

//----------------- HEADSET ----------------

app.get("/hs", (req, res) => {
  connection.query(
    `SELECT * FROM pd_headset p1 
    LEFT JOIN products p2 ON p2.product_id = p1.hs_id 
    WHERE p2.status="Y" ORDER BY p1.hs_group, p2.product_minprice ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.put("/edit_hs/:id", (req, res) => {
  const { id } = req.params;
  const { group, brand, model, color, href } = req.body;
  connection.query(
    `UPDATE pd_headset SET hs_group = ?, hs_brand = ?, hs_model = ?, hs_color = ?, 
     hs_href = ? WHERE sku = ?`,
    [group, brand, model, color, href, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

app.delete("/admin_del_hs/:id", (req, res) => {
  const id = req.params.id;
  connection.query("DELETE FROM pd_headset WHERE sku = ?", id, (error) => {
    if (error) throw error;
    res.send("Delete Data Successsfully");
  });
});

//----------------- KEYBOARD ----------------

app.get("/kb", (req, res) => {
  connection.query(
    `SELECT * FROM pd_kb p1 
    LEFT JOIN products p2 ON p2.product_id = p1.kb_id 
    WHERE p2.status="Y" ORDER BY CASE p1.kb_group WHEN "FULL SIZE 100%" THEN 1 WHEN "98%" THEN 2 WHEN "96%" THEN 3 WHEN "TKL 80%" THEN 4 WHEN "75%" THEN 5 WHEN "65%" THEN 6 WHEN "60%" THEN 7 WHEN "NUMPAD" THEN 8 WHEN "BAREBONE/100%" THEN 9 WHEN "BAREBONE/98%" THEN 10 WHEN "BAREBONE/75%" THEN 11 END, 
    p2.product_minprice, p1.kb_brand, p1.kb_model ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.put("/edit_kb/:id", (req, res) => {
  const { id } = req.params;
  const { group, brand, model, sw, color, connect, href } = req.body;
  connection.query(
    `UPDATE pd_kb SET kb_group = ?, kb_brand = ?, kb_model = ?, kb_switch = ?, kb_color = ?, kb_connect = ?, 
     kb_href = ? WHERE sku = ?`,
    [group, brand, model, sw, color, connect, href, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

app.delete("/admin_del_kb/:id", (req, res) => {
  const id = req.params.id;
  connection.query("DELETE FROM pd_kb WHERE sku = ?", id, (error) => {
    if (error) throw error;
    res.send("Delete Data Successsfully");
  });
});

//----------------- KEY CAP ----------------

app.get("/kcap", (req, res) => {
  connection.query(
    `SELECT * FROM pd_keycap p1 
    LEFT JOIN products p2 ON p2.product_id = p1.kc_id 
    WHERE p2.status="Y" ORDER BY CASE p1.kc_group WHEN "KEYCAP SINGLE" THEN 1 WHEN "KEYCAP SET" THEN 2 END, p2.product_minprice ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.put("/edit_kcap/:id", (req, res) => {
  const { id } = req.params;
  const { group, brand, model, color, href } = req.body;
  connection.query(
    `UPDATE pd_keycap SET kc_group = ?, kc_brand = ?, kc_model = ?, kc_color = ?, 
     kc_href = ? WHERE sku = ?`,
    [group, brand, model, color, href, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

app.delete("/admin_del_kcap/:id", (req, res) => {
  const id = req.params.id;
  connection.query("DELETE FROM pd_keycap WHERE sku = ?", id, (error) => {
    if (error) throw error;
    res.send("Delete Data Successsfully");
  });
});

//----------------- CHAIR ----------------

app.get("/ch", (req, res) => {
  connection.query(
    `SELECT * FROM pd_chair p1 
    LEFT JOIN products p2 ON p2.product_id = p1.ch_id 
    WHERE p2.status="Y" ORDER BY p2.product_minprice ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.put("/edit_ch/:id", (req, res) => {
  const { id } = req.params;
  const { group, brand, model, color, href } = req.body;
  connection.query(
    `UPDATE pd_chair SET ch_group = ?, ch_brand = ?, ch_model = ?, ch_color = ?, 
    ch_href = ? WHERE sku = ?`,
    [group, brand, model, color, href, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

app.delete("/admin_del_ch/:id", (req, res) => {
  const id = req.params.id;
  connection.query("DELETE FROM pd_chair WHERE sku = ?", id, (error) => {
    if (error) throw error;
    res.send("Delete Data Successsfully");
  });
});

//----------------- MOUSE ----------------

app.get("/m", (req, res) => {
  connection.query(
    `SELECT * FROM pd_mouse p1 
    LEFT JOIN products p2 ON p2.product_id = p1.m_id 
    WHERE p2.status="Y" ORDER BY p2.product_minprice ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.put("/edit_m/:id", (req, res) => {
  const { id } = req.params;
  const { brand, model, color, type, href } = req.body;
  connection.query(
    `UPDATE pd_mouse SET m_brand = ?, m_model = ?, m_color = ?, m_type = ?, 
     m_href = ? WHERE sku = ?`,
    [brand, model, color, type, href, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

app.delete("/admin_del_m/:id", (req, res) => {
  const id = req.params.id;
  connection.query("DELETE FROM pd_mouse WHERE sku = ?", id, (error) => {
    if (error) throw error;
    res.send("Delete Data Successsfully");
  });
});

//----------------- MOUSE PAD ----------------

app.get("/mp", (req, res) => {
  connection.query(
    `SELECT * FROM pd_mousepad p1 
    LEFT JOIN products p2 ON p2.product_id = p1.mp_id 
    WHERE p2.status="Y" ORDER BY CASE p1.mp_group WHEN "SIZE S" THEN 1 WHEN "SIZE M" THEN 2 WHEN "SIZE XL" THEN 3 WHEN "SIZE XXL" THEN 4 WHEN "MOUSE FEET" THEN 5 END, p2.product_minprice ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.put("/edit_mp/:id", (req, res) => {
  const { id } = req.params;
  const { group, brand, model, color, dimentions, href } = req.body;
  connection.query(
    `UPDATE pd_mousepad SET mp_group = ?, mp_brand = ?, mp_model = ?, mp_color = ?, mp_dimentions = ?, 
     mp_href = ? WHERE sku = ?`,
    [group, brand, model, color, dimentions, href, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

app.delete("/admin_del_mp/:id", (req, res) => {
  const id = req.params.id;
  connection.query("DELETE FROM pd_mousepad WHERE sku = ?", id, (error) => {
    if (error) throw error;
    res.send("Delete Data Successsfully");
  });
});

//----------------- MICE ----------------

app.get("/mic", (req, res) => {
  connection.query(
    `SELECT * FROM pd_mic p1 
    LEFT JOIN products p2 ON p2.product_id = p1.mic_id 
    WHERE p2.status="Y" ORDER BY p2.product_minprice ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.put("/edit_mic/:id", (req, res) => {
  const { id } = req.params;
  const { brand, model, color, href } = req.body;
  connection.query(
    `UPDATE pd_mic SET mic_brand = ?, mic_model = ?, mic_color = ?, 
     mic_href = ? WHERE sku = ?`,
    [brand, model, color, href, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

app.delete("/admin_del_mic/:id", (req, res) => {
  const id = req.params.id;
  connection.query("DELETE FROM pd_mic WHERE sku = ?", id, (error) => {
    if (error) throw error;
    res.send("Delete Data Successsfully");
  });
});

//----------------- SINK ----------------

app.get("/sink", (req, res) => {
  connection.query(
    `SELECT * FROM pd_sink p1 
    LEFT JOIN products p2 ON p2.product_id = p1.s_id
    WHERE p2.status="Y" ORDER BY p1.s_brand, p1.s_model, p2.product_minprice ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.put("/edit_s/:id", (req, res) => {
  const { id } = req.params;
  const { brand, model, color, href } = req.body;
  connection.query(
    `UPDATE pd_sink SET s_brand = ?, s_model = ?, s_color = ?, 
     s_href = ? WHERE sku = ?`,
    [brand, model, color, href, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

app.delete("/admin_del_s/:id", (req, res) => {
  const id = req.params.id;
  connection.query("DELETE FROM pd_sink WHERE sku = ?", id, (error) => {
    if (error) throw error;
    res.send("Delete Data Successsfully");
  });
});

//----------------- HOLDER ----------------

app.get("/holder", (req, res) => {
  connection.query(
    `SELECT * FROM pd_holder p1 
    LEFT JOIN products p2 ON p2.product_id = p1.holder_id
    WHERE p2.status="Y" ORDER BY p1.holder_brand, p1.holder_model, p2.product_minprice ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.put("/edit_holder/:id", (req, res) => {
  const { id } = req.params;
  const { brand, model, href } = req.body;
  connection.query(
    `UPDATE pd_holder SET holder_brand = ?, holder_model = ?, 
    holder_href = ? WHERE sku = ?`,
    [brand, model, href, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

app.delete("/admin_del_holder/:id", (req, res) => {
  const id = req.params.id;
  connection.query("DELETE FROM pd_holder WHERE sku = ?", id, (error) => {
    if (error) throw error;
    res.send("Delete Data Successsfully");
  });
});

app.listen(process.env.PORT || 3000);
