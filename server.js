const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(express.json({ limit: '32kb' }));

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origen no permitido por CORS.'));
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
  })
);

const chatLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiadas solicitudes. Intenta nuevamente en unos segundos.'
  }
});

app.use(express.static(path.join(__dirname)));

app.post('/api/chat', chatLimiter, async (req, res) => {
  const { prompt } = req.body || {};

  if (typeof prompt !== 'string') {
    return res.status(400).json({ error: 'El campo "prompt" debe ser un string.' });
  }

  const sanitizedPrompt = prompt.trim();
  if (!sanitizedPrompt) {
    return res.status(400).json({ error: 'El prompt no puede estar vacío.' });
  }

  if (sanitizedPrompt.length > 2000) {
    return res.status(400).json({ error: 'El prompt excede el límite permitido (2000 caracteres).' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Falta configurar GEMINI_API_KEY en el servidor.' });
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
- Experiencia: Practicante Gestión Documental en Px Servicios Generales (Primax Ecuador) (2025), Optimización Logística en VasMad.
- Tech Stack: Python (Pandas), SQL, Power BI, Excel Avanzado.
- Soft Skills: Liderazgo, Comunicación Asertiva.

PREGUNTA DEL USUARIO: ${sanitizedPrompt}`;

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: systemPrompt }]
          }]
        })
      }
    );

    const data = await geminiResponse.json();

    if (!geminiResponse.ok || data.error) {
      console.error('Gemini API error:', data?.error || geminiResponse.statusText);
      return res.status(502).json({
        error: 'No fue posible procesar la solicitud con el servicio de IA.'
      });
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) {
      return res.status(502).json({ error: 'Respuesta inválida del servicio de IA.' });
    }

    return res.json({ reply });
  } catch (error) {
    console.error('Server error in /api/chat:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
