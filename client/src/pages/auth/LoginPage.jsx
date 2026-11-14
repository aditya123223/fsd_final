import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import toast from 'react-hot-toast';
import { Mail, Lock, LogIn, ArrowRight } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const user = await login(data);
      toast.success(`Welcome back, ${user.name}!`);
      if (user.role === 'doctor') {
        navigate('/doctor/dashboard', { replace: true });
      } else {
        navigate('/patient/dashboard', { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const setDemoDoctor = () => {
    setValue('email', 'aisha.patel@hospital.com');
    setValue('password', 'Password123!');
  };

  const setDemoPatient = () => {
    setValue('email', 'amit.kumar@gmail.com');
    setValue('password', 'Password123!');
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-gray-100">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sign In to CareSync</h1>
        <p className="text-xs text-gray-500 mt-1.5">
          Enter your registered email and password to access your portal
        </p>
      </div>

      {/* Demo Credentials Quick Fill */}
      <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-xl">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">
          Quick Demo Accounts
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={setDemoDoctor}
            className="flex-1 py-1.5 px-2 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-medium rounded-lg border border-teal-200 transition-colors"
          >
            Demo Doctor
          </button>
          <button
            type="button"
            onClick={setDemoPatient}
            className="flex-1 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-lg border border-blue-200 transition-colors"
          >
            Demo Patient
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="email"
              {...register('email')}
              placeholder="you@example.com"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="password"
              {...register('password')}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {submitting ? (
            'Signing in...'
          ) : (
            <>
              <LogIn className="w-4 h-4" /> Sign In
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-gray-100 text-center space-y-2">
        <p className="text-xs text-gray-600">
          New patient?{' '}
          <Link to="/register/patient" className="font-semibold text-blue-600 hover:underline">
            Register as Patient
          </Link>
        </p>
        <p className="text-xs text-gray-600">
          Healthcare professional?{' '}
          <Link to="/register/doctor" className="font-semibold text-teal-600 hover:underline">
            Register as Doctor
          </Link>
        </p>
      </div>
    </div>
  );
}
