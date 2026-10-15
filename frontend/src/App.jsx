import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import { AuthProvider, ProtectedRoute } from './hooks/useAuth';
import { DemoDataProvider } from './hooks/useDemoData';
import AppShell from './components/layout/AppShell';
import Login from './pages/Login';

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <DemoDataProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <AppShell />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </DemoDataProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}
