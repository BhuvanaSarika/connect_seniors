'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { FiGrid, FiUsers, FiShield, FiTrendingUp, FiCheckCircle } from 'react-icons/fi';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { appUser, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!appUser || appUser.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [loading, appUser, router]);

  if (loading || !appUser || appUser.role !== 'admin') {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full" /></div>;
  }

  const links = [
    { name: 'Overview', href: '/admin', icon: FiGrid },
    { name: 'User Directory', href: '/admin/users', icon: FiUsers },
    { name: 'Roll Number Ranges', href: '/admin/ranges', icon: FiShield },
    { name: 'Promote Juniors', href: '/admin/promotions', icon: FiTrendingUp },
    { name: 'Mentor Approvals', href: '/admin/mentors', icon: FiCheckCircle },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 shrink-0">
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-4 sticky top-24">
          <div className="mb-6 px-2">
            <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
            <p className="text-sm text-red-500 font-medium">Platform Management</p>
          </div>
          <nav className="space-y-1">
            {links.map(link => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                    active ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <link.icon className={active ? 'text-red-500' : 'text-gray-400'} size={18} />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Admin Content */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
