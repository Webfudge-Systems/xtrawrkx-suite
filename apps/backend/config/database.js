const path = require('path');

function buildPostgresSsl(env, databaseUrl) {
  const explicit = env.bool('DATABASE_SSL');
  const inferred =
    Boolean(databaseUrl) &&
    /railway|rlwy\.net|sslmode=require|ssl=true/i.test(databaseUrl);
  const enabled = explicit || inferred;

  if (!enabled) return false;

  return {
    key: env('DATABASE_SSL_KEY', undefined),
    cert: env('DATABASE_SSL_CERT', undefined),
    ca: env('DATABASE_SSL_CA', undefined),
    capath: env('DATABASE_SSL_CAPATH', undefined),
    cipher: env('DATABASE_SSL_CIPHER', undefined),
    rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', false),
  };
}

module.exports = ({ env }) => {
  const client = env('DATABASE_CLIENT', 'sqlite');
  const databaseUrl = env('DATABASE_URL');

  const postgresConnection = databaseUrl
    ? { connectionString: databaseUrl }
    : {
        host: env('DATABASE_HOST', 'localhost'),
        port: env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME', 'strapi'),
        user: env('DATABASE_USERNAME', 'strapi'),
        password: env('DATABASE_PASSWORD', 'strapi'),
        schema: env('DATABASE_SCHEMA', 'public'),
      };

  const postgresSsl = buildPostgresSsl(env, databaseUrl);
  if (postgresSsl) {
    postgresConnection.ssl = postgresSsl;
  }

  const connections = {
    mysql: {
      connection: {
        host: env('DATABASE_HOST', 'localhost'),
        port: env.int('DATABASE_PORT', 3306),
        database: env('DATABASE_NAME', 'strapi'),
        user: env('DATABASE_USERNAME', 'strapi'),
        password: env('DATABASE_PASSWORD', 'strapi'),
        ssl: env.bool('DATABASE_SSL', false) && {
          key: env('DATABASE_SSL_KEY', undefined),
          cert: env('DATABASE_SSL_CERT', undefined),
          ca: env('DATABASE_SSL_CA', undefined),
          capath: env('DATABASE_SSL_CAPATH', undefined),
          cipher: env('DATABASE_SSL_CIPHER', undefined),
          rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', true),
        },
      },
      pool: { min: env.int('DATABASE_POOL_MIN', 2), max: env.int('DATABASE_POOL_MAX', 10) },
    },
    postgres: {
      connection: postgresConnection,
      pool: {
        min: env.int('DATABASE_POOL_MIN', 0),
        max: env.int('DATABASE_POOL_MAX', 5),
      },
    },
    sqlite: {
      connection: {
        filename: path.join(__dirname, '..', env('DATABASE_FILENAME', '.tmp/data.db')),
      },
      useNullAsDefault: true,
    },
  };

  return {
    connection: {
      client,
      ...connections[client],
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
    },
  };
};
