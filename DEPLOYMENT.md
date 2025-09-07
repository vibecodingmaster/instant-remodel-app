# Deployment Guide - Instant Remodel Application

This guide explains how to securely deploy your Instant Remodel application with proper API key protection.

## 🔒 Security Overview

Your application now uses a **secure backend proxy** to protect your Google Gemini API key:

- **Frontend**: Calls `/api/generate` endpoint (no API key exposure)
- **Backend**: Serverless function securely calls Google Gemini API
- **API Key**: Stored safely as environment variable on server

## 🚀 Quick Deployment Options

### Option 1: Vercel (Recommended)

Vercel is perfect for this React + serverless function setup.

#### Steps:

1. **Create Vercel Account**
   - Sign up at [vercel.com](https://vercel.com)
   - Connect your GitHub account

2. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for deployment with secure API proxy"
   git push origin main
   ```

3. **Import Project**
   - Go to Vercel Dashboard → "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect it as a Vite project

4. **Add Environment Variable**
   - In Project Settings → Environment Variables
   - Add: `GEMINI_API_KEY` = `your_actual_api_key_here`
   - Add for: Production, Preview, Development

5. **Deploy**
   - Click "Deploy" - Vercel handles the rest!
   - Your API function will be available at `https://yourapp.vercel.app/api/generate`

#### Vercel Configuration

Your app includes `vercel.json` with:
- 60-second timeout for image generation
- Proper CORS headers
- Node.js runtime configuration

### Option 2: Netlify

Great alternative with similar serverless function support.

#### Steps:

1. **Create Netlify Account**
   - Sign up at [netlify.com](https://netlify.com)
   - Connect your GitHub account

2. **Import Project**
   - New site from Git → Choose your repository
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Add Environment Variable**
   - Site Settings → Environment Variables
   - Add: `GEMINI_API_KEY` = `your_actual_api_key_here`

4. **Deploy**
   - Netlify will automatically deploy
   - Functions available at `https://yourapp.netlify.app/.netlify/functions/generate`

#### Netlify Configuration

Your app includes `netlify.toml` with:
- Function redirects to `/api/*`
- Proper build settings
- CORS configuration

### Option 3: Firebase Hosting + Cloud Functions

If you prefer Google's ecosystem:

1. **Setup Firebase**
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init
   ```

2. **Configure Functions**
   - Choose Functions and Hosting
   - Deploy the `api/generate.ts` as a Cloud Function

3. **Environment Variables**
   ```bash
   firebase functions:config:set gemini.apikey="your_api_key_here"
   ```

## 🔧 Local Development Setup

To test the secure setup locally:

1. **Copy Environment File**
   ```bash
   cp .env.example .env.local
   ```

2. **Add Your API Key**
   ```
   # .env.local
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Test API Endpoint**
   - Frontend calls: `http://localhost:5173/api/generate`
   - This proxies to your local serverless function

## 🔑 Getting Your Google Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and save it securely
5. **Never commit this key to version control**

## 🛡️ Security Best Practices

### ✅ What We've Implemented

- **API Key Protection**: Never exposed to frontend/browser
- **Backend Proxy**: Secure serverless function handles API calls
- **Input Validation**: Frontend and backend validate all inputs
- **Error Handling**: User-friendly errors without exposing internals
- **CORS Configuration**: Proper cross-origin request handling

### 🚨 Important Security Notes

1. **Never commit `.env.local`** - it's in `.gitignore`
2. **Use environment variables** on hosting platforms
3. **Monitor API usage** in Google AI Studio
4. **Set usage limits** to prevent unexpected charges
5. **Rotate API keys** periodically

## 📊 Monitoring & Debugging

### Check Deployment Status

**Vercel:**
- Dashboard shows build logs and function invocations
- Runtime logs in Functions tab

**Netlify:**
- Site overview shows build status
- Functions tab for serverless function logs

### Common Issues

**"Failed to fetch" errors:**
- Check environment variables are set
- Verify API function is deployed
- Check CORS configuration

**500 Server Errors:**
- Check API key is valid and has credits
- Review function logs for detailed errors
- Verify Google Gemini API is accessible

**Build Failures:**
- Check all dependencies are listed in `package.json`
- Verify TypeScript compilation succeeds locally

## 💰 Cost Optimization

### Google Gemini API Usage

- **Free tier**: Generous limits for development
- **Pay-per-use**: Only charged for successful generations
- **Rate limiting**: Implement if expecting high traffic
- **Monitoring**: Track usage in Google AI Studio

### Hosting Costs

**Vercel:**
- Free tier: 100GB bandwidth, unlimited edge requests
- Pro tier: $20/month for commercial use

**Netlify:**
- Free tier: 100GB bandwidth, 1000 build minutes
- Pro tier: $19/month for advanced features

## 🔄 Updating Your App

To deploy updates:

1. Make changes to your code
2. Commit to GitHub:
   ```bash
   git add .
   git commit -m "Your update message"
   git push origin main
   ```
3. Vercel/Netlify automatically redeploys
4. No need to touch environment variables again

## 📋 Pre-Deployment Checklist

- [ ] API key obtained from Google AI Studio
- [ ] Code pushed to GitHub repository
- [ ] Hosting platform account created
- [ ] Environment variable `GEMINI_API_KEY` configured
- [ ] Build succeeds locally with `npm run build`
- [ ] API function tested locally
- [ ] Domain/URL configured (if custom domain needed)

## 🎉 You're Ready to Deploy!

Your application is now production-ready with:
- ✅ Secure API key handling
- ✅ Scalable serverless architecture
- ✅ Multiple deployment options
- ✅ Comprehensive error handling
- ✅ Performance optimizations

Choose your preferred hosting platform and follow the steps above. Your Instant Remodel app will be live and secure!