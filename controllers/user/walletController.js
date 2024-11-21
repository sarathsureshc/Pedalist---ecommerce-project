const User = require("../..//models/userSchema");
const Order = require("../../models/orderSchema");
const Wallet = require("../../models/walletSchema");
const Cart = require("../../models/cartSchema");

const getWallet = async (req, res) => {
  try {
    const user = req.session.user || req.user;
    let cartCount = 0;
    if (!user) {
      return res.redirect("/login");
    }
    const userData = await User.findOne({ _id: user._id });
    const cart = await Cart.findOne({ userId: user._id });

    if (cart) {
      cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);
    }

    const wallet = await Wallet.findOne({ userId: user._id }).populate(
      "userId",
    );
    if (!wallet) {
      return res.render("wallet", {
        message: "Wallet not found.",
        user: userData,
        wallet: null,
        cartCount,
      });
    }
    res.render("wallet", { user: userData, wallet, cartCount });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving wallet details.", error });
  }
};

module.exports = {
  getWallet,
};
