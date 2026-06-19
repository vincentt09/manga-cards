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

import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Collection from '@/pages/Collection';
import Boosters from '@/pages/Boosters';
import Profile from '@/pages/Profile';
import Marketplace from '@/pages/Marketplace';
import Encyclopedia from '@/pages/Encyclopedia';
import HistoryPage from '@/pages/History';
import Admin from '@/pages/Admin';
import Fusion from '@/pages/Fusion';
import Frames from '@/pages/Frames';
import Talents from '@/pages/Talents';
import Auctions from '@/pages/Auctions';
import Leaderboard from '@/pages/Leaderboard';
import Success from '@/pages/Success';

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
    <Routes>
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
        <Route path="/chat" element={<Navigate to="/" replace />} />
        <Route path="/success" element={<Success />} />
        <Route path="/cosmetics" element={<Navigate to="/profile" replace />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
