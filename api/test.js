export default async function handler(request, response) {
  try {
    return response.status(200).json({ 
      message: 'API is working!',
      timestamp: new Date().toISOString(),
      method: request.method
    });
  } catch (error) {
    return response.status(500).json({ 
      error: error.message
    });
  }
}
