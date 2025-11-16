import fs from 'fs';
import path from 'path';
import https from 'https';
import express from 'express';

const PORT = process.env.PORT ? Number(process.env.PORT) : 8001;
const API_TOKEN = process.env.XANDRIAAI_TOKEN || 'dev-token';

// Use your own certificate in production
const certDir = process.env.CERT_DIR || path.join(process.cwd(), 'cert');
const key = fs.readFileSync(path.join(certDir, 'key.pem'));
const cert = fs.readFileSync(path.join(certDir, 'cert.pem'));

const app = express();
app.use(express.json());

// Simple bearer token auth
app.use((req, res, next) => {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (token !== API_TOKEN) return res.status(401).json({ error: 'Unauthorized' });
  next();
});

// Example endpoint your extension calls
app.post('/api/snippet', (req, res) => {
  const { language, codeContext } = req.body || {};
  const snippet = `// Suggested snippet for ${language}
${codeContext ? '// based on your selection' : '// (no selection provided)'}
function hello() { return 'world'; }`;
  res.json({ snippet });
});

// Centralized error handling
app.use((err:any, _req:any, res:any, _next:any) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

https.createServer({ key, cert }, app).listen(PORT, () => {
  console.log(`HTTPS server listening on https://localhost:${PORT}`);
});
