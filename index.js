require('dotenv').config()

const dbHandler = require('./db_handler');
const app = require('./routeHandler');


app.get("/gemme", (req, res) => {
    res.send({"gemme" : "YES"});
});

app.post("/upload", (req, res) => {

    console.log(req.body);

});

app.static("/static", "images");

app.listen(3001);

