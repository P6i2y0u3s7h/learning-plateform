import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { AppRoutes } from './routes/AppRoutes';

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppProvider>
          <NotificationProvider>
            <AppRoutes />
          </NotificationProvider>
        </AppProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
