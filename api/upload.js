import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  if (request.method === 'POST') {
    try {
      const { title, tags, content, originalName, size } = request.body;
      
      const { rows } = await sql`
        INSERT INTO files (title, tags, content, original_name, size, upload_date)
        VALUES (${title}, ${JSON.stringify(tags)}, ${content}, ${originalName}, ${size}, NOW())
        RETURNING *
      `;
      
      const newFile = {
        id: rows[0].id.toString(),
        title: rows[0].title,
        tags: rows[0].tags || [],
        content: rows[0].content,
        originalName: rows[0].original_name,
        size: rows[0].size,
        uploadDate: rows[0].upload_date
      };
      
      return response.status(200).json(newFile);
    } catch (error) {
      return response.status(500).json({ error: 'Failed to upload file' });
    }
  }
  
  return response.status(405).json({ error: 'Method not allowed' });
}
