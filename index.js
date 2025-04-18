// File: index.js

const express = require("express");
const app = express();
require("dotenv").config();
const cors = require('cors');

const cookieParser = require("cookie-parser");
const userRoutes = require("./routes/userRoute");
const sellerRoutes = require("./routes/sellerRoutes");
const productRoutes = require("./routes/productRoutes");
const userActionRoutes = require("./routes/userActionRoutes");

// Whitelist configuration for CORS
const allowedOrigins = [
    "https://kickstart-59ea.onrender.com",
    "http://localhost:3000",              // Localhost for development
    "http://localhost:5173",              // Localhost for development
    /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/ // Local network IPs
];

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
    })
);

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

// Auth routes
app.use("/api/users", userRoutes); 
app.use("/api/sellers", sellerRoutes); // Seller routes

//product routes
app.use("/api/products", productRoutes); // Product routes

app.use("/api/user-actions", userActionRoutes); // User action routes

app.get("/", (req, res)=>{
    res.send('hey there')
})

app.listen(process.env.PORT || 8000, ()=>{
    const port = process.env.PORT || 8000;
    const currentTime = new Date().toLocaleString();
    console.log(`Server is running on http://localhost:${port}`);
    console.log(`Server restarted at ${currentTime}`);
}) 