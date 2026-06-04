# Quick Start Guide

This guide will help you get the Webfudge Platform up and running quickly.

## 📋 Prerequisites

Make sure you have installed:
- Node.js (v18 or higher)
- npm (v9 or higher)

Check your versions:
```bash
node --version
npm --version
```

## 🚀 Setup Instructions

### 1. Install Dependencies

From the root directory, install all dependencies:

```bash
npm install
```

This will install dependencies for all apps and packages in the monorepo.

### 2. Configure Environment Variables

Set up the backend environment variables:

```bash
cd apps/backend
cp .env.example .env
cd ../..
```

**Important**: Open `apps/backend/.env` and generate secure secrets for:
- `APP_KEYS`
- `API_TOKEN_SALT`
- `ADMIN_JWT_SECRET`
- `TRANSFER_TOKEN_SALT`
- `JWT_SECRET`

You can generate random secrets using:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Start Development Servers

#### Option A: Start All Apps (Recommended for first-time setup)

```bash
npm run dev
```

This starts all applications concurrently:
- Landing: http://localhost:3000
- CRM: http://localhost:3001
- PM: http://localhost:3002
- Accounts: http://localhost:3003
- Vendor: http://localhost:3004
- Backend API: http://localhost:1337

#### Option B: Start Individual Apps

**Backend (Strapi):**
```bash
cd apps/backend
npm run develop
```
Access admin panel: http://localhost:1337/admin

**Landing Page:**
```bash
cd apps/landing
npm run dev
```
Access: http://localhost:3000

**CRM:**
```bash
cd apps/crm
npm run dev
```
Access: http://localhost:3001

**Project Management:**
```bash
cd apps/pm
npm run dev
```
Access: http://localhost:3002

**Accounts:**
```bash
cd apps/accounts
npm run dev
```
Access: http://localhost:3003

**Vendor Portal:**
```bash
cd apps/vendor
npm run dev
```
Access: http://localhost:3004

## 🎯 First Steps

### 1. Set Up Strapi Admin

1. Visit http://localhost:1337/admin
2. Create your first admin user
3. Log in to the admin panel
4. Explore the content types already created

### 2. Explore the Applications

Visit each application to see the initialized pages:

- **Landing (3000)**: Marketing and public-facing pages
- **CRM (3001)**: Customer relationship management
- **PM (3002)**: Project and task management
- **Accounts (3003)**: User accounts and billing
- **Vendor (3004)**: Vendor management portal

## 📁 Project Structure Overview

```
webfudge-platform/
├── apps/              # All applications
├── packages/          # Shared packages
├── tooling/           # Development tools config
├── package.json       # Root package file
└── turbo.json        # Turborepo configuration
```

## 🔧 Common Commands

```bash
# Development
npm run dev              # Start all apps in development

# Building
npm run build            # Build all apps

# Production
npm run start            # Start all apps in production

# Code Quality
npm run lint             # Lint all apps
npm run format           # Format code with Prettier

# Cleanup
npm run clean            # Clean all build artifacts
```

## 🐛 Troubleshooting

### Port Already in Use

If you get a "port already in use" error:

1. Find and kill the process using that port:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

2. Or change the port in the app's package.json:
```json
"dev": "next dev -p 3005"
```

### Module Not Found

If you get module not found errors:

```bash
# Clean and reinstall
npm run clean
rm -rf node_modules package-lock.json
npm install
```

### Strapi Admin Not Loading

1. Clear the Strapi cache:
```bash
cd apps/backend
rm -rf .cache
npm run develop
```

## 📚 Next Steps

1. **Customize the UI**: Update the Tailwind configurations
2. **Add API Endpoints**: Create content types in Strapi
3. **Implement Authentication**: Set up auth flows
4. **Connect Frontend to Backend**: Integrate API calls
5. **Add Database**: Configure PostgreSQL for production

## 💡 Tips

- Each Next.js app has hot-reload enabled
- Strapi admin panel auto-saves your work
- Use the monorepo structure to share code between apps
- Check individual app READMEs for specific details

## 🆘 Need Help?

- Check the main [README.md](./README.md)
- Review app-specific documentation in each app folder
- Visit Strapi docs: https://docs.strapi.io
- Visit Next.js docs: https://nextjs.org/docs

---

Happy coding! 🚀

