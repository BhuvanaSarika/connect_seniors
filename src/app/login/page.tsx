'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -mr-48 -mt-48 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-500/5 rounded-full -ml-48 -mb-48 blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-[2.5rem] shadow-premium border border-slate-200 p-10 md:p-12">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-display font-black text-gray-900 leading-tight">
               Connect<span className="text-gradient">Seniors</span>
            </h1>
            <p className="text-gray-500 mt-3 font-medium">Welcome back. Enter your credentials.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold uppercase tracking-widest text-center animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Academic Email</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="input-clean !rounded-2xl !py-4"
                placeholder="university@email.edu"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Access Key</label>
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="input-clean !rounded-2xl !py-4"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full py-4 rounded-2xl bg-gray-900 text-white font-bold text-sm uppercase tracking-widest shadow-float hover:bg-primary transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Establish Session'}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-gray-50 flex flex-col items-center gap-4">
             <p className="text-xs text-gray-500 font-medium">New to the platform?</p>
             <Link href="/register" className="text-sm font-bold text-primary hover:underline underline-offset-4 decoration-2">
                Initialize Account &rarr;
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
