const pg = require("pg");

const userclient = new pg.Client ({
    user: "postgres",
    host: "localhost",
    database: "assignment",
    password: "Shaik@786",
    port: 2000
});

const postclient = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "assignment",
    password: "Shaik@786",
    port: 2000
});

userclient.connect();
postclient.connect();

userclient.query(`
    CREATE TABLE IF NOT EXISTS users(
    id SERIAL PRIMARY KEY,
    username VARCHAR(45) UNIQUE NOT NULL,
    password VARCHAR(100)
    );
    `,(err,res) => {
    if(err) {
        console.log("Error in fetching details",err.stack);
    }
})

postclient.query(`
    CREATE TABLE IF NOT EXISTS posts(
    id SERIAL PRIMARY KEY,
    username VARCHAR(45),
    user_id INT REFERENCES users(id),
    media_data BYTEA,
    media_type VARCHAR(50),
    description TEXT,
    commenting BOOLEAN DEFAULT TRUE
    );
    `,(err,res) => {
    if(err) {
        console.log("Error in fetching details",err.stack);
    }
})

postclient.query(`
    CREATE TABLE IF NOT EXISTS likes (
        id SERIAL PRIMARY KEY,
        username VARCHAR(45),
        post_id INT REFERENCES posts(id),
        user_id INT REFERENCES users(id),
        UNIQUE(post_id,user_id)
    );
`)

postclient.query(`
    CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        username VARCHAR(45),
        post_id INT REFERENCES posts(id),
        user_id INT REFERENCES users(id),
        comment TEXT
    );
`)

postclient.query(`
    CREATE TABLE IF NOT EXISTS texts (
        id SERIAL PRIMARY KEY,
        username VARCHAR(45),
        user_id INT REFERENCES users(id),
        message TEXT
    );
`)

postclient.query(`
    CREATE TABLE IF NOT EXISTS followers (
        id SERIAL PRIMARY KEY,
        username VARCHAR(45),
        follower VARCHAR(45)
    );
`)

module.exports = { userclient, postclient };
