const http = require('http');
const routeHandler = require('./route_hander');

const server = http.createServer(routeHandler.routeListner);

routeHandler.addGet("/gemme", ({ query, body }) => {
    //console.log(body);

    return `gemmer`;
})


routeHandler.addGet("/image", () => {}, true);


routeHandler.addPost("/gemmer", ({ query, body }) => {
    console.log(body);

    return `gemmer2`;
})


server.listen(3001);