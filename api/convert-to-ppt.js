import PptxGenJS from 'pptxgenjs';
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileId, screenshots } = req.body;
    
    // Get file from database
    const { rows } = await sql`
      SELECT title FROM files WHERE id = ${fileId}
    `;
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const file = rows[0];
    
    // Create PowerPoint presentation
    const pres = new PptxGenJS();
    pres.layout = 'LAYOUT_WIDE';
    
    // Add title slide
    const titleSlide = pres.addSlide();
    titleSlide.addText(file.title, {
      x: 1, y: 2, w: 8, h: 2,
      fontSize: 36, bold: true, color: '3182ce',
      align: 'center'
    });
    titleSlide.addText('Generated from BrandRank Resource Hub', {
      x: 1, y: 4, w: 8, h: 1,
      fontSize: 16, color: '666666',
      align: 'center'
    });
    
    // Add slides for each screenshot
    screenshots.forEach((screenshot, index) => {
      const slide = pres.addSlide();
      
      if (screenshot.title) {
        slide.addText(screenshot.title, {
          x: 0.5, y: 0.2, w: 9, h: 0.8,
          fontSize: 24, bold: true, color: '3182ce'
        });
      }
      
      slide.addImage({
        data: screenshot.image,
        x: 0.5, y: screenshot.title ? 1.2 : 0.5, 
        w: 9, 
        h: screenshot.title ? 5.3 : 6
      });
    });
    
    // Generate PowerPoint file
    const pptxData = await pres.write('base64');
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', `attachment; filename="${file.title.replace(/[^a-zA-Z0-9]/g, '_')}.pptx"`);
    
    // Send file
    res.send(Buffer.from(pptxData, 'base64'));
    
  } catch (error) {
    console.error('PowerPoint conversion error:', error);
    res.status(500).json({ error: 'Failed to convert to PowerPoint: ' + error.message });
  }
}
