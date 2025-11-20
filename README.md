# VaultN Proxy

A secure proxy service for VaultN API calls from Supabase Edge Functions with static IP support.

## Overview

This proxy acts as an intermediary between your Supabase Edge Functions and the VaultN API, providing:
- **Static IP**: Railway provides a static IP that can be whitelisted by VaultN
- **Secure API key management**: API keys stored in Railway environment, not exposed
- **Request authentication**: Internal secret validates requests from Supabase
- **GET & POST support**: Handles both GET (connection lists) and POST (orders) requests
- **Error handling and logging**: Detailed logging for debugging

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

3. Configure environment variables:
   - `INTERNAL_SECRET`: A secret shared between Supabase Edge Functions and this proxy
   - `VAULTN_API_KEY`: Your VaultN API JWT token (Bearer token)
   - `PORT`: Server port (default: 3000)

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## API Endpoints

### GET/POST /vaultn-proxy/*
Proxy requests to VaultN API. Supports both GET and POST methods.

**Headers:**
- `x-internal-secret`: Your internal secret for authentication (required)
- `Content-Type`: application/json
- `Accept`: application/json

**Examples:**

#### GET Request (Fetch connections)
```javascript
const response = await fetch('https://your-proxy.railway.app/vaultn-proxy/api/v2/connection', {
  method: 'GET',
  headers: {
    'x-internal-secret': 'your-secret',
    'Accept': 'application/json'
  }
});
```

#### POST Request (Create order)
```javascript
const response = await fetch('https://your-proxy.railway.app/vaultn-proxy/api/v4/Order', {
  method: 'POST',
  headers: {
    'x-internal-secret': 'your-secret',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ 
    // your order payload
  })
});
```

### GET /health
Health check endpoint with environment status.

**Response:**
```json
{
  "ok": true,
  "timestamp": "2025-11-20T00:16:16.000Z",
  "hasApiKey": true,
  "hasSecret": true
}
```

### GET /
Service information endpoint.

**Response:**
```json
{
  "service": "VaultN Proxy",
  "version": "1.1.0",
  "endpoints": {
    "health": "/health",
    "proxy": "/vaultn-proxy/*"
  },
  "methods": ["GET", "POST"]
}
```

## Supabase Integration

### Environment Variables in Supabase

Add these to your Supabase project secrets:

```bash
# Proxy URL (Railway app URL)
VAULTN_PROD_BASE_URL=https://your-proxy.railway.app/vaultn-proxy

# Internal secret (same as Railway INTERNAL_SECRET)
VAULTN_PROXY_SECRET=your-internal-secret

# Access token (optional, proxy already has it)
VAULTN_PROD_ACCESS_TOKEN=your-jwt-token
```

### Edge Function Example

```typescript
const PROXY_SECRET = Deno.env.get("VAULTN_PROXY_SECRET");
const BASE_URL = Deno.env.get("VAULTN_PROD_BASE_URL");

async function callVaultn(path: string, method: "GET" | "POST" = "GET", body?: any) {
  const url = `${BASE_URL}${path}`;
  
  const options: RequestInit = {
    method,
    headers: {
      "x-internal-secret": PROXY_SECRET,
      "Content-Type": "application/json",
      "Accept": "application/json",
    }
  };
  
  if (method === "POST" && body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  return await response.json();
}

// Usage
const connections = await callVaultn("/api/v2/connection", "GET");
```

## Security

- ✅ Never commit `.env` file (already in .gitignore)
- ✅ Keep `INTERNAL_SECRET` secure and share only with authorized services
- ✅ Use HTTPS in production (Railway provides this automatically)
- ✅ VaultN API key stored securely in Railway environment
- ✅ Static IP whitelisted by VaultN for additional security
- ⚠️ Consider adding rate limiting for production use

## Deployment

### Railway (Recommended)

1. Connect this repository to Railway
2. Set environment variables in Railway dashboard:
   - `INTERNAL_SECRET`
   - `VAULTN_API_KEY`
3. Railway will auto-deploy on push
4. Get your static IP from Railway dashboard
5. Provide static IP to VaultN for whitelisting

### Other Platforms

This service can also be deployed to:
- Render
- Heroku
- Fly.io
- Any Node.js hosting platform

Make sure to set environment variables in your hosting platform's settings.

## Changelog

### v1.1.0 (2025-11-20)
- ✨ Added GET method support for connection listing
- ✨ Added query parameter forwarding
- ✨ Enhanced health check with environment status
- ✨ Added root endpoint with service information
- 🔧 Improved error logging with details
- 📝 Updated documentation with GET examples

### v1.0.0
- Initial release with POST support
- Basic proxy functionality
- Internal secret authentication

## Support

For issues or questions:
- GitHub Issues: https://github.com/ziyafc/vaultn-proxy/issues
- VaultN API Docs: https://docs.vaultn.com
