import { lazy, Suspense } from 'react'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import ServerWakeScreen from '@/components/ServerWakeScreen';
import AppErrorBoundary from '@/components/AppErrorBoundary';
import NetworkStatus from '@/components/NetworkStatus';
import RouteFallback from '@/components/RouteFallback';

const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const Collection = lazy(() => import('@/pages/Collection'));
const Boosters = lazy(() => import('@/pages/Boosters'));
const Profile = lazy(() => import('@/pages/Profile'));
const Marketplace = lazy(() => import('@/pages/Marketplace'));
const Encyclopedia = lazy(() => import('@/pages/Encyclopedia'));
const HistoryPage = lazy(() => import('@/pages/History'));
const Admin = lazy(() => import('@/pages/Admin'));
const Fusion = lazy(() => import('@/pages/Fusion'));
const Frames = lazy(() => import('@/pages/Frames'));
const Talents = lazy(() => import('@/pages/Talents'));
const Auctions = lazy(() => import('@/pages/Auctions'));
const Leaderboard = lazy(() => import('@/pages/Leaderboard'));
const Success = lazy(() => import('@/pages/Success'));
const Pve = lazy(() => import('@/pages/Pve'));

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, serverWake } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return <ServerWakeScreen attempt={serverWake?.attempt || 0} />;
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Suspense fallback={<RouteFallback />}><Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/" element={<Collection />} />
        <Route path="/boosters" element={<Boosters />} />
        <Route path="/upgrade" element={<Navigate to="/" replace />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/encyclopedia" element={<Encyclopedia />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/fusion" element={<Fusion />} />
        <Route path="/frames" element={<Frames />} />
        <Route path="/talents" element={<Talents />} />
        <Route path="/auctions" element={<Auctions />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/pve" element={<Pve />} />
        <Route path="/chat" element={<Navigate to="/" replace />} />
        <Route path="/success" element={<Success />} />
        <Route path="/cosmetics" element={<Navigate to="/profile" replace />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes></Suspense>
  );
};

function App() {
  return (
    <AppErrorBoundary><AuthProvider><QueryClientProvider client={queryClientInstance}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><ScrollToTop /><NetworkStatus /><AuthenticatedApp /></Router>
      <Toaster />
    </QueryClientProvider></AuthProvider></AppErrorBoundary>
  )
}

export default App
