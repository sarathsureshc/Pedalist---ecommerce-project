# Pedalist E-commerce Platform

> A full-featured e-commerce platform for cycling products with user authentication, product management, shopping cart, order processing, and payment integration.

![Node.js](https://img.shields.io/badge/Node.js-16%2B-green)
![MongoDB](https://img.shields.io/badge/MongoDB-5%2B-green)
![Express.js](https://img.shields.io/badge/Express.js-4.21-blue)
![Render](https://img.shields.io/badge/Deploy-Render-purple)
![Production Ready](https://img.shields.io/badge/Production-Ready-success)

## 🚀 Quick Deploy

**Deploy to Render in 5 minutes**: [Quick Start Guide](./QUICK_START.md)

**Full Deployment Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Security Features](#security-features)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### User Features

- 🔐 User authentication (Email/Password + Google OAuth)
- 👤 User profile management
- 🛒 Shopping cart functionality
- ❤️ Wishlist management
- 📦 Order placement and tracking
- 💳 Secure payment integration (Razorpay)
- 💰 Wallet system
- 🎟️ Coupon and offer redemption
- 📧 Email verification with OTP
- 🎁 Referral system
- 📄 Invoice generation and download

### Admin Features

- 📊 Comprehensive dashboard with analytics
- 👥 Customer management
- 📦 Product management (CRUD operations)
- 🏷️ Category and brand management
- 📋 Order management and status updates
- 🎯 Offer and coupon management
- 📈 Sales reports (PDF, Excel export)
- 💾 Ledger generation
- 📅 Automated offer expiry with cron jobs

## 🛠 Tech Stack

### Backend

- **Runtime**: Node.js (v16+)
- **Framework**: Express.js v4.21
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Passport.js (Google OAuth 2.0) + bcrypt
- **Session Management**: express-session with MongoDB store
- **View Engine**: EJS

### Security & Utilities

- **Security**: Helmet.js, CORS, express-validator
- **Logging**: Winston with daily log rotation
- **File Upload**: Multer with Sharp (image processing)
- **Payment**: Razorpay integration
- **Email**: Nodemailer
- **Scheduling**: node-cron
- **Rate Limiting**: express-rate-limit

## 📋 Prerequisites

Before running this project, ensure you have:

- **Node.js** >= 16.x ([Download](https://nodejs.org/))
- **MongoDB** >= 5.x ([Download](https://www.mongodb.com/try/download/community)) or MongoDB Atlas account
- **npm** or **yarn** package manager
- **Razorpay** account for payment integration
- **Google Cloud Console** project for OAuth (optional)
- **Gmail account** with App Password for email notifications

## 🚀 Installation

### 1. Clone the Repository

\`\`\`bash
git clone <repository-url>
cd pedalist-ecommerce-project
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Environment Setup

Copy the example environment file:

\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` with your configuration (see [Configuration](#configuration) section).

### 4. Set Up MongoDB

**Option A: Local MongoDB**
\`\`\`bash

# Start MongoDB service

mongod
\`\`\`

**Option B: MongoDB Atlas**

- Create a cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Get your connection string
- Add it to `.env` as `MONGODB_URI`

## ⚙️ Configuration

Edit the `.env` file with your credentials:

\`\`\`env

# Database

MONGODB_URI=mongodb://localhost:27017/pedalist

# Or for MongoDB Atlas:

# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/pedalist

# Session Secret (Generate a strong random string)

SESSION_SECRET=your-super-secret-session-key-change-this

# Google OAuth (Optional)

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Razorpay Payment Gateway

RAZORPAY_ID_KEY=your-razorpay-key-id
RAZORPAY_SECRET_KEY=your-razorpay-secret-key

# Email Configuration

NODEMAILER_EMAIL=your-email@gmail.com
NODEMAILER_PASSWORD=your-gmail-app-password

# Server Configuration

PORT=3000
NODE_ENV=development
\`\`\`

### Getting API Keys

**Google OAuth:**

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/auth/google/callback`

**Razorpay:**

1. Sign up at [Razorpay](https://razorpay.com/)
2. Get API keys from Dashboard → Settings → API Keys

**Gmail App Password:**

1. Enable 2-Factor Authentication on your Gmail account
2. Generate App Password: Account → Security → App passwords
3. Use the generated password in `.env`

## 🏃 Running the Application

### Development Mode

\`\`\`bash
npm run dev

# or

npm start
\`\`\`

The server will start on `http://localhost:3000`

### Production Mode

\`\`\`bash
NODE_ENV=production npm start
\`\`\`

## 📁 Project Structure

\`\`\`
pedalist-ecommerce-project/
├── config/ # Configuration files
│ ├── db.js # Database connection
│ ├── logger.js # Winston logger setup
│ ├── passport.js # Passport authentication
│ └── validateEnv.js # Environment validation
├── controllers/ # Route controllers
│ ├── admin/ # Admin controllers
│ └── user/ # User controllers
├── cron/ # Cron job schedules
│ └── offerCron.js # Automated offer expiry
├── helpers/ # Helper functions
│ └── multer.js # File upload configuration
├── logs/ # Application logs (auto-generated)
├── middlewares/ # Custom middleware
│ ├── auth.js # Authentication middleware
│ ├── errorHandler.js # Global error handling
│ ├── rateLimiter.js # Rate limiting
│ └── validators.js # Input validation
├── models/ # Mongoose models (schemas)
├── public/ # Static assets
│ ├── uploads/ # User uploaded files
│ └── \*.css # Stylesheets
├── routes/ # Express routes
│ ├── adminRouter.js # Admin routes
│ └── userRouter.js # User routes
├── views/ # EJS templates
│ ├── admin/ # Admin views
│ ├── user/ # User views
│ └── partials/ # Reusable components
├── .env # Environment variables (not in git)
├── .env.example # Environment template
├── .gitignore # Git ignore rules
├── app.js # Application entry point
└── package.json # Dependencies & scripts
\`\`\`

## 🔒 Security Features

This application implements industry-standard security practices:

- ✅ **Helmet.js** - Security headers (XSS, CSP, etc.)
- ✅ **CORS** - Cross-Origin Resource Sharing protection
- ✅ **Rate Limiting** - Prevents brute force attacks
- ✅ **Input Validation** - express-validator for all inputs
- ✅ **Password Hashing** - bcrypt with salt rounds
- ✅ **Secure Sessions** - MongoDB session store with httpOnly cookies
- ✅ **File Upload Security** - Type and size validation
- ✅ **Environment Variables** - Sensitive data not in code
- ✅ **Error Handling** - No stack trace exposure in production
- ✅ **Structured Logging** - Winston with daily rotation
- ✅ **Database Indexes** - Optimized queries

## 🌐 API Endpoints

### User Routes

| Method | Endpoint           | Description       | Auth Required |
| ------ | ------------------ | ----------------- | ------------- |
| GET    | `/`                | Homepage          | No            |
| GET    | `/signup`          | Signup page       | No            |
| POST   | `/signup`          | Register user     | No            |
| POST   | `/verify-otp`      | Verify email OTP  | No            |
| GET    | `/login`           | Login page        | No            |
| POST   | `/login`           | Authenticate user | No            |
| GET    | `/logout`          | Logout user       | Yes           |
| GET    | `/products`        | Product listing   | Yes           |
| GET    | `/product-detail`  | Product details   | Yes           |
| GET    | `/cart`            | View cart         | Yes           |
| POST   | `/add-to-cart`     | Add to cart       | Yes           |
| GET    | `/wishlist`        | View wishlist     | Yes           |
| POST   | `/add-to-wishlist` | Add to wishlist   | Yes           |
| GET    | `/checkout`        | Checkout page     | Yes           |
| POST   | `/place-order`     | Place order       | Yes           |
| GET    | `/orders`          | Order history     | Yes           |
| GET    | `/profile`         | User profile      | Yes           |
| GET    | `/wallet`          | User wallet       | Yes           |

### Admin Routes

| Method | Endpoint              | Description         | Auth Required |
| ------ | --------------------- | ------------------- | ------------- |
| GET    | `/admin/login`        | Admin login         | No            |
| POST   | `/admin/login`        | Admin authenticate  | No            |
| GET    | `/admin/`             | Dashboard           | Yes (Admin)   |
| GET    | `/admin/users`        | Customer list       | Yes (Admin)   |
| GET    | `/admin/products`     | Product management  | Yes (Admin)   |
| GET    | `/admin/orders`       | Order management    | Yes (Admin)   |
| GET    | `/admin/category`     | Category management | Yes (Admin)   |
| GET    | `/admin/brands`       | Brand management    | Yes (Admin)   |
| GET    | `/admin/offers`       | Offer management    | Yes (Admin)   |
| GET    | `/admin/coupons`      | Coupon management   | Yes (Admin)   |
| GET    | `/admin/sales-report` | Sales report        | Yes (Admin)   |

## 📊 Logging

Application logs are stored in the `logs/` directory:

- **combined-YYYY-MM-DD.log** - All logs (info, warn, error)
- **error-YYYY-MM-DD.log** - Error logs only
- Logs are rotated daily and kept for 14 days
- Console logging enabled in development mode

View recent logs:
\`\`\`bash
tail -f logs/combined-$(date +%Y-%m-%d).log
\`\`\`

## 🧪 Testing

\`\`\`bash

# Run all tests

npm test

# Run with coverage

npm run test:coverage

# Run in watch mode

npm run test:watch
\`\`\`

## 🐛 Troubleshooting

### MongoDB Connection Error

**Problem**: `MongoDB Connection error`

**Solutions**:

- Ensure MongoDB is running: `mongod` or check MongoDB Atlas status
- Verify `MONGODB_URI` in `.env`
- Check firewall/network settings
- For Atlas: Whitelist your IP address

### Environment Variables Not Found

**Problem**: `❌ Missing required environment variables`

**Solution**: Copy `.env.example` to `.env` and fill in all required values

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE :::3000`

**Solution**:
\`\`\`bash

# Change PORT in .env or kill the process

# Windows:

netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac:

lsof -ti:3000 | xargs kill -9
\`\`\`

### File Upload Errors

**Problem**: `Invalid file type` or upload fails

**Solution**:

- Only JPEG, PNG, and WebP are allowed
- Maximum file size: 5MB
- Ensure `public/uploads/re-image/` directory exists

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure:

- Code follows existing style
- All tests pass
- New features include tests
- Documentation is updated

## 📝 License

This project is licensed under the ISC License.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Express.js community
- MongoDB team
- All contributors and users

## 📞 Support

For support, email support@pedalist.com or open an issue on GitHub.

---

**Made with ❤️ for cycling enthusiasts**
