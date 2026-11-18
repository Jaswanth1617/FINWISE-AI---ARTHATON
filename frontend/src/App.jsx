import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AnalyserPage from './pages/AnalyserPage';
import TransactionsPage from './pages/TransactionsPage';
import FraudDetectionPage from './pages/FraudDetectionPage';
import BudgetingPage from './pages/BudgetingPage';
import LoansPage from './pages/LoansPage';
import InvestmentsPage from './pages/InvestmentsPage';
import TaxPage from './pages/TaxPage';
import BusinessPage from './pages/BusinessPage';
import NewsPage from './pages/NewsPage';
import AssistantPage from './pages/AssistantPage';
import ReportsPage from './pages/ReportsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import DatasetsPage from './pages/DatasetsPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Application Routes */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/analyser" element={<AnalyserPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/fraud-detection" element={<FraudDetectionPage />} />
            <Route path="/datasets" element={<DatasetsPage />} />
            <Route path="/budgeting" element={<BudgetingPage />} />
            <Route path="/loans" element={<LoansPage />} />
            <Route path="/investments" element={<InvestmentsPage />} />
            <Route path="/tax" element={<TaxPage />} />
            <Route path="/business" element={<BusinessPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
