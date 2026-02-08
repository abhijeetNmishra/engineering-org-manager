import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { authMiddleware } from './api/middleware/auth.js';

// Import Vercel API handlers
// Note: We need to use .js extensions because we are compiled to ESM
import orgStateHandler from './api/org-state.js';
import employeesHandler from './api/employees.js';
import modulesHandler from './api/modules.js';
import sendCodeHandler from './api/send-code.js';
import verifyHandler from './api/verify.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Auth Middleware (Global for /api routes)
app.use('/api', authMiddleware);

// API Routes - Adapter to match Vercel's (req, res) signature
// Express (req, res) is compatible enough with VercelRequest/Response for basic usage
app.all('/api/org-state', (req, res) => orgStateHandler(req as any, res as any));
app.all('/api/employees', (req, res) => employeesHandler(req as any, res as any));
app.all('/api/modules', (req, res) => modulesHandler(req as any, res as any));
app.post('/api/send-code', (req, res) => sendCodeHandler(req as any, res as any));
app.post('/api/verify', (req, res) => verifyHandler(req as any, res as any));

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Static frontend serving (for production/docker)
// In dev, Vite serves this. In prod, we serve dist/
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distPath = join(__dirname, 'dist');

app.use(express.static(distPath));

// SPA Fallback
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Not Found' });
    }
    res.sendFile(join(distPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
