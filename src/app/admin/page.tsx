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
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Platform Overview</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        
        {/* User Stats Node */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
          <div>
             <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-red-50 text-red-600 rounded-xl"><FiUsers size={24} /></div>
               <span className="text-sm font-bold text-gray-400">Total Users</span>
             </div>
             <p className="text-4xl font-extrabold text-gray-900 mb-2">{stats.users}</p>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium pt-4 border-t border-gray-100">
             <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{stats.juniors} Juniors</span>
             <span className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{stats.seniors} Seniors</span>
          </div>
        </div>

        {/* Mentorship Stats Node */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
          <div>
             <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-primary/10 text-primary rounded-xl"><FiCalendar size={24} /></div>
               <span className="text-sm font-bold text-gray-400">Mentorships</span>
             </div>
             <p className="text-4xl font-extrabold text-gray-900 mb-2">{stats.bookings}</p>
             <p className="text-sm text-gray-500">Total sessions booked</p>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium pt-4 border-t border-gray-100 mt-4">
             <span className="flex items-center gap-1.5 text-gray-600"><FiAward /> {stats.mentors} Mentors</span>
             {stats.pendingMentors > 0 && <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded-md">{stats.pendingMentors} Pending</span>}
          </div>
        </div>

        {/* Resumes Stats Node */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
          <div>
             <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-fuchsia-50 text-fuchsia-600 rounded-xl"><FiFileText size={24} /></div>
               <span className="text-sm font-bold text-gray-400">Resumes</span>
             </div>
             <p className="text-4xl font-extrabold text-gray-900 mb-2">{stats.resumes}</p>
             <p className="text-sm text-gray-500">Total resumes uploaded</p>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium pt-4 border-t border-gray-100 mt-4">
             <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div className="bg-fuchsia-500 h-2.5 rounded-full" style={{ width: `${stats.resumes === 0 ? 0 : (stats.reviewedResumes / stats.resumes) * 100}%` }}></div>
             </div>
             <span className="text-fuchsia-700 whitespace-nowrap ml-2">{stats.reviewedResumes} Reviewed</span>
          </div>
        </div>

        {/* Resources Stats Node */}
        <div className="col-span-1 sm:col-span-2 lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-6">
           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center justify-between">
              <div>
                 <p className="text-gray-500 text-sm font-bold mb-1">Roadmaps</p>
                 <p className="text-3xl font-extrabold text-gray-900">{stats.roadmaps}</p>
              </div>
              <div className="text-gray-300"><FiMap size={36} /></div>
           </div>
           
           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center justify-between">
              <div>
                 <p className="text-gray-500 text-sm font-bold mb-1">Projects</p>
                 <p className="text-3xl font-extrabold text-gray-900">{stats.projects}</p>
              </div>
              <div className="text-gray-300"><FiCode size={36} /></div>
           </div>
        </div>

      </div>
    </div>
  );
}
