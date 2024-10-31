const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Brand = require("../../models/brandSchema");
const Offer = require("../../models/offerSchema");

const getOfferPage = async (req, res) => {
    try {
        
        const limit = 4; 
        const currentPage = parseInt(req.query.page) || 1;
        const searchQuery = req.query.search || "";

      
        const searchCriteria = searchQuery 
            ? { offerName: { $regex: searchQuery, $options: "i" } } 
            : {};

  
        const totalOffers = await Offer.countDocuments(searchCriteria);
        const totalPages = Math.ceil(totalOffers / limit);

       
        const offers = await Offer.find(searchCriteria)
            .skip((currentPage - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 }); 

 
        res.render("offer-management", {
            data: offers,
            search: searchQuery,
            currentPage,
            totalPages
        });
    } catch (error) {
        console.error("Error loading offer page:", error);
        res.status(500).send("Internal Server Error");
    }
};

const getAddOfferPage = async (req, res) => {
    try {
        const products = await Product.find({ isDeleted: false });
        const categories = await Category.find({ isDeleted: false });
        const brands = await Brand.find({ isDeleted: false });
        res.render('add-offer', { products, categories, brands });
    } catch (error) {
        console.error('Error loading add offer page:', error);
        res.status(500).send('Internal Server Error');
    }
};

const addOffer = async (req, res) => {
    const { offerName, discountDescription, offerGroup, productsIncluded, categoriesIncluded, brandsIncluded, 
            startDate, endDate, minPurchaseAmount, maxDiscountAmount, offerType, offerValue } = req.body;

    if (offerType === 'Percentage' && offerValue > 92) {
        return res.status(400).send('Percentage offer value cannot exceed 92.');
    }

    try {
        const offerData = {
            offerName,
            discountDescription,
            offerGroup,
            startDate,
            endDate,
            minPurchaseAmount,
            maxDiscountAmount,
            offerType,
            offerValue
        };

        if (offerGroup === 'Product') offerData.productsIncluded = productsIncluded;
        if (offerGroup === 'Category') offerData.categoriesIncluded = categoriesIncluded;
        if (offerGroup === 'Brand') offerData.brandsIncluded = brandsIncluded;

        const newOffer = new Offer(offerData);
        await newOffer.save();
        res.redirect('/admin/offers');
    } catch (error) {
        console.error('Error creating offer:', error);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = {
    getOfferPage,
    getAddOfferPage,
    addOffer

}