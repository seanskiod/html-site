import PptxGenJS from 'pptxgenjs';
import puppeteer from 'puppeteer';
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let browser;

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
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    
    // Load the HTML content
    await page.setContent(file.content, { waitUntil: 'networkidle0' });
    
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
    
    // Find all headings to create sections
    const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', elements => 
      elements.map(el => ({
        text: el.textContent.trim(),
        tagName: el.tagName,
        offsetTop: el.offsetTop
      }))
    );
    
    if (headings.length === 0) {
      // No headings - screenshot entire content
      const screenshot = await page.screenshot({
        type: 'png',
        encoding: 'base64',
        fullPage: true
      });
      
      const slide = pres.addSlide();
      slide.addText('Content', {
        x: 0.5, y: 0.2, w: 9, h: 0.8,
        fontSize: 24, bold: true, color: '3182ce'
      });
      slide.addImage({
        data: `data:image/png;base64,${screenshot}`,
        x: 0.5, y: 1.2, w: 9, h: 5.3
      });
    } else {
      // Process each section
      for (let i = 0; i < headings.length; i++) {
        const currentHeading = headings[i];
        const nextHeading = headings[i + 1];
        
        // Calculate section bounds
        const startY = currentHeading.offsetTop - 20; // Include some padding
        const endY = nextHeading ? nextHeading.offsetTop - 20 : null;
        
        // Take screenshot of this section
        const sectionScreenshot = await takeScreenshotOfSection(page, startY, endY);
        
        // Create slide
        const slide = pres.addSlide();
        slide.addText(currentHeading.text, {
          x: 0.5, y: 0.2, w: 9, h: 0.8,
          fontSize: 24, bold: true, color: '3182ce'
        });
        
        if (sectionScreenshot) {
          slide.addImage({
            data: `data:image/png;base64,${sectionScreenshot}`,
            x: 0.5, y: 1.2, w: 9, h: 5.3
          });
        }
      }
    }
    
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
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function takeScreenshotOfSection(page, startY, endY) {
  try {
    // Scroll to the section
    await page.evaluate((y) => {
      window.scrollTo(0, y);
    }, startY);
    
    // Wait a moment for rendering
    await page.waitForTimeout(500);
    
    // Calculate screenshot area
    const viewport = await page.viewport();
    const clip = {
      x: 0,
      y: 0,
      width: viewport.width,
      height: endY ? Math.min(endY - startY + 40, viewport.height) : viewport.height
    };
    
    // Take screenshot
    const screenshot = await page.screenshot({
      type: 'png',
      encoding: 'base64',
      clip: clip
    });
    
    return screenshot;
  } catch (error) {
    console.error('Screenshot error:', error);
    return null;
  }
}
