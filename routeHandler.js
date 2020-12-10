const http = require('http');
const url = require('url');
const fs = require('fs');
const dbHandler = require('./db_handler');
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
        authToken   = req.headers.authorization,
        method      = req.method;

    req.body = { method, pathname, query : path.query };

    if(typeof functions[method][pathname] === "undefined")
    {
        if(method === "GET" && splitpath.length > 0)
        {
            const newPath = splitpath.slice(0, (splitpath.length - 1)).join("/");

            if(typeof functions['STATIC'][newPath] !== "undefined")
            {
                req.body['method'] = "STATIC";
                req.body['pathname'] = newPath;
                req.body['filename'] = splitpath[splitpath.length - 1];
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


    console.log(req.body.method, req.body.pathname);

    //  Retives the auth token:
    if(functions[req.body.method][req.body.pathname].requireToken)
    {
        if(typeof authToken === "undefined" || authToken === "") return sendError(res, {success : false, reason : "no token"}, 401);

        let authTokenSplittet = authToken.split(" ");

        if(authTokenSplittet.length !== 2 || authTokenSplittet[1] === "") return sendError(res, {success : false, reason : "no token"}, 401);

        authToken = authTokenSplittet[1];

        dbHandler.validateToken(authToken, (valid, userId) => {

            if(!valid) return sendError(res, {success : false, reason : "no valid token"}, 401);

            req.body['userID'] = userId;

            return handleFunction(req, res);
        });        
    }
    else
    {
        return handleFunction(req, res);
    }    
});


function handleFunction(req, res) {

    let func = functions[req.body.method][req.body.pathname];

    console.log(req.method)

    if(req.method === "STATIC")
    {
        let file_dir = `./${func}/${req.body.filename}`;

        try {
            if (fs.existsSync(file_dir)) 
            {
                let type = MIME[req.body.filename.split(".")[1]] || 'text/plain';
                
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
            console.log("\n Returns => ", data, "\n");

            res.end(JSON.stringify(data));
        }

        let header = typeof req.headers['content-type'] === "undefined" ? '' : req.headers['content-type'].split(';')[0];

        if(header === "multipart/form-data" || header === "application/x-www-form-urlencoded" || header === "application/json")
        {
            const form = formidable({ multiples: true, uploadDir: "./images", keepExtensions : true});
     
            form.parse(req, (err, fields, files) => {
                req.body['fields'] = fields;
                req.body['files'] = files[''];
                return func.func(req, res);
            });
        }
        else
        {
            return func.func(req, res);
        }
    }
}



function sendError(res, msg, status = 404) {
    res.writeHead(status, STATUSNAMES[status], { "Content-Type": "application/json" });
    res.end(JSON.stringify(msg));
}


function static(path, folder) {
    functions['STATIC'][path] = folder;
}

function get(path, func, requireToken = false) {
    functions['GET'][path] = { func, requireToken };
}

function post(path, func, requireToken = false) {
    functions['POST'][path] = { func, requireToken };
}

function put(path, func, requireToken = false) {
    functions['PUT'][path] = { func, requireToken };
}

function del(path, func, requireToken = false) {
    functions['DELETE'][path] = { func, requireToken };
}

function listen(port, cb) {
    server.listen(port);
    if(typeof cb === "function") cb();
}


module.exports.listen = listen;
module.exports.static = static;
module.exports.get = get;
module.exports.post = post;
module.exports.put = put;
module.exports.delete = del;