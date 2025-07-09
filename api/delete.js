import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  if (request.method === 'DELETE') {
    try {
      const { id } = request.query;
      
      const { rowCount } = await sql`
        DELETE FROM files WHERE id = ${id}
      `;
      
      if (rowCount === 0) {
        return response.status(404).json({ error: 'File not found' });
      }
      
      return response.status(200).json({ success: true });
    } catch (error) {
      return response.status(500).json({ error: 'Failed to delete file' });
    }
  }
  
  return response.status(405).json({ error: 'Method not allowed' });
}
