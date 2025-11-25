const User = require("../models/userSchema");
const logger = require("../config/logger");

const userAuth = (req, res, next) => {
  if (req.session.user || req.user) {
    User.findById(req.session.user || req.user)
      .then((user) => {
        if (user && !user.isBlocked) {
          next();
        } else if (user && user.isBlocked) {
          req.session.user = null;
          return res.render("login", {
            message: "Your account is blocked by admin",
          });
        } else {
          res.redirect("/login");
        }
      })
      .catch((err) => {
        logger.error("Error in user authentication middleware:", err);
        res.status(500).send("Internal Server Error");
      });
  } else {
    next();
  }
};

const adminAuth = async (req, res, next) => {
  try {
    if (!req.session.admin) {
      return res.redirect("/admin/login");
    }

    // Verify the specific admin user exists and is actually an admin
    const admin = await User.findById(req.session.admin);

    if (!admin || !admin.isAdmin) {
      req.session.admin = null;
      logger.warn(
        `Unauthorized admin access attempt: ${req.session.admin || "unknown"}`,
      );
      return res.redirect("/admin/login");
    }

    next();
  } catch (error) {
    logger.error("Error in admin auth middleware:", error);
    res.status(500).send("Internal Server error");
  }
};

module.exports = {
  userAuth,
  adminAuth,
};
