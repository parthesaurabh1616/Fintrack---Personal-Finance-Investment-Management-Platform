import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

router.get('/', authenticateToken, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isIn(['stock', 'bond', 'etf', 'crypto', 'mutual_fund', 'commodity', 'real_estate']),
], asyncHandler(async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  const userId = req.user!.id;

  const where: any = {
    userId,
  };

  if (req.query.type) {
    where.type = req.query.type.toUpperCase();
  }

  const [investments, total] = await Promise.all([
    prisma.investment.findMany({
      where,
      orderBy: { purchaseDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.investment.count({ where })
  ]);

  const investmentsWithCalculations = investments.map(investment => {
    const currentPrice = investment.currentPrice || investment.purchasePrice;
    const currentValue = investment.quantity * currentPrice;
    const purchaseValue = investment.quantity * investment.purchasePrice;
    const gainLoss = currentValue - purchaseValue;
    const gainLossPercentage = (gainLoss / purchaseValue) * 100;

    return {
      ...investment,
      currentValue,
      purchaseValue,
      gainLoss,
      gainLossPercentage,
    };
  });

  res.json({
    success: true,
    data: investmentsWithCalculations,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

router.post('/', authenticateToken, [
  body('symbol').trim().notEmpty().withMessage('Symbol is required'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('type').isIn(['stock', 'bond', 'etf', 'crypto', 'mutual_fund', 'commodity', 'real_estate']).withMessage('Valid investment type is required'),
  body('quantity').isFloat({ min: 0 }).withMessage('Quantity must be a positive number'),
  body('purchasePrice').isFloat({ min: 0 }).withMessage('Purchase price must be a positive number'),
  body('purchaseDate').isISO8601().withMessage('Valid purchase date is required'),
  body('currentPrice').optional().isFloat({ min: 0 }),
], asyncHandler(async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { symbol, name, type, quantity, purchasePrice, purchaseDate, currentPrice } = req.body;
  const userId = req.user!.id;

  const investment = await prisma.investment.create({
    data: {
      symbol: symbol.toUpperCase(),
      name,
      type: type.toUpperCase(),
      quantity,
      purchasePrice,
      currentPrice: currentPrice || purchasePrice,
      purchaseDate: new Date(purchaseDate),
      userId,
    }
  });

  logger.info(`Investment created: ${investment.id} by user ${userId}`);

  res.status(201).json({
    success: true,
    message: 'Investment created successfully',
    data: investment
  });
}));

router.put('/:id', authenticateToken, [
  body('symbol').optional().trim().notEmpty(),
  body('name').optional().trim().notEmpty(),
  body('type').optional().isIn(['stock', 'bond', 'etf', 'crypto', 'mutual_fund', 'commodity', 'real_estate']),
  body('quantity').optional().isFloat({ min: 0 }),
  body('purchasePrice').optional().isFloat({ min: 0 }),
  body('currentPrice').optional().isFloat({ min: 0 }),
  body('purchaseDate').optional().isISO8601(),
], asyncHandler(async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { id } = req.params;
  const userId = req.user!.id;
  const updateData = req.body;

  if (updateData.symbol) {
    updateData.symbol = updateData.symbol.toUpperCase();
  }

  if (updateData.type) {
    updateData.type = updateData.type.toUpperCase();
  }

  if (updateData.purchaseDate) {
    updateData.purchaseDate = new Date(updateData.purchaseDate);
  }

  const investment = await prisma.investment.findFirst({
    where: { id, userId }
  });

  if (!investment) {
    return res.status(404).json({
      success: false,
      message: 'Investment not found'
    });
  }

  const updatedInvestment = await prisma.investment.update({
    where: { id },
    data: updateData
  });

  logger.info(`Investment updated: ${id} by user ${userId}`);

  res.json({
    success: true,
    message: 'Investment updated successfully',
    data: updatedInvestment
  });
}));

router.delete('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const investment = await prisma.investment.findFirst({
    where: { id, userId }
  });

  if (!investment) {
    return res.status(404).json({
      success: false,
      message: 'Investment not found'
    });
  }

  await prisma.investment.delete({
    where: { id }
  });

  logger.info(`Investment deleted: ${id} by user ${userId}`);

  res.json({
    success: true,
    message: 'Investment deleted successfully'
  });
}));

router.get('/analytics', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  const investments = await prisma.investment.findMany({
    where: { userId },
    orderBy: { purchaseDate: 'asc' }
  });

  const totalValue = investments.reduce((sum, investment) => {
    const currentPrice = investment.currentPrice || investment.purchasePrice;
    return sum + (investment.quantity * currentPrice);
  }, 0);

  const totalGainLoss = investments.reduce((sum, investment) => {
    const currentPrice = investment.currentPrice || investment.purchasePrice;
    const currentValue = investment.quantity * currentPrice;
    const purchaseValue = investment.quantity * investment.purchasePrice;
    return sum + (currentValue - purchaseValue);
  }, 0);

  const assetAllocation = investments.reduce((acc, investment) => {
    const currentPrice = investment.currentPrice || investment.purchasePrice;
    const value = investment.quantity * currentPrice;
    
    if (!acc[investment.type]) {
      acc[investment.type] = 0;
    }
    acc[investment.type] += value;
    
    return acc;
  }, {} as Record<string, number>);

  const assetAllocationArray = Object.entries(assetAllocation).map(([type, value]) => ({
    name: type,
    value
  }));

  const performanceChart = investments.map(investment => {
    const currentPrice = investment.currentPrice || investment.purchasePrice;
    const value = investment.quantity * currentPrice;
    return {
      date: investment.purchaseDate.toISOString().split('T')[0],
      value
    };
  });

  res.json({
    success: true,
    data: {
      totalValue,
      totalGainLoss,
      totalGainLossPercentage: totalValue > 0 ? (totalGainLoss / (totalValue - totalGainLoss)) * 100 : 0,
      assetAllocation: assetAllocationArray,
      performanceChart,
      investmentCount: investments.length,
      topPerformers: investments
        .map(investment => {
          const currentPrice = investment.currentPrice || investment.purchasePrice;
          const purchaseValue = investment.quantity * investment.purchasePrice;
          const currentValue = investment.quantity * currentPrice;
          const gainLossPercentage = ((currentValue - purchaseValue) / purchaseValue) * 100;
          
          return {
            ...investment,
            gainLossPercentage
          };
        })
        .sort((a, b) => b.gainLossPercentage - a.gainLossPercentage)
        .slice(0, 5)
    }
  });
}));

export { router as investmentRoutes };
