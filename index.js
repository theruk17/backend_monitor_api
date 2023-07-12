const { google } = require("googleapis");
const multer = require("multer");
const path = require("path");
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
require("dotenv").config();

const dir = path.join(__dirname, "uploads");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(dir));

const connection = mysql.createConnection(process.env.DATABASE_URL);

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

app.get("/", (req, res) => {
  res.send("Hello World!");
});

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
];
const range = "A3:Z";

app.get("/getdatasheet", async (req, res) => {
  try {
    const googleSheetClient = await _getGoogleSheetClient();
    const data = await _readGoogleSheet(
      googleSheetClient,
      sheetId,
      tabNames,
      range
    );
    res.send(data);
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
                `INSERT INTO pd_monitor (mnt_id, mnt_brand, mnt_model, mnt_resolution, mnt_size, mnt_panel, mnt_refresh_rate) VALUES (?, ?, ?, ?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE mnt_id = ?, mnt_resolution = ?, mnt_size = ?, mnt_panel = ?, mnt_refresh_rate = ?`,
                [
                  row[0],
                  row[19],
                  row[1],
                  row[15],
                  row[16],
                  row[17],
                  row[18],

                  row[0],
                  row[15],
                  row[16],
                  row[17],
                  row[18],
                ],
                function (err) {
                  if (err) throw err;

                  console.log(index++ + `. ${row[1]}`);
                }
              );
              //------------------------------------------------
              connection.query(
                `INSERT INTO products (product_id, product_price, product_minprice, stock_nny, stock_ramintra, stock_bangphlat, stock_thefloat, stock_rangsit, stock_bangsaen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE product_id = ?, product_price = ?, product_minprice = ?, stock_nny = ?, stock_ramintra = ?, stock_bangphlat = ?, stock_thefloat = ?, stock_rangsit = ?, stock_bangsaen = ?`,
                [
                  row[0],
                  row[11] == ""
                    ? 0
                    : row[11].replace(",", "").replace(".00", ""),
                  row[12] == ""
                    ? 0
                    : row[12].replace(",", "").replace(".00", ""),
                  row[2],
                  row[3],
                  row[4],
                  row[5],
                  row[6],
                  row[7],

                  row[0],
                  row[11] == ""
                    ? 0
                    : row[11].replace(",", "").replace(".00", ""),
                  row[12] == ""
                    ? 0
                    : row[12].replace(",", "").replace(".00", ""),
                  row[2],
                  row[3],
                  row[4],
                  row[5],
                  row[6],
                  row[7],
                ],
                function (err) {
                  if (err) throw err;

                  console.log(index++ + `. ${row[1]}`);
                }
              );
              break;
            case "CASE":
              connection.query(
                `INSERT INTO pd_case (case_id, case_brand, case_model) VALUES (?, ?, ?) 
              ON DUPLICATE KEY UPDATE case_id = ?`,
                [row[0], row[13], row[1], row[0]],
                function (err) {
                  if (err) throw err;
                  console.log(index++ + `. ${row[1]}`);
                }
              );
              //------------------------------------------------
              connection.query(
                `INSERT INTO products (product_id, product_price, product_minprice, stock_nny, stock_ramintra, stock_bangphlat, stock_thefloat, stock_rangsit, stock_bangsaen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE product_id = ?, product_price = ?, product_minprice = ?, stock_nny = ?, stock_ramintra = ?, stock_bangphlat = ?, stock_thefloat = ?, stock_rangsit = ?, stock_bangsaen = ?`,
                [
                  row[0],
                  row[4] == "" ? 0 : row[4].replace(",", "").replace(".00", ""),
                  row[5] == "" ? 0 : row[5].replace(",", "").replace(".00", ""),
                  row[6],
                  row[7],
                  row[8],
                  row[9],
                  row[10],
                  row[11],

                  row[0],
                  row[4] == "" ? 0 : row[4].replace(",", "").replace(".00", ""),
                  row[5] == "" ? 0 : row[5].replace(",", "").replace(".00", ""),
                  row[6],
                  row[7],
                  row[8],
                  row[9],
                  row[10],
                  row[11],
                ],
                function (err) {
                  if (err) throw err;

                  console.log(index++ + `. ${row[1]}`);
                }
              );
              break;
            case "NOTEBOOK":
              connection.query(
                `INSERT INTO pd_nb (nb_id, nb_group, nb_brand, nb_model, nb_cpu, nb_vga, nb_ram, nb_size, nb_hz, nb_storage, nb_os) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE nb_id = ?, nb_group = ?, nb_cpu = ?, nb_vga = ?, nb_ram = ?, nb_size = ?, nb_hz= ?, nb_storage = ?, nb_os = ?`,
                [
                  row[0],
                  row[15],
                  row[24],
                  row[1],
                  row[16],
                  row[17],
                  row[19],
                  row[20],
                  row[21],
                  row[22],
                  row[23],

                  row[0],
                  row[15],
                  row[16],
                  row[17],
                  row[19],
                  row[20],
                  row[21],
                  row[22],
                  row[23],
                ],
                function (err) {
                  if (err) throw err;
                  console.log(index++ + `. ${row[1]}`);
                }
              );
              //------------------------------------------------
              connection.query(
                `INSERT INTO products (product_id, product_price, product_minprice, stock_nny, stock_ramintra, stock_bangphlat, stock_thefloat, stock_rangsit, stock_bangsaen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE product_id = ?, product_price = ?, product_minprice = ?, stock_nny = ?, stock_ramintra = ?, stock_bangphlat = ?, stock_thefloat = ?, stock_rangsit = ?, stock_bangsaen = ?`,
                [
                  row[0],
                  row[11] == ""
                    ? 0
                    : row[11].replace(",", "").replace(".00", ""),
                  row[12] == ""
                    ? 0
                    : row[12].replace(",", "").replace(".00", ""),
                  row[2],
                  row[3],
                  row[4],
                  row[5],
                  row[6],
                  row[7],

                  row[0],
                  row[11] == ""
                    ? 0
                    : row[11].replace(",", "").replace(".00", ""),
                  row[12] == ""
                    ? 0
                    : row[12].replace(",", "").replace(".00", ""),
                  row[2],
                  row[3],
                  row[4],
                  row[5],
                  row[6],
                  row[7],
                ],
                function (err) {
                  if (err) throw err;

                  console.log(index++ + `. ${row[1]}`);
                }
              );
              break;
            case "LCS":
              connection.query(
                `INSERT INTO pd_liquid (lc_id, lc_group, lc_brand, lc_model) VALUES (?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE lc_id = ?, lc_group = ?`,
                [row[0], row[9], row[10], row[1], row[0], row[9]],
                function (err) {
                  if (err) throw err;
                  console.log(index++ + `. ${row[1]}`);
                }
              );
              //------------------------------------------------
              connection.query(
                `INSERT INTO products (product_id, product_price, product_minprice, stock_nny, stock_ramintra, stock_bangphlat, stock_thefloat, stock_rangsit, stock_bangsaen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE product_id = ?, product_price = ?, product_minprice = ?, stock_nny = ?, stock_ramintra = ?, stock_bangphlat = ?, stock_thefloat = ?, stock_rangsit = ?, stock_bangsaen = ?`,
                [
                  row[0],
                  row[13] == ""
                    ? 0
                    : row[13].replace(",", "").replace(".00", ""),
                  row[14] == ""
                    ? 0
                    : row[14].replace(",", "").replace(".00", ""),
                  row[2],
                  row[3],
                  row[4],
                  row[5],
                  row[6],
                  row[7],

                  row[0],
                  row[13] == ""
                    ? 0
                    : row[13].replace(",", "").replace(".00", ""),
                  row[14] == ""
                    ? 0
                    : row[14].replace(",", "").replace(".00", ""),
                  row[2],
                  row[3],
                  row[4],
                  row[5],
                  row[6],
                  row[7],
                ],
                function (err) {
                  if (err) throw err;

                  console.log(index++ + `. ${row[1]}`);
                }
              );
              break;
            case "FAN":
              connection.query(
                `INSERT INTO pd_fan (f_id, f_group, f_brand, f_model, f_color) VALUES (?, ?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE f_id = ?, f_group = ?`,
                [row[0], row[13], row[14], row[1], row[15], row[0], row[13]],
                function (err) {
                  if (err) throw err;
                  console.log(index++ + `. ${row[1]}`);
                }
              );
              //------------------------------------------------
              connection.query(
                `INSERT INTO products (product_id, product_price, product_minprice, stock_nny, stock_ramintra, stock_bangphlat, stock_thefloat, stock_rangsit, stock_bangsaen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE product_id = ?, product_price = ?, product_minprice = ?, stock_nny = ?, stock_ramintra = ?, stock_bangphlat = ?, stock_thefloat = ?, stock_rangsit = ?, stock_bangsaen = ?`,
                [
                  row[0],
                  row[11] == ""
                    ? 0
                    : row[11].replace(",", "").replace(".00", ""),
                  row[12] == ""
                    ? 0
                    : row[12].replace(",", "").replace(".00", ""),
                  row[2],
                  row[3],
                  row[4],
                  row[5],
                  row[6],
                  row[7],

                  row[0],
                  row[11] == ""
                    ? 0
                    : row[11].replace(",", "").replace(".00", ""),
                  row[12] == ""
                    ? 0
                    : row[12].replace(",", "").replace(".00", ""),
                  row[2],
                  row[3],
                  row[4],
                  row[5],
                  row[6],
                  row[7],
                ],
                function (err) {
                  if (err) throw err;

                  console.log(index++ + `. ${row[1]}`);
                }
              );
              break;
            case "HEADSET":
              connection.query(
                `INSERT INTO pd_headset (hs_id, hs_brand, hs_group, hs_model) VALUES (?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE hs_id = ?`,
                [row[0], row[14], row[9], row[1], row[0]],
                function (err) {
                  if (err) throw err;
                  console.log(index++ + `. ${row[1]}`);
                }
              );
              //------------------------------------------------
              connection.query(
                `INSERT INTO products (product_id, product_price, product_minprice, stock_nny, stock_ramintra, stock_bangphlat, stock_thefloat, stock_rangsit, stock_bangsaen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE product_id = ?, product_price = ?, product_minprice = ?, stock_nny = ?, stock_ramintra = ?, stock_bangphlat = ?, stock_thefloat = ?, stock_rangsit = ?, stock_bangsaen = ?`,
                [
                  row[0],
                  row[12] == ""
                    ? 0
                    : row[12].replace(",", "").replace(".00", ""),
                  row[13] == ""
                    ? 0
                    : row[13].replace(",", "").replace(".00", ""),
                  row[2],
                  row[3],
                  row[4],
                  row[5],
                  row[6],
                  row[7],

                  row[0],
                  row[12] == ""
                    ? 0
                    : row[12].replace(",", "").replace(".00", ""),
                  row[13] == ""
                    ? 0
                    : row[13].replace(",", "").replace(".00", ""),
                  row[2],
                  row[3],
                  row[4],
                  row[5],
                  row[6],
                  row[7],
                ],
                function (err) {
                  if (err) throw err;

                  console.log(index++ + `. ${row[1]}`);
                }
              );
              break;
            case "KB":
              connection.query(
                `INSERT INTO pd_kb (kb_id, kb_connect, kb_group, kb_brand, kb_model) VALUES (?, ?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE kb_id = ?, kb_connect = ?, kb_group = ?`,
                [
                  row[0],
                  row[9],
                  row[10],
                  row[15],
                  row[1],

                  row[0],
                  row[9],
                  row[10],
                ],
                function (err) {
                  if (err) throw err;
                  console.log(index++ + `. ${row[1]}`);
                }
              );
              //------------------------------------------------
              connection.query(
                `INSERT INTO products (product_id, product_price, product_minprice, stock_nny, stock_ramintra, stock_bangphlat, stock_thefloat, stock_rangsit, stock_bangsaen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE product_id = ?, product_price = ?, product_minprice = ?, stock_nny = ?, stock_ramintra = ?, stock_bangphlat = ?, stock_thefloat = ?, stock_rangsit = ?, stock_bangsaen = ?`,
                [
                  row[0],
                  row[13] == ""
                    ? 0
                    : row[13].replace(",", "").replace(".00", ""),
                  row[14] == ""
                    ? 0
                    : row[14].replace(",", "").replace(".00", ""),
                  row[2],
                  row[3],
                  row[4],
                  row[5],
                  row[6],
                  row[7],

                  row[0],
                  row[13] == ""
                    ? 0
                    : row[13].replace(",", "").replace(".00", ""),
                  row[14] == ""
                    ? 0
                    : row[14].replace(",", "").replace(".00", ""),
                  row[2],
                  row[3],
                  row[4],
                  row[5],
                  row[6],
                  row[7],
                ],
                function (err) {
                  if (err) throw err;

                  console.log(index++ + `. ${row[1]}`);
                }
              );
              break;
            case "CHAIR":
              connection.query(
                `INSERT INTO pd_chair (ch_id, ch_brand, ch_model) VALUES (?, ?, ?) 
              ON DUPLICATE KEY UPDATE ch_id = ?`,
                [row[0], row[14], row[1], row[0]],
                function (err) {
                  if (err) throw err;
                  console.log(index++ + `. ${row[1]}`);
                }
              );
              //------------------------------------------------
              connection.query(
                `INSERT INTO products (product_id, product_price, product_minprice, stock_nny, stock_ramintra, stock_bangphlat, stock_thefloat, stock_rangsit, stock_bangsaen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE product_id = ?, product_price = ?, product_minprice = ?, stock_nny = ?, stock_ramintra = ?, stock_bangphlat = ?, stock_thefloat = ?, stock_rangsit = ?, stock_bangsaen = ?`,
                [
                  row[0],
                  row[12] == ""
                    ? 0
                    : row[12].replace(",", "").replace(".00", ""),
                  row[13] == ""
                    ? 0
                    : row[13].replace(",", "").replace(".00", ""),
                  row[2],
                  row[3],
                  row[4],
                  row[5],
                  row[6],
                  row[7],

                  row[0],
                  row[12] == ""
                    ? 0
                    : row[12].replace(",", "").replace(".00", ""),
                  row[13] == ""
                    ? 0
                    : row[13].replace(",", "").replace(".00", ""),
                  row[2],
                  row[3],
                  row[4],
                  row[5],
                  row[6],
                  row[7],
                ],
                function (err) {
                  if (err) throw err;

                  console.log(index++ + `. ${row[1]}`);
                }
              );
              break;
            case "MOUSE":
              connection.query(
                `INSERT INTO pd_mouse (m_id, m_brand, m_model, m_type) VALUES (?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE m_id = ?`,
                [row[0], row[15], row[1], row[9], row[0]],
                function (err) {
                  if (err) throw err;
                  console.log(index++ + `. ${row[1]}`);
                }
              );
              //------------------------------------------------
              connection.query(
                `INSERT INTO products (product_id, product_price, product_minprice, stock_nny, stock_ramintra, stock_bangphlat, stock_thefloat, stock_rangsit, stock_bangsaen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE product_id = ?, product_price = ?, product_minprice = ?, stock_nny = ?, stock_ramintra = ?, stock_bangphlat = ?, stock_thefloat = ?, stock_rangsit = ?, stock_bangsaen = ?`,
                [
                  row[0],
                  row[13] == ""
                    ? 0
                    : row[13].replace(",", "").replace(".00", ""),
                  row[14] == ""
                    ? 0
                    : row[14].replace(",", "").replace(".00", ""),
                  row[2],
                  row[3],
                  row[4],
                  row[5],
                  row[6],
                  row[7],

                  row[0],
                  row[13] == ""
                    ? 0
                    : row[13].replace(",", "").replace(".00", ""),
                  row[14] == ""
                    ? 0
                    : row[14].replace(",", "").replace(".00", ""),
                  row[2],
                  row[3],
                  row[4],
                  row[5],
                  row[6],
                  row[7],
                ],
                function (err) {
                  if (err) throw err;

                  console.log(index++ + `. ${row[1]}`);
                }
              );
              break;
            case "M-PAD":
              connection.query(
                `INSERT INTO pd_mousepad (mp_id, mp_brand, mp_model, mp_dimentions) VALUES (?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE mp_id = ?`,
                [row[0], row[15], row[1], row[10], row[0]],
                function (err) {
                  if (err) throw err;
                  console.log(index++ + `. ${row[1]}`);
                }
              );
              //------------------------------------------------
              connection.query(
                `INSERT INTO products (product_id, product_price, product_minprice, stock_nny, stock_ramintra, stock_bangphlat, stock_thefloat, stock_rangsit, stock_bangsaen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE product_id = ?, product_price = ?, product_minprice = ?, stock_nny = ?, stock_ramintra = ?, stock_bangphlat = ?, stock_thefloat = ?, stock_rangsit = ?, stock_bangsaen = ?`,
                [
                  row[0],
                  row[13] == ""
                    ? 0
                    : row[13].replace(",", "").replace(".00", ""),
                  row[14] == ""
                    ? 0
                    : row[14].replace(",", "").replace(".00", ""),
                  row[2],
                  row[3],
                  row[4],
                  row[5],
                  row[6],
                  row[7],

                  row[0],
                  row[13] == ""
                    ? 0
                    : row[13].replace(",", "").replace(".00", ""),
                  row[14] == ""
                    ? 0
                    : row[14].replace(",", "").replace(".00", ""),
                  row[2],
                  row[3],
                  row[4],
                  row[5],
                  row[6],
                  row[7],
                ],
                function (err) {
                  if (err) throw err;

                  console.log(index++ + `. ${row[1]}`);
                }
              );
              break;
            case "MICE":
              connection.query(
                `INSERT INTO pd_mic (mic_id, mic_brand, mic_model) VALUES (?, ?, ?) 
              ON DUPLICATE KEY UPDATE mic_id = ?`,
                [row[0], row[14], row[1], row[0]],
                function (err) {
                  if (err) throw err;
                  console.log(index++ + `. ${row[1]}`);
                }
              );
              //------------------------------------------------
              connection.query(
                `INSERT INTO products (product_id, product_price, product_minprice, stock_nny, stock_ramintra, stock_bangphlat, stock_thefloat, stock_rangsit, stock_bangsaen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE product_id = ?, product_price = ?, product_minprice = ?, stock_nny = ?, stock_ramintra = ?, stock_bangphlat = ?, stock_thefloat = ?, stock_rangsit = ?, stock_bangsaen = ?`,
                [
                  row[0],
                  row[12] == ""
                    ? 0
                    : row[12].replace(",", "").replace(".00", ""),
                  row[13] == ""
                    ? 0
                    : row[13].replace(",", "").replace(".00", ""),
                  row[2],
                  row[3],
                  row[4],
                  row[5],
                  row[6],
                  row[7],

                  row[0],
                  row[12] == ""
                    ? 0
                    : row[12].replace(",", "").replace(".00", ""),
                  row[13] == ""
                    ? 0
                    : row[13].replace(",", "").replace(".00", ""),
                  row[2],
                  row[3],
                  row[4],
                  row[5],
                  row[6],
                  row[7],
                ],
                function (err) {
                  if (err) throw err;

                  console.log(index++ + `. ${row[1]}`);
                }
              );
              break;
            case "SINK":
              connection.query(
                `INSERT INTO pd_sink (s_id, s_brand, s_model) VALUES (?, ?, ?) 
              ON DUPLICATE KEY UPDATE s_id = ?`,
                [row[0], row[14], row[1], row[0]],
                function (err) {
                  if (err) throw err;
                  console.log(index++ + `. ${row[1]}`);
                }
              );
              //------------------------------------------------
              connection.query(
                `INSERT INTO products (product_id, product_price, product_minprice, stock_nny, stock_ramintra, stock_bangphlat, stock_thefloat, stock_rangsit, stock_bangsaen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE product_id = ?, product_price = ?, product_minprice = ?, stock_nny = ?, stock_ramintra = ?, stock_bangphlat = ?, stock_thefloat = ?, stock_rangsit = ?, stock_bangsaen = ?`,
                [
                  row[0],
                  row[11] == ""
                    ? 0
                    : row[11].replace(",", "").replace(".00", ""),
                  row[12] == ""
                    ? 0
                    : row[12].replace(",", "").replace(".00", ""),
                  row[2],
                  row[3],
                  row[4],
                  row[5],
                  row[6],
                  row[7],

                  row[0],
                  row[11] == ""
                    ? 0
                    : row[11].replace(",", "").replace(".00", ""),
                  row[12] == ""
                    ? 0
                    : row[12].replace(",", "").replace(".00", ""),
                  row[2],
                  row[3],
                  row[4],
                  row[5],
                  row[6],
                  row[7],
                ],
                function (err) {
                  if (err) throw err;

                  console.log(index++ + `. ${row[1]}`);
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
    res.status(500).send("Error retrieving data from Google Sheet");
  }
});

app.get("/monitor", (req, res) => {
  connection.query(
    `SELECT pd.mnt_brand AS mnt_brand, g.mnt_group AS mnt_group, pd.mnt_curve AS mnt_curve, pd.mnt_model AS mnt_model, pd.mnt_panel AS mnt_panel, pd.mnt_size AS mnt_size, pd.mnt_refresh_rate AS mnt_refresh_rate, pd.mnt_resolution AS mnt_resolution, p.product_price, p.product_minprice, pd.mnt_href AS mnt_href, pd.mnt_img AS mnt_img 
    FROM pd_monitor pd 
    LEFT JOIN pd_group g ON g.mnt_group_id = pd.mnt_group 
    LEFT JOIN products p ON p.product_id = pd.mnt_id 
    WHERE pd.mnt_status="Y" 
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

app.post("/admin_data", (req, res) => {
  const { t_name, c_name } = req.body;
  connection.query(
    `SELECT *,SUM(stock_nny+stock_ramintra+stock_bangphlat+stock_thefloat+stock_rangsit+stock_bangsaen) AS sumstock 
    FROM pd_${t_name} p1 
    LEFT JOIN products p2 ON p2.product_id = p1.${c_name}_id 
    GROUP BY p1.${c_name}_id ORDER BY p1.${c_name}_brand ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.put("/update_stock_mnt", (req, res) => {
  connection.query(
    "UPDATE pd_monitor SET mnt_status = 'N' WHERE (SELECT SUM(stock_nny+stock_ramintra+stock_bangphlat+stock_thefloat+stock_rangsit+stock_bangsaen) FROM products GROUP BY mnt_id) = 0",
    (err) => {
      if (err) throw err;
      res.send("Stock updated.");
    }
  );
});

app.put("/edit/:id", (req, res) => {
  const { id } = req.params;
  const {
    group,
    brand,
    model,
    size,
    hz,
    panel,
    resolution,
    curve,
    status,
    href,
  } = req.body;
  connection.query(
    `UPDATE pd_monitor SET mnt_group = ?, mnt_brand = ?, mnt_model = ?, mnt_size = ?, mnt_refresh_rate = ?, 
    mnt_panel = ?, mnt_resolution = ?, mnt_curve = ?, mnt_status = ?, mnt_href = ? WHERE mnt_id = ?`,
    [group, brand, model, size, hz, panel, resolution, curve, status, href, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

app.put("/edit_status/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  connection.query(
    `UPDATE pd_monitor SET mnt_status = ? WHERE mnt_id = ?`,
    [status, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

app.delete("/admin_del/:id", (req, res) => {
  const id = req.params.id;
  connection.query("DELETE FROM pd_monitor WHERE mnt_id = ?", id, (error) => {
    if (error) throw error;
    res.send("Delete Data Successsfully");
  });
});

//----------------- CASE

app.get("/case", (req, res) => {
  connection.query(
    `SELECT * FROM pd_case WHERE case_status="Y" ORDER BY CASE case_group WHEN "ZONE iHAVECPU" THEN 1 WHEN "ZONE C" THEN 2 WHEN "ZONE A" THEN 3 WHEN "ZONE B" THEN 4 WHEN "ZONE ITX" THEN 5 end, case_brand, case_model, case_color ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.put("/edit_status_case/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  connection.query(
    `UPDATE pd_case SET case_status = ? WHERE case_id = ?`,
    [status, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

app.put("/edit_case/:id", (req, res) => {
  const { id } = req.params;
  const { group, brand, model, color, status, href } = req.body;
  connection.query(
    `UPDATE pd_case SET case_group = ?, case_brand = ?, case_model = ?, case_color = ?, 
     case_status = ?, case_href = ? WHERE case_id = ?`,
    [group, brand, model, color, status, href, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

app.delete("/admin_del_case/:id", (req, res) => {
  const id = req.params.id;
  connection.query("DELETE FROM pd_case WHERE case_id = ?", id, (error) => {
    if (error) throw error;
    res.send("Delete Data Successsfully");
  });
});

app.put("/update_stock_case", (req, res) => {
  connection.query(
    "UPDATE pd_case SET case_status = 'N' WHERE case_stock_sum = 0",
    (err) => {
      if (err) throw err;
      res.send("Stock updated.");
    }
  );
});

//----------------- NOTEBOOK ----------------

app.get("/nb", (req, res) => {
  connection.query(
    `SELECT * FROM pd_nb p1
    LEFT JOIN products p2 ON p2.product_id = p1.nb_id 
    WHERE p1.nb_status="Y" 
    ORDER BY CASE p1.nb_group WHEN "Gaming" THEN 1 WHEN "Non-gaming" THEN 2 END, p1.nb_brand, p2.product_price ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.put("/edit_nb/:id", (req, res) => {
  const { id } = req.params;
  const { group, brand, model, color, status, href } = req.body;
  connection.query(
    `UPDATE pd_nb SET nb_group = ?, nb_brand = ?, nb_model = ?, nb_color = ?, 
     nb_status = ?, nb_href = ? WHERE nb_id = ?`,
    [group, brand, model, color, status, href, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

app.put("/edit_status_nb/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  connection.query(
    `UPDATE pd_nb SET nb_status = ? WHERE nb_id = ?`,
    [status, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

app.delete("/admin_del_nb/:id", (req, res) => {
  const id = req.params.id;
  connection.query("DELETE FROM pd_nb WHERE nb_id = ?", id, (error) => {
    if (error) throw error;
    res.send("Delete Data Successsfully");
  });
});

app.put("/update_stock_nb", (req, res) => {
  connection.query(
    "UPDATE pd_nb SET nb_status = 'N' WHERE nb_stock_sum = 0",
    (err) => {
      if (err) throw err;
      res.send("Stock updated.");
    }
  );
});

//----------------- LIQUID COOLING ----------------

app.get("/lc", (req, res) => {
  connection.query(
    `SELECT * FROM pd_liquid p1 
    LEFT JOIN products p2 ON p2.product_id = p1.lc_id
    WHERE p1.lc_status="Y" ORDER BY p1.lc_group, p2.product_minprice ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.put("/edit_lc/:id", (req, res) => {
  const { id } = req.params;
  const { group, brand, model, color, status, href } = req.body;
  connection.query(
    `UPDATE pd_liquid SET lc_group = ?, lc_brand = ?, lc_model = ?, lc_color = ?, 
     lc_status = ?, lc_href = ? WHERE lc_id = ?`,
    [group, brand, model, color, status, href, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

app.put("/edit_status_lc/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  connection.query(
    `UPDATE pd_liquid SET lc_status = ? WHERE lc_id = ?`,
    [status, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

app.delete("/admin_del_lc/:id", (req, res) => {
  const id = req.params.id;
  connection.query("DELETE FROM pd_liquid WHERE lc_id = ?", id, (error) => {
    if (error) throw error;
    res.send("Delete Data Successsfully");
  });
});

app.put("/update_stock_lc", (req, res) => {
  connection.query(
    "UPDATE pd_liquid SET lc_status = 'N' WHERE lc_stock_sum = 0",
    (err) => {
      if (err) throw err;
      res.send("Stock updated.");
    }
  );
});

//----------------- FAN ----------------

app.get("/fan", (req, res) => {
  connection.query(
    `SELECT * FROM pd_fan p1 
    LEFT JOIN products p2 ON p2.product_id = p1.f_id 
    WHERE p1.f_status="Y" ORDER BY p1.f_group, p2.product_minprice ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.put("/edit_fan/:id", (req, res) => {
  const { id } = req.params;
  const { group, brand, model, color, status, href } = req.body;
  connection.query(
    `UPDATE pd_fan SET f_group = ?, f_brand = ?, f_model = ?, f_color = ?, 
     f_status = ?, f_href = ? WHERE f_id = ?`,
    [group, brand, model, color, status, href, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

app.put("/edit_status_fan/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  connection.query(
    `UPDATE pd_fan SET f_status = ? WHERE f_id = ?`,
    [status, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

app.delete("/admin_del_fan/:id", (req, res) => {
  const id = req.params.id;
  connection.query("DELETE FROM pd_fan WHERE f_id = ?", id, (error) => {
    if (error) throw error;
    res.send("Delete Data Successsfully");
  });
});

app.put("/update_stock_fan", (req, res) => {
  connection.query(
    "UPDATE pd_fan SET f_status = 'N' WHERE f_stock_sum = 0",
    (err) => {
      if (err) throw err;
      res.send("Stock updated.");
    }
  );
});

//----------------- HEADSET ----------------

app.get("/hs", (req, res) => {
  connection.query(
    `SELECT * FROM pd_headset p1 
    LEFT JOIN products p2 ON p2.product_id = p1.hs_id 
    WHERE p1.hs_status="Y" ORDER BY p1.hs_group, p2.product_minprice ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.put("/edit_hs/:id", (req, res) => {
  const { id } = req.params;
  const { group, brand, model, color, status, href } = req.body;
  connection.query(
    `UPDATE pd_headset SET hs_group = ?, hs_brand = ?, hs_model = ?, hs_color = ?, 
     hs_status = ?, hs_href = ? WHERE hs_id = ?`,
    [group, brand, model, color, status, href, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

app.put("/edit_status_hs/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  connection.query(
    `UPDATE pd_headset SET hs_status = ? WHERE hs_id = ?`,
    [status, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

app.delete("/admin_del_hs/:id", (req, res) => {
  const id = req.params.id;
  connection.query("DELETE FROM pd_headset WHERE hs_id = ?", id, (error) => {
    if (error) throw error;
    res.send("Delete Data Successsfully");
  });
});

app.put("/update_stock_hs", (req, res) => {
  connection.query(
    "UPDATE pd_headset SET hs_status = 'N' WHERE hs_stock_sum = 0",
    (err) => {
      if (err) throw err;
      res.send("Stock updated.");
    }
  );
});

//----------------- KEYBOARD ----------------

app.get("/kb", (req, res) => {
  connection.query(
    `SELECT * FROM pd_kb p1 
    LEFT JOIN products p2 ON p2.product_id = p1.kb_id 
    WHERE p1.kb_status="Y" ORDER BY CASE p1.kb_group WHEN "FULL SIZE 100%" THEN 1 WHEN "98%" THEN 2 WHEN "96%" THEN 3 WHEN "TKL 80%" THEN 4 WHEN "75%" THEN 5 WHEN "65%" THEN 6 WHEN "60%" THEN 7 WHEN "NUMPAD" THEN 8 WHEN "BAREBONE/100%" THEN 9 WHEN "BAREBONE/98%" THEN 10 WHEN "BAREBONE/75%" THEN 11 END, p2.product_minprice ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.put("/edit_kb/:id", (req, res) => {
  const { id } = req.params;
  const { group, brand, model, sw, color, connect, status, href } = req.body;
  connection.query(
    `UPDATE pd_kb SET kb_group = ?, kb_brand = ?, kb_model = ?, kb_switch = ?, kb_color = ?, kb_connect = ?, 
     kb_status = ?, kb_href = ? WHERE kb_id = ?`,
    [group, brand, model, sw, color, connect, status, href, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

app.put("/edit_status_kb/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  connection.query(
    `UPDATE pd_kb SET kb_status = ? WHERE kb_id = ?`,
    [status, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

app.delete("/admin_del_kb/:id", (req, res) => {
  const id = req.params.id;
  connection.query("DELETE FROM pd_kb WHERE kb_id = ?", id, (error) => {
    if (error) throw error;
    res.send("Delete Data Successsfully");
  });
});

app.put("/update_stock_kb", (req, res) => {
  connection.query(
    "UPDATE pd_kb SET kb_status = 'N' WHERE kb_stock_sum = 0",
    (err) => {
      if (err) throw err;
      res.send("Stock updated.");
    }
  );
});

//----------------- CHAIR ----------------

app.get("/ch", (req, res) => {
  connection.query(
    `SELECT * FROM pd_chair p1 
    LEFT JOIN products p2 ON p2.product_id = p1.ch_id 
    WHERE p1.ch_status="Y" ORDER BY p2.product_minprice ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.put("/edit_ch/:id", (req, res) => {
  const { id } = req.params;
  const { brand, model, color, status, href } = req.body;
  connection.query(
    `UPDATE pd_chair SET ch_brand = ?, ch_model = ?, ch_color = ?, 
     ch_status = ?, ch_href = ? WHERE ch_id = ?`,
    [brand, model, color, status, href, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

app.put("/edit_status_ch/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  connection.query(
    `UPDATE pd_chair SET ch_status = ? WHERE ch_id = ?`,
    [status, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

app.delete("/admin_del_ch/:id", (req, res) => {
  const id = req.params.id;
  connection.query("DELETE FROM pd_chair WHERE ch_id = ?", id, (error) => {
    if (error) throw error;
    res.send("Delete Data Successsfully");
  });
});

app.put("/update_stock_ch", (req, res) => {
  connection.query(
    "UPDATE pd_chair SET ch_status = 'N' WHERE ch_stock_sum = 0",
    (err) => {
      if (err) throw err;
      res.send("Stock updated.");
    }
  );
});

//----------------- MOUSE ----------------

app.get("/m", (req, res) => {
  connection.query(
    `SELECT * FROM pd_mouse p1 
    LEFT JOIN products p2 ON p2.product_id = p1.m_id 
    WHERE p1.m_status="Y" ORDER BY p2.product_minprice ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.put("/edit_m/:id", (req, res) => {
  const { id } = req.params;
  const { brand, model, color, type, status, href } = req.body;
  connection.query(
    `UPDATE pd_mouse SET m_brand = ?, m_model = ?, m_color = ?, m_type = ?, 
     m_status = ?, m_href = ? WHERE m_id = ?`,
    [brand, model, color, type, status, href, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

app.put("/edit_status_m/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  connection.query(
    `UPDATE pd_mouse SET m_status = ? WHERE m_id = ?`,
    [status, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

app.delete("/admin_del_m/:id", (req, res) => {
  const id = req.params.id;
  connection.query("DELETE FROM pd_mouse WHERE m_id = ?", id, (error) => {
    if (error) throw error;
    res.send("Delete Data Successsfully");
  });
});

app.put("/update_stock_m", (req, res) => {
  connection.query(
    "UPDATE pd_mouse SET m_status = 'N' WHERE m_stock_sum = 0",
    (err) => {
      if (err) throw err;
      res.send("Stock updated.");
    }
  );
});

//----------------- MOUSE PAD ----------------

app.get("/mp", (req, res) => {
  connection.query(
    `SELECT * FROM pd_mousepad p1 
    LEFT JOIN products p2 ON p2.product_id = p1.mp_id 
    WHERE p1.mp_status="Y" ORDER BY p2.product_minprice ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.put("/edit_mp/:id", (req, res) => {
  const { id } = req.params;
  const { group, brand, model, color, dimentions, status, href } = req.body;
  connection.query(
    `UPDATE pd_mousepad SET mp_group = ?, mp_brand = ?, mp_model = ?, mp_color = ?, mp_dimentions = ?, 
     mp_status = ?, mp_href = ? WHERE mp_id = ?`,
    [group, brand, model, color, dimentions, status, href, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

app.put("/edit_status_mp/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  connection.query(
    `UPDATE pd_mousepad SET mp_status = ? WHERE mp_id = ?`,
    [status, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

app.delete("/admin_del_mp/:id", (req, res) => {
  const id = req.params.id;
  connection.query("DELETE FROM pd_mousepad WHERE mp_id = ?", id, (error) => {
    if (error) throw error;
    res.send("Delete Data Successsfully");
  });
});

app.put("/update_stock_mp", (req, res) => {
  connection.query(
    "UPDATE pd_mousepad SET mp_status = 'N' WHERE mp_stock_sum = 0",
    (err) => {
      if (err) throw err;
      res.send("Stock updated.");
    }
  );
});

//----------------- MICE ----------------

app.get("/mic", (req, res) => {
  connection.query(
    `SELECT * FROM pd_mic p1 
    LEFT JOIN products p2 ON p2.product_id = p1.mic_id 
    WHERE p1.mic_status="Y" ORDER BY p2.product_minprice ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.put("/edit_mic/:id", (req, res) => {
  const { id } = req.params;
  const { brand, model, color, status, href } = req.body;
  connection.query(
    `UPDATE pd_mic SET mic_brand = ?, mic_model = ?, mic_color = ?, 
     mic_status = ?, mic_href = ? WHERE mic_id = ?`,
    [brand, model, color, status, href, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

app.put("/edit_status_mic/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  connection.query(
    `UPDATE pd_mic SET mic_status = ? WHERE mic_id = ?`,
    [status, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

app.delete("/admin_del_mic/:id", (req, res) => {
  const id = req.params.id;
  connection.query("DELETE FROM pd_mic WHERE mic_id = ?", id, (error) => {
    if (error) throw error;
    res.send("Delete Data Successsfully");
  });
});

app.put("/update_stock_mic", (req, res) => {
  connection.query(
    "UPDATE pd_mic SET mic_status = 'N' WHERE mic_stock_sum = 0",
    (err) => {
      if (err) throw err;
      res.send("Stock updated.");
    }
  );
});

//----------------- SINK ----------------

app.get("/sink", (req, res) => {
  connection.query(
    `SELECT * FROM pd_sink p1 
    LEFT JOIN products p2 ON p2.product_id = p1.s_id
    WHERE p1.s_status="Y" ORDER BY p2.product_minprice ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.put("/edit_s/:id", (req, res) => {
  const { id } = req.params;
  const { brand, model, color, status, href } = req.body;
  connection.query(
    `UPDATE pd_sink SET s_brand = ?, s_model = ?, s_color = ?, 
     s_status = ?, s_href = ? WHERE s_id = ?`,
    [brand, model, color, status, href, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

app.put("/edit_status_s/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  connection.query(
    `UPDATE pd_sink SET s_status = ? WHERE s_id = ?`,
    [status, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

app.delete("/admin_del_s/:id", (req, res) => {
  const id = req.params.id;
  connection.query("DELETE FROM pd_sink WHERE s_id = ?", id, (error) => {
    if (error) throw error;
    res.send("Delete Data Successsfully");
  });
});

app.put("/update_stock_s", (req, res) => {
  connection.query(
    "UPDATE pd_sink SET s_status = 'N' WHERE s_stock_sum = 0",
    (err) => {
      if (err) throw err;
      res.send("Stock updated.");
    }
  );
});

app.listen(process.env.PORT || 3000);
