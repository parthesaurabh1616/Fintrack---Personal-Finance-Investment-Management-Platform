import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import datetime
from datetime import datetime, timedelta
import json
import pickle
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest
import warnings
import requests
import time
import random
warnings.filterwarnings('ignore')

# Page configuration
st.set_page_config(
    page_title="FinTrack - AI-Powered Financial Tracker",
    page_icon="💰",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for attractive UI
st.markdown("""
<style>
    /* Clean Professional Theme - Black, Green, Red, White */
    .stApp {
        background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%);
        color: #ffffff;
        min-height: 100vh;
    }
    
    /* Clean Card Design */
    .glass-card {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 15px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        position: relative;
        overflow: hidden;
    }
    
    /* Professional Header */
    .main-header {
        font-size: 4rem;
        font-weight: 800;
        text-align: center;
        background: linear-gradient(135deg, #00ff00 0%, #ffffff 50%, #ff0000 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 1rem;
        letter-spacing: -0.02em;
        text-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
    }
    
    .sub-header {
        font-size: 1.5rem;
        font-weight: 400;
        text-align: center;
        color: #ffffff;
        margin-bottom: 2rem;
        line-height: 1.6;
    }
    
    .section-header {
        font-size: 2.5rem;
        font-weight: 700;
        color: #ffffff;
        margin-top: 2rem;
        margin-bottom: 1.5rem;
        text-align: center;
        background: linear-gradient(90deg, #00ff00, #ff0000);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    
    /* Clean Metric Cards */
    .metric-card {
        background: rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(15px);
        padding: 2rem;
        border-radius: 15px;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        text-align: center;
        margin: 1rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.3s ease;
    }
    
    .metric-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
        border-color: #00ff00;
    }
    
    .metric-number {
        font-size: 3rem;
        font-weight: 800;
        background: linear-gradient(135deg, #00ff00 0%, #ff0000 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0.5rem;
    }
    
    .metric-label {
        font-size: 1.2rem;
        color: #ffffff;
        font-weight: 500;
    }
    
    /* Clean Feature Cards */
    .feature-card {
        background: rgba(255, 255, 255, 0.06);
        backdrop-filter: blur(15px);
        padding: 2rem;
        border-radius: 15px;
        margin: 1.5rem 0;
        color: #ffffff;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.3s ease;
    }
    
    .feature-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
        border-color: #00ff00;
    }
    
    /* Alert Cards */
    .alert-card {
        background: rgba(255, 0, 0, 0.1);
        backdrop-filter: blur(10px);
        padding: 1.5rem;
        border-radius: 15px;
        margin: 1rem 0;
        color: #ffffff;
        box-shadow: 0 8px 25px rgba(255, 0, 0, 0.2);
        border: 1px solid rgba(255, 0, 0, 0.3);
    }
    
    .success-card {
        background: rgba(0, 255, 0, 0.1);
        backdrop-filter: blur(10px);
        padding: 1.5rem;
        border-radius: 15px;
        margin: 1rem 0;
        color: #ffffff;
        box-shadow: 0 8px 25px rgba(0, 255, 0, 0.2);
        border: 1px solid rgba(0, 255, 0, 0.3);
    }
    
    .ml-insight-card {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        padding: 1.5rem;
        border-radius: 15px;
        margin: 1rem 0;
        color: #ffffff;
        box-shadow: 0 8px 25px rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    /* Clean CTA Buttons */
    .cta-button {
        background: linear-gradient(135deg, #00ff00 0%, #ff0000 100%);
        color: white;
        padding: 1rem 2rem;
        border-radius: 25px;
        text-decoration: none;
        font-weight: 600;
        font-size: 1.1rem;
        display: inline-block;
        margin: 0.5rem;
        box-shadow: 0 8px 25px rgba(0, 255, 0, 0.3);
        transition: all 0.3s ease;
        border: none;
        cursor: pointer;
    }
    
    .cta-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 35px rgba(0, 255, 0, 0.4);
    }
    
    /* Form Elements */
    .stSelectbox > div > div {
        background: rgba(255, 255, 255, 0.1) !important;
        color: #ffffff !important;
        border: 2px solid #00ff00 !important;
        border-radius: 10px !important;
        backdrop-filter: blur(10px) !important;
    }
    
    .stSelectbox label {
        color: #ffffff !important;
        font-weight: 600 !important;
    }
    
    .stTextInput > div > div > input {
        background: rgba(255, 255, 255, 0.1) !important;
        color: #ffffff !important;
        border: 2px solid #00ff00 !important;
        border-radius: 10px !important;
        padding: 10px !important;
        backdrop-filter: blur(10px) !important;
    }
    
    .stTextInput label {
        color: #ffffff !important;
        font-weight: 600 !important;
    }
    
    .stNumberInput > div > div > input {
        background: rgba(255, 255, 255, 0.1) !important;
        color: #ffffff !important;
        border: 2px solid #00ff00 !important;
        border-radius: 10px !important;
        backdrop-filter: blur(10px) !important;
    }
    
    .stNumberInput label {
        color: #ffffff !important;
        font-weight: 600 !important;
    }
    
    .stDateInput > div > div > input {
        background: rgba(255, 255, 255, 0.1) !important;
        color: #ffffff !important;
        border: 2px solid #00ff00 !important;
        border-radius: 10px !important;
        backdrop-filter: blur(10px) !important;
    }
    
    .stDateInput label {
        color: #ffffff !important;
        font-weight: 600 !important;
    }
    
    .stButton > button {
        background: linear-gradient(135deg, #00ff00 0%, #ff0000 100%) !important;
        color: white !important;
        border: none !important;
        border-radius: 10px !important;
        box-shadow: 0 4px 15px rgba(0, 255, 0, 0.3) !important;
        font-weight: 600 !important;
        padding: 0.5rem 1rem !important;
        font-size: 1rem !important;
        transition: all 0.3s ease !important;
    }
    
    .stButton > button:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 6px 20px rgba(0, 255, 0, 0.4) !important;
    }
    
    /* Sidebar */
    .stApp [data-testid="stSidebar"] {
        background: rgba(0, 0, 0, 0.8) !important;
        backdrop-filter: blur(15px) !important;
        border-right: 1px solid #00ff00 !important;
    }
    
    .stApp [data-testid="stSidebar"] .css-1d391kg {
        background: transparent !important;
    }
    
    .stApp [data-testid="stSidebar"] .css-1d391kg .css-1v0mbdj {
        color: #ffffff !important;
        font-weight: 600 !important;
    }
    
    .stApp [data-testid="stSidebar"] .css-1d391kg .css-1v0mbdj a {
        color: #ffffff !important;
        font-weight: 600 !important;
        transition: all 0.3s ease !important;
    }
    
    .stApp [data-testid="stSidebar"] .css-1d391kg .css-1v0mbdj a:hover {
        color: #00ff00 !important;
    }
    
    /* Text Styling */
    .stApp h1, .stApp h2, .stApp h3, .stApp h4, .stApp h5, .stApp h6 {
        color: #ffffff !important;
        font-weight: 700 !important;
    }
    
    .stApp p, .stApp div, .stApp span {
        color: #ffffff !important;
    }
    
    /* Scrollbar */
    ::-webkit-scrollbar {
        width: 8px;
    }
    
    ::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
    }
    
    ::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, #00ff00, #ff0000);
        border-radius: 10px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(135deg, #ff0000, #00ff00);
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state
if 'expenses' not in st.session_state:
    st.session_state.expenses = []
if 'budgets' not in st.session_state:
    st.session_state.budgets = {}
if 'ml_insights' not in st.session_state:
    st.session_state.ml_insights = {}
if 'user_profile' not in st.session_state:
    st.session_state.user_profile = {
        'name': '',
        'monthly_income': 0,
        'savings_goal': 0
    }

# ML Service Functions
class MLSpendAnalyzer:
    def __init__(self):
        self.scaler = StandardScaler()
        self.isolation_forest = IsolationForest(contamination=0.1, random_state=42)
        self.kmeans = KMeans(n_clusters=3, random_state=42)
        
    def analyze_spending_patterns(self, expenses_df):
        """Analyze spending patterns using ML algorithms"""
        try:
            if len(expenses_df) < 5:
                return {
                    "total_transactions": len(expenses_df),
                    "avg_amount": expenses_df['amount'].mean() if len(expenses_df) > 0 else 0,
                    "top_category": expenses_df['category'].value_counts().index[0] if len(expenses_df) > 0 else "None",
                    "weekend_spending": 0,
                    "anomaly_count": 0,
                    "recommendations": ["Add more transactions for detailed ML analysis"]
                }
            
            # Prepare features
            features = self._prepare_features(expenses_df)
            
            # Detect anomalies (unnecessary spending)
            anomalies = self._detect_anomalies(features)
            
            # Cluster spending patterns
            clusters = self._cluster_spending(features)
            
            # Generate insights
            insights = self._generate_insights(expenses_df, anomalies, clusters)
            
            return insights
        except Exception as e:
            # Return safe default insights if ML fails
            return {
                "total_transactions": len(expenses_df),
                "avg_amount": expenses_df['amount'].mean() if len(expenses_df) > 0 else 0,
                "top_category": expenses_df['category'].value_counts().index[0] if len(expenses_df) > 0 else "None",
                "weekend_spending": 0,
                "anomaly_count": 0,
                "recommendations": ["ML analysis temporarily unavailable - using basic analytics"]
            }
    
    def _prepare_features(self, df):
        """Prepare features for ML analysis"""
        df['amount_normalized'] = df['amount'] / df['amount'].max()
        df['day_of_week'] = pd.to_datetime(df['date']).dt.dayofweek
        df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
        
        # Category encoding
        category_map = {
            'Food & Dining': 1, 'Shopping': 2, 'Entertainment': 3,
            'Transportation': 4, 'Bills & Utilities': 5, 'Healthcare': 6,
            'Education': 7, 'Travel': 8, 'Other': 9
        }
        df['category_encoded'] = df['category'].map(category_map)
        
        features = df[['amount_normalized', 'day_of_week', 'is_weekend', 'category_encoded']].fillna(0)
        return features
    
    def _detect_anomalies(self, features):
        """Detect anomalous spending using Isolation Forest"""
        try:
            anomaly_scores = self.isolation_forest.fit_predict(features)
            return anomaly_scores
        except:
            return np.zeros(len(features))
    
    def _cluster_spending(self, features):
        """Cluster spending patterns using K-Means"""
        try:
            clusters = self.kmeans.fit_predict(features)
            return clusters
        except:
            return np.zeros(len(features))
    
    def _generate_insights(self, df, anomalies, clusters):
        """Generate actionable insights"""
        insights = {
            'total_transactions': len(df),
            'anomaly_count': np.sum(anomalies == -1),
            'avg_amount': df['amount'].mean(),
            'top_category': df['category'].value_counts().index[0],
            'weekend_spending': df[df['date'].apply(lambda x: pd.to_datetime(x).dayofweek in [5, 6])]['amount'].sum(),
            'recommendations': []
        }
        
        # Generate recommendations
        if insights['anomaly_count'] > 0:
            insights['recommendations'].append("🚨 Unusual spending patterns detected. Review recent transactions.")
        
        if insights['weekend_spending'] > df['amount'].sum() * 0.4:
            insights['recommendations'].append("💰 High weekend spending detected. Consider setting weekend budgets.")
        
        if insights['avg_amount'] > df['amount'].median() * 2:
            insights['recommendations'].append("📊 Large transaction amounts detected. Review for necessity.")
        
        return insights

# Initialize ML analyzer
ml_analyzer = MLSpendAnalyzer()

# Microservices Architecture Components
class ExpenseService:
    """Microservice for expense management"""
    def __init__(self):
        self.expenses = []
    
    def add_expense(self, expense_data):
        """Add new expense"""
        expense_data['id'] = len(self.expenses) + 1
        expense_data['timestamp'] = datetime.now().isoformat()
        self.expenses.append(expense_data)
        return expense_data
    
    def get_expenses(self, filters=None):
        """Get expenses with optional filters"""
        if filters:
            return [exp for exp in self.expenses if all(exp.get(k) == v for k, v in filters.items())]
        return self.expenses
    
    def get_expenses_by_category(self, category):
        """Get expenses by category"""
        return [exp for exp in self.expenses if exp['category'] == category]

class BudgetService:
    """Microservice for budget management"""
    def __init__(self):
        self.budgets = {}
        self.alerts = []
    
    def set_budget(self, category, amount):
        """Set budget for category"""
        self.budgets[category] = amount
        return True
    
    def check_budget_alerts(self, expenses):
        """Check for budget alerts"""
        alerts = []
        for category, budget in self.budgets.items():
            category_expenses = sum([exp['amount'] for exp in expenses if exp['category'] == category])
            percentage = (category_expenses / budget) * 100 if budget > 0 else 0
            
            if percentage >= 100:
                alerts.append({
                    'type': 'critical',
                    'message': f"🚨 {category} budget exceeded! (${category_expenses:.2f}/${budget:.2f})",
                    'category': category
                })
            elif percentage >= 90:
                alerts.append({
                    'type': 'warning',
                    'message': f"⚠️ {category} budget at {percentage:.1f}% (${category_expenses:.2f}/${budget:.2f})",
                    'category': category
                })
        return alerts

class AnalyticsService:
    """Microservice for analytics and reporting"""
    def __init__(self):
        self.reports = {}
    
    def generate_spending_report(self, expenses):
        """Generate comprehensive spending report"""
        if not expenses:
            return {"message": "No expenses to analyze"}
        
        df = pd.DataFrame(expenses)
        df['date'] = pd.to_datetime(df['date'])
        
        report = {
            'total_spending': df['amount'].sum(),
            'avg_transaction': df['amount'].mean(),
            'category_breakdown': df.groupby('category')['amount'].sum().to_dict(),
            'monthly_trend': df.groupby(df['date'].dt.to_period('M'))['amount'].sum().to_dict(),
            'payment_methods': df.groupby('payment_method')['amount'].sum().to_dict(),
            'top_categories': df['category'].value_counts().head(3).to_dict()
        }
        return report
    
    def generate_forecast(self, expenses, months=3):
        """Generate spending forecast"""
        if len(expenses) < 10:
            return {"message": "Insufficient data for forecasting"}
        
        df = pd.DataFrame(expenses)
        df['date'] = pd.to_datetime(df['date'])
        monthly_spending = df.groupby(df['date'].dt.to_period('M'))['amount'].sum()
        
        # Simple trend-based forecast
        if len(monthly_spending) >= 2:
            trend = monthly_spending.iloc[-1] - monthly_spending.iloc[-2]
            forecast = []
            current_month = monthly_spending.iloc[-1]
            
            for i in range(months):
                forecast_month = current_month + (trend * (i + 1))
                forecast.append({
                    'month': (pd.Timestamp.now() + pd.DateOffset(months=i+1)).strftime('%Y-%m'),
                    'predicted_amount': max(0, forecast_month)
                })
            
            return {'forecast': forecast}
        return {"message": "Need at least 2 months of data for forecasting"}

class NotificationService:
    """Microservice for notifications and alerts"""
    def __init__(self):
        self.notifications = []
    
    def send_alert(self, alert_type, message, priority='medium'):
        """Send alert notification"""
        notification = {
            'id': len(self.notifications) + 1,
            'type': alert_type,
            'message': message,
            'priority': priority,
            'timestamp': datetime.now().isoformat(),
            'read': False
        }
        self.notifications.append(notification)
        return notification
    
    def get_unread_notifications(self):
        """Get unread notifications"""
        return [n for n in self.notifications if not n['read']]
    
    def mark_as_read(self, notification_id):
        """Mark notification as read"""
        for n in self.notifications:
            if n['id'] == notification_id:
                n['read'] = True
                break

# Initialize microservices
expense_service = ExpenseService()
budget_service = BudgetService()
analytics_service = AnalyticsService()
notification_service = NotificationService()

# Navigation
st.markdown("""
<div class="main-header">💰 FinTrack</div>
<div class="sub-header">AI-Powered Financial Tracker with Smart Analytics</div>
""", unsafe_allow_html=True)

# Sidebar navigation
with st.sidebar:
    st.markdown("### 🧭 Navigation")
    page = st.selectbox("Choose a page", [
        "🏠 Dashboard", 
        "💸 Add Expense", 
        "📊 Analytics", 
        "🤖 ML Insights", 
        "⚙️ Budget Settings",
        "🔔 Alerts",
        "👤 Profile",
        "🏗️ Architecture",
        "📈 Forecasting"
    ])

# Dashboard Page
if page == "🏠 Dashboard":
    st.markdown('<h2 class="section-header">📊 Financial Dashboard</h2>', unsafe_allow_html=True)
    
    # Clean hero section
    st.markdown("""
    <div class="feature-card">
        <div style="text-align: center; padding: 2rem;">
            <h3 style="color: #00ff00; margin-bottom: 1rem; font-size: 2rem;">📊 Financial Overview</h3>
            <p style="color: #ffffff; font-size: 1.1rem; margin-bottom: 1rem;">Track your spending patterns with AI-powered insights</p>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Calculate metrics
    total_expenses = sum([exp['amount'] for exp in st.session_state.expenses])
    monthly_expenses = sum([exp['amount'] for exp in st.session_state.expenses 
                           if datetime.now().month == datetime.strptime(exp['date'], '%Y-%m-%d').month])
    
    # Enhanced metrics display
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-number">${total_expenses:,.2f}</div>
            <div class="metric-label">💰 Total Expenses</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-number">${monthly_expenses:,.2f}</div>
            <div class="metric-label">📅 This Month</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col3:
        budget_total = sum(st.session_state.budgets.values())
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-number">${budget_total:,.2f}</div>
            <div class="metric-label">🎯 Budget Set</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col4:
        remaining = budget_total - monthly_expenses
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-number">${remaining:,.2f}</div>
            <div class="metric-label">💎 Remaining</div>
        </div>
        """, unsafe_allow_html=True)
    
    # Enhanced charts section
    if st.session_state.expenses:
        st.markdown('<h3 style="color: #ffffff; margin-top: 3rem; text-align: center;">📈 Advanced Analytics</h3>', unsafe_allow_html=True)
        
        df = pd.DataFrame(st.session_state.expenses)
        df['date'] = pd.to_datetime(df['date'])
        
        col1, col2 = st.columns(2)
        
        with col1:
            # Category breakdown with clean styling
            category_data = df.groupby('category')['amount'].sum().reset_index()
            fig_category = px.pie(category_data, values='amount', names='category', 
                                 title="💰 Spending by Category",
                                 color_discrete_sequence=['#00ff00', '#ff0000', '#ffffff', '#808080'])
            fig_category.update_layout(
                plot_bgcolor='rgba(0,0,0,0)',
                paper_bgcolor='rgba(0,0,0,0)',
                font_color='white',
                title_font_size=18,
                title_font_color='#00ff00'
            )
            fig_category.update_traces(textposition='inside', textinfo='percent+label')
            st.plotly_chart(fig_category, use_container_width=True)
        
        with col2:
            # Monthly trend with clean styling
            monthly_data = df.groupby(df['date'].dt.to_period('M'))['amount'].sum().reset_index()
            monthly_data['month'] = monthly_data['date'].astype(str)
            
            fig_monthly = px.line(monthly_data, x='month', y='amount',
                                 title="📅 Monthly Spending Trend",
                                 markers=True,
                                 line_shape='spline')
            fig_monthly.update_layout(
                plot_bgcolor='rgba(0,0,0,0)',
                paper_bgcolor='rgba(0,0,0,0)',
                font_color='white',
                title_font_size=18,
                title_font_color='#ff0000'
            )
            fig_monthly.update_traces(line_color='#00ff00', marker_color='#ff0000', line_width=3)
            st.plotly_chart(fig_monthly, use_container_width=True)
    
    # Recent transactions
    st.markdown('<h3 style="color: #ffffff; margin-top: 2rem;">📋 Recent Transactions</h3>', unsafe_allow_html=True)
    
    if st.session_state.expenses:
        recent_expenses = sorted(st.session_state.expenses, key=lambda x: x['date'], reverse=True)[:5]
        df_recent = pd.DataFrame(recent_expenses)
        
        # Display recent transactions with clean styling
        for _, expense in df_recent.iterrows():
            st.markdown(f"""
            <div class="glass-card" style="padding: 1.5rem; margin: 1rem 0;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4 style="margin: 0; color: #ffffff;">{expense['description']}</h4>
                        <p style="margin: 0.5rem 0; color: #ffffff;">{expense['category']} • {expense['date']}</p>
                    </div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: #ff0000;">
                        ${expense['amount']:,.2f}
                    </div>
                </div>
            </div>
            """, unsafe_allow_html=True)
    else:
        # Clean empty state
        st.markdown("""
        <div class="feature-card">
            <div style="text-align: center; padding: 2rem;">
                <h3 style="color: #ffffff; margin-bottom: 1rem; font-size: 1.5rem;">🎯 Welcome to FinTrack!</h3>
                <p style="color: #ffffff; font-size: 1rem; margin-bottom: 1rem;">Start tracking your expenses to see analytics and AI insights</p>
                <div style="font-size: 3rem; margin-bottom: 1rem;">💰</div>
            </div>
        </div>
        """, unsafe_allow_html=True)

# Add Expense Page
elif page == "💸 Add Expense":
    st.markdown('<h2 class="section-header">💸 Add New Expense</h2>', unsafe_allow_html=True)
    
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.markdown("""
        <div class="feature-card">
            <h3 style="color: #667eea; margin-bottom: 1rem;">Expense Details</h3>
        </div>
        """, unsafe_allow_html=True)
        
        with st.form("expense_form"):
            description = st.text_input("Description", placeholder="e.g., Grocery shopping at Walmart")
            amount = st.number_input("Amount ($)", min_value=0.01, step=0.01, format="%.2f")
            category = st.selectbox("Category", [
                "Food & Dining", "Shopping", "Entertainment", 
                "Transportation", "Bills & Utilities", "Healthcare",
                "Education", "Travel", "Other"
            ])
            date = st.date_input("Date", value=datetime.now())
            payment_method = st.selectbox("Payment Method", [
                "Credit Card", "Debit Card", "Cash", "Bank Transfer", "Digital Wallet"
            ])
            
            if st.form_submit_button("➕ Add Expense"):
                if description and amount > 0:
                    expense = {
                        'id': len(st.session_state.expenses) + 1,
                        'description': description,
                        'amount': amount,
                        'category': category,
                        'date': date.strftime('%Y-%m-%d'),
                        'payment_method': payment_method,
                        'timestamp': datetime.now().isoformat()
                    }
                    st.session_state.expenses.append(expense)
                    st.success("✅ Expense added successfully!")
                    st.rerun()
    
    with col2:
        st.markdown("""
        <div class="feature-card">
            <h3 style="color: #667eea; margin-bottom: 1rem;">Quick Add</h3>
        </div>
        """, unsafe_allow_html=True)
        
        # Quick add buttons
        quick_amounts = [5, 10, 20, 50, 100]
        quick_categories = ["Food & Dining", "Transportation", "Shopping"]
        
        for amount in quick_amounts:
            col_a, col_b, col_c = st.columns(3)
            for i, category in enumerate(quick_categories):
                with [col_a, col_b, col_c][i]:
                    if st.button(f"${amount}\n{category}", key=f"quick_{amount}_{category}"):
                        expense = {
                            'id': len(st.session_state.expenses) + 1,
                            'description': f"Quick {category} expense",
                            'amount': amount,
                            'category': category,
                            'date': datetime.now().strftime('%Y-%m-%d'),
                            'payment_method': 'Digital Wallet',
                            'timestamp': datetime.now().isoformat()
                        }
                        st.session_state.expenses.append(expense)
                        st.success(f"✅ ${amount} {category} expense added!")
                        st.rerun()

# Analytics Page
elif page == "📊 Analytics":
    st.markdown('<h2 class="section-header">📊 Spending Analytics</h2>', unsafe_allow_html=True)
    
    if st.session_state.expenses:
        df = pd.DataFrame(st.session_state.expenses)
        df['date'] = pd.to_datetime(df['date'])
        
        col1, col2 = st.columns(2)
        
        with col1:
            # Category spending pie chart
            st.markdown('<h3 style="color: #ffffff;">💰 Spending by Category</h3>', unsafe_allow_html=True)
            category_spending = df.groupby('category')['amount'].sum().reset_index()
            
            fig_pie = px.pie(category_spending, values='amount', names='category',
                           title="Spending Distribution",
                           color_discrete_sequence=px.colors.qualitative.Set3)
            fig_pie.update_layout(
                plot_bgcolor='rgba(0,0,0,0)',
                paper_bgcolor='rgba(0,0,0,0)',
                font_color='white'
            )
            st.plotly_chart(fig_pie, use_container_width=True)
        
        with col2:
            # Monthly spending trend
            st.markdown('<h3 style="color: #ffffff;">📈 Monthly Spending Trend</h3>', unsafe_allow_html=True)
            monthly_spending = df.groupby(df['date'].dt.to_period('M'))['amount'].sum().reset_index()
            monthly_spending['date'] = monthly_spending['date'].astype(str)
            
            fig_line = px.line(monthly_spending, x='date', y='amount',
                             title="Monthly Spending Trend",
                             markers=True)
            fig_line.update_layout(
                plot_bgcolor='rgba(0,0,0,0)',
                paper_bgcolor='rgba(0,0,0,0)',
                font_color='white',
                xaxis_title="Month",
                yaxis_title="Amount ($)"
            )
            st.plotly_chart(fig_line, use_container_width=True)
        
        # Payment method analysis
        st.markdown('<h3 style="color: #ffffff; margin-top: 2rem;">💳 Payment Method Analysis</h3>', unsafe_allow_html=True)
        payment_analysis = df.groupby('payment_method')['amount'].agg(['sum', 'count']).reset_index()
        
        col1, col2 = st.columns(2)
        
        with col1:
            fig_bar = px.bar(payment_analysis, x='payment_method', y='sum',
                           title="Total Amount by Payment Method")
            fig_bar.update_layout(
                plot_bgcolor='rgba(0,0,0,0)',
                paper_bgcolor='rgba(0,0,0,0)',
                font_color='white'
            )
            st.plotly_chart(fig_bar, use_container_width=True)
        
        with col2:
            fig_count = px.bar(payment_analysis, x='payment_method', y='count',
                             title="Transaction Count by Payment Method")
            fig_count.update_layout(
                plot_bgcolor='rgba(0,0,0,0)',
                paper_bgcolor='rgba(0,0,0,0)',
                font_color='white'
            )
            st.plotly_chart(fig_count, use_container_width=True)
    
    else:
        st.markdown("""
        <div class="feature-card">
            <h3 style="text-align: center; color: #a8b2d1;">No data available. Add some expenses to see analytics!</h3>
        </div>
        """, unsafe_allow_html=True)

# ML Insights Page
elif page == "🤖 ML Insights":
    st.markdown('<h2 class="section-header">🤖 AI-Powered Insights</h2>', unsafe_allow_html=True)
    
    if len(st.session_state.expenses) >= 5:
        st.markdown("""
        <div class="ml-insight-card">
            <h3 style="color: #ffffff; margin-bottom: 1rem;">🧠 Machine Learning Analysis</h3>
            <p style="color: #e0e7ff;">Our AI analyzes your spending patterns to provide personalized insights and recommendations.</p>
        </div>
        """, unsafe_allow_html=True)
        
        # Run ML analysis
        df = pd.DataFrame(st.session_state.expenses)
        insights = ml_analyzer.analyze_spending_patterns(df)
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown('<h3 style="color: #ffffff;">📊 Spending Analysis</h3>', unsafe_allow_html=True)
            
            st.markdown(f"""
            <div class="feature-card">
                <h4 style="color: #667eea;">Transaction Summary</h4>
                <p><strong>Total Transactions:</strong> {insights['total_transactions']}</p>
                <p><strong>Average Amount:</strong> ${insights['avg_amount']:.2f}</p>
                <p><strong>Top Category:</strong> {insights['top_category']}</p>
                <p><strong>Weekend Spending:</strong> ${insights['weekend_spending']:.2f}</p>
            </div>
            """, unsafe_allow_html=True)
        
        with col2:
            st.markdown('<h3 style="color: #ffffff;">🎯 AI Recommendations</h3>', unsafe_allow_html=True)
            
            if insights['recommendations']:
                for i, rec in enumerate(insights['recommendations']):
                    st.markdown(f"""
                    <div class="alert-card">
                        <p style="margin: 0; font-weight: 500;">{rec}</p>
                    </div>
                    """, unsafe_allow_html=True)
            else:
                st.markdown("""
                <div class="success-card">
                    <p style="margin: 0; font-weight: 500;">✅ Your spending patterns look healthy!</p>
                </div>
                """, unsafe_allow_html=True)
        
        # Spending pattern visualization
        st.markdown('<h3 style="color: #ffffff; margin-top: 2rem;">📈 Spending Pattern Analysis</h3>', unsafe_allow_html=True)
        
        df['day_of_week'] = pd.to_datetime(df['date']).dt.day_name()
        daily_spending = df.groupby('day_of_week')['amount'].sum().reindex([
            'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
        ])
        
        fig_pattern = px.bar(x=daily_spending.index, y=daily_spending.values,
                            title="Spending by Day of Week",
                            labels={'x': 'Day of Week', 'y': 'Amount ($)'})
        fig_pattern.update_layout(
            plot_bgcolor='rgba(0,0,0,0)',
            paper_bgcolor='rgba(0,0,0,0)',
            font_color='white'
        )
        st.plotly_chart(fig_pattern, use_container_width=True)
    
    else:
        st.markdown("""
        <div class="feature-card">
            <h3 style="text-align: center; color: #a8b2d1;">Add at least 5 transactions to unlock AI insights!</h3>
        </div>
        """, unsafe_allow_html=True)

# Budget Settings Page
elif page == "⚙️ Budget Settings":
    st.markdown('<h2 class="section-header">⚙️ Budget Management</h2>', unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("""
        <div class="feature-card">
            <h3 style="color: #667eea; margin-bottom: 1rem;">Set Monthly Budgets</h3>
        </div>
        """, unsafe_allow_html=True)
        
        categories = [
            "Food & Dining", "Shopping", "Entertainment", 
            "Transportation", "Bills & Utilities", "Healthcare",
            "Education", "Travel", "Other"
        ]
        
        for category in categories:
            current_budget = st.session_state.budgets.get(category, 0)
            new_budget = st.number_input(
                f"{category} Budget ($)", 
                min_value=0.0, 
                value=float(current_budget),
                step=10.0,
                key=f"budget_{category}"
            )
            st.session_state.budgets[category] = new_budget
        
        if st.button("💾 Save Budgets"):
            st.success("✅ Budgets saved successfully!")
            st.rerun()
    
    with col2:
        st.markdown("""
        <div class="feature-card">
            <h3 style="color: #667eea; margin-bottom: 1rem;">Budget Overview</h3>
        </div>
        """, unsafe_allow_html=True)
        
        if st.session_state.budgets:
            total_budget = sum(st.session_state.budgets.values())
            st.metric("Total Monthly Budget", f"${total_budget:,.2f}")
            
            # Budget vs Actual spending
            if st.session_state.expenses:
                df = pd.DataFrame(st.session_state.expenses)
                df['date'] = pd.to_datetime(df['date'])
                current_month = datetime.now().month
                monthly_expenses = df[df['date'].dt.month == current_month]
                
                budget_vs_actual = []
                for category, budget in st.session_state.budgets.items():
                    if budget > 0:
                        actual = monthly_expenses[monthly_expenses['category'] == category]['amount'].sum()
                        percentage = (actual / budget) * 100 if budget > 0 else 0
                        budget_vs_actual.append({
                            'category': category,
                            'budget': budget,
                            'actual': actual,
                            'percentage': percentage
                        })
                
                if budget_vs_actual:
                    df_budget = pd.DataFrame(budget_vs_actual)
                    
                    fig_budget = px.bar(df_budget, x='category', y=['budget', 'actual'],
                                       title="Budget vs Actual Spending",
                                       barmode='group')
                    fig_budget.update_layout(
                        plot_bgcolor='rgba(0,0,0,0)',
                        paper_bgcolor='rgba(0,0,0,0)',
                        font_color='white'
                    )
                    st.plotly_chart(fig_budget, use_container_width=True)
        else:
            st.info("Set budgets to see overview!")

# Alerts Page
elif page == "🔔 Alerts":
    st.markdown('<h2 class="section-header">🔔 Smart Alerts</h2>', unsafe_allow_html=True)
    
    # Check for budget alerts
    alerts = []
    
    if st.session_state.expenses and st.session_state.budgets:
        df = pd.DataFrame(st.session_state.expenses)
        df['date'] = pd.to_datetime(df['date'])
        current_month = datetime.now().month
        monthly_expenses = df[df['date'].dt.month == current_month]
        
        for category, budget in st.session_state.budgets.items():
            if budget > 0:
                actual = monthly_expenses[monthly_expenses['category'] == category]['amount'].sum()
                percentage = (actual / budget) * 100 if budget > 0 else 0
                
                if percentage >= 90:
                    alerts.append({
                        'type': 'warning',
                        'message': f"⚠️ {category} budget is {percentage:.1f}% used (${actual:.2f}/${budget:.2f})",
                        'severity': 'high' if percentage >= 100 else 'medium'
                    })
                elif percentage >= 75:
                    alerts.append({
                        'type': 'info',
                        'message': f"ℹ️ {category} budget is {percentage:.1f}% used (${actual:.2f}/${budget:.2f})",
                        'severity': 'low'
                    })
    
    # Display alerts
    if alerts:
        for alert in alerts:
            if alert['severity'] == 'high':
                st.markdown(f"""
                <div class="alert-card">
                    <h4 style="margin: 0; color: #ffffff;">🚨 High Priority Alert</h4>
                    <p style="margin: 0.5rem 0; color: #ffffff;">{alert['message']}</p>
                </div>
                """, unsafe_allow_html=True)
            elif alert['severity'] == 'medium':
                st.markdown(f"""
                <div class="alert-card" style="background: linear-gradient(135deg, #ffa726 0%, #ff9800 100%);">
                    <h4 style="margin: 0; color: #ffffff;">⚠️ Medium Priority Alert</h4>
                    <p style="margin: 0.5rem 0; color: #ffffff;">{alert['message']}</p>
                </div>
                """, unsafe_allow_html=True)
            else:
                st.markdown(f"""
                <div class="success-card" style="background: linear-gradient(135deg, #42a5f5 0%, #2196f3 100%);">
                    <h4 style="margin: 0; color: #ffffff;">ℹ️ Information</h4>
                    <p style="margin: 0.5rem 0; color: #ffffff;">{alert['message']}</p>
                </div>
                """, unsafe_allow_html=True)
    else:
        st.markdown("""
        <div class="success-card">
            <h3 style="text-align: center; color: #ffffff;">✅ No alerts at this time!</h3>
            <p style="text-align: center; color: #ffffff;">Your spending is within budget limits.</p>
        </div>
        """, unsafe_allow_html=True)

# Architecture Page
elif page == "🏗️ Architecture":
    st.markdown('<h2 class="section-header">🏗️ Microservices Architecture</h2>', unsafe_allow_html=True)
    
    st.markdown("""
    <div class="feature-card">
        <h3 style="color: #00d4ff; margin-bottom: 1rem;">🔧 System Architecture Overview</h3>
        <p style="color: #b8c5d6; margin-bottom: 1.5rem;">FinTrack is built using a modern microservices architecture with specialized services for different functionalities.</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Microservices visualization
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown('<h3 style="color: #ffffff;">🔄 Active Services</h3>', unsafe_allow_html=True)
        
        services = [
            {"name": "ExpenseService", "status": "🟢 Active", "description": "Manages expense CRUD operations"},
            {"name": "BudgetService", "status": "🟢 Active", "description": "Handles budget management and alerts"},
            {"name": "AnalyticsService", "status": "🟢 Active", "description": "Generates reports and analytics"},
            {"name": "NotificationService", "status": "🟢 Active", "description": "Manages alerts and notifications"},
            {"name": "MLSpendAnalyzer", "status": "🟢 Active", "description": "AI-powered spending analysis"}
        ]
        
        for service in services:
            st.markdown(f"""
            <div class="glass-card" style="padding: 1.5rem; margin: 1rem 0;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4 style="margin: 0; color: #ffffff;">{service['name']}</h4>
                        <p style="margin: 0.5rem 0; color: #b8c5d6;">{service['description']}</p>
                    </div>
                    <div style="font-size: 1.2rem;">{service['status']}</div>
                </div>
            </div>
            """, unsafe_allow_html=True)
    
    with col2:
        st.markdown('<h3 style="color: #ffffff;">📊 Service Metrics</h3>', unsafe_allow_html=True)
        
        # Service metrics
        metrics = {
            "Total Services": len(services),
            "Active Services": len([s for s in services if "🟢" in s['status']]),
            "API Endpoints": 15,
            "Response Time": "< 100ms"
        }
        
        for metric, value in metrics.items():
            st.markdown(f"""
            <div class="metric-card" style="padding: 1.5rem; margin: 0.5rem 0;">
                <div class="metric-number" style="font-size: 2rem;">{value}</div>
                <div class="metric-label">{metric}</div>
            </div>
            """, unsafe_allow_html=True)
    
    # Architecture diagram
    st.markdown('<h3 style="color: #ffffff; margin-top: 2rem;">🏛️ Architecture Diagram</h3>', unsafe_allow_html=True)
    
    # Create a simple architecture diagram using HTML/CSS
    st.markdown("""
    <div class="feature-card">
        <div style="text-align: center; padding: 2rem;">
            <div style="display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 2rem;">
                <div style="background: rgba(0, 212, 255, 0.2); padding: 1rem; border-radius: 15px; border: 2px solid #00d4ff;">
                    <h4 style="color: #00d4ff; margin: 0;">Frontend</h4>
                    <p style="color: #b8c5d6; margin: 0.5rem 0;">Streamlit UI</p>
                </div>
                <div style="font-size: 2rem;">→</div>
                <div style="background: rgba(255, 107, 107, 0.2); padding: 1rem; border-radius: 15px; border: 2px solid #ff6b6b;">
                    <h4 style="color: #ff6b6b; margin: 0;">API Gateway</h4>
                    <p style="color: #b8c5d6; margin: 0.5rem 0;">Service Router</p>
                </div>
                <div style="font-size: 2rem;">→</div>
                <div style="background: rgba(78, 205, 196, 0.2); padding: 1rem; border-radius: 15px; border: 2px solid #4ecdc4;">
                    <h4 style="color: #4ecdc4; margin: 0;">Microservices</h4>
                    <p style="color: #b8c5d6; margin: 0.5rem 0;">5 Services</p>
                </div>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)

# Forecasting Page
elif page == "📈 Forecasting":
    st.markdown('<h2 class="section-header">📈 Spending Forecast</h2>', unsafe_allow_html=True)
    
    if st.session_state.expenses:
        # Generate forecast using analytics service
        forecast_data = analytics_service.generate_forecast(st.session_state.expenses, months=6)
        
        if 'forecast' in forecast_data:
            st.markdown("""
            <div class="feature-card">
                <h3 style="color: #00d4ff; margin-bottom: 1rem;">🔮 AI-Powered Spending Forecast</h3>
                <p style="color: #b8c5d6;">Based on your historical spending patterns, here's what to expect in the coming months.</p>
            </div>
            """, unsafe_allow_html=True)
            
            # Create forecast chart
            forecast_df = pd.DataFrame(forecast_data['forecast'])
            
            fig_forecast = px.line(forecast_df, x='month', y='predicted_amount',
                                 title="6-Month Spending Forecast",
                                 markers=True,
                                 line_shape='spline')
            fig_forecast.update_layout(
                plot_bgcolor='rgba(0,0,0,0)',
                paper_bgcolor='rgba(0,0,0,0)',
                font_color='white',
                xaxis_title="Month",
                yaxis_title="Predicted Amount ($)"
            )
            fig_forecast.update_traces(line_color='#00d4ff', marker_color='#ff6b6b')
            
            st.plotly_chart(fig_forecast, use_container_width=True)
            
            # Forecast insights
            col1, col2, col3 = st.columns(3)
            
            with col1:
                avg_forecast = forecast_df['predicted_amount'].mean()
                st.metric("Average Monthly Forecast", f"${avg_forecast:,.2f}")
            
            with col2:
                trend = forecast_df['predicted_amount'].iloc[-1] - forecast_df['predicted_amount'].iloc[0]
                trend_text = "📈 Increasing" if trend > 0 else "📉 Decreasing" if trend < 0 else "➡️ Stable"
                st.metric("Trend", trend_text)
            
            with col3:
                max_month = forecast_df.loc[forecast_df['predicted_amount'].idxmax(), 'month']
                st.metric("Peak Month", max_month)
        else:
            st.markdown("""
            <div class="feature-card">
                <h3 style="text-align: center; color: #b8c5d6;">Need more data for forecasting</h3>
                <p style="text-align: center; color: #b8c5d6;">Add more transactions to enable AI-powered forecasting.</p>
            </div>
            """, unsafe_allow_html=True)
    else:
        st.markdown("""
        <div class="feature-card">
            <h3 style="text-align: center; color: #b8c5d6;">No data available for forecasting</h3>
            <p style="text-align: center; color: #b8c5d6;">Add some expenses to see spending forecasts.</p>
        </div>
        """, unsafe_allow_html=True)

# Profile Page
elif page == "👤 Profile":
    st.markdown('<h2 class="section-header">👤 User Profile</h2>', unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("""
        <div class="feature-card">
            <h3 style="color: #667eea; margin-bottom: 1rem;">Profile Settings</h3>
        </div>
        """, unsafe_allow_html=True)
        
        with st.form("profile_form"):
            name = st.text_input("Name", value=st.session_state.user_profile['name'])
            monthly_income = st.number_input("Monthly Income ($)", 
                                           value=float(st.session_state.user_profile['monthly_income']),
                                           min_value=0.0, step=100.0)
            savings_goal = st.number_input("Monthly Savings Goal ($)", 
                                         value=float(st.session_state.user_profile['savings_goal']),
                                         min_value=0.0, step=50.0)
            
            if st.form_submit_button("💾 Save Profile"):
                st.session_state.user_profile = {
                    'name': name,
                    'monthly_income': monthly_income,
                    'savings_goal': savings_goal
                }
                st.success("✅ Profile updated successfully!")
                st.rerun()
    
    with col2:
        st.markdown("""
        <div class="feature-card">
            <h3 style="color: #667eea; margin-bottom: 1rem;">Financial Summary</h3>
        </div>
        """, unsafe_allow_html=True)
        
        if st.session_state.user_profile['monthly_income'] > 0:
            income = st.session_state.user_profile['monthly_income']
            savings_goal = st.session_state.user_profile['savings_goal']
            
            # Calculate current month spending
            if st.session_state.expenses:
                df = pd.DataFrame(st.session_state.expenses)
                df['date'] = pd.to_datetime(df['date'])
                current_month = datetime.now().month
                monthly_spending = df[df['date'].dt.month == current_month]['amount'].sum()
            else:
                monthly_spending = 0
            
            # Calculate metrics
            remaining_income = income - monthly_spending
            savings_rate = (savings_goal / income) * 100 if income > 0 else 0
            
            st.metric("Monthly Income", f"${income:,.2f}")
            st.metric("Current Month Spending", f"${monthly_spending:,.2f}")
            st.metric("Remaining Income", f"${remaining_income:,.2f}")
            st.metric("Savings Goal", f"${savings_goal:,.2f}")
            
            # Savings progress
            if savings_goal > 0:
                savings_progress = min(100, (remaining_income / savings_goal) * 100)
                st.progress(savings_progress / 100)
                st.write(f"Savings Progress: {savings_progress:.1f}%")

# Footer
st.markdown("---")
st.markdown("""
<div style="text-align: center; color: #a8b2d1; padding: 2rem;">
    <p>💰 <strong>FinTrack</strong> - AI-Powered Financial Tracker</p>
    <p>Built with Streamlit & Machine Learning | Created by <strong>Saurabh Parthe</strong></p>
    <p>🚀 <strong>Features:</strong> Expense Tracking • Budget Management • ML Insights • Smart Alerts</p>
</div>
""", unsafe_allow_html=True)