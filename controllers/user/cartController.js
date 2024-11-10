const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Brand = require("../../models/brandSchema");
const Cart = require("../../models/cartSchema");
const Offer = require("../../models/offerSchema");

const addToCart = async (req, res) => {
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
    if(product.quantity < 1) {
        return res.status(400).json({ success: false, message: "Product out of stock." });
    }

    const maxQuantity = product.quantity <= 10 ? 1 : 5;
    console.log(maxQuantity);

    if (quantity > maxQuantity) {

      return res.status(404).json({success: false, message :`Maximum allowed quantity is ${maxQuantity}.`});
  }

    const user = req.session.user || req.user;
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated." });
    }
    let cart = await Cart.findOne({ userId: user._id });
    if (!cart) {
      cart = new Cart({
        userId: user._id,
        items: [{ productId, quantity }],
      });
    } else {
      const existingItemIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId
      );
      if (existingItemIndex >= 0) {
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        cart.items.push({ productId, quantity });
      }
    }

    await cart.save();

    res
      .status(200)
      .json({ success: true, message: "Product added to cart successfully." });
  } catch (error) {
    console.error("Error adding product to cart:", error);
    res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

const getCart = async (req, res) => {
  try {
      const user = req.session.user || req.user;
      if (!user) {
          return res.redirect("/login");
      }

      const cart = await Cart.findOne({ userId: user._id }).populate("items.productId");
      if (!cart) {
          return res.status(404).render("cart", { cart: [], totalPrice: 0, offer: "No offer" });
      }

      const offers = await Offer.find({ isActive: true, isDeleted: false });


      let totalPrice = 0;
      let globalDiscount = 0; 

      cart.items.forEach(item => {
          const product = item.productId;
          let bestOffer = null;

          offers.forEach(offer => {
              let isApplicable = false;

              switch (offer.offerGroup) {
                  case 'Brand':
                      isApplicable = offer.brandsIncluded.includes(product.brand._id.toString());
                      break;
                  case 'Category':
                      isApplicable = offer.categoriesIncluded.includes(product.category._id.toString());
                      break;
                  case 'Product':
                      isApplicable = offer.productsIncluded.includes(product._id.toString());
                      break;
                  case 'Global': 
                      isApplicable = true;
              }

              if (isApplicable) {
                  let effectiveDiscount = 0;
                  if (offer.offerType === 'Percentage') {
                      effectiveDiscount = (product.price * offer.offerValue) / 100;
                  } else if (offer.offerType === 'Flat') {
                      effectiveDiscount = offer.offerValue;
                  }

                  if (offer.maxDiscountAmount) {
                      effectiveDiscount = Math.min(effectiveDiscount, offer.maxDiscountAmount);
                  }

                  if (!bestOffer || effectiveDiscount > bestOffer.effectiveDiscount) {
                      bestOffer = {
                          offerName: offer.offerName,
                          effectiveDiscount,
                      };
                  }
              }
          });

          if (bestOffer) {
              totalPrice += (product.price - bestOffer.effectiveDiscount) * item.quantity;

              if (bestOffer.offerName && offers.some(o => o.offerGroup === 'Global' && o.offerName === bestOffer.offerName)) {
                  globalDiscount = Math.max(globalDiscount, bestOffer.effectiveDiscount);
              }
          } else {
              totalPrice += product.price * item.quantity;
          }

          product.bestOffer = bestOffer;
      });

      const minPurchaseAmount = Math.min(...offers.filter(o => o.offerGroup === 'Global').map(o => o.minPurchaseAmount || 0));
      if (totalPrice > minPurchaseAmount) {
          totalPrice -= globalDiscount;
      }

      const userData = await User.findOne({ _id: user._id });
      res.render("cart", {
          user: userData,
          cart: cart.items,
          totalPrice,
          offer: globalDiscount > 0 ? `Global Offer Applied: ₹${globalDiscount.toFixed(2)}` : "No offer",
          cartCount: cart.items.reduce((total, item) => total + item.quantity, 0),
      });
  } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

const updateCart = async (req, res) => {
  const { quantity } = req.body;

  if (quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1." });
  }

  try {
      const user = req.session.user || req.user;
      if (user) {
          const userData = await User.findOne({ _id: user._id });
          const productId = req.params.id;

          const product = await Product.findById(productId);
          if (!product) {
              return res.status(404).json({ message: "Product not found." });
          }

          const maxQuantity = product.quantity <= 10 ? 1 : 5;

          if (quantity > maxQuantity) {
              return res.status(400).json({ success: false, message: `Maximum allowed quantity is ${maxQuantity}.` });
          }

          const cart = await Cart.findOneAndUpdate(
              { userId: userData._id, "items.productId": productId },
              { $set: { "items.$.quantity": quantity } },
              { new: true }
          );

          if (!cart) {
              return res.status(404).json({ message: "Cart item not found." });
          }

          res.status(200).json({ success: true, cart });
      } else {
          res.redirect("/login");
      }
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error." });
  }
};


const removeFromCart = async (req, res) => {
  try {
    const user = req.session.user || req.user;

    if (user) {
      const userData = await User.findOne({ _id: user._id });

      const cart = await Cart.findOneAndUpdate(
        { userId: userData._id },
        { $pull: { items: { productId: req.params.id } } },
        { new: true }
      );

      if (!cart) {
        return res.status(404).json({ message: "Cart item not found." });
      }

      res
        .status(200)
        .json({ message: "Item removed from cart successfully.", cart });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCart,
  removeFromCart,
};
