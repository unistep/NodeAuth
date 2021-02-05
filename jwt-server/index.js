
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const bodyParser = require('body-parser');
const bearerToken = require('express-bearer-token');
const ip = require("ip");
const config = require('./config');
const profile = require('./profile');
const uapp = require('./u-app');

const port = process.env.PORT || 10101;

const app = express()
  .use(cors())
  .use(bodyParser.json())
  .use(bearerToken())
  .use(session({secret: config.secret, saveUninitialized: true, resave: true}));

uapp.initialize();

app.use('/', profile);

app.listen(port, () => {
  console.log(`Express server listening on port ${ip.address()}:${port}`);
});
