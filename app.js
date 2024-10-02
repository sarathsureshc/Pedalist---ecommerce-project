const express = require('express');
const app = express();
const env = require("dotenv").config();
const db = require("./config/db");
const router = require('./routes/userRouter')
const path = require
db()

app.use("/",router)
app.set('view engine', 'ejs');
app.set('views',[path.join(__dirname,"views/user"),path.join(__dirname,"views/admin")])
app.use(express.static(path.join(__dirname,'public')))


app.listen(3000, () => {
    console.log(`Server is running!!`);
})

module.exports = app;