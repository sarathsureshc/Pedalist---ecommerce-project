const Brand = require("../../models/brandSchema");
const Product = require("../../models/productSchema");


const getBrandPage = async (req,res)=>{
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;
        const brandData = await Brand.find({}).sort({createdAt:-1}).skip(skip).limit(limit);
        const totalBrands = await Brand.countDocuments();
        const totalPages = Math.ceil(totalBrands / limit);
        const reverseBrand = brandData.reverse();
        res.render("brands",{
            data: reverseBrand,
            currentPage: page,
            totalPages: totalPages,
            totalBrands: totalBrands,
            
        })
        
    } catch (error) {
        res.redirect('/pageerror');
    }
}

const addBrand = async(req,res)=>{
    try {

        const brand = req.body.name;
        const findBrand = await Brand.findOne({ brandName: { $regex: new RegExp("^" + brand + "$", "i") } });
        if(!findBrand){
            const image = req.file.filename;
            const newBrand = new Brand({
                brandName : brand,
                brandImage : image
            });
            await newBrand.save();
            res.redirect('/admin/brands');
        }else{
            res.status(400).json({ message: "Brand already exists" });
        }

}
catch (error){

    res.redirect("/pageerror");

}}

const getUnblockBrand = async(req, res)=>{
    try {

        let id = req. query.id;
        await Brand.updateOne({_id:id},{$set: { isBlocked: false}});
        res.redirect('/admin/brands');
        
    } catch (error) {
        res.redirect("/pageerror");
    }

}

const getBlockBrand = async(req, res)=>{
    try {

        let id = req.query.id;
        await Brand.updateOne({_id:id},{$set: { isBlocked: true}});
        res.redirect('/admin/brands');
        
    } catch (error) {
        res.redirect("/pageerror");
        
    }

}

module.exports = {
    getBrandPage,
    addBrand,
    getUnblockBrand,
    getBlockBrand
}