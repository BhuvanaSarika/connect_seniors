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
    <nav className="bg-primary-dark text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <span className="text-accent">Connect</span>
            <span>Seniors</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith(link.href)
                    ? 'bg-white/15 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {link.name}
              </Link>
            ))}
            {appUser.role === 'admin' && (
              <Link
                href="/admin"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith('/admin')
                    ? 'bg-white/15 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                Admin
              </Link>
            )}
          </div>

          {/* User Info + Logout */}
          <div className="hidden md:flex items-center gap-3">
            <span className={`text-xs px-2 py-1 rounded-full font-semibold capitalize ${roleBadge[appUser.role]} text-white`}>
              {appUser.role}
            </span>
            <span className="text-sm text-white/80 flex items-center gap-1">
              <FiUser size={14} />
              {appUser.displayName}
            </span>
            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white"
              title="Logout"
            >
              <FiLogOut size={18} />
            </button>
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/10"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-primary-dark border-t border-white/10 px-4 pb-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium mt-1 ${
                pathname.startsWith(link.href)
                  ? 'bg-white/15 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {link.name}
            </Link>
          ))}
          {appUser.role === 'admin' && (
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium mt-1 text-white/70 hover:text-white hover:bg-white/10"
            >
              Admin
            </Link>
          )}
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full font-semibold capitalize ${roleBadge[appUser.role]} text-white`}>
                {appUser.role}
              </span>
              <span className="text-sm text-white/80">{appUser.displayName}</span>
            </div>
            <button onClick={logout} className="p-2 rounded-lg hover:bg-white/10 text-white/70">
              <FiLogOut size={18} />
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
