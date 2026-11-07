import React from 'react';
import { AuthProvider } from './app/providers/AuthProvider';
import { QueryProvider } from './app/providers/QueryProvider';
import { AppRouter } from './app/router';

export const App: React.FC = () => {
  return (
    <QueryProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </QueryProvider>
  );
};

export default App;
