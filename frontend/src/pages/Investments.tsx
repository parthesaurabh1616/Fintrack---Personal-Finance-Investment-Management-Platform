import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { investmentsApi } from '../services/api';

const Investments: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<any>(null);
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    type: '',
    quantity: '',
    purchasePrice: '',
    purchaseDate: new Date(),
  });

  const queryClient = useQueryClient();

  const { data: investments, isLoading } = useQuery(
    'investments',
    investmentsApi.getInvestments
  );

  const { data: analytics } = useQuery(
    'portfolio-analytics',
    investmentsApi.getPortfolioAnalytics
  );

  const createMutation = useMutation(investmentsApi.createInvestment, {
    onSuccess: () => {
      queryClient.invalidateQueries('investments');
      queryClient.invalidateQueries('portfolio-analytics');
      handleClose();
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => investmentsApi.updateInvestment(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('investments');
        queryClient.invalidateQueries('portfolio-analytics');
        handleClose();
      },
    }
  );

  const deleteMutation = useMutation(investmentsApi.deleteInvestment, {
    onSuccess: () => {
      queryClient.invalidateQueries('investments');
      queryClient.invalidateQueries('portfolio-analytics');
    },
  });

  const handleOpen = () => {
    setEditingInvestment(null);
    setFormData({
      symbol: '',
      name: '',
      type: '',
      quantity: '',
      purchasePrice: '',
      purchaseDate: new Date(),
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingInvestment(null);
  };

  const handleEdit = (investment: any) => {
    setEditingInvestment(investment);
    setFormData({
      symbol: investment.symbol,
      name: investment.name,
      type: investment.type,
      quantity: investment.quantity.toString(),
      purchasePrice: investment.purchasePrice.toString(),
      purchaseDate: new Date(investment.purchaseDate),
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const investmentData = {
      ...formData,
      quantity: parseFloat(formData.quantity),
      purchasePrice: parseFloat(formData.purchasePrice),
      purchaseDate: formData.purchaseDate.toISOString(),
    };

    if (editingInvestment) {
      updateMutation.mutate({ id: editingInvestment.id, data: investmentData });
    } else {
      createMutation.mutate(investmentData);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this investment?')) {
      deleteMutation.mutate(id);
    }
  };

  const calculateCurrentValue = (investment: any) => {
    const currentPrice = investment.currentPrice || investment.purchasePrice;
    return investment.quantity * currentPrice;
  };

  const calculateGainLoss = (investment: any) => {
    const currentValue = calculateCurrentValue(investment);
    const purchaseValue = investment.quantity * investment.purchasePrice;
    return currentValue - purchaseValue;
  };

  const getGainLossPercentage = (investment: any) => {
    const gainLoss = calculateGainLoss(investment);
    const purchaseValue = investment.quantity * investment.purchasePrice;
    return (gainLoss / purchaseValue) * 100;
  };

  if (isLoading) {
    return <Typography>Loading investments...</Typography>;
  }

  const totalValue = investments?.reduce((sum: number, inv: any) => sum + calculateCurrentValue(inv), 0) || 0;
  const totalGainLoss = investments?.reduce((sum: number, inv: any) => sum + calculateGainLoss(inv), 0) || 0;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Investment Portfolio</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpen}
        >
          Add Investment
        </Button>
      </Box>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Portfolio Value
              </Typography>
              <Typography variant="h4">
                ${totalValue.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Gain/Loss
              </Typography>
              <Typography
                variant="h4"
                color={totalGainLoss >= 0 ? 'success.main' : 'error.main'}
              >
                {totalGainLoss >= 0 ? '+' : ''}${totalGainLoss.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Portfolio Performance
              </Typography>
              <Typography variant="h4">
                {((totalGainLoss / (totalValue - totalGainLoss)) * 100).toFixed(2)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {analytics && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Portfolio Performance
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.performanceChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Value']} />
                    <Line
                      type="monotone"
                      dataKey="value"
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
                  Asset Allocation
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.assetAllocation}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.assetAllocation.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Symbol</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Purchase Price</TableCell>
              <TableCell>Current Price</TableCell>
              <TableCell>Current Value</TableCell>
              <TableCell>Gain/Loss</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {investments?.map((investment: any) => {
              const currentValue = calculateCurrentValue(investment);
              const gainLoss = calculateGainLoss(investment);
              const gainLossPercentage = getGainLossPercentage(investment);
              
              return (
                <TableRow key={investment.id}>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {investment.symbol}
                    </Typography>
                  </TableCell>
                  <TableCell>{investment.name}</TableCell>
                  <TableCell>
                    <Chip label={investment.type} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{investment.quantity}</TableCell>
                  <TableCell>${investment.purchasePrice.toFixed(2)}</TableCell>
                  <TableCell>${(investment.currentPrice || investment.purchasePrice).toFixed(2)}</TableCell>
                  <TableCell>${currentValue.toFixed(2)}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      {gainLoss >= 0 ? (
                        <TrendingUp color="success" fontSize="small" />
                      ) : (
                        <TrendingDown color="error" fontSize="small" />
                      )}
                      <Typography
                        variant="body2"
                        color={gainLoss >= 0 ? 'success.main' : 'error.main'}
                        sx={{ ml: 0.5 }}
                      >
                        {gainLoss >= 0 ? '+' : ''}${gainLoss.toFixed(2)} ({gainLossPercentage.toFixed(2)}%)
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEdit(investment)}>
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(investment.id)}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingInvestment ? 'Edit Investment' : 'Add New Investment'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Symbol"
              name="symbol"
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
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
              <MenuItem value="stock">Stock</MenuItem>
              <MenuItem value="bond">Bond</MenuItem>
              <MenuItem value="etf">ETF</MenuItem>
              <MenuItem value="crypto">Cryptocurrency</MenuItem>
              <MenuItem value="mutual-fund">Mutual Fund</MenuItem>
            </TextField>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Quantity"
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Purchase Price"
              name="purchasePrice"
              type="number"
              value={formData.purchasePrice}
              onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isLoading || updateMutation.isLoading}
            >
              {editingInvestment ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Investments;
