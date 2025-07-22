#!/bin/bash

# Vercel Deployment Verification Script
# This script helps verify that Vercel is configured correctly

echo "🔍 Vercel Deployment Configuration Verification"
echo "================================================"

# Check if vercel.json exists
if [ -f "vercel.json" ]; then
    echo "✅ vercel.json found"
    
    # Check if git configuration exists
    if grep -q "deploymentEnabled" vercel.json; then
        echo "✅ Branch deployment configuration found"
        
        # Check main branch configuration
        if grep -q '"main": true' vercel.json; then
            echo "✅ Main branch deployment enabled"
        else
            echo "❌ Main branch deployment not enabled"
        fi
        
        # Check beta branch configuration
        if grep -q '"beta": false' vercel.json; then
            echo "✅ Beta branch deployment disabled"
        else
            echo "❌ Beta branch deployment not properly disabled"
        fi
    else
        echo "❌ Branch deployment configuration missing"
    fi
else
    echo "❌ vercel.json not found"
fi

echo ""
echo "📋 Manual Verification Steps:"
echo "============================="
echo "1. Go to Vercel Dashboard: https://vercel.com/dashboard"
echo "2. Select your project: sunrise-2025"
echo "3. Go to Settings → Git"
echo "4. Verify branch deployment settings:"
echo "   - ✅ main: Enabled"
echo "   - ❌ beta: Disabled"
echo ""
echo "5. Test the configuration:"
echo "   - Push to beta branch (should NOT deploy)"
echo "   - Push to main branch (should deploy)"
echo ""
echo "🔗 Vercel Dashboard: https://vercel.com/dashboard"
echo "🔗 Project Settings: https://vercel.com/dashboard/[your-project]/settings/git" 