const User = require("../models/userModel");
const jwt = require('jsonwebtoken');
// const bcrypt = require("bcryptjs");
const bcrypt = require("bcryptjs"); 
require("dotenv").config(); 


const login = async (req, res) => {
    const { email, password } = req.query;
    try {

        // checking if user exists or not ???
        let user = await User.findOne({ email });
        console.log(user)
        if (!user) {
            return res.status(404).json({ message: "Here" });
        }

        // checking if password matches or not ...
        const isMatch = await bcrypt.compare(password, user.password);
        console.log(isMatch); 
        if (!isMatch) {
            return res.status(404).json({ message: "Or Here" });
        }

        const payload = {user: {id: user.id}}; 
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
        // checking if user already exists or not ???
        let user = await User.findOne({email}); 

        if(user){ 
            return res.status(400).json({message: "Alredy Exust"}); 
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
        const payload = {user: {id: user.id}}; 
        const token = jwt.sign(payload, process.env.JWT_SECRET); 

      

        return res.status(200).json({
            message: "Your User", 
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

