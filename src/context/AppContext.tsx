import React, { createContext, useContext, useState, useMemo } from 'react';
import { UserRole } from '../types';

export interface AppContextState {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  isOnline: boolean;
  activeNotificationCount: number;
}

const AppContext = createContext<AppContextState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>('student');
  const [isOnline] = useState<boolean>(true);
  const [activeNotificationCount] = useState<number>(3);

  const value = useMemo(
    () => ({
      currentRole,
      setCurrentRole,
      isOnline,
      activeNotificationCount,
    }),
    [currentRole, isOnline, activeNotificationCount]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextState {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
