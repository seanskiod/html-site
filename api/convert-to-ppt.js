import PptxGenJS from 'pptxgenjs';
import { JSDOM } from 'jsdom';
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileId } = req.body;
    
    // Get file from database
    const { rows } = await sql`
      SELECT title, content FROM files WHERE id = ${fileId}
    `;
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const file = rows[0];
    const dom = new JSDOM(file.content);
    const document = dom.window.document;
    
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
    
    // Process HTML content
    const slides = parseHTMLToSlides(document);
    
    // Create slides
    slides.forEach(slideData => {
      const slide = pres.addSlide();
      
      // Add title
      if (slideData.title) {
        slide.addText(slideData.title, {
          x: 0.5, y: 0.5, w: 9, h: 1,
          fontSize: 28, bold: true, color: '3182ce'
        });
      }
      
      // Add content
      if (slideData.content.length > 0) {
        let yPos = slideData.title ? 1.5 : 0.5;
        
        slideData.content.forEach(item => {
          if (item.type === 'text') {
            slide.addText(item.text, {
              x: 0.5, y: yPos, w: 9, h: 'auto',
              fontSize: 16, color: '333333',
              bullet: item.isList
            });
            yPos += item.isList ? 0.3 : 0.5;
          }
        });
      }
    });
    
    // Generate PowerPoint file
    const pptxData = await pres.write('base64');
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', `attachment; filename="${file.title.replace(/[^a-zA-Z0-9]/g, '_')}.pptx"`);
    res.setHeader('Content-Length', Buffer.byteLength(pptxData, 'base64'));
    
    // Send file
    res.send(Buffer.from(pptxData, 'base64'));
    
  } catch (error) {
    console.error('PowerPoint conversion error:', error);
    res.status(500).json({ error: 'Failed to convert to PowerPoint' });
  }
}

function parseHTMLToSlides(document) {
  const slides = [];
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  
  if (headings.length === 0) {
    // No headings - create one slide with all content
    const content = extractContent(document.body);
    slides.push({
      title: 'Content',
      content: content
    });
  } else {
    // Process each heading as a new slide
    headings.forEach((heading, index) => {
      const title = heading.textContent.trim();
      
      // Get content between this heading and the next
      const nextHeading = headings[index + 1];
      const content = extractContentBetween(heading, nextHeading);
      
      slides.push({
        title: title,
        content: content
      });
    });
  }
  
  return slides;
}

function extractContentBetween(startElement, endElement) {
  const content = [];
  let currentElement = startElement.nextElementSibling;
  
  while (currentElement && currentElement !== endElement) {
    if (currentElement.tagName === 'P') {
      const text = currentElement.textContent.trim();
      if (text) {
        content.push({
          type: 'text',
          text: text,
          isList: false
        });
      }
    } else if (currentElement.tagName === 'UL' || currentElement.tagName === 'OL') {
      const listItems = currentElement.querySelectorAll('li');
      listItems.forEach(li => {
        const text = li.textContent.trim();
        if (text) {
          content.push({
            type: 'text',
            text: text,
            isList: true
          });
        }
      });
    } else if (currentElement.tagName === 'DIV') {
      const text = currentElement.textContent.trim();
      if (text) {
        content.push({
          type: 'text',
          text: text,
          isList: false
        });
      }
    }
    
    currentElement = currentElement.nextElementSibling;
  }
  
  return content;
}

function extractContent(element) {
  const content = [];
  const textContent = element.textContent.trim();
  
  if (textContent) {
    // Split into paragraphs
    const paragraphs = textContent.split('\n').filter(p => p.trim());
    paragraphs.forEach(paragraph => {
      content.push({
        type: 'text',
        text: paragraph.trim(),
        isList: false
      });
    });
  }
  
  return content;
}
