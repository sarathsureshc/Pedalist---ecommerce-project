const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Order = require("../../models/orderSchema");
const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

const getSalesReport = async (req, res) => {
    try {
      
        const match = {}; 

        const salesData = await Order.aggregate([
            {
                $match: match
            },
            {
                $unwind: "$items"
            },
            {
                $group: {
                    _id: "$items.product",
                    totalSalesCount: { $sum: "$items.quantity" }
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            {
                $unwind: "$productDetails"
            },
            {
                $project: {
                    productName: "$productDetails.productName",
                    totalSalesCount: 1,
                    totalRevenue: {
                        $multiply: ["$totalSalesCount", "$productDetails.price"]
                    }
                }
            }
        ]);

        res.render('sales-report', { salesData });

    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};



const downloadSalesReportPDF = async (req, res) => {
    try {
        console.log("pdf started");
        const salesData = await getSalesData({});
        const doc = new PDFDocument();
        let filename = `sales-report-${new Date().toISOString()}.pdf`;
        res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-type', 'application/pdf');

        doc.pipe(res);
        doc.fontSize(25).text('Sales Report', { align: 'center' });
        doc.moveDown();
        
        // Table headers
        doc.fontSize(12).text('Product Name          Total Sales Count      Total Revenue', { align: 'left' });
        doc.moveDown();

        // Table rows
        salesData.forEach(sale => {
            doc.text(`${sale.productName}          ${sale.totalSalesCount}          ₹${sale.totalRevenue.toFixed(2)}`, { align: 'left' });
        });

        doc.end();

    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

const downloadSalesReportExcel = async (req, res) => {
    try {
        console.log("excel started");
        const salesData = await getSalesData({});
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');

        // Add header row
        worksheet.columns = [
            { header: 'Product Name', key: 'productName', width: 30 },
            { header: 'Total Sales Count', key: 'totalSalesCount', width: 20 },
            { header: 'Total Revenue', key: 'totalRevenue', width: 20 }
        ];

        // Add data rows
        salesData.forEach(sale => {
            worksheet.addRow({
                productName: sale.productName,
                totalSalesCount: sale.totalSalesCount,
                totalRevenue: `₹${sale.totalRevenue.toFixed(2)}`
            });
        });

        const filename = `sales-report-${new Date().toISOString()}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

const getSalesData = async (match) => {
    return await Order.aggregate([
        { $match: match }, 
        { $unwind: "$items" },
        { $group: { _id: "$items.product", totalSalesCount: { $sum: "$items.quantity" } } },
        { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "productDetails" } },
        { $unwind: "$productDetails" },
        { $project: { productName: "$productDetails.productName", totalSalesCount: 1, totalRevenue: { $multiply: ["$totalSalesCount", "$productDetails.price"] } } }
    ]);
};

module.exports = {
    getSalesReport,
    downloadSalesReportPDF,
    downloadSalesReportExcel
};
