# Environment Variables Guide

This guide explains all environment variables needed for the Webfudge Platform.

---

## 📋 Overview

Each application can have its own `.env` file. Environment variables are used for:
- API keys and secrets
- Database connections
- Service configurations
- Feature flags

---

## 🔐 Security Best Practices

1. **NEVER commit `.env` files** to version control
2. **Use strong, random secrets** for production
3. **Rotate secrets regularly** in production
4. **Use different secrets** for each environment
5. **Store production secrets** in a secure vault (AWS Secrets Manager, etc.)

---

## 🗄️ Backend (Strapi) - Required

**File**: `apps/backend/.env`

```bash
# Server Configuration
HOST=0.0.0.0
PORT=1337

# Database Configuration
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db

# For PostgreSQL (Production)
# DATABASE_CLIENT=postgres
# DATABASE_HOST=localhost
# DATABASE_PORT=5432
# DATABASE_NAME=webfudge
# DATABASE_USERNAME=postgres
# DATABASE_PASSWORD=your_password
# DATABASE_SSL=false

# Admin JWT Secret (Generate a strong random string)
ADMIN_JWT_SECRET=your_admin_jwt_secret_here

# API Token Salt (Generate a strong random string)
API_TOKEN_SALT=your_api_token_salt_here

# Transfer Token Salt (Generate a strong random string)
TRANSFER_TOKEN_SALT=your_transfer_token_salt_here

# JWT Secret for user authentication (Generate a strong random string)
JWT_SECRET=your_jwt_secret_here

# App Keys (Generate 4 strong random strings, comma-separated)
APP_KEYS=key1,key2,key3,key4

# Strapi URL (for production)
# STRAPI_ADMIN_URL=https://admin.yourdomain.com
# PUBLIC_URL=https://api.yourdomain.com
```

### Generating Secure Secrets

Use one of these methods to generate secrets:

**Method 1: Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Method 2: OpenSSL**
```bash
openssl rand -base64 32
```

**Method 3: Online** (use with caution)
- https://generate-random.org/api-token-generator

Generate separate secrets for each variable!

---

## 🎨 Frontend Apps - Optional

Environment variables for Next.js apps must be prefixed with `NEXT_PUBLIC_` to be accessible in the browser.

### Landing App

**File**: `apps/landing/.env.local`

```bash
# API Endpoints
NEXT_PUBLIC_API_URL=http://localhost:1337/api
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337

# App Configuration
NEXT_PUBLIC_APP_NAME="Webfudge Platform"
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Feature Flags
NEXT_PUBLIC_ENABLE_SIGNUP=true
NEXT_PUBLIC_ENABLE_CONTACT=true

# Analytics (Optional)
# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
# NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX

# Social Media
# NEXT_PUBLIC_TWITTER_URL=https://twitter.com/webfudge
# NEXT_PUBLIC_LINKEDIN_URL=https://linkedin.com/company/webfudge
```

### CRM App

**File**: `apps/crm/.env.local`

```bash
# API Endpoints
NEXT_PUBLIC_API_URL=http://localhost:1337/api
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337

# App Configuration
NEXT_PUBLIC_APP_NAME="Webfudge CRM"
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Feature Flags
NEXT_PUBLIC_ENABLE_LEADS=true
NEXT_PUBLIC_ENABLE_DEALS=true
NEXT_PUBLIC_ENABLE_CONTACTS=true
NEXT_PUBLIC_ENABLE_PIPELINE=true
NEXT_PUBLIC_ENABLE_REPORTS=true

# Pagination
NEXT_PUBLIC_DEFAULT_PAGE_SIZE=25
NEXT_PUBLIC_MAX_PAGE_SIZE=100

# CRM Specific
NEXT_PUBLIC_CURRENCY=USD
NEXT_PUBLIC_DATE_FORMAT=MM/DD/YYYY
NEXT_PUBLIC_TIME_ZONE=America/New_York
```

### Project Management App

**File**: `apps/pm/.env.local`

```bash
# API Endpoints
NEXT_PUBLIC_API_URL=http://localhost:1337/api
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337

# App Configuration
NEXT_PUBLIC_APP_NAME="Webfudge PM"
NEXT_PUBLIC_APP_URL=http://localhost:3002

# Feature Flags
NEXT_PUBLIC_ENABLE_PROJECTS=true
NEXT_PUBLIC_ENABLE_TASKS=true
NEXT_PUBLIC_ENABLE_KANBAN=true
NEXT_PUBLIC_ENABLE_GANTT=true
NEXT_PUBLIC_ENABLE_REPORTS=true

# PM Specific
NEXT_PUBLIC_DEFAULT_PROJECT_VIEW=kanban
NEXT_PUBLIC_TASK_STATUSES=todo,in-progress,review,done
NEXT_PUBLIC_TASK_PRIORITIES=low,medium,high,urgent
```

### Accounts App

**File**: `apps/accounts/.env.local`

```bash
# API Endpoints
NEXT_PUBLIC_API_URL=http://localhost:1337/api
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337

# App Configuration
NEXT_PUBLIC_APP_NAME="Webfudge Accounts"
NEXT_PUBLIC_APP_URL=http://localhost:3003

# Feature Flags
NEXT_PUBLIC_ENABLE_USER_MANAGEMENT=true
NEXT_PUBLIC_ENABLE_SUBSCRIPTIONS=true
NEXT_PUBLIC_ENABLE_INVOICES=true
NEXT_PUBLIC_ENABLE_AUDIT_LOGS=true
NEXT_PUBLIC_ENABLE_ROLES=true
NEXT_PUBLIC_ENABLE_PERMISSIONS=true

# Billing Configuration
NEXT_PUBLIC_BILLING_PROVIDER=stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxx

# Subscription Plans
NEXT_PUBLIC_PLANS=free,basic,pro,enterprise
```

### Vendor Portal

**File**: `apps/vendor/.env.local`

```bash
# API Endpoints
NEXT_PUBLIC_API_URL=http://localhost:1337/api
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337

# App Configuration
NEXT_PUBLIC_APP_NAME="Webfudge Vendor Portal"
NEXT_PUBLIC_APP_URL=http://localhost:3004

# Feature Flags
NEXT_PUBLIC_ENABLE_DASHBOARD=true
NEXT_PUBLIC_ENABLE_LICENSES=true
NEXT_PUBLIC_ENABLE_ORGANIZATIONS=true
NEXT_PUBLIC_ENABLE_REVENUE=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# Vendor Specific
NEXT_PUBLIC_LICENSE_TYPES=trial,standard,premium,enterprise
NEXT_PUBLIC_REVENUE_CURRENCY=USD
```

---

## 🌍 Environment-Specific Configurations

### Development

Use `.env.local` or `.env.development`:

```bash
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:1337/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEBUG=true
```

### Staging

Use `.env.staging`:

```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://staging-api.yourdomain.com/api
NEXT_PUBLIC_APP_URL=https://staging.yourdomain.com
NEXT_PUBLIC_DEBUG=false
```

### Production

Use `.env.production`:

```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_DEBUG=false
```

---

## 📦 Third-Party Services (Optional)

### Email Service (e.g., SendGrid)

```bash
# In backend .env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
EMAIL_REPLY_TO=support@yourdomain.com
```

### Payment Gateway (Stripe)

```bash
# In backend .env (Server-side keys)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# In frontend .env.local (Public keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
```

### Storage (AWS S3)

```bash
# In backend .env
AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
AWS_REGION=us-east-1
AWS_S3_BUCKET=webfudge-uploads
```

### Analytics (Google Analytics)

```bash
# In frontend .env.local
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Error Tracking (Sentry)

```bash
# In backend .env
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# In frontend .env.local
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### Redis (Caching)

```bash
# In backend .env (or Railway-injected on API service)
REDIS_URL=redis://default:password@host:6379
# CACHE_TTL_SECONDS=300
# REDIS_ENABLED=false
```

See **[REDIS_CACHE.md](./REDIS_CACHE.md)** for Railway private vs public URL and verification steps.

---

## 🔄 Environment Variable Loading Order

Next.js loads environment variables in this order (later ones override earlier):

1. `.env` - All environments
2. `.env.local` - All environments (ignored by git)
3. `.env.development` - Development only
4. `.env.development.local` - Development only (ignored by git)
5. `.env.production` - Production only
6. `.env.production.local` - Production only (ignored by git)

---

## 🛠️ Using Environment Variables

### In Next.js (Frontend)

```javascript
// Public variables (accessible in browser)
const apiUrl = process.env.NEXT_PUBLIC_API_URL

// Server-side only variables
// (only available in API routes and server components)
const secretKey = process.env.SECRET_API_KEY
```

### In Strapi (Backend)

```javascript
// Using env helper
module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  admin: {
    auth: {
      secret: env('ADMIN_JWT_SECRET'),
    },
  },
})

// Or directly
const jwtSecret = process.env.JWT_SECRET
```

---

## ✅ Validation

### Example Environment Validation Script

Create `scripts/validate-env.js`:

```javascript
const requiredEnvVars = [
  'ADMIN_JWT_SECRET',
  'API_TOKEN_SALT',
  'JWT_SECRET',
  'APP_KEYS',
]

const missing = requiredEnvVars.filter((key) => !process.env[key])

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:')
  missing.forEach((key) => console.error(`  - ${key}`))
  process.exit(1)
}

console.log('✅ All required environment variables are set')
```

Run before starting:

```bash
node scripts/validate-env.js && npm run dev
```

---

## 📝 Environment Template

Create `.env.template` to document required variables:

```bash
# ===========================================
# Webfudge Platform - Environment Variables
# ===========================================

# Copy this file to .env and fill in the values
# cp .env.template .env

# SERVER CONFIGURATION
HOST=0.0.0.0
PORT=1337

# DATABASE (Development: SQLite, Production: PostgreSQL)
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db

# SECURITY (Generate random strings for each)
ADMIN_JWT_SECRET=CHANGE_ME
API_TOKEN_SALT=CHANGE_ME
TRANSFER_TOKEN_SALT=CHANGE_ME
JWT_SECRET=CHANGE_ME
APP_KEYS=CHANGE_ME_1,CHANGE_ME_2,CHANGE_ME_3,CHANGE_ME_4

# Add more as needed...
```

---

## 🔗 References

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Strapi Environment Variables](https://docs.strapi.io/dev-docs/configurations/environment)
- [Node.js process.env](https://nodejs.org/api/process.html#process_process_env)

---

## 🆘 Troubleshooting

### Environment Variables Not Loading

1. **Restart the dev server** after changing `.env` files
2. **Check file names**: Use `.env.local` not `.env.local.txt`
3. **Check prefixes**: Frontend variables need `NEXT_PUBLIC_`
4. **Check .gitignore**: Make sure `.env` files are ignored
5. **Clear cache**: Delete `.next` folder and rebuild

### Production Issues

1. **Verify environment**: Check `NODE_ENV=production`
2. **Build-time variables**: Some variables are embedded at build time
3. **Server variables**: Non-public variables are only available server-side
4. **Platform-specific**: Some hosting platforms require special variable setup

---

For more help, see:
- [QUICKSTART.md](./QUICKSTART.md)
- [README.md](./README.md)

