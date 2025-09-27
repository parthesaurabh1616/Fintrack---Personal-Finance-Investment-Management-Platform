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
  query('period').optional().isIn(['weekly', 'monthly', 'yearly']),
  query('active').optional().isBoolean(),
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

  if (req.query.period) {
    where.period = req.query.period.toUpperCase();
  }

  if (req.query.active !== undefined) {
    const isActive = req.query.active === 'true';
    if (isActive) {
      where.endDate = { gte: new Date() };
    }
  }

  const [budgets, total] = await Promise.all([
    prisma.budget.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.budget.count({ where })
  ]);

  const budgetsWithCalculations = budgets.map(budget => {
    const percentage = (budget.spent / budget.amount) * 100;
    const remaining = budget.amount - budget.spent;
    const isOverBudget = budget.spent > budget.amount;
    const daysRemaining = Math.ceil((budget.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    return {
      ...budget,
      percentage,
      remaining,
      isOverBudget,
      daysRemaining: Math.max(0, daysRemaining),
    };
  });

  res.json({
    success: true,
    data: budgetsWithCalculations,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

router.post('/', authenticateToken, [
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('period').isIn(['weekly', 'monthly', 'yearly']).withMessage('Valid period is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
], asyncHandler(async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { category, amount, period, startDate } = req.body;
  const userId = req.user!.id;

  const start = new Date(startDate);
  let end: Date;

  switch (period) {
    case 'weekly':
      end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
      break;
    case 'monthly':
      end = new Date(start.getFullYear(), start.getMonth() + 1, start.getDate());
      break;
    case 'yearly':
      end = new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());
      break;
    default:
      throw createError('Invalid period', 400);
  }

  const existingBudget = await prisma.budget.findFirst({
    where: {
      userId,
      category,
      startDate: { lte: end },
      endDate: { gte: start },
    }
  });

  if (existingBudget) {
    return res.status(400).json({
      success: false,
      message: 'Budget already exists for this category and period'
    });
  }

  const budget = await prisma.budget.create({
    data: {
      category,
      amount,
      period: period.toUpperCase(),
      startDate: start,
      endDate: end,
      userId,
    }
  });

  logger.info(`Budget created: ${budget.id} by user ${userId}`);

  res.status(201).json({
    success: true,
    message: 'Budget created successfully',
    data: budget
  });
}));

router.put('/:id', authenticateToken, [
  body('category').optional().trim().notEmpty(),
  body('amount').optional().isFloat({ min: 0 }),
  body('period').optional().isIn(['weekly', 'monthly', 'yearly']),
  body('startDate').optional().isISO8601(),
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

  if (updateData.period) {
    updateData.period = updateData.period.toUpperCase();
  }

  if (updateData.startDate) {
    const start = new Date(updateData.startDate);
    let end: Date;

    switch (updateData.period) {
      case 'WEEKLY':
        end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'MONTHLY':
        end = new Date(start.getFullYear(), start.getMonth() + 1, start.getDate());
        break;
      case 'YEARLY':
        end = new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());
        break;
    }

    updateData.startDate = start;
    updateData.endDate = end;
  }

  const budget = await prisma.budget.findFirst({
    where: { id, userId }
  });

  if (!budget) {
    return res.status(404).json({
      success: false,
      message: 'Budget not found'
    });
  }

  const updatedBudget = await prisma.budget.update({
    where: { id },
    data: updateData
  });

  logger.info(`Budget updated: ${id} by user ${userId}`);

  res.json({
    success: true,
    message: 'Budget updated successfully',
    data: updatedBudget
  });
}));

router.delete('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const budget = await prisma.budget.findFirst({
    where: { id, userId }
  });

  if (!budget) {
    return res.status(404).json({
      success: false,
      message: 'Budget not found'
    });
  }

  await prisma.budget.delete({
    where: { id }
  });

  logger.info(`Budget deleted: ${id} by user ${userId}`);

  res.json({
    success: true,
    message: 'Budget deleted successfully'
  });
}));

router.get('/analytics', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  const budgets = await prisma.budget.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });

  const activeBudgets = budgets.filter(budget => budget.endDate >= new Date());
  const totalBudgetAmount = activeBudgets.reduce((sum, budget) => sum + budget.amount, 0);
  const totalSpent = activeBudgets.reduce((sum, budget) => sum + budget.spent, 0);
  const totalRemaining = totalBudgetAmount - totalSpent;

  const budgetPerformance = budgets.map(budget => {
    const percentage = (budget.spent / budget.amount) * 100;
    const remaining = budget.amount - budget.spent;
    const isOverBudget = budget.spent > budget.amount;

    return {
      ...budget,
      percentage,
      remaining,
      isOverBudget,
    };
  });

  const categoryBreakdown = budgets.reduce((acc, budget) => {
    if (!acc[budget.category]) {
      acc[budget.category] = {
        totalBudget: 0,
        totalSpent: 0,
        count: 0
      };
    }
    acc[budget.category].totalBudget += budget.amount;
    acc[budget.category].totalSpent += budget.spent;
    acc[budget.category].count += 1;
    return acc;
  }, {} as Record<string, { totalBudget: number; totalSpent: number; count: number }>);

  res.json({
    success: true,
    data: {
      totalBudgets: budgets.length,
      activeBudgets: activeBudgets.length,
      totalBudgetAmount,
      totalSpent,
      totalRemaining,
      overallPercentage: totalBudgetAmount > 0 ? (totalSpent / totalBudgetAmount) * 100 : 0,
      budgetPerformance,
      categoryBreakdown: Object.entries(categoryBreakdown).map(([category, data]) => ({
        category,
        ...data,
        percentage: (data.totalSpent / data.totalBudget) * 100,
        remaining: data.totalBudget - data.totalSpent
      }))
    }
  });
}));

export { router as budgetRoutes };
