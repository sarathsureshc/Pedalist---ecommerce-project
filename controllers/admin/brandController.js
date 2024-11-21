const Brand = require("../../models/brandSchema");
const Product = require("../../models/productSchema");

const getBrandPage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const skip = (page - 1) * limit;
    const brandData = await Brand.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const totalBrands = await Brand.countDocuments();
    const totalPages = Math.ceil(totalBrands / limit);
    const reverseBrand = brandData.reverse();
    res.render("brands", {
      data: reverseBrand,
      currentPage: page,
      totalPages: totalPages,
      totalBrands: totalBrands,
    });
  } catch (error) {
    res.redirect("/pageerror");
  }
};

const addBrand = async (req, res) => {
  try {
    const brand = req.body.name;
    const findBrand = await Brand.findOne({
      brandName: { $regex: new RegExp("^" + brand + "$", "i") },
    });
    if (!findBrand) {
      const image = req.file.filename;
      const newBrand = new Brand({
        brandName: brand,
        brandImage: image,
      });
      await newBrand.save();
      res.redirect("/admin/brands");
    } else {
      res.status(400).json({ message: "Brand already exists" });
    }
  } catch (error) {
    res.redirect("/pageerror");
  }
};

const getUnblockBrand = async (req, res) => {
  try {
    let id = req.query.id;
    await Brand.updateOne({ _id: id }, { $set: { isBlocked: false } });
    res.redirect("/admin/brands");
  } catch (error) {
    res.redirect("/pageerror");
  }
};

const getBlockBrand = async (req, res) => {
  try {
    let id = req.query.id;
    await Brand.updateOne({ _id: id }, { $set: { isBlocked: true } });
    res.redirect("/admin/brands");
  } catch (error) {
    res.redirect("/pageerror");
  }
};

const getEditBrand = async (req, res) => {
  try {
    const id = req.query.id;
    const brand = await Brand.findById(id);
    if (!brand) {
      return res.redirect("/pageerror");
    }
    res.render("edit-brand", { brand });
  } catch (error) {
    res.redirect("/pageerror");
  }
};

const editBrand = async (req, res) => {
  try {
    const id = req.params.id;
    const { brandName } = req.body;

    let brandImage = req.file ? req.file.filename : undefined;

    const existingBrand = await Brand.findById(id);

    const duplicateBrand = await Brand.findOne({
      brandName: { $regex: new RegExp(`^${brandName}$`, "i") },
      _id: { $ne: id },
    });
    if (duplicateBrand) {
      return res.render("edit-brand", {
        brand: existingBrand,
        error: "Brand already exists",
      });
    }

    const updateData = {
      brandName: brandName,
      brandImage: brandImage || existingBrand.brandImage,
    };

    const updatedBrand = await Brand.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (updatedBrand) {
      res.redirect("/admin/brands");
    } else {
      return res.render("edit-brand", {
        brand: existingBrand,
        error: "Brand not found",
      });
    }
  } catch (error) {
    console.error(error);
    const brand = await Brand.findById(req.params.id);
    res.render("edit-brand", { brand, error: "Internal Server Error" });
  }
};

const deleteBrand = async (req, res) => {
  const { brandId } = req.body;

  if (!brandId) {
    console.log("Brand not found");
    return res
      .status(400)
      .json({ status: false, message: "Brand ID is required" });
  }

  try {
    const result = await Brand.findByIdAndUpdate(
      brandId,
      { isDeleted: true, isBlocked: true },
      { new: true },
    );

    if (!result) {
      return res
        .status(404)
        .json({ status: false, message: "Brand not found" });
    }
    res
      .status(200)
      .json({ status: true, message: "Brand deleted successfully" });
  } catch (error) {
    console.error("Error deleting brand:", error);
    res.status(500).json({ status: false, message: "Failed to delete brand" });
  }
};

const restoreBrand = async (req, res) => {
  const { brandId } = req.body;

  try {
    await Brand.findByIdAndUpdate(brandId, { isDeleted: false });
    res
      .status(200)
      .json({ status: true, message: "Brand restored successfully" });
  } catch (error) {
    res.status(500).json({ status: true, message: "Failed to restore brand" });
  }
};

module.exports = {
  getBrandPage,
  addBrand,
  getUnblockBrand,
  getBlockBrand,
  getEditBrand,
  editBrand,
  deleteBrand,
  restoreBrand,
};
