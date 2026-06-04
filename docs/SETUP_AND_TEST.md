# Quick Setup & Test Guide

## 🚀 Quick Start (5 minutes)

### Step 1: Install Dependencies

```bash
# Install all dependencies from root
npm install
```

### Step 2: Setup Backend

```bash
cd apps/backend

# Create .env file
cat > .env << 'EOF'
HOST=0.0.0.0
PORT=1337
APP_KEYS=toBeModified1,toBeModified2
API_TOKEN_SALT=tobemodified
ADMIN_JWT_SECRET=tobemodified
TRANSFER_TOKEN_SALT=tobemodified
JWT_SECRET=tobemodified
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db
FRONTEND_URL=http://localhost:3000
SEED_DATA=true
EOF

# Start backend
npm run dev
```

**Wait for:** "🌱 Running database seeds..." and "✅ Seed process completed successfully!"

### Step 3: Setup Frontend (New Terminal)

```bash
cd apps/landing

# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:1337" > .env.local

# Start frontend
npm run dev
```

### Step 4: Test the System

1. **Open browser:** `http://localhost:3000`

2. **Sign Up:**
   - Click "Sign Up Free"
   - Fill in form (any valid email/password)
   - You'll be redirected to profile page

3. **View Apps:**
   - See CRM, Project Management, and Accounts apps
   - Each shows pricing and description

4. **Setup CRM (Onboarding):**
   - Click on "CRM" app
   - **Step 1:** Core modules pre-selected, optionally add "Reports & Analytics"
   - **Step 2:** Enter company details (only name required)
   - **Step 3:** Enter number of users (default 1), optionally add emails to invite
   - **Step 4:** See pricing breakdown
   - Click "Start Free Trial"

5. **Verify Success:**
   - Modal closes
   - Page refreshes
   - CRM now shows "Active" badge
   - New organization card appears at top

## 📋 Test Checklist

- [ ] Backend starts successfully on port 1337
- [ ] Seed data creates 3 apps with modules
- [ ] Frontend starts on port 3000
- [ ] Landing page displays properly
- [ ] Signup creates user account
- [ ] Login works with created credentials
- [ ] Profile page shows available apps
- [ ] Apps are organized by category
- [ ] Clicking app opens onboarding modal
- [ ] Module selection works (core modules locked)
- [ ] Company details form validates
- [ ] User count affects pricing calculation
- [ ] Pricing summary is accurate
- [ ] Organization creation succeeds
- [ ] Active badge appears on subscribed app
- [ ] Organizations section shows created org

## 🧪 API Testing

Test the backend APIs directly:

```bash
# Get all apps
curl http://localhost:1337/api/apps

# Get CRM modules
curl http://localhost:1337/api/apps/crm/modules

# Calculate pricing
curl -X POST http://localhost:1337/api/apps/calculate-pricing \
  -H "Content-Type: application/json" \
  -d '{"appId": 1, "moduleIds": [1, 2, 3], "userCount": 5}'
```

## 🎯 Expected Results

### Apps Seeded:
1. **CRM** - $49/mo base + modules
   - Core ($5/user)
   - Leads ($10/user)
   - Pipeline ($15/user)
   - Reports ($8/user) - optional

2. **Project Management** - $39/mo base + modules
   - Core ($12/user)
   - Tasks ($8/user)
   - Reports ($6/user) - optional

3. **Accounts** - $29/mo base + modules
   - Core ($5/user)
   - Billing ($8/user)

### Example Pricing (CRM with 5 users, all modules):
- Base: $49/mo
- Core: $5 × 5 = $25
- Leads: $10 × 5 = $50
- Pipeline: $15 × 5 = $75
- Reports: $8 × 5 = $40
- **Total: $239/mo**

## 🔍 Debugging

### Backend Logs
```bash
# Check backend console for:
🚀 Strapi is bootstrapping...
🌱 Running database seeds...
📦 Seeding app: CRM
✅ Seed process completed successfully!
```

### Frontend Logs
```bash
# Check browser console for:
- API requests to http://localhost:1337
- JWT token storage
- No CORS errors
```

### Database Check
```bash
# Open Strapi Admin (if needed)
http://localhost:1337/admin

# Create admin account on first visit
# Then browse Content Manager to see:
- Apps (3 entries)
- Modules (9+ entries)
- Organizations (created via onboarding)
- Subscriptions (created via onboarding)
```

## 🐛 Common Issues

### Issue: "Failed to fetch"
**Solution:** Backend not running. Start backend first.

### Issue: Apps not showing
**Solution:** Seed didn't run. Check SEED_DATA=true in backend/.env

### Issue: Can't login after signup
**Solution:** Check browser console, verify JWT_SECRET is set

### Issue: Onboarding fails
**Solution:** Check backend logs, ensure organization creation endpoint works

### Issue: CORS error
**Solution:** Verify middlewares.js includes localhost:3000 in allowed origins

## ✅ Success!

If you can:
1. ✅ Sign up a new user
2. ✅ See apps on profile page
3. ✅ Complete onboarding for an app
4. ✅ See "Active" badge on the app

**Congratulations! The system is working perfectly!** 🎉

## 📚 Next Steps

- Read `docs/ONBOARDING_SETUP.md` for detailed documentation
- Test other apps (PM, Accounts)
- Invite users via Step 3 of onboarding
- Test login/logout flow
- Explore API endpoints
- Set up other frontend apps (CRM, PM)

## 🆘 Need Help?

1. Check backend console logs
2. Check browser console logs
3. Verify both servers are running
4. Clear localStorage and try again
5. Delete apps/backend/.tmp and restart backend

---

**Estimated Time:** 5 minutes
**Difficulty:** Easy
**Status:** ✅ Ready to Test
