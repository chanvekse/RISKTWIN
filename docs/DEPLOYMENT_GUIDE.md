# 🚀 RiskTwin Free Hosting Guide

## Quick Access Options

### 🌐 **Instant Cloud Access** (No Setup Required)

#### Option 1: GitHub Codespaces (Recommended)
**Free Tier**: 120 core-hours/month

1. **Fork the repository** to your GitHub account
2. **Click the green "Code" button** → "Codespaces" → "Create codespace"
3. **Wait 2-3 minutes** for automatic setup
4. **Access the dashboard** at the forwarded port URL (opens automatically)

**Public URL**: Your codespace gets a unique URL like `https://abc123-3000.preview.app.github.dev`

#### Option 2: Gitpod
**Free Tier**: 50 hours/month

1. **Go to**: `https://gitpod.io/#https://github.com/chanvekse/RISKTWIN`
2. **Sign in** with GitHub
3. **Wait for setup** (2-3 minutes)
4. **Dashboard opens** automatically in your browser

**Public URL**: Unique Gitpod workspace URL

---

## 🏗️ **Permanent Free Hosting**

### Option 3: Railway
**Free Tier**: $5 monthly credit (covers small apps)

**Setup Steps**:
1. **Connect GitHub**: Go to [railway.app](https://railway.app) → Sign in with GitHub
2. **Deploy Project**: Click "Deploy from GitHub repo" → Select your RiskTwin fork
3. **Auto-Deploy**: Railway reads `railway.toml` and deploys automatically
4. **Get URL**: `https://risktwin-production.up.railway.app`

**Features**:
- Auto-deploys on Git push
- Built-in PostgreSQL database
- Custom domain support

### Option 4: Render
**Free Tier**: 750 hours/month + free PostgreSQL

**Setup Steps**:
1. **Connect GitHub**: Go to [render.com](https://render.com) → Sign in with GitHub
2. **Create Web Service**: Dashboard → "New" → "Web Service"
3. **Select Repository**: Choose your RiskTwin fork
4. **Auto-Configure**: Render reads `render.yaml` for settings
5. **Deploy**: Automatic deployment begins

**URL**: `https://risktwin.onrender.com`

### Option 5: Vercel + PlanetScale
**Free Tier**: Unlimited deployments + 5GB database

**Setup Steps**:
1. **Deploy Frontend**: Go to [vercel.com](https://vercel.com) → Import Git Repository
2. **Database**: Create free account at [planetscale.com](https://planetscale.com)
3. **Environment Variables**: Add database connection string in Vercel dashboard

---

## 📱 **Share Your Demo**

### Public Access URLs
Once deployed, anyone can access your RiskTwin instance at:

- **Codespaces**: `https://[username]-[repo]-[hash].github.dev`
- **Gitpod**: `https://[workspace-id].gitpod.io`
- **Railway**: `https://risktwin-production.up.railway.app`
- **Render**: `https://risktwin.onrender.com`
- **Vercel**: `https://risktwin.vercel.app`

### Demo Features Available
✅ **Customer Risk Profiles** - Live risk scoring and analytics  
✅ **Scenario Simulation** - What-if analysis for policy changes  
✅ **Portfolio Analytics** - Real-time risk distribution and alerts  
✅ **Geographic Heat Maps** - Risk visualization by location  
✅ **Cohort Analysis** - Risk-based, geographic, and behavioral segments  
✅ **ML Risk Recalculation** - AI-powered risk assessment  

---

## 🛠️ **Custom Domain Setup**

### Railway Custom Domain
1. **Domain Settings**: Project dashboard → Settings → Domains
2. **Add Domain**: Enter your custom domain
3. **DNS Configuration**: Add CNAME record pointing to Railway

### Render Custom Domain
1. **Settings**: Service dashboard → Settings → Custom Domains
2. **Add Domain**: Enter domain and verify ownership
3. **SSL**: Automatic Let's Encrypt certificate

---

## 🔧 **Environment Configuration**

### Required Environment Variables
```bash
# Database (auto-configured on most platforms)
DATABASE_URL=postgresql://user:pass@host:port/db

# Application
NODE_ENV=production
PORT=3000

# Optional: API Keys for external services
ML_SERVICE_API_KEY=your_key_here
```

### Platform-Specific Setup

#### **Railway**
- Environment variables set in dashboard
- Database provisioned automatically
- Zero-config deployment

#### **Render**
- Environment variables in service settings
- Free PostgreSQL database included
- Automatic SSL certificates

#### **Vercel**
- Environment variables in project settings
- Edge function support
- Global CDN distribution

---

## 🚨 **Troubleshooting**

### Common Issues

**Port Binding Error**
```bash
# Solution: Use environment PORT
const port = process.env.PORT || 3000;
```

**Database Connection Failed**
```bash
# Check environment variables
echo $DATABASE_URL
```

**Build Timeout**
```bash
# Increase build timeout in platform settings
# Or optimize build process
```

### Support Resources
- **GitHub Issues**: [Report bugs/questions](https://github.com/chanvekse/RISKTWIN/issues)
- **Documentation**: [Full API docs](./API_DOCUMENTATION.md)
- **Community**: Tag @risktwin for support

---

## 🎯 **Next Steps**

1. **Choose a hosting option** based on your needs
2. **Deploy using the provided configurations**
3. **Share your live demo URL**
4. **Customize branding and data** as needed
5. **Monitor usage** within free tier limits

**Estimated Setup Time**: 5-15 minutes depending on platform

**Total Cost**: $0 (all options have sufficient free tiers)

---

*Each hosting option provides a fully functional RiskTwin instance accessible to anyone with the URL - perfect for demos, portfolio projects, or production use.* 