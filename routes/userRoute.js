const express = require("express"); 
const router = express.Router(); 
const { login, signup, verifyEmail } = require("../controllers/userController"); 

router.get("/login", login); 
router.post("/signup", signup); 
router.get("/verify", verifyEmail);

module.exports = router;