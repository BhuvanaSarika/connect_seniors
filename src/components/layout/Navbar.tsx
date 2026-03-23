'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { FiMenu, FiX, FiLogOut, FiUser } from 'react-icons/fi';

const navLinks = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Roadmaps', href: '/roadmaps' },
  { name: 'Projects', href: '/projects' },
  { name: 'Mentorship', href: '/mentorship' },
  { name: 'Resume', href: '/resume' },
  { name: 'Courses', href: '/courses' },
];

export default function Navbar() {
  const { appUser, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!appUser) return null;

  const roleBadge = {
    admin: 'bg-red-500',
    senior: 'bg-accent',
    junior: 'bg-primary-light',
  };

  return (
    <nav className="sticky top-0 w-full z-50 bg-white border-b border-slate-200 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm transition-transform group-hover:bg-primary">
              <span className="font-bold text-lg">C</span>
            </div>
            <div className="font-display font-extrabold text-xl tracking-tight text-slate-900">
              Connect<span className="text-primary">Seniors</span>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                    active
                      ? 'text-primary bg-primary/5'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            {appUser.role === 'admin' && (
              <Link
                href="/admin"
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                  pathname.startsWith('/admin')
                    ? 'text-red-600 bg-red-50'
                    : 'text-slate-500 hover:text-red-600 hover:bg-red-50'
                }`}
              >
                Admin
              </Link>
            )}
          </div>

          {/* User Info + Logout */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-3 pr-6 border-r border-slate-200">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900 leading-tight">{appUser.displayName}</p>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${appUser.role === 'admin' ? 'text-red-500' : 'text-primary'}`}>
                  {appUser.role} Account
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                <FiUser size={18} />
              </div>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 font-bold text-sm transition-all flex items-center gap-2"
            >
              Sign Out
              <FiLogOut size={18} />
            </button>
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-1 animate-in slide-in-from-top-4 duration-200">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block px-4 py-3 rounded-xl text-base font-bold ${
                pathname.startsWith(link.href)
                  ? 'bg-primary/5 text-primary'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {link.name}
            </Link>
          ))}
          {appUser.role === 'admin' && (
             <Link
               href="/admin"
               onClick={() => setMobileOpen(false)}
               className="block px-4 py-3 rounded-xl text-base font-bold text-red-600 hover:bg-red-50"
             >
               Admin Control Center
             </Link>
          )}
          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                <FiUser size={18} />
              </div>
              <div>
                 <p className="text-sm font-bold text-slate-900">{appUser.displayName}</p>
                 <p className="text-xs text-slate-500 font-medium uppercase tracking-tighter">{appUser.role}</p>
              </div>
            </div>
            <button onClick={logout} className="p-3 rounded-xl bg-red-50 text-red-500 font-bold flex items-center gap-2 text-sm">
              Logout
              <FiLogOut size={18} />
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
