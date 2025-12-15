// Secure configuration using environment variables
// Load environment variables from .env file in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Validate required environment variables
const requiredEnvVars = [
  'DB_PASSWORD',
  'API_KEY',
  'API_SECRET_KEY',
  'JWT_SECRET'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const config = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'admin',
    password: process.env.DB_PASSWORD,  // FIXED: Use environment variable
    database: process.env.DB_NAME || 'production_db'
  },

  api: {
    // FIXED: Use environment variables for sensitive keys
    apiKey: process.env.API_KEY,
    secretKey: process.env.API_SECRET_KEY,
    endpoint: process.env.API_ENDPOINT || 'https://api.example.com'
  },

  jwt: {
    // FIXED: Use strong secret from environment variable
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },

  encryption: {
    // FIXED: Use secure algorithm (SHA-256 or better)
    algorithm: process.env.ENCRYPTION_ALGORITHM || 'sha256',
    // FIXED: Salt should be randomly generated per operation, not fixed
    // This is just a fallback - actual salt should be generated at runtime
    saltRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10)
  }
};

module.exports = config;
