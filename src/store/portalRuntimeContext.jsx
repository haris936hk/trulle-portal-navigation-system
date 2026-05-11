import { createContext, useContext } from 'react';

const PortalRuntimeContext = createContext(null);

export function PortalRuntimeProvider({ value, children }) {
  return (
    <PortalRuntimeContext.Provider value={value}>
      {children}
    </PortalRuntimeContext.Provider>
  );
}

export function usePortalRuntime() {
  const runtime = useContext(PortalRuntimeContext);
  if (!runtime) {
    throw new Error('usePortalRuntime must be used within PortalRuntimeProvider');
  }
  return runtime;
}

