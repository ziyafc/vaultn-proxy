# VaultN Proxy

A secure proxy service for VaultN API calls from Supabase Edge Functions.

## Overview

This proxy acts as an intermediary between your Supabase Edge Functions and the VaultN API, providing:
- Secure API key management
- Request authentication via internal secret
- Error handling and logging

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
   - `VAULTN_API_KEY`: Your VaultN API key
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

### POST /vaultn-proxy/*
Proxy requests to VaultN API.

**Headers:**
- `x-internal-secret`: Your internal secret for authentication
- `Content-Type`: application/json

**Example:**
```javascript
const response = await fetch('http://localhost:3000/vaultn-proxy/orders', {
  method: 'POST',
  headers: {
    'x-internal-secret': 'your-secret',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ /* your payload */ })
});
```

### GET /health
Health check endpoint.

**Response:**
```json
{ "ok": true }
```

## Security

- Never commit `.env` file
- Keep `INTERNAL_SECRET` secure and share only with authorized services
- Use HTTPS in production
- Consider adding rate limiting for production use

## Deployment

This service can be deployed to:
- Railway
- Render
- Heroku
- Any Node.js hosting platform

Make sure to set environment variables in your hosting platform's settings.
