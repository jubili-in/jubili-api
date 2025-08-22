const express = require("express");
const app = express();
const cors = require('cors');
const cookieParser = require("cookie-parser");
require("dotenv").config();

const { initializeEkart } = require('./services/ekartService');

// Routes
const userRoutes = require("./routes/userRoute");
const sellerRoutes = require("./routes/sellerRoutes");
const productRoutes = require("./routes/productRoutes");
const userActionRoutes = require("./routes/userActionRoutes");
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require("./routes/paymentRoutes");
const webhookRoutes = require('./routes/webhookRoutes');
const addressRoute = require('./routes/addressRoute');
const ekartRoutes = require('./routes/ekartRoutes');

// CORS config
const corsOptions = {
  origin: (origin, callback) => {
    if (
      [
        "https://sellers.jubili.in",
        "https://www.jubili.in",
        "http://localhost:3000",
      ].includes(origin) ||
      /^http:\/\/172\.\d{1,3}\.\d{1,3}\.\d{1,3}:3000$/.test(origin) || // allow 172.x.x.x:3000
      /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:3000$/.test(origin)        // allow 192.168.x.x:3000
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};


app.use(cors(corsOptions));

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
app.use('/api/address', addressRoute);
app.use('/api/ekart', ekartRoutes);

app.get("/", (req, res) => {
    res.send('🌱 Jubili API is live!');
});

// Initialize external services
const initializeServices = async () => {
    try {
        console.log('🚀 Initializing external services...');

        await initializeEkart();
        console.log('✅ Ekart initialized successfully');

        console.log('✅ Service initialization process completed');
    } catch (error) {
        console.error('❌ Ekart initialization failed:', error.message);
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