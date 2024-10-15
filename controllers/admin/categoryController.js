const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");

const categoryInfo = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const skip = (page - 1) * limit;

    const categoryData = await Category.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCategories = await Category.countDocuments();
    const totalPages = Math.ceil(totalCategories / limit);
    res.render("category", {
      cat: categoryData,
      currentPage: page,
      totalPages: totalPages,
      totalCategories: totalCategories,
    });
  } catch (error) {
    console.error(error);
    res.redirect("/pageerror");
  }
};

const addCategory = async (req, res) => {
  const { name, description } = req.body;
  try {
    const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingCategory) {
      console.log("Category exists")
      return res.status(400).json({ message: "Category already exists" });
    }

    const newCategory = new Category({
      name,
      description,
    });
    await newCategory.save();
    return res.json({ message: "Category added successfully" });
  } catch (error) {
    console.log("Error occured")
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const addCategoryOffer = async (req, res) => {
  try {
    const percentage = parseInt(req.body.percentage);
    const categoryId = req.body.categoryId;
    const category = await Category.findById(categoryId);

    if (!category) {
      return res
        .status(404)
        .json({ status: false, message: "Category not found" });
    }

    const products = await Product.find({ category: category._id });

    const hasProductOffer = products.some((product) => {
      return product.productOffer > percentage;
    });

    if (hasProductOffer) {
      return res
        .status(400)
        .json({
          status: false,
          message: "Category already has a product with a higher offer",
        });
    }

    // Update the category's offer
    await Category.updateOne(
      { _id: categoryId },
      { $set: { categoryOffer: percentage } }
    );

    // Update each product under the category with the new offer
    for (const product of products) {
      product.productOffer = percentage;
      product.salePrice =
        product.regularPrice -
        Math.floor(product.regularPrice * (percentage / 100));
      await product.save();
    }

    res.json({ status: true, message: "Category offer applied successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

const removeCategoryOffer = async (req, res) => {
  try {
    const categoryId = req.body.categoryId;
    const category = await Category.findById(categoryId);
    if (!category) {
      return res
        .status(404)
        .json({ status: false, message: "Category not found" });
    }

    const percentage = category.categoryOffer;
    const products = await Product.find({ category: category._id });

    if (products.length > 0) {
      for (const product of products) {
        product.salePrice += Math.floor(
          product.regularPrice * (percentage / 100)
        );
        product.productOffer = 0;
        await product.save();
      }
    }
    category.categoryOffer = 0;
    await category.save();
    res.json({ status: true });
  } catch (error) {
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

const getListCategory = async (req, res) => {
  try {
    let id = req.query.id;
    await Category.updateOne({ _id: id }, { $set: { isListed: true } });
    res.redirect("/admin/category");
  } catch (error) {
    res.redirect("/pageerror");
  }
};

const getUnlistCategory = async (req, res) => {
  try {
    let id = req.query.id;
    await Category.updateOne({ _id: id }, { $set: { isListed: false } });
    res.redirect("/admin/category");
  } catch (error) {
    res.redirect("/pageerror");
  }
};

const getEditCategory = async (req, res) => {
  try {
    const id = req.query.id;
    const category = await Category.findOne({ _id: id });
    res.render("edit-category", { category: category });
  } catch (error) {
    res.redirect("/pageerror");
  }
};

const editCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const { categoryName, description } = req.body;
    const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${categoryName}$`, 'i') },_id: { $ne: id }  });

    if (existingCategory) {

      const category = await Category.findById(id);
      return res.render('edit-category',{category,error:"Category already exists"});
    }

    const updateCategory = await Category.findByIdAndUpdate(
      id,
      {
        name: categoryName,
        description: description,
      },
      { new: true }
    );

    if (updateCategory) {
      res.redirect("/admin/category");
    } else {
      const category = await Category.findById(id);
      res.render("edit-category", { category, error: "Category not found" });
    }
  } catch (error) {
    const category = await Category.findById(req.params.id);
    res.render("edit-category", { category, error: "Internal Server Error" });
  }
};

const deleteCategory = async (req, res) => {
  const { categoryId } = req.body;

  if (!categoryId) {
    console.log("category not found")
    return res.status(400).json({ status: false, message: "Category ID is required" });
}

try {
  
  const result = await Category.findByIdAndUpdate(categoryId, { isDeleted: true ,isListed: false}, { new: true });

    if (!result) {
        return res.status(404).json({ status: false, message: "Category not found" });
    }
    res.status(200).json({ status: true, message: "Category deleted successfully" });
} catch (error) {
    console.error("Error deleting category:", error); // Log the error for debugging
    res.status(500).json({ status: false, message: "Failed to delete category" });
}
};

const restoreCategory = async (req, res) => {
  const { categoryId } = req.body;

  try {
      await Category.findByIdAndUpdate(categoryId, { isDeleted: false });
      res.status(200).json({ status: true, message: "Category restored successfully" });
  } catch (error) {
      res.status(500).json({ status: false, message: "Failed to restore category" });
  }
};

module.exports = {
  categoryInfo,
  addCategory,
  addCategoryOffer,
  removeCategoryOffer,
  getListCategory,
  getUnlistCategory,
  getEditCategory,
  editCategory,
  deleteCategory,
  restoreCategory
};
