const express = require("express");
const app = express();
require("dotenv").config();

const cookieParser = require("cookie-parser");
const path = require("path");
const connectDB = require("./config/db");

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

connectDB();

// user routes
app.use("/api/users", userRoutes); 

app.get("/", (req, res)=>{
    res.send('hey there')
})

app.listen(process.env.PORT || 8000, ()=>{
    console.log(`server is running on port ${process.env.PORT}`);
})