


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
        res.status(500).send({ message: "Server error" });        

    }
}


module.exports = {
    loadHomepage,
    pageNotFound
};