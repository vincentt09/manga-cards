import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { API_WAKE_EVENT, appClient } from "@/api/appClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [serverWake, setServerWake] = useState({ status: "checking", attempt: 0 });

  useEffect(() => {
    const onWakeStatus = (event) => setServerWake(event.detail);
    window.addEventListener(API_WAKE_EVENT, onWakeStatus);
    return () => window.removeEventListener(API_WAKE_EVENT, onWakeStatus);
  }, []);

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const currentUser = await appClient.auth.me();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => { checkUserAuth(); }, [checkUserAuth]);

  const logout = () => appClient.auth.logout();
  const navigateToLogin = () => { window.location.href = "/login"; };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: Boolean(user),
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError,
      appPublicSettings: null,
      authChecked,
      serverWake,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState: checkUserAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return context;
}
