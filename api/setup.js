export default async function handler(request, response) {
  try {
    // Add debug info
    console.log('Setup function called');
    
    // Check environment variables
    const dbUrl = process.env.POSTGRES_URL;
    const dbHost = process.env.POSTGRES_HOST;
    
    if (!dbUrl && !dbHost) {
      return response.status(500).json({ 
        error: 'Database environment variables not found',
        available: Object.keys(process.env).filter(key => key.includes('POSTGRES'))
      });
    }

    // Try to import and use postgres
    const { sql } = await import('@vercel/postgres');
    console.log('Postgres imported successfully');

    // Create table
    const result = await sql`
      CREATE TABLE IF NOT EXISTS files (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        tags JSONB DEFAULT '[]'::jsonb,
        content TEXT NOT NULL,
        original_name VARCHAR(255),
        size INTEGER,
        upload_date TIMESTAMP DEFAULT NOW()
      )
    `;
    
    console.log('Table created successfully');
    
    return response.status(200).json({ 
      message: 'Database table created successfully!',
      dbConnected: true
    });
    
  } catch (error) {
    console.error('Setup error:', error);
    return response.status(500).json({ 
      error: error.message,
      stack: error.stack,
      name: error.name
    });
  }
}
