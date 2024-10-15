const Product = require("../../models/productSchema")
const category = require("../../models/categorySchema")
const User = require("../../models/userSchema")
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const Category = require("../../models/categorySchema");



const getProductAddPage = async(req,res)=>{
    try {
        
        const category =await Category.find({isListed:true});
        const brand = await Brand.find({isBlocked:false});
        res.render('add-product',{
            cat:category,
            brand:brand
        });

    } catch (error) {
        res.redirect("/pageerror")
    }
};

const addProducts = async(req,res)=>{
    try {

        const product = req.body;
        const productExists = await Product.findOne({
            productName: products.productName,
            
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
            productName: products.productName,
            specification1: products.specification1,
            specification2: products.specification2,
            specification3: products.specification3,
            specification4: products.specification4,
            brand: products.brand,
            category:categoryId._id,
            price: products.price,
            createdOn:new Date(),
            quantity: products.quantity,
            description: products.description,
            size: products.size,
            color: products.color,
            productImage: images,
            status: 'Available'
        });
        await newProduct.save();
        return res.redirect("/admin/addProducts");
    }else{
        return res.status(400).json({ message: "Product already exists" });
    }
        
    } catch (error) {
        console.error("Error saving product ",error);
        return res.redirect("/admin/pageerror");
        
    }
}


module.exports = {
    getProductAddPage,
    addProducts
}