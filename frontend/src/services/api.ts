import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-storage');
  if (token) {
    try {
      const authData = JSON.parse(token);
      if (authData.state?.token) {
        config.headers.Authorization = `Bearer ${authData.state.token}`;
      }
    } catch (error) {
      console.error('Error parsing auth token:', error);
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },
  
  register: async (userData: { name: string; email: string; password: string }) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },
  
  refreshToken: async () => {
    const response = await apiClient.post('/auth/refresh');
    return response.data;
  },
  
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },
};

export const expensesApi = {
  getExpenses: async (params?: any) => {
    const response = await apiClient.get('/expenses', { params });
    return response.data;
  },
  
  createExpense: async (expenseData: any) => {
    const response = await apiClient.post('/expenses', expenseData);
    return response.data;
  },
  
  updateExpense: async (id: string, expenseData: any) => {
    const response = await apiClient.put(`/expenses/${id}`, expenseData);
    return response.data;
  },
  
  deleteExpense: async (id: string) => {
    const response = await apiClient.delete(`/expenses/${id}`);
    return response.data;
  },
  
  getCategories: async () => {
    const response = await apiClient.get('/expenses/categories');
    return response.data;
  },
};

export const investmentsApi = {
  getInvestments: async () => {
    const response = await apiClient.get('/investments');
    return response.data;
  },
  
  createInvestment: async (investmentData: any) => {
    const response = await apiClient.post('/investments', investmentData);
    return response.data;
  },
  
  updateInvestment: async (id: string, investmentData: any) => {
    const response = await apiClient.put(`/investments/${id}`, investmentData);
    return response.data;
  },
  
  deleteInvestment: async (id: string) => {
    const response = await apiClient.delete(`/investments/${id}`);
    return response.data;
  },
  
  getPortfolioAnalytics: async () => {
    const response = await apiClient.get('/investments/analytics');
    return response.data;
  },
};

export const budgetApi = {
  getBudgets: async () => {
    const response = await apiClient.get('/budgets');
    return response.data;
  },
  
  createBudget: async (budgetData: any) => {
    const response = await apiClient.post('/budgets', budgetData);
    return response.data;
  },
  
  updateBudget: async (id: string, budgetData: any) => {
    const response = await apiClient.put(`/budgets/${id}`, budgetData);
    return response.data;
  },
  
  deleteBudget: async (id: string) => {
    const response = await apiClient.delete(`/budgets/${id}`);
    return response.data;
  },
};

export const analyticsApi = {
  getSpendingAnalytics: async (params?: any) => {
    const response = await apiClient.get('/analytics/spending', { params });
    return response.data;
  },
  
  getForecast: async (params?: any) => {
    const response = await apiClient.get('/analytics/forecast', { params });
    return response.data;
  },
  
  getFraudDetection: async (transactionData: any) => {
    const response = await apiClient.post('/analytics/fraud-detection', transactionData);
    return response.data;
  },
};

export const dashboardApi = {
  getDashboardData: async () => {
    const response = await apiClient.get('/dashboard');
    return response.data;
  },
};

export const mlApi = {
  getExpenseForecast: async (data: any) => {
    const response = await apiClient.post('/ml/forecast', data);
    return response.data;
  },
  
  detectFraud: async (transactionData: any) => {
    const response = await apiClient.post('/ml/fraud-detection', transactionData);
    return response.data;
  },
};

export default apiClient;
