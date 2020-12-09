require('dotenv').config()
const mysql = require('mysql');
const dbHandler = require('./db_handler');
const app = require('./routeHandler');
const crypto = require('crypto');


app.get("/gemme", (req, res) => {
    //console.log(req.body);
    console.log(req.headers)
    
    console.log("\n",req.headers.authorization, "\n")

    res.send({"gemme" : "YES"});
});


/*  ------------------------------  */
/*             product              */
/*  ------------------------------  */

app.get("/product", (req, res) => {

});

app.post("/product", (req, res) => {

    let data = [
        req.body.userID,
        req.body.fields.title,
        req.body.fields.price,
        req.body.files.map(file => file.path.split("/")[1]).join(","),
        req.body.fields.description,
        req.body.fields.address,
        req.body.fields.zipcode,
        req.body.fields.region,
    ];

    let sql = mysql.format("INSERT INTO DinMarkedsplads.Products (userId, title, price, images, description, address, zipcode, region) VALUES(?,?,?,?,?,?,?,?);", data);

    dbHandler.queryDatabase(sql, (error, results, fields) => {

        if(error) return res.send({success : false, "error" : error.sqlMessage});

        res.send({
            success : true,
            id : results.insertId
        });
    })
    
}, true);


/*  ------------------------------  */
/*           END product            */
/*  ------------------------------  */



/*  ------------------------------  */
/*            USER AUTH             */
/*  ------------------------------  */

app.post("/user/login", (req, res) => {
    let username = req.body.fields.username;
    let password = req.body.fields.password;

    dbHandler.authenticate(username, password, (error, result) => {

        if(error) return res.send(error);

        return res.send(result);
    })
});

app.post("/user/singup", (req, res) => {

    let username = req.body.fields.username;
    let password = req.body.fields.password;

    let sql = mysql.format("INSERT INTO DinMarkedsplads.Users (username, password) VALUES(?, ?);", [username, password]);

    dbHandler.queryDatabase(sql, (error, results, fields) => {

        if(error) return res.send({success : false, error : error.sqlMessage});

        res.send({
            success : true,
            id : results.insertId
        });
    })
});

/*  ------------------------------  */
/*         END USER AUTH            */
/*  ------------------------------  */


app.static("/static", "images");

app.listen(3001);

