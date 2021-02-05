
var udb = require('./u-db');


exports.getDataset = async function (_stmt, _foreignKeyField = "", _parentKeyField = "", _foreignKeyValue = "") {
  foreignKeyField   = _foreignKeyField;
  parentKeyField    = _parentKeyField;   // might be set to parent primary key as default
  foreignKeyValue   = _foreignKeyValue;  // For primary business objects only  constructor    

  datasetName		    = udb.getTableNameOutOfStmt (_stmt);
  primaryKeyFields	= await udb.getPrimaryKeys (datasetName);

  datasetContent	  = await udb.query (_stmt);
  datasetFormat     = await udb.getQueryFormat (datasetName); // Column types

  var dataset = { foreignKeyField, parentKeyField, foreignKeyValue, datasetName, datasetFormat, datasetContent };
  return dataset;
}
