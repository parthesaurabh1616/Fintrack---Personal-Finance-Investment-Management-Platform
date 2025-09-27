import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useQuery } from 'react-query';
import { analyticsApi, mlApi } from '../services/api';

const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('6months');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: spendingAnalytics, isLoading: spendingLoading } = useQuery(
    ['spending-analytics', timeRange],
    () => analyticsApi.getSpendingAnalytics({ timeRange })
  );

  const { data: forecast, isLoading: forecastLoading } = useQuery(
    ['forecast', timeRange],
    () => analyticsApi.getForecast({ timeRange }),
    {
      refetchInterval: 300000,
    }
  );

  const { data: mlForecast, isLoading: mlLoading } = useQuery(
    ['ml-forecast', timeRange],
    () => mlApi.getExpenseForecast({ timeRange, historicalData: spendingAnalytics }),
    {
      enabled: !!spendingAnalytics,
      refetchInterval: 300000,
    }
  );

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'positive': return 'success';
      case 'warning': return 'warning';
      case 'negative': return 'error';
      default: return 'info';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive': return <CheckCircle />;
      case 'warning': return <Warning />;
      case 'negative': return <TrendingDown />;
      default: return <TrendingUp />;
    }
  };

  if (spendingLoading || forecastLoading) {
    return <Typography>Loading analytics...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Analytics & Insights
      </Typography>

      <Box display="flex" gap={2} mb={3}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <MenuItem value="1month">1 Month</MenuItem>
            <MenuItem value="3months">3 Months</MenuItem>
            <MenuItem value="6months">6 Months</MenuItem>
            <MenuItem value="1year">1 Year</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={selectedCategory}
            label="Category"
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <MenuItem value="all">All Categories</MenuItem>
            <MenuItem value="food">Food</MenuItem>
            <MenuItem value="transport">Transport</MenuItem>
            <MenuItem value="entertainment">Entertainment</MenuItem>
            <MenuItem value="shopping">Shopping</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3} mb={3}>
        {spendingAnalytics?.insights?.map((insight: any, index: number) => (
          <Grid item xs={12} md={4} key={index}>
            <Alert
              severity={getInsightColor(insight.type)}
              icon={getInsightIcon(insight.type)}
              sx={{ height: '100%' }}
            >
              <Typography variant="subtitle2" gutterBottom>
                {insight.title}
              </Typography>
              <Typography variant="body2">
                {insight.description}
              </Typography>
            </Alert>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Spending Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={spendingAnalytics?.trends}>
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
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Category Breakdown
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={spendingAnalytics?.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {spendingAnalytics?.categoryBreakdown?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Comparison
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={spendingAnalytics?.monthlyComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                  <Bar dataKey="current" fill="#1976d2" />
                  <Bar dataKey="previous" fill="#757575" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Expense Forecast
              </Typography>
              {mlLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                  <Typography>Loading forecast...</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mlForecast?.forecast}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      stroke="#ff9800"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="#1976d2"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Spending Categories
              </Typography>
              {spendingAnalytics?.topCategories?.map((category: any, index: number) => (
                <Box key={index} display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Box display="flex" alignItems="center">
                    <Chip
                      label={index + 1}
                      size="small"
                      sx={{ mr: 1, backgroundColor: COLORS[index % COLORS.length], color: 'white' }}
                    />
                    <Typography variant="body1">{category.name}</Typography>
                  </Box>
                  <Typography variant="h6">${category.amount.toLocaleString()}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Financial Health Score
              </Typography>
              <Box display="flex" alignItems="center" mb={2}>
                <Typography variant="h2" color="success.main" sx={{ mr: 2 }}>
                  {spendingAnalytics?.healthScore || 85}
                </Typography>
                <Box>
                  <Typography variant="h6">Good</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Your spending patterns are healthy
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Based on your spending habits, savings rate, and budget adherence
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;
