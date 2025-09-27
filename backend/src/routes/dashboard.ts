import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.get('/', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [
    expenses,
    budgets,
    investments,
    monthlyIncome,
    monthlyExpenses
  ] = await Promise.all([
    prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { date: 'desc' },
      take: 10
    }),
    prisma.budget.findMany({
      where: {
        userId,
        endDate: { gte: now }
      }
    }),
    prisma.investment.findMany({
      where: { userId }
    }),
    prisma.expense.aggregate({
      where: {
        userId,
        type: 'INCOME',
        date: { gte: startOfMonth, lte: endOfMonth }
      },
      _sum: { amount: true }
    }),
    prisma.expense.aggregate({
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: startOfMonth, lte: endOfMonth }
      },
      _sum: { amount: true }
    })
  ]);

  const totalBalance = (monthlyIncome._sum.amount || 0) - (monthlyExpenses._sum.amount || 0);
  const savingsRate = monthlyIncome._sum.amount ? 
    ((monthlyIncome._sum.amount - (monthlyExpenses._sum.amount || 0)) / monthlyIncome._sum.amount) * 100 : 0;

  const expenseChart = [];
  const categoryBreakdown: Record<string, number> = {};
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    const monthExpenses = expenses.filter(e => 
      e.date >= monthStart && e.date <= monthEnd && e.type === 'EXPENSE'
    );
    
    const totalAmount = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    expenseChart.push({
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      amount: totalAmount
    });

    monthExpenses.forEach(expense => {
      if (!categoryBreakdown[expense.category]) {
        categoryBreakdown[expense.category] = 0;
      }
      categoryBreakdown[expense.category] += expense.amount;
    });
  }

  const categoryArray = Object.entries(categoryBreakdown).map(([name, value]) => ({
    name,
    value
  }));

  const recentTransactions = expenses.slice(0, 5).map(expense => ({
    description: expense.description,
    amount: expense.amount,
    category: expense.category,
    date: expense.date.toISOString().split('T')[0],
    type: expense.type.toLowerCase()
  }));

  const totalInvestmentValue = investments.reduce((sum, investment) => {
    const currentPrice = investment.currentPrice || investment.purchasePrice;
    return sum + (investment.quantity * currentPrice);
  }, 0);

  res.json({
    success: true,
    data: {
      totalBalance,
      monthlyIncome: monthlyIncome._sum.amount || 0,
      monthlyExpenses: monthlyExpenses._sum.amount || 0,
      savingsRate,
      totalInvestmentValue,
      expenseChart,
      categoryBreakdown: categoryArray,
      recentTransactions,
      budgetSummary: {
        totalBudgets: budgets.length,
        activeBudgets: budgets.filter(b => b.endDate >= now).length,
        totalBudgetAmount: budgets.reduce((sum, b) => sum + b.amount, 0),
        totalSpent: budgets.reduce((sum, b) => sum + b.spent, 0)
      }
    }
  });
}));

export { router as dashboardRoutes };
