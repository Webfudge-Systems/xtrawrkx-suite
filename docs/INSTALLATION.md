# Installation Guide

Complete step-by-step installation guide for the Webfudge Platform.

---

## 📋 Prerequisites Check

Before you begin, verify you have the required software installed:

### 1. Check Node.js

```bash
node --version
# Should be >= 18.0.0
```

If not installed:
- Download from: https://nodejs.org/
- Recommended: Node.js 18.x LTS or 20.x LTS

### 2. Check npm

```bash
npm --version
# Should be >= 9.0.0
```

npm is included with Node.js. If you need to update:

```bash
npm install -g npm@latest
```

### 3. Check Git

```bash
git --version
```

If not installed:
- Windows: https://git-scm.com/download/win
- Mac: `brew install git`
- Linux: `sudo apt-get install git`

---

## 🚀 Installation Steps

### Step 1: Clone or Navigate to Repository

If cloning:
```bash
git clone <repository-url>
cd webfudge-platform
```

If already cloned:
```bash
cd webfudge-platform
```

### Step 2: Install Dependencies

This will install dependencies for all apps and packages in the monorepo:

```bash
npm install
```

**Expected output:**
```
added XXX packages in XXs
```

**If you see errors**, try:
```bash
npm install --legacy-peer-deps
```

or

```bash
npm cache clean --force
npm install
```

### Step 3: Configure Backend Environment

```bash
# Navigate to backend
cd apps/backend

# Copy environment example
cp .env.example .env

# Go back to root
cd ../..
```

### Step 4: Generate Secure Secrets

You need to generate secure secrets for the backend. Use this Node.js command:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Run this command **5 times** to generate 5 different secrets.

Or run this helper script:

```bash
node -e "
for(let i=0; i<5; i++) {
  console.log(require('crypto').randomBytes(32).toString('base64'));
}
"
```

### Step 5: Update Backend .env File

Open `apps/backend/.env` and replace the placeholder values:

```bash
# Use your favorite editor
code apps/backend/.env     # VS Code
nano apps/backend/.env     # Nano
vim apps/backend/.env      # Vim
notepad apps/backend/.env  # Windows Notepad
```

Update these values with the secrets you generated:
```
ADMIN_JWT_SECRET=<secret-1>
API_TOKEN_SALT=<secret-2>
TRANSFER_TOKEN_SALT=<secret-3>
JWT_SECRET=<secret-4>
APP_KEYS=<secret-1>,<secret-2>,<secret-3>,<secret-4>
```

Save and close the file.

---

## ✅ Verification

### Step 1: Verify Installation

Check that all apps have their `node_modules`:

```bash
# Windows PowerShell
Get-ChildItem -Path apps -Directory | ForEach-Object { 
    if (Test-Path "$($_.FullName)\node_modules") { 
        Write-Host "✓ $($_.Name)" -ForegroundColor Green 
    } else { 
        Write-Host "✗ $($_.Name)" -ForegroundColor Red 
    }
}

# Linux/Mac
for dir in apps/*/; do
  if [ -d "$dir/node_modules" ]; then
    echo "✓ $(basename $dir)"
  else
    echo "✗ $(basename $dir)"
  fi
done
```

### Step 2: Verify Environment Configuration

```bash
# Check if backend .env exists
# Windows
if exist apps\backend\.env echo ✓ Backend .env exists
if not exist apps\backend\.env echo ✗ Backend .env missing

# Linux/Mac
[ -f apps/backend/.env ] && echo "✓ Backend .env exists" || echo "✗ Backend .env missing"
```

### Step 3: Test Build (Optional but Recommended)

This ensures everything is properly configured:

```bash
npm run build
```

This will take a few minutes. If successful, you'll see:

```
✓ All apps built successfully
```

If there are errors, review them and fix any configuration issues.

---

## 🎯 First Run

### Option 1: Start All Applications

```bash
npm run dev
```

This starts:
- Landing: http://localhost:3000
- CRM: http://localhost:3001  
- PM: http://localhost:3002
- Accounts: http://localhost:3003
- Vendor: http://localhost:3004
- Backend API: http://localhost:1337

### Option 2: Start Applications Individually

**Terminal 1 - Backend:**
```bash
cd apps/backend
npm run develop
```

**Terminal 2 - Landing:**
```bash
cd apps/landing
npm run dev
```

**Terminal 3 - CRM:**
```bash
cd apps/crm
npm run dev
```

And so on for other apps...

---

## 🔧 Post-Installation Setup

### 1. Create Strapi Admin User

1. Visit: http://localhost:1337/admin
2. Fill in the admin user form:
   - First name
   - Last name
   - Email
   - Password (min 8 characters)
3. Click "Let's start"
4. You're now logged into the Strapi admin panel!

### 2. Explore the Applications

Visit each application to verify they're running:

- **Landing**: http://localhost:3000
  - Should show: "Welcome to Webfudge Platform"
  
- **CRM**: http://localhost:3001
  - Should show: "CRM Application"
  
- **PM**: http://localhost:3002
  - Should show: "Project Management"
  
- **Accounts**: http://localhost:3003
  - Should show: "Account Management"
  
- **Vendor**: http://localhost:3004
  - Should show: "Vendor Portal"

### 3. Verify Backend API

Visit: http://localhost:1337/api

You should see a JSON response:
```json
{
  "data": null,
  "error": {
    "status": 404,
    "name": "NotFoundError",
    "message": "Not Found"
  }
}
```

This is normal - it means the API is running!

---

## 🐛 Troubleshooting

### Issue: "Port already in use"

**Solution 1: Kill the process using the port**

Windows:
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

Linux/Mac:
```bash
lsof -ti:3000 | xargs kill -9
```

**Solution 2: Use a different port**

Edit the app's `package.json`:
```json
"dev": "next dev -p 3005"
```

### Issue: "Module not found"

**Solution: Reinstall dependencies**

```bash
# Clean everything
npm run clean

# Remove lock file
rm package-lock.json

# Reinstall
npm install
```

### Issue: "Cannot find module '@webfudge/...'"

**Solution: Build shared packages first**

```bash
# Build all packages
npm run build

# Or reinstall
npm install
```

### Issue: Strapi admin panel not loading

**Solution: Clear Strapi cache**

```bash
cd apps/backend
rm -rf .cache
npm run develop
```

### Issue: "ENOSPC: System limit for number of file watchers reached"

**Solution (Linux only):**

```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Issue: npm install fails on Windows

**Solution: Run as Administrator or use:**

```bash
npm install --legacy-peer-deps
```

### Issue: Build fails with memory error

**Solution: Increase Node.js memory**

```bash
# Set environment variable
export NODE_OPTIONS="--max-old-space-size=4096"  # Linux/Mac
set NODE_OPTIONS=--max-old-space-size=4096       # Windows

# Then build
npm run build
```

---

## 🔄 Reinstallation

If you need to start fresh:

### Complete Clean Reinstall

```bash
# 1. Stop all running processes (Ctrl+C)

# 2. Remove all node_modules
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules

# 3. Remove lock file
rm package-lock.json

# 4. Clear npm cache
npm cache clean --force

# 5. Remove build artifacts
rm -rf apps/*/.next
rm -rf apps/backend/.cache
rm -rf apps/backend/build
rm -rf apps/backend/.tmp

# 6. Reinstall
npm install

# 7. Rebuild
npm run build

# 8. Start fresh
npm run dev
```

---

## 📊 Installation Checklist

Use this checklist to verify your installation:

- [ ] Node.js >= 18.0.0 installed
- [ ] npm >= 9.0.0 installed
- [ ] Git installed
- [ ] Repository cloned/accessed
- [ ] Dependencies installed (`npm install`)
- [ ] Backend `.env` file created
- [ ] Secure secrets generated
- [ ] Backend `.env` file updated with secrets
- [ ] All apps built successfully (optional)
- [ ] Backend running on port 1337
- [ ] Strapi admin user created
- [ ] All frontend apps running (3000-3004)
- [ ] All apps accessible in browser
- [ ] No console errors

---

## 🎓 Learning Path

After installation, follow this learning path:

1. **Day 1**: Explore all applications, understand the structure
2. **Day 2**: Read [ARCHITECTURE.md](./ARCHITECTURE.md)
3. **Day 3**: Explore Strapi admin panel, create test data
4. **Day 4**: Study [COMMANDS.md](./COMMANDS.md) and practice commands
5. **Day 5**: Read [ENVIRONMENT.md](./ENVIRONMENT.md) and configure environments
6. **Week 2**: Start implementing features using [PROJECT_CHECKLIST.md](./PROJECT_CHECKLIST.md)

---

## 📚 Next Steps

1. **Read Documentation**:
   - [README.md](./README.md) - Project overview
   - [QUICKSTART.md](./QUICKSTART.md) - Quick reference
   - [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture details

2. **Configure Your Environment**:
   - Set up frontend `.env.local` files if needed
   - Configure external services (email, storage, etc.)

3. **Start Development**:
   - Review [PROJECT_CHECKLIST.md](./PROJECT_CHECKLIST.md)
   - Pick a feature to implement
   - Follow the development workflow

4. **Join the Team** (if applicable):
   - Set up your IDE (VS Code recommended)
   - Install recommended extensions
   - Follow team conventions

---

## 🆘 Getting Help

If you encounter issues not covered here:

1. Check [QUICKSTART.md](./QUICKSTART.md) for common issues
2. Search existing issues in the repository
3. Check Strapi documentation: https://docs.strapi.io
4. Check Next.js documentation: https://nextjs.org/docs
5. Ask your team lead or create an issue

---

## 🎉 Installation Complete!

Congratulations! Your Webfudge Platform is now set up and running.

**What you have now:**
- ✅ 5 Next.js frontend applications
- ✅ 1 Strapi backend API
- ✅ Shared component packages
- ✅ Complete development environment

**Ready to build something amazing!** 🚀

---

**Last Updated**: January 7, 2026

