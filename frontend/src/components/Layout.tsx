import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-tight text-text">
            Nirdaan
          </Link>
          <nav className="flex items-center gap-4">
            {user ? (
              <>
                <Link to="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
                  Dashboard
                </Link>
                <Link to="/diagnose" className="text-sm font-medium hover:text-primary transition-colors">
                  Diagnose
                </Link>
                <button onClick={handleLogout} className="text-sm font-medium text-gray-500 hover:text-text transition-colors">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors">
                  Login
                </Link>
                <Link to="/signup" className="btn-primary text-sm">
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-border mt-auto py-6">
        <div className="max-w-5xl mx-auto px-4 text-sm text-gray-500 flex justify-between">
          <span>&copy; {new Date().getFullYear()} Nirdaan. All rights reserved.</span>
          <span>Triage Tool, Not a Replacement for Professionals.</span>
        </div>
      </footer>
    </div>
  );
}
