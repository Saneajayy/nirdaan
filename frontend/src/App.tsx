import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Diagnose from './pages/Diagnose';
import { useAuthStore } from './store/authStore';

// Protected Route wrapper
function ProtectedRoute({ children }: { children: JSX.Element }) {
  const user = useAuthStore((state) => state.user);
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Auth Route wrapper (redirects to dashboard if already logged in)
function AuthRoute({ children }: { children: JSX.Element }) {
  const user = useAuthStore((state) => state.user);
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Landing />} />
          
          <Route path="login" element={
            <AuthRoute>
              <Login />
            </AuthRoute>
          } />
          
          <Route path="signup" element={
            <AuthRoute>
              <Signup />
            </AuthRoute>
          } />
          
          <Route path="dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="diagnose" element={
            <ProtectedRoute>
              <Diagnose />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
