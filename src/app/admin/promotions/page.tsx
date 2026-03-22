'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AppUser } from '@/types';
import { FiTrendingUp, FiAlertCircle } from 'react-icons/fi';

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
    if (!confirm(`Are you sure you want to promote ${toPromote.length} juniors in cohort '${cohortPrefix}' to seniors?`)) return;

    setPromoting(true);
    try {
      const batch = writeBatch(db);
      toPromote.forEach(user => {
        const userRef = doc(db, 'users', user.uid);
        batch.update(userRef, { role: 'senior' });
      });
      await batch.commit();
      alert(`Successfully promoted ${toPromote.length} users to Senior role!`);
      
      setUsers(users.map(u => 
        u.role === 'junior' && u.rollNumber.startsWith(cohortPrefix) 
          ? { ...u, role: 'senior' } 
          : u
      ));
    } catch (err) {
      console.error(err);
      alert('Promotion failed');
    }
    setPromoting(false);
  };

  if (fetching) return <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto mt-20" />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Promote Juniors</h1>
        <p className="text-gray-500 text-sm mt-1">Bulk promote entire junior cohorts to the senior role for the new academic year.</p>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 flex items-start gap-3 text-red-700 text-sm">
        <FiAlertCircle size={20} className="shrink-0 mt-0.5" />
        <p>
          <strong>Caution:</strong> This action permanently grants senior privileges (roadmap creation, resume reviews, 1:1 mentorship capabilities) to all users in the selected cohort. Make sure you also update the "Roll Number Ranges" to assign the correct roles for future registrations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cohorts.length === 0 ? (
          <p className="text-gray-400">No junior cohorts found.</p>
        ) : (
          cohorts.map(cohort => {
            const count = juniors.filter(u => u.rollNumber.startsWith(cohort)).length;
            return (
              <div key={cohort} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-blue-50 text-primary flex items-center justify-center font-bold text-2xl mb-4">
                  {cohort}
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-1">Cohort '{cohort}'</h3>
                <p className="text-sm text-gray-500 mb-6">{count} eligible junior(s)</p>
                
                <button
                  onClick={() => handlePromote(cohort)}
                  disabled={promoting}
                  className="w-full py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FiTrendingUp /> Promote to Senior
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
