import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const files = new Map([
  ['/', ['index.html', 'text/html']],
  ...['app.js', 'api.js', 'media.js', 'course-sources.js', 'editorial.js'].map(file => ['/' + file, [file, 'text/javascript']]),
  ['/playlist-lessons.json', ['playlist-lessons.json', 'application/json']],
  ['/styles.css', ['styles.css', 'text/css']],
  ['/computador.svg', ['computador.svg', 'image/svg+xml']],
  ['/assets/cariby-ideathon.jpg', ['assets/cariby-ideathon.jpg', 'image/jpeg']],
  ['/assets/washington-junior.jpg', ['assets/washington-junior.jpg', 'image/jpeg']],
]);
const server = createServer(async (request, response) => {
  const entry = files.get(new URL(request.url, 'http://127.0.0.1').pathname);
  if (!entry || !['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(404).end();
    return;
  }
  try {
    const bytes = await readFile(new URL(entry[0], import.meta.url));
    response.writeHead(200, {
      'Content-Type': entry[1].startsWith('text/') ? entry[1] + '; charset=utf-8' : entry[1],
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(request.method === 'HEAD' ? undefined : bytes);
  } catch {
    response.writeHead(404).end();
  }
});
server.on('error', error => {
  console.error(error.code === 'EADDRINUSE' ? 'A porta 5500 já está em uso. Confira http://127.0.0.1:5500/' : error.message);
  process.exitCode = 1;
});
server.listen(5500, '127.0.0.1', () => {
  console.log('Fatecanos Academy: http://127.0.0.1:5500/');
  console.log('Mantenha esta janela aberta. Inicie também o Java na porta 8085 pelo IntelliJ.');
});
