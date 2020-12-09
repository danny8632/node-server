require('dotenv').config()
const http = require('http');
const routeHandler = require('./route_hander');
const dbHandler = require('./db_handler');

const server = http.createServer(routeHandler.routeListner);

routeHandler.addGet("/", ({res}) => {

    console.log("get called")
    
    dbHandler.queryDatabase("SELECT * FROM Users;", (results, fields) => {

        console.log(JSON.stringify(results[0]));

        res.end(JSON.stringify(results));
    })
}, false, 200, { "Content-Type": "application/json" })


routeHandler.addGet("/image", () => {}, true);

routeHandler.addGet("/gemme", () => {
    return "gemme";
})


routeHandler.addPost("/gemmer", ({ query, body }) => {
    console.log(body);

    return `gemmer2`;
})


server.listen(3001);