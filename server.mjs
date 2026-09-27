import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AIServiceError, generateLegalResponse } from './lib/ai-core.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const MAX_BODY_BYTES = 2 * 1024 * 1024;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

function setCommonHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
}

function sendJson(res, status, body) {
  setCommonHeaders(res);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(body));
}

async function readJsonBody(req) {
  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      throw new AIServiceError('حجم الطلب أكبر من الحد المسموح.', 'REQUEST_TOO_LARGE', 413);
    }
    chunks.push(chunk);
  }

  if (!chunks.length) return {};
  const raw = Buffer.concat(chunks).toString('utf8');

  try {
    return JSON.parse(raw);
  } catch {
    throw new AIServiceError('صيغة الطلب غير صحيحة.', 'INVALID_JSON', 400);
  }
}

async function handleAI(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED', message: 'هذا المسار يقبل POST فقط.' });
  }

  try {
    const payload = await readJsonBody(req);
    const result = await generateLegalResponse(payload);
    return sendJson(res, 200, result);
  } catch (error) {
    const status = error instanceof AIServiceError ? error.status : 500;
    const code = error instanceof AIServiceError ? error.code : 'SERVER_ERROR';
    const message = error instanceof AIServiceError
      ? error.message
      : 'حدث خطأ غير متوقع في الخادم.';

    return sendJson(res, status, { error: code, message });
  }
}

function safePathFromUrl(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath.split('?')[0]);
  } catch {
    return null;
  }

  const clean = decoded === '/' ? '/index.html' : decoded;
  const resolved = path.resolve(__dirname, `.${clean}`);
  if (!resolved.startsWith(__dirname)) return null;
  return resolved;
}

async function serveStatic(req, res) {
  if (!['GET', 'HEAD'].includes(req.method || '')) {
    return sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED', message: 'طريقة الطلب غير مسموحة.' });
  }

  let filePath = safePathFromUrl(req.url || '/');
  if (!filePath) {
    res.writeHead(400);
    return res.end('Bad request');
  }

  if (filePath.includes(`${path.sep}api${path.sep}`) || filePath.includes(`${path.sep}lib${path.sep}`)) {
    res.writeHead(404);
    return res.end('Not found');
  }

  try {
    const info = await stat(filePath);
    if (info.isDirectory()) filePath = path.join(filePath, 'index.html');
  } catch {
    filePath = path.join(__dirname, 'index.html');
  }

  try {
    const body = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    setCommonHeaders(res);
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
    });
    if (req.method === 'HEAD') return res.end();
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}

const server = http.createServer(async (req, res) => {
  if ((req.url || '').split('?')[0] === '/api/ai') {
    return handleAI(req, res);
  }
  return serveStatic(req, res);
});

server.listen(PORT, HOST, () => {
  console.log(`Alaa legal assistant is running on http://${HOST}:${PORT}`);
});
