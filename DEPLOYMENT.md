# Deployment Guide for ABILounge

This guide will help you deploy your frontend and backend to Render. Render automatically deploys when you push to your repository (Auto-Deploy).

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com) (free tier available)
2. **GitHub Account**: Your code should be in a GitHub repository
3. **Supabase Account**: Already configured (you're using it)

## Step 1: Deploy Services on Render

### Option A: Using Render Blueprint (Recommended)

1. Go to Render Dashboard → **New** → **Blueprint**
2. Connect your GitHub repository
3. Render will automatically detect `render.yaml` and create both services
4. After services are created, set the environment variables:
   - **Backend**: `SUPABASE_URL`, `SUPABASE_PUBLIC_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - **Frontend**: `VITE_API_URL` (set to your backend URL, e.g., `https://abilounge-backend.onrender.com`)

### Option B: Manual Setup

#### Backend Service

1. Go to Render Dashboard → **New** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `abilounge-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && node server.js`
   - **Plan**: Free
4. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `PORT` = `8787` (or leave empty, Render will auto-assign)
   - `SUPABASE_URL` = (your Supabase URL)
   - `SUPABASE_PUBLIC_KEY` = (your Supabase anon key)
   - `SUPABASE_SERVICE_ROLE_KEY` = (your Supabase service role key)

#### Frontend Service

1. Go to Render Dashboard → **New** → **Static Site**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `abilounge-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
   - **Plan**: Free
4. Add Environment Variable:
   - `VITE_API_URL` = `https://abilounge-backend.onrender.com` (replace with your actual backend URL)

## Step 2: Configure Auto-Deploy

Render automatically deploys when you push commits to your connected repository. Auto-deploy is enabled by default when you connect a repository.

**To verify auto-deploy is enabled:**
1. Go to Render Dashboard → Your Service → Settings
2. Scroll to **Auto-Deploy** section
3. Ensure it's set to "Yes" and connected to your branch (usually `main` or `master`)

## Step 3: Test the Deployment

1. Push to your `main` or `master` branch
2. Render will automatically:
   - Detect the new commit
   - Build and deploy your services
   - Show "New commit via Auto-Deploy" in the deployment logs
3. Check Render dashboard for deployment status:
   - Go to your service → **Events** tab
   - You'll see the deployment progress and logs

## Environment Variables Reference

### Backend (.env)
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_PUBLIC_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
PORT=8787
NODE_ENV=production
```

### Frontend (.env)
```
VITE_API_URL=https://abilounge-backend.onrender.com
```

**Note**: In development, leave `VITE_API_URL` empty to use Vite's proxy.

## Troubleshooting

### Backend Issues

- **Service won't start**: Check environment variables are set correctly
- **Port issues**: Render automatically assigns a port, but you can set `PORT` env var
- **Database connection**: Verify Supabase credentials are correct

### Frontend Issues

- **API calls failing**: Ensure `VITE_API_URL` is set correctly in Render
- **Build fails**: Check Node version matches (should be 20.19.0 or >=22.12.0)
- **CORS errors**: Backend CORS is configured to allow all origins, should work

### Auto-Deploy Issues

- **Deployment not triggered**: Check that Auto-Deploy is enabled in Render service settings
- **Wrong branch**: Ensure Auto-Deploy is connected to the correct branch (`main` or `master`)
- **Build fails**: Check the deployment logs in Render dashboard for specific error messages

## Notes

- **Auto-Deploy**: Render automatically deploys when you push to your connected branch
- **Manual Deploy**: You can manually trigger deployments from Render dashboard → Service → Manual Deploy
- **Free Tier**: Services spin down after 15 minutes of inactivity (cold starts)
- **First Deployment**: May take 5-10 minutes
- **Subsequent Deployments**: Faster (~2-3 minutes)

