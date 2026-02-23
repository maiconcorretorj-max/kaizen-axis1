import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useApp } from '@/context/AppContext';
import { useAuthorization, UserRole } from '@/hooks/useAuthorization';

import Dashboard from '@/pages/Dashboard';
import Clients from '@/pages/Clients';
import ClientDetails from '@/pages/ClientDetails';
import NewClient from '@/pages/NewClient';
import AutomationLeads from '@/pages/AutomationLeads';
import SendEmail from '@/pages/SendEmail';
import IncomeAnalysis from '@/pages/IncomeAnalysis';
import Amortization from '@/pages/Amortization';
import Schedule from '@/pages/Schedule';
import Chat from '@/pages/Chat';
import ChatDetail from '@/pages/ChatDetail';
import More from '@/pages/More';
import Developments from '@/pages/Developments';
import DevelopmentDetails from '@/pages/DevelopmentDetails';
import Tasks from '@/pages/Tasks';
import Training from '@/pages/Training';
import Settings from '@/pages/Settings';
import Reports from '@/pages/Reports';
import PotentialClients from '@/pages/PotentialClients';
import AdminPanel from '@/pages/admin/AdminPanel';
import Onboarding from '@/pages/Onboarding';
import PdfTools from '@/pages/PdfTools';
import Portals from '@/pages/Portals';
import Login from '@/pages/Login';

// ─── Basic auth guard (all authenticated users) ──────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = localStorage.getItem('isAuthenticated');
  const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding');

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!hasCompletedOnboarding) return <Navigate to="/onboarding" replace />;

  return <Layout>{children}</Layout>;
}

// ─── Role-based guard ─────────────────────────────────────────────────────────
// `allowed`: which roles CAN access this route. If user's role is not in the
// list they are silently redirected to "/" (dashboard).
function RoleRoute({
  children,
  allowed,
}: {
  children: React.ReactNode;
  allowed: UserRole[];
}) {
  const isAuthenticated = localStorage.getItem('isAuthenticated');
  const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding');
  const { role } = useAuthorization();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!hasCompletedOnboarding) return <Navigate to="/onboarding" replace />;

  // While profile is loading, role defaults to 'CORRETOR' — wait for it.
  // We check if role is in allowed list; if not, bounce to dashboard.
  if (!allowed.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* All authenticated roles */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
        <Route path="/clients/new" element={<ProtectedRoute><NewClient /></ProtectedRoute>} />
        <Route path="/clients/:id" element={<ProtectedRoute><ClientDetails /></ProtectedRoute>} />
        <Route path="/clients/:id/email" element={<ProtectedRoute><SendEmail /></ProtectedRoute>} />
        <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/chat/:id" element={<ProtectedRoute><ChatDetail /></ProtectedRoute>} />
        <Route path="/more" element={<ProtectedRoute><More /></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/amortization" element={<ProtectedRoute><Amortization /></ProtectedRoute>} />
        <Route path="/income" element={<ProtectedRoute><IncomeAnalysis /></ProtectedRoute>} />
        <Route path="/pdf-tools" element={<ProtectedRoute><PdfTools /></ProtectedRoute>} />

        {/* ADMIN + DIRETOR + GERENTE + COORDENADOR only */}
        <Route path="/automation-leads" element={
          <RoleRoute allowed={['ADMIN', 'DIRETOR', 'GERENTE', 'COORDENADOR']}>
            <AutomationLeads />
          </RoleRoute>
        } />
        <Route path="/reports" element={
          <RoleRoute allowed={['ADMIN', 'DIRETOR', 'GERENTE', 'COORDENADOR']}>
            <Reports />
          </RoleRoute>
        } />
        <Route path="/reports/potential-clients" element={
          <RoleRoute allowed={['ADMIN', 'DIRETOR', 'GERENTE', 'COORDENADOR']}>
            <PotentialClients />
          </RoleRoute>
        } />

        {/* ADMIN + DIRETOR only (strategic resources) */}
        <Route path="/developments" element={
          <RoleRoute allowed={['ADMIN', 'DIRETOR']}>
            <Developments />
          </RoleRoute>
        } />
        <Route path="/developments/:id" element={
          <RoleRoute allowed={['ADMIN', 'DIRETOR']}>
            <DevelopmentDetails />
          </RoleRoute>
        } />
        <Route path="/training" element={
          <RoleRoute allowed={['ADMIN', 'DIRETOR']}>
            <Training />
          </RoleRoute>
        } />
        <Route path="/portals" element={
          <RoleRoute allowed={['ADMIN', 'DIRETOR']}>
            <Portals />
          </RoleRoute>
        } />

        {/* ADMIN ONLY */}
        <Route path="/admin" element={
          <RoleRoute allowed={['ADMIN']}>
            <AdminPanel />
          </RoleRoute>
        } />

        {/* Placeholder */}
        <Route path="/simulator" element={<ProtectedRoute><div className="p-6"><h1 className="text-2xl font-bold">Simulador</h1><p>Em breve...</p></div></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
