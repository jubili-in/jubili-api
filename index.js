const express = require("express");
const app = express();
require("dotenv").config();
const cors = require('cors');
const cookieParser = require("cookie-parser");

const { initializeShiprocket } = require('./services/shiprocketService.js');
const { initializeEkart } = require('./services/ekartService');

// Routes
const userRoutes = require("./routes/userRoute");
const sellerRoutes = require("./routes/sellerRoutes");
const productRoutes = require("./routes/productRoutes");
const userActionRoutes = require("./routes/userActionRoutes");
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require("./routes/paymentRoutes");
const webhookRoutes = require('./routes/webhookRoutes');
const shippingRoutes = require('./routes/shippingRoutes');
const ekartRoutes = require('./routes/ekartRoutes');

// CORS config
const corsOptions = {
    origin: [
        "https://sellers.jubili.in",
        "https://www.jubili.in",
        "https://sellers.jubili.in",
        "http://localhost:3000",
    ],
    credentials: true,
};

// Enable CORS for all routes + handle preflight
app.use(cors(corsOptions));
// app.options("*", cors(corsOptions));

// app.use(
//     cors({
//         origin: function (origin, callback) {
//             if (!origin || allowedOrigins.includes(origin) || allowedOrigins.some(regex => regex instanceof RegExp && regex.test(origin))) {
//                 callback(null, true);
//             } else {
//                 callback(new Error("Not allowed by CORS"));
//             }
//         },
//         credentials: true,
//     })
// );

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Route Mapping
app.use("/api/users", userRoutes);
app.use("/api/sellers", sellerRoutes);
app.use("/api/products", productRoutes);
// includes /categories under this
app.use("/api/user-actions", userActionRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/webhook", webhookRoutes);
app.use('/api/address', require('./routes/addressRoute'));
app.use('/api/shipping', shippingRoutes); // Shiprocket routes
app.use('/api/ekart', ekartRoutes); // Ekart routes

app.get("/", (req, res) => {
    res.send('🌱 Jubili API is live!');
});

// Initialize external services
const initializeServices = async () => {
    try {
        console.log('🚀 Initializing external services...');
        
        // Initialize both shipping services in parallel
        await Promise.allSettled([
            // initializeShiprocket(),
            initializeEkart()
        ]).then(results => {
            results.forEach((result, index) => {
                const serviceName = index === 0 ? 'Shiprocket' : 'Ekart';
                if (result.status === 'fulfilled') {
                    console.log(`✅ ${serviceName} initialized successfully`);
                } else {
                    console.error(`❌ ${serviceName} initialization failed:`, result.reason?.message);
                }
            });
        });
        
        console.log('✅ Service initialization process completed');
    } catch (error) {
        console.error('❌ Service initialization failed:', error.message);
    }
};

// Start server
const port = process.env.PORT || 8000;
app.listen(port, async () => {
    const currentTime = new Date().toLocaleString();
    console.log(`🚀 Server running at http://localhost:${port}`);
    console.log(`🕒 Started at ${currentTime}`);

    // Initialize services after server starts
    await initializeServices();
});