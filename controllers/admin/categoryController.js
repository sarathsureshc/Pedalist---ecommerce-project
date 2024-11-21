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
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });
    if (existingCategory) {
      console.log("Category exists");
      return res.status(400).json({ message: "Category already exists" });
    }

    const newCategory = new Category({
      name,
      description,
    });
    await newCategory.save();
    return res.json({ message: "Category added successfully" });
  } catch (error) {
    console.log("Error occured");
    return res.status(500).json({ error: "Internal Server Error" });
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
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${categoryName}$`, "i") },
      _id: { $ne: id },
    });

    if (existingCategory) {
      const category = await Category.findById(id);
      return res.render("edit-category", {
        category,
        error: "Category already exists",
      });
    }

    const updateCategory = await Category.findByIdAndUpdate(
      id,
      {
        name: categoryName,
        description: description,
      },
      { new: true },
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
    console.log("category not found");
    return res
      .status(400)
      .json({ status: false, message: "Category ID is required" });
  }

  try {
    const result = await Category.findByIdAndUpdate(
      categoryId,
      { isDeleted: true, isListed: false },
      { new: true },
    );

    if (!result) {
      return res
        .status(404)
        .json({ status: false, message: "Category not found" });
    }
    res
      .status(200)
      .json({ status: true, message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res
      .status(500)
      .json({ status: false, message: "Failed to delete category" });
  }
};

const restoreCategory = async (req, res) => {
  const { categoryId } = req.body;

  try {
    await Category.findByIdAndUpdate(categoryId, { isDeleted: false });
    res
      .status(200)
      .json({ status: true, message: "Category restored successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ status: false, message: "Failed to restore category" });
  }
};

module.exports = {
  categoryInfo,
  addCategory,
  getListCategory,
  getUnlistCategory,
  getEditCategory,
  editCategory,
  deleteCategory,
  restoreCategory,
};
