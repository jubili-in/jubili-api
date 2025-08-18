const express = require("express");
const app = express();
require("dotenv").config();
const cors = require('cors');
const cookieParser = require("cookie-parser");

const { initializeShiprocket } = require('./services/shiprocketService');

// Routes
const userRoutes = require("./routes/userRoute");
const sellerRoutes = require("./routes/sellerRoutes");
const productRoutes = require("./routes/productRoutes");
const userActionRoutes = require("./routes/userActionRoutes");
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require("./routes/paymentRoutes");
const webhookRoutes = require('./routes/webhookRoutes');
const delhiveryRoutes = require('./routes/delhiveryRoutes');
const shippingRoutes = require('./routes/shippingRoutes'); // New Shiprocket routes

// CORS Whitelist
const allowedOrigins = [
    "https://www.edens.in",
    "https://kickstart-59ea.onrender.com",
    "https://edens-admin-ui.onrender.com",
    "http://localhost:3000",
    "http://localhost:5173",
    /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/
];

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin) || allowedOrigins.some(regex => regex instanceof RegExp && regex.test(origin))) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
    })
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Route Mapping
app.use("/api/users", userRoutes);
app.use("/api/sellers", sellerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/user-actions", userActionRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/webhook", webhookRoutes);
app.use('/api/delhivery', delhiveryRoutes);
app.use('/api/shipping', shippingRoutes);


app.get("/", (req, res) => {
    res.send('🌱 Edens API is live!');
});

// Shiprocket server start
const initializeServices = async () => {
    try {
        console.log('🚀 Initializing external services...');
        await initializeShiprocket();
        console.log('✅ All services initialized successfully');
    } catch (error) {
        console.error('❌ Service initialization failed:', error.message);

    }
};


const port = process.env.PORT || 8000;
app.listen(port, async () => {
    const currentTime = new Date().toLocaleString();
    console.log(`🚀 Server running at http://localhost:${port}`);
    console.log(`🕒 Started at ${currentTime}`);

    // Initialize services after server starts
    await initializeServices();
});