
const sql = require('mssql');
const uapp = require('./u-app');
 
var m_databases = [];
var m_tables = [];


// ======================================================================================================
exports.getApplicationDbMap = async function () {
    m_databases = uapp.getAppParams().Databases;

    await this.getTableList();

    this.dbStatistics();

    uapp.loger("");
}


// ======================================================================================================
exports.getTableList = async function () {
    let stmt =	"SELECT sys.objects.name FROM sys.objects " +
                "WHERE sys.objects.type IN ('U', 'P', 'V') ORDER BY sys.objects.name";

    try
    {
        for (let i = 0; i < m_databases.length; i++)
        {
            let recordset = await this.query(stmt, m_databases[i].name);
            if (recordset == null) continue;

            for (let j = 0; j < recordset.length; j++)
            {
                m_tables.push([recordset[j].name, m_databases[i].name]);
            }
        }
    }
    catch (ex)
    {
        uapp.loger(`*** udb.getTableList Error: ${ex.message}`);
    }
}


// ======================================================================================================
exports.addTable = function (tableName, dbName) {
    tableName = tableName.toString().trim();
    tableName = rtrim(ltrim (tableName, "["), "]").trim();
    m_tables.push([tableName, dbName]);
}


// ======================================================================================================
exports.dbStatistics = async function () {
    let stmt = "SELECT COUNT(*) from INFORMATION_SCHEMA.TABLES";

    for (let i = 0; i < m_databases.length; i++)
{
        let dbName = m_databases[i].name;

        let rowCount = await this.getIntegerScalar(stmt, dbName);
        uapp.loger(`DB: ${dbName}(${rowCount}) is ${((rowCount == 0) ? "INACCESSABLE" : "OK")}`);
    }
}

// ======================================================================================================
exports.query = async function (stmt, dbName = "") {
    if (!dbName) dbName = getTargetDB(this.getTableNameOutOfStmt(stmt));

    try {
        let config = this.getConnectionString(dbName);
        let pool = await sql.connect(config);
        let result = await pool.request().query(stmt);
        pool.close();
        return result.recordset;
    }
    catch (ex) {
        uapp.loger(`*** udb.query Error: <${stmt}>; ${ex.message}`);
        return null;
    }
}


// ======================================================================================================
exports.noneQuery = async function (stmt, dbName) {
    if (!dbName) dbName = getTargetDB(this.getDatabaseName(0));
    try {
        let config = this.getConnectionString(dbName);
        let pool = await sql.connect(config);
        let result = await pool.request().query(stmt);
        return result;
    }
    catch (ex) {
        uapp.loger(`*** udb.noneQuery Error: <${stmt}>; ${ex.message}`);
        return null;
    }
}


// ======================================================================================================
exports.getQueryFormat = async function (tableName) {
    stmt = `SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${tableName}'`;

    result = await this.query (stmt, getTargetDB(tableName));
    if (!result || (result.length == 0)) {
        uapp.loger(`*** udb.getQueryFormat Error: <${tableName}>; no data available `);
        return ("{}");
    }
    
    rowScript = '';

    for (var i = 0; i < result.length; i++)
    {
        var columnName = "\"" + result[i].COLUMN_NAME + "\"";

        var columnType = "\"" + getPrimColumnType(result[i].DATA_TYPE) + "\"";

        rowScript += columnName + ":" + columnType + ",";
    }

    rowScript =  "{" + rtrim (rowScript, ",") + "}";
    return rowScript;
}


// ======================================================================================================
exports.tableExist = function(tableName) {
    tableName = tableName.toString().trim();
    tableName = rtrim(ltrim (tableName, "["), "]").trim();

    for (let i = 0; i < m_tables.length; i++)
    {
        if (tableName.toLowerCase() == m_tables[i][0].toLowerCase())
        {
            return true;
        }
    }

    return false;

    // const result = await this.query(`SELECT COUNT(*) FROM sys.objects WHERE type = 'P' AND OBJECT_ID = OBJECT_ID('dbo.${tableName}')`); 
    // return (result != null);
}


// ======================================================================================================
exports.getPrimaryKeys = async function (tableName) {
    var stmt = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE "
             + "WHERE OBJECTPROPERTY(OBJECT_ID(CONSTRAINT_SCHEMA+'.'+CONSTRAINT_NAME), 'IsPrimaryKey') = 1"
             + `AND TABLE_NAME='${tableName}'`;

    var result = await this.query (stmt, getTargetDB(tableName));

    var primaryKeyList = '';
    for (var i = 0; i < result.length; i++)
    {
        primaryKeyList += result[i].COLUMN_NAME + "|";
    }

    return primaryKeyList = rtrim (primaryKeyList, "|");
}


// ======================================================================================================
exports.getTableNameOutOfStmt = function (stmt) {
    var tableName = "";
    stmt = stmt.toString().trim() + " ";

    while (stmt.indexOf("  ") != -1) stmt = stmt.replace("  ", " ");

    var tableEnd = -1, tableStart = stmt.toUpperCase().indexOf(" FROM ");
    if (tableStart != -1)
    {
        tableStart += " FROM ".length;
        if ((tableEnd = stmt.indexOf(" ", tableStart)) != -1)
        {
            tableName = stmt.substring(tableStart, tableEnd);
        }
    }

    return rtrim(ltrim (tableName, "["), "]").trim();
}


// ======================================================================================================
function getPrimColumnType (columnType) {
    var integer = ['bigint', 'decimal', 'int', 'money', 'numeric', 'smallint', 'smallmoney', 'tinyint'];
    if (integer.includes(columnType)) return "Int";

    var real = ['float', 'real'];
    if (real.includes(columnType)) return "Real";

    var datetime = ['date', 'datetime', 'datetime2', 'datetimeoffset', 'smalldatetime', 'time'];
    if (datetime.includes(columnType)) return "DateTime";

    var string = ['char', 'text', 'varchar', 'nchar', 'ntext', 'nvarchar'];
    if (string.includes(columnType)) return "String";

    // var array = ['binary', 'image', 'varbinary'];
    // if (array.includes(columnType)) return "Array";

    return "String";
}


// ======================================================================================================

exports.getDatabaseName = function (index) {
    if (m_databases.length <= index) index = 0;

    return m_databases[index].name.toString();
}


// ======================================================================================================
exports.getConnectionString = function (dbName) {
    if (!dbName) return m_databases[0].config;

    for (let i = 0; i < m_databases.length; i++)
    {
        if (dbName.toString().toLowerCase() == this.getDatabaseName(i).toLowerCase())
        {
            return m_databases[i].config;
        }
    }

    uapp.loger(`*** udb.getConnectionString: Database Key Not Found: ${dbName}`);
    return "";
}


// ======================================================================================================
exports.getIntegerScalar = async function (stmt, dbName) {
    let recordset = await this.query(stmt, dbName);
    if (!recordset || recordset.length == 0) return 0;
    let result = recordset[0];
    if (!result || result.length == 0) return 0;
    for (key in result) { return parseInt(result[key]) };
    return 0;
}


// ======================================================================================================
exports.getStringScalar = async function (stmt, dbName) {
    let recordset = await this.query(stmt, dbName);
    if (!recordset || recordset.length == 0) return 0;
    let result = recordset[0];
    if (!result || result.length == 0) return 0;
    for (key in result) { return result[key].toString() };
    return 0;
}


// ======================================================================================================
function getTargetDB (tableName) {
    tableName = tableName.toString().trim();
    tableName = rtrim(ltrim (tableName, "["), "]").trim();

    for (let i = 0; i < m_tables.length; i++)
    {
        if (tableName.toLowerCase() == m_tables[i][0].toLowerCase())
        {
            return m_tables[i][1].toString();
        }
    }

    return this.getDatabaseName(0);
}


//==================================================================================
function ltrim(str, char) {
    if (str.slice(0, char.length) === char) {
      return ltrim(str.slice(char.length), char);
    } else {
      return str;
    }
}


//==================================================================================
function rtrim(str, char) {
    if (str.slice(str.length - char.length) === char) {
      return rtrim(str.slice(0, 0 - char.length), char);
    } else {
      return str;
    }
}


// ======================================================================================================
sql.on('error', ex => {
    uapp.loger(`*** udb!! Error: ${ex.message}`);
})


