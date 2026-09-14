// Local QA only: serve an allowlist of public website assets, never workspace files.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const allowed = new Set(fs.readdirSync(root).filter(name => name.endsWith('.html')));
['styles.css', 'script.js', 'sitemap.xml', 'robots.txt'].forEach(name => allowed.add(name));
for (const dir of ['assets/gallery', 'assets/images', 'assets/icons']) {
  for (const name of fs.readdirSync(path.join(root, dir))) {
    if (/\.(png|jpe?g|svg|webp)$/i.test(name)) allowed.add(dir + '/' + name);
  }
}
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.xml':'application/xml','.txt':'text/plain'};
const server = http.createServer((req, res) => {
  let file;
  try { file = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\//, '') || 'index.html'; }
  catch { res.writeHead(400).end(); return; }
  if (!['GET', 'HEAD'].includes(req.method) || !allowed.has(file)) { res.writeHead(404).end(); return; }
  res.writeHead(200, {'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff', 'Content-Security-Policy':"connect-src 'none'; form-action 'none'; frame-src 'none'"});
  if (req.method === 'HEAD') res.end(); else fs.createReadStream(path.join(root,file)).pipe(res);
});
server.listen(0, '127.0.0.1', () => console.log('QA preview: http://127.0.0.1:' + server.address().port));
