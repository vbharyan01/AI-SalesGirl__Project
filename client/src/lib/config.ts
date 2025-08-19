// Configuration for different environments
export const config = {
  // API base URL - changes based on environment
  apiBaseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://ai-sales-girl-project-hkr4.vercel.app' 
    : '', // Empty for local development (uses Vite proxy)
  
  // Check if we're running on Vercel
  isVercel: typeof window !== 'undefined' && window.location.hostname.includes('vercel.app'),
  
  // Get the full API URL for a given endpoint
  getApiUrl: (endpoint: string) => {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://ai-sales-girl-project-hkr4.vercel.app' 
      : '';
    return `${baseUrl}${endpoint}`;
  }
};
