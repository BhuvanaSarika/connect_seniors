'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AppUser } from '@/types';
import { FiUser, FiMail, FiBook, FiClock, FiStar, FiCalendar, FiMessageSquare, FiTrendingUp, FiCheckCircle } from 'react-icons/fi';
import Link from 'next/link';

export default function MentorshipClient() {
  const { appUser, loading } = useAuth();
  const router = useRouter();
  const [mentors, setMentors] = useState<AppUser[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !appUser) router.push('/login');
  }, [loading, appUser, router]);

  useEffect(() => {
    if (!appUser) return;
    const fetchMentors = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'senior'));
        const snap = await getDocs(q);
        setMentors(snap.docs.map(d => ({ uid: d.id, ...d.data() } as AppUser)));
      } catch (err) { console.error(err); }
      setFetching(false);
    };
    fetchMentors();
  }, [appUser]);

  const handleRequest = async (mentorId: string) => {
    if (!appUser) return;
    try {
      const mentorRef = doc(db, 'users', mentorId);
      await updateDoc(mentorRef, {
        mentorshipRequests: arrayUnion(appUser.uid)
      });
      alert('Handshake request transmitted. Awaiting senior authorization.');
    } catch (err) { alert('Operational failure: could not transmit request.'); }
  };

  if (loading || !appUser) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 text-slate-900">
      {/* Module Header */}
      <div className="mb-16 border-b border-slate-100 pb-12">
        <div className="inline-flex items-center gap-2 mb-6">
           <span className="w-10 h-1 bg-primary rounded-full" />
           <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Human Capital</p>
        </div>
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-display font-black text-slate-900 leading-tight mb-4 tracking-tight">
            Senior <span className="text-slate-900/40 italic">Mentorship.</span>
          </h1>
          <p className="text-slate-500 font-medium leading-relaxed">
             Direct access to vetted industry veterans. Facilitating high-bandwidth knowledge transfer and professional guidance for high-potential engineering talent.
          </p>
        </div>
      </div>

      {/* Mentor Index */}
      {fetching ? (
        <div className="flex justify-center py-24"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : mentors.length === 0 ? (
        <div className="clean-card py-32 text-center border-slate-200 bg-slate-50/10">
          <FiUser className="mx-auto text-slate-100 mb-6" size={48} />
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No senior mentors are currently active in the exchange.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mentors.map((mentor) => (
            <div key={mentor.uid} className="clean-card p-10 group flex flex-col hover:border-slate-900 transition-all duration-300">
              <div className="flex items-center gap-6 mb-10">
                <div className="w-20 h-20 rounded-2xl bg-slate-50 text-slate-900 flex items-center justify-center border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 overflow-hidden relative">
                   {mentor.profilePicUrl ? (
                     <img src={mentor.profilePicUrl} alt="" className="w-full h-full object-cover group-hover:opacity-40" />
                   ) : (
                     <FiUser size={32} />
                   )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-display group-hover:text-primary transition-colors">{mentor.displayName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="px-2 py-0.5 bg-slate-50 text-[8px] font-black uppercase tracking-widest border border-slate-100 rounded text-slate-400">Senior Engineer</span>
                     <FiCheckCircle size={12} className="text-primary" />
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-4 mb-10 pb-10 border-b border-slate-100">
                 <div className="flex items-center gap-3 text-slate-400">
                    <FiMail size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-widest truncate">{mentor.email}</span>
                 </div>
                 <div className="flex items-center gap-3 text-slate-400">
                    <FiStar size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Cloud Architecture • React Ecosystem</span>
                 </div>
                 <div className="flex items-center gap-3 text-slate-400">
                    <FiClock size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Available for Session Sync</span>
                 </div>
              </div>

              <div className="space-y-3">
                 <button
                   onClick={() => handleRequest(mentor.uid)}
                   disabled={mentor.mentorshipRequests?.includes(appUser.uid)}
                   className="btn-primary w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/10 disabled:opacity-20 flex items-center justify-center gap-3"
                 >
                   <FiCalendar size={14} />
                   {mentor.mentorshipRequests?.includes(appUser.uid) ? 'Awaiting Authorization' : 'Request Connection'}
                 </button>
                 <Link
                   href={`/mentorship/${mentor.uid}`}
                   className="flex items-center justify-center gap-3 w-full py-4 rounded-xl border border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-900 hover:text-white transition-all duration-300"
                 >
                   <FiUser size={14} />
                   Inspect Dossier
                 </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
