#!/bin/bash

# FlowMind Quick Deploy Script
# Run this after cloning your repo

echo "🧠 FlowMind Deployment Setup"
echo "============================"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if logged in
echo "🔐 Checking Vercel login..."
vercel whoami || vercel login

echo ""
echo "📋 Pre-deployment Checklist:"
echo "----------------------------"
echo "Make sure you have:"
echo "  ✓ Supabase project URL and keys"
echo "  ✓ Groq API key"
echo "  ✓ Paystack API keys and plan codes"
echo ""

read -p "Ready to deploy? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Starting deployment..."
    echo ""
    
    # Link to Vercel project (or create new)
    vercel link
    
    echo ""
    echo "⚙️  Now add your environment variables in Vercel Dashboard:"
    echo "   https://vercel.com/dashboard → Your Project → Settings → Environment Variables"
    echo ""
    echo "   Required variables:"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo "   - GROQ_API_KEY"
    echo "   - NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY"
    echo "   - PAYSTACK_SECRET_KEY"
    echo "   - PAYSTACK_PRO_MONTHLY_PLAN_CODE"
    echo "   - PAYSTACK_PRO_YEARLY_PLAN_CODE"
    echo "   - NEXT_PUBLIC_APP_URL"
    echo ""
    
    read -p "Environment variables added? (y/n) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "🚀 Deploying to production..."
        vercel --prod
        
        echo ""
        echo "✅ Deployment complete!"
        echo ""
        echo "📝 Post-deployment steps:"
        echo "   1. Update NEXT_PUBLIC_APP_URL with your Vercel URL"
        echo "   2. Update Supabase Site URL and Redirect URLs"
        echo "   3. Configure Paystack webhook URL"
        echo "   4. Test authentication and payments"
        echo ""
        echo "📖 See DEPLOYMENT.md for detailed instructions"
    fi
else
    echo "Deployment cancelled. Run this script again when ready."
fi
