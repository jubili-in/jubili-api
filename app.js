const express = require("express");
const app = express();
require("dotenv").config();

const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoute")
const vendorRoutes = require("./routes/vendorRoute")

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