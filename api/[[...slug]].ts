import type { VercelRequest, VercelResponse } from '@vercel/node';

// Vercel catch-all API route handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { slug } = req.query;
  const path = Array.isArray(slug) ? slug.join('/') : slug || '';
  const fullPath = `/api/${path}`;

  // Set CORS headers for the custom domain
  res.setHeader('Access-Control-Allow-Origin', 'https://ai-sales-agent.cehpoint.co.in');
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
          domain: 'ai-sales-agent.cehpoint.co.in'
        });

      case '/api/auth/login':
        return res.status(200).json({
          message: 'Login endpoint - Vercel deployment successful!',
          endpoint: fullPath,
          method: req.method,
          timestamp: new Date().toISOString()
        });

      case '/api/auth/signup':
        return res.status(200).json({
          message: 'Signup endpoint - Vercel deployment successful!',
          endpoint: fullPath,
          method: req.method,
          timestamp: new Date().toISOString()
        });

      case '/api/vapi/calls':
        return res.status(200).json({
          message: 'VAPI calls endpoint - Vercel deployment successful!',
          endpoint: fullPath,
          method: req.method,
          timestamp: new Date().toISOString(),
          data: [] // Empty array for now
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
          }
        });

      default:
        // For any other API path, return a generic response
        return res.status(200).json({
          message: `API endpoint ${fullPath} is accessible on Vercel!`,
          endpoint: fullPath,
          method: req.method,
          timestamp: new Date().toISOString(),
          note: 'This is a test response. Full functionality will be implemented next.'
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
