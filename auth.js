const jwt = require('jsonwebtoken');
const { userclient } = require('./database');

async function authenticate(req, res, next) {
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

module.exports = { authenticate, generateToken };
