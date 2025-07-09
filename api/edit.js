import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  if (request.method === 'PATCH') {
    try {
      const { id, title, tags } = request.body;

      const { rows } = await sql`
        UPDATE files 
        SET title = ${title}, tags = ${JSON.stringify(tags)}
        WHERE id = ${id}
        RETURNING *
      `;

      if (rows.length === 0) {
        return response.status(404).json({ error: 'File not found' });
      }

      const updatedFile = {
        id: rows[0].id.toString(),
        title: rows[0].title,
        tags: rows[0].tags || [],
        content: rows[0].content,
        originalName: rows[0].original_name,
        size: rows[0].size,
        uploadDate: rows[0].upload_date,
      };

      return response.status(200).json(updatedFile);
    } catch (error) {
      return response.status(500).json({ error: 'Failed to update file' });
    }
  }

  return response.status(405).json({ error: 'Method not allowed' });
}
