const express = require('express');
const app = express();
const env = require("dotenv").config();
const session = require('express-session')
const passport = require('./config/pasport')
const db = require("./config/db");
const router = require('./routes/userRouter')
const path = require('path')
db()

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false,
        httpOnly: true,
        maxAge: 72 * 60 * 60 * 1000
     }
}))
app.use("/",router)
app.set('view engine', 'ejs');
app.set('views',[path.join(__dirname,"views/user"),path.join(__dirname,"views/admin")])
app.use(express.static(path.join(__dirname,'public')))


app.listen(3000, () => {
    console.log(`Server is running!!`);
})

module.exports = app;