
const User = require('../../models/userSchema');

const pageNotFound = async (req,res) => {

    try {
        
        res.render("pageNotFound")

    } catch (error) {
        res.redirect("/pageNotFound")
    }
    
}




const loadHomepage = async (req,res)=>{
    try {
        
        return res.render("home");

    } catch (error) {
        console.log("Home page not found");
        res.render("pageNotFound")
        res.status(500).send({ message: "Server error" });        

    }
}

const loadLoginpage = async (req,res)=>{
    try {
        
        return res.render("login");

    } catch (error) {
        console.log("Login page not found");
        res.render("pageNotFound")
        res.status(500).send({ message: "Server error" });        

    }
}

const loadSignuppage = async (req,res)=>{
    try {
        
        return res.render("signup");

    } catch (error) {
        console.log("Signup page not found");
        res.render("pageNotFound")
        res.status(500).send({ message: "Server error" });        

    }
}

const signup = async (req,res) => {
    const{firstName,lastName,email,mobileNumber,password} = req.body;
    try {
        
        const newUser = new User({firstName,lastName,email,mobileNumber,password});

        

        await newUser.save();

        return res.redirect("/signup")

    } catch (error) {
        
        console.error("Error in saving user",error);
        res.status(500).send("Internal Server Error");

    }
}

const loadProductpage = async (req,res)=>{
    try {
        
        return res.render("product");

    } catch (error) {
        console.log("Product page not found");
        res.render("pageNotFound")
        res.status(500).send({ message: "Server error" });        

    }
}


module.exports = {
    loadHomepage,
    pageNotFound,
    loadLoginpage,
    loadSignuppage,
    signup,
    loadProductpage
};