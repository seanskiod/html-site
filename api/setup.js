export default async function handler(request, response) {
  try {
    console.log('Setup function starting...');
    
    // Check if environment variables exist
    const envVars = Object.keys(process.env).filter(key => key.includes('POSTGRES'));
    console.log('Found Postgres env vars:', envVars);
    
    if (envVars.length === 0) {
      return response.status(500).json({ 
        error: 'No Postgres environment variables found',
        allEnvKeys: Object.keys(process.env).slice(0, 10) // First 10 for debugging
      });
    }

    // Try to import @vercel/postgres
    console.log('Attempting to import @vercel/postgres...');
    const postgres = await import('@vercel/postgres');
    console.log('Import successful, postgres object keys:', Object.keys(postgres));
    
    const { sql } = postgres;
    console.log('SQL function extracted:', typeof sql);

    // Try a simple query first
    console.log('Attempting simple query...');
    const testResult = await sql`SELECT NOW() as current_time`;
    console.log('Simple query successful:', testResult);

    // Now try to create the table
    console.log('Attempting to create table...');
    const createResult = await sql`
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
    console.log('Table creation successful:', createResult);
    
    return response.status(200).json({ 
      message: 'Database setup successful!',
      envVarsFound: envVars.length,
      testQuery: testResult.rows[0],
      tableCreated: true
    });
    
  } catch (error) {
    console.error('Setup error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    
    return response.status(500).json({ 
      error: error.message,
      errorName: error.name,
      errorDetails: error.toString()
    });
  }
}
