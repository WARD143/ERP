import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './db/database.js';
import { seedDatabase } from './db/seed.js';
import { evaluateAllStudentsRisk } from './server/riskEngine.js';

import { authRouter } from './server/routes/authRoutes.js';
import { studentRouter } from './server/routes/studentRoutes.js';
import { facultyRouter } from './server/routes/facultyRoutes.js';
import { adminRouter } from './server/routes/adminRoutes.js';
import { aiRouter } from './server/routes/aiRoutes.js';
import { mentoringRoutes } from './server/routes/mentoringRoutes.js';
import { erpRoutes } from './server/routes/erpRoutes.js';
import { datasetRouter } from './server/routes/datasetRoutes.js';
import { parentRouter } from './server/routes/parentRoutes.js';
import { reportRouter } from './server/routes/reportRoutes.js';
import { ouladRouter } from './server/routes/ouladRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Initialize and seed database if necessary
  try {
    await getDb();
    await seedDatabase(false);
    await evaluateAllStudentsRisk();
    console.log('✅ Academic SQLite Database verified and risk assessments primed.');
  } catch (err) {
    console.error('Database initialization error:', err);
  }

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/students', studentRouter);
  app.use('/api/faculty', facultyRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/mentoring', mentoringRoutes);
  app.use('/api/erp', erpRoutes);
  app.use('/api/dataset', datasetRouter);
  app.use('/api/parent', parentRouter);
  app.use('/api/reports', reportRouter);
  app.use('/api/oulad', ouladRouter);

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      app: 'AKTERA — Student Performance Analytics & Early Warning System',
      academicYear: '2026-2027',
      capstoneProject: 'Engineering Capstone Project – 1',
      department: 'Computer Science & Engineering',
      team: [
        { name: 'G. Akshath', roll: '2420030512' },
        { name: 'P. TejAditya', roll: '2420030520' },
        { name: 'I. Rajesh', roll: '2420030684' }
      ],
      guide: 'PRATUSHA MAM'
    });
  });

  // Vite middleware in dev or static files in production
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 AKTERA Server running on port ${PORT}`);
    console.log(`📍 Capstone Project: A.Y. 2026–2027 | CSE Department`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
