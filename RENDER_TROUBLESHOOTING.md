# Render Deployment Troubleshooting

## Issue: App Exits with Status 1

### Symptoms:

```
✅ All required environment variables are set
==> Exited with status 1
```

### Root Cause:

MongoDB connection is failing, causing the app to crash.

### Solutions:

#### 1. Check MongoDB URI

In Render Dashboard → Environment:

Verify `MONGODB_URI` is correct:

```
mongodb+srv://username:password@cluster.mongodb.net/pedalist?retryWrites=true&w=majority
```

**Common Issues**:

- ❌ Wrong password
- ❌ Special characters not URL-encoded
- ❌ Wrong cluster name
- ❌ Wrong database name

**URL Encoding**:
If password contains special characters, encode them:

- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`

Example:

```
Password: Pass@123#
Encoded: mongodb+srv://user:Pass%40123%23@cluster.mongodb.net/pedalist
```

#### 2. MongoDB Atlas IP Whitelist

1. Go to MongoDB Atlas
2. Network Access
3. Add IP: `0.0.0.0/0` (allows all - needed for Render)
4. Save

#### 3. Check Database User

1. MongoDB Atlas → Database Access
2. Verify user exists
3. Verify user has read/write permissions
4. Password is correct

#### 4. View Detailed Logs

After deploying the fix:

1. Go to Render Dashboard → Your Service → Logs
2. Look for:

   ```
   ✅ MongoDB Connected
   ```

   OR

   ```
   ❌ MongoDB Connection error: {details}
   ```

3. Check `/health` endpoint:

   ```
   https://your-app.onrender.com/health
   ```

   Should return:

   ```json
   {
     "status": "OK",
     "services": {
       "database": "connected"
     }
   }
   ```

   Or if DB is still failing:

   ```json
   {
     "status": "DEGRADED",
     "services": {
       "database": "disconnected"
     }
   }
   ```

## Fixed in Latest Commit

**Changes Made**:

1. App no longer exits on MongoDB connection failure in production
2. Continues running to allow debugging
3. Health endpoint shows database status
4. Automatic reconnection attempts every 5 seconds
5. Detailed error logging

**Benefits**:

- ✅ App stays up even if DB fails
- ✅ Can check `/health` to see exact issue
- ✅ Logs show detailed error messages
- ✅ Auto-reconnects when DB comes back online

## Next Steps

1. **Push the fix**:

   ```bash
   git add .
   git commit -m "Fix: Handle MongoDB connection errors gracefully in production"
   git push origin main
   ```

2. **Redeploy on Render**:

   - Render will auto-deploy if auto-deploy is enabled
   - Or manually: Dashboard → Deploy → Deploy latest commit

3. **Check Health**:

   - Visit: `https://your-app.onrender.com/health`
   - Should show detailed database status

4. **Fix MongoDB Issue**:

   - Check error message in logs
   - Fix MONGODB_URI
   - Verify IP whitelist
   - Check user credentials

5. **Verify**:
   - Health check shows "connected"
   - App accessible
   - Can register/login

## Common MongoDB Connection Errors

### Error: "querySrv ENOTFOUND"

**Issue**: DNS resolution failed  
**Fix**: Check cluster name in MONGODB_URI

### Error: "Authentication failed"

**Issue**: Wrong username or password  
**Fix**: Verify credentials, check URL encoding

### Error: "Connection timeout"

**Issue**: IP not whitelisted  
**Fix**: Add 0.0.0.0/0 to IP whitelist

### Error: "Invalid scheme"

**Issue**: Wrong connection string format  
**Fix**: Use mongodb+srv:// for Atlas

## Environment Variables Checklist

Verify all these are set in Render:

```
✅ MONGODB_URI
✅ SESSION_SECRET
✅ GOOGLE_CLIENT_ID
✅ GOOGLE_CLIENT_SECRET
✅ RAZORPAY_ID_KEY
✅ RAZORPAY_SECRET_KEY
✅ NODEMAILER_EMAIL
✅ NODEMAILER_PASSWORD
✅ RENDER_EXTERNAL_URL
✅ NODE_ENV=production
✅ PORT=10000
```

## Still Having Issues?

1. **Check Render Logs**:

   - Look for specific error messages
   - Share relevant logs for help

2. **Test MongoDB URI Locally**:

   ```bash
   # Add to your .env
   MONGODB_URI=<your-render-mongodb-uri>

   # Run locally
   npm start
   ```

3. **Contact Support**:
   - Render: https://render.com/support
   - MongoDB: https://support.mongodb.com/

## Success Indicators

When deployment is successful, you'll see:

```
✅ All required environment variables are set
✅ MongoDB Connected
✅ Offer expiry cron job scheduled
✅ Keep-alive cron job scheduled
🚀 Server is running on port 10000 in production mode
```

No "Exited with status 1" restarts!
