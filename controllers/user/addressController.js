const User = require("../../models/userSchema");
const Address = require("../../models/addressSchema");
const Cart = require("../../models/cartSchema");

const loadAddressPage = async (req, res) => {
    try {
       const user = req.session.user || req.user;
       let cartCount = 0;
               if (!user) {
            return res.redirect('/login');
        }
        else{
        const userData = await User.findOne({ _id: user._id })
        const addresses = await Address.find({userId: userData._id, isDeleted: false }).sort({ createdAt: 1 }); 

        const cart = await Cart.findOne({ userId: user._id });
        if (cart) {
            cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);
          }

        res.render('address', { addresses, user:userData ,cartCount});
        }
    } catch (error) {
        console.error("Error loading addresses:", error);
        res.status(500).send('Server Error');
    }
};

const loadAddAddressPage = async (req, res) => {
    try {
        const user = req.session.user || req.user;
        let cartCount = 0;
        if (!user) {
            return res.redirect('/login');
        }
        else{
        const userData = await User.findOne({ _id: user._id });
        const cart = await Cart.findOne({ userId: user._id });
        if (cart) {
            cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);
          }
        res.render('add-address', {user : userData,cartCount});
    }
    } catch (error) {
        console.error("Error loading add address page:", error);
        res.status(500).send('Server Error');
        
    }
}

const addAddress = async (req, res) => {
    const { name, houseName, streetName, landmark, locality, city, state, pin,contactNo } = req.body;
    const user = req.session.user || req.user;

    try {
        const newAddress = new Address({ userId:user._id, name, houseName, streetName, landmark, locality, city, state, pin,contactNo });
        await newAddress.save();
        res.redirect('/address');
    } catch (error) {
        console.error("Error adding address:", error);
        res.status(500).send('Server Error');
    }
};

const editAddress = async (req, res) => {
    const id = req.query.id;
    const user = req.session.user || req.user;
    let cartCount = 0;
  
    try {
        if (!user) {
            return res.redirect('/login');
        }else{
            const userData = await User.findOne({ _id: user._id });
            const address = await Address.findById(id);
            const cart = await Cart.findOne({ userId: user._id });
            
        if (!address) {
            req.flash('error', 'No address found');
            return res.redirect('/address');
        }
        if (cart) {
            cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);
          }
        res.render('edit-address', { address,user:userData,cartCount }); 
        }
    } catch (error) {
        console.error("Error fetching address for edit:", error);
        res.status(500).send('Server Error');
    }
};

const updateAddress = async (req, res) => {
    const { id } = req.params;
    const { name, houseName, streetName, landmark, locality, city, state, pin,contactNo } = req.body;
    console.log(req.body);
    try {
        await Address.findByIdAndUpdate(id, { name, houseName, streetName, landmark, locality, city, state, pin,contactNo }, { new: true });
        res.redirect('/address');
    } catch (error) {
        console.error("Error updating address:", error);
        res.status(500).send('Server Error');
    }
};

const removeAddress = async (req, res) => {
    const { id } = req.params;

    try {
        await Address.findByIdAndUpdate(id, { isDeleted: true });
        res.redirect('/address');
    } catch (error) {
        console.error("Error removing address:", error);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    loadAddressPage,
    loadAddAddressPage,
    addAddress,
    editAddress,
    updateAddress,
    removeAddress,
};