'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FiUsers, FiMap, FiCode, FiAward } from 'react-icons/fi';

export default function AdminOverview() {
  const [stats, setStats] = useState({
    users: 0, roadmaps: 0, projects: 0, mentors: 0, pendingMentors: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [users, roadmaps, projects, mentors] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'roadmaps')),
          getDocs(collection(db, 'projectIdeas')),
          getDocs(collection(db, 'mentorProfiles'))
        ]);
        
        const pendingMentors = mentors.docs.filter(d => !d.data().isApproved).length;

        setStats({
          users: users.size,
          roadmaps: roadmaps.size,
          projects: projects.size,
          mentors: mentors.size,
          pendingMentors
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
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-2 text-primary-dark">
            <FiUsers size={20} /> <span className="font-semibold">Users</span>
          </div>
          <p className="text-3xl font-bold">{stats.users}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-2 text-primary-dark">
            <FiMap size={20} /> <span className="font-semibold">Roadmaps</span>
          </div>
          <p className="text-3xl font-bold">{stats.roadmaps}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-2 text-primary-dark">
            <FiCode size={20} /> <span className="font-semibold">Projects</span>
          </div>
          <p className="text-3xl font-bold">{stats.projects}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-2 text-primary-dark">
            <FiAward size={20} /> <span className="font-semibold">Mentors</span>
          </div>
          <p className="text-3xl font-bold">{stats.mentors}</p>
          {stats.pendingMentors > 0 && (
            <p className="text-xs text-red-500 mt-2 font-medium bg-red-50 px-2 py-1 rounded inline-block">
              {stats.pendingMentors} pending approval
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
