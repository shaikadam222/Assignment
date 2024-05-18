const express = require('express');
const bodyParser = require("body-parser");
const userRoutes = require("./routes/userRoutes")
const postRoutes = require("./routes/postRoutes")
const port = 3000;

const app = express();
app.use(bodyParser.json());

app.use('/user', userRoutes);
app.use('/post', postRoutes);

app.listen(port, () => {
    console.log("Server listening on port 3000");
});
