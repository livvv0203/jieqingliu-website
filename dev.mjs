import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';

const types = { '.html': 'text/html', '.css': 'text/css', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg' };
createServer(async (req, res) => {
  const path = (req.url || '/').split('?')[0];
  const file = path === '/' ? 'index.html' : path.slice(1);
  if (!['index.html', 'styles.css', 'favicon.svg', 'profile.jpg'].includes(file)) {
    res.writeHead(404).end('Not found');
    return;
  }
  const contents = await readFile(resolve(file));
  res.writeHead(200, { 'Content-Type': types[extname(file)] });
  res.end(contents);
}).listen(Number(process.env.PORT || 4173), () => console.log(`Preview: http://localhost:${process.env.PORT || 4173}`));
