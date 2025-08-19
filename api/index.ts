import type { VercelRequest, VercelResponse } from '@vercel/node';

// Vercel API route handler for all API endpoints
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const path = req.url || '';
  const fullPath = path.startsWith('/api') ? path : `/api${path}`;

  // Get the requesting origin
  const origin = req.headers.origin;
  
  // Set CORS headers dynamically based on the requesting origin
  if (origin) {
    // Allow both Vercel URLs and localhost
    const allowedOrigins = [
      'https://ai-sales-girl-project.vercel.app',
      'https://ai-sales-girl-project-hkr4.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000'
    ];
    
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Handle different API endpoints
  try {
    switch (fullPath) {
      case '/api':
        return res.status(200).json({
          message: 'AI Sales Girl API is running on Vercel!',
          timestamp: new Date().toISOString(),
          status: 'success',
          url: 'https://ai-sales-girl-project-hkr4.vercel.app'
        });

      case '/api/auth/login':
        return res.status(200).json({
          message: 'Login endpoint - Vercel deployment successful!',
          endpoint: fullPath,
          method: req.method,
          timestamp: new Date().toISOString(),
          url: 'https://ai-sales-girl-project-hkr4.vercel.app',
          debug: {
            origin: req.headers.origin,
            userAgent: req.headers['user-agent'],
            cors: 'enabled'
          }
        });

      case '/api/auth/signup':
        return res.status(200).json({
          message: 'Signup endpoint - Vercel deployment successful!',
          endpoint: fullPath,
          method: req.method,
          timestamp: new Date().toISOString(),
          url: 'https://ai-sales-girl-project-hkr4.vercel.app',
          debug: {
            origin: req.headers.origin,
            userAgent: req.headers['user-agent'],
            cors: 'enabled'
          }
        });

      case '/api/auth/firebase':
        return res.status(200).json({
          message: 'Firebase OAuth endpoint - Vercel deployment successful!',
          endpoint: fullPath,
          method: req.method,
          timestamp: new Date().toISOString(),
          url: 'https://ai-sales-girl-project-hkr4.vercel.app',
          token: 'demo-token-' + Date.now(), // Demo token for testing
          user: {
            uid: req.body?.uid || 'demo-uid',
            username: req.body?.displayName || 'demo-user',
            email: req.body?.email || 'demo@example.com'
          }
        });

      case '/api/vapi/calls':
        return res.status(200).json({
          message: 'VAPI calls endpoint - Vercel deployment successful!',
          endpoint: fullPath,
          method: req.method,
          timestamp: new Date().toISOString(),
          data: [], // Empty array for now
          url: 'https://ai-sales-girl-project-hkr4.vercel.app'
        });

      case '/api/stats':
        return res.status(200).json({
          message: 'Stats endpoint - Vercel deployment successful!',
          endpoint: fullPath,
          method: req.method,
          timestamp: new Date().toISOString(),
          data: {
            totalCalls: 0,
            completedCalls: 0,
            pendingCalls: 0
          },
          url: 'https://ai-sales-girl-project-hkr4.vercel.app'
        });

      default:
        // For any other API path, return a generic response
        return res.status(200).json({
          message: `API endpoint ${fullPath} is accessible on Vercel!`,
          endpoint: fullPath,
          method: req.method,
          timestamp: new Date().toISOString(),
          note: 'This is a test response. Full functionality will be implemented next.',
          url: req.url,
          path: fullPath,
          vercelUrl: 'https://ai-sales-girl-project-hkr4.vercel.app'
        });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      message: 'Internal Server Error',
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint: fullPath
    });
  }
}
