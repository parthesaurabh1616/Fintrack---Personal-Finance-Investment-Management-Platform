import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Add,
  AccountBalanceWallet,
  Warning,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { budgetApi } from '../services/api';

const Budget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    period: 'monthly',
  });

  const queryClient = useQueryClient();

  const { data: budgets, isLoading } = useQuery(
    'budgets',
    budgetApi.getBudgets
  );

  const createMutation = useMutation(budgetApi.createBudget, {
    onSuccess: () => {
      queryClient.invalidateQueries('budgets');
      handleClose();
    },
  });

  const handleOpen = () => {
    setFormData({
      category: '',
      amount: '',
      period: 'monthly',
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const budgetData = {
      ...formData,
      amount: parseFloat(formData.amount),
    };
    createMutation.mutate(budgetData);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'error';
    if (percentage >= 75) return 'warning';
    return 'success';
  };

  if (isLoading) {
    return <Typography>Loading budgets...</Typography>;
  }

  const totalBudget = budgets?.reduce((sum: number, budget: any) => sum + budget.amount, 0) || 0;
  const totalSpent = budgets?.reduce((sum: number, budget: any) => sum + budget.spent, 0) || 0;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Budget Management</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpen}
        >
          Create Budget
        </Button>
      </Box>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Budget
              </Typography>
              <Typography variant="h4">
                ${totalBudget.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Spent
              </Typography>
              <Typography variant="h4">
                ${totalSpent.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Remaining
              </Typography>
              <Typography
                variant="h4"
                color={totalBudget - totalSpent >= 0 ? 'success.main' : 'error.main'}
              >
                ${(totalBudget - totalSpent).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {budgets?.map((budget: any) => {
          const percentage = (budget.spent / budget.amount) * 100;
          const remaining = budget.amount - budget.spent;
          
          return (
            <Grid item xs={12} md={6} key={budget.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">{budget.category}</Typography>
                    <Chip label={budget.period} size="small" variant="outlined" />
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="textSecondary">
                      ${budget.spent.toLocaleString()} of ${budget.amount.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {percentage.toFixed(1)}%
                    </Typography>
                  </Box>
                  
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(percentage, 100)}
                    color={getProgressColor(percentage)}
                    sx={{ height: 8, borderRadius: 4, mb: 2 }}
                  />
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography
                      variant="h6"
                      color={remaining >= 0 ? 'success.main' : 'error.main'}
                    >
                      ${remaining >= 0 ? 'Remaining: $' + remaining.toLocaleString() : 'Over budget by $' + Math.abs(remaining).toLocaleString()}
                    </Typography>
                    
                    {percentage >= 90 && (
                      <Box display="flex" alignItems="center" color="warning.main">
                        <Warning fontSize="small" />
                        <Typography variant="body2" sx={{ ml: 0.5 }}>
                          Warning
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {budgets?.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <AccountBalanceWallet sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No budgets created yet
            </Typography>
            <Typography variant="body2" color="textSecondary" mb={3}>
              Create your first budget to start tracking your spending
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpen}
            >
              Create Budget
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Budget</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              margin="normal"
              required
              fullWidth
              select
              label="Category"
              name="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <MenuItem value="food">Food & Dining</MenuItem>
              <MenuItem value="transport">Transportation</MenuItem>
              <MenuItem value="entertainment">Entertainment</MenuItem>
              <MenuItem value="shopping">Shopping</MenuItem>
              <MenuItem value="healthcare">Healthcare</MenuItem>
              <MenuItem value="utilities">Utilities</MenuItem>
              <MenuItem value="education">Education</MenuItem>
              <MenuItem value="travel">Travel</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Budget Amount"
              name="amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              select
              label="Period"
              name="period"
              value={formData.period}
              onChange={(e) => setFormData({ ...formData, period: e.target.value })}
            >
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isLoading}
            >
              Create Budget
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Budget;
