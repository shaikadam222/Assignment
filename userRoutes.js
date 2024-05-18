const express = require('express');
const { authenticate, generateToken } = require('./auth');
const { userclient } = require('./database');
const router = express.Router();

router.post('/signup', async (req, res) => {
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

router.post('/login', async (req, res) => {
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
});

router.get('/find', authenticate, async (req, res) => {
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
});

router.post('/follow', authenticate, async (req, res) => {
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

module.exports = router;
