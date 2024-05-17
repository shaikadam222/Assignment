const express = require('express');
const app = express();
const jwt = require('jsonwebtoken')
const bodyParser = require("body-parser");
const pg = require("pg");
const port = 3000;

app.use(bodyParser.json())

const userclient = new pg.Client ({
    user: "postgres",
    host: "localhost",
    database: "users",
    password: "Shaik@786",
    port:8000
});
userclient.connect();

userclient.query(`
    CREATE TABLE IF NOT EXISTS users(
    id SERIAL PRIMARY KEY,
    username VARCHAR(45) UNIQUE NOT NULL,
    password VARCHAR(100)
    );
    `,(err,res) => {
    if(err) {
        console.log("Error in fetching details",err.stack);
    } else {
        console.log("asdasdasdas");
    }
})


function generateToken(user) {
    var obj = {
        id: user.id,
        username : user.username
    }
    var token = jwt.sign(obj,"S3cret",{expiresIn : '1h'});
    return token;
}
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
  
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
  
    try {
      const result = await userclient.query(
        'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *',
        [username, password]
      );
  
      const user = result.rows[0];
      const token = generateToken(user);
  
      res.status(201).json({ token });
    } catch (error) {
      res.status(500).json({ message: 'Error creating user', error });
    }
  });
  

  app.post('/login',async(req,res) => {
    var username = req.body.username;
    var password = req.body.password;
    userclient.query(`
    SELECT*FROM users
    WHERE username = ($1) AND password = ($2)
    `,[username,password],(err,data) => {
        if(err) {
            res.send("Error while fetching details").status(403);
        } else {
            if(data && data.rows && data.rows.length > 0) {
                res.send("logged in successfully").status(200);
            } else {
                res.send("Invalid credentials").status(403);
            }
        }
    })
  })
  

app.listen(port,() => {
    console.log("Server listen on 3000");
})