// Debug script to check environment variables

// Check Railway-specific variables

// Test database URL construction
const databaseUrl = process.env.DATABASE_URL ||
    (process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD && process.env.PGDATABASE ?
        `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE}?sslmode=require` :
        null);


Object.keys(process.env)
    .filter(key => key.includes('DATABASE') || key.includes('PG') || key.includes('NODE'))
    .forEach(key => console.log(`${key}:`, process.env[key]));

