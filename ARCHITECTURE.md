# Jubili API Architecture

## 🏗️ System Overview

Jubili API is a modern, cloud-native e-commerce backend built on AWS services with Node.js/Express.js. The system follows a modular, microservices-inspired architecture designed for scalability, reliability, and maintainability.

## 🎯 Architecture Principles

- **Cloud-First**: Built with AWS services as primary infrastructure
- **Microservices Pattern**: Modular service-based design
- **Event-Driven**: Webhook-based real-time communication
- **Stateless**: JWT-based authentication for horizontal scaling
- **API-First**: RESTful API design with clear endpoint separation

## 🔧 Core Technology Stack

### Backend Framework
- **Node.js**: Runtime environment
- **Express.js**: Web application framework
- **JWT**: Authentication and authorization
- **Bcrypt**: Password hashing

### AWS Services
- **DynamoDB**: Primary NoSQL database
- **S3**: Object storage for product images
- **IAM**: Identity and access management
- **CloudWatch**: (Recommended for monitoring)

### Third-Party Integrations
- **Razorpay**: Payment processing
- **Shiprocket**: Primary logistics partner
- **Ekart**: Secondary shipping provider

## 🏛️ System Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │  Mobile App     │    │ Seller Portal   │
│   (jubili.in)   │    │                 │    │(sellers.jubili) │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      JUBILI API         │
                    │   (Express.js/Node)     │
                    └────────────┬────────────┘
                                 │
    ┌────────────────────────────┼────────────────────────────┐
    │                            │                            │
    ▼                            ▼                            ▼
┌───────────┐              ┌────────────┐               ┌─────────────┐
│ AWS       │              │ Payment    │               │ Shipping    │
│ Services  │              │ Gateway    │               │ Services    │
│           │              │            │               │             │
│ DynamoDB  │              │ Razorpay   │               │ Shiprocket  │
│ S3        │              │            │               │ Ekart       │
└───────────┘              └────────────┘               └─────────────┘
```

## 📊 Database Architecture

### DynamoDB Tables

#### Products Table
```json
{
  "tableName": "products",
  "primaryKey": "productId",
  "attributes": {
    "productId": "string",
    "sellerId": "string",
    "categoryId": "string",
    "brand": "string",
    "color": "string",
    "size": "string",
    "gender": "string",
    "material": "string",
    "productName": "string",
    "productDescription": "string",
    "price": "number",
    "discount": "number",
    "stock": "number",
    "imageUrls": "list",
    "likeCount": "number",
    "createdAt": "string",
    "linkedItems": "list"
  }
}
```

#### Users Table
- Primary key: `userId`
- Attributes: Profile information, authentication data, preferences

#### Sellers Table
- Primary key: `sellerId`
- Attributes: Business information, KYC status, payment details

#### Orders Table
- Primary key: `orderId`
- Attributes: Order details, status, shipping information, payment data

#### Categories Table
- Primary key: `categoryId`
- Attributes: Category hierarchy, metadata

## 🔐 Security Architecture

### Authentication Flow

```
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client    │    │   Jubili API    │    │   DynamoDB      │
└─────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
      │                      │                      │
      │ 1. Login Request     │                      │
      ├─────────────────────▶│                      │
      │                      │ 2. Validate User    │
      │                      ├─────────────────────▶│
      │                      │                      │
      │                      │ 3. User Data        │
      │                      │◀─────────────────────┤
      │                      │                      │
      │ 4. JWT Token        │                      │
      │◀─────────────────────┤                      │
      │                      │                      │
      │ 5. API Request      │                      │
      │   (with JWT)        │                      │
      ├─────────────────────▶│                      │
      │                      │ 6. Verify JWT       │
      │                      │                      │
      │ 7. Response         │                      │
      │◀─────────────────────┤                      │
```

### Security Features
- JWT-based stateless authentication
- Role-based access control (User/Seller)
- Password hashing with bcrypt
- CORS policy for multiple origins
- Input validation and sanitization
- Secure file upload to S3

## 🗂️ Service Layer Architecture

### Core Services

```
services/
├── userService.js          # User management operations
├── sellerService.js        # Seller management operations
├── productService.js       # Product CRUD operations
├── orderService.js         # Order processing logic
├── paymentService.js       # Payment processing with Razorpay
├── categoryService.js      # Category management
├── addressService.js       # Address management
├── userActionService.js    # Likes, cart, wishlist operations
├── sellerKycService.js     # KYC verification process
├── shiprocketService.js    # Shiprocket integration
├── ekartService.js         # Ekart integration
└── s3/
    └── productImageService.js # S3 image operations
```

### Service Responsibilities

- **Business Logic Separation**: Each service handles specific domain logic
- **Data Access Layer**: Services interact with DynamoDB
- **External API Integration**: Third-party service communications
- **Error Handling**: Centralized error processing
- **Validation**: Input validation and data sanitization

## 🚀 API Layer Architecture

### Route Organization

```
routes/
├── userRoute.js           # User authentication & profile
├── sellerRoutes.js        # Seller management
├── productRoutes.js       # Product operations
├── orderRoutes.js         # Order processing
├── paymentRoutes.js       # Payment handling
├── webhookRoutes.js       # Webhook endpoints
├── shippingRoutes.js      # Shiprocket operations
├── ekartRoutes.js         # Ekart operations
├── addressRoute.js        # Address management
└── userActionRoutes.js    # User interactions
```

### Middleware Stack

```
middlewares/
├── authenticateUser.js     # User JWT verification
├── authenticateSeller.js   # Seller JWT verification
├── getUserFromToken.js     # Extract user from token
└── uploadS3.js            # S3 file upload handling
```

## ☁️ AWS Integration Architecture

### DynamoDB Integration

```javascript
// Configuration Pattern
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
```

### S3 Integration

- **Upload Strategy**: Direct upload with multer-s3
- **Storage Pattern**: UUID-based file naming
- **Access Control**: Presigned URLs for secure access
- **File Limits**: 5MB maximum file size
- **Content Types**: Automatic detection and validation

### Presigned URL Generation

```javascript
const generatePresignedUrl = async (fileKey) => {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
    });
    
    return await getSignedUrl(s3Client, command, { 
        expiresIn: 60 * 5 // 5 minutes
    });
};
```

## 💳 Payment Processing Architecture

### Razorpay Integration Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │    │ Jubili API  │    │  Razorpay   │    │ DynamoDB    │
└─────┬───────┘    └─────┬───────┘    └─────┬───────┘    └─────┬───────┘
      │                  │                  │                  │
      │ 1. Create Order  │                  │                  │
      ├─────────────────▶│                  │                  │
      │                  │ 2. Create RZP   │                  │
      │                  │    Order        │                  │
      │                  ├─────────────────▶│                  │
      │                  │                  │                  │
      │                  │ 3. Order Details│                  │
      │                  │◀─────────────────┤                  │
      │                  │                  │                  │
      │                  │ 4. Save Order   │                  │
      │                  ├─────────────────────────────────────▶│
      │                  │                  │                  │
      │ 5. Order ID     │                  │                  │
      │◀─────────────────┤                  │                  │
      │                  │                  │                  │
      │ 6. Payment UI   │                  │                  │
      │◀═══════════════════════════════════▶│                  │
      │                  │                  │                  │
      │                  │ 7. Webhook      │                  │
      │                  │◀─────────────────┤                  │
      │                  │                  │                  │
      │                  │ 8. Update Status│                  │
      │                  ├─────────────────────────────────────▶│
```

## 🚚 Shipping Integration Architecture

### Multi-Provider Strategy

- **Primary**: Shiprocket (comprehensive features)
- **Secondary**: Ekart (alternative/backup)
- **Load Balancing**: Service availability-based selection
- **Failover**: Automatic provider switching

### Shipping Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Order       │    │ Shipping    │    │ Logistics   │
│ Service     │    │ Service     │    │ Provider    │
└─────┬───────┘    └─────┬───────┘    └─────┬───────┘
      │                  │                  │
      │ 1. Create       │                  │
      │    Shipment     │                  │
      ├─────────────────▶│                  │
      │                  │ 2. Provider API │
      │                  ├─────────────────▶│
      │                  │                  │
      │                  │ 3. AWB & Details│
      │                  │◀─────────────────┤
      │                  │                  │
      │ 4. AWB Number   │                  │
      │◀─────────────────┤                  │
      │                  │                  │
      │ 5. Schedule     │                  │
      │    Pickup       │                  │
      ├─────────────────▶│                  │
      │                  │ 6. Pickup API   │
      │                  ├─────────────────▶│
```

## 📈 Scalability Architecture

### Horizontal Scaling Features

- **Stateless Design**: No server-side session storage
- **DynamoDB**: Auto-scaling NoSQL database
- **S3**: Unlimited object storage
- **JWT Authentication**: No server-side session management
- **Service Separation**: Independent service scaling

### Performance Optimizations

- **Presigned URLs**: Reduce server load for file access
- **Lazy Loading**: On-demand service initialization
- **Connection Pooling**: Efficient database connections
- **Async Operations**: Non-blocking I/O operations

## 🔄 Event-Driven Architecture

### Webhook Handling

```
webhooks/
├── razorpay    # Payment status updates
├── shiprocket  # Shipping status updates
└── ekart       # Alternative shipping updates
```

### Event Flow

1. **External Event**: Payment/shipping status change
2. **Webhook Receipt**: API receives webhook payload
3. **Validation**: Verify webhook authenticity
4. **Processing**: Update relevant data in DynamoDB
5. **Response**: Acknowledge successful processing

## 🚨 Error Handling Architecture

### Error Types

- **Validation Errors**: Input validation failures
- **Authentication Errors**: JWT/permission issues
- **AWS Service Errors**: DynamoDB/S3 operation failures
- **External API Errors**: Third-party service failures
- **Business Logic Errors**: Domain-specific validation

### Error Response Format

```json
{
  "success": false,
  "error": {
    "type": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}
```

## 📊 Monitoring and Observability

### Logging Strategy

- **Startup Logs**: Service initialization status
- **Request Logs**: API endpoint access
- **Error Logs**: Exception and error tracking
- **Performance Logs**: Response time monitoring
- **External Service Logs**: Third-party API interactions

### Recommended Monitoring Stack

- **AWS CloudWatch**: Infrastructure monitoring
- **Application Logs**: Structured logging with timestamps
- **Health Checks**: Endpoint availability monitoring
- **Performance Metrics**: Response time and throughput

## 🔧 Development Architecture

### Environment Management

```
Environments:
├── Development     # Local development with hot reload
├── Staging        # Pre-production testing environment
└── Production     # Live production environment
```

### Development Tools

- **Nodemon**: Auto-restart during development
- **Prettier**: Code formatting
- **Environment Variables**: Configuration management
- **CORS**: Cross-origin resource sharing configuration

## 🚀 Deployment Architecture

### Deployment Options

1. **AWS EC2**: Traditional server deployment
2. **AWS Lambda**: Serverless deployment (requires adaptation)
3. **Docker**: Containerized deployment
4. **AWS Elastic Beanstalk**: Managed platform deployment

### CI/CD Recommendations

```yaml
# Example deployment pipeline
steps:
  - checkout: code
  - install: dependencies
  - test: unit_tests
  - build: production_bundle
  - deploy: aws_environment
  - verify: health_checks
```

## 🔍 Future Architecture Considerations

### Potential Enhancements

- **Microservices Migration**: Split into individual services
- **Event Sourcing**: Audit trail and state reconstruction
- **CQRS**: Command Query Responsibility Segregation
- **GraphQL**: Flexible API query language
- **Message Queue**: Async processing with SQS/SNS
- **Container Orchestration**: Kubernetes deployment
- **API Gateway**: Centralized API management
- **Service Mesh**: Inter-service communication management

### Scalability Roadmap

1. **Phase 1**: Current monolithic API with AWS services
2. **Phase 2**: Service separation and containerization
3. **Phase 3**: Full microservices with message queuing
4. **Phase 4**: Event sourcing and advanced monitoring

---

## 📚 Additional Resources

- [AWS DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [AWS S3 Developer Guide](https://docs.aws.amazon.com/s3/index.html)
- [Express.js Documentation](https://expressjs.com/)
- [JWT.io](https://jwt.io/)
- [Razorpay API Documentation](https://razorpay.com/docs/)

---

🏗️ **Architecture Documentation** - Built for scale, designed for growth
