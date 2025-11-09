import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { join, extname } from 'path';
import { logger } from '../utils/logger.js';

interface ServeOptions {
  port: string;
}

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.frw': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

export async function serveCommand(directory: string = '.', options: ServeOptions): Promise<void> {
  const port = parseInt(options.port);
  
  logger.section('FRW Preview Server');

  const server = createServer(async (req, res) => {
    try {
      let filePath = join(directory, req.url || '/');
      
      // Check if path is directory
      try {
        const stats = await stat(filePath);
        if (stats.isDirectory()) {
          filePath = join(filePath, 'index.html');
        }
      } catch {
        // File doesn't exist
      }

      // Try .frw extension
      try {
        await stat(filePath);
      } catch {
        if (!filePath.endsWith('.html') && !filePath.endsWith('.frw')) {
          filePath += '.frw';
        }
      }

      const content = await readFile(filePath);
      const ext = extname(filePath);
      const mimeType = MIME_TYPES[ext] || 'text/plain';

      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(content);

      logger.debug(`${req.method} ${req.url} → ${filePath}`);
    } catch (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      logger.debug(`${req.method} ${req.url} → 404`);
    }
  });

  server.listen(port, () => {
    logger.success(`Server running on http://localhost:${port}`);
    logger.info(`Serving: ${directory}`);
    logger.info('');
    logger.info('Press Ctrl+C to stop');
  });

  // Handle shutdown
  process.on('SIGINT', () => {
    logger.info('');
    logger.info('Shutting down...');
    server.close(() => {
      logger.success('Server stopped');
      process.exit(0);
    });
  });
}
