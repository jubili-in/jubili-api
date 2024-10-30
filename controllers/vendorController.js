const User = require("../models/vendor.model.js");
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt"); 
require("dotenv").config();

const login = async (req, res) => {
    const { email, password } = req.query;
    try {
        // checking if user exists or not ???
        let user = await User.findOne({ email });
        console.log(user)
        if (!user) {
            return res.status(404).json({ message: "User not found"});
        }

        // checking if password matches or not ...
        const isMatch = await bcrypt.compare(password, user.password);
        console.log(isMatch); 
        if (!isMatch) {
            return res.status(404).json({ message: "Wrong password" });
        }

        const payload = {user: {id: user.id}, type: "vendor"}; 
        const token = jwt.sign(payload, process.env.JWT_SECRET); 

        return res.status(200).json({ 
            message: "Hello User", 
            token: token, 
            user: user,
        })
    }
    catch (e) {
        return res.status(e.status).json({ 
            message: e.message
        })
    }
};

const signup = async (req, res) => {
    const {name, username, email, phone, password} = req.query
    try{ 
        let user = await User.findOne({email});

        // checking if user already exists in db
        if(user){ 
            return res.status(400).json({message: "User already exist"}); 
        }

        // if not then create one
        user = new User({name, username, email, phone, password});
        
        // encrypt the password
        const salt = await bcrypt.genSalt(10); 
        console.log(salt); 
        user.password = await bcrypt.hash(password, salt); 
        console.log(user.password); 

        // saving the user
        await user.save(); 
        
        // token 
        const payload = {user: {id: user.id}, type: "vendor"}; 
        const token = jwt.sign(payload, process.env.JWT_SECRET); 

        return res.status(200).json({
            message: "success", 
            token: token, 
            user: user
        })
    }
    catch(e){ 
        return res.status(400).json({
            message: e.message, 
        })
    } 
};

module.exports = { login, signup }