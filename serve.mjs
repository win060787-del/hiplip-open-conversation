import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
function stripeLink(value, host) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === host && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}
const config = {
  paymentLink: stripeLink(process.env.STRIPE_PAYMENT_LINK, 'buy.stripe.com'),
  portalLink: stripeLink(process.env.STRIPE_PORTAL_LINK, 'billing.stripe.com'),
  firebase: process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_MEASUREMENT_ID && process.env.FIREBASE_API_KEY && process.env.FIREBASE_APP_ID ? {
    projectId: process.env.FIREBASE_PROJECT_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID,
    apiKey: process.env.FIREBASE_API_KEY,
  } : null,
};
const files = new Map([
  ['/settings.js', ['settings.js', 'text/javascript;charset=utf-8']],
  ['/', ['index.html', 'text/html;charset=utf-8']],
  ['/sample.js', ['sample.js', 'text/javascript;charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript;charset=utf-8']],
  ['/provider.js', ['provider.js', 'text/javascript;charset=utf-8']],
  ['/style.css', ['style.css', 'text/css;charset=utf-8']],
  ['/preview.jpg', ['preview.jpg', 'image/jpeg']],
]);
createServer(async (request, response) => {
  if (request.method === 'GET' && request.url === '/public-config.json') {
    response.writeHead(200, {'Content-Type':'application/json', 'Cache-Control':'no-store'}).end(JSON.stringify(config));
    return;
  }
  const entry = files.get(request.url?.split('?')[0]);
  if (!entry || request.method !== 'GET') {
    response.writeHead(404).end();
    return;
  }
  const [file, type] = entry;
  const body = await readFile(new URL('./public/' + file, import.meta.url)).catch(() => null);
  if (!body) { response.writeHead(500).end(); return; }
  response.writeHead(200, {'Content-Type': type, 'X-Content-Type-Options': 'nosniff'}).end(body);
}).listen(3072, '127.0.0.1', () => console.log('HiPlip: http://127.0.0.1:3072'));
