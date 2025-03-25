const User = require("../models/user.model.js");
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt"); 
require("dotenv").config(); 


const login = async (req, res) => {
    const { email, password } = req.query;
    try {
        // checking if user exists or not
        let user = await User.findOne({ email });
         
        if (!user) {
            return res.status(404).json({ message: "User  not found" });
        }

        // checking if password matches or not
        const isMatch = await bcrypt.compare(password, user.password);
        //  
        if (!isMatch) {
            return res.status(404).json({ message: "Wrong password" });
        }

        const payload = { user: { id: user.id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET); // Set expiration time

        res.cookie('token', token, {
            httpOnly: true,
            secure: true, // Secure is required for SameSite=None cookies
            sameSite: 'none', // Allows cross-origin cookies
            maxAge: 3600000, // 1 hour
        });        

        return res.status(200).json({
            message: "Hello User",
            user: user,
            token: token,
        });
    } catch (e) {
        return res.status(e.status || 500).json({
            message: e.message
        });
    }
};

const signup = async (req, res) => {
    const { fullname, email, phone, password } = req.body;
    try {
        // Add validation
        if (!password || password.length < 6) {
            return res.status(400).json({ 
                message: "Password is required and should be at least 6 characters long" 
            });
        }

        if (!email || !fullname) {
            return res.status(400).json({ 
                message: "Email and fullname are required" 
            });
        }

        // checking if user already exists or not
        let user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }

        // if not then create one
        user = new User({ fullname, email, phone, password });

        // encrypt the password
        const salt = await bcrypt.genSalt(10);
        console.log('Password received:', password);
        console.log('Salt generated:', salt);
        user.password = await bcrypt.hash(password, salt);

        // saving the user
        await user.save();

        // token
        const payload = { user: { id: user.id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET); // Set expiration time

        res.cookie('token', token, {
            httpOnly: true,
            secure: true, // Secure is required for SameSite=None cookies
            sameSite: 'none', // Allows cross-origin cookies
            maxAge: 3600000, // 1 hour
        });        

        return res.status(200).json({
            message: "success",
            user: user,
            token: token
        });
    } catch (e) {
        return res.status(400).json({
            message: e.message,
        });
    }
};

module.exports = { login, signup }