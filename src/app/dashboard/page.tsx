'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { FiMap, FiCode, FiUsers, FiFileText, FiBookOpen, FiArrowRight, FiBell, FiShield, FiTrendingUp } from 'react-icons/fi';

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
        // noop
      }
    };
    fetchStats();
  }, [appUser]);

  if (loading || !appUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const discoveryHub = [
    { name: 'Technical Roadmaps', href: '/roadmaps', icon: FiMap, desc: 'Guided mentorship paths.', items: stats.roadmaps },
    { name: 'Project Blueprints', href: '/projects', icon: FiCode, desc: 'AI-enhanced starter ideas.', items: stats.projects },
    { name: 'Senior Mentorship', href: '/mentorship', icon: FiUsers, desc: 'Schedule technical deep-dives.', items: null },
    { name: 'Resume Validation', href: '/resume', icon: FiFileText, desc: 'Expert screening feedback.', items: stats.resumes },
    { name: 'Specialized Courses', href: '/courses', icon: FiBookOpen, desc: 'Curated technical curriculum.', items: stats.courses },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      {/* Professional Header */}
      <div className="mb-16">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 mb-6">
               <span className="w-10 h-1 bg-slate-900 rounded-full" />
               <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Command Center</p>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-black text-slate-900 leading-tight mb-4 tracking-tight">
              Welcome back, <br />
              <span className="text-primary italic lowercase">@{appUser.displayName.replace(/\s+/g, '').toLowerCase()}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                Roll: {appUser.rollNumber || 'N/A'}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border ${
                appUser.role === 'admin' 
                  ? 'bg-red-50 text-red-600 border-red-100' 
                  : 'bg-primary/5 text-primary border-primary/10'
              }`}>
                {appUser.role} Authorization
              </span>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="clean-card p-6 min-w-[160px] flex flex-col justify-between">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Discovery Index</p>
              <div className="flex items-end justify-between">
                <p className="text-4xl font-display font-black text-slate-900 leading-none">
                  {stats.roadmaps + stats.projects + stats.courses}
                </p>
                <FiTrendingUp className="text-primary" size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Notifications */}
      {pendingResumes > 0 && (appUser.role === 'senior' || appUser.role === 'admin') && (
        <Link
          href="/resume"
          className="clean-card mb-12 p-6 md:p-8 hover:border-primary/50 transition-all group relative overflow-hidden flex flex-col md:flex-row md:items-center gap-6"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-primary/10 transition-all" />
          <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
            <FiBell size={24} />
          </div>
          <div className="relative z-10 flex-1">
            <h3 className="text-xl font-display font-bold text-slate-900 mb-1">Resumes Awaiting Validation</h3>
            <p className="text-slate-500 font-medium">There are <span className="text-primary font-bold">{pendingResumes} submissions</span> requiring your professional assessment.</p>
          </div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest group-hover:gap-4 transition-all whitespace-nowrap">
            Assist Now <FiArrowRight />
          </div>
        </Link>
      )}

      {/* Discovery Hub Grid */}
      <div className="mb-20">
        <div className="flex items-center justify-between mb-8">
           <p className="section-label mb-0">Platform Discovery Hub</p>
           <div className="h-px flex-1 bg-slate-100 mx-6 hidden md:block" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {discoveryHub.map((link, i) => (
            <Link
              key={i}
              href={link.href}
              className="clean-card p-8 hover:border-primary/40 transition-all duration-300 group flex flex-col min-h-[220px]"
            >
              <div className="flex items-start justify-between mb-8">
                 <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-900 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                    <link.icon size={24} />
                 </div>
                 {link.items !== null && (
                   <span className="text-[10px] font-bold text-slate-400 border border-slate-100 px-2 py-1 rounded-md">
                      {link.items} Assets
                   </span>
                 )}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{link.name}</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">{link.desc}</p>
              <div className="mt-auto inline-flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                Access Module <FiArrowRight />
              </div>
            </Link>
          ))}
          
          {appUser.role === 'admin' && (
            <Link
              href="/admin"
              className="clean-card p-8 bg-slate-900 border-slate-800 hover:border-red-500 transition-all group flex flex-col min-h-[220px]"
            >
               <div className="flex items-start justify-between mb-8">
                 <div className="w-12 h-12 rounded-xl bg-white/10 text-white flex items-center justify-center group-hover:bg-red-500 transition-all duration-500">
                    <FiShield size={24} />
                 </div>
                 <span className="text-[10px] font-bold text-red-500/80 border border-white/10 px-2 py-1 rounded-md">
                    Admin Access
                 </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Platform Administration</h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">Manage authorized cohorts, roll numbers, and senior hierarchies.</p>
              <div className="mt-auto inline-flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-widest group-hover:gap-4 transition-all">
                Open Controls <FiArrowRight />
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Simplified Footer / Copyright */}
      <div className="pt-12 border-t border-slate-100 flex justify-between items-center bg-transparent">
         <p className="text-xs text-slate-400 font-medium">ConnectSeniors Virtual Terminal v2.1.0</p>
         <div className="flex gap-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Platform Online</span>
         </div>
      </div>
    </div>
  );
}
