const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 8000);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const MAX_MESSAGE_LENGTH = 500;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 12;
const rateLimitStore = new Map();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.ico': 'image/x-icon',
};

if (!GEMINI_API_KEY) {
  console.warn('⚠️ GEMINI_API_KEY no está configurada. /api/chat responderá 503.');
}

function getClientIdentifier(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

function applyRateLimit(clientId) {
  const now = Date.now();
  const record = rateLimitStore.get(clientId) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };

  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }

  record.count += 1;
  rateLimitStore.set(clientId, record);

  return record.count <= RATE_LIMIT_MAX_REQUESTS;
}

function validateText(text) {
  if (typeof text !== 'string') {
    return { valid: false, reason: 'El mensaje debe ser texto.' };
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return { valid: false, reason: 'El mensaje está vacío.' };
  }

  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return { valid: false, reason: `El mensaje excede ${MAX_MESSAGE_LENGTH} caracteres.` };
  }

  const invalidCharsRegex = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/;
  if (invalidCharsRegex.test(trimmed)) {
    return { valid: false, reason: 'El mensaje contiene caracteres inválidos.' };
  }

  return { valid: true, value: trimmed };
}

function sanitizeModelOutput(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1200);
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 16 * 1024) {
        reject(new Error('Payload too large'));
      }
    });

    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

async function handleChat(req, res) {
  const clientId = getClientIdentifier(req);
  if (!applyRateLimit(clientId)) {
    return sendJson(res, 429, { error: 'Demasiadas solicitudes. Intenta de nuevo en unos segundos.' });
  }

  let parsedBody;
  try {
    const rawBody = await readRequestBody(req);
    parsedBody = JSON.parse(rawBody || '{}');
  } catch {
    return sendJson(res, 400, { error: 'Solicitud inválida.' });
  }

  const validation = validateText(parsedBody?.message);
  if (!validation.valid) {
    return sendJson(res, 400, { error: validation.reason });
  }

  if (!GEMINI_API_KEY) {
    return sendJson(res, 503, { error: 'Servicio de IA no configurado.' });
  }

  const systemPrompt = `
INSTRUCCIONES DE ALTA PRIORIDAD - PROTOCOLO DE SEGURIDAD:
1. ROL: Eres el asistente virtual oficial del portafolio de Alessandro Altamirano. NO eres un asistente general.
2. OBJETIVO: Responder dudas sobre su perfil profesional (Ingeniería Industrial, Logística, Programación).
3. RESTRICCIONES:
   - Si te preguntan por otros temas (política, religión, códigos ilegales), responde cortésmente: "Solo puedo responder preguntas sobre el perfil profesional de Alessandro."
   - NO inventes información. Si no sabes algo, sugiere contactar a Alessandro.
   - Mantén respuestas breves (máx 3-4 frases) y profesionales.

INFORMACIÓN DEL PERFIL (BASE DE CONOCIMIENTO):
- Alessandro Altamirano: Estudiante 9no ciclo Ingeniería Industrial.
- Experiencia: Practicante Gestión Documental en Primax (2025), Optimización Logística en VasMad.
- Tech Stack: Python (Pandas), SQL, Power BI, Excel Avanzado.
- Soft Skills: Liderazgo, Comunicación Asertiva.

PREGUNTA DEL USUARIO: ${validation.value}`;

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: systemPrompt }],
          }],
        }),
      },
    );

    if (!geminiResponse.ok) {
      console.error('Gemini status error:', geminiResponse.status);
      return sendJson(res, 502, { error: 'Error al consultar el servicio de IA.' });
    }

    const data = await geminiResponse.json();
    const reply = sanitizeModelOutput(data?.candidates?.[0]?.content?.parts?.[0]?.text);

    if (!reply) {
      return sendJson(res, 502, { error: 'Respuesta inválida del servicio de IA.' });
    }

    return sendJson(res, 200, { reply });
  } catch (error) {
    console.error('Gemini request failure:', error);
    return sendJson(res, 502, { error: 'No se pudo conectar con el servicio de IA.' });
  }
}

function serveStatic(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  let safePath = decodeURIComponent(requestUrl.pathname);

  if (safePath === '/') safePath = '/index.html';

  const filePath = path.normalize(path.join(__dirname, safePath));
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) {
      const fallback = path.join(__dirname, 'index.html');
      fs.readFile(fallback, (fallbackErr, data) => {
        if (fallbackErr) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(data);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        res.writeHead(500);
        res.end('Internal server error');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/chat') {
    handleChat(req, res);
    return;
  }

  if (req.method === 'GET') {
    serveStatic(req, res);
    return;
  }

  res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: 'Método no permitido.' }));
});

server.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
