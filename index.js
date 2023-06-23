const { google } = require("googleapis");
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
require("dotenv").config();
const app = express();

app.use(cors());
app.use(express.json());

const connection = mysql.createConnection(process.env.DATABASE_URL);

app.get("/", (req, res) => {
  res.send("Hello World!");
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
                `INSERT INTO pd_monitor (mnt_id, mnt_brand, mnt_model, mnt_resolution, mnt_size, mnt_panel, mnt_refresh_rate, mnt_price_srp, mnt_price_w_com, mnt_stock_nny, mnt_stock_ramintra, mnt_stock_bangphlat, mnt_stock_thefloat, mnt_stock_rangsit, mnt_stock_sum) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE mnt_id = ?, mnt_size = ?, mnt_panel = ?, mnt_refresh_rate = ?, mnt_price_srp = ?, mnt_price_w_com = ?, mnt_stock_nny = ?, mnt_stock_ramintra = ?, mnt_stock_bangphlat = ?, mnt_stock_thefloat = ?, mnt_stock_rangsit = ?, mnt_stock_sum = ?`,
                [
                  row[0],
                  row[18],
                  row[1],
                  row[14],
                  row[15],
                  row[16],
                  row[17],
                  row[10] == ""
                    ? 0
                    : row[10].replace(",", "").replace(".00", ""),
                  row[11] == ""
                    ? 0
                    : row[11].replace(",", "").replace(".00", ""),
                  row[2],
                  row[3],
                  row[4],
                  row[5],
                  row[6],
                  row[7],
                  row[0],
                  row[15],
                  row[16],
                  row[17],
                  row[10] == ""
                    ? 0
                    : row[10].replace(",", "").replace(".00", ""),
                  row[11] == ""
                    ? 0
                    : row[11].replace(",", "").replace(".00", ""),
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
                `INSERT INTO pd_case (case_id, case_brand, case_model, case_price_srp, case_stock_nny, case_stock_ramintra, case_stock_bangphlat, case_stock_thefloat, case_stock_rangsit, case_stock_sum) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE case_id = ?, case_price_srp = ?, case_stock_nny = ?, case_stock_ramintra = ?, case_stock_bangphlat = ?, case_stock_thefloat = ?, case_stock_rangsit = ?, case_stock_sum = ?`,
                [
                  row[0],
                  row[12],
                  row[1],
                  row[4] == "" ? 0 : row[4].replace(",", "").replace(".00", ""),
                  row[6],
                  row[7],
                  row[8],
                  row[9],
                  row[10],
                  row[11],
                  row[0],
                  row[4] == "" ? 0 : row[4].replace(",", "").replace(".00", ""),
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
                `INSERT INTO pd_nb (nb_id, nb_group, nb_brand, nb_model, nb_cpu, nb_vga, nb_ram, nb_size, nb_hz, nb_storage, nb_os, nb_price_srp, nb_dis_price, nb_stock_nny, nb_stock_ramintra, nb_stock_bangphlat, nb_stock_thefloat, nb_stock_rangsit, nb_stock_sum) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE nb_id = ?, nb_group = ?, nb_cpu = ?, nb_vga = ?, nb_ram = ?, nb_size = ?, nb_hz= ?, nb_storage = ?, nb_os = ?, nb_price_srp = ?, nb_dis_price = ?, nb_stock_nny = ?, nb_stock_ramintra = ?, nb_stock_bangphlat = ?, nb_stock_thefloat = ?, nb_stock_rangsit = ?, nb_stock_sum = ?`,
                [
                  row[0],
                  row[14],
                  row[23],
                  row[1],
                  row[15],
                  row[16],
                  row[18],
                  row[19],
                  row[20],
                  row[21],
                  row[22],
                  row[10] == ""
                    ? 0
                    : row[10].replace(",", "").replace(".00", ""),
                  row[11] == ""
                    ? 0
                    : row[11].replace(",", "").replace(".00", ""),
                  row[2],
                  row[3],
                  row[4],
                  row[5],
                  row[6],
                  row[7],
                  row[0],
                  row[14],
                  row[15],
                  row[16],
                  row[18],
                  row[19],
                  row[20],
                  row[21],
                  row[22],
                  row[10] == ""
                    ? 0
                    : row[10].replace(",", "").replace(".00", ""),
                  row[11] == ""
                    ? 0
                    : row[11].replace(",", "").replace(".00", ""),
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
                `INSERT INTO pd_liquid (lc_id, lc_group, lc_brand, lc_model, lc_price_srp, lc_discount, lc_stock_nny, lc_stock_ramintra, lc_stock_bangphlat, lc_stock_thefloat, lc_stock_rangsit, lc_stock_sum) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE lc_id = ?, lc_group = ?, lc_price_srp = ?, lc_discount = ?, lc_stock_nny = ?, lc_stock_ramintra = ?, lc_stock_bangphlat = ?, lc_stock_thefloat = ?, lc_stock_rangsit = ?, lc_stock_sum = ?`,
                [
                  row[0],
                  row[8],
                  row[9],
                  row[1],
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
                  row[8],
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
            case "FAN":
              connection.query(
                `INSERT INTO pd_fan (f_id, f_group, f_brand, f_model, f_color, f_price_srp, f_discount, f_stock_nny, f_stock_ramintra, f_stock_bangphlat, f_stock_thefloat, f_stock_rangsit, f_stock_sum) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE f_id = ?, f_group = ?, f_price_srp = ?, f_discount = ?, f_stock_nny = ?, f_stock_ramintra = ?, f_stock_bangphlat = ?, f_stock_thefloat = ?, f_stock_rangsit = ?, f_stock_sum = ?`,
                [
                  row[0],
                  row[12],
                  row[13],
                  row[1],
                  row[14],
                  row[10] == ""
                    ? 0
                    : row[10].replace(",", "").replace(".00", ""),
                  row[11] == ""
                    ? 0
                    : row[11].replace(",", "").replace(".00", ""),
                  row[2],
                  row[3],
                  row[4],
                  row[5],
                  row[6],
                  row[7],
                  row[0],
                  row[12],
                  row[10] == ""
                    ? 0
                    : row[10].replace(",", "").replace(".00", ""),
                  row[11] == ""
                    ? 0
                    : row[11].replace(",", "").replace(".00", ""),
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
                `INSERT INTO pd_headset (hs_id, hs_brand, hs_group, hs_model, hs_price_srp, hs_discount, hs_stock_nny, hs_stock_ramintra, hs_stock_bangphlat, hs_stock_thefloat, hs_stock_rangsit, hs_stock_sum) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE hs_id = ?, hs_price_srp = ?, hs_discount = ?, hs_stock_nny = ?, hs_stock_ramintra = ?, hs_stock_bangphlat = ?, hs_stock_thefloat = ?, hs_stock_rangsit = ?, hs_stock_sum = ?`,
                [
                  row[0],
                  row[13],
                  row[8],
                  row[1],
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
            case "KB":
              connection.query(
                `INSERT INTO pd_kb (kb_id, kb_connect, kb_group, kb_brand, kb_model, kb_price_srp, kb_discount, kb_stock_nny, kb_stock_ramintra, kb_stock_bangphlat, kb_stock_thefloat, kb_stock_rangsit, kb_stock_sum) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE kb_id = ?, kb_connect = ?, kb_group = ?, kb_price_srp = ?, kb_discount = ?, kb_stock_nny = ?, kb_stock_ramintra = ?, kb_stock_bangphlat = ?, kb_stock_thefloat = ?, kb_stock_rangsit = ?, kb_stock_sum = ?`,
                [
                  row[0],
                  row[8],
                  row[9],
                  row[14],
                  row[1],
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
                  row[8],
                  row[9],
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
            case "CHAIR":
              connection.query(
                `INSERT INTO pd_chair (ch_id, ch_brand, ch_model, ch_price_srp, ch_discount, ch_stock_nny, ch_stock_ramintra, ch_stock_bangphlat, ch_stock_thefloat, ch_stock_rangsit, ch_stock_sum) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE ch_id = ?, ch_price_srp = ?, ch_discount = ?, ch_stock_nny = ?, ch_stock_ramintra = ?, ch_stock_bangphlat = ?, ch_stock_thefloat = ?, ch_stock_rangsit = ?, ch_stock_sum = ?`,
                [
                  row[0],
                  row[13],
                  row[1],
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
            case "MOUSE":
              connection.query(
                `INSERT INTO pd_mouse (m_id, m_brand, m_model, m_type, m_price_srp, m_discount, m_stock_nny, m_stock_ramintra, m_stock_bangphlat, m_stock_thefloat, m_stock_rangsit, m_stock_sum) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE m_id = ?, m_price_srp = ?, m_discount = ?, m_stock_nny = ?, m_stock_ramintra = ?, m_stock_bangphlat = ?, m_stock_thefloat = ?, m_stock_rangsit = ?, m_stock_sum = ?`,
                [
                  row[0],
                  row[14],
                  row[1],
                  row[8],
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
            case "M-PAD":
              connection.query(
                `INSERT INTO pd_mousepad (mp_id, mp_brand, mp_model, mp_dimentions, mp_price_srp, mp_discount, mp_stock_nny, mp_stock_ramintra, mp_stock_bangphlat, mp_stock_thefloat, mp_stock_rangsit, mp_stock_sum) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE mp_id = ?, mp_price_srp = ?, mp_discount = ?, mp_stock_nny = ?, mp_stock_ramintra = ?, mp_stock_bangphlat = ?, mp_stock_thefloat = ?, mp_stock_rangsit = ?, mp_stock_sum = ?`,
                [
                  row[0],
                  row[14],
                  row[1],
                  row[9],
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
            case "MICE":
              connection.query(
                `INSERT INTO pd_mic (mic_id, mic_brand, mic_model, mic_price_srp, mic_discount, mic_stock_nny, mic_stock_ramintra, mic_stock_bangphlat, mic_stock_thefloat, mic_stock_rangsit, mic_stock_sum) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE mic_id = ?, mic_price_srp = ?, mic_discount = ?, mic_stock_nny = ?, mic_stock_ramintra = ?, mic_stock_bangphlat = ?, mic_stock_thefloat = ?, mic_stock_rangsit = ?, mic_stock_sum = ?`,
                [
                  row[0],
                  row[13],
                  row[1],
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
            case "SINK":
              connection.query(
                `INSERT INTO pd_sink (s_id, s_brand, s_model, s_price_srp, s_discount, s_stock_nny, s_stock_ramintra, s_stock_bangphlat, s_stock_thefloat, s_stock_rangsit, s_stock_sum) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE s_id = ?, s_price_srp = ?, s_discount = ?, s_stock_nny = ?, s_stock_ramintra = ?, s_stock_bangphlat = ?, s_stock_thefloat = ?, s_stock_rangsit = ?, s_stock_sum = ?`,
                [
                  row[0],
                  row[13],
                  row[1],
                  row[10] == ""
                    ? 0
                    : row[10].replace(",", "").replace(".00", ""),
                  row[11] == ""
                    ? 0
                    : row[11].replace(",", "").replace(".00", ""),
                  row[2],
                  row[3],
                  row[4],
                  row[5],
                  row[6],
                  row[7],
                  row[0],
                  row[10] == ""
                    ? 0
                    : row[10].replace(",", "").replace(".00", ""),
                  row[11] == ""
                    ? 0
                    : row[11].replace(",", "").replace(".00", ""),
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
    `SELECT pd.mnt_brand AS mnt_brand, g.mnt_group AS mnt_group, pd.mnt_curve AS mnt_curve, pd.mnt_model AS mnt_model, pd.mnt_panel AS mnt_panel, pd.mnt_size AS mnt_size, pd.mnt_refresh_rate AS mnt_refresh_rate, pd.mnt_resolution AS mnt_resolution, pd.mnt_price_srp AS mnt_price_srp, pd.mnt_price_w_com AS mnt_price_w_com, pd.mnt_href AS mnt_href, pd.mnt_img AS mnt_img 
    FROM pd_monitor pd LEFT JOIN pd_group g ON g.mnt_group_id = pd.mnt_group 
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
		pd.mnt_price_w_com ASC`,
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

app.get("/admin_data", (req, res) => {
  connection.query(
    `SELECT * FROM pd_monitor ORDER BY mnt_brand ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.put("/update_stock_mnt", (req, res) => {
  connection.query(
    "UPDATE pd_monitor SET mnt_status = 'N' WHERE mnt_stock_sum = 0",
    (err) => {
      if (err) throw err;
      res.send("Stock updated.");
    }
  );
});

app.get("/edit_data/:id", (req, res) => {
  const { id } = req.params;
  connection.query(
    "SELECT * FROM pd_monitor WHERE mnt_id = ?",
    [id],
    function (err, results) {
      res.send(results);
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
    price_srp,
    price_w_com,
  } = req.body;
  connection.query(
    `UPDATE pd_monitor SET mnt_group = ?, mnt_brand = ?, mnt_model = ?, mnt_size = ?, mnt_refresh_rate = ?, 
    mnt_panel = ?, mnt_resolution = ?, mnt_curve = ?, mnt_status = ?, mnt_href = ?, mnt_price_srp = ?, mnt_price_w_com = ? WHERE mnt_id = ?`,
    [
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
      price_srp,
      price_w_com,
      id,
    ],
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

app.put("/update_img_mnt/:id", (req, res) => {
  const { id } = req.params;
  const { imageUrl } = req.body;
  connection.query(
    `UPDATE pd_monitor SET mnt_img = ? WHERE mnt_id = ?`,
    [imageUrl, id],
    (err) => {
      if (err) throw err;
      res.send("Image uploaded successfully!");
    }
  );
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

app.get("/admin_data_case", (req, res) => {
  connection.query(
    `SELECT * FROM pd_case ORDER BY case_brand,case_model,case_color ASC`,
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
  const { group, brand, model, color, status, href, price_srp } = req.body;
  connection.query(
    `UPDATE pd_case SET case_group = ?, case_brand = ?, case_model = ?, case_color = ?, 
     case_status = ?, case_href = ?, case_price_srp = ? WHERE case_id = ?`,
    [group, brand, model, color, status, href, price_srp, id],
    (err) => {
      if (err) throw err;
      res.send("Data updated successsfully");
    }
  );
});

app.put("/update_img_case/:id", (req, res) => {
  const { id } = req.params;
  const { imageUrl } = req.body;
  connection.query(
    `UPDATE pd_case SET case_img = ? WHERE case_id = ?`,
    [imageUrl, id],
    (err) => {
      if (err) throw err;
      res.send("Image uploaded successfully!");
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
    `SELECT * FROM pd_nb WHERE nb_status="Y" ORDER BY CASE nb_group WHEN "Gaming" THEN 1 WHEN "Non-gaming" THEN 2 END, nb_brand, nb_price_srp ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.get("/admin_data_nb", (req, res) => {
  connection.query(
    `SELECT * FROM pd_nb ORDER BY nb_brand ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.put("/edit_nb/:id", (req, res) => {
  const { id } = req.params;
  const { group, brand, model, color, status, href, price_srp, dis_price } =
    req.body;
  connection.query(
    `UPDATE pd_nb SET nb_group = ?, nb_brand = ?, nb_model = ?, nb_color = ?, 
     nb_status = ?, nb_href = ?, nb_price_srp = ?, nb_dis_price = ? WHERE nb_id = ?`,
    [group, brand, model, color, status, href, price_srp, dis_price, id],
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

app.put("/update_img_nb/:id", (req, res) => {
  const { id } = req.params;
  const { imageUrl } = req.body;
  connection.query(
    `UPDATE pd_nb SET nb_img = ? WHERE nb_id = ?`,
    [imageUrl, id],
    (err) => {
      if (err) throw err;
      res.send("Image uploaded successfully!");
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
    `SELECT * FROM pd_liquid WHERE lc_status="Y" ORDER BY lc_group, lc_discount ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.get("/admin_data_lc", (req, res) => {
  connection.query(
    `SELECT * FROM pd_liquid ORDER BY lc_brand ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.put("/edit_lc/:id", (req, res) => {
  const { id } = req.params;
  const { group, brand, model, color, status, href, price_srp, discount } =
    req.body;
  connection.query(
    `UPDATE pd_liquid SET lc_group = ?, lc_brand = ?, lc_model = ?, lc_color = ?, 
     lc_status = ?, lc_href = ?, lc_price_srp = ?, lc_discount = ? WHERE lc_id = ?`,
    [group, brand, model, color, status, href, price_srp, discount, id],
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

app.put("/update_img_lc/:id", (req, res) => {
  const { id } = req.params;
  const { imageUrl } = req.body;
  connection.query(
    `UPDATE pd_liquid SET lc_img = ? WHERE lc_id = ?`,
    [imageUrl, id],
    (err) => {
      if (err) throw err;
      res.send("Image uploaded successfully!");
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
    `SELECT * FROM pd_fan WHERE f_status="Y" ORDER BY f_group, f_discount ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.get("/admin_data_fan", (req, res) => {
  connection.query(
    `SELECT * FROM pd_fan ORDER BY f_brand ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.put("/edit_fan/:id", (req, res) => {
  const { id } = req.params;
  const { group, brand, model, color, status, href, price_srp, discount } =
    req.body;
  connection.query(
    `UPDATE pd_fan SET f_group = ?, f_brand = ?, f_model = ?, f_color = ?, 
     f_status = ?, f_href = ?, f_price_srp = ?, f_discount = ? WHERE f_id = ?`,
    [group, brand, model, color, status, href, price_srp, discount, id],
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

app.put("/update_img_fan/:id", (req, res) => {
  const { id } = req.params;
  const { imageUrl } = req.body;
  connection.query(
    `UPDATE pd_fan SET f_img = ? WHERE f_id = ?`,
    [imageUrl, id],
    (err) => {
      if (err) throw err;
      res.send("Image uploaded successfully!");
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

app.put("/update_img_hs/:id", (req, res) => {
  const { id } = req.params;
  const { imageUrl } = req.body;
  connection.query(
    `UPDATE pd_headset SET hs_img = ? WHERE hs_id = ?`,
    [imageUrl, id],
    (err) => {
      if (err) throw err;
      res.send("Image uploaded successfully!");
    }
  );
});

app.get("/hs", (req, res) => {
  connection.query(
    `SELECT * FROM pd_headset WHERE hs_status="Y" ORDER BY hs_group, hs_discount ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.get("/admin_data_hs", (req, res) => {
  connection.query(
    `SELECT * FROM pd_headset ORDER BY hs_brand ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.put("/edit_hs/:id", (req, res) => {
  const { id } = req.params;
  const { group, brand, model, color, status, href, price_srp, discount } =
    req.body;
  connection.query(
    `UPDATE pd_headset SET hs_group = ?, hs_brand = ?, hs_model = ?, hs_color = ?, 
     hs_status = ?, hs_href = ?, hs_price_srp = ?, hs_discount = ? WHERE hs_id = ?`,
    [group, brand, model, color, status, href, price_srp, discount, id],
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

app.put("/update_img_kb/:id", (req, res) => {
  const { id } = req.params;
  const { imageUrl } = req.body;
  connection.query(
    `UPDATE pd_kb SET kb_img = ? WHERE kb_id = ?`,
    [imageUrl, id],
    (err) => {
      if (err) throw err;
      res.send("Image uploaded successfully!");
    }
  );
});

app.get("/kb", (req, res) => {
  connection.query(
    `SELECT * FROM pd_kb WHERE kb_status="Y" ORDER BY CASE kb_group WHEN "FULL SIZE 100%" THEN 1 WHEN "98%" THEN 2 WHEN "96%" THEN 3 WHEN "TKL 80%" THEN 4 WHEN "75%" THEN 5 WHEN "65%" THEN 6 WHEN "60%" THEN 7 WHEN "NUMPAD" THEN 8 WHEN "BAREBONE/100%" THEN 9 WHEN "BAREBONE/98%" THEN 10 WHEN "BAREBONE/75%" THEN 11 END, kb_discount ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.get("/admin_data_kb", (req, res) => {
  connection.query(
    `SELECT * FROM pd_kb ORDER BY kb_brand, kb_model ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.put("/edit_kb/:id", (req, res) => {
  const { id } = req.params;
  const {
    group,
    brand,
    model,
    sw,
    color,
    connect,
    status,
    href,
    price_srp,
    discount,
  } = req.body;
  connection.query(
    `UPDATE pd_kb SET kb_group = ?, kb_brand = ?, kb_model = ?, kb_switch = ?, kb_color = ?, kb_connect = ?, 
     kb_status = ?, kb_href = ?, kb_price_srp = ?, kb_discount = ? WHERE kb_id = ?`,
    [
      group,
      brand,
      model,
      sw,
      color,
      connect,
      status,
      href,
      price_srp,
      discount,
      id,
    ],
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

app.put("/update_img_ch/:id", (req, res) => {
  const { id } = req.params;
  const { imageUrl } = req.body;
  connection.query(
    `UPDATE pd_chair SET ch_img = ? WHERE ch_id = ?`,
    [imageUrl, id],
    (err) => {
      if (err) throw err;
      res.send("Image uploaded successfully!");
    }
  );
});

app.get("/ch", (req, res) => {
  connection.query(
    `SELECT * FROM pd_chair WHERE ch_status="Y" ORDER BY ch_discount ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.get("/admin_data_ch", (req, res) => {
  connection.query(
    `SELECT * FROM pd_chair ORDER BY ch_brand, ch_model ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.put("/edit_ch/:id", (req, res) => {
  const { id } = req.params;
  const { brand, model, color, status, href, price_srp, discount } = req.body;
  connection.query(
    `UPDATE pd_chair SET ch_brand = ?, ch_model = ?, ch_color = ?, 
     ch_status = ?, ch_href = ?, ch_price_srp = ?, ch_discount = ? WHERE ch_id = ?`,
    [brand, model, color, status, href, price_srp, discount, id],
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

app.put("/update_img_m/:id", (req, res) => {
  const { id } = req.params;
  const { imageUrl } = req.body;
  connection.query(
    `UPDATE pd_mouse SET m_img = ? WHERE m_id = ?`,
    [imageUrl, id],
    (err) => {
      if (err) throw err;
      res.send("Image uploaded successfully!");
    }
  );
});

app.get("/m", (req, res) => {
  connection.query(
    `SELECT * FROM pd_mouse WHERE m_status="Y" ORDER BY m_discount ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.get("/admin_data_m", (req, res) => {
  connection.query(
    `SELECT * FROM pd_mouse ORDER BY m_brand, m_model ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.put("/edit_m/:id", (req, res) => {
  const { id } = req.params;
  const { brand, model, color, type, status, href, price_srp, discount } =
    req.body;
  connection.query(
    `UPDATE pd_mouse SET m_brand = ?, m_model = ?, m_color = ?, m_type = ?, 
     m_status = ?, m_href = ?, m_price_srp = ?, m_discount = ? WHERE m_id = ?`,
    [brand, model, color, type, status, href, price_srp, discount, id],
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

app.put("/update_img_mp/:id", (req, res) => {
  const { id } = req.params;
  const { imageUrl } = req.body;
  connection.query(
    `UPDATE pd_mousepad SET mp_img = ? WHERE mp_id = ?`,
    [imageUrl, id],
    (err) => {
      if (err) throw err;
      res.send("Image uploaded successfully!");
    }
  );
});

app.get("/mp", (req, res) => {
  connection.query(
    `SELECT * FROM pd_mousepad WHERE mp_status="Y" ORDER BY mp_discount ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.get("/admin_data_mp", (req, res) => {
  connection.query(
    `SELECT * FROM pd_mousepad ORDER BY mp_brand, mp_model ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.put("/edit_mp/:id", (req, res) => {
  const { id } = req.params;
  const {
    group,
    brand,
    model,
    color,
    dimentions,
    status,
    href,
    price_srp,
    discount,
  } = req.body;
  connection.query(
    `UPDATE pd_mousepad SET mp_group = ?, mp_brand = ?, mp_model = ?, mp_color = ?, mp_dimentions = ?, 
     mp_status = ?, mp_href = ?, mp_price_srp = ?, mp_discount = ? WHERE mp_id = ?`,
    [
      group,
      brand,
      model,
      color,
      dimentions,
      status,
      href,
      price_srp,
      discount,
      id,
    ],
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

app.put("/update_img_mic/:id", (req, res) => {
  const { id } = req.params;
  const { imageUrl } = req.body;
  connection.query(
    `UPDATE pd_mic SET mic_img = ? WHERE mic_id = ?`,
    [imageUrl, id],
    (err) => {
      if (err) throw err;
      res.send("Image uploaded successfully!");
    }
  );
});

app.get("/mic", (req, res) => {
  connection.query(
    `SELECT * FROM pd_mic WHERE mic_status="Y" ORDER BY mic_discount ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.get("/admin_data_mic", (req, res) => {
  connection.query(
    `SELECT * FROM pd_mic ORDER BY mic_brand, mic_model ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.put("/edit_mic/:id", (req, res) => {
  const { id } = req.params;
  const { brand, model, color, status, href, price_srp, discount } = req.body;
  connection.query(
    `UPDATE pd_mic SET mic_brand = ?, mic_model = ?, mic_color = ?, 
     mic_status = ?, mic_href = ?, mic_price_srp = ?, mic_discount = ? WHERE mic_id = ?`,
    [brand, model, color, status, href, price_srp, discount, id],
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

app.put("/update_img_s/:id", (req, res) => {
  const { id } = req.params;
  const { imageUrl } = req.body;
  connection.query(
    `UPDATE pd_sink SET s_img = ? WHERE s_id = ?`,
    [imageUrl, id],
    (err) => {
      if (err) throw err;
      res.send("Image uploaded successfully!");
    }
  );
});

app.get("/sink", (req, res) => {
  connection.query(
    `SELECT * FROM pd_sink WHERE s_status="Y" ORDER BY s_discount ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.get("/admin_data_s", (req, res) => {
  connection.query(
    `SELECT * FROM pd_sink ORDER BY s_brand, s_model ASC`,
    function (err, results) {
      res.send(results);
    }
  );
});

app.put("/edit_s/:id", (req, res) => {
  const { id } = req.params;
  const { brand, model, color, status, href, price_srp, discount } = req.body;
  connection.query(
    `UPDATE pd_sink SET s_brand = ?, s_model = ?, s_color = ?, 
     s_status = ?, s_href = ?, s_price_srp = ?, s_discount = ? WHERE s_id = ?`,
    [brand, model, color, status, href, price_srp, discount, id],
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
