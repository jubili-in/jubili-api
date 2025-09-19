//routes/userRoute.js
const express = require("express"); 
const router = express.Router(); 
const { login, signup, verifyEmail, initiateGoogleAuth, handleGoogleCallback } = require("../controllers/userController"); 

router.get("/login", login); 
router.post("/signup", signup); 
router.get("/verify", verifyEmail);

// Google OAuth routes
router.get("/auth/google", initiateGoogleAuth);
router.get("/auth/google/callback", handleGoogleCallback);

module.exports = router; 