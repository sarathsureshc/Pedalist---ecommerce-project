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
   console.log(req.body)
    
    
    try {
       
        const existingOffer = await Offer.findOne({
            offerName: { $regex: new RegExp('^' + offerName + '$', 'i') },
            isDeleted: false
        });

        if (existingOffer) {
            return res.status(400).send({message :'An offer with this name already exists.'});
        }

        if (offerType === 'Percentage') {
            if (offerValue > 92) {
                return res.status(400).send({message : 'Percentage offer value cannot exceed 92%.'});
            }
            if (offerValue < 0) {
                return res.status(400).send({message : 'Percentage offer value cannot be less than 0.'});
            }
        }

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
        console.log("saved",newOffer)
        res.status(200).send({success:true , message : 'Offer Added Successfully'});
    } catch (error) {
        console.error('Error creating offer:', error);
        res.status(500).send('Internal Server Error');
    }
};

const getEditOffer = async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id);
        if (!offer) {
            return res.status(404).redirect('/admin/offers'); // Redirect if the offer is not found
        }

        const products = await Product.find();
        const categories = await Category.find();
        const brands = await Brand.find();

        // Ensure that offer's properties are initialized
        offer.productsIncluded = offer.productsIncluded || [];
        offer.categoriesIncluded = offer.categoriesIncluded || [];
        offer.brandsIncluded = offer.brandsIncluded || [];

        res.render('edit-offer', { offer, products, categories, brands });
    } catch (err) {
        console.error(err);
        res.redirect('/admin/offers');
    }
};

const editOffer = async (req, res) => {
    const { 
        offerName, 
        discountDescription, 
        startDate, 
        endDate, 
        minPurchaseAmount, 
        maxDiscountAmount, 
        offerValue, 
        offerGroup, 
        offerType 
    } = req.body;
    const productsIncluded = req.body.productsIncluded || [];
    const categoriesIncluded = req.body.categoriesIncluded || [];
    const brandsIncluded = req.body.brandsIncluded || [];

    console.log("Id :" , req.params.id); 

    try {
        
        const existingOffer = await Offer.findOne({
            offerName: { $regex: new RegExp('^' + offerName + '$', 'i') },
            isDeleted: false,
            _id: { $ne: req.params.id } 
        });

        if (existingOffer) {
            return res.status(400).send({message : 'An active offer with the same name already exists.'});
        }

        if (offerType === 'Percentage') {
            if (offerValue > 92) {
                return res.status(400).send({message : 'Percentage offer value cannot exceed 92%.'});
            }
            if (offerValue < 0) {
                return res.status(400).send({message : 'Percentage offer value cannot be less than 0.'});
            }
        }

        const offerup = await Offer.findByIdAndUpdate(req.params.id, {
            offerName,
            discountDescription,
            startDate,
            endDate,
            minPurchaseAmount,
            maxDiscountAmount,
            offerValue,
            offerGroup,
            offerType,
            productsIncluded,
            categoriesIncluded,
            brandsIncluded,
        }, { new: true });
        res.json({
            success: true,
            message: 'Offer edited successfully.'});
    } catch (err) {
        console.error('Error updating offer:', err);
        res.status(500).redirect(`/admin/edit-offer/${req.params.id}`);
    }
};

 const activateOffer = async (req, res) => {
    const { id } = req.query;
    try {
        await Offer.updateOne({ _id: id }, { isActive: true });
        res.redirect('/admin/offers');
    } catch (error) {
        console.error('Error activating offer:', error);
        res.status(500).send('Server error');
    }
};

const deactivateOffer = async (req, res) => {
    const { id } = req.query;
    try {
        await Offer.updateOne({ _id: id }, { isActive: false });
        res.redirect('/admin/offers');
    } catch (error) {
        console.error('Error deactivating offer:', error);
        res.status(500).send('Server error');
    }
};

const deleteOffer = async (req, res) => {
    const { id } = req.query;
    try {
        await Offer.updateOne({ _id: id }, { isDeleted: true, isActive: false });
        res.redirect('/admin/offers');
    } catch (error) {
        console.error('Error deleting offer:', error);
        res.status(500).send('Server error');
    }
};

const restoreOffer = async (req, res) => {
    const { id } = req.query;
    try {
        await Offer.updateOne({ _id: id }, { isDeleted: false });
        res.redirect('/admin/offers');
    } catch (error) {
        console.error('Error restoring offer:', error);
        res.status(500).send('Server error');
    }
};

module.exports = {
    getOfferPage,
    getAddOfferPage,
    addOffer,
    getEditOffer,
    editOffer,
    deactivateOffer,
    activateOffer,
    deleteOffer,
    restoreOffer,
}