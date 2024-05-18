const pg = require("pg");

const userclient = new pg.Client ({
    user: "postgres",
    host: "localhost",
    database: "assignment",
    password: "Shaik@786",
    port: 8000
});

const postclient = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "assignment",
    password: "Shaik@786",
    port: 8000
});

userclient.connect();
postclient.connect();

module.exports = { userclient, postclient };
