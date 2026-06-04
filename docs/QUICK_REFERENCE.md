# Quick Reference Card

## 🚀 Start Servers

```bash
# Terminal 1 - Backend
cd apps/backend && npm run dev

# Terminal 2 - Frontend  
cd apps/landing && npm run dev
```

## 🌐 URLs

- **Landing:** http://localhost:3000
- **Signup:** http://localhost:3000/signup
- **Login:** http://localhost:3000/login
- **Profile:** http://localhost:3000/profile
- **Backend API:** http://localhost:1337
- **Strapi Admin:** http://localhost:1337/admin

## 🔑 Test Credentials

Create any user via signup, example:
- Email: test@example.com
- Password: password123

## 📡 Key API Endpoints

```bash
# Auth
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/me

# Apps
GET  /api/apps
GET  /api/apps/crm/modules
POST /api/apps/calculate-pricing

# Organizations
POST /api/organizations
GET  /api/organizations/:id
```

## 💰 Sample Pricing (5 users)

**CRM (all modules):**
- Base: $49
- Modules: $38/user × 5 = $190
- **Total: $239/month**

**PM (all modules):**
- Base: $39
- Modules: $26/user × 5 = $130
- **Total: $169/month**

## 🔧 Environment Setup

**Backend (.env):**
```bash
PORT=1337
JWT_SECRET=tobemodified
DATABASE_CLIENT=sqlite
SEED_DATA=true
```

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_API_URL=http://localhost:1337
```

## 📋 Test Flow

1. ✅ Go to http://localhost:3000
2. ✅ Click "Sign Up Free"
3. ✅ Fill form and submit
4. ✅ See apps on profile page
5. ✅ Click "CRM"
6. ✅ Complete 4-step onboarding
7. ✅ See "Active" badge on CRM

## 🐛 Quick Fixes

**Backend won't start:**
```bash
rm -rf apps/backend/.tmp
cd apps/backend && npm run dev
```

**Frontend can't connect:**
```bash
# Check backend is running on 1337
curl http://localhost:1337/api/apps
```

**No apps showing:**
```bash
# Set SEED_DATA=true in apps/backend/.env
# Restart backend
```

**Login fails:**
```bash
# Clear localStorage
localStorage.clear()
# Try signup again
```

## 📊 Database Structure

```
User → OrganizationUser → Organization → Subscription → App
                                      ↓
                                   Modules
```

## 🎯 Success Indicators

✅ Backend logs: "✅ Seed process completed successfully!"
✅ Frontend shows 3 apps (CRM, PM, Accounts)
✅ Can complete onboarding and see "Active" badge
✅ Organization card appears on profile

## 📞 Common Questions

**Q: Where are emails sent?**
A: Logged to console (not sent yet)

**Q: How to add more apps?**
A: Edit `apps/backend/database/seeds/apps-and-modules.js`

**Q: How to reset everything?**
A: Delete `apps/backend/.tmp` folder and restart

**Q: Payment integration?**
A: Not implemented yet (coming soon)

## 📚 Full Documentation

- `SETUP_AND_TEST.md` - Quick setup guide
- `docs/ONBOARDING_SETUP.md` - Detailed docs
- `IMPLEMENTATION_SUMMARY.md` - Complete overview

---

**Status:** ✅ Ready
**Time to Setup:** 5 min
**Complexity:** Low
