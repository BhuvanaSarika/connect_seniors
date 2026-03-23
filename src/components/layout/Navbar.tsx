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
    <div className="fixed top-4 left-0 right-0 z-50 px-4 pointer-events-none">
      <nav className="max-w-7xl mx-auto glass rounded-2xl shadow-premium pointer-events-auto transition-all duration-300">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                <span className="font-bold text-lg">C</span>
              </div>
              <div className="font-display font-bold text-xl tracking-tight text-gray-900 group-hover:text-primary transition-colors">
                <span className="text-primary">Connect</span>Seniors
              </div>
            </Link>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-1 bg-gray-100/50 p-1 rounded-xl">
              {navLinks.map((link) => {
                const active = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      active
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
              {appUser.role === 'admin' && (
                <Link
                  href="/admin"
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    pathname.startsWith('/admin')
                      ? 'bg-white text-red-600 shadow-sm'
                      : 'text-gray-500 hover:text-red-600 hover:bg-white/50'
                  }`}
                >
                  Admin
                </Link>
              )}
            </div>

            {/* User Info + Logout */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-3 pr-4 border-r border-gray-200">
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900 leading-tight">{appUser.displayName}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${appUser.role === 'admin' ? 'text-red-500' : 'text-primary-light'}`}>
                    {appUser.role}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 border border-gray-200">
                  <FiUser size={18} />
                </div>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                title="Logout"
              >
                <FiLogOut size={20} />
              </button>
            </div>

            {/* Mobile Toggle */}
            <button
              className="md:hidden p-2 rounded-xl hover:bg-gray-100 text-gray-600"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 rounded-xl text-base font-semibold ${
                  pathname.startsWith(link.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {link.name}
              </Link>
            ))}
            {appUser.role === 'admin' && (
               <Link
                 href="/admin"
                 onClick={() => setMobileOpen(false)}
                 className="block px-4 py-3 rounded-xl text-base font-semibold text-red-600 hover:bg-red-50"
               >
                 Admin Panel
               </Link>
            )}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                  <FiUser size={18} />
                </div>
                <div>
                   <p className="text-sm font-bold text-gray-900">{appUser.displayName}</p>
                   <p className="text-xs text-gray-500 capitalize">{appUser.role}</p>
                </div>
              </div>
              <button onClick={logout} className="p-3 rounded-xl bg-red-50 text-red-500">
                <FiLogOut size={20} />
              </button>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}
