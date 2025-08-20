# Jubili API

🌱 **Jubili API** is a robust backend system powering a multi-vendor e-commerce platform built with Node.js and AWS services.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- AWS Account with configured access
- MongoDB connection (if using mongoose features)

### Installation

```bash
# Clone the repository
git clone https://github.com/jubili-in/jubili-api
cd jubili-api

# Install dependencies
npm install

# Set up environment variables (see Environment Variables section)
cp .env.example .env

# Start development server
npm run dev

# Start production server
npm start
```

## 🌍 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=8000

# AWS Configuration
AWS_REGION=your-aws-region
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_S3_BUCKET_NAME=your-s3-bucket-name

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# JWT Secret
JWT_SECRET=your-jwt-secret

# Shipping Services
SHIPROCKET_API_URL=https://apiv2.shiprocket.in/v1/external
SHIPROCKET_TOKEN=your-shiprocket-token

EKART_API_URL=your-ekart-api-url
EKART_API_KEY=your-ekart-api-key
```

## 📁 Project Structure

```
jubili-api/
├── auth/                    # Authentication middleware
├── config/                  # Configuration files (AWS, payment gateways)
├── controllers/            # Route controllers
├── middlewares/            # Custom middleware functions
├── models/                 # Data models and schemas
├── routes/                 # API route definitions
├── services/               # Business logic and external service integrations
│   └── s3/                # AWS S3 specific services
├── index.js               # Main application entry point
├── package.json           # Project dependencies and scripts
└── README.md              # Project documentation
```

## 🛠 API Endpoints

### Core Endpoints

#### Authentication & Users
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile

#### Sellers
- `POST /api/sellers/register` - Seller registration
- `POST /api/sellers/login` - Seller login
- `GET /api/sellers/profile` - Get seller profile
- `POST /api/sellers/kyc` - KYC verification

#### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create product (seller only)
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product (seller only)
- `DELETE /api/products/:id` - Delete product (seller only)

#### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status

#### Payments
- `POST /api/payment/create-order` - Create Razorpay order
- `POST /api/payment/verify` - Verify payment
- `GET /api/payment/orders` - Get payment history

#### Shipping
- `POST /api/shipping/shiprocket/create` - Create Shiprocket shipment
- `GET /api/shipping/shiprocket/track/:awb` - Track Shiprocket shipment
- `POST /api/ekart/create` - Create Ekart shipment
- `GET /api/ekart/track/:awb` - Track Ekart shipment

#### Address Management
- `POST /api/address` - Add address
- `GET /api/address` - Get user addresses
- `PUT /api/address/:id` - Update address
- `DELETE /api/address/:id` - Delete address

#### User Actions
- `POST /api/user-actions/like` - Like/unlike product
- `POST /api/user-actions/cart` - Add/remove from cart
- `POST /api/user-actions/wishlist` - Add/remove from wishlist

#### Webhooks
- `POST /api/webhook/razorpay` - Razorpay webhook handler
- `POST /api/webhook/shiprocket` - Shiprocket webhook handler

## 🔧 Key Features

### AWS Integration
- **DynamoDB**: Primary database for scalable data storage
- **S3**: Product image storage with presigned URLs
- **IAM**: Secure access management

### Payment Processing
- **Razorpay**: Complete payment gateway integration
- Webhook handling for payment verification
- Order and payment status tracking

### Shipping Integration
- **Shiprocket**: Comprehensive logistics solution
- **Ekart**: Alternative shipping provider
- AWB generation and tracking
- Automated shipment creation

### Security Features
- JWT-based authentication
- CORS configuration for multiple origins
- Input validation and sanitization
- Secure file upload to S3

### Multi-vendor Support
- Separate seller and user authentication
- Seller KYC verification process
- Product management by individual sellers
- Commission and payout tracking

## 🏗 Architecture Highlights

- **Microservices Architecture**: Modular service-based design
- **Serverless Compatible**: AWS SDK integration for easy Lambda deployment
- **Scalable Database**: DynamoDB for high-performance NoSQL operations
- **CDN Integration**: S3 for global content delivery
- **Event-Driven**: Webhook-based real-time updates

## 🧪 Development

### Running in Development Mode
```bash
npm run dev
```
This uses nodemon for automatic server restart on file changes.

### Production Deployment
```bash
npm start
```

### File Upload Testing
The API supports product image uploads to AWS S3. Images are automatically:
- Resized and optimized
- Stored with UUID-based naming
- Accessible via presigned URLs
- Limited to 5MB per file

## 🔍 Monitoring and Logging

- Server startup logs with timestamps
- External service initialization status
- Error logging for AWS operations
- Payment and shipping webhook logging

## 🚀 Deployment

The application is designed to run on:
- **AWS EC2**: Traditional server deployment
- **AWS Lambda**: Serverless deployment (with minor modifications)
- **Docker**: Containerized deployment
- **Local Development**: Direct Node.js execution

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and support, please check:
- Environment variable configuration
- AWS permissions and credentials
- Network connectivity to external services
- Service initialization logs

---

🌱 **Jubili API** - Powering the future of multi-vendor e-commerce
