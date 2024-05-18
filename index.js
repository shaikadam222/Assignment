const express = require('express');
const app = express();
const jwt = require('jsonwebtoken')
const bodyParser = require("body-parser");
const pg = require("pg");
const multer = require('multer')
const storage = multer.memoryStorage();
const upload = multer({storage : storage});
const port = 3000;

app.use(bodyParser.json())

const userclient = new pg.Client ({
    user: "postgres",
    host: "localhost",
    database: "assignment",
    password: "Shaik@786",
    port:8000
});

const postclient = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "assignment",
    password: "Shaik@786",
    port:8000
})

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

postclient.connect();
postclient.query(`
    CREATE TABLE IF NOT EXISTS posts(
    id SERIAL PRIMARY KEY,
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
        console.log(tempd.rows)
        const obj = {
            username : tempd.rows[0].username,
            followers : tempd.rows[0].followers,
            following : tempd.rows[0].following
        }
        res.send(obj);
    }
})


  app.post('/follow', authenticate, async (req, res) => {
    try {
        const username = req.headers.username;
        const follower = req.body.follower; 

        if (!username || !follower) {
            return res.status(400).json({ message: 'Username and follower are required' });
        }
        if(username === follower) {
            return res.status(400).json({message : "You cannot follow yourself"})
        }
        const result = await userclient.query(`
        UPDATE users SET followers = $1 WHERE username = $2 RETURNING username
        `, [follower, username]);
        
        const res2 = await userclient.query(`
        UPDATE users SET following = $1 WHERE username = $2
        `,[username,follower]);

        res.status(200).send(`${follower} started following you`);


        
    } catch (err) {
        res.status(500).json({ message: 'Error following user', err });
    }
});


app.post('/upload', upload.single('media'), async (req, res) => {
    const { userId, description } = req.body;
    const media = req.file;

    if (!media) {
        return res.status(400).send('No file uploaded.');
    }

    const mediaType = media.mimetype;

    try {
        const query = 'INSERT INTO Posts (user_id, media_data, media_type, description) VALUES ($1, $2, $3, $4)';
        const values = [userId, media.buffer, mediaType, description];
        await postclient.query(query, values);
        res.send('Media uploaded successfully.');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error uploading media.');
    }
});

app.get('/posts/:id/media', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await postclient.query('SELECT media_data, media_type FROM Posts WHERE id = $1', [id]);
        if (result.rows.length > 0) {
            const media = result.rows[0].media_data;
            const mediaType = result.rows[0].media_type;
            res.writeHead(200, {
                'Content-Type': mediaType,
                'Content-Length': media.length
            });
            res.end(media);
        } else {
            res.status(404).send('Media not found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving media.');
    }
});


app.listen(port,() => {
    console.log("Server listen on 3000");
})