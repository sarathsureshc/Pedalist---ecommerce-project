const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Order = require("../../models/orderSchema");
const Category = require("../../models/categorySchema");
const Brand = require("../../models/brandSchema");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const { format } = require("date-fns");

const Mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const pageerror = async (req, res) => {
  res.render("admin-error");
};

const loadLogin = (req, res) => {
  if (req.session.admin) {
    return res.redirect("/admin/dashboard");
  }
  res.render("admin-login", { message: null });
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await User.findOne({ email, isAdmin: true });

    if (admin) {
      const passwordMatch = await bcrypt.compare(password, admin.password);
      if (passwordMatch) {
        req.session.admin = true;
        console.log("Admin logged in successfully");
        return res.redirect("/admin");
      } else {
        console.log("Incorrect password for admin with email:", email);
        res.render("admin-login", { message: "Incorrect password" });
      }
    } else {
      console.log("No admin found with email:", email);
      res.render("admin-login", { message: "Wrong credentials" });
    }
  } catch (error) {
    console.error("Login Error:", error);
    return res.redirect("/pageerror");
  }
};

const loadDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const validStatuses = ["Placed", "Shipped", "Delivered"];

    // Calculate total orders based on the valid statuses
    const totalOrders = await Order.aggregate([
      { $match: { "items.status": { $in: validStatuses } } }, // Match orders with items having valid statuses
      { $group: { _id: null, count: { $sum: 1 } } }, // Count distinct orders
    ]);

    // Calculate total revenue based on the valid statuses
    const totalRevenue = await Order.aggregate([
      { $match: { "items.status": { $in: validStatuses } } }, // Match orders with items having valid statuses
      { $group: { _id: null, total: { $sum: "$totalPrice" } } }, // Sum the total price of the orders
    ]);

    // Extract values or set to zero if no results
    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;
    const ordersCount = totalOrders.length > 0 ? totalOrders[0].count : 0;

    const bestSellingProducts = await getBestSellingProducts();
    const bestSellingCategories = await getBestSellingCategories();
    const bestSellingBrands = await getBestSellingBrands();

    // console.log("Total Users:", totalUsers);
    // console.log("Total Products:", totalProducts);
    // console.log("Total Orders:", ordersCount);
    // console.log("Total Revenue:", revenue);
    // console.log("Best Selling Products:", bestSellingProducts);
    // console.log("Best Selling Categories:", bestSellingCategories);
    // console.log("Best Selling Brands:", bestSellingBrands);

    res.render("dashboard", {
      totalUsers,
      totalProducts,
      totalOrders: ordersCount,
      totalRevenue: revenue,
      bestSellingProducts,
      bestSellingCategories,
      bestSellingBrands,
    });
  } catch (error) {
    console.error(error);
    return res.redirect("/pageerror");
  }
};

const getSalesData = async (req, res) => {
    const { timeframe } = req.query;
    let match;
  
    const validStatuses = ['Placed', 'Shipped', 'Delivered'];
  
    // Define the match criteria based on the timeframe
    if (timeframe === "monthly") {
      match = {
        $match: {
          createdOn: { $gte: new Date(new Date().setFullYear(new Date().getFullYear(), 0, 1)) },
        },
      };
    } else if (timeframe === "yearly") {
      match = {
        $match: {
          createdOn: {
            $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 10)),
          },
        },
      };
    } else {
      return res.status(400).json({ error: "Invalid timeframe" });
    }
  
    try {
      const salesData = await Order.aggregate([
        match,
        { $unwind: "$items" }, // Unwind the items array
        { $match: { 'items.status': { $in: validStatuses } } }, // Filter items by status
        {
          $group: {
            _id: timeframe === "monthly" ? {
              $dateToString: { format: "%Y-%m", date: "$createdOn" }
            } : {
              $dateToString: { format: "%Y", date: "$createdOn" }
            },
            totalSales: { $sum: { $multiply: ["$items.priceApplied", "$items.quantity"] } }, // Calculate total sales
          },
        },
        { $sort: { _id: 1 } },
      ]);
  
      // Prepare labels and sales data
      let labels, sales;
  
      if (timeframe === "monthly") {
        labels = Array.from({ length: 12 }, (_, i) => {
          const date = new Date();
          date.setMonth(i);
          return date.toISOString().slice(0, 7); // Format YYYY-MM
        });
        sales = labels.map(month => {
          const found = salesData.find(data => data._id === month);
          return found ? found.totalSales : 0; // Default to 0 if no sales
        });
      } else if (timeframe === "yearly") {
        labels = Array.from({ length: 11 }, (_, i) => {
          const year = new Date().getFullYear() - i;
          return year.toString(); // Format YYYY
        }).reverse();
        sales = labels.map(year => {
          const found = salesData.find(data => data._id === year);
          return found ? found.totalSales : 0; // Default to 0 if no sales
        });
      }
  
      res.json({ labels, sales });
    } catch (error) {
      console.error("Error fetching sales data:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };

const getBestSellingProducts = async () => {
  const results = await Order.aggregate([
    { $unwind: "$items" },
    {
      $match: { "items.status": { $in: ["Placed", "Shipped", "Delivered"] } }, // Filter by item status
    },
    {
      $group: { _id: "$items.product", totalSold: { $sum: "$items.quantity" } },
    },
    { $sort: { totalSold: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
    { $project: { name: "$product.productName", totalSold: "$totalSold" } },
  ]);
  // console.log("Best Selling Products Results:", results);
  return results;
};

const getBestSellingCategories = async () => {
  const results = await Order.aggregate([
    { $unwind: "$items" },
    {
      $match: { "items.status": { $in: ["Placed", "Shipped", "Delivered"] } }, // Filter by item status
    },
    {
      $lookup: {
        from: "products",
        localField: "items.product",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
    {
      $group: {
        _id: "$product.category",
        totalSold: { $sum: "$items.quantity" },
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: "$category" },
    { $project: { name: "$category.name", totalSold: "$totalSold" } },
  ]);
  // console.log("Best Selling Categories Results:", results);
  return results;
};

const getBestSellingBrands = async () => {
  const results = await Order.aggregate([
    { $unwind: "$items" },
    {
      $match: { "items.status": { $in: ["Placed", "Shipped", "Delivered"] } }, // Filter by item status
    },
    {
      $lookup: {
        from: "products",
        localField: "items.product",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
    {
      $group: { _id: "$product.brand", totalSold: { $sum: "$items.quantity" } },
    },
    { $sort: { totalSold: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "brands",
        localField: "_id",
        foreignField: "_id",
        as: "brand",
      },
    },
    { $unwind: "$brand" },
    { $project: { name: "$brand.brandName", totalSold: "$totalSold" } },
  ]);
  // console.log("Best Selling Brands Results:", results);
  return results;
};

const generateLedger = async (req, res) => {
  const ledgerData = await Order.find(); // Customize this query as needed

  const doc = new PDFDocument();
  let filename = "ledger.pdf";
  res.setHeader(
    "Content-disposition",
    'attachment; filename="' + filename + '"'
  );
  res.setHeader("Content-type", "application/pdf");

  doc.pipe(res);

  // Load a font that supports the Rupee symbol
  doc.font("C:/Windows/Fonts/Arial.ttf"); // Ensure the path is correct

  // Title
  doc.fontSize(25).text("Ledger Book", { align: "center" });
  doc.moveDown();

  // Table Header
  const headers = ["Order ID", "Total Price", "Date"];
  const headerWidths = [250, 150, 100]; // Increased widths for better spacing
  const startX = 50; // Starting X position
  const startY = doc.y; // Starting Y position

  // Draw header
  headers.forEach((header, index) => {
    doc
      .fontSize(14)
      .text(header, startX + index * headerWidths[index], startY, {
        width: headerWidths[index],
        align: "center",
      });
  });
  doc.moveDown();

  // Draw a line under the header
  doc
    .moveTo(startX, doc.y)
    .lineTo(startX + headerWidths.reduce((a, b) => a + b, 0), doc.y)
    .stroke();
  doc.moveDown();

  // Ledger Data
  ledgerData.forEach((order) => {
    const formattedDate = new Date(order.createdOn).toLocaleDateString(); // Format the date

    // Print Order ID, Total Price, and Date in a single line
    doc
      .fontSize(12)
      .text(order._id.toString(), startX, doc.y, {
        width: headerWidths[0],
        align: "center",
      }) // Order ID
      .text(
        `₹${order.totalPrice.toFixed(2)}`,
        startX + headerWidths[0],
        doc.y,
        { width: headerWidths[1], align: "center" }
      ) // Total Price
      .text(formattedDate, startX + headerWidths[0] + headerWidths[1], doc.y, {
        width: headerWidths[2],
        align: "center",
      }); // Date

    doc.moveDown(); // Move down for spacing

    // Draw a line under each entry
    doc
      .moveTo(startX, doc.y)
      .lineTo(startX + headerWidths.reduce((a, b) => a + b, 0), doc.y)
      .stroke();
    doc.moveDown();
  });

  // Draw the outline of the table
  doc
    .rect(
      startX,
      startY,
      headerWidths.reduce((a, b) => a + b, 0),
      doc.y - startY
    )
    .stroke(); // Adjust the height as needed

  doc.end();
};

const logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.log("Error destroying session", err);
        return res.redirect("/pageerror");
      }
      console.log("Admin logged out!!");
      res.redirect("/admin/login");
    });
  } catch (error) {
    console.log("Unexpected error during logout", error);
    res.redirect("/pageerror");
  }
};

module.exports = {
  loadLogin,
  login,
  loadDashboard,
  getSalesData,
  generateLedger,
  pageerror,
  logout,
  getBestSellingProducts,
  getBestSellingCategories,
  getBestSellingBrands,
};
