# nxcore

A secure configuration management example demonstrating security best practices.

## Security

This project demonstrates proper handling of sensitive configuration data. See [SECURITY.md](SECURITY.md) for details.

### Quick Start

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your actual credentials

3. Install dependencies:
   ```bash
   npm install dotenv
   ```

## Files

- `config.js` - Secure configuration using environment variables
- `.env.example` - Template for environment variables
- `.gitignore` - Prevents committing sensitive files
- `SECURITY.md` - Security documentation and best practices
