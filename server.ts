/**
 * SharePlate Server Entrypoint
 * Full-stack Express server hosting RESTful API on /api/v1 and mounting Vite middlewares.
 * Port 3000.
 */

import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { spawn } from 'child_process';
import { seedInitialData } from './server/db/seedData.ts';
import { errorHandler } from './server/middleware/errorHandler.ts';

// Routes
import authRoutes from './server/routes/auth.ts';
import verificationRoutes from './server/routes/verifications.ts';
import listingRoutes from './server/routes/listings.ts';
import requestRoutes from './server/routes/requests.ts';
import pickupRoutes from './server/routes/pickups.ts';
import intelligenceRoutes from './server/routes/intelligence.ts';
import analyticsRoutes from './server/routes/analytics.ts';
import safetyReportRoutes from './server/routes/safetyReports.ts';
import notificationRoutes from './server/routes/notifications.ts';
import auditLogRoutes from './server/routes/auditLogs.ts';
import userRoutes from './server/routes/users.ts';
import mapRoutes from './server/routes/maps.ts';
import restaurantRoutes from './server/routes/restaurants.ts';

const app = express();
const DEFAULT_PORT = Number(process.env.PORT || 3000);

// Security & Body parsing
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

import http from 'http';

function getPythonExecutable(): string {
  const platform = process.platform;
  if (platform === 'win32') {
    return 'py';
  }
  return 'python3';
}

// Launch Python Intelligence Microservice on port 8000 in background
function launchPythonService() {
  const checkReq = http.get('http://127.0.0.1:8000/health', (res) => {
    if (res.statusCode === 200) {
      console.log('[Server] Python intelligence service already running on port 8000.');
      return;
    }
    spawnProc();
  });

  checkReq.on('error', () => {
    spawnProc();
  });

  function spawnProc() {
    const pythonScript = path.resolve(process.cwd(), 'intelligence', 'service.py');
    const pythonExecutable = getPythonExecutable();

    try {
      const pyProc = spawn(pythonExecutable, [pythonScript, '8000'], {
        detached: false,
        stdio: ['ignore', 'inherit', 'inherit'],
      });

      pyProc.on('error', (err) => {
        console.warn('[Server] Could not spawn standalone Python process on port 8000:', err.message);
      });

      process.on('exit', () => {
        try {
          pyProc.kill();
        } catch {}
      });
    } catch (err: any) {
      console.warn('[Server] Python spawn warning:', err.message);
    }
  }
}

async function startServer() {
  // 1. Seed demo dataset
  await seedInitialData();

  // 2. Start Python service
  launchPythonService();

  // 3. API Routes under /api/v1
  const apiRouter = express.Router();
  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/verifications', verificationRoutes);
  apiRouter.use('/listings', listingRoutes);
  apiRouter.use('/requests', requestRoutes);
  apiRouter.use('/pickups', pickupRoutes);
  apiRouter.use('/intelligence', intelligenceRoutes);
  apiRouter.use('/analytics', analyticsRoutes);
  apiRouter.use('/safety-reports', safetyReportRoutes);
  apiRouter.use('/notifications', notificationRoutes);
  apiRouter.use('/audit-logs', auditLogRoutes);
  apiRouter.use('/users', userRoutes);
  apiRouter.use('/maps', mapRoutes);
  apiRouter.use('/restaurants', restaurantRoutes);

  app.use('/api/v1', apiRouter);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      app: 'SharePlate — Smart Food Redistribution Platform',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  // 4. Vite Frontend Integration
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  function listenOnPort(port: number) {
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`[SharePlate] Server running on http://0.0.0.0:${port}`);
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        const nextPort = port + 1;
        console.warn(`[SharePlate] Port ${port} is busy. Retrying on ${nextPort}...`);
        listenOnPort(nextPort);
        return;
      }

      console.error('[SharePlate] Fatal startup error:', err);
      process.exit(1);
    });
  }

  listenOnPort(DEFAULT_PORT);
}

startServer().catch((err) => {
  console.error('[SharePlate] Fatal startup error:', err);
});
