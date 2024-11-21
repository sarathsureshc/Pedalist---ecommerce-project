const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Brand = require("../../models/brandSchema");
const User = require("../../models/userSchema");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const getProductAddPage = async (req, res) => {
  try {
    const categories = await Category.find({ isListed: true });

    const brands = await Brand.find({ isBlocked: false });

    res.render("add-product", {
      cat: categories,
      brand: brands,
    });
  } catch (error) {
    console.error("Error fetching categories and brands:", error);
  }
};

const addProducts = async (req, res) => {
  try {
    console.log(req.files);

    const products = req.body;

    if (!products.category || !products.brand) {
      return res
        .status(400)
        .json({ message: "Both category and brand must be selected." });
    }

    const productExists = await Product.findOne({
      productName: products.productName,
    });

    if (!productExists) {
      const images = [];

      if (req.files && req.files.length > 0) {
        for (let i = 0; i < req.files.length; i++) {
          const originalImagePath = req.files[i].path;
          console.log(`Original filename: ${req.files[i].filename}`);

          const resizedImagePath = path.join(
            "public",
            "uploads",
            "product-images",
            req.files[i].filename,
          );
          await sharp(originalImagePath)
            .resize({ width: 440, height: 440 })
            .toFile(resizedImagePath);
          images.push(req.files[i].filename);
        }
      }

      const category = await Category.findOne({ name: products.category });
      const brand = await Brand.findOne({ brandName: products.brand });

      if (!category) {
        return res.status(400).json({ message: "Invalid category name" });
      }
      if (!brand) {
        return res.status(400).json({ message: "Invalid brand name" });
      }

      const newProduct = new Product({
        productName: products.productName,
        specification1: products.specification1,
        specification2: products.specification2,
        specification3: products.specification3,
        specification4: products.specification4,
        brand: brand._id, // Using ObjectId from Brand
        category: category._id, // Using ObjectId from Category
        price: products.price,
        createdOn: new Date(),
        quantity: products.quantity,
        description: products.description,
        color: products.color,
        image: images,
        status: "Available",
      });

      await newProduct.save();
      console.log("Product saved successfully");
      return res.redirect("/admin/products");
    } else {
      return res.status(409).json({ message: "Product already exists" });
    }
  } catch (error) {
    console.error("Error saving product: ", error);
    return res.redirect("/admin/pageerror");
  }
};

const getProductPage = async (req, res) => {
  try {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const skip = (page - 1) * limit;

    const productData = await Product.find({
      productName: { $regex: new RegExp(".*" + search + ".*", "i") },
    })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("category")
      .populate("brand")
      .exec();

    const count = await Product.find({
      productName: { $regex: new RegExp(".*" + search + ".*") },
    }).countDocuments();

    category = await Category.find({ isListed: true });
    brand = await Brand.find({ isBlocked: false });

    if (category && brand) {
      res.render("products", {
        data: productData,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        cat: category,
        brand: brand,
        search: search,
      });
    } else {
      res.render("page-404");
    }
  } catch (error) {
    console.log("The error is :", error);
    res.redirect("/pageerror");
  }
};

const getListProduct = async (req, res) => {
  try {
    let id = req.query.id;
    await Product.updateOne({ _id: id }, { $set: { isListed: true } });
    res.redirect("/admin/products");
  } catch (error) {
    console.error("Error unblocking product:", error);
    res.redirect("/pageerror");
  }
};

const getUnlistProduct = async (req, res) => {
  try {
    let id = req.query.id;

    await Product.updateOne({ _id: id }, { $set: { isListed: false } });

    res.redirect("/admin/products");
  } catch (error) {
    console.error("Error blocking product:", error);
    res.redirect("/pageerror");
  }
};

const deleteProduct = async (req, res) => {
  const { productId } = req.body;

  console.log(req.body);

  if (!productId) {
    console.log("Product ID not provided");
    return res.status(400).json({ message: "Product ID not found" });
  }

  try {
    // Check if the product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Update the product
    const result = await Product.findByIdAndUpdate(
      productId,
      { isDeleted: true, isListed: false },
      { new: true },
    );

    res
      .status(200)
      .json({ status: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res
      .status(500)
      .json({ status: false, message: "Failed to delete product" });
  }
};

const restoreProduct = async (req, res) => {
  const { productId } = req.body;

  try {
    await Product.findByIdAndUpdate(productId, { isDeleted: false });
    res
      .status(200)
      .json({ status: true, message: "Product restored successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ status: false, message: "Failed to restore product" });
  }
};

const getEditProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const product = await Product.findOne({ _id: id })
      .populate("brand")
      .populate("category");
    const category = await Category.find({});
    const brand = await Brand.find({});
    // console.log(product);
    res.render("edit-Product", {
      product: product,
      cat: category,
      brand: brand,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.redirect("/pageerror");
  }
};

const editProduct = async (req, res) => {
  try {
    const id = req.params.id;
    console.log(id);
    const product = await Product.findOne({ _id: id });
    const data = req.body;
    const existingProduct = await Product.findOne({
      productName: data.productName,
      _id: { $ne: id },
    });
    console.log(existingProduct);
    console.log(product);

    if (existingProduct) {
      return res
        .status(400)
        .json({
          error:
            "Product with this name already exists. Please try another name.",
        });
    }

    var images = [];

    // Handle file uploads
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const originalImagePath = req.files[i].path;
        console.log(`Original filename: ${req.files[i].filename}`);

        const resizedImagePath = path.join(
          "public",
          "uploads",
          "product-images",
          req.files[i].filename,
        );

        // Resize the image
        await sharp(originalImagePath)
          .resize({ width: 440, height: 440 })
          .toFile(resizedImagePath);

        images.push(req.files[i].filename);
      }
    }

    const updateFields = {
      productName: data.productName,
      specification1: data.specification1,
      specification2: data.specification2,
      specification3: data.specification3,
      specification4: data.specification4,
      brand: data.brand,
      category: data.category,
      price: data.price,
      quantity: data.quantity,
      description: data.description,
      color: data.color,
    };

    if (images.length > 0) {
      updateFields.$push = { image: { $each: images } };
    }

    await Product.findByIdAndUpdate(id, updateFields, { new: true });
    console.log("updated successfully");
    res.redirect("/admin/products");
  } catch (error) {
    console.error("Error editing product:", error);
    res.redirect("/pageerror");
  }
};

const deleteSingleImage = async (req, res) => {
  try {
    const { imageNameToServer, productIdToServer } = req.body;
    console.log(imageNameToServer, productIdToServer);
    const product = await Product.findByIdAndUpdate(productIdToServer, {
      $pull: { image: imageNameToServer },
    });
    console.log(product);
    const imagePath = path.join(
      "public",
      "uploads",
      "product-images",
      imageNameToServer,
    );
    if (fs.existsSync(imagePath)) {
      await fs.unlinkSync(imagePath);
      console.log(`Image ${imageNameToServer} deleted successfully`);
    } else {
      console.log(`Image ${imageNameToServer} does not exist`);
    }
    res.send({ status: true });
  } catch (error) {
    res.redirect("/pageerror");
  }
};

module.exports = {
  getProductAddPage,
  addProducts,
  getProductPage,
  getListProduct,
  getUnlistProduct,
  deleteProduct,
  restoreProduct,
  getEditProduct,
  editProduct,
  deleteSingleImage,
};
