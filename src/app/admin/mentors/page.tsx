'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MentorProfile } from '@/types';
import { FiCheckCircle, FiMinusCircle, FiTrash2, FiInfo, FiShield, FiUserCheck } from 'react-icons/fi';

export default function AdminMentorsPage() {
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const snap = await getDocs(collection(db, 'mentorProfiles'));
        setMentors(snap.docs.map(d => ({ uid: d.id, ...d.data() } as MentorProfile)));
      } catch (err) { console.error(err); }
      setFetching(false);
    };
    fetchMentors();
  }, []);

  const handleToggleApproval = async (uid: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'mentorProfiles', uid), { isApproved: !currentStatus });
      setMentors(mentors.map(m => m.uid === uid ? { ...m, isApproved: !currentStatus } : m));
    } catch (err) {
      console.error(err);
      alert('Operational failure: could not update governance status.');
    }
  };

  const handleDeleteProfile = async (uid: string) => {
    if (!confirm('Operational security: confirm permanent deletion of this mentor profile?')) return;
    try {
      await deleteDoc(doc(db, 'mentorProfiles', uid));
      setMentors(mentors.filter(m => m.uid !== uid));
    } catch (err) {
      console.error(err);
      alert('Operational failure: could not purge technical asset.');
    }
  };

  if (fetching) return (
    <div className="flex justify-center py-24">
      <div className="animate-spin w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full" />
    </div>
  );

  const pending = mentors.filter(m => !m.isApproved);
  const approved = mentors.filter(m => m.isApproved);

  return (
    <div className="text-slate-900">
      <div className="mb-12">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Platform Governance</p>
        <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight mb-2">Mentor Authorizations</h1>
        <p className="text-slate-500 font-medium text-sm max-w-2xl">
           Verify technical expertise and academic credentials for senior mentorship applicants. Approved profiles are indexed into the public expert network.
        </p>
      </div>

      {pending.length > 0 && (
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-8">
             <div className="w-10 h-1 bg-primary rounded-full" />
             <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Review Queue ({pending.length})</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {pending.map(mentor => (
              <div key={mentor.uid} className="clean-card p-8 flex flex-col md:flex-row gap-8 justify-between items-start md:items-center border-primary/20 bg-primary/[0.02]">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-display font-black text-xl">
                      {mentor.displayName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg leading-none mb-1">{mentor.displayName}</h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Roll Number: {mentor.rollNumber}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-3xl mb-6">{mentor.bio}</p>
                  <div className="flex flex-wrap gap-2">
                    {mentor.expertise.map((exp, i) => (
                      <span key={i} className="px-2.5 py-1 bg-white text-slate-900 text-[9px] font-bold uppercase tracking-widest rounded border border-slate-200">{exp}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 shrink-0">
                  <button onClick={() => handleToggleApproval(mentor.uid, mentor.isApproved)} className="btn-primary px-8 py-3 text-[10px] shadow-xl shadow-primary/20">
                    <FiCheckCircle className="mr-2" /> Authorize Access
                  </button>
                  <button onClick={() => handleDeleteProfile(mentor.uid)} className="p-3 rounded-xl bg-white text-slate-400 hover:bg-red-600 hover:text-white transition-all border border-slate-100 shadow-sm">
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-4 mb-8">
           <div className="w-10 h-1 bg-slate-200 rounded-full" />
           <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Active Directory ({approved.length})</h2>
        </div>

        {approved.length === 0 ? (
          <div className="clean-card py-20 text-center border-slate-100 bg-slate-50/10">
             <FiShield className="mx-auto text-slate-100 mb-6" size={48} />
             <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">No mentors have been authorized for the global network yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {approved.map(mentor => (
              <div key={mentor.uid} className="clean-card p-6 flex items-center justify-between group hover:border-slate-900 transition-all">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-900 flex items-center justify-center font-display font-black text-lg border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all">
                      {mentor.displayName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{mentor.displayName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                         <FiUserCheck className="text-emerald-500" size={10} />
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">System Authorized</span>
                      </div>
                    </div>
                 </div>
                 <button onClick={() => handleToggleApproval(mentor.uid, mentor.isApproved)} className="p-2.5 rounded-lg text-slate-400 hover:bg-slate-900 hover:text-white transition-all border border-slate-100">
                    <FiMinusCircle size={14} />
                 </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
