const pg = require("pg");

const db = new pg.Client ({
    user: "postgres",
    host: "localhost",
    database: "WORLD",
    password: "Shaik@786",
    port:8000
});
var quiz = [
    {country : "France", capital: "Russia"}
];
db.connect();
db.query("SELECT * FROM capitals",(err,res) => {
    if(err) {
        console.log("Error in connecting to the database");
    } else {
        quiz = res.rows;
    }

    db.end();
})
console.log(quiz);