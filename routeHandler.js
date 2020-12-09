const http = require('http');
const url = require('url');
const fs = require('fs');
const formidable = require('formidable');

const STATUSNAMES = {
    400: "Bad Request",
    401: "Unauthorized",
    402: "Payment Required",
    403: "Forbidden",
    404: "Not Found"
};

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

let functions = { GET: {}, POST: {}, PUT : {}, DELETE : {}, STATIC : {} };


const server = http.createServer((req, res) => {

    let path        = url.parse(req.url, true),
        pathname    = path.pathname,
        splitpath   = pathname.split("/"),
        filename    = "",
        method      = req.method;

    if(typeof functions[method][pathname] === "undefined")
    {
        if(method === "GET" && splitpath.length > 0)
        {
            const newPath = splitpath.slice(0, (splitpath.length - 1)).join("/");

            if(typeof functions['STATIC'][newPath] !== "undefined")
            {
                method = "STATIC";
                pathname = newPath;
                filename = splitpath[splitpath.length - 1];
            }
            else
            {
                return sendError(res, {error : "File or Path not found"});
            }
        }
        else
        {
            return sendError(res, {error : "File or Path not found"});
        }
    }

    console.log(method, pathname, filename);

    req.body = { method, pathname, query : path.query };

    if(method === "STATIC")
    {
        let file_dir = `./${functions[method][pathname]}/${filename}`;

        try {
            if (fs.existsSync(file_dir)) 
            {
                let type = MIME[filename.split(".")[1]] || 'text/plain';
                
                fs.readFile(file_dir, (err, data) => {
                    res.writeHead(200, {'Content-Type': type});
                    res.end(data);
                    return;
                });
            }
            else
            {
                return sendError(res, {error : "file no exists"})
            }
        } catch (err) {
            return sendError(res, err);
        }
    } 
    else
    {
        res.writeHead(200, {'Content-Type': "application/json"});
        res.send = (data) => {
            res.end(JSON.stringify(data));
        }

        let header = typeof req.headers['content-type'] === "undefined" ? '' : req.headers['content-type'].split(';')[0];

        if(header === "multipart/form-data")
        {
            const form = formidable({ multiples: true, uploadDir: "./images", keepExtensions : true});
     
            form.parse(req, (err, fields, files) => {
                req.body['fields'] = fields;
                req.body['files'] = files;
                return functions[method][pathname].func(req, res);
            });
        }
        else
        {
            return functions[method][pathname].func(req, res);
        }
    }
});


function sendError(res, msg) {
    res.writeHead(404, "Not Found", { "Content-Type": "application/json" });
    res.end(JSON.stringify(msg));
}


function static(path, folder) {
    functions['STATIC'][path] = folder;
}

function get(path, func) {
    functions['GET'][path] = { func };
}

function post(path, func) {
    functions['POST'][path] = { func };
}


function listen(port, cb) {
    server.listen(port);
    if(typeof cb === "function") cb();
}


module.exports.listen = listen;
module.exports.static = static;
module.exports.get = get;
module.exports.post = post;