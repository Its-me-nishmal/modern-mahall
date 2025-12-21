# ModernMahall Backend

Backend server for the ModernMahall application with support for both filesystem and MongoDB database systems.

## Features

- 🔐 **OTP-based Authentication** - Secure login with time-limited OTPs
- 💾 **Dual Database Support** - Choose between filesystem (JSON) or MongoDB
- 🎫 **JWT Tokens** - Secure session management
- 📱 **Push Notifications** - Web push notification support
- 👥 **Family Management** - Manage families and members
- 💰 **Payment Tracking** - Track payments and balances
- 📢 **Announcements** - Create and manage announcements

## Directory Structure

```
backend/
├── api/                    # API route handlers
│   ├── authRoutes.ts      # Authentication endpoints
│   ├── adminRoutes.ts     # Admin-only endpoints
│   ├── dataRoutes.ts      # Data CRUD endpoints
│   └── notificationRoutes.ts  # Push notification endpoints
├── db/                     # Database layer
│   ├── interface.ts       # Database interface definition
│   ├── fsdb.ts           # Filesystem implementation
│   ├── mongodb.ts        # MongoDB implementation
│   └── index.ts          # Database factory
├── services/              # Business logic services
│   ├── otpService.ts     # OTP generation/verification
│   ├── tokenService.ts   # JWT token management
│   ├── geminiService.ts  # AI service integration
│   └── notificationService.ts  # Push notifications
├── utils/                 # Utility functions
│   ├── auth.ts           # Authentication middleware
│   └── vapidKeys.ts      # VAPID key management
├── data/                  # Filesystem database storage (auto-created)
├── index.ts              # Server entry point
├── package.json          # Backend dependencies
└── .env.example          # Environment variables template

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env.local` in the root directory and configure:

```env
# Database Configuration
DB_SYSTEM=filedb           # Options: filedb, mongodb
MONGODB_URI=mongodb://localhost:27017/modern-mahall

# Server
PORT=3001

# Admin Credentials
ADMIN_MOBILE=919999999999
ADMIN_OTP=123456

# OTP Configuration
OTP_EXPIRY_MINUTES=5

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRY=7d

# Gemini API
GEMINI_API_KEY=your-api-key-here

# VAPID Keys (auto-generated on first run)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@modernmahall.com
```

### 3. Choose Database System

#### Option A: Filesystem Database (Default)

No additional setup required. Data will be stored in `backend/data/*.json` files.

```env
DB_SYSTEM=filedb
```

#### Option B: MongoDB

1. Install MongoDB locally or use MongoDB Atlas
2. Update `.env.local`:

```env
DB_SYSTEM=mongodb
MONGODB_URI=mongodb://localhost:27017/modern-mahall
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/modern-mahall
```

## Running the Server

### Development Mode (from root)

```bash
npm run server
```

### Development Mode (from backend directory)

```bash
cd backend
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

### Health Check
- `GET /api/health` - Server health status

### User Authentication
- `POST /api/auth/send-otp` - Send OTP to mobile number
- `POST /api/auth/verify-otp` - Verify OTP and login
- `POST /api/auth/register` - Register new user/family

### Admin Authentication
- `POST /api/auth/admin/send-otp` - Send OTP to admin
- `POST /api/auth/admin/verify-otp` - Verify admin OTP and login

### Data Management (Protected)
- `GET /api/data/families` - Get all families
- `GET /api/data/family/:id` - Get family by ID
- `POST /api/data/family` - Create family
- `PUT /api/data/family/:id` - Update family
- `DELETE /api/data/family/:id` - Delete family

### Admin Routes (Admin Only)
- Various admin-specific endpoints for managing users, approvals, etc.

### Notifications
- `POST /api/notifications/subscribe` - Subscribe to push notifications
- `POST /api/notifications/send` - Send push notification

## OTP Flow

### User Login

1. **Send OTP**: `POST /api/auth/send-otp`
   ```json
   {
     "mobile": "919999999999"
   }
   ```

2. **Verify OTP**: `POST /api/auth/verify-otp`
   ```json
   {
     "mobile": "919999999999",
     "otp": "123456"
   }
   ```

3. **If new user**: Register with `POST /api/auth/register`

### Admin Login

1. **Send OTP**: `POST /api/auth/admin/send-otp`
2. **Verify OTP**: `POST /api/auth/admin/verify-otp`

## Database Migration

To migrate from filesystem to MongoDB:

```bash
# TODO: Create migration script
node scripts/migrate-to-mongodb.js
```

## Security Notes

- Always change `JWT_SECRET` in production
- Use strong admin credentials
- Enable HTTPS in production
- Configure CORS for production domains
- Implement rate limiting for OTP endpoints

## Development vs Production

### Development
- OTP logs to console
- Hardcoded OTP `123456` accepted for backward compatibility
- CORS allows localhost

### Production
- Integrate SMS/Email service for OTP delivery
- Remove hardcoded OTP acceptance
- Configure strict CORS policy
- Use environment-specific database
- Enable rate limiting and security headers

## Troubleshooting

### Database Connection Issues

**Filesystem**: Ensure write permissions for `backend/data` directory

**MongoDB**: 
- Check connection string
- Ensure MongoDB service is running
- Check firewall settings

### OTP Not Received

- Check console logs for OTP (development mode)
- Verify mobile number format
- Check OTP expiry settings

### Token Issues

- Ensure `JWT_SECRET` is consistent
- Check token expiry settings
- Verify token format in Authorization header: `Bearer <token>`

## Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| DB_SYSTEM | Database type (filedb/mongodb) | filedb | No |
| MONGODB_URI | MongoDB connection string | localhost | mongodb only |
| PORT | Server port | 3001 | No |
| ADMIN_MOBILE | Super admin mobile number | - | Yes |
| ADMIN_OTP | Super admin OTP (dev only) | - | Dev only |
| OTP_EXPIRY_MINUTES | OTP validity duration | 5 | No |
| JWT_SECRET | JWT signing secret | - | Yes |
| JWT_EXPIRY | JWT token expiry | 7d | No |
| GEMINI_API_KEY | Gemini AI API key | - | Optional |
| VAPID_PUBLIC_KEY | Web push public key | auto-generated | No |
| VAPID_PRIVATE_KEY | Web push private key | auto-generated | No |
| VAPID_SUBJECT | Web push subject | - | Yes |

## License

Proprietary - ModernMahall
