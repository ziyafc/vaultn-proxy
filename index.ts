import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();

app.use(cors());
app.use(express.json());

// Ortak secret: sadece Supabase Edge Functions biliyor
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || '';
const VAULTN_API_BASE = 'https://api.vaultn.com'; // örnek, gerçek base URL'ini yaz
const VAULTN_API_KEY = process.env.VAULTN_API_KEY || '';

if (!VAULTN_API_KEY) {
  console.warn('⚠️ VAULTN_API_KEY environment variable is not set!');
}

app.post('/vaultn-proxy/*', async (req, res) => {
  try {
    // Basit güvenlik: sadece bizim Supabase çağırabilsin
    const secretHeader = req.header('x-internal-secret');
    if (!secretHeader || secretHeader !== INTERNAL_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // İstek nereye gidiyor?
    const pathFromClient = req.params[0] || ''; // /vaultn-proxy/orders gibi
    const targetUrl = `${VAULTN_API_BASE}/${pathFromClient}`;

    const vaultnRes = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VAULTN_API_KEY}`,
        // Gerekirse ek header'lar:
        // 'X-Correlation-Id': req.header('X-Correlation-Id') || '',
      },
      body: JSON.stringify(req.body),
    });

    const text = await vaultnRes.text();

    // JSON ise JSON dön, değilse raw text dön
    try {
      const json = JSON.parse(text);
      return res.status(vaultnRes.status).json(json);
    } catch {
      return res.status(vaultnRes.status).send(text);
    }
  } catch (err: any) {
    console.error('VaultN proxy error:', err);
    return res.status(500).json({ error: 'VaultN proxy internal error' });
  }
});

// Healthcheck
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`VaultN proxy listening on port ${PORT}`);
});
