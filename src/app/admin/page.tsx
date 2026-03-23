'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FiUsers, FiMap, FiCode, FiAward, FiCalendar, FiFileText } from 'react-icons/fi';

export default function AdminOverview() {
  const [stats, setStats] = useState({
    users: 0, juniors: 0, seniors: 0, roadmaps: 0, projects: 0, mentors: 0, pendingMentors: 0, bookings: 0, resumes: 0, reviewedResumes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [users, roadmaps, projects, mentors, bookings, resumes] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'roadmaps')),
          getDocs(collection(db, 'projectIdeas')),
          getDocs(collection(db, 'mentorProfiles')),
          getDocs(collection(db, 'bookings')),
          getDocs(collection(db, 'resumes'))
        ]);
        
        const pendingMentors = mentors.docs.filter(d => !d.data().isApproved).length;
        const juniorsCount = users.docs.filter(u => u.data().role === 'junior').length;
        const seniorsCount = users.docs.filter(u => u.data().role === 'senior').length;
        const reviewedResumesCount = resumes.docs.filter(r => r.data().reviews && r.data().reviews.length > 0).length;

        setStats({
          users: users.size,
          juniors: juniorsCount,
          seniors: seniorsCount,
          roadmaps: roadmaps.size,
          projects: projects.size,
          mentors: mentors.size,
          pendingMentors: pendingMentors,
          bookings: bookings.size,
          resumes: resumes.size,
          reviewedResumes: reviewedResumesCount
        });
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) return <div className="h-64 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-1 bg-red-500 rounded-full" />
            <span className="text-xs font-bold uppercase tracking-widest text-red-500/60">Platform Intelligence</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-gray-900 leading-tight">
            Platform <span className="text-gradient">Overview</span>
          </h1>
          <p className="text-gray-500 mt-2 max-w-lg">
            Real-time analytics and system-wide metrics for ConnectSeniors. Monitor community growth and engagement.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        
        {/* User Stats Node */}
        <div className="group relative bg-white rounded-[2.5rem] p-8 shadow-premium border border-gray-100 overflow-hidden hover:shadow-float transition-all duration-500">
           <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16 transition-all group-hover:scale-150" />
           <div className="relative z-10">
              <div className="flex justify-between items-start mb-10">
                <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shadow-inner">
                   <FiUsers size={28} />
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-2">User Population</span>
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                 <p className="text-5xl font-display font-extrabold text-gray-900">{stats.users}</p>
                 <span className="text-xs font-bold text-emerald-500">+12%</span>
              </div>
              <p className="text-sm text-gray-500 font-medium mb-8">Registered community members</p>
              
              <div className="flex items-center gap-3 pt-6 border-t border-gray-50">
                 <div className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest">{stats.juniors} Juniors</div>
                 <div className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-widest">{stats.seniors} Seniors</div>
              </div>
           </div>
        </div>

        {/* Mentorship Stats Node */}
        <div className="group relative bg-white rounded-[2.5rem] p-8 shadow-premium border border-gray-100 overflow-hidden hover:shadow-float transition-all duration-500">
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-all group-hover:scale-150" />
           <div className="relative z-10">
              <div className="flex justify-between items-start mb-10">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                   <FiCalendar size={28} />
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-2">Active Mentorship</span>
              </div>
              <p className="text-5xl font-display font-extrabold text-gray-900 mb-2">{stats.bookings}</p>
              <p className="text-sm text-gray-500 font-medium mb-8">Successful sessions booked</p>
              
              <div className="flex items-center gap-3 pt-6 border-t border-gray-50">
                 <div className="flex items-center gap-2 text-gray-600 text-[10px] font-bold uppercase tracking-widest">
                    <FiAward className="text-primary" /> {stats.mentors} Mentors
                 </div>
                 {stats.pendingMentors > 0 && (
                   <div className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-widest animate-pulse">
                     {stats.pendingMentors} Pending Approval
                   </div>
                 )}
              </div>
           </div>
        </div>

        {/* Content Stats Node */}
        <div className="group relative bg-white rounded-[2.5rem] p-8 shadow-premium border border-gray-100 overflow-hidden hover:shadow-float transition-all duration-500">
           <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/5 rounded-full -mr-16 -mt-16 transition-all group-hover:scale-150" />
           <div className="relative z-10">
              <div className="flex justify-between items-start mb-10">
                <div className="w-14 h-14 rounded-2xl bg-fuchsia-100 text-fuchsia-600 flex items-center justify-center shadow-inner">
                   <FiFileText size={28} />
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-2">Knowledge Assets</span>
              </div>
              <p className="text-5xl font-display font-extrabold text-gray-900 mb-2">{stats.resumes + stats.roadmaps + stats.projects}</p>
              <p className="text-sm text-gray-500 font-medium mb-10">Shared resources and guides</p>
              
              <div className="space-y-4 pt-6 border-t border-gray-50">
                 <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                    <span>Research Coverage</span>
                    <span>{Math.round(stats.resumes === 0 ? 0 : (stats.reviewedResumes / stats.resumes) * 100)}%</span>
                 </div>
                 <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-fuchsia-500 h-full rounded-full transition-all duration-1000" style={{ width: `${stats.resumes === 0 ? 0 : (stats.reviewedResumes / stats.resumes) * 100}%` }}></div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-premium flex items-center gap-8">
            <div className="w-20 h-20 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
               <FiMap size={36} />
            </div>
            <div>
               <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Career Paths</p>
               <p className="text-3xl font-display font-extrabold text-gray-900">{stats.roadmaps}</p>
               <p className="text-xs text-gray-500 mt-1 font-medium">Active roadmaps in library</p>
            </div>
         </div>
         <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-premium flex items-center gap-8">
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
               <FiCode size={36} />
            </div>
            <div>
               <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Project Nodes</p>
               <p className="text-3xl font-display font-extrabold text-gray-900">{stats.projects}</p>
               <p className="text-xs text-gray-500 mt-1 font-medium">Curated project templates</p>
            </div>
         </div>
      </div>
    </div>
  );
}
