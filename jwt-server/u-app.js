
var fs = require('fs');
var path = require('path');
var dateFormat = require('dateformat');

var udb = require('./u-db');
var ufs = require('./u-fs');

var m_assemblyName = '';
var m_assemblyVersion = '';
var m_appParams = '';
var m_lastError = '';

exports.initialize = async function () {
    m_assemblyVersion = ufs.getPackageParam("version");

    m_assemblyName = path.basename(path.dirname(process.argv[1]));
    if (!fs.existsSync("./" + m_assemblyName)) {
        ufs.mkdir("./" + m_assemblyName);
    }

    let settingsFile = "./" + m_assemblyName + ".json";
    if (!(m_appParams = ufs.readJsonFile(settingsFile))) {
        this.loger(`*** u-app.initialize Error: Unable to read program settings file (${settingsFile})`);
        process.exit();
    }

    await udb.getApplicationDbMap();

    if (!udb.tableExist("jwt_users")) {
        let dbName = udb.getDatabaseName(0);
        udb.noneQuery("CREATE TABLE jwt_users (id INTEGER PRIMARY KEY, name nvarchar(50), email nvarchar(50), password varchar(max))", dbName);
        udb.m_
    }
}


exports.loger = function (message) {
    if (message.trim() != "") {
        message = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss.l") + " " + message;
    }

    console.error(message);
    if (message.includes(' *** ')) m_lastError = message;

    let logPath = `./${m_assemblyName}/${m_assemblyName}_${dateFormat(new Date(), "yyyy_mm_dd")}.log`;
    ufs.appendFile(logPath, message + "\r\n");
}

exports.getAppParams        = function () { return m_appParams; }
exports.getAssemblyName     = function () { return m_assemblyName; }
exports.getAssemblyVersion  = function () { return m_assemblyVersion; }
exports.getLastError        = function () { return m_lastError; }
