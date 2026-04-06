import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import LoginPage from './components/auth/LoginPage';
import OnboardingModal from './components/onboarding/OnboardingModal';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './components/dashboard/Dashboard';
import ProfilePage from './components/profile/ProfilePage';
import MessagesPage from './components/chat/MessagesPage';
import { Loader2 } from 'lucide-react';

function AppRoutes() {
  const { firebaseUser, isLoading, needsOnboarding } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[hsl(var(--background))]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-[hsl(263_70%_55%)] to-[hsl(220_70%_55%)] flex items-center justify-center shadow-2xl">
            <Loader2 className="w-7 h-7 text-white animate-spin" />
          </div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading UniGig…</p>
        </div>
      </div>
    );
  }

  if (!firebaseUser) return <LoginPage />;
  if (needsOnboarding) return <OnboardingModal />;

  return (
    <SocketProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </SocketProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
