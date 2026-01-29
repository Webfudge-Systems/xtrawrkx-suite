const fs = require('fs');
const path = require('path');

// Development environment configuration (using SQLite for easier local setup)
const devEnv = `# Development Environment Configuration
NODE_ENV=development

# Server Configuration
HOST=0.0.0.0
PORT=1337

# Database Configuration (SQLite for easy local development)
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db

# Application Keys (Development - can be simple for local dev)
APP_KEYS=dev-key-1,dev-key-2,dev-key-3,dev-key-4
API_TOKEN_SALT=dev-api-token-salt
ADMIN_JWT_SECRET=dev-admin-jwt-secret
TRANSFER_TOKEN_SALT=dev-transfer-token-salt
JWT_SECRET=dev-jwt-secret
ENCRYPTION_KEY=dev-encryption-key-32-chars-long

# Local Development URL
PUBLIC_URL=http://localhost:1337

# Webhooks
WEBHOOKS_POPULATE_RELATIONS=false

# Disable Strapi Features for Development
STRAPI_DISABLE_UPDATE_NOTIFICATION=true
STRAPI_DISABLE_TELEMETRY=true
STRAPI_DISABLE_TUTORIALS=true
`;

// Development with PostgreSQL (if you have PostgreSQL set up)
const devPostgresEnv = `# Development Environment Configuration (PostgreSQL)
NODE_ENV=development

# Server Configuration
HOST=0.0.0.0
PORT=1337

# Database Configuration (Local PostgreSQL)
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=xtrawrkx_strapi_dev
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_postgres_password
DATABASE_SSL=false
DATABASE_SCHEMA=public

# Application Keys (Development - can be simple for local dev)
APP_KEYS=dev-key-1,dev-key-2,dev-key-3,dev-key-4
API_TOKEN_SALT=dev-api-token-salt
ADMIN_JWT_SECRET=dev-admin-jwt-secret
TRANSFER_TOKEN_SALT=dev-transfer-token-salt
JWT_SECRET=dev-jwt-secret
ENCRYPTION_KEY=dev-encryption-key-32-chars-long

# Local Development URL
PUBLIC_URL=http://localhost:1337

# Webhooks
WEBHOOKS_POPULATE_RELATIONS=false

# Disable Strapi Features for Development
STRAPI_DISABLE_UPDATE_NOTIFICATION=true
STRAPI_DISABLE_TELEMETRY=true
STRAPI_DISABLE_TUTORIALS=true
`;

// Production environment configuration
const prodEnv = `# Production Environment Configuration
NODE_ENV=production

# Server Configuration
HOST=0.0.0.0
PORT=1337

# Database Configuration (Railway PostgreSQL)
DATABASE_CLIENT=postgres
DATABASE_URL=postgresql://username:password@postgres.railway.internal:5432/xtrawrkx_strapi
DATABASE_HOST=postgres.railway.internal
DATABASE_PORT=5432
DATABASE_NAME=xtrawrkx_strapi
DATABASE_USERNAME=username
DATABASE_PASSWORD=password
DATABASE_SSL=true
DATABASE_SCHEMA=public

# Application Keys (Production - should be strong and unique)
APP_KEYS=prod-key-1,prod-key-2,prod-key-3,prod-key-4
API_TOKEN_SALT=prod-api-token-salt
ADMIN_JWT_SECRET=prod-admin-jwt-secret
TRANSFER_TOKEN_SALT=prod-transfer-token-salt
JWT_SECRET=prod-jwt-secret
ENCRYPTION_KEY=prod-encryption-key-32-chars-long

# Railway Configuration
PUBLIC_URL=https://xtrawrkxsuits-production.up.railway.app

# Webhooks
WEBHOOKS_POPULATE_RELATIONS=false

# Disable Strapi Features for Production
STRAPI_DISABLE_UPDATE_NOTIFICATION=true
STRAPI_DISABLE_TELEMETRY=true
STRAPI_DISABLE_TUTORIALS=true
`;

// Create environment files in the parent directory (xtrawrkx-backend-strapi root)
const parentDir = path.join(__dirname, '..');
fs.writeFileSync(path.join(parentDir, '.env.development'), devEnv);
fs.writeFileSync(path.join(parentDir, '.env.development.postgres'), devPostgresEnv);
fs.writeFileSync(path.join(parentDir, '.env.production'), prodEnv);

