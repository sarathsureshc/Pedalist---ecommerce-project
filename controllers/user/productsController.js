const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Brand = require("../../models/brandSchema");
const Cart = require("../../models/cartSchema");

const loadProductPage = async (req, res) => {
  try {
    const {
      sortBy,
      showOutOfStock = "false",
      category,
      search,
      minPrice,
      maxPrice,
    } = req.query;

    const filterConditions = { isListed: true };

    if (showOutOfStock === "false") {
      filterConditions.quantity = { $gt: 0 };
    }

    if (category) {
      filterConditions.category = category;
    }

    if (search) {
      filterConditions.$or = [
        { productName: { $regex: search, $options: "i" } },
        { "brand.brandName": { $regex: search, $options: "i" } },
        { "category.name": { $regex: search, $options: "i" } },
      ];
    }

    if (minPrice) {
      filterConditions.price = {
        ...filterConditions.price,
        $gte: parseFloat(minPrice),
      };
    }
    if (maxPrice) {
      filterConditions.price = {
        ...filterConditions.price,
        $lte: parseFloat(maxPrice),
      };
    }

    let products = await Product.find(filterConditions)
      .populate({
        path: "brand",
        match: { isBlocked: false },
        select: "brandName",
      })
      .populate({
        path: "category",
        match: { isListed: true },
        select: "name",
      })
      .exec();

    const filteredProducts = products.filter(
      (product) => product.brand !== null && product.category !== null
    );

    switch (sortBy) {
      case "popularity":
        filteredProducts.sort((a, b) => b.popularity - a.popularity);
        break;
      case "priceLowToHigh":
        filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case "priceHighToLow":
        filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case "averageRating":
        filteredProducts.sort((a, b) => b.rating - a.rating);
        break;
      case "featured":
        filteredProducts.sort((a, b) => b.isFeatured - a.isFeatured);
        break;
      case "newArrivals":
        filteredProducts.sort(
          (a, b) => new Date(b.createdOn) - new Date(a.createdOn)
        );
        break;
      case "aToZ":
        filteredProducts.sort((a, b) =>
          a.productName.localeCompare(b.productName)
        );
        break;
      case "zToA":
        filteredProducts.sort((a, b) =>
          b.productName.localeCompare(a.productName)
        );
        break;
      default:
        break;
    }

    const count = filteredProducts.length;
    const user = req.session.user || req.user;

    const categories = await Category.find({ isListed: true });
    let cartCount = 0;
    
    if (user) {
      const userData = await User.findOne({ _id: user._id });
      const cart = await Cart.findOne({ userId: user._id });
      

      if (cart) {
        cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);
      }
      return res.render("product", {
        products: filteredProducts,
        categories,
        user: userData,
        count,
        showOutOfStock,
        minPrice: minPrice || 20,
        maxPrice: maxPrice || 100000,
        cartCount,
        sortBy,
        selectedCategory: category 
      });
    } else {
      return res.render("product", {
        products: filteredProducts,
        categories,
        count,
        showOutOfStock,
        minPrice: minPrice || 20,
        maxPrice: maxPrice || 100000,
        sortBy,
        selectedCategory: category 
      });
    }
  } catch (error) {
    console.log("Product page not found", error);
    return res.status(500).render("pageNotFound", { message: error.message });
  }  
};

const loadProductDetailPage = async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) {
      return res.status(400).send({ message: "Product ID is required" });
    }
    const product = await Product.findById(id)
      .populate("category")
      .populate("brand");
    const newArrivals = await Product.find({ _id: { $ne: id } })
      .sort({ createdAt: -1 })
      .limit(4);
    if (!product) {
      return res
        .status(404)
        .render("pageNotFound", { message: "Product not found" });
    }
    const user = req.session.user || req.user;
    let cartCount = 0 ;
    if (user) {
      const userData = await User.findOne({ _id: user._id });
      const cart = await Cart.findOne({ userId: user._id });
      
      if (cart) {
        cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);
      }
      return res.render("product-detail", {
        product,
        user: userData,
        newArrivals,
        cartCount
      });
    } else {
      return res.render("product-detail", { product, newArrivals });
    }
  } catch (error) {
    console.error("Error loading product detail page:", error);
    res.status(500).render("pageNotFound", { message: "Server error" });
  }
};


module.exports = {
  loadProductPage,
  loadProductDetailPage,
};
