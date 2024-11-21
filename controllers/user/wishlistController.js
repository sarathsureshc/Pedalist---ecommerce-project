const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Offer = require("../../models/offerSchema");
const Wishlist = require("../../models/wishlistSchema");
const Cart = require("../../models/cartSchema");

const addToWishlist = async (req, res) => {
  try {
    const user = req.session.user || req.user;
    if (!user) {
      return res.redirect("/login");
    }
    const userId = user._id;
    const { productId } = req.body;

    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      wishlist = new Wishlist({ userId, products: [{ productId }] });
    } else {
      const isProductInWishlist = wishlist.products.some(
        (item) => item.productId.toString() === productId,
      );

      if (isProductInWishlist) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Product is already in the wishlist.",
          });
      }

      wishlist.products.push({ productId });
    }

    await wishlist.save();
    res.json({
      success: true,
      message: "Product added to wishlist successfully!",
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        message: "An error occurred while adding to wishlist.",
      });
  }
};

const loadWishlist = async (req, res) => {
  try {
    const user = req.session.user || req.user;
    if (!user) {
      return res.redirect("/login");
    }

    const userId = user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const wishlist = await Wishlist.findOne({ userId }).populate({
      path: "products.productId",
      model: "Product",
      select: "productName price image brand category",
    });

    if (!wishlist) {
      return res
        .status(404)
        .json({ success: false, message: "Wishlist not found." });
    }

    wishlist.products.sort((a, b) => b.addedOn - a.addedOn);

    const paginatedProducts = wishlist.products.slice(skip, skip + limit);
    const totalProducts = wishlist.products.length;
    const totalPages = Math.ceil(totalProducts / limit);

    const cart = await Cart.findOne({ userId: user._id });
    let cartCount = 0;
    if (cart) {
      cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);
    }

    res.render("wishlist", {
      wishlist: paginatedProducts,
      user: user,
      cartCount,
      currentPage: page,
      totalPages,
      limit,
      totalProducts,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        message: "An error occurred while fetching the wishlist.",
      });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const user = req.session.user || req.user;

    if (!user) {
      return res.redirect("/login");
    }

    const userId = user._id;
    const productId = req.params.id;

    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      return res
        .status(404)
        .json({ success: false, message: "Wishlist not found." });
    }

    wishlist.products = wishlist.products.filter(
      (item) => item.productId.toString() !== productId.toString(),
    );

    await wishlist.save();

    res.json({
      success: true,
      message: "Product removed from wishlist successfully!",
    });
  } catch (error) {
    console.error("Error in removeFromWishlist:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "An error occurred while removing from wishlist.",
      });
  }
};

const moveToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity < 1) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product ID or quantity." });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    }

    if (product.quantity < 1) {
      return res
        .status(400)
        .json({ success: false, message: "Product out of stock." });
    }

    const user = req.session.user || req.user;
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User  not authenticated." });
    }

    const wishlistItem = await Wishlist.findOne({
      userId: user._id,
      products: { $elemMatch: { productId } },
    });

    if (!wishlistItem) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found in wishlist." });
    }

    let cart = await Cart.findOne({ userId: user._id });
    console.log(cart);
    if (!cart) {
      cart = new Cart({
        userId: user._id,
        items: [{ productId, quantity }],
      });
    } else {
      const existingItemIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId,
      );
      if (existingItemIndex >= 0) {
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        cart.items.push({ productId, quantity });
      }
    }

    await cart.save();

    await Wishlist.updateOne(
      { userId: user._id },
      { $pull: { products: { productId } } },
    );

    res
      .status(200)
      .json({ success: true, message: "Item moved to cart successfully." });
  } catch (error) {
    console.error("Error moving item to cart:", error);
    res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

module.exports = {
  addToWishlist,
  loadWishlist,
  removeFromWishlist,
  moveToCart,
};
