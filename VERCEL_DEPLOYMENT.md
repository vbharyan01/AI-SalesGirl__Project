# 🚀 Vercel Deployment Guide for AI Sales Girl

This guide will help you deploy your AI Sales Girl project to Vercel with proper configuration for both frontend and backend.

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your project should be on GitHub
3. **MongoDB Atlas**: For production database (free tier available)
4. **Environment Variables**: Configured for production

## 🔧 Step 1: Prepare Your Project

### 1.1 Update Environment Variables
Create a `.env.local` file for local testing:

```bash
# Copy from env.example and update values
cp env.example .env.local
```

### 1.2 Test Local Build
Ensure your project builds locally:

```bash
# Install dependencies
npm install
cd client && npm install && cd ..

# Test build
npm run build

# Test start
npm start
```

## 🌐 Step 2: MongoDB Atlas Setup

### 2.1 Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster (free tier: M0)

### 2.2 Get Connection String
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database user password

### 2.3 Create Database User
1. Go to Database Access
2. Add new database user
3. Set username and password
4. Grant "Read and write to any database" permissions

## 🚀 Step 3: Deploy to Vercel

### 3.1 Connect Repository
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Select the repository

### 3.2 Configure Project Settings

#### Build Settings
- **Framework Preset**: Other
- **Root Directory**: `./` (root of project)
- **Build Command**: `npm run vercel-build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

#### Environment Variables
Add these environment variables in Vercel:

```bash
# Database Configuration
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/ai_sales_girl?retryWrites=true&w=majority
MONGO_DB_NAME=ai_sales_girl
USE_MONGO=1

# Server Configuration
NODE_ENV=production
PORT=3000

# Authentication
SESSION_SECRET=your-very-long-random-secret-key-here

# CORS Configuration
CORS_ORIGINS=https://your-domain.vercel.app

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# VAPI Configuration (Optional)
VAPI_API_KEY=your_vapi_api_key
API_KEY=your_vapi_api_key
```

### 3.3 Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Check for any build errors

## 🔍 Step 4: Verify Deployment

### 4.1 Check API Endpoints
Test your backend API:

```bash
# Test health endpoint
curl https://your-domain.vercel.app/api/stats

# Test authentication
curl -X POST https://your-domain.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass"}'
```

### 4.2 Check Frontend
1. Visit your Vercel domain
2. Test the login/signup functionality
3. Verify dashboard loads properly

## 🛠️ Step 5: Troubleshooting

### 5.1 Common Build Errors

#### MongoDB Connection Error
```
Error: querySrv ENOTFOUND _mongodb._tcp.clus
```
**Solution**: Check your `MONGO_URL` environment variable in Vercel

#### Module Not Found
```
Error: Cannot find module 'express'
```
**Solution**: Ensure `@vercel/node` is in your dependencies

#### CORS Errors
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```
**Solution**: Check `CORS_ORIGINS` environment variable

### 5.2 Environment Variable Issues

#### Check Variables in Vercel
1. Go to Project Settings → Environment Variables
2. Verify all variables are set correctly
3. Ensure variables are deployed to production

#### Redeploy After Variable Changes
```bash
# In Vercel dashboard, redeploy the project
# Or push a new commit to trigger auto-deploy
```

## 🔒 Step 6: Security Configuration

### 6.1 Session Security
- Use a strong `SESSION_SECRET` (32+ characters)
- Enable HTTPS (automatic with Vercel)
- Set proper cookie settings

### 6.2 CORS Security
- Limit `CORS_ORIGINS` to your actual domains
- Don't use wildcards in production
- Include both frontend and backend domains

### 6.3 Database Security
- Use MongoDB Atlas network access controls
- Enable IP whitelist if needed
- Use strong database passwords

## 📱 Step 7: Frontend Configuration

### 7.1 Update API Base URL
In your frontend code, update API calls to use relative URLs:

```typescript
// Instead of hardcoded localhost URLs
const API_BASE = process.env.NODE_ENV === 'production' 
  ? '' // Relative URLs work with Vercel
  : 'http://localhost:5001';

// Use relative URLs
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

### 7.2 Environment Variables in Frontend
Create `.env.local` in client directory:

```bash
# Client environment variables
VITE_API_BASE_URL=/api
VITE_APP_NAME=AI Sales Girl
```

## 🔄 Step 8: Continuous Deployment

### 8.1 Auto-Deploy
- Vercel automatically deploys on every push to main branch
- Preview deployments for pull requests
- Automatic rollback on failed deployments

### 8.2 Custom Domains
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `CORS_ORIGINS` to include new domain

## 📊 Step 9: Monitoring & Analytics

### 9.1 Vercel Analytics
- Enable Vercel Analytics in project settings
- Monitor performance and errors
- Track user behavior

### 9.2 Logs & Debugging
- Check Vercel Function Logs
- Monitor API response times
- Debug production issues

## 🎯 Step 10: Testing Production

### 10.1 Test Authentication Flow
1. **Signup**: Create a new user account
2. **Login**: Test with created credentials
3. **Dashboard**: Verify protected routes work
4. **Logout**: Test session termination

### 10.2 Test API Endpoints
```bash
# Test all endpoints
curl -X POST https://your-domain.vercel.app/api/auth/signup -H "Content-Type: application/json" -d '{"username":"testuser","password":"testpass"}'
curl -X POST https://your-domain.vercel.app/api/auth/login -H "Content-Type: application/json" -d '{"username":"testuser","password":"testpass"}'
curl -H "Authorization: Bearer YOUR_TOKEN" https://your-domain.vercel.app/api/stats
```

## 🏆 Success Checklist

- [ ] Project builds successfully on Vercel
- [ ] MongoDB Atlas connection established
- [ ] Environment variables configured
- [ ] API endpoints responding correctly
- [ ] Frontend loads without errors
- [ ] Authentication flow works
- [ ] CORS configured properly
- [ ] Custom domain configured (if needed)
- [ ] SSL certificate active
- [ ] Performance monitoring enabled

## 🆘 Support & Resources

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **MongoDB Atlas**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- **Project Issues**: Check GitHub repository issues
- **Vercel Support**: Available in dashboard

## 🎉 Congratulations!

Your AI Sales Girl project is now deployed on Vercel with:
- ✅ **Production-ready backend** with MongoDB Atlas
- ✅ **Scalable hosting** with automatic deployments
- ✅ **Professional domain** with SSL
- ✅ **Performance monitoring** and analytics
- ✅ **Continuous deployment** from GitHub

**Your project is now ready for production use and can be shared with employers! 🚀**
