export default async function handler(request, response) {
  try {
    console.log('Files API called');
    
    // Try to connect to database
    const { sql } = await import('@vercel/postgres');
    console.log('Database connection imported');
    
    // Try a simple select first
    const result = await sql`
      SELECT 
        id, title, tags, content, original_name, size, upload_date
      FROM files 
      ORDER BY upload_date DESC 
      LIMIT 10
    `;
    console.log('Query successful, found', result.rows.length, 'files');
    
    // Format the results
    const files = result.rows.map(row => ({
      id: row.id.toString(),
      title: row.title,
      tags: row.tags || [],
      content: row.content,
      originalName: row.original_name,
      size: row.size,
      uploadDate: row.upload_date
    }));
    
    return response.status(200).json(files);
    
  } catch (error) {
    console.error('Files API error:', error);
    
    // If table doesn't exist, return empty array
    if (error.message.includes('relation "files" does not exist')) {
      return response.status(200).json([]);
    }
    
    return response.status(500).json({ 
      error: error.message,
      suggestion: 'Try visiting /api/setup first to create the database table'
    });
  }
}
