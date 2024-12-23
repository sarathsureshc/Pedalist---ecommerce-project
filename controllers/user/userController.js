const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Cart = require("../../models/cartSchema");
const Offer = require("../../models/offerSchema");
const Wallet = require("../../models/walletSchema");
const env = require("dotenv").config();
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

const pageNotFound = async (req, res) => {
  try {
    res.render("pageNotFound");
  } catch (error) {
    res.redirect("/pageNotFound");
  }
};

const loadHomepage = async (req, res) => {
  try {
    const user = req.session.user || req.user;
    const newArrivals = await Product.find().sort({ createdOn: -1 }).limit(4);
    if (user) {
      const userData = await User.findOne({ _id: user._id });
      const cart = await Cart.findOne({ userId: user._id });
      let cartCount = 0;

      if (cart) {
        cartCount = cart.items.reduce(
          (total, item) => total + item.quantity,
          0,
        );
      }

      return res.render("home", { user: userData, newArrivals, cartCount });
    } else {
      return res.render("home", { newArrivals });
    }
  } catch (error) {
    console.log("Home page not found", error);
    res.render("pageNotFound");
    res.status(500).send({ message: "Server error" });
  }
};

const loadSignuppage = async (req, res) => {
  try {
    return res.render("signup");
  } catch (error) {
    console.log("Signup page not found");
    res.render("pageNotFound");
    res.status(500).send({ message: "Server error" });
  }
};

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(email, otp) {
  try {
    const transpoter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      require: true,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });

    const info = await transpoter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: "Verify Your Email Address - Pedalist",
      text: `Hello,

            Welcome to Pedalist! Please use the following One-Time Password (OTP) to verify your email address and activate your account:

            Your OTP: ${otp}

            This OTP is valid for the next 10 minutes. Please do not share it with anyone.

            If you did not request this verification, please disregard this email.

            Thank you for choosing Pedalist!

            Best regards,
            Pedalist Support Team`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
            <h2>Welcome to Pedalist!</h2>
            <p>Hello,</p>
            <p>Thank you for registering with <strong>Pedalist</strong>. To complete your registration, please verify your email address using the OTP below:</p>
            <div style="text-align: center; margin: 20px 0;">
            <h1 style="background-color: #f4f4f4; padding: 10px; display: inline-block; border-radius: 5px; font-size: 24px;">${otp}</h1>
            </div>
            <p>This OTP is valid for the next <strong>10 minutes</strong>. For security purposes, please do not share this OTP with anyone.</p>
            <p>If you did not request this verification, simply ignore this email.</p>
            <p>Thank you for choosing Pedalist!</p>
            <p>Best regards, <br><strong>Pedalist Support Team</strong></p>
            <hr>
            <p style="font-size: 12px; color: #999;">If you have any questions, please contact us at support@pedalist.com</p>
        </div>`,
    });

    return info.accepted.length > 0;
  } catch (error) {
    console.error("Error sending email", error);
    return false;
  }
}

const signup = async (req, res) => {
  try {
    const { firstName, lastName, mobileNumber, email, password, referral } =
      req.body;

    const findUser = await User.findOne({ email: email });
    if (findUser) {
      return res.render("signup", {
        message: "User with this email already exists",
      });
    }
    const otp = generateOtp();

    const otpExpiry = Date.now() + 10 * 60 * 1000;
    req.session.otpExpiry = otpExpiry;

    const emailSent = await sendVerificationEmail(email, otp);
    if (!emailSent) {
      return res.json("email-error");
    }

    const passwordHash = await securePassword(password);
    console.log("Hashed password : ", passwordHash);

    req.session.userOtp = otp;
    req.session.userData = {
      firstName,
      lastName,
      mobileNumber,
      email,
      passwordHash,
      referral,
    };

    // console.log(req.session.userData);

    res.render("verify-otp");
    console.log("OTP sent", otp);
  } catch (error) {
    console.error("Signup error", error);
    res.redirect("/pageNotFound");
  }
};

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);

    return passwordHash;
  } catch (error) {}
};

const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    if (Date.now() > req.session.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    if (otp === req.session.userOtp) {
      const user = req.session.userData;

      const generateReferralCode = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
      };

      const saveUserData = new User({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobileNumber: user.mobileNumber,
        password: user.passwordHash,
        referral: user.referral,
        referralCode: generateReferralCode(),
      });

      let newUserReward = 0;

      if (saveUserData.referral) {
        const referralUser = await User.findOne({
          referralCode: user.referral,
        });
        if (referralUser) {
          const refOffer = await Offer.findOne({ offerGroup: "Referral" });
          if (refOffer && typeof refOffer.offerValue === "number") {
            let referralUserWallet = await Wallet.findOne({
              userId: referralUser._id,
            });
            const offerAmount = Number(refOffer.offerValue);

            if (!referralUserWallet) {
              referralUserWallet = new Wallet({
                userId: referralUser._id,
                balance: offerAmount,
                card: [],
                transaction: [],
              });
              await referralUserWallet.save();
            } else {
              referralUserWallet.balance =
                (referralUserWallet.balance || 0) + offerAmount;
              await referralUserWallet.save();
            }
            const description = `Added ${offerAmount} due to referral`;
            await processReferral(referralUser._id, offerAmount, description);

            newUserReward = offerAmount;
          } else {
            console.error("Referral offer not found or invalid offer amount");
          }
        } else {
          console.error("Referral user not found");
        }
      }

      await saveUserData.save();

      let newUserWallet = await Wallet.findOne({ userId: saveUserData._id });
      if (!newUserWallet) {
        newUserWallet = new Wallet({
          userId: saveUserData._id,
          balance: newUserReward,
          card: [],
          transaction: [],
        });
        await newUserWallet.save();
      } else {
        newUserWallet.balance = (newUserWallet.balance || 0) + newUserReward;
        await newUserWallet.save();
      }
      const description = `Added ${newUserReward} due to referral`;
      await processReferral(saveUserData._id, newUserReward, description);

      req.session.userOtp = null;
      req.session.otpExpiry = null;

      res.json({ success: true, redirectUrl: "/login" });
    } else {
      res
        .status(400)
        .json({ success: false, message: "Invalid OTP, Please try again" });
    }
  } catch (error) {
    console.error("Error verifying OTP", error);
    res.status(500).json({ success: false, message: "An error occurred" });
  }
};

async function processReferral(userId, amount, description) {
  try {
    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    const transaction = {
      transactionId: new mongoose.Types.ObjectId(),
      transactionType: "Referral",
      transactionDate: new Date(),
      reference: `Reward for referral`,
      amount: amount,
      description: description,
    };

    wallet.transaction.push(transaction);

    await wallet.save();

    console.log("Referral processed successfully.");
  } catch (error) {
    console.error("Error processing referral:", error);
  }
}

const resendOtp = async (req, res) => {
  try {
    const { email } = req.session.userData;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email not found in session" });
    }

    const otp = generateOtp();
    const otpExpiry = Date.now() + 10 * 60 * 1000;

    req.session.userOtp = otp;
    req.session.otpExpiry = otpExpiry;

    const emailSent = await sendVerificationEmail(email, otp);
    if (emailSent) {
      console.log("Resend OTP:", otp);
      res
        .status(200)
        .json({ success: true, message: "OTP resent successfully" });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to resend  OTP. Please try again",
      });
    }
  } catch (error) {
    console.error("Error resending OTP", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error. Please try again",
    });
  }
};

const loadLoginpage = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.render("login");
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.log("Login page not found");
    res.render("pageNotFound");
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const findUser = await User.findOne({ isAdmin: 0, email: email });

    if (!findUser) {
      console.log("User not found");
      return res.render("login", { message: "User not found" });
    }

    if (findUser.isBlocked) {
      return res.render("login", {
        message: "Your account is blocked by admin",
      });
    }

    const passwordMatch = await bcrypt.compare(password, findUser.password);
    console.log("Password match:", passwordMatch);

    if (!passwordMatch) {
      console.log("Invalid password");
      return res.render("login", { message: "Invalid password" });
    }

    req.session.user = findUser;
    console.log("User logged In");
    res.redirect("/");
  } catch (error) {
    console.error("Login error", error);
    res.render("login", { message: "Login failed. Please try again later" });
  }
};

const logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.log("Session destruction error", err.message);
        return res.redirect("/pageNotFound");
      }
      return res.redirect("/login");
    });
  } catch (error) {
    console.log("Logout error", error);
    res.redirect("/pageNotFound");
  }
};

module.exports = {
  loadHomepage,
  pageNotFound,
  loadLoginpage,
  login,
  loadSignuppage,
  signup,
  verifyOtp,
  resendOtp,
  logout,
};
