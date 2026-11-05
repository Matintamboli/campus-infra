import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { startPostgres } from './initPostgres.js';
import authRoutes from './routes/auth.js';
import incidentRoutes from './routes/incidents.js';
import ticketsRoutes from './routes/tickets.js';
import notificationRoutes from './routes/notifications.js';
import analyticsRoutes from './routes/analytics.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Start PostgreSQL
startPostgres().catch(err => {
  console.error('[Server] Failed to start PostgreSQL:', err);
  process.exit(1);
});

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

// API Routes
console.log('[Server] Mounting API routes...');
app.use('/api/auth', authRoutes);
console.log('[Server] ✓ /api/auth mounted');
app.use('/api/incidents', incidentRoutes);
console.log('[Server] ✓ /api/incidents mounted');
app.use('/api/tickets', ticketsRoutes);
console.log('[Server] ✓ /api/tickets mounted');
app.use('/api/notifications', notificationRoutes);
console.log('[Server] ✓ /api/notifications mounted');
app.use('/api/analytics', analyticsRoutes);
console.log('[Server] ✓ /api/analytics mounted');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CampusFix Infrastructure Incident Platform API',
    version: '2.0.0',
    database: 'PostgreSQL',
    timestamp: new Date().toISOString(),
  });
});

// Central 404 handler for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: 'API route not found' });
});

app.listen(PORT, () => {
  console.log(`[CampusFix API] Server running on http://localhost:${PORT}`);
  console.log(`[CampusFix API] Database: PostgreSQL via Prisma ORM`);
});
