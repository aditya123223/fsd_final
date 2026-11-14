import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Activity } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <header className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-white">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-gray-900 text-lg leading-tight tracking-tight">CareSync</span>
            <span className="block text-[10px] text-teal-600 font-semibold tracking-wider uppercase">Hospital System</span>
          </div>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-gray-400 border-t border-gray-100 bg-white">
        &copy; {new Date().getFullYear()} CareSync Hospital Appointment System. All rights reserved.
      </footer>
    </div>
  );
}
