import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { startPostgres } from './initPostgres.js';
import authRoutes from './routes/auth.js';
import incidentRoutes from './routes/incidents.js';
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
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);

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
