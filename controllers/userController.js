const User = require("../models/user.model.js");
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt"); 
require("dotenv").config(); 


const login = async (req, res) => {
    const { email, password } = req.query;
    try {
        // checking if user exists or not
        let user = await User.findOne({ email });
        console.log(user);
        if (!user) {
            return res.status(404).json({ message: "User  not found" });
        }

        // checking if password matches or not
        const isMatch = await bcrypt.compare(password, user.password);
        console.log(isMatch);
        if (!isMatch) {
            return res.status(404).json({ message: "Wrong password" });
        }

        const payload = { user: { id: user.id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET); // Set expiration time

        // Set cookie with token
        // res.cookie('token', token, {
        //     httpOnly: true, // Prevents JavaScript access to the cookie
        //     secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        //     // maxAge: 3600000 // 1 hour
        // });

        res.cookie('token', token);

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
    const { name, username, email, phone, password } = req.query;
    try {
        // checking if user already exists or not
        let user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ message: "User  already exists" });
        }

        // if not then create one
        user = new User({ name, username, email, phone, password });

        // encrypt the password
        const salt = await bcrypt.genSalt(10);
        console.log(salt);
        user.password = await bcrypt.hash(password, salt);
        console.log(user.password);

        // saving the user
        await user.save();

        // token
        const payload = { user: { id: user.id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET); // Set expiration time

        // Set cookie with token
        // res.cookie('token', token, {
        //     httpOnly: true, // Prevents JavaScript access to the cookie
        //     secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        //     // maxAge: 3600000 // 1 hour
        // });

        res.cookie('token', token)

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