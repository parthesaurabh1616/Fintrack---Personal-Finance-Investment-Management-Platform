import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Fab,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { expensesApi } from '../services/api';
import { format } from 'date-fns';

const Expenses: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    date: new Date(),
    type: 'expense',
  });

  const queryClient = useQueryClient();

  const { data: expenses, isLoading } = useQuery(
    'expenses',
    expensesApi.getExpenses
  );

  const { data: categories } = useQuery(
    'categories',
    expensesApi.getCategories
  );

  const createMutation = useMutation(expensesApi.createExpense, {
    onSuccess: () => {
      queryClient.invalidateQueries('expenses');
      handleClose();
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => expensesApi.updateExpense(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('expenses');
        handleClose();
      },
    }
  );

  const deleteMutation = useMutation(expensesApi.deleteExpense, {
    onSuccess: () => {
      queryClient.invalidateQueries('expenses');
    },
  });

  const handleOpen = () => {
    setEditingExpense(null);
    setFormData({
      description: '',
      amount: '',
      category: '',
      date: new Date(),
      type: 'expense',
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingExpense(null);
  };

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      date: new Date(expense.date),
      type: expense.type,
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expenseData = {
      ...formData,
      amount: parseFloat(formData.amount),
      date: formData.date.toISOString(),
    };

    if (editingExpense) {
      updateMutation.mutate({ id: editingExpense.id, data: expenseData });
    } else {
      createMutation.mutate(expenseData);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      deleteMutation.mutate(id);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      food: '#4caf50',
      transport: '#2196f3',
      entertainment: '#ff9800',
      shopping: '#e91e63',
      healthcare: '#9c27b0',
      utilities: '#ff5722',
      other: '#607d8b',
    };
    return colors[category.toLowerCase()] || '#607d8b';
  };

  if (isLoading) {
    return <Typography>Loading expenses...</Typography>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Expenses</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpen}
        >
          Add Expense
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Description</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expenses?.map((expense: any) => (
              <TableRow key={expense.id}>
                <TableCell>{expense.description}</TableCell>
                <TableCell>
                  <Typography
                    color={expense.type === 'income' ? 'success.main' : 'error.main'}
                    fontWeight="bold"
                  >
                    {expense.type === 'income' ? '+' : '-'}${expense.amount.toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={expense.category}
                    size="small"
                    sx={{
                      backgroundColor: getCategoryColor(expense.category),
                      color: 'white',
                    }}
                  />
                </TableCell>
                <TableCell>{format(new Date(expense.date), 'MMM dd, yyyy')}</TableCell>
                <TableCell>
                  <Chip
                    label={expense.type}
                    size="small"
                    color={expense.type === 'income' ? 'success' : 'error'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(expense)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(expense.id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingExpense ? 'Edit Expense' : 'Add New Expense'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Amount"
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
              label="Category"
              name="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {categories?.map((category: string) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              margin="normal"
              required
              fullWidth
              select
              label="Type"
              name="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <MenuItem value="expense">Expense</MenuItem>
              <MenuItem value="income">Income</MenuItem>
            </TextField>
            <DatePicker
              label="Date"
              value={formData.date}
              onChange={(newValue) => setFormData({ ...formData, date: newValue || new Date() })}
              renderInput={(params) => (
                <TextField {...params} margin="normal" fullWidth />
              )}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isLoading || updateMutation.isLoading}
            >
              {editingExpense ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Expenses;
