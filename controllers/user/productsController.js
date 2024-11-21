const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Brand = require("../../models/brandSchema");
const Cart = require("../../models/cartSchema");
const Offer = require("../../models/offerSchema");

const loadProductPage = async (req, res) => {
  try {
    const {
      sortBy,
      showOutOfStock = "false",
      category,
      search,
      minPrice,
      maxPrice,
      page = 1, // Default to page 1
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

    // Fetch all active offers
    const offers = await Offer.find({ isActive: true, isDeleted: false });

    // Count total products matching the filter
    const totalProducts = await Product.countDocuments(filterConditions);
    const totalPages = Math.ceil(totalProducts / 6); // Calculate total pages

    // Build the sort object based on the sortBy parameter
    let sortOptions = {};
    switch (sortBy) {
      case "popularity":
        sortOptions.popularity = -1;
        break;
      case "priceLowToHigh":
        sortOptions.price = 1;
        break;
      case "priceHighToLow":
        sortOptions.price = -1;
        break;
      case "averageRating":
        sortOptions.rating = -1;
        break;
      case "featured":
        sortOptions.isFeatured = -1;
        break;
      case "newArrivals":
        sortOptions.createdOn = -1;
        break;
      case "aToZ":
        sortOptions.productName = 1;
        break;
      case "zToA":
        sortOptions.productName = -1;
        break;
      default:
        break;
    }

    // Fetch products for the current page with sorting
    const products = await Product.find(filterConditions)
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
      .sort(sortOptions) // Apply sorting here
      .limit(6) // Limit to 6 products per page
      .skip((page - 1) * 6) // Skip products for previous pages
      .exec();

    const filteredProducts = products.filter(
      (product) => product.brand !== null && product.category !== null,
    );

    // Apply offers to each product
    const productsWithOffers = filteredProducts.map((product) => {
      let bestOffer = null;

      // Check applicable offers
      offers.forEach((offer) => {
        let isApplicable = false;

        // Determine if the offer is applicable based on the offerGroup
        switch (offer.offerGroup) {
          case "Brand":
            isApplicable = offer.brandsIncluded.includes(
              product.brand._id.toString(),
            );
            break;
          case "Category":
            isApplicable = offer.categoriesIncluded.includes(
              product.category._id.toString(),
            );
            break;
          case "Product":
            isApplicable = offer.productsIncluded.includes(
              product._id.toString(),
            );
            break;
        }

        // If the offer is applicable, calculate the effective discount
        if (isApplicable) {
          let effectiveDiscount = 0;

          if (offer.offerType === "Percentage") {
            effectiveDiscount = (product.price * offer.offerValue) / 100;
          } else if (offer.offerType === "Flat") {
            effectiveDiscount = offer.offerValue;
          }

          // Ensure the effective discount does not exceed the max discount amount
          if (offer.maxDiscountAmount) {
            effectiveDiscount = Math.min(
              effectiveDiscount,
              offer.maxDiscountAmount,
            );
          }

          // Determine if this is the best offer
          if (!bestOffer || effectiveDiscount > bestOffer.effectiveDiscount) {
            bestOffer = {
              offerName: offer.offerName,
              effectiveDiscount,
            };
          }
        }
      });

      // Attach the best offer to the product
      return {
        ...product.toObject(),
        bestOffer,
      };
    });

    const count = productsWithOffers.length;
    const user = req.session.user || req.user;

    const categories = await Category.find({ isListed: true });
    let cartCount = 0;

    if (user) {
      const userData = await User.findOne({ _id: user._id });
      const cart = await Cart.findOne({ userId: user._id });

      if (cart) {
        cartCount = cart.items.reduce(
          (total, item) => total + item.quantity,
          0,
        );
      }
      return res.render("product", {
        products: productsWithOffers,
        categories,
        user: userData,
        count,
        showOutOfStock,
        minPrice: minPrice || 20,
        maxPrice: maxPrice || 100000,
        cartCount,
        sortBy,
        selectedCategory: category,
        currentPage: page,
        totalPages: totalPages,
        search,
      });
    } else {
      return res.render("product", {
        products: productsWithOffers,
        categories,
        count,
        showOutOfStock,
        minPrice: minPrice || 20,
        maxPrice: maxPrice || 100000,
        sortBy,
        selectedCategory: category,
        currentPage: page,
        totalPages: totalPages,
        search,
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

    // Fetch the product with its category and brand
    const product = await Product.findById(id)
      .populate("category")
      .populate("brand");

    // Fetch all active offers
    const offers = await Offer.find({ isActive: true, isDeleted: false });

    // Determine the best offer for the product
    let bestOffer = null;

    offers.forEach((offer) => {
      let isApplicable = false;

      // Check if the offer is applicable based on the offerGroup
      switch (offer.offerGroup) {
        case "Brand":
          isApplicable = offer.brandsIncluded.includes(
            product.brand._id.toString(),
          );
          break;
        case "Category":
          isApplicable = offer.categoriesIncluded.includes(
            product.category._id.toString(),
          );
          break;
        case "Product":
          isApplicable = offer.productsIncluded.includes(
            product._id.toString(),
          );
          break;
      }

      // If applicable, calculate the effective discount
      if (isApplicable) {
        let effectiveDiscount = 0;

        if (offer.offerType === "Percentage") {
          effectiveDiscount = (product.price * offer.offerValue) / 100;
        } else if (offer.offerType === "Flat") {
          effectiveDiscount = offer.offerValue;
        }

        // Ensure the effective discount does not exceed the max discount amount
        if (offer.maxDiscountAmount) {
          effectiveDiscount = Math.min(
            effectiveDiscount,
            offer.maxDiscountAmount,
          );
        }

        // Determine if this is the best offer
        if (!bestOffer || effectiveDiscount > bestOffer.effectiveDiscount) {
          bestOffer = {
            offerName: offer.offerName,
            effectiveDiscount,
          };
        }
      }
    });

    // Fetch new arrivals
    const newArrivals = await Product.find({ _id: { $ne: id } })
      .sort({ createdOn: -1 })
      .limit(4);

    if (!product) {
      return res
        .status(404)
        .render("pageNotFound", { message: "Product not found" });
    }

    const user = req.session.user || req.user;
    let cartCount = 0;

    if (user) {
      const userData = await User.findOne({ _id: user._id });
      const cart = await Cart.findOne({ userId: user._id });

      if (cart) {
        cartCount = cart.items.reduce(
          (total, item) => total + item.quantity,
          0,
        );
      }
      return res.render("product-detail", {
        product,
        bestOffer, // Pass the best offer to the view
        user: userData,
        newArrivals,
        cartCount,
      });
    } else {
      return res.render("product-detail", { product, bestOffer, newArrivals });
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
