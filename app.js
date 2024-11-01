const express = require("express");
const bodyParser = require('body-parser');
const app = express();
const env = require("dotenv").config();
const session = require("express-session");
const passport = require("./config/passport");
const db = require("./config/db");
const userRouter = require("./routes/userRouter");
const adminRouter = require("./routes/adminRouter.js");
const cron = require('node-cron');
const Offer = require('./models/offerSchema.js')

const path = require("path");
const flash = require('connect-flash');
db();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.set("cache-control", "no-store");
  next();
});

app.use(flash());
app.use((req, res, next) => {
    res.locals.errorMessage = req.flash('error');
    next();
});

app.set("view engine", "ejs");
app.set("views", [
  path.join(__dirname, "views/user"),
  path.join(__dirname, "views/admin"),
]);
app.use(express.static(path.join(__dirname, "public")));

app.use("/", userRouter);
app.use("/admin", adminRouter);

cron.schedule('0 0 * * *', async () => { 
  try {
      const currentDate = new Date();
      await Offer.updateMany(
          { endDate: { $lt: currentDate }, isActive: true },
          { isActive: false, isDeleted: true }
      );
      console.log('Updated offers to inactive where endDate has passed.');
  } catch (error) {
      console.error('Error updating offers:', error);
  }
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running at ${PORT}!!`);
});

module.exports = app;
