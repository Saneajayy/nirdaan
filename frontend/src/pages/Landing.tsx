import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Landing() {
  const { user } = useAuthStore();

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-5xl font-bold tracking-tight text-text mb-6">
        Precision Circuit Diagnostics. <br />
        Powered by AI.
      </h1>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
        Upload your hydraulic or mechanical circuit diagrams, describe the symptoms, and get an instant, prioritized triage report to guide your troubleshooting.
      </p>
      
      {user ? (
        <Link to="/dashboard" className="btn-primary text-lg px-8 py-3">
          Go to Dashboard
        </Link>
      ) : (
        <div className="flex gap-4 justify-center">
          <Link to="/signup" className="btn-primary text-lg px-8 py-3">
            Start Diagnosing
          </Link>
          <Link to="/login" className="btn-secondary text-lg px-8 py-3">
            Log In
          </Link>
        </div>
      )}

      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left w-full max-w-4xl border-t border-border pt-12">
        <div>
          <h3 className="font-bold text-lg mb-2">Instant Triage</h3>
          <p className="text-gray-600 text-sm">Upload a diagram and describe the issue. Get likely causes in seconds.</p>
        </div>
        <div>
          <h3 className="font-bold text-lg mb-2">Bilingual Support</h3>
          <p className="text-gray-600 text-sm">Receive detailed technical explanations in English or Hindi.</p>
        </div>
        <div>
          <h3 className="font-bold text-lg mb-2">Secure & Private</h3>
          <p className="text-gray-600 text-sm">Your files are processed securely with automatic metadata stripping.</p>
        </div>
      </div>
    </div>
  );
}
