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
    password VARCHAR(100),
    followers VARCHAR(45) ,
    following VARCHAR(45) ,
    post TEXT
    );
    `,(err,res) => {
    if(err) {
        console.log("Error in fetching details",err.stack);
    }
})


async function authenticate(req,res,next) {
    var username = req.headers.username;
    var password = req.headers.password;

    var dbusername = await userclient.query(`
    SELECT username FROM users
    WHERE username = ($1) AND password = ($2)
    `,[username,password]);
    var dbpassword = await userclient.query(`
    SELECT password FROM users
    WHERE username = ($1) AND password = ($2)
    `,[username,password]);

    
    if( dbusername.rowCount>0 && dbpassword.rowCount>0 && username === dbusername.rows[0].username  &&  password === dbpassword.rows[0].password) {
        next();
    } else {
        res.send("INVALID CREDENTIALS").status(403);
    }
}

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
        var temp = await userclient.query(
            `SELECT username FROM users WHERE username = ($1)
        `,[username]);

        if(temp.rows.length > 0) {
            res.send("Username already exists").status(500);
        } else {
            res.status(500).json({ message: 'Error creating user', error });
        }
    }
  });
  

  app.post('/login',async (req,res) => {
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
  

app.get("/find",authenticate,async(req,res) => {
    var username = req.query.username;

   const tempd =  await userclient.query(`
    SELECT * FROM users
    WHERE username =($1)
    `,[username])

    if(tempd === undefined) {
        res.send("Invalid username").status(404);
    } else {
        res.send(tempd.rows);
    }
})


  app.post('/follow', authenticate, async (req, res) => {
    try {
        const username = req.body.username;
        const follower = req.body.follower; 

        if (!username || !follower) {
            return res.status(400).json({ message: 'Username and follower are required' });
        }
        if(username === follower){
            return res.status(400).json({message : 'You can not follow yourself'});
        }
        const query = `
        UPDATE users SET followers = $1 WHERE username = $2 RETURNING username
        `;

        const result = await userclient.query(query, [follower, username]);
        console.log(result)
        res.status(200).send(`${follower} started following you`);
    } catch (err) {
        res.status(500).json({ message: 'Error following user', err });
    }
});

app.listen(port,() => {
    console.log("Server listen on 3000");
})