const express = require("express");
const app = express();
require("dotenv").config();
const cors = require('cors');

const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoute")
const vendorRoutes = require("./routes/vendorRoute")

// Whitelist configuration for CORS
const allowedOrigins = [
    "https://kickstart-59ea.onrender.com",
    "http://localhost:3000",              // Localhost for development
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

connectDB();

// Auth routes
app.use("/api/users", userRoutes); 
app.use("/api/vendors", vendorRoutes); 

app.get("/", (req, res)=>{
    res.send('hey there')
})

app.listen(process.env.PORT || 8000, ()=>{
    console.log(`server is running on port ${process.env.PORT}`);
}) 