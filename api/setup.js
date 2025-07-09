import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  try {
    await sql`
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
    
    return response.status(200).json({ message: 'Database table created successfully!' });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}
