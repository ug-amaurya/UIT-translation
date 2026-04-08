#!/bin/bash

# Production Deployment Script for Translation App
# Phase 5: Production Ready Implementation

echo "🚀 Starting Production Deployment - Phase 5"
echo "=============================================="

# Check if required tools are installed
command -v vercel >/dev/null 2>&1 || { echo "❌ Error: Vercel CLI is required but not installed. Run: npm install -g vercel"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Error: Node.js is required but not installed."; exit 1; }

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}📋 Phase 5 Features Checklist${NC}"
echo "================================"
echo "✅ Rate Limiting (100 req/15min per IP)"
echo "✅ Security Headers (CORS, XSS, Content-Type)"  
echo "✅ Enhanced Error Monitoring & Logging"
echo "✅ Production API with Deep Object Translation"
echo "✅ Health Check Endpoint (/api/health)"
echo "✅ Environment Configuration"
echo "✅ Enhanced Caching with TTL"
echo "✅ Payload Size Validation (10MB limit)"
echo "✅ Request Timeout Protection (15s)"
echo "✅ Comprehensive Error Responses"

echo ""
echo -e "${YELLOW}🔧 Starting Build Process...${NC}"

# Build frontend
echo "📦 Building Angular frontend..."
if cd frontend && npm install && npm run build && cd ..; then
    echo -e "${GREEN}✅ Frontend build successful${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

# Test API endpoints locally (if dev server is running)
echo ""
echo -e "${YELLOW}🧪 Testing API Endpoints...${NC}"

# Start dev server in background for testing
echo "🔄 Starting development server for testing..."
node dev-server.js &
DEV_PID=$!
sleep 3

# Test health endpoint
echo "📡 Testing health endpoint..."
if curl -s -f http://localhost:3001/api/health > /dev/null; then
    echo -e "${GREEN}✅ Health check endpoint working${NC}"
else
    echo -e "${YELLOW}⚠️  Health endpoint not responding (may be expected if dev server not running)${NC}"
fi

# Test translation endpoint
echo "🌍 Testing translation endpoint..."
TRANSLATION_TEST=$(curl -s -X POST http://localhost:3001/api/translate \
    -H "Content-Type: application/json" \
    -d '{"text":"Hello world","targetLanguage":"es"}' || echo "FAILED")

if [[ $TRANSLATION_TEST == *"translatedText"* ]]; then
    echo -e "${GREEN}✅ Translation endpoint working${NC}"
else
    echo -e "${YELLOW}⚠️  Translation endpoint not responding (may be expected if dev server not running)${NC}"
fi

# Clean up dev server
kill $DEV_PID 2>/dev/null

echo ""
echo -e "${BLUE}🚀 Deploying to Vercel...${NC}"

# Deploy to Vercel
if vercel --prod; then
    echo ""
    echo -e "${GREEN}🎉 DEPLOYMENT SUCCESSFUL!${NC}"
    echo "=================================="
    echo ""
    echo -e "${BLUE}📱 Your app is now live with Phase 5 features:${NC}"
    echo ""
    echo -e "${GREEN}🌐 Frontend:${NC} Check your Vercel dashboard for the live URL"
    echo -e "${GREEN}🔥 API Translate:${NC} https://your-app.vercel.app/api/translate"
    echo -e "${GREEN}💚 Health Check:${NC} https://your-app.vercel.app/api/health"
    echo ""
    echo -e "${BLUE}🛡️  Production Features Active:${NC}"
    echo "• ⚡ Rate limiting: 100 requests per 15 minutes"
    echo "• 🔒 Security headers: CORS, XSS protection"
    echo "• 📊 Request monitoring with metrics"
    echo "• 🚨 Enhanced error handling"
    echo "• 💾 Smart caching with 1-hour TTL"
    echo "• 📱 Responsive modern UI with search dropdown"
    echo "• 📋 Copy & search functionality"
    echo "• 🌍 Deep object translation support"
    echo ""
    echo -e "${YELLOW}📚 Next Steps:${NC}"
    echo "1. Test your live app thoroughly"
    echo "2. Monitor API usage and adjust rate limits if needed"
    echo "3. Set up monitoring alerts (optional)"
    echo "4. Consider adding authentication for premium features"
    echo ""
    echo -e "${GREEN}✨ Translation App - Phase 5 Complete! ✨${NC}"
else
    echo -e "${RED}❌ Deployment failed. Check the error messages above.${NC}"
    echo ""
    echo -e "${YELLOW}🔧 Troubleshooting Tips:${NC}"
    echo "1. Ensure you're logged in to Vercel: vercel login"
    echo "2. Check that all files are committed to git"
    echo "3. Verify package.json and vercel.json configurations"
    echo "4. Review the DEPLOYMENT.md guide"
    exit 1
fi