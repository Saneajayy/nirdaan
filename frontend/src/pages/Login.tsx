import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/axios';
import { useAuthStore } from '../store/authStore';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema) as any
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setError('');
      const res = await api.post('/auth/login', data);
      const { user, accessToken } = res.data.data;
      setAuth(user, accessToken);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="max-w-md mx-auto w-full pt-12">
      <div className="card">
        <h1 className="text-2xl font-bold mb-6">Log in to Nirdaan</h1>
        {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 mb-4 text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" {...register('email')} className="input-field" placeholder="you@example.com" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" {...register('password')} className="input-field" placeholder="••••••••" />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex justify-center mt-6">
            {isSubmitting ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-500">Don't have an account? </span>
          <Link to="/signup" className="text-primary hover:underline font-medium">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
