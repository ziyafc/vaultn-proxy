import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();

app.use(cors());
app.use(express.json());

// Ortak secret: sadece Supabase Edge Functions biliyor
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || '';
const VAULTN_API_BASE = 'https://api.vaultn.com';
const VAULTN_API_KEY = process.env.VAULTN_API_KEY || '';

if (!VAULTN_API_KEY) {
  console.warn('⚠️ VAULTN_API_KEY environment variable is not set!');
}

if (!INTERNAL_SECRET) {
  console.warn('⚠️ INTERNAL_SECRET environment variable is not set!');
}

// Ortak proxy handler (GET ve POST için)
const proxyHandler = async (req: express.Request, res: express.Response) => {
  try {
    // Basit güvenlik: sadece bizim Supabase çağırabilsin
    const secretHeader = req.header('x-internal-secret');
    if (!secretHeader || secretHeader !== INTERNAL_SECRET) {
      console.log(`❌ Unauthorized request from ${req.ip}`);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // İstek nereye gidiyor?
    const pathFromClient = req.params[0] || '';
    const targetUrl = `${VAULTN_API_BASE}/${pathFromClient}`;

    // Query parameters'ı koru
    const url = new URL(targetUrl);
    Object.entries(req.query).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });

    console.log(`[Proxy] ${req.method} ${url.pathname}${url.search || ''}`);

    const fetchOptions: any = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VAULTN_API_KEY}`,
        'Accept': 'application/json',
      },
    };

    // POST ise body gönder
    if (req.method === 'POST' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const vaultnRes = await fetch(url.toString(), fetchOptions);

    const text = await vaultnRes.text();

    console.log(`[Proxy] Response: ${vaultnRes.status} (${text.length} bytes)`);

    // JSON ise JSON dön, değilse raw text dön
    try {
      const json = JSON.parse(text);
      return res.status(vaultnRes.status).json(json);
    } catch {
      return res.status(vaultnRes.status).send(text);
    }
  } catch (err: any) {
    console.error('❌ VaultN proxy error:', err.message);
    return res.status(500).json({ 
      error: 'VaultN proxy internal error', 
      details: err.message 
    });
  }
};

// GET ve POST endpoint'lerini aynı handler'a bağla
app.get('/vaultn-proxy/*', proxyHandler);
app.post('/vaultn-proxy/*', proxyHandler);

// Healthcheck
app.get('/health', (_req, res) => {
  res.json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    hasApiKey: !!VAULTN_API_KEY,
    hasSecret: !!INTERNAL_SECRET
  });
});

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    service: 'VaultN Proxy',
    version: '1.1.0',
    endpoints: {
      health: '/health',
      proxy: '/vaultn-proxy/*'
    },
    methods: ['GET', 'POST']
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ VaultN proxy listening on port ${PORT}`);
  console.log(`📍 Target: ${VAULTN_API_BASE}`);
  console.log(`🔑 API Key: ${VAULTN_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`🔐 Internal Secret: ${INTERNAL_SECRET ? '✅ Set' : '❌ Missing'}`);
});
