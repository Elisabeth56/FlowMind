# FlowMind Deployment Guide - Vercel

## Prerequisites

Before deploying, make sure you have:
- ✅ GitHub account with your FlowMind repo
- ✅ Vercel account (free at vercel.com)
- ✅ Supabase project set up with schema
- ✅ Groq API key
- ✅ Paystack account with plans created

---

## Step 1: Prepare Your Repository

Make sure all files are committed to your GitHub repo:

```bash
# In your project folder
git add .
git commit -m "Ready for deployment"
git push origin main
```

Your repo should have this structure:
```
flowmind/
├── app/
│   ├── api/
│   │   ├── organize/
│   │   ├── daily-plan/
│   │   ├── weekly-summary/
│   │   ├── payments/
│   │   └── webhooks/
│   ├── app/           # Dashboard pages
│   ├── auth/          # Auth routes
│   ├── login/
│   └── signup/
├── components/
├── hooks/
├── lib/
│   ├── ai/
│   ├── paystack/
│   └── supabase/
├── types/
├── middleware.ts
├── vercel.json
└── package.json
```

---

## Step 2: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your FlowMind repository
4. Vercel auto-detects Next.js - keep defaults
5. **Add Environment Variables** (see Step 3)
6. Click **Deploy**

### Option B: Via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (from project folder)
vercel

# Follow prompts, then deploy to production
vercel --prod
```

---

## Step 3: Configure Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables

Add these variables for **Production**, **Preview**, and **Development**:

### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...
```

### Groq (AI)
```
GROQ_API_KEY=gsk_your_groq_api_key
```

### Paystack
```
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_your_key
PAYSTACK_SECRET_KEY=sk_live_your_key
PAYSTACK_PRO_MONTHLY_PLAN_CODE=PLN_xxxxx
PAYSTACK_PRO_YEARLY_PLAN_CODE=PLN_xxxxx
```

### App URL
```
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```
⚠️ Update this after first deploy with your actual Vercel URL!

### Optional: LangSmith
```
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=ls__your_key
LANGCHAIN_PROJECT=flowmind
```

---

## Step 4: Update Supabase Settings

After deployment, update Supabase with your production URL:

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Update **Site URL**: `https://your-app.vercel.app`
3. Add **Redirect URLs**:
   ```
   https://your-app.vercel.app/**
   https://your-app.vercel.app/auth/callback
   ```

4. If using Google OAuth:
   - Go to Google Cloud Console
   - Add `https://your-app.vercel.app` to authorized origins
   - Add `https://your-project.supabase.co/auth/v1/callback` to redirect URIs

---

## Step 5: Configure Paystack Webhook

1. Go to Paystack Dashboard → Settings → API Keys & Webhooks
2. Set **Webhook URL**: 
   ```
   https://your-app.vercel.app/api/webhooks/paystack
   ```
3. Enable events:
   - ✅ charge.success
   - ✅ subscription.create
   - ✅ subscription.disable
   - ✅ subscription.not_renew
   - ✅ invoice.payment_failed
   - ✅ invoice.update

---

## Step 6: Test Your Deployment

### 1. Test Authentication
- [ ] Sign up with email → Check verification email
- [ ] Sign in with email/password
- [ ] Sign in with Google (if enabled)
- [ ] Sign out

### 2. Test Core Features
- [ ] Add item to inbox
- [ ] AI organizes item automatically
- [ ] View Today's plan
- [ ] Create a project
- [ ] View weekly insights

### 3. Test Payments
- [ ] Go to Settings → Billing
- [ ] Click "Upgrade to Pro"
- [ ] Complete test payment
- [ ] Verify Pro status updated

---

## Step 7: Custom Domain (Optional)

1. In Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain: `flowmind.app`
3. Update DNS records as instructed
4. Update environment variables:
   ```
   NEXT_PUBLIC_APP_URL=https://flowmind.app
   ```
5. Update Supabase redirect URLs
6. Update Paystack webhook URL

---

## Troubleshooting

### Build Fails
```bash
# Check build locally first
npm run build
```
Common issues:
- Missing environment variables
- TypeScript errors
- Import path issues

### Auth Not Working
- Check Supabase Site URL matches your Vercel URL
- Check redirect URLs include `/**` wildcard
- Clear browser cookies and try again

### Payments Not Working
- Verify Paystack webhook URL is correct
- Check webhook events are enabled
- Test with Paystack test mode first

### AI Features Slow/Failing
- Check Groq API key is valid
- Check rate limits (free tier: 30 req/min)
- Monitor in Vercel Functions logs

---

## Monitoring & Logs

### Vercel Logs
- Dashboard → Your Project → Deployments → Logs
- Or use CLI: `vercel logs`

### Supabase Logs
- Dashboard → Logs (SQL, Auth, Edge Functions)

### Paystack
- Dashboard → Transactions → See failed/successful payments

---

## Production Checklist

Before going live:

- [ ] All environment variables set for Production
- [ ] Supabase URLs updated to production domain
- [ ] Paystack switched to Live mode (not Test)
- [ ] Google OAuth updated (if using)
- [ ] Custom domain configured (optional)
- [ ] SSL working (automatic with Vercel)
- [ ] Test complete user flow end-to-end
- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Set up uptime monitoring (e.g., Better Uptime)

---

## Updating Your App

To deploy updates:

```bash
# Make changes, then
git add .
git commit -m "Your update message"
git push origin main

# Vercel auto-deploys from main branch!
```

Or manually trigger:
```bash
vercel --prod
```

---

🎉 **Congratulations! FlowMind is now live!**

Your AI-powered productivity OS is ready for users.
