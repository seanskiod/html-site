// /api/upload.js

let sql;
try {
  sql = (await import('@vercel/postgres')).sql;
} catch (e) {
  console.error('Failed to import @vercel/postgres:', e);
}

import { IncomingForm } from 'formidable';
import fs from 'fs/promises';

export const config = {
  api: {
    bodyParser: false, // Required for formidable
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = new IncomingForm({ multiples: false });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Form parse error:', err);
        return res.status(500).json({ error: 'Form parsing failed' });
      }

      const title = fields.title || 'Untitled';
      const tags = fields.tags ? JSON.parse(fields.tags) : [];
      const file = files.file;

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileContent = await fs.readFile(file.filepath, 'utf-8');

      const { rows } = await sql`
        INSERT INTO files (title, tags, content, original_name, size, upload_date)
        VALUES (
          ${title},
          ${JSON.stringify(tags)},
          ${fileContent},
          ${file.originalFilename},
          ${file.size},
          NOW()
        )
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

      return res.status(200).json(newFile);
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Failed to upload file' });
  }
}
