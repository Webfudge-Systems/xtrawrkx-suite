# Webfudge Platform - Command Reference

A comprehensive guide to all available commands in the Webfudge Platform monorepo.

---

## 📋 Table of Contents

1. [Root Commands](#root-commands)
2. [Next.js Apps Commands](#nextjs-apps-commands)
3. [Strapi Backend Commands](#strapi-backend-commands)
4. [Package Management](#package-management)
5. [Development Workflow](#development-workflow)
6. [Troubleshooting Commands](#troubleshooting-commands)

---

## 🌳 Root Commands

Run these commands from the root directory:

### Development

```bash
# Start all applications in development mode
npm run dev

# Build all applications
npm run build

# Start all applications in production mode
npm run start

# Lint all applications
npm run lint

# Format code with Prettier
npm run format

# Clean all build artifacts and node_modules
npm run clean
```

### Package Management

```bash
# Install all dependencies for all apps and packages
npm install

# Install a package to root
npm install <package-name> -W

# Install a package to a specific workspace
npm install <package-name> --workspace=apps/landing

# Install a dev dependency to root
npm install <package-name> -D -W

# Update all dependencies
npm update

# Check for outdated packages
npm outdated

# Audit dependencies for vulnerabilities
npm audit

# Fix vulnerabilities automatically
npm audit fix
```

### Workspace Commands

```bash
# List all workspaces
npm ls --workspaces

# Run a command in a specific workspace
npm run <command> --workspace=apps/landing

# Run a command in all workspaces
npm run <command> --workspaces

# Install dependencies for a specific workspace only
npm install --workspace=apps/crm
```

---

## 🎨 Next.js Apps Commands

These commands work for all Next.js apps (landing, crm, pm, accounts, vendor):

### Navigate to App Directory

```bash
# Landing
cd apps/landing

# CRM
cd apps/crm

# PM
cd apps/pm

# Accounts
cd apps/accounts

# Vendor
cd apps/vendor
```

### Development

```bash
# Start development server
npm run dev

# Start on a different port
npm run dev -- -p 3005

# Build for production
npm run build

# Start production server
npm run start

# Start production on different port
npm run start -- -p 3005

# Lint the code
npm run lint

# Lint and fix issues
npm run lint -- --fix

# Clean build artifacts
npm run clean
```

### Next.js Specific Commands

```bash
# Clear Next.js cache
rm -rf .next

# Analyze bundle size
npm run build
# Then check .next/analyze/

# Check TypeScript without building
npx tsc --noEmit

# Generate Next.js telemetry info
npx next info

# Update Next.js
npm install next@latest react@latest react-dom@latest
```

### Tailwind CSS Commands

```bash
# Generate Tailwind config
npx tailwindcss init

# Build Tailwind CSS (standalone)
npx tailwindcss -i ./app/globals.css -o ./dist/output.css

# Watch mode
npx tailwindcss -i ./app/globals.css -o ./dist/output.css --watch

# Minified build
npx tailwindcss -i ./app/globals.css -o ./dist/output.css --minify
```

---

## 🗄️ Strapi Backend Commands

Navigate to backend directory:

```bash
cd apps/backend
```

### Development

```bash
# Start development server (with auto-reload)
npm run develop

# Start production server
npm run start

# Build admin panel
npm run build

# Run Strapi CLI
npm run strapi

# Clean build artifacts
npm run clean
```

### Strapi CLI Commands

```bash
# General help
npm run strapi -- help

# Version info
npm run strapi -- version

# Console (interactive)
npm run strapi -- console

# Start server
npm run strapi -- start

# Build
npm run strapi -- build

# Watch admin
npm run strapi -- watch-admin

# Configuration commands
npm run strapi -- configuration:dump
npm run strapi -- configuration:restore
```

### Content Type Builder

```bash
# Generate a new API
npm run strapi -- generate:api <api-name>

# Generate a new controller
npm run strapi -- generate:controller <controller-name>

# Generate a new service
npm run strapi -- generate:service <service-name>

# Generate a new policy
npm run strapi -- generate:policy <policy-name>

# Generate a new middleware
npm run strapi -- generate:middleware <middleware-name>
```

### Database Commands

```bash
# Database migration
npm run strapi -- migration:up
npm run strapi -- migration:down

# Install a new plugin
npm run strapi -- install <plugin-name>

# Uninstall a plugin
npm run strapi -- uninstall <plugin-name>
```

### Admin User Management

```bash
# Create admin user (interactive)
npm run strapi -- admin:create-user

# Reset admin user password
npm run strapi -- admin:reset-user-password

# List all admin users
# (No CLI command, use admin panel or database query)
```

---

## 📦 Package Management

### Working with Shared Packages

```bash
# Navigate to a package
cd packages/ui
cd packages/auth
cd packages/billing
cd packages/utils
cd packages/config

# Install package dependencies
npm install

# Build a package (if it has a build script)
npm run build

# Link local package for testing
npm link
cd ../../apps/landing
npm link @webfudge/ui
```

### Creating a New Package

```bash
# Create directory
mkdir packages/new-package
cd packages/new-package

# Initialize package.json
npm init -y

# Update package.json name
# "name": "@webfudge/new-package"

# Add to root package.json workspaces if needed
```

---

## 🔄 Development Workflow

### Starting Fresh

```bash
# Clone repository
git clone <repository-url>
cd webfudge-platform

# Install all dependencies
npm install

# Configure backend
cd apps/backend
cp .env.example .env
# Edit .env with secure secrets
cd ../..

# Start all apps
npm run dev
```

### Daily Development

```bash
# Pull latest changes
git pull

# Install any new dependencies
npm install

# Start development
npm run dev

# In separate terminal, run specific app
cd apps/crm
npm run dev
```

### Before Committing

```bash
# Format code
npm run format

# Lint code
npm run lint

# Build all apps (ensure no errors)
npm run build

# Run tests (when implemented)
npm test

# Stage and commit
git add .
git commit -m "feat: description"
git push
```

### Creating a Feature Branch

```bash
# Create and checkout new branch
git checkout -b feature/new-feature

# Make changes, then
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/new-feature

# Create pull request on GitHub/GitLab
```

---

## 🔧 Troubleshooting Commands

### Port Already in Use

```bash
# Find process using a port (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Find process using a port (Linux/Mac)
lsof -ti:3000
kill -9 $(lsof -ti:3000)

# Or kill all node processes
taskkill /IM node.exe /F    # Windows
killall -9 node              # Linux/Mac
```

### Clean Everything

```bash
# From root directory

# Clean all node_modules
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules

# Clean all build artifacts
rm -rf apps/*/.next
rm -rf apps/backend/.cache
rm -rf apps/backend/build
rm -rf apps/backend/.tmp

# Clean lock file
rm package-lock.json

# Reinstall everything
npm install
```

### Fix Dependency Issues

```bash
# Clear npm cache
npm cache clean --force

# Remove and reinstall
rm -rf node_modules package-lock.json
npm install

# Update all packages to latest
npm update --save

# Dedupe dependencies
npm dedupe

# Fix peer dependencies
npm install --legacy-peer-deps
```

### Next.js Specific Issues

```bash
# Clear Next.js cache
rm -rf apps/landing/.next
rm -rf apps/crm/.next
rm -rf apps/pm/.next
rm -rf apps/accounts/.next
rm -rf apps/vendor/.next

# Clear TypeScript build info
find . -name "*.tsbuildinfo" -delete

# Rebuild
npm run build
```

### Strapi Specific Issues

```bash
cd apps/backend

# Clear Strapi cache
rm -rf .cache

# Rebuild admin panel
npm run build

# Reset database (CAUTION: deletes data)
rm -rf .tmp/data.db

# Restart with fresh install
rm -rf node_modules
npm install
npm run develop
```

### Git Issues

```bash
# Discard all local changes
git reset --hard HEAD

# Clean untracked files
git clean -fd

# Update from remote
git fetch origin
git pull origin main

# Resolve merge conflicts
git mergetool

# Abort merge
git merge --abort

# Stash changes
git stash
git stash pop
```

---

## 🚀 Production Commands

### Building for Production

```bash
# Build all apps
npm run build

# Build specific app
cd apps/landing
npm run build

# Build backend
cd apps/backend
npm run build
```

### Environment Setup

```bash
# Copy environment files
cp apps/backend/.env.example apps/backend/.env.production

# Set production environment
export NODE_ENV=production  # Linux/Mac
set NODE_ENV=production     # Windows

# Start production servers
npm run start
```

### Docker Commands (If using Docker)

```bash
# Build Docker images
docker-compose build

# Start containers
docker-compose up -d

# Stop containers
docker-compose down

# View logs
docker-compose logs -f

# Rebuild and restart
docker-compose up -d --build

# Execute command in container
docker-compose exec backend npm run strapi
```

---

## 📊 Monitoring Commands

### Check Running Processes

```bash
# List all Node processes
ps aux | grep node           # Linux/Mac
tasklist | findstr node      # Windows

# Check ports in use
netstat -an | grep LISTEN    # Linux/Mac
netstat -an | findstr LISTEN # Windows

# Check system resources
htop                         # Linux
top                          # Mac
Get-Process                  # Windows PowerShell
```

### Logs

```bash
# View real-time logs (if using PM2)
pm2 logs

# View specific app logs
pm2 logs landing

# Clear logs
pm2 flush
```

---

## 🔍 Debugging Commands

### Node.js Debugging

```bash
# Start Next.js with debugging
NODE_OPTIONS='--inspect' npm run dev

# Start with specific port
NODE_OPTIONS='--inspect=9229' npm run dev

# Start Strapi with debugging
node --inspect node_modules/.bin/strapi develop
```

### TypeScript Checking

```bash
# Check types without building
npx tsc --noEmit

# Check types in specific directory
npx tsc --noEmit --project apps/landing/tsconfig.json

# Watch mode
npx tsc --noEmit --watch
```

---

## 📚 Helpful Aliases (Optional)

Add these to your `.bashrc` or `.zshrc`:

```bash
# Navigation
alias wf="cd ~/path/to/webfudge-platform"
alias wfl="cd ~/path/to/webfudge-platform/apps/landing"
alias wfb="cd ~/path/to/webfudge-platform/apps/backend"

# Development
alias wfd="npm run dev"
alias wfb="npm run build"
alias wfc="npm run clean"

# Git
alias gs="git status"
alias gp="git pull"
alias gc="git commit -m"
alias gps="git push"
```

---

## 💡 Tips

1. **Use Turbo cache**: Turborepo caches builds, so subsequent builds are faster
2. **Workspace commands**: Use `--workspace=` to run commands in specific apps
3. **Parallel execution**: Turbo runs tasks in parallel when possible
4. **Environment variables**: Keep `.env` files outside version control
5. **Regular updates**: Keep dependencies up to date with `npm update`

---

## 🆘 Getting Help

```bash
# General help
npm help

# Specific command help
npm help install
npm help run-script

# Next.js help
npx next --help

# Strapi help
npm run strapi -- help

# Turborepo help
npx turbo --help
```

---

For more information, see:
- [README.md](./README.md)
- [QUICKSTART.md](./QUICKSTART.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)

