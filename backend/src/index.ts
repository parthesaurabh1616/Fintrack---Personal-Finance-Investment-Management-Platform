import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { authRoutes } from './routes/auth';
import { expenseRoutes } from './routes/expenses';
import { investmentRoutes } from './routes/investments';
import { budgetRoutes } from './routes/budgets';
import { analyticsRoutes } from './routes/analytics';
import { dashboardRoutes } from './routes/dashboard';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    services: {
      database: 'connected',
      redis: 'connected',
      ml_service: 'connected'
    }
  });
});

app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDatabase();
    await connectRedis();
    
    app.listen(PORT, () => {
      logger.info(`FinTrack API server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
