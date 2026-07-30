import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchAuthStatus } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [status, setStatus] = useState({ configured: false, loading: true });
  const [username, setUsername] = useState('');
  const [apiUrl, setApiUrl] = useState('https://api.froglog.co.uk/api');

  const refresh = useCallback(async () => {
    setStatus((current) => ({ ...current, loading: true }));
    try {
      const data = await fetchAuthStatus();
      setStatus({ configured: data.configured, loading: false });
      if (data.configured) {
        setUsername(data.username || '');
        setApiUrl(data.apiUrl || 'https://api.froglog.co.uk/api');
      }
      return data;
    } catch {
      setStatus({ configured: false, loading: false });
      return { configured: false };
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(() => ({
    configured: status.configured,
    loading: status.loading,
    username,
    apiUrl,
    setUsername,
    setApiUrl,
    refresh,
    setConfigured: (data) => {
      setStatus({ configured: true, loading: false });
      setUsername(data.username || '');
      setApiUrl(data.apiUrl || 'https://api.froglog.co.uk/api');
    },
    clearConfigured: () => {
      setStatus({ configured: false, loading: false });
      setUsername('');
    },
  }), [status, username, apiUrl, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
