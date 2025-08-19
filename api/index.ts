import type { VercelRequest, VercelResponse } from '@vercel/node';

// Vercel serverless function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers for the custom domain
  res.setHeader('Access-Control-Allow-Origin', 'https://ai-sales-agent.cehpoint.co.in');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Handle the request
  try {
    // For now, return a simple response to test
    res.status(200).json({
      message: 'AI Sales Girl API is running on Vercel!',
      timestamp: new Date().toISOString(),
      endpoint: '/api',
      status: 'success',
      domain: 'ai-sales-agent.cehpoint.co.in',
      method: req.method,
      path: req.url
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      message: 'Internal Server Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
