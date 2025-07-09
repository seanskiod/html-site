export default async function handler(request, response) {
  try {
    // Check if we have database environment variables
    const hasDbUrl = !!process.env.POSTGRES_URL;
    const hasDbHost = !!process.env.POSTGRES_HOST;
    
    return response.status(200).json({ 
      message: 'API is working!',
      hasDbUrl,
      hasDbHost,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return response.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
}
