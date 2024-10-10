const User = require("../../models/userSchema");
const Mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const pageerror = async(req,res)=>{
    res.render("admin-error")
}

const loadLogin = (req,res)=>{
    if(req.session.admin){
        return res.redirect("/admin/dashboard");
    }
    res.render("admin-login",{message:null});
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await User.findOne({ email, isAdmin: true });
        
        if (admin) {
            // Await the password comparison
            const passwordMatch = await bcrypt.compare(password, admin.password);
            if (passwordMatch) {
                req.session.admin = true;
                console.log("Admin logged in successfully");
                return res.redirect("/admin");
            } else {
                console.log("Incorrect password for admin with email:", email);
                // Optionally, you can send an error message to the client
                return res.redirect("/admin/login");
            }
        } else {
            console.log("No admin found with email:", email);
            // Optionally, you can send an error message to the client
            return res.redirect("/admin/login");
        }
    } catch (error) {
        console.error("Login Error:", error);
        return res.redirect("/pageerror");
    }
}


const loadDashboard = async(req,res)=>{
    if(req.session.admin){
        try {
            res.render("dashboard");
        } catch (error) {
            return res.redirect("/pageerror")
        }
}
}

const logout = async (req,res)=>{
    try {
        req.session.destroy(err=>{
            if(err){
                console.log("Error destroying session",err);
                return res.redirect("/pageerror");
            }
            console.log("Admin logged out!!")
            res.redirect("/admin/login")
        })

    } catch (error) {
        
            console.log("Unexpected error during logout",error);
            res.redirect("/pageerror");
    }
}

module.exports = {
loadLogin,
login,
loadDashboard,
pageerror,
logout
}