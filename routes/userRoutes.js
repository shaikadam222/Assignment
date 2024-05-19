const express = require('express');
const { authenticate, generateToken } = require('../auth');
const { userclient, postclient } = require('../database');
const router = express.Router();
const cors = require('cors')

router.use(cors())

router.get('/',authenticate,async(req,res) => {
    const username = req.headers.username;
    const result1 = await postclient.query(`SELECT (media_data,description) FROM posts WHERE username = ($1)`,[username]);
    const result2 = await postclient.query(`SELECT (messages) FROM texts WHERE username = ($1)`,[username]);
    if(result1.rowCount == 0 && result2.rowCount == 0){
        res.send("No posts :(");
    } else if(result1.rowCount>0){
        try {
            const result = await postclient.query('SELECT media_data, media_type FROM Posts');
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
    }
})

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
    var username = req.headers.username;
    var arr = [];
    try {
        const res2 = await postclient.query(`
        SELECT posts.*
        FROM posts
        JOIN followers ON posts.username = followers.username
        WHERE followers.follower = $1
        `,[username]);

        arr.push(res2.rows)

        const res3 = await postclient.query(`
        SELECT texts.*
        FROM texts
        JOIN followers ON texts.username = followers.username
        WHERE followers.follower = $1
        `,[username]);

        arr.push(res3);


        res.send(arr).status(200)
    } catch(err) {
        console.log(err);
        res.send("ERROR while fetching details from the db cuz to feed content").status(500);
    }
});

router.post('/follow', authenticate, async (req, res) => {
    try {
        const username = req.headers.username;
        const follower = req.body.username; 

        if (!username || !follower) {
            return res.status(400).json({ message: 'Username is required' });
        }
        if(username === follower) {
            return res.status(400).json({message : "You cannot follow yourself"})
        }
        const result = await userclient.query(`SELECT username FROM followers WHERE follower = ($1)`,[follower]);
        if(result && result.rowCount>0) {
            res.send(`You are already following ${username}`);
        } else {
            await userclient.query(`INSERT INTO followers (username,follower) VALUES ($1, $2)`,[username,follower])
            res.status(200).send(`${username} started following ${follower}`);
        }

        
    } catch (err) {
        res.status(500).json({ message: 'Error following user', err });
    }
});

router.post('/unfollow',authenticate,async(req,res) => {
    try {
        const username = req.headers.username;
        const follower = req.body.username;

        if (!username || !follower) {
            return res.status(400).json({ message: 'Username is required' });
        }

        if(username === follower) {
            return res.status(400).json({message : "You cannot unfollow yourself"})
        }
        const result = await userclient.query(`SELECT username FROM followers WHERE follower = ($1)`,[follower]);
        
        if(result && result.rowCount===0) {
            res.send(`You are not following ${username}`);
        } else {
            await userclient.query(`UPDATE followers SET username = NULL, follower = NULL  WHERE follower = ($1)`,[follower],(err,data) => {
                console.log(data);
            });

            res.send(`${username} have unfollowed ${follower}`).status(200)
        }
    } catch(err) {
        console.log(err);
        res.send("Error while unfollowing").status(500);
    }
})


module.exports = router;
