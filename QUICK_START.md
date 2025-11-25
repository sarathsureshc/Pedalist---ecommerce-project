# Quick Start - Render Deployment

## 🚀 5-Minute Deploy

### 1. Prerequisites

✅ GitHub repo with this code  
✅ MongoDB Atlas account (free)  
✅ Render account (free)  
✅ All API keys ready

### 2. Setup MongoDB Atlas

1. Create cluster at [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create database user
3. Whitelist IP: `0.0.0.0/0`
4. Get connection string

### 3. Deploy to Render

**Option A: Auto (with render.yaml)**

1. Connect GitHub repo to Render
2. It will auto-detect `render.yaml`
3. Add environment variables in Dashboard
4. Deploy

**Option B: Manual**

1. New Web Service on Render
2. Build: `npm install`
3. Start: `npm start`
4. Add environment variables
5. Deploy

### 4. Environment Variables

Add these in Render Dashboard:

```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/pedalist
SESSION_SECRET=auto-generated
GOOGLE_CLIENT_ID=your-id
GOOGLE_CLIENT_SECRET=your-secret
RAZORPAY_ID_KEY=your-key
RAZORPAY_SECRET_KEY=your-secret
NODEMAILER_EMAIL=your@gmail.com
NODEMAILER_PASSWORD=app-password
RENDER_EXTERNAL_URL=https://your-app.onrender.com
ALLOWED_ORIGINS=https://your-app.onrender.com
```

### 5. Update OAuth Redirect

Google Console → Add redirect URI:

```
https://your-app.onrender.com/auth/google/callback
```

### 6. Verify

Check: `https://your-app.onrender.com/health`

Should return:

```json
{
  "status": "OK",
  "services": {
    "database": "connected"
  }
}
```

## ✅ Done!

Your app is live with:

- ✅ Auto keep-alive (no sleep)
- ✅ Health monitoring
- ✅ Production security
- ✅ Database optimization

**Full Guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md)  
**Checklist**: See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

---

## Troubleshooting

**App won't start**:

- Check logs in Render Dashboard
- Verify all environment variables set

**Database error**:

- Verify MongoDB URI
- Check IP whitelist (0.0.0.0/0)

**OAuth not working**:

- Add redirect URI in Google Console
- Use production credentials

Need help? See full [DEPLOYMENT.md](./DEPLOYMENT.md)
