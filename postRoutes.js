const express = require('express');
const multer = require('multer');
const { authenticate } = require('./auth');
const { postclient } = require('./database');
const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/upload', upload.single('media'), async (req, res) => {
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

router.get('/:id/media', async (req, res) => {
    const id = req.params.id

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

router.post('/:id/like', authenticate, async (req, res) => {
    const id = req.params.id;
    const userId = req.body.userId;


    try {
        await postclient.query(`
        INSERT INTO likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING
        `,[id,userId]);

        res.send(`${userId} Liked the post ${id}`)
    } catch(err) {
        console.log(err);
        res.send("Error while liking the post").status(500);
    }
});

router.delete('/:id/dislike', authenticate, async (req, res) => {
    const id = req.params.id;
     const userid = req.body.userId;

     try{
        await postclient.query(`
        DELETE FROM likes WHERE post_id = ($1) AND user_id = ($2)
        `,[id,userid]);

        res.send(`${userid} disliked the post ${id}`);
     } catch(err) {
        console.log(err);
        res.send("Error while disliking the post").status(500);
     }
});

module.exports = router;
