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
  query('category').optional().isString(),
  query('type').optional().isIn(['expense', 'income']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
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

  if (req.query.category) {
    where.category = req.query.category;
  }

  if (req.query.type) {
    where.type = req.query.type.toUpperCase();
  }

  if (req.query.startDate || req.query.endDate) {
    where.date = {};
    if (req.query.startDate) {
      where.date.gte = new Date(req.query.startDate as string);
    }
    if (req.query.endDate) {
      where.date.lte = new Date(req.query.endDate as string);
    }
  }

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
      skip,
      take: limit,
      include: {
        categoryRef: {
          select: {
            id: true,
            name: true,
            color: true,
          }
        }
      }
    }),
    prisma.expense.count({ where })
  ]);

  res.json({
    success: true,
    data: expenses,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

router.post('/', authenticateToken, [
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('type').isIn(['expense', 'income']).withMessage('Type must be expense or income'),
  body('date').isISO8601().withMessage('Valid date is required'),
], asyncHandler(async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { description, amount, category, type, date } = req.body;
  const userId = req.user!.id;

  const expense = await prisma.expense.create({
    data: {
      description,
      amount,
      category,
      type: type.toUpperCase(),
      date: new Date(date),
      userId,
    },
    include: {
      categoryRef: {
        select: {
          id: true,
          name: true,
          color: true,
        }
      }
    }
  });

  logger.info(`Expense created: ${expense.id} by user ${userId}`);

  res.status(201).json({
    success: true,
    message: 'Expense created successfully',
    data: expense
  });
}));

router.put('/:id', authenticateToken, [
  body('description').optional().trim().notEmpty(),
  body('amount').optional().isFloat({ min: 0 }),
  body('category').optional().trim().notEmpty(),
  body('type').optional().isIn(['expense', 'income']),
  body('date').optional().isISO8601(),
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

  if (updateData.type) {
    updateData.type = updateData.type.toUpperCase();
  }

  if (updateData.date) {
    updateData.date = new Date(updateData.date);
  }

  const expense = await prisma.expense.findFirst({
    where: { id, userId }
  });

  if (!expense) {
    return res.status(404).json({
      success: false,
      message: 'Expense not found'
    });
  }

  const updatedExpense = await prisma.expense.update({
    where: { id },
    data: updateData,
    include: {
      categoryRef: {
        select: {
          id: true,
          name: true,
          color: true,
        }
      }
    }
  });

  logger.info(`Expense updated: ${id} by user ${userId}`);

  res.json({
    success: true,
    message: 'Expense updated successfully',
    data: updatedExpense
  });
}));

router.delete('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const expense = await prisma.expense.findFirst({
    where: { id, userId }
  });

  if (!expense) {
    return res.status(404).json({
      success: false,
      message: 'Expense not found'
    });
  }

  await prisma.expense.delete({
    where: { id }
  });

  logger.info(`Expense deleted: ${id} by user ${userId}`);

  res.json({
    success: true,
    message: 'Expense deleted successfully'
  });
}));

router.get('/categories', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const categories = await prisma.category.findMany({
    where: { userId: req.user!.id },
    select: {
      id: true,
      name: true,
      color: true,
    },
    orderBy: { name: 'asc' }
  });

  const defaultCategories = [
    'Food & Dining',
    'Transportation',
    'Entertainment',
    'Shopping',
    'Healthcare',
    'Utilities',
    'Education',
    'Travel',
    'Other'
  ];

  res.json({
    success: true,
    data: {
      custom: categories,
      default: defaultCategories
    }
  });
}));

router.post('/categories', authenticateToken, [
  body('name').trim().notEmpty().withMessage('Category name is required'),
  body('description').optional().trim(),
  body('color').optional().isHexColor().withMessage('Valid hex color is required'),
], asyncHandler(async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { name, description, color } = req.body;
  const userId = req.user!.id;

  const existingCategory = await prisma.category.findFirst({
    where: { name, userId }
  });

  if (existingCategory) {
    return res.status(400).json({
      success: false,
      message: 'Category already exists'
    });
  }

  const category = await prisma.category.create({
    data: {
      name,
      description,
      color: color || '#1976d2',
      userId,
    }
  });

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: category
  });
}));

export { router as expenseRoutes };
