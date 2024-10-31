const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Cart = require("../../models/cartSchema");
const env = require("dotenv").config();
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

const loadProfilePage = async (req, res) => {
  try {
    const user = req.session.user || req.user;
    let cartCount = 0;
    if (user) {
      const userData = await User.findOne({ _id: user._id });
      const cart = await Cart.findOne({ userId: user._id });
      
      if (cart) {
        cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);
      }
      res.render("user-profile", { user: userData,cartCount});
    } else {
      return res.redirect("/login");
    }
  } catch (error) {
    console.error(error);
    res.redirect("/pageerror");
  }
};

const loadProfileEditPage = async (req, res) => {
  try {
    const user = req.session.user || req.user;
    if (user) {
      const userData = await User.findOne({ _id: user._id });
      res.render("edit-profile", { user: userData,});
    } else {
      return res.redirect("/login");
    }
  } catch (error) {
    console.error(error);
    res.redirect("/pageerror");
  }
};

const profileEdit = async (req, res) => {
  try {
    const user = req.session.user || req.user;
    const { firstName, lastName, mobileNumber } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { firstName: firstName, lastName: lastName, mobileNumber: mobileNumber },
      { new: true }
    );
    res.redirect("/profile");
  } catch (error) {
    console.error(error);
    res.redirect("/pageerror");
  }
};

const loadPasswordChangePage = async (req, res) => {
  try {
    const user = req.session.user || req.user;
    let cartCount = 0 ;
    if (user) {
      const userData = await User.findOne({ _id: user._id });
      const cart = await Cart.findOne({ userId: user._id });
      
      if (cart) {
        cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);
      }
      res.render("edit-password",{user:userData,cartCount});
    } else {
      return res.redirect("/login");
    }
  } catch (error) {
    console.error(error);
    res.redirect("/pageerror");
  }
};

const passwordChange = async (req, res) => {
  try {
    const user = req.session.user || req.user;
    if(user){
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userData = await User.findOne({ _id: user._id });

    const isMatch = await bcrypt.compare(currentPassword, userData.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const newPasswordHash = await securePassword(newPassword);
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { password: newPasswordHash },
      { new: true }
    );
    res.redirect("/profile");
  }else{
    return res.redirect("/login");
  }
  } catch (error) {
    console.error(error);
    res.redirect("/pageerror");
  }
};

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);

    return passwordHash;
  } catch (error) {}
};

module.exports = {
  loadProfilePage,
  loadProfileEditPage,
  profileEdit,
  loadPasswordChangePage,
  passwordChange,
};
