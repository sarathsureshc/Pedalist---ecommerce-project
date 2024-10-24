const User = require("../../models/userSchema");
const Address = require("../../models/addressSchema");

const loadAddressPage = async (req, res) => {
    try {
       const user = req.session.user || req.user;
        if (!user) {
            return res.redirect('/login');
        }
        else{
        const userData = await User.findOne({ _id: user._id })
        const addresses = await Address.find({userId: userData._id }).sort({ createdAt: 1 }); // Fetch addresses sorted by creation date

        res.render('address', { addresses, user:userData });
        }
    } catch (error) {
        console.error("Error loading addresses:", error);
        res.status(500).send('Server Error');
    }
};

const loadAddAddressPage = async (req, res) => {
    try {
        const user = req.session.user || req.user;
        if (!user) {
            return res.redirect('/login');
        }
        else{
        const userData = await User.findOne({ _id: user._id });
        res.render('add-address', {user : userData});
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
        res.redirect('/address'); // Redirect to address management page
    } catch (error) {
        console.error("Error adding address:", error);
        res.status(500).send('Server Error');
    }
};

const editAddress = async (req, res) => {
    const id = req.query.id;
    const user = req.session.user || req.user;
  
    try {
        if (!user) {
            return res.redirect('/login');
        }else{
            const userData = await User.findOne({ _id: user._id });
            const address = await Address.findById(id);
            
        if (!address) {
            req.flash('error', 'No address found');
            return res.redirect('/address');
        }
        res.render('edit-address', { address,user:userData }); 
        }
    } catch (error) {
        console.error("Error fetching address for edit:", error);
        res.status(500).send('Server Error');
    }
};

const updateAddress = async (req, res) => {
    const { id } = req.params;
    const { line1, city, state, zip } = req.body;

    try {
        await Address.findByIdAndUpdate(id, { line1, city, state, zip });
        res.redirect('/address');
    } catch (error) {
        console.error("Error updating address:", error);
        res.status(500).send('Server Error');
    }
};

const removeAddress = async (req, res) => {
    const { id } = req.params;

    try {
        await Address.findByIdAndDelete(id);
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