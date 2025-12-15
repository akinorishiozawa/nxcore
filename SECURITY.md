# Security Best Practices

## Environment Variables

This project uses environment variables to manage sensitive configuration data. **Never hardcode secrets in source code.**

### Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your actual credentials (this file is git-ignored)

3. Ensure `.env` is listed in `.gitignore` to prevent accidental commits

### Required Environment Variables

- `DB_PASSWORD`: Database password (minimum 16 characters recommended)
- `API_KEY`: API key for external services
- `API_SECRET_KEY`: Secret key for API authentication
- `JWT_SECRET`: JWT signing secret (minimum 32 characters, use cryptographically secure random string)

### Security Fixes Applied

1. ✅ **Removed hardcoded credentials** - All sensitive data now uses environment variables
2. ✅ **Environment variable validation** - Application fails fast if required secrets are missing
3. ✅ **Improved encryption** - Changed from MD5 to SHA-256 (configurable)
4. ✅ **Removed fixed salt** - Switched to bcrypt rounds for proper password hashing
5. ✅ **Git protection** - Added `.gitignore` to prevent committing secrets

### Generating Secure Secrets

```bash
# Generate a strong JWT secret (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate a strong password (Linux)
openssl rand -base64 32
```

### Dependencies

Install the `dotenv` package to load environment variables:

```bash
npm install dotenv
```

## Reporting Security Issues

If you discover a security vulnerability, please report it to the maintainers privately.
