import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';
const root = resolve(fileURLToPath(new URL('.', import.meta.url)));
const types = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.svg':'image/svg+xml', '.ttf':'font/ttf', '.json':'application/json' };
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const path = resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (!path.startsWith(root + sep) && path !== resolve(root, 'index.html')) throw new Error('Invalid path');
    const relative = path.slice(root.length + 1);
    if (!['index.html', 'style.css', 'app.js', 'assets/icon.svg', 'assets/symbols.ttf'].includes(relative)) throw new Error('Not public');
    if (!(await stat(path)).isFile()) throw new Error('Not a file');
    res.writeHead(200, { 'Content-Type': `${types[extname(path)]}; charset=utf-8`, 'X-Content-Type-Options':'nosniff' });
    res.end(await readFile(path));
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(Number(process.env.PORT) || 3000, '0.0.0.0', () => console.log('Studio running on port ' + (process.env.PORT || 3000)));
