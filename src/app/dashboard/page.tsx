'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { FiMap, FiCode, FiUsers, FiFileText, FiBookOpen, FiAward, FiArrowRight, FiBell } from 'react-icons/fi';

export default function DashboardPage() {
  const { appUser, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ roadmaps: 0, projects: 0, resumes: 0, courses: 0 });
  const [pendingResumes, setPendingResumes] = useState(0);

  useEffect(() => {
    if (!loading && !appUser) {
      router.push('/login');
    }
  }, [loading, appUser, router]);

  useEffect(() => {
    if (!appUser) return;
    const fetchStats = async () => {
      try {
        const [roadmapsSnap, projectsSnap, resumesSnap, coursesSnap] = await Promise.all([
          getDocs(query(collection(db, 'roadmaps'), limit(100))),
          getDocs(query(collection(db, 'projectIdeas'), limit(100))),
          getDocs(query(collection(db, 'resumes'), limit(100))),
          getDocs(query(collection(db, 'courses'), limit(100))),
        ]);
        setStats({
          roadmaps: roadmapsSnap.size,
          projects: projectsSnap.size,
          resumes: resumesSnap.size,
          courses: coursesSnap.size,
        });

        if (appUser.role === 'senior' || appUser.role === 'admin') {
          const pendingSnap = await getDocs(
            query(collection(db, 'resumes'), where('status', '==', 'pending'))
          );
          setPendingResumes(pendingSnap.size);
        }
      } catch {
        // Firestore may not be configured yet
      }
    };
    fetchStats();
  }, [appUser]);

  if (loading || !appUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const quickLinks = [
    { name: 'Roadmaps', href: '/roadmaps', icon: FiMap, count: stats.roadmaps, color: 'from-primary to-primary-light' },
    { name: 'Projects', href: '/projects', icon: FiCode, count: stats.projects, color: 'from-accent to-yellow-400' },
    { name: 'Mentorship', href: '/mentorship', icon: FiUsers, count: null, color: 'from-primary-dark to-primary' },
    { name: 'Resume', href: '/resume', icon: FiFileText, count: stats.resumes, color: 'from-green-500 to-emerald-400' },
    { name: 'Courses', href: '/courses', icon: FiBookOpen, count: stats.courses, color: 'from-purple-500 to-violet-400' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Welcome Section */}
      <div className="mb-12 relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-1 bg-primary rounded-full" />
              <span className="text-xs font-bold uppercase tracking-widest text-primary-light">Overview</span>
            </div>
            <h1 className="text-4xl font-display font-extrabold text-gray-900 leading-tight">
              Welcome back, <span className="text-gradient">{appUser.displayName}</span>
            </h1>
            <p className="text-gray-500 mt-2 flex items-center gap-2">
              <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded border border-gray-200">{appUser.rollNumber}</span>
              <span className="text-gray-300">|</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${appUser.role === 'admin' ? 'bg-red-500 text-white' : 'bg-primary/10 text-primary'}`}>
                {appUser.role} Account
              </span>
            </p>
          </div>
          
          {/* Quick Stats Summary */}
          <div className="flex gap-4">
            <div className="glass p-4 rounded-2xl shadow-sm min-w-[120px]">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Total Assets</p>
              <p className="text-2xl font-display font-bold text-gray-900">{stats.roadmaps + stats.projects + stats.courses}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Banner */}
      {pendingResumes > 0 && (appUser.role === 'senior' || appUser.role === 'admin') && (
        <Link
          href="/resume"
          className="flex items-center gap-4 p-5 mb-10 rounded-2xl bg-primary text-white shadow-float hover:bg-primary-dark transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center animate-pulse">
            <FiBell size={24} />
          </div>
          <div>
            <p className="font-bold text-lg leading-tight">{pendingResumes} Resumes Awaiting Validation</p>
            <p className="text-white/70 text-sm">Help juniors by providing feedback on their applications.</p>
          </div>
          <FiArrowRight size={20} className="ml-auto group-hover:translate-x-1 transition-transform" />
        </Link>
      )}

      {/* Quick Links Grid */}
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Discovery Hub</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group relative bg-white rounded-3xl p-8 shadow-premium hover:shadow-float border border-gray-100 hover:border-primary/20 transition-all duration-500 hover:-translate-y-2 flex flex-col"
          >
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${link.color} text-white mb-6 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
              <link.icon size={28} />
            </div>
            <h3 className="text-xl font-display font-bold text-gray-900 mb-2">{link.name}</h3>
            {link.count !== null ? (
              <p className="text-sm text-gray-400 mb-4">{link.count} items available</p>
            ) : (
              <p className="text-sm text-gray-400 mb-4">Book deep dives</p>
            )}
            <div className="mt-auto flex items-center gap-2 text-primary text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
              Explore Now <FiArrowRight />
            </div>
            <FiArrowRight className="absolute top-8 right-8 text-gray-200 group-hover:text-primary transition-colors" />
          </Link>
        ))}
        {appUser.role === 'admin' && (
          <Link
            href="/admin"
            className="group relative bg-[#0f172a] rounded-3xl p-8 shadow-premium hover:shadow-float transition-all duration-500 hover:-translate-y-2 flex flex-col text-white"
          >
            <div className="w-14 h-14 rounded-2xl bg-red-500 text-white mb-6 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <FiAward size={28} />
            </div>
            <h3 className="text-xl font-display font-bold mb-2">Admin Control</h3>
            <p className="text-gray-400 text-sm mb-4">Manage users & platform logic.</p>
            <div className="mt-auto flex items-center gap-2 text-red-400 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
              Open Panel <FiArrowRight />
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
