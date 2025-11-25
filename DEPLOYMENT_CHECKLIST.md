# Production Deployment Checklist

Use this checklist before deploying to production.

## Pre-Deployment

### Environment Setup

- [ ] All environment variables configured in Render Dashboard
- [ ] `NODE_ENV` set to `production`
- [ ] `SESSION_SECRET` is strong and unique (auto-generated)
- [ ] `RENDER_EXTERNAL_URL` set to actual deployed URL
- [ ] `ALLOWED_ORIGINS` configured with production domain

### Database

- [ ] MongoDB Atlas cluster created
- [ ] Database user created with strong password
- [ ] IP whitelist includes `0.0.0.0/0` for Render
- [ ] Connection string tested and working
- [ ] Database indexes created (automatic on first connection)

### Third-Party Services

- [ ] Google OAuth credentials are for production
- [ ] Google OAuth redirect URI includes production URL
- [ ] Razorpay LIVE API keys configured (not test keys)
- [ ] Gmail App Password generated and working
- [ ] 2FA enabled on Gmail account

### Security

- [ ] `.env` file in `.gitignore` (verified)
- [ ] No sensitive data in git history
- [ ] Security headers configured (Helmet.js) ✅
- [ ] CORS configured for production domain ✅
- [ ] Rate limiting enabled ✅
- [ ] Input validation active ✅
- [ ] File upload restrictions in place ✅

### Code Quality

- [ ] All `console.log` replaced with `logger` (50+ instances - TODO)
- [ ] No commented-out code in production
- [ ] Error handling properly configured ✅
- [ ] Logging configured for production ✅

## Deployment

### Build & Deploy

- [ ] Code pushed to GitHub
- [ ] Render Blueprint deployed (via `render.yaml`)
- [ ] Build completed successfully
- [ ] Service started without errors

### Post-Deployment Verification

### Health Checks

- [ ] `/health` endpoint returns 200 status
- [ ] Database connection status: "connected"
- [ ] Server uptime showing in health response

### Authentication

- [ ] User registration works
- [ ] Email OTP received and verified
- [ ] Login with email/password works
- [ ] Google OAuth login works
- [ ] Session persists after login
- [ ] Logout works properly

### Admin Panel

- [ ] Admin login works
- [ ] Dashboard loads correctly
- [ ] Customer management accessible
- [ ] Product management works
- [ ] Order management functional

### User Features

- [ ] Homepage loads correctly
- [ ] Product listing displays
- [ ] Product search works
- [ ] Add to cart functional
- [ ] Wishlist works
- [ ] Cart updates correctly
- [ ] Checkout process loads

### Payment & Orders

- [ ] Razorpay integration loads
- [ ] Test payment completes (use Razorpay test card)
- [ ] Order created successfully
- [ ] Order confirmation email sent
- [ ] Invoice generation works
- [ ] Order appears in admin panel
- [ ] Order appears in user account

### Email Notifications

- [ ] OTP emails delivered
- [ ] Order confirmation emails sent
- [ ] Email templates display correctly
- [ ] No email errors in logs

### Performance

- [ ] Page load times < 3 seconds
- [ ] Database queries optimized (indexes working)
- [ ] Keep-alive cron job running
- [ ] No memory leaks in logs

### Monitoring

- [ ] Application logs visible in Render
- [ ] Keep-alive logs showing every 14 minutes:
  ```
  ✅ Keep-alive ping successful (XXms) - Server staying active
  ```
- [ ] No critical errors in logs
- [ ] Health check passing

## Post-Deployment

### Documentation

- [ ] Update README.md with production URL
- [ ] Document any production-specific configurations
- [ ] Create runbook for common issues

### Monitoring Setup

- [ ] Set up uptime monitoring (e.g., UptimeRobot)
- [ ] Configure error alerting (e.g., Sentry)
- [ ] Set up performance monitoring

### Security Hardening

- [ ] Review and test rate limits
- [ ] Verify HTTPS is enforced
- [ ] Test for common vulnerabilities
- [ ] Run security audit: `npm audit`

### Backup & Recovery

- [ ] Database backup strategy in place
- [ ] MongoDB Atlas automated backups enabled
- [ ] Recovery process documented
- [ ] Test database restore

### Domain & DNS (If using custom domain)

- [ ] Custom domain configured in Render
- [ ] DNS records updated
- [ ] SSL certificate issued
- [ ] www and non-www redirects working
- [ ] Update `ALLOWED_ORIGINS` with custom domain

## Ongoing Maintenance

### Weekly

- [ ] Review error logs
- [ ] Check application performance
- [ ] Verify keep-alive is working
- [ ] Monitor database size

### Monthly

- [ ] Review security advisories
- [ ] Update dependencies if needed
- [ ] Check for npm vulnerabilities
- [ ] Review and rotate secrets if needed

### Quarterly

- [ ] Performance audit
- [ ] Security audit
- [ ] Database optimization
- [ ] Cost optimization review

## Rollback Plan

If deployment fails:

1. **Immediate Actions**:

   - Check Render logs for errors
   - Verify environment variables
   - Check database connectivity

2. **Rollback**:

   - Render Dashboard → Redeploy previous version
   - Or: Push previous git commit

3. **Investigation**:
   - Review changes since last deployment
   - Test in staging environment
   - Fix issues before redeploying

## Support Contacts

- **Render Support**: https://render.com/support
- **MongoDB Atlas**: https://support.mongodb.com/
- **Razorpay Support**: https://razorpay.com/support/

---

**Deployment Date**: ********\_********  
**Deployed By**: ********\_********  
**Production URL**: ********\_********  
**Notes**: ********\_********
