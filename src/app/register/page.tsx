'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [rollNumber, setRollNumber] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await register(rollNumber, displayName, email, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-primary/5 rounded-full -mr-60 -mt-60 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-fuchsia-500/5 rounded-full -ml-60 -mb-60 blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-[2.5rem] shadow-premium border border-gray-100 p-10 md:p-12">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-display font-black text-gray-900 leading-tight">
               Join <span className="text-gradient">Connect</span>
            </h1>
            <p className="text-gray-500 mt-2 font-medium">Create your professional profile.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold uppercase tracking-widest text-center animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Roll Number</label>
                  <input
                     type="text" required value={rollNumber} onChange={(e) => setRollNumber(e.target.value)}
                     className="input-clean uppercase !rounded-2xl !py-4"
                     placeholder="22A91A..."
                  />
               </div>
               <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                  <input
                     type="text" required value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                     className="input-clean !rounded-2xl !py-4"
                     placeholder="John Doe"
                  />
               </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Academic Email</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="input-clean !rounded-2xl !py-4"
                placeholder="university@email.edu"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                  <input
                     type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                     className="input-clean !rounded-2xl !py-4"
                     placeholder="••••••••"
                  />
               </div>
               <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Verify</label>
                  <input
                     type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                     className="input-clean !rounded-2xl !py-4"
                     placeholder="••••••••"
                  />
               </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-4 mt-2 rounded-2xl bg-gray-900 text-white font-bold text-sm uppercase tracking-widest shadow-float hover:bg-primary transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Register Account'}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-gray-50 flex flex-col items-center gap-4">
             <p className="text-xs text-gray-500 font-medium">Already transitioned?</p>
             <Link href="/login" className="text-sm font-bold text-primary hover:underline underline-offset-4 decoration-2">
                Sign In to Platform &rarr;
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
