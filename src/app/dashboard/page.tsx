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
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary-dark">
          Welcome back, <span className="text-accent">{appUser.displayName}</span>
        </h1>
        <p className="text-gray-500 mt-1">
          Roll Number: <span className="font-mono font-semibold text-primary">{appUser.rollNumber}</span>
          <span className="ml-3 px-2 py-0.5 rounded-full text-xs font-semibold capitalize bg-primary text-white">
            {appUser.role}
          </span>
        </p>
      </div>

      {/* Notifications Banner */}
      {pendingResumes > 0 && (appUser.role === 'senior' || appUser.role === 'admin') && (
        <Link
          href="/resume"
          className="flex items-center gap-3 p-4 mb-8 rounded-xl bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors"
        >
          <FiBell size={20} />
          <span className="font-medium">
            {pendingResumes} resume{pendingResumes > 1 ? 's' : ''} pending review
          </span>
          <FiArrowRight size={16} className="ml-auto" />
        </Link>
      )}

      {/* Quick Links Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group relative bg-white rounded-2xl p-6 shadow-md hover:shadow-xl border border-muted/20 hover:border-primary-light/50 transition-all duration-300 hover:-translate-y-1"
          >
            <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${link.color} text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
              <link.icon size={24} />
            </div>
            <h3 className="text-lg font-bold text-primary-dark mb-1">{link.name}</h3>
            {link.count !== null && (
              <p className="text-sm text-gray-400">{link.count} items</p>
            )}
            <FiArrowRight className="absolute top-6 right-6 text-muted group-hover:text-primary transition-colors" />
          </Link>
        ))}
        {appUser.role === 'admin' && (
          <Link
            href="/admin"
            className="group relative bg-white rounded-2xl p-6 shadow-md hover:shadow-xl border border-muted/20 hover:border-red-300 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-red-500 to-rose-400 text-white mb-4 shadow-lg group-hover:scale-110 transition-transform">
              <FiAward size={24} />
            </div>
            <h3 className="text-lg font-bold text-primary-dark mb-1">Admin Panel</h3>
            <p className="text-sm text-gray-400">Manage platform</p>
            <FiArrowRight className="absolute top-6 right-6 text-muted group-hover:text-red-500 transition-colors" />
          </Link>
        )}
      </div>
    </div>
  );
}
