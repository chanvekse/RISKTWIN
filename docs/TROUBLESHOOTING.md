# 🔧 RiskTwin Platform - Troubleshooting Guide

## Common Issues and Solutions

### 🚫 "http://localhost:3000 is not reachable"

**Symptoms:**
- Browser shows "This site can't be reached"
- Connection refused errors
- Server not responding

**Solutions:**

#### 1. **Check if Server is Running**
```bash
# Look for Node.js process
tasklist | findstr node.exe

# If not running, start the server
cd backend
node server.js
```

#### 2. **Check Server Startup**
Make sure you see this output when starting:
```
RiskTwin API listening on 3000
📊 Analytics Services Initialized:
  • ML Risk Scoring Service
  • Portfolio Analytics Service
  [... other services]
🌐 Frontend UI available at: http://localhost:3000
```

#### 3. **Verify File Structure**
Ensure files are in correct locations:
```
risktwin/
├── backend/
│   └── server.js          ← Main server file
├── frontend/
│   └── ui/
│       └── index.html     ← Dashboard file
├── services/              ← Analytics services
└── start.bat             ← Startup script
```

#### 4. **Check Port Availability**
```bash
# Check if port 3000 is in use
netstat -an | findstr :3000

# If occupied, kill the process or use different port
```

### 🔌 Database Connection Issues

**Symptoms:**
- Server starts but API calls fail
- "ECONNRESET" errors in console
- PostgreSQL connection errors

**Solutions:**

#### 1. **Verify Internet Connection**
The app uses Neon cloud database - ensure internet access.

#### 2. **Check Database Credentials**
Verify connection string in `backend/server.js`:
```javascript
const pool = new Pool({
  connectionString: "postgresql://..."
});
```

### 📁 File Not Found Errors

**Symptoms:**
- "Cannot find module" errors
- "ENOENT: no such file or directory"
- Import/require failures

**Solutions:**

#### 1. **Reinstall Dependencies**
```bash
# From project root
npm install
```

#### 2. **Check File Paths**
Ensure you're running from correct directory:
```bash
# Should be in backend/ when starting server
cd backend
node server.js
```

#### 3. **Verify Services Exist**
Check that all service files are in `services/` folder:
- `ml-service.js`
- `portfolio-service.js`
- `heatmap-service.js`
- `cohort-service.js`
- `predictive-service.js`
- `alert-service.js`

### 🎨 UI Not Loading

**Symptoms:**
- Blank page at localhost:3000
- CSS/JavaScript not loading
- 404 errors for static files

**Solutions:**

#### 1. **Check Static Path**
Verify server.js has correct static path:
```javascript
app.use(express.static('../frontend/ui'));
```

#### 2. **Verify UI Files**
Ensure `frontend/ui/index.html` exists and is not empty.

#### 3. **Clear Browser Cache**
- Press Ctrl+F5 to hard refresh
- Clear browser cache
- Try incognito/private mode

### ⚡ API Endpoints Not Working

**Symptoms:**
- Dashboard loads but data doesn't appear
- Network errors in browser console
- API returns 500 errors

**Solutions:**

#### 1. **Test API Directly**
```bash
# Test high-risk endpoint
curl http://localhost:3000/api/high-risk

# Or using PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/api/high-risk" -Method GET
```

#### 2. **Check Server Console**
Look for error messages in server output.

#### 3. **Verify Database Schema**
Ensure database has required tables and functions.

### 🔄 Start Fresh

If all else fails, start from scratch:

#### 1. **Stop All Processes**
```bash
taskkill /F /IM node.exe
```

#### 2. **Reinstall Dependencies**
```bash
rm -rf node_modules
npm install
```

#### 3. **Restart Server**
```bash
cd backend
node server.js
```

## 🆘 Getting Help

### Check Logs
1. **Server Console**: Look for error messages
2. **Browser Console**: Check for JavaScript errors
3. **Network Tab**: Verify API calls

### Verify URLs
- **Dashboard**: http://localhost:3000
- **API Health**: http://localhost:3000/api/high-risk
- **Documentation**: Check `docs/` folder

### Contact Information
- Check `README.md` for full documentation
- Review `PROJECT_STRUCTURE.md` for architecture
- All services are documented in their respective files

---

**💡 Pro Tip:** Always run the server from the `backend/` directory or use the `start.bat` script for best results! 