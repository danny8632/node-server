require('dotenv').config()
const mysql = require('mysql');
const dbHandler = require('./db_handler');
const app = require('./routeHandler');



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

    let images = req.body.files.map(file => file.path.split("/")[1]);

    let data = [
        req.body.userID,
        req.body.fields.title,
        req.body.fields.price,
        req.body.fields.description,
        req.body.fields.address,
        req.body.fields.zipcode,
        req.body.fields.region,
    ];

    let sql = mysql.format("INSERT INTO DinMarkedsplads.Products (userId, title, price, description, address, zipcode, region) VALUES(?,?,?,?,?,?,?);", data);

    dbHandler.queryDatabase(sql, (error, results, fields) => {

        if(error) return res.send({success : false, "error" : error.sqlMessage});

        let postid = results.insertId;
        data = [];

        sql = "INSERT INTO DinMarkedsplads.ProductAssets (productId, image) VALUES";

        for (let i = 0; i < images.length; i++) {
            const image = images[i];
            data.push(postid, image);

            if(i == 0)
                sql += " (?,?)";
            else
                sql += ", (?,?)";
        }

        sql = mysql.format(sql, data);

        console.log(sql);

        dbHandler.queryDatabase(sql, (error, results, fields) => {

            if(error) return res.send({success : false, "error" : error.sqlMessage});

            res.send({
                success : true,
                id : postid
            });
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

    values.push(fields.id, req.body.userID);

    let sql = `UPDATE DinMarkedsplads.Products SET ${sql_arr.join(", ")} WHERE id = ? AND userId = ?;`;

    sql = mysql.format(sql, values);

    dbHandler.queryDatabase(sql, (error) => {

        if(error) return res.send({success : false, "error" : error.sqlMessage});

        return res.send({
            success : true
        })
    });

}, true)

app.delete("/product", (req, res) => {

    sql = mysql.format("DELETE FROM DinMarkedsplads.Products WHERE id = ? AND userId = ?;", [req.body.fields.id, req.body.userID]);

    dbHandler.queryDatabase(sql, (error) => {

        if(error) return res.send({success : false, "error" : error.sqlMessage});

        return res.send({
            success : true
        })
    });

}, true)


/*  ------------------------------  */
/*            USER AUTH             */
/*  ------------------------------  */

app.post("/user/login", (req, res) => {

    console.log(req.body)

    let fields = req.body.fields;

    if(typeof fields === "undefined" || typeof fields.username === "undefined" || typeof fields.password === "undefined") 
        return res.send({success : false, error : "empty password or username"});

    let username = fields.username;
    let password = fields.password;

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
/*             COMMENTS             */
/*  ------------------------------  */

app.get("/comment", (req, res) => {

    let id = req.body.query.id;

    if(typeof id === "undefined") return res.send({success : false, "error" : "no id was parsed"});

    sql = mysql.format("SELECT com.id AS 'id', com.productId AS 'productId', com.userId AS 'userId', Users.username AS 'username', com.subComment AS 'subComment', com.`comment` AS 'comment' FROM Comments AS com INNER JOIN Users ON com.userId = Users.id WHERE com.productId = ?;", [id]);

    dbHandler.queryDatabase(sql, (error, results) => {

        if(error) return res.send({success : false, "error" : error.sqlMessage});

        return res.send({
            success : true,
            results
        })
    });
});

app.post("/comment", (req, res) => {

    let id          = req.body.fields.id;
    let userId      = req.body.userID;
    let subComment  = typeof req.body.fields.subComment === "undefined" ? null : req.body.fields.subComment;
    let text = req.body.fields.comment

    if(typeof id === "undefined") return res.send({success : false, "error" : "no id was parsed"});

    sql = mysql.format("INSERT INTO DinMarkedsplads.Comments (productId, userId, subComment, comment) VALUES(?,?,?,?);", [id, userId, subComment, text]);

    dbHandler.queryDatabase(sql, (error, results) => {

        if(error) return res.send({success : false, "error" : error.sqlMessage});

        return res.send({
            success : true
        })
    });

}, true);

app.put("/comment", (req, res) => {

    let id = req.body.fields.id;
    let text = req.body.fields.comment;

    if(typeof id === "undefined" || typeof text === "undefined") return res.send({success : false, "error" : "text or id was undefined"});

    sql = mysql.format("UPDATE DinMarkedsplads.Comments SET comment=? WHERE id = ? AND userId = ?;", [text, id, req.body.userID]);

    dbHandler.queryDatabase(sql, (error, results) => {

        if(error) return res.send({success : false, "error" : error.sqlMessage});

        return res.send({
            success : true
        })
    });


}, true);

app.delete("/comment", (req, res) => {

    let id = req.body.fields.id;

    if(typeof id === "undefined") return res.send({success : false, "error" : "no id was parsed"});

    sql = mysql.format("DELETE FROM DinMarkedsplads.Comments id=? AND userId = ?;", [id, req.body.userID]);

    dbHandler.queryDatabase(sql, (error, results) => {

        if(error) return res.send({success : false, "error" : error.sqlMessage});

        return res.send({
            success : true
        })
    });

}, true);


/*  ------------------------------  */
/*             COMMENTS             */
/*  ------------------------------  */

app.get("/comment", (req, res) => {

    sql = "SELECT id, name FROM DinMarkedsplads.Categories;";

    dbHandler.queryDatabase(sql, (error, results) => {

        if(error) return res.send({success : false, "error" : error.sqlMessage});

        return res.send({
            success : true,
            results
        })
    });
});


/*  ------------------------------  */
/*          Static files            */
/*  ------------------------------  */

app.static("/static", "images");

app.listen(3001);

