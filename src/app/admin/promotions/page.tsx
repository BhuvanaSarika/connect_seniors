'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AppUser } from '@/types';
import { FiTrendingUp, FiAlertCircle, FiShield, FiInfo } from 'react-icons/fi';

export default function AdminPromotionsPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [fetching, setFetching] = useState(true);
  const [promoting, setPromoting] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as AppUser)));
      } catch (err) { console.error(err); }
      setFetching(false);
    };
    fetchUsers();
  }, []);

  const juniors = users.filter(u => u.role === 'junior');
  const cohorts = Array.from(new Set(juniors.map(u => u.rollNumber.substring(0, 2)))); // Extract '22', '23', '24'

  const handlePromote = async (cohortPrefix: string) => {
    const toPromote = juniors.filter(u => u.rollNumber.startsWith(cohortPrefix));
    if (!confirm(`Operational security: confirm bulk promotion of ${toPromote.length} assets in cohort '${cohortPrefix}' to Senior Grade?`)) return;

    setPromoting(true);
    try {
      const batch = writeBatch(db);
      toPromote.forEach(user => {
        const userRef = doc(db, 'users', user.uid);
        batch.update(userRef, { role: 'senior' });
      });
      await batch.commit();
      alert(`Operational success: Promoted ${toPromote.length} assets to Senior Grade.`);
      
      setUsers(users.map(u => 
        u.role === 'junior' && u.rollNumber.startsWith(cohortPrefix) 
          ? { ...u, role: 'senior' } 
          : u
      ));
    } catch (err) {
      console.error(err);
      alert('Operational failure: could not commit promotion protocol.');
    }
    setPromoting(false);
  };

  if (fetching) return (
    <div className="flex justify-center py-24">
      <div className="animate-spin w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="text-slate-900">
      <div className="mb-12">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">System Lifecycle Management</p>
        <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight mb-2">Grade Promotions</h1>
        <p className="text-slate-500 font-medium text-sm max-w-2xl">
           Execute bulk role migrations for academic cohorts. This protocol transitions Junior Grade assets to Senior Grade, unlocking advanced platform privileges.
        </p>
      </div>

      <div className="bg-slate-900 rounded-2xl p-6 mb-12 flex items-start gap-4 border border-slate-800 shadow-xl shadow-slate-200/50">
        <FiShield size={24} className="text-primary shrink-0 mt-1" />
        <div>
           <p className="text-[10px] font-bold text-white uppercase tracking-widest mb-2">Security Warning</p>
           <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-3xl">
              Promotion is a privilege-escalating event. Assets will gain authorization for: <code className="text-primary bg-white/5 px-2 py-0.5 rounded mx-1">Architecture Creation</code>, <code className="text-primary bg-white/5 px-2 py-0.5 rounded mx-1">Handshake Authorization</code>, and <code className="text-primary bg-white/5 px-2 py-0.5 rounded mx-1">Document Reviews</code>.
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {cohorts.length === 0 ? (
          <div className="col-span-full py-24 text-center clean-card bg-slate-50/50 border-slate-100">
             <FiInfo className="mx-auto text-slate-100 mb-6" size={48} />
             <p className="text-slate-300 text-[10px] font-bold uppercase tracking-widest">No eligible Junior cohorts indexed.</p>
          </div>
        ) : (
          cohorts.map(cohort => {
            const count = juniors.filter(u => u.rollNumber.startsWith(cohort)).length;
            return (
              <div key={cohort} className="clean-card p-10 flex flex-col items-center text-center group hover:border-slate-900 transition-all">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-display font-black text-2xl mb-6 shadow-xl shadow-slate-900/10 group-hover:bg-primary transition-all">
                  {cohort}
                </div>
                <h3 className="font-display font-black text-slate-900 text-lg mb-1 tracking-tight">Cohort {cohort}X</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-10">{count} Eligible Assets</p>
                
                <button
                  onClick={() => handlePromote(cohort)}
                  disabled={promoting}
                  className="btn-primary w-full py-3 text-[10px] shadow-xl shadow-primary/20 disabled:opacity-20 flex items-center justify-center gap-2"
                >
                  <FiTrendingUp /> Execute Promotion
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-12 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2 opacity-50">
         <p>Lifecycle Protocol: Promotion</p>
         <p>Authorized Admin Terminal Only</p>
      </div>
    </div>
  );
}
