const User = require("../../models/userSchema");

const customerInfo = async (req, res) => {
  try {
    let search = "";
    if (req.query.search) {
      search = req.query.search;
    }
    let page = 1;
    if (req.query.page) {
      page = req.query.page;
    }
    const limit = 4;
    const userData = await User.find({
      isAdmin: false,
      $or: [
        { firstName: { $regex: ".*" + search + ".*" } },
        { lastName: { $regex: ".*" + search + ".*" } },
        { email: { $regex: ".*" + search + ".*" } },
      ],
    })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await User.find({
      isAdmin: false,
      $or: [
        { firstName: { $regex: ".*" + search + ".*" } },
        { lastName: { $regex: ".*" + search + ".*" } },
        { email: { $regex: ".*" + search + ".*" } },
      ],
    }).countDocuments();

    const totalPages = Math.ceil(count / limit);

    console.log("page rendered");
    res.render("customers", {
      data: userData,
      count,
      search,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    console.log("page not rendered");
  }
};

const customerBlocked = async (req, res) => {
  try {
    let id = req.body.userId;
    await User.updateOne({ _id: id }, { $set: { isBlocked: true } });
    res.json({ status: true });
  } catch (error) {
    res.json({ status: false, message: "Failed to block user" });
  }
};

const customerUnBlocked = async (req, res) => {
  try {
    let id = req.body.userId;
    await User.updateOne({ _id: id }, { $set: { isBlocked: false } });
    res.json({ status: true });
  } catch (error) {
    res.json({ status: false, message: "Failed to unblock user" });
  }
};

module.exports = {
  customerInfo,
  customerBlocked,
  customerUnBlocked,
};
