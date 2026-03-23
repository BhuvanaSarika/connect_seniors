'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FiUsers, FiMap, FiCode, FiAward, FiCalendar, FiFileText, FiActivity, FiShield, FiTrendingUp } from 'react-icons/fi';

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

  if (loading) return (
    <div className="h-96 flex flex-col items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full mb-4" />
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Initialising Admin Intel...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      {/* Admin Header */}
      <div className="mb-16 border-b border-slate-100 pb-12">
        <div className="inline-flex items-center gap-2 mb-6">
           <span className="w-10 h-1 bg-red-600 rounded-full" />
           <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Platform Governance</p>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-display font-black text-slate-900 leading-tight mb-4 tracking-tight">
              Administrative <span className="text-red-600 italic">Intelligence.</span>
            </h1>
            <p className="text-slate-500 font-medium leading-relaxed max-w-lg">
              Authorized access to global platform metrics, user transitions, and historical activity logs for ConnectSeniors operations.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">System Status</p>
                <p className="text-sm font-bold text-emerald-600 flex items-center gap-2 justify-end">
                  Operational <FiActivity />
                </p>
             </div>
          </div>
        </div>
      </div>
      
      {/* Primary Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        
        {/* User Population Node */}
        <div className="clean-card p-8 group border-l-4 border-l-slate-900">
           <div className="flex justify-between items-start mb-10">
              <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-900 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                 <FiUsers size={24} />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Population</p>
           </div>
           <div className="flex items-end gap-2 mb-2">
              <p className="text-5xl font-display font-black text-slate-900 leading-none">{stats.users}</p>
              <FiTrendingUp className="text-emerald-500 mb-1" size={20} />
           </div>
           <p className="text-sm text-slate-500 font-medium mb-10">Total registered members</p>
           
           <div className="flex items-center gap-2 pt-6 border-t border-slate-100">
              <div className="flex-1 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Juniors</p>
                 <p className="text-sm font-bold text-slate-900">{stats.juniors}</p>
              </div>
              <div className="flex-1 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Seniors</p>
                 <p className="text-sm font-bold text-slate-900">{stats.seniors}</p>
              </div>
           </div>
        </div>

        {/* Mentorship Health Node */}
        <div className="clean-card p-8 group border-l-4 border-l-primary">
           <div className="flex justify-between items-start mb-10">
              <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-900 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500">
                 <FiCalendar size={24} />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Mentorship</p>
           </div>
           <p className="text-5xl font-display font-black text-slate-900 mb-2 leading-none">{stats.bookings}</p>
           <p className="text-sm text-slate-500 font-medium mb-10">Successful session bookings</p>
           
           <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <FiAward className="text-primary" size={16} />
                 <span className="text-xs font-bold text-slate-600">{stats.mentors} Vetted Mentors</span>
              </div>
              {stats.pendingMentors > 0 && (
                <div className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-widest rounded-full border border-amber-100 animate-pulse">
                  {stats.pendingMentors} Pending
                </div>
              )}
           </div>
        </div>

        {/* Knowledge Index Node */}
        <div className="clean-card p-8 group border-l-4 border-l-red-600">
           <div className="flex justify-between items-start mb-10">
              <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-900 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all duration-500">
                 <FiFileText size={24} />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Knowledge Index</p>
           </div>
           <p className="text-5xl font-display font-black text-slate-900 mb-2 leading-none border-b border-slate-100 pb-4">{stats.resumes + stats.roadmaps + stats.projects}</p>
           <p className="text-sm text-slate-500 font-medium my-10">Total shared technical assets library</p>
           
           <div className="pt-6 border-t border-slate-100">
              <div className="flex justify-between items-center mb-2">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resume Coverage</span>
                 <span className="text-xs font-bold text-slate-900">{Math.round(stats.resumes === 0 ? 0 : (stats.reviewedResumes / stats.resumes) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                 <div className="bg-red-600 h-full rounded-full transition-all duration-1000" style={{ width: `${stats.resumes === 0 ? 0 : (stats.reviewedResumes / stats.resumes) * 100}%` }}></div>
              </div>
           </div>
        </div>
      </div>

      {/* Secondary Resource Metrics */}
      <h2 className="section-label mb-8">Resource Library Coverage</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
         <div className="clean-card p-10 flex items-center gap-8 hover:bg-slate-50 transition-colors cursor-default">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center border border-slate-200">
               <FiMap size={32} />
            </div>
            <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Architecture Roadmaps</p>
               <p className="text-4xl font-display font-black text-slate-900 leading-none">{stats.roadmaps}</p>
               <p className="text-xs text-slate-500 mt-2 font-medium">Verified technical learning paths</p>
            </div>
         </div>
         <div className="clean-card p-10 flex items-center gap-8 hover:bg-slate-50 transition-colors cursor-default">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center border border-slate-200">
               <FiCode size={32} />
            </div>
            <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Project Blueprints</p>
               <p className="text-4xl font-display font-black text-slate-900 leading-none">{stats.projects}</p>
               <p className="text-xs text-slate-500 mt-2 font-medium">Curated technical templates</p>
            </div>
         </div>
      </div>

      {/* Admin Quick Links / Actions */}
      <div className="pt-12 border-t border-slate-200 flex justify-between items-center bg-transparent mt-12">
         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Platform Build: 2.1.0-PRO-FINAL</p>
         <div className="flex items-center gap-3">
            <FiShield className="text-red-600" size={14} />
            <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Root Authority Verified</span>
         </div>
      </div>
    </div>
  );
}
