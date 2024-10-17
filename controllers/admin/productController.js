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
            req.files[i].filename
          );
          await sharp(originalImagePath)
            .resize({ width: 440, height: 440 })
            .toFile(resizedImagePath);
          images.push(req.files[i].filename);
        }
      }

      const category = await Category.findOne({ name: products.category });

      if (!category) {
        return res.status(400).join("Invalid category name");
      }
      const newProduct = new Product({
        productName: products.productName,
        specification1: products.specification1,
        specification2: products.specification2,
        specification3: products.specification3,
        specification4: products.specification4,
        brand: products.brand,
        category: category._id,
        price: products.price,
        createdOn: new Date(),
        quantity: products.quantity,
        description: products.description,
        color: products.color,
        image: images,
        status: "Available",
      });
      console.log("Product saved successfully");
      await newProduct.save();
      return res.redirect("/admin/addProduct");
    } else {
      return res.status(400).json({ message: "Product already exists" });
    }
  } catch (error) {
    console.error("Error saving product ", error);
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
      $or: [
        { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
        { brand: { $regex: new RegExp(".*" + search + ".*", "i") } },
      ],
    })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("category")
      .exec();

    const count = await Product.find({
      $or: [
        { productName: { $regex: new RegExp(".*" + search + ".*") } },
        { brand: { $regex: new RegExp(".*" + search + ".*", "i") } },
      ],
    }).countDocuments();

    const category = await Category.find({ isListed: true });
    const brand = await Brand.find({ isBlocked: true });

    if (category && brand) {
      res.render("products", {
        data: productData,
        currentPage: page,
        totalPages: page,
        totalPages: Math.ceil(count / limit),
        cat: category,
        brand: brand,
        search: search,
      });
    } else {
      res.render("page-404");
    }
  } catch (error) {
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

  if (!productId) {
    console.log("Product not found");
    return res.status(400).json({ message: "Product not found" });
  }
  try {
    const result = await Product.findByIdAndUpdate(
      productId,
      { isDeleted: true, isListed: false },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ message: "Product not found" });
    }
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
    const product = await Product.findOne({_id:id});
    const categories = await Category.find({});
    const brand = await Brand.find({});
    console.log(product);
    res.render("edit-Product", { 
      product : product,
      cat: categories,
      brand: brand
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.redirect("/pageerror");
  }
};

const editProduct = async (req, res) => {
  try {
    const id = req.body._id;
    const { productName } = req.body;

    let image = req.file ? req.file.filename : undefined;
    const existingProduct = await Product.findById(id);

    const duplicateProduct = await Product.findOne({
      ProductName: { $regex: new RegExp(`^${productName}$`, "i") },
      _id: { $ne: id },
    });
    if (duplicateProduct) {
      return res.render("edit-product", {
        product: existingProduct,
        error: " Product already exists",
      });
    }
    const updateData = {
      productName,
      specification1: req.body.specification1,
      specification2: req.body.specification2,
      specification3: req.body.specification3,
      specification4: req.body.specification4,
      brand: req.body.brand,
      price: req.body.price,
      quantity: req.body.quantity,
      description: req.body.description,
      color: req.body.color,
      image: image || existingProduct.image,
    };

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (updatedProduct) {
      res.redirect("/admin/editProduct");
    } else {
      return res.render("edit-product", {
        product: existingProduct,
        error: "Failed to update product",
      });
    }
  } catch (error) {
    console.error("Error editing product:", error);
    const product = await Product.findById(req.params.id);
    res.render("edit-product", { product, error: "Interna Server Error" });
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
};
