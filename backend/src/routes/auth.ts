import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { redisClient } from '../config/redis';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

const generateToken = (userId: string) => {
  const secret = process.env.JWT_SECRET || 'fallback-secret-key';
  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
};

const generateRefreshToken = (userId: string) => {
  const secret = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-key';
  return jwt.sign({ userId }, secret, { expiresIn: '30d' });
};

router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { name, email, password } = req.body;

  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email'
    });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    }
  });

  const token = generateToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  await redisClient.setEx(`refresh_token:${user.id}`, 30 * 24 * 60 * 60, refreshToken);

  logger.info(`New user registered: ${user.email}`);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    user,
    token,
    refreshToken
  });
}));

router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user || !user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  const token = generateToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  await redisClient.setEx(`refresh_token:${user.id}`, 30 * 24 * 60 * 60, refreshToken);

  logger.info(`User logged in: ${user.email}`);

  res.json({
    success: true,
    message: 'Login successful',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    token,
    refreshToken
  });
}));

router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token required'
    });
  }

  const secret = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-key';
  const decoded = jwt.verify(refreshToken, secret) as any;

  const storedToken = await redisClient.get(`refresh_token:${decoded.userId}`);

  if (!storedToken || storedToken !== refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
    }
  });

  if (!user || !user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'User not found or inactive'
    });
  }

  const newToken = generateToken(user.id);

  res.json({
    success: true,
    token: newToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    }
  });
}));

router.post('/logout', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  if (req.user) {
    await redisClient.del(`refresh_token:${req.user.id}`);
    logger.info(`User logged out: ${req.user.email}`);
  }

  res.json({
    success: true,
    message: 'Logout successful'
  });
}));

router.get('/me', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  res.json({
    success: true,
    user: req.user
  });
}));

router.put('/profile', authenticateToken, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
], asyncHandler(async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { name, email } = req.body;
  const userId = req.user!.id;

  if (email) {
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser && existingUser.id !== userId) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use'
      });
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name && { name }),
      ...(email && { email }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      updatedAt: true,
    }
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    user: updatedUser
  });
}));

export { router as authRoutes };
