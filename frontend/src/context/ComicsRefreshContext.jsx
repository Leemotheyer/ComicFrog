import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ComicsRefreshContext = createContext(null);

export function ComicsRefreshProvider({ children }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const bumpRefresh = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  const value = useMemo(() => ({ refreshKey, bumpRefresh }), [refreshKey, bumpRefresh]);

  return (
    <ComicsRefreshContext.Provider value={value}>
      {children}
    </ComicsRefreshContext.Provider>
  );
}

export function useComicsRefresh() {
  const context = useContext(ComicsRefreshContext);
  if (!context) {
    throw new Error('useComicsRefresh must be used within ComicsRefreshProvider');
  }
  return context;
}
