import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function AppLayout() {
  const { isAuthenticated, loading } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-finwise-bg flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-finwise-indigo animate-spin mb-4 flex items-center justify-center text-white font-bold">
          FW
        </div>
        <p className="text-sm font-semibold text-slate-600">Initializing FINWISE AI Platform...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex bg-finwise-bg text-slate-800">
      <Sidebar isCollapsed={isSidebarCollapsed} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar 
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
          isSidebarCollapsed={isSidebarCollapsed}
        />
        
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
