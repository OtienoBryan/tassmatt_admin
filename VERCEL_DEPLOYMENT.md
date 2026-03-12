# Vercel Deployment Guide for Admin Panel

## 502 Bad Gateway Error - Troubleshooting

If you're getting `ROUTER_EXTERNAL_TARGET_CONNECTION_ERROR` or 502 errors, it means Vercel cannot connect to your backend server.

### Common Causes:

1. **Backend Server Not Running**: The backend at `http://139.59.2.43:5004` is not running
2. **Network/Firewall Issues**: The backend server is not accessible from Vercel's servers
3. **HTTP vs HTTPS**: Vercel may have issues proxying to HTTP endpoints (prefers HTTPS)
4. **IP Address Changes**: The backend IP address may have changed

### Solutions:

#### Option 1: Use HTTPS Backend (Recommended)

If your backend supports HTTPS, update `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-backend-domain.com/api/:path*"
    }
  ]
}
```

#### Option 2: Use Environment Variable for Backend URL

1. **Update `vercel.json`** to use an environment variable:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://api.tassmatt.co.ke/api/:path*"
    }
  ]
}
```

2. **Or use a Vercel Serverless Function** as a proxy (more reliable)

#### Option 3: Direct API Calls (No Proxy)

Update the API service to call the backend directly:

1. Set environment variable in Vercel:
   - `VITE_API_BASE_URL=https://your-backend-domain.com/api`

2. Update `admin/src/services/api.ts`:
   ```typescript
   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
   ```

#### Option 4: Check Backend Server Status

1. **Verify backend is running**:
   ```bash
   curl http://139.59.2.43:5004/api/health
   ```

2. **Check firewall rules**: Ensure port 5004 is open and accessible

3. **Test from Vercel's IP**: The backend must allow connections from Vercel's servers

### Current Configuration

Your `vercel.json` is configured to proxy to:
- **Backend URL**: `http://139.59.2.43:5004/api/*`

### Quick Fixes:

1. **Check if backend is running**:
   - SSH into your server
   - Verify the backend process is running on port 5004
   - Check logs for any errors

2. **Test backend accessibility**:
   ```bash
   # From your local machine
   curl http://139.59.2.43:5004/api/auth/admin/login
   ```

3. **Update backend CORS** to allow Vercel domain:
   ```typescript
   // In backend/src/main.ts
   app.enableCors({
     origin: [
       'https://your-admin.vercel.app',
       // ... other origins
     ],
   });
   ```

### Recommended Solution:

For production, use a domain name with HTTPS instead of IP address:

1. Set up a domain for your backend (e.g., `api.tassmatt.co.ke`)
2. Configure SSL certificate
3. Update `vercel.json` to use the HTTPS domain
4. This is more reliable and secure than IP-based connections
