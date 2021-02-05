
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const nJwt = require('njwt');
const config = require('./config');
const jwtAuth = require('./auth');
const udb = require('./u-db');
const uapp = require('./u-app');
const uds = require('./u-ds');
const ufs = require('./u-fs');

var multer  = require('multer')
var upload = multer({ dest: 'uploads/' })

const router = express.Router();


//====================================================================================================
router.post('/GetAppParams', function(req, res) {
  uapp.loger(`${req.url}: Caller=${req.headers.username}`);

  AssemblyVersion = uapp.getAssemblyVersion();
  KnownLanguages = "[\"English\", \"Hebrew\", \"Spannish\"]";
  Language = req.body.language == "undefined" ? uapp.getAppParams().DefaultLanguage : req.body.language;
  Endpoints = [{"EndpointName": "DeFacto4443", "EndpointUrl":"https://defacto-service.com:4443/", "Timeout":30}];

  var parameters = {
    AssemblyVersion,
    KnownLanguages,
    Language,
    Endpoints
  };

  toSend = JSON.stringify(parameters);
  res.status(200).send(toSend);
});


//====================================================================================================
router.post('/SPA_ChangeLanguage', function(req, res) {
  uapp.loger(`${req.url}: Caller=${req.headers.username}`);

  req.session.language = req.body.language;

  res.status(200).send({ status: 'ok' });
});


//====================================================================================================
router.post('/register', async function(req, res) {
  uapp.loger(`${req.url}: Caller=${req.headers.username}`);

  var hashedPassword = bcrypt.hashSync(req.body.password, 8);

  let response = udb.query("INSERT INTO jwt_users (name, email, password) "
        + `VALUES ('${req.body.name}', '${req.body.email}', '${hashedPassword}')`);

  if (!response) {
    returnError (500, uapp.getLastError()); 
    return;
  }

  res.status(200).send({ status: 'ok' });
});


//====================================================================================================
router.post('/login', async function(req, res) {
  uapp.loger(`${req.url}: Caller=${req.body.email}`);

  let user = await udb.query(`SELECT id, name, email, password FROM jwt_users WHERE email='${req.body.email}'`);
  
  if (!user) {
    returnError (500, uapp.getLastError()); 
    return;
  }

  if (user.length < 1) {
    returnError (401, 'Invalid username, password pair!'); 
    return;
  }
  
  user = user[0];

  if (!bcrypt.compareSync(req.body.password, user.password)) {
    returnError (404, 'User not found!'); 
    return;
  }

  var jwt = nJwt.create({ id: user.id }, config.secret);
  jwt.setExpiration(new Date().getTime() + (24*60*60*1000));

  res.status(200).send({ UserName: user.name, UserID: user.id, SessionKey: jwt.compact() });
});


//====================================================================================================
router.post('/logout', async function(req, res) {
  uapp.loger(`${req.url}: Caller=${req.headers.username}`);

  res.status(200).send("{}");
});


//====================================================================================================
router.get('/profile', jwtAuth, async function(req, res, next) {
  uapp.loger(`${req.url}: Caller=${req.headers.username}`);

  let user = await udb.query(`SELECT id, name, email FROM jwt_users WHERE id='${req.userId}'`);
  if (!user) {
    returnError (500, uapp.getLastError()); 
    return;
  }

  if (user.length < 1) {
    returnError (404, 'User not found!'); 
    return;
  }

  user = user[0];

  res.status(200).send(user);
});


//====================================================================================================
router.post('/time-clock', jwtAuth, async function(req, res) {
  uapp.loger(`${req.url}: Caller=${req.headers.username}`);
  
  let datasets = [];
  let stmt = `SELECT Top 1 * FROM Time_Clock WHERE User_Login='${req.query.view_key_value}'`
           + " ORDER BY Time_Reported DESC";
  datasets.push (await uds.getDataset(stmt));
  
  res.status(200).send({ datasets });
});


//====================================================================================================
router.post('/service-call', jwtAuth, async function(req, res) {
  uapp.loger(`${req.url}: Caller=${req.headers.username}`);

  let datasets = [];
  let stmt = "SELECT *, Vehicle_Color + ', ' + Gear_Type as __Description FROM Work_Orders";;
  datasets.push(await uds.getDataset(stmt));  // PRIMARY DATASET comes FIRST!

  // CHILD DATASET (as the one below) need to declare its own foreign key and the parent key field it related to
  // Default for parent key field is its own (first in row) primary key
  stmt = "SELECT * FROM VU_Cart_Detail_Line_Extended";
  datasets.push(await uds.getDataset(stmt, "Cart_Header_Line_pKey", "Work_Order_PKey"));

  // Combo box content with no relation to primary dataset
  stmt = "SELECT Product_Family_ID AS id, Product_Family_Desc AS name FROM Product_Family";
  datasets.push(await uds.getDataset(stmt));

  // JUST A DEMO: in real world it should contain "technician inventory warehouse" (by technician ID)  
  stmt = "SELECT Product_ID as id, Product_Desc as name, * FROM Product";  // + where... se above   
  datasets.push(await uds.getDataset(stmt));

  res.status(200).send({ datasets });
});


router.post('/shopping-cart', jwtAuth, async function (req, res) {
  uapp.loger(`${req.url}: Caller=${req.headers.username}`);

  let datasets = [];
 let stmt = `SELECT * FROM Cart_Detail_Line WHERE Cart_Header_Line_pKey='${req.body.view_key_value}' ORDER BY pKey`;
 datasets.push(await uds.getDataset(stmt, "Cart_Header_Line_pKey", "Work_Order_PKey", req.body.view_key_value));

  stmt = `SELECT * FROM VU_Cart_Detail_Line_Extended WHERE Cart_Header_Line_pKey='${req.body.view_key_value}' ORDER BY pKey`;
  datasets.push(await uds.getDataset(stmt, "Cart_Header_Line_pKey", "Work_Order_PKey", req.body.view_key_value));

  // Combo box content with no relation to primary dataset
  stmt = "SELECT Product_Family_ID AS id, Product_Family_Desc AS name FROM Product_Family";
  datasets.push(await uds.getDataset(stmt));

  // JUST A DEMO: in real world it should contain "technician inventory warehouse" (by technician ID)  
  stmt = "SELECT Product_ID as id, Product_Desc as name, * FROM Product";  // + where businessObject.parent_key_value (not view_key_value)...    
  datasets.push(await uds.getDataset(stmt));

  res.status(200).send({ datasets });
});


//====================================================================================================
router.post('/upload', upload.array('files', 6), async function (req, res) {
  uapp.loger(`${req.url}: Caller=${req.headers.username}`);

  if (req.Form.Files.Count < 1) {
    returnError (400, 'Upload file, No files recieved'); 
    return;
  }

  let file = Request.Form.Files[0];
  let fileSize = file.Length;
  let fileName = file.Name;

  uApp.Loger(`Upload file request: Caller=${req.headers.username}, ${fileName}, Size: ${fileSize}`);

  let filePath = `./${m_assemblyName}/uploads/${fileName}`;

  let dirPath = ufs.getDirectoryName(filePath);
  if (dirPath == "") {
    returnError (400, 'No file path'); 
    return;
  }

  if (!ufs.mkdir(dirPath))
  {
    returnError(500, uapp.getLastError());
  }

  if (!ufs.writeFile(filePath, file))
  {
    returnError(500, uapp.getLastError());
  }

  uApp.Loger(`${FilePath} successfully uploaded`);
  res.status(200).send({ });
});


//====================================================================================================
router.post('/WebProcedure', jwtAuth, async function (req, res) {
  uapp.loger(`${req.url}: Caller=${req.headers.username}`);

  //const tableName = req.body.tableName;
  const stmt = req.body.stmt;

  uapp.loger(`WebProcedure: Caller=${req.user}, Stmt=${stmt}`); // Table=${tableName}, 

  if (!stmt)
  {
    res.status(500).send({ errorMessage: 'Server error (500): Empty statement' });
  }

  // string dbKey = uDB.GetTarget_DB(tableName);
  // if (dbKey == "") return Error("Error, Unknown dataset name");

  result = await udb.query(stmt);

  res.status(200).send({ status: 'ok' });
});

function returnError (responseCode, errorMessage) {
  uapp.loger(`*** Server Error (${responseCode}): ${errorMessage}`)
  res.status(responseCode).send({ errorMessage });
}


module.exports = router;
