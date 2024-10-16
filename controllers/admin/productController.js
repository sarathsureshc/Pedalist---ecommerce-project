const Product = require("../../models/productSchema")
const Category = require("../../models/categorySchema")
const Brand = require("../../models/brandSchema")
const User = require("../../models/userSchema")
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");




const getProductAddPage = async (req, res) => {
    try {

        const categories = await Category.find({ isListed: true });

        const brands = await Brand.find({ isBlocked: false });

        res.render('add-product', {
            cat: categories,
            brand: brands
        });
    } catch (error) {
        console.error("Error fetching categories and brands:", error); // Log the error for debugging
        res.redirect("/pageerror");
    }
};


const addProducts = async(req,res)=>{
    try {

        const product = req.body;
        const productExists = await Product.findOne({
            productName: product.productName,
            
        });

        if(!productExists){
            const images =[];

            if(req.files && req.files.length > 0){
                for(let i=0; i<req.files.length; i++){
                    const originalImagePath = req.files[i].path;

                    const resizedImagePath = path.join('public','uploads','products-images', req.files[i].filename);
                    await sharp(originalImagePath).resize({width:440,height:440}).toFile(resizedImagePath);
                    images.push(req.files[i].filename);
                }
        }
        const category = await Category.findOne({ name: products.category });

        if(!categoryId){
            return res.status(404).join("Invalid category name");
        }
        const newProduct = new Product({
            productName: product.productName,
            specification1: product.specification1,
            specification2: product.specification2,
            specification3: product.specification3,
            specification4: product.specification4,
            brand: product.brand,
            category:categoryId._id,
            price: product.price,
            createdOn:new Date(),
            quantity: product.quantity,
            description: product.description,
            size: product.size,
            color: product.color,
            productImage: images,
            status: 'Available'
        });
        await newProduct.save();
        return res.redirect("/admin/addProduct");
    }else{
        return res.status(400).json({ message: "Product already exists" });
    }
        
    } catch (error) {
        console.error("Error saving product ",error);
        return res.redirect("/admin/pageerror");
        
    }
}

const getProductPage = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;
        // Fetch products in descending order
        const productData = await Product.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit);
        const totalProducts = await Product.countDocuments();
        const totalPages = Math.ceil(totalProducts / limit);

        res.render("products", {
            data: productData, // Send data directly without reversing
            currentPage: page,
            totalPages: totalPages,
            totalProducts: totalProducts,
        });

    } catch (error) {
        res.redirect("/pageerror");
    }
}



module.exports = {
    getProductAddPage,
    addProducts,
    getProductPage
}