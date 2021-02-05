
var fs = require ('fs');
var path = require ('path');

var uapp = require ('./u-app');


exports.mkdir = function (dirpath, recursive) {
    option = recursive ? { recursive: true } : { recursive: false };

    try {
        fs.mkdirSync (dirpath, options);
        return true;
    }
    catch (err) {
        uapp.loger ("*** u-fs.mkdir Error: " + err.message);
        return false;
    }
}

exports.readFileSync = function (pathname) {
    try {
        return fs.readFileSync (pathname);
    }
    catch (err) {
        uapp.loger ("*** u-fs.readFileSync Error: " + err.message);
        return null;
    }
}

exports.appendFile = function (pathname, data) {
    try {
        fs.appendFileSync(pathname, data);
        return true;
    }
    catch (err) {
        uapp.loger ("*** u-fs.appendFile Error: " + err.message);
        return false;
    }
}


exports.writeFile = function (pathname, data) {
      try {
        fs.writeFile(pathname, data);
        return true;
    }
    catch (ex) {
        uapp.loger ("*** u-fs.appendFile Error: " + ex.message);
        return false;
    }
}


exports.readJsonFile = function (pathname) {
    let rawdata = this.readFileSync(pathname);
    if (!rawdata) return null;

    try {
        return JSON.parse(rawdata);
    }
    catch (err) {
        uapp.loger ("*** u-fs.readJsonFile Error: " + err.message);
        return null;
    }
}

exports.getPackageParam = function (param) {
    json = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    return json[param];
}

exports.getDirectoryName = function (filePath) {
    return path.dirname(filePath);
}
