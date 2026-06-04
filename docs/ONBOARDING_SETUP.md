# Onboarding & Authentication Setup Guide

This guide explains the complete signup, authentication, and onboarding flow implementation.

## 🎯 Overview

The platform now includes:
- ✅ User signup and authentication
- ✅ Organization/Enterprise creation
- ✅ App and module selection
- ✅ Dynamic pricing calculation
- ✅ User invitations
- ✅ Complete onboarding flow

## 🏗️ Architecture

### Backend (Strapi)

#### Content Types Created:
1. **Organization** - Companies/enterprises using the platform
2. **App** - Available applications (CRM, PM, Accounts, etc.)
3. **Module** - Features within each app
4. **Subscription** - Organization subscriptions to apps
5. **Invitation** - User invitations to organizations
6. **Organization-User** - Join table for user-organization relationships

#### API Endpoints:

**Authentication:**
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/me` - Get current user with organizations

**Apps:**
- `GET /api/apps` - List all apps
- `GET /api/apps/:slug/modules` - Get modules for an app
- `POST /api/apps/calculate-pricing` - Calculate subscription pricing

**Organizations:**
- `POST /api/organizations` - Create organization with onboarding
- `GET /api/organizations/:id` - Get organization details
- `GET /api/organizations/:id/users` - Get organization users
- `POST /api/organizations/:id/invite-users` - Invite users

**Invitations:**
- `POST /api/invitations/accept` - Accept invitation
- `GET /api/invitations/validate/:token` - Validate invitation token

### Frontend (Landing App)

#### Pages Created:
- `/signup` - User registration
- `/login` - User login
- `/profile` - User dashboard with apps listing

#### Components:
- `OnboardingModal` - 4-step onboarding wizard
  - Step 1: Select modules
  - Step 2: Company details
  - Step 3: Invite users
  - Step 4: Pricing summary

## 🚀 Setup Instructions

### 1. Backend Setup

```bash
# Navigate to backend
cd apps/backend

# Install dependencies (if not already done)
npm install

# Create .env file
cat > .env << EOF
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

# Start backend (will auto-seed apps and modules)
npm run dev
```

The backend will:
- Start on port 1337
- Create SQLite database
- Automatically seed 3 apps (CRM, PM, Accounts) with modules
- Set up all API endpoints

### 2. Frontend Setup

```bash
# Navigate to landing app
cd apps/landing

# Install dependencies (if not already done)
npm install

# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:1337" > .env.local

# Start frontend
npm run dev
```

The frontend will start on port 3000.

## 🧪 Testing the Flow

### 1. Signup Flow

1. Open browser: `http://localhost:3000`
2. Click "Sign Up Free"
3. Fill in the form:
   - First Name: John
   - Last Name: Doe
   - Email: john@example.com
   - Password: password123
4. Click "Sign Up"
5. You'll be redirected to `/profile`

### 2. Profile & Apps

On the profile page, you should see:
- Welcome message with your name
- Available apps organized by category
- Each app shows:
  - Name, icon, description
  - Base price
  - "Setup →" button (if not subscribed)

### 3. Onboarding Flow

1. Click on any app (e.g., "CRM")
2. Onboarding modal opens with 4 steps:

**Step 1: Select Modules**
- Core modules are pre-selected and required
- Optional modules can be added
- Click "Continue"

**Step 2: Company Details**
- Enter company information:
  - Company Name (required)
  - Email, Phone, Website
  - Industry, Company Size
- Click "Continue"

**Step 3: Invite Users**
- Enter number of users (affects pricing)
- Add email addresses to invite (optional)
- Click "Continue"

**Step 4: Pricing Summary**
- Shows:
  - Base price
  - Module costs per user
  - Total monthly cost
- Click "Start Free Trial"

3. Organization is created with:
   - 14-day trial period
   - Selected subscription
   - Invitations sent (if any)

4. Modal closes, profile refreshes
5. The app now shows "Active" badge
6. Click the app again to be redirected to the app

### 4. Login Flow

1. Go to `http://localhost:3000/login`
2. Enter credentials
3. Login and redirect to profile
4. Your organizations are loaded automatically

## 📊 Data Seeded

The system comes with pre-configured apps:

### CRM ($49/month base)
- Core Features ($5/user)
- Leads Management ($10/user)
- Pipeline ($15/user)
- Reports & Analytics ($8/user) - Optional

### Project Management ($39/month base)
- Core Features ($12/user)
- Tasks ($8/user)
- Reports & Analytics ($6/user) - Optional

### Accounts ($29/month base)
- Core Features ($5/user)
- Billing & Invoices ($8/user)

## 🔧 API Testing

You can test the APIs directly:

### Signup
```bash
curl -X POST http://localhost:1337/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Get Apps
```bash
curl http://localhost:1337/api/apps
```

### Get Modules
```bash
curl http://localhost:1337/api/apps/crm/modules
```

### Calculate Pricing
```bash
curl -X POST http://localhost:1337/api/apps/calculate-pricing \
  -H "Content-Type: application/json" \
  -d '{
    "appId": 1,
    "moduleIds": [1, 2, 3],
    "userCount": 5
  }'
```

### Create Organization (requires auth token)
```bash
curl -X POST http://localhost:1337/api/organizations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "My Company",
    "companyEmail": "info@mycompany.com",
    "industry": "technology",
    "size": "11-50",
    "appId": 1,
    "moduleIds": [1, 2, 3],
    "userCount": 5,
    "invitedEmails": ["user1@example.com", "user2@example.com"]
  }'
```

## 🎨 Frontend Features

### Responsive Design
- Mobile-first approach
- Works on all screen sizes
- Touch-friendly

### User Experience
- Loading states
- Error handling
- Form validation
- Success feedback

### State Management
- JWT stored in localStorage
- User data cached
- Organizations loaded on login

## 🔐 Security Features

- Passwords hashed with bcrypt
- JWT authentication
- Protected routes
- CORS configured for all apps
- Organization access checks
- User belongs to organization validation

## 📝 Notes

### Current Limitations
- Email sending is stubbed (tokens logged to console)
- Payment integration not implemented
- Trial period tracked but not enforced
- No password reset flow yet

### Future Enhancements
- Email integration (SendGrid, Mailgun)
- Stripe payment integration
- Password reset functionality
- Email verification
- Organization switching
- User roles and permissions
- Audit logs

## 🐛 Troubleshooting

### Backend won't start
- Check if port 1337 is available
- Verify .env file exists and has all required fields
- Delete .tmp folder and restart

### Frontend can't connect to backend
- Verify backend is running on port 1337
- Check NEXT_PUBLIC_API_URL in .env.local
- Check browser console for CORS errors

### Apps not showing
- Check if seed data ran (look for console logs on backend start)
- Manually run seed: Set SEED_DATA=true in .env and restart
- Check /api/apps endpoint directly

### Login fails
- Verify user was created (check Strapi admin panel)
- Check browser console for errors
- Verify JWT_SECRET is set in backend .env

## 🎉 Success Criteria

✅ User can signup
✅ User can login
✅ Apps are displayed on profile
✅ Onboarding modal opens
✅ Modules can be selected
✅ Company details can be entered
✅ Users can be invited
✅ Pricing is calculated correctly
✅ Organization is created
✅ Subscription is created
✅ User is added to organization
✅ Invitations are created

## 📞 Support

If you encounter issues:
1. Check console logs (both frontend and backend)
2. Verify all environment variables
3. Clear browser localStorage
4. Restart both servers
5. Check database (Strapi admin: http://localhost:1337/admin)

---

**Setup Time:** ~5 minutes
**Complexity:** Medium
**Status:** ✅ Ready for Testing
