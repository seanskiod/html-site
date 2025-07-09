import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  if (request.method === 'GET') {
    try {
      const { rows } = await sql`
        SELECT 
          id,
          title,
          tags,
          content,
          original_name,
          size,
          upload_date
        FROM files 
        ORDER BY upload_date DESC
      `;
      
      // Convert database format to match frontend expectations
      const formattedFiles = rows.map(row => ({
        id: row.id.toString(),
        title: row.title,
        tags: row.tags || [],
        content: row.content,
        originalName: row.original_name,
        size: row.size,
        uploadDate: row.upload_date
      }));
      
      return response.status(200).json(formattedFiles);
    } catch (error) {
      return response.status(500).json({ error: 'Failed to fetch files' });
    }
  }
  
  return response.status(405).json({ error: 'Method not allowed' });
}
