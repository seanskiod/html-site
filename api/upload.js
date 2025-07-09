import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  if (request.method === 'POST') {
    try {
      const { title, tags, content, originalName, size } = request.body;

      // Validate input
      if (!title || !content || !originalName || !size) {
        return response.status(400).json({ error: 'Missing required fields' });
      }

      const tagsJson = Array.isArray(tags) ? JSON.stringify(tags) : '[]';

      const { rows } = await sql`
        INSERT INTO files (title, tags, content, original_name, size, upload_date)
        VALUES (${title}, ${tagsJson}::jsonb, ${content}, ${originalName}, ${size}, NOW())
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
      console.error('Upload API error:', error);
      return response.status(500).json({ 
        error: 'Failed to upload file',
        message: error.message,
        stack: error.stack
      });
    }
  }

  return response.status(405).json({ error: 'Method not allowed' });
}
