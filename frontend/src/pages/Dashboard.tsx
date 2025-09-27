import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalanceWallet,
  Savings,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useQuery } from 'react-query';
import { dashboardApi } from '../services/api';

const Dashboard: React.FC = () => {
  const { data: dashboardData, isLoading } = useQuery(
    'dashboard',
    dashboardApi.getDashboardData,
    {
      refetchInterval: 30000,
    }
  );

  if (isLoading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
  }

  const expenseData = dashboardData?.expenseChart || [];
  const categoryData = dashboardData?.categoryBreakdown || [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const StatCard = ({ title, value, change, icon, color }: any) => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h4" component="h2">
              ${value?.toLocaleString()}
            </Typography>
            <Box display="flex" alignItems="center" mt={1}>
              {change >= 0 ? (
                <TrendingUp color="success" fontSize="small" />
              ) : (
                <TrendingDown color="error" fontSize="small" />
              )}
              <Typography
                variant="body2"
                color={change >= 0 ? 'success.main' : 'error.main'}
                sx={{ ml: 0.5 }}
              >
                {Math.abs(change)}%
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              backgroundColor: color,
              borderRadius: '50%',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Balance"
            value={dashboardData?.totalBalance}
            change={5.2}
            icon={<AccountBalanceWallet color="white" />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Monthly Income"
            value={dashboardData?.monthlyIncome}
            change={2.1}
            icon={<TrendingUp color="white" />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Monthly Expenses"
            value={dashboardData?.monthlyExpenses}
            change={-1.8}
            icon={<TrendingDown color="white" />}
            color="#f44336"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Savings Rate"
            value={dashboardData?.savingsRate}
            change={3.4}
            icon={<Savings color="white" />}
            color="#ff9800"
          />
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Expense Trends
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={expenseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#1976d2"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Category Breakdown
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Transactions
            </Typography>
            <Box>
              {dashboardData?.recentTransactions?.map((transaction: any, index: number) => (
                <Box
                  key={index}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  py={1}
                  borderBottom="1px solid #f0f0f0"
                >
                  <Box>
                    <Typography variant="body1">{transaction.description}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {transaction.category} • {transaction.date}
                    </Typography>
                  </Box>
                  <Typography
                    variant="h6"
                    color={transaction.type === 'income' ? 'success.main' : 'error.main'}
                  >
                    {transaction.type === 'income' ? '+' : '-'}${transaction.amount}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
