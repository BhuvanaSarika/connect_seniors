'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { FiGrid, FiUsers, FiShield, FiTrendingUp, FiCheckCircle, FiChevronRight } from 'react-icons/fi';

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  const links = [
    { name: 'Analytics Terminal', href: '/admin', icon: FiGrid },
    { name: 'User Directory', href: '/admin/users', icon: FiUsers },
    { name: 'Credential Ranges', href: '/admin/ranges', icon: FiShield },
    { name: 'Grade Promotions', href: '/admin/promotions', icon: FiTrendingUp },
    { name: 'Expert Approvals', href: '/admin/mentors', icon: FiCheckCircle },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 flex flex-col md:flex-row gap-12 text-slate-900">
      {/* Platform Governance Sidebar */}
      <aside className="w-full md:w-72 shrink-0">
        <div className="clean-card p-6 sticky top-24 border-slate-900/5 bg-slate-50/50 backdrop-blur-md">
          <div className="mb-10 px-2">
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5">Governance</p>
            <h2 className="text-xl font-display font-black text-slate-900 tracking-tight">Admin Console</h2>
          </div>
          <nav className="space-y-1.5">
            {links.map(link => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group flex items-center justify-between px-4 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    active 
                      ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10' 
                      : 'text-slate-400 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <link.icon className={active ? 'text-primary' : 'text-slate-300 group-hover:text-primary'} size={18} />
                    <span>{link.name}</span>
                  </div>
                  {active && <FiChevronRight className="opacity-40" />}
                </Link>
              );
            })}
          </nav>
          
          <div className="mt-12 pt-8 border-t border-slate-100 px-2 opacity-50">
             <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                System Version: 4.0.2-Educational<br />
                Authorized Access Protocol
             </p>
          </div>
        </div>
      </aside>

      {/* Primary Governance Terminal */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
