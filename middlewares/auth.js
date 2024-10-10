const User = require("../models/userSchema");


const userAuth = (req,res,next)=>{
    if(req.session.user){
        User.findById(req.session.user)
        .then(data=>{
            if(data && !data.isBlocked){
                next();
            }else{
                res.redirect('/login');
            }
        })
        .catch(error=>{
            console.log("Error in user auth middleware",error);
            res.status(500).send("Internal Server error")
        })
    } else{
        res.redirect('/login');
    }
}

const  adminAuth = (req,res,next)=>{
    User.findOne({isAdmin:true})
    .then(data=>{
        if(data){
            console.log("The user exist")
        next();
        }else{
            res.redirect("/admin/login")
        }
    })
    .catch(error=>{
        console.log("Error in admin auth middleware",error);
        res.status(500).send("Internal Server error")
    })
}


module.exports = {
    userAuth,
    adminAuth
}