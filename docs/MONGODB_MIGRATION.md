# MongoDB Migration Guide

## Prerequisites

1. **Install MongoDB:**
   - **Windows:** Download from https://www.mongodb.com/try/download/community
   - **macOS:** `brew install mongodb-community`
   - **Linux:** Follow official MongoDB docs

2. **Start MongoDB:**
   ```bash
   # Windows (as service - usually auto-starts)
   # Or manually:
   "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"
   
   # macOS/Linux:
   mongod
   ```

3. **Verify MongoDB is running:**
   ```bash
   # Check if MongoDB is listening on port 27017
   netstat -an | findstr "27017"  # Windows
   # Or
   lsof -i :27017  # macOS/Linux
   ```

## Migration Steps

### Step 1: Configure MongoDB Connection

Update your `.env.local` file with MongoDB URI (keep DB_SYSTEM as filedb for now):

```env
# Keep this as filedb until migration is complete
DB_SYSTEM=filedb

# Add this
MONGODB_URI=mongodb://localhost:27017/modern-mahall
```

### Step 2: Run Migration Script

```bash
# From project root
npx tsx backend/scripts/migrate-to-mongo.ts
```

You should see output like:
```
🚀 MongoDB Migration Script

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📡 Connecting to MongoDB...
✓ Connected to: mongodb://localhost:27017/modern-mahall

📂 Reading filesystem data from backend/data/...

📊 Data Summary:
   • Families: 3
   • Admins: 1
   • Payments: 5
   ...

👤 Checking Super Admin...
✓ Super Admin exists: 919999999999

🏠 Migrating Families...
   ✓ MH-001 - John Doe (3 members)
   ✓ MH-002 - Jane Smith (2 members)
   ...

✅ Migration Complete!
```

### Step 3: Switch to MongoDB

Update `.env.local`:

```env
# Change this
DB_SYSTEM=mongodb
```

### Step 4: Restart Backend

```bash
# Stop current server (Ctrl+C)
# Then restart
npm run server
```

You should see:
```
⚙️  Using MongoDB database
✓ MongoDB connected successfully
```

### Step 5: Test the Application

1. Open frontend: http://localhost:3000
2. Login with OTP
3. Verify data is loading correctly

## Verify Migration

### Using MongoDB Compass

1. Download MongoDB Compass: https://www.mongodb.com/try/download/compass
2. Connect to: `mongodb://localhost:27017`
3. Select database: `modern-mahall`
4. Check collections:
   - `families` - Your family data
   - `admins` - Admin users
   - `payments` - Payment records
   - `announcements` - Announcements
   - `notifications` - Notifications
   - `feedbacks` - User feedback
   - `subscriptions` - Push subscriptions

### Using MongoDB Shell

```bash
mongosh

use modern-mahall

# Check families
db.families.countDocuments()
db.families.find().pretty()

# Check admins
db.admins.find().pretty()

# Check payments
db.payments.countDocuments()
```

## Rollback to Filesystem

If you need to switch back:

1. Update `.env.local`:
   ```env
   DB_SYSTEM=filedb
   ```

2. Restart backend

Your filesystem data in `backend/data/` is still intact!

## Troubleshooting

### "Connection refused" error

**Problem:** MongoDB is not running

**Solution:**
```bash
# Windows
net start MongoDB
# Or run manually:
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### "Database name invalid" error

**Problem:** Invalid database name in URI

**Solution:** Check `MONGODB_URI` in `.env.local`:
```env
MONGODB_URI=mongodb://localhost:27017/modern-mahall
```

### "Duplicate key error"

**Problem:** Data already exists in MongoDB

**Solution:** 
1. Drop the database and re-run migration:
   ```bash
   mongosh
   use modern-mahall
   db.dropDatabase()
   exit
   ```
2. Run migration again

### Migration script shows "already exists"

**Solution:** This is normal if you've run the migration before. The script skips duplicate entries.

## MongoDB Atlas (Cloud)

To use MongoDB Atlas instead of local MongoDB:

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string
4. Update `.env.local`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/modern-mahall
   ```
5. Run migration script

## Performance Tips

For production:

1. **Create Indexes:**
   ```javascript
   // MongoDB shell
   use modern-mahall
   
   db.families.createIndex({ code: 1 })
   db.families.createIndex({ "members.phone": 1 })
   db.admins.createIndex({ mobile: 1 })
   db.otps.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
   ```

2. **Enable Authentication:**
   ```bash
   # Create admin user in MongoDB
   mongosh
   use admin
   db.createUser({
     user: "mahall_admin",
     pwd: "secure_password",
     roles: ["readWrite"]
   })
   ```

3. **Update connection string:**
   ```env
   MONGODB_URI=mongodb://mahall_admin:secure_password@localhost:27017/modern-mahall
   ```

## Next Steps

- ✅ MongoDB is now your primary database
- ✅ OTP authentication system is active
- ✅ JWT tokens for sessions
- 📱 Consider adding SMS service for production OTP delivery
- 🔒 Enable MongoDB authentication for production
- 📊 Monitor MongoDB performance with Compass

---

Need help? Check the [backend README](file:///c:/Cipher%20Nichu/modern-mahall/backend/README.md)
