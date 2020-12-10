require('dotenv').config()
const mysql = require('mysql');
const dbHandler = require('./db_handler');
const app = require('./routeHandler');



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

    let query = req.body.query;

    let sql = "SELECT * FROM ProductsView";

    let values = [];

    if(typeof query.id !== "undefined")
    {
        sql = "SELECT * FROM ProductsView WHERE id = ?";
        values.push(query.id);
    }
    else if(typeof query.category !== "undefined")
    {
        sql = "SELECT ProductsView.* FROM ProductCategories AS cad INNER JOIN ProductsView ON ProductsView.id = cad.productId WHERE cad.categoryId = ?";
        values.push(query.category);
    }
    
    if(typeof query.size !== "undefined")
    {
        sql += " LIMIT ?;";
        values.push(query.size);
    }

    if(values.length > 0) sql = mysql.format(sql, values);

    dbHandler.queryDatabase(sql, (error, results) => {

        if(error) return res.send({success : false, "error" : error.sqlMessage});

        return res.send({
            success : true,
            results
        })

    });
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

app.put("/product", (req, res) => {

    const fields = req.body.fields;
    const keys = Object.keys(fields);

    let sql_arr = [];
    let values = [];

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const field = fields[key];

        if(keys[i].toLowerCase() == "id" || keys[i].toLowerCase() == "productId") continue;
        
        sql_arr.push(`${key} = ?`);
        values.push(field);
    }

    values.push(fields.id);

    let sql = `UPDATE DinMarkedsplads.Products SET ${sql_arr.join(", ")} WHERE id = ?;`;

    sql = mysql.format(sql, values);

    dbHandler.queryDatabase(sql, (error) => {

        if(error) return res.send({success : false, "error" : error.sqlMessage});

        return res.send({
            success : true
        })
    });

}, true)

app.delete("/product", (req, res) => {

    sql = mysql.format("DELETE FROM DinMarkedsplads.Products WHERE id = ?", [req.body.fields.id]);

    dbHandler.queryDatabase(sql, (error) => {

        if(error) return res.send({success : false, "error" : error.sqlMessage});

        return res.send({
            success : true
        })
    });

}, true)

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

