const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Order = require("../../models/orderSchema");
const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

const getSalesReport = async (req, res) => {
  const { filterType, startDate, endDate } = req.query;
  let match = {};

  // Filter by date range based on filterType
  if (filterType === "custom" && startDate && endDate) {
    match.invoiceDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  } else if (filterType === "daily") {
    const today = new Date();
    match.invoiceDate = {
      $gte: new Date(today.setHours(0, 0, 0, 0)),
      $lte: new Date(today.setHours(23, 59, 59, 999)),
    };
  } else if (filterType === "weekly") {
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    match.invoiceDate = {
      $gte: weekStart,
      $lte: new Date(),
    };
  } else if (filterType === "monthly") {
    const today = new Date();
    match.invoiceDate = {
      $gte: new Date(today.getFullYear(), today.getMonth(), 1),
      $lte: new Date(),
    };
  } else if (filterType === "yearly") {
    const today = new Date();
    match.invoiceDate = {
      $gte: new Date(today.getFullYear(), 0, 1),
      $lte: new Date(),
    };
  }

  // Aggregation pipeline for sales data
  const salesData = await Order.aggregate([
    { $match: match },
    { $unwind: "$items" },
    { $match: { "items.status": { $in: ["Placed", "Shipped", "Delivered"] } } },
    {
      $lookup: {
        from: "products",
        localField: "items.product",
        foreignField: "_id",
        as: "productDetails",
      },
    },
    { $unwind: "$productDetails" },
    {
      $group: {
        _id: "$items.product",
        productName: { $first: "$productDetails.productName" },
        price: { $first: "$productDetails.price" },
        totalSalesCount: { $sum: "$items.quantity" },
        totalRevenue: {
          $sum: { $multiply: ["$items.quantity", "$items.priceApplied"] },
        },
        totalDiscount: {
          $sum: {
            $multiply: [
              "$items.quantity",
              { $subtract: ["$productDetails.price", "$items.priceApplied"] },
            ],
          },
        },
      },
    },
    { $sort: { totalSalesCount: -1 } },
  ]);

  // Calculate total discount from sales data
  const totalDiscount = salesData.reduce(
    (acc, sale) => acc + (sale.totalDiscount || 0),
    0,
  );
  const totalSalesCount = salesData.reduce(
    (acc, sale) => acc + sale.totalSalesCount,
    0,
  );
  const totalOrderAmount = salesData.reduce(
    (acc, sale) => acc + sale.totalRevenue,
    0,
  );
  const topProduct = salesData[0];

  // Respond with JSON if AJAX request
  if (req.xhr) {
    return res.json({
      salesData,
      totalSalesCount,
      totalOrderAmount,
      totalDiscount,
      topProduct,
    });
  }

  // Render the sales report view with the calculated data
  res.render("sales-report", {
    salesData,
    totalSalesCount,
    totalOrderAmount,
    totalDiscount,
    topProduct,
    filterType,
    startDate,
    endDate,
  });
};

const downloadSalesReportPDF = async (req, res) => {
  try {
    const filters = {
      filterType: req.query.filterType || "all",
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };
    const salesData = await getSalesData(filters);

    const totalSalesCount = salesData.reduce(
      (acc, sale) => acc + sale.totalSalesCount,
      0,
    );
    const totalOrderAmount = salesData.reduce(
      (acc, sale) => acc + sale.totalRevenue,
      0,
    );
    const totalDiscount = salesData.reduce(
      (acc, sale) => acc + (sale.productDiscount || 0),
      0,
    );

    const doc = new PDFDocument();
    let filename = `sales-report-${new Date().toISOString()}.pdf`;
    res.setHeader("Content-disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-type", "application/pdf");

    doc.pipe(res);
    doc.font("C:/Windows/Fonts/Arial.ttf");

    doc.fontSize(25).text("Pedalist Bikes", { align: "center" }).moveDown();
    doc.fontSize(20).text("Sales Report", { align: "center" }).moveDown();

    const currentDate = new Date().toLocaleDateString();
    doc
      .fontSize(12)
      .text(`Date: ${currentDate}`, { align: "center" })
      .moveDown();

    let salesDateRange =
      filters.filterType === "custom"
        ? `Sales Date: ${new Date(filters.startDate).toLocaleDateString()} - ${new Date(filters.endDate).toLocaleDateString()}`
        : `Sales Date: ${filters.filterType.charAt(0).toUpperCase() + filters.filterType.slice(1)}`;

    doc.fontSize(12).text(salesDateRange, { align: "center" }).moveDown();

    doc.fontSize(12).text(`Total Sales Count: ${totalSalesCount}`);
    doc.text(`Total Order Amount: ₹${totalOrderAmount.toFixed(2)}`);
    doc.text(`Total Discounts: ₹${totalDiscount.toFixed(2)}`).moveDown();

    const tableTop = doc.y + 20;
    const tableWidth = 500;
    const columnWidths = [200, 100, 100, 100];
    const headers = [
      "Product Name",
      "Total Sales Count",
      "Total Revenue",
      "Discounts",
    ];

    doc.fontSize(12).font("Helvetica-Bold");
    headers.forEach((header, index) => {
      doc.text(
        header,
        10 + columnWidths.slice(0, index).reduce((a, b) => a + b, 0) + 10,
        tableTop,
        { width: columnWidths[index], align: "center" },
      );
    });

    doc.font("Helvetica");
    salesData.forEach((sale, index) => {
      const rowY = tableTop + 40 + index * 20;
      doc.text(sale.productName, 10 + 10, rowY, {
        width: columnWidths[0],
        align: "left",
      });
      doc.text(
        sale.totalSalesCount.toString(),
        10 + columnWidths[0] + 10,
        rowY,
        { width: columnWidths[1], align: "center" },
      );
      doc.text(
        `₹${sale.totalRevenue.toFixed(2)}`,
        10 + columnWidths[0] + columnWidths[1] + 10,
        rowY,
        { width: columnWidths[2], align: "right" },
      );
      doc.text(
        `₹${sale.productDiscount ? sale.productDiscount.toFixed(2) : "0.00"}`,
        10 + columnWidths[0] + columnWidths[1] + columnWidths[2] + 10,
        rowY,
        { width: columnWidths[3], align: "right" },
      );
    });

    const lastRowY = tableTop + 40 + salesData.length * 20;

    // Footer section
    doc.moveDown(10);
    doc.fontSize(10).text("Thank you for your business!", { align: "left" });
    doc.text(
      "For any inquiries, please contact us at support@pedalistbikes.com",
      { align: "left" },
    );

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error while generating the PDF report.");
  }
};

const downloadSalesReportExcel = async (req, res) => {
  try {
    const filters = {
      filterType: req.query.filterType || "all",
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };
    const salesData = await getSalesData(filters);

    // Calculate totals
    const totalSalesCount = salesData.reduce(
      (acc, sale) => acc + sale.totalSalesCount,
      0,
    );
    const totalOrderAmount = salesData.reduce(
      (acc, sale) => acc + sale.totalRevenue,
      0,
    );
    const totalDiscount = salesData.reduce(
      (acc, sale) => acc + (sale.productDiscount || 0),
      0,
    );

    const workbook = new ExcelJS.Workbook();
    const summarySheet = workbook.addWorksheet("Sales Summary");
    const reportSheet = workbook.addWorksheet("Sales Report");

    // Headline
    summarySheet.mergeCells("A1:D1");
    summarySheet.getCell("A1").value = "Pedalist Bikes";
    summarySheet.getCell("A1").font = { size: 20, bold: true };
    summarySheet.mergeCells("A2:D2");
    summarySheet.getCell("A2").value = "Sales Report";
    summarySheet.getCell("A2").font = { size: 18, bold: true };

    // Current Date
    const currentDate = new Date().toLocaleDateString();
    summarySheet.mergeCells("A3:D3");
    summarySheet.getCell("A3").value = `Date: ${currentDate}`;
    summarySheet.getCell("A3").font = { size: 12 };

    // Sales Date Range
    const salesDateRange =
      filters.filterType === "custom"
        ? `Sales Date: ${new Date(filters.startDate).toLocaleDateString()} - ${new Date(filters.endDate).toLocaleDateString()}`
        : `Sales Date: ${filters.filterType.charAt(0).toUpperCase() + filters.filterType.slice(1)}`;

    summarySheet.mergeCells("A4:D4");
    summarySheet.getCell("A4").value = salesDateRange;
    summarySheet.getCell("A4").font = { size: 12 };

    // Summary Data
    summarySheet.addRow([]);
    summarySheet.addRow(["Total Sales Count", totalSalesCount]);
    summarySheet.addRow([
      "Total Order Amount",
      `₹${totalOrderAmount.toFixed(2)}`,
    ]);
    summarySheet.addRow(["Total Discounts", `₹${totalDiscount.toFixed(2)}`]);

    // Report sheet headers
    reportSheet.columns = [
      { header: "Product Name", key: "productName", width: 30 },
      { header: "Total Sales Count", key: "totalSalesCount", width: 20 },
      { header: "Total Revenue", key: "totalRevenue", width: 20 },
      { header: "Discounts", key: "discount", width: 20 },
    ];

    // Add data rows
    salesData.forEach((sale) => {
      reportSheet.addRow({
        productName: sale.productName,
        totalSalesCount: sale.totalSalesCount,
        totalRevenue: `₹${sale.totalRevenue.toFixed(2)}`,
        discount: `₹${sale.productDiscount ? sale.productDiscount.toFixed(2) : "0.00"}`,
      });
    });

    const filename = `sales-report-${new Date().toISOString()}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error while generating the Excel report.");
  }
};

const getSalesData = async (filters) => {
  try {
    const match = {};

    if (filters.startDate && filters.endDate) {
      match.invoiceDate = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate),
      };
    }

    const salesData = await Order.aggregate([
      { $match: match },
      { $unwind: "$items" },
      {
        $match: { "items.status": { $in: ["Placed", "Shipped", "Delivered"] } },
      }, // Filter by item status
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: "$items.product",
          productName: { $first: "$productDetails.productName" },
          price: { $first: "$productDetails.price" },
          totalSalesCount: { $sum: "$items.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$items.quantity", "$items.priceApplied"] },
          },
          productDiscount: {
            $sum: {
              $multiply: [
                "$items.quantity",
                { $subtract: ["$productDetails.price", "$items.priceApplied"] },
              ],
            },
          },
        },
      },
      { $sort: { totalSalesCount: -1 } },
    ]);

    return salesData;
  } catch (error) {
    console.error("Error fetching sales data:", error);
    throw new Error("Could not fetch sales data");
  }
};

module.exports = {
  getSalesReport,
  downloadSalesReportPDF,
  downloadSalesReportExcel,
  getSalesData,
};
