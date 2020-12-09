const url = require('url');
const formdataParser = require('./formdataParser');
const fs = require('fs')

let functions = { GET: {}, POST: {} };


const STATUSNAMES = {
    400: "Bad Request",
    401: "Unauthorized",
    402: "Payment Required",
    403: "Forbidden",
    404: "Not Found"
}

const MIME = {
    html: 'text/html',
    txt: 'text/plain',
    css: 'text/css',
    gif: 'image/gif',
    jpg: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
    js: 'application/javascript'
};

function routeListner(req, res) {

    let path        = url.parse(req.url, true),
        pathname    = path.pathname,
        splitpath   = pathname.split('/'),
        query       = path.query,
        action      = getAction(req, pathname),
        header      = typeof req.headers['content-type'] == "undefined" ? '' : req.headers['content-type'].split(';')[0],
        func_data   = { query, body : "", res };

    console.log(`IP => ${pathname}`);

    if (action == "undefined") 
    {
        return notFound(res);
    }

    if (header === 'multipart/form-data') 
    {
        req.setEncoding('latin1');

        formdataParser.getFormData(req, (data) => {
            func_data['body'] = data;
            return respond({ action, func_data })
        });
    }
    else if (action.isFile && splitpath.length > 1)
    {
        let file = splitpath[2];

        let file_dir = `./images/${file}`;

        try {
            if (fs.existsSync(file_dir)) 
            {
                let type = MIME[file.split(".")[1]] || 'text/plain';
                
                fs.readFile(file_dir, (err, data) => {
                    res.writeHead(200, {'Content-Type': type});
                    res.end(data);
                });
            }
        } catch (err) {
            console.log(err);

            return `file not found`;
        }
    }
    else
    {
        return respond({ action, func_data })
    }
}


function getAction(req, path) {

    let method      = req.method,
        splitpath   = path.split('/');

    if(typeof functions[method] == "undefined") return "undefined";

    if(typeof functions[method][path] == "object") return functions[method][path];

    if(splitpath.length > 0 && typeof functions[req.method][`/${splitpath[1]}`] != "undefined")
    {
        return functions[req.method][`/${splitpath[1]}`];
    }

    return "undefined";
}



function respond({ action, func_data }) {
    func_data.res.writeHead(action.status, STATUSNAMES[action.status], action.header);
    //res.end(action.func(func_data));
    action.func(func_data);
}


function addGet(path, func, isFile = false, status = 200, header = { "Content-Type": "text/plain" }) {

    functions.GET[path] = {
        status,
        header,
        func,
        isFile
    }
}

function addPost(path, func, status = 200, header = { "Content-Type": "text/plain" }) {

    functions.POST[path] = {
        status,
        header,
        func,
        isFile : false
    }
}


function notFound(res) {
    res.writeHead(404, "Not Found", { "Content-Type": "text/plain" });
    res.end("Denne path er ikke tilgængelig");
}


module.exports.routeListner = routeListner;
module.exports.addGet = addGet;
module.exports.addPost = addPost;