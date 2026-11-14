// Custom Next.js server for cPanel "Setup Node.js App".
// cPanel runs `node <startup file>` and cannot run `next start` directly,
// so this file starts Next.js on the port cPanel assigns via process.env.PORT.
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const rawPort = process.env.PORT;
const port = rawPort ? (isNaN(Number(rawPort)) ? rawPort : parseInt(rawPort, 10)) : 3000;
const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, () => {
    console.log(`Next.js ready on port ${port}`);
  });
});
