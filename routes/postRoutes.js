const express = require('express');
const multer = require('multer');
const { authenticate } = require('../auth');
const { postclient } = require('../database');
const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });
const cors = require('cors')

router.use(cors());

router.post('/text',authenticate,async(req,res) => {
    const username = req.headers.username;
    const message = req.body.message;

    try {
        await postclient.query(`INSERT INTO texts (message,username) VALUES ($1,$2)`,
        [message,username])

        res.send("Posted Successfully").status(200);
    } catch(err) {
        console.log(err);
        res.send("Error while posting").status(500);
    }
})


router.post('/upload', upload.single('media'), async (req, res) => {
    const username = req.headers.username;
    const description  = req.body.description;
    const media = req.file;

    if (!media) {
        return res.status(400).send('No file uploaded.');
    }

    const mediaType = media.mimetype;

    try {
        const query = 'INSERT INTO Posts (username, media_data, media_type, description) VALUES ($1, $2, $3, $4)';
        const values = [username, media.buffer, mediaType, description];
        await postclient.query(query, values);
        res.send('Media uploaded successfully.');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error uploading media.');
    }
});

router.get('/:username/media', async (req, res) => {
    const username = req.params.username;

    try {
        const result = await postclient.query('SELECT media_data, media_type FROM Posts WHERE username = $1', [username]);
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

router.post('/:id/like', authenticate, async (req, res) => {
    const postid = req.params.id;
    const username = req.headers.username;


    try {
        await postclient.query(`
        INSERT INTO likes (post_id, username) VALUES ($1, $2) ON CONFLICT DO NOTHING
        `,[postid,username]);

        res.send(`${username} Liked the post ${postid}`)
    } catch(err) {
        console.log(err);
        res.send("Error while liking the post").status(500);
    }
});

router.delete('/:id/dislike', authenticate, async (req, res) => {
    const postid = req.params.id;
     const username = req.headers.username;

     try{
        await postclient.query(`
        DELETE FROM likes WHERE post_id = ($1) AND username = ($2)
        `,[postid,username]);

        res.send(`${username} disliked the post ${postid}`);
     } catch(err) {
        console.log(err);
        res.send("Error while disliking the post").status(500);
     }
});

router.post('/:id/comment',authenticate,async(req,res) => {
    const id = req.params.id;
    const username = req.headers.username;
    const comment = req.body.comment;


    try {
        await postclient.query('INSERT INTO comments (post_id, username, comment) VALUES ($1, $2, $3)',
        [id,username,comment]);

        res.send(`Commented successfully on ${id}`);
    } catch(err) {
        console.log(err);
        res.send(`Error while commenting on ${username}'s post`).status(500)
    }
})

router.put('/:id/comment',authenticate,async(req,res) => {
    const id = req.params.id;
    const username = req.body.username;
    const comment = req.body.comment;

    try {
        await postclient.query(`UPDATE comments SET comment = ($1) WHERE username = ($2)`,[comment,username])
        res.send("Edited comment").status(200);
    } catch(err) {
        console.log(err);
        res.send("Error while editing comment").status(500);
    }
})


router.delete('/:id/comment',authenticate,async(req,res) => {
    const id = req.params.id;
    const username = req.body.username;

    try {
        await postclient.query(`UPDATE comments SET comment = NULL WHERE username = ($1)`,[username ]);
        res.send("Comment deleted").status(200);
    } catch(err) {
        console.log(err);
        res.send("Error while deleting comment").status(500);
    }
})
module.exports = router;
