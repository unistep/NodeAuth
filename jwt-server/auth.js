
const nJwt = require('njwt');
const uapp = require('./u-app');
var config = require('./config');

function jwtAuth(req, res, next) {
  if (!req.token) {
    let errorMessage = 'No token provided';
    uapp.loger(`*** Server Error: ${errorMessage}`)
    return res.status(403).send({ errorMessage });
  }

  nJwt.verify(req.token, config.secret, function(err, decoded) {
    if (err) {
      let errorMessage = 'Could not authenticate token';
      uapp.loger(`*** Server Error: ${errorMessage}`)
      return res.status(500).send({ errorMessage });
    }

    req.userId = decoded.body.id;
    next();
  });
}

module.exports = jwtAuth;
