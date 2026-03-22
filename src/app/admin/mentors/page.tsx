'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MentorProfile } from '@/types';
import { FiCheckCircle, FiXCircle, FiTrash2 } from 'react-icons/fi';

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
      alert('Failed to update status');
    }
  };

  const handleDeleteProfile = async (uid: string) => {
    if (!confirm('Are you sure you want to delete this mentor profile? (The user account remains)')) return;
    try {
      await deleteDoc(doc(db, 'mentorProfiles', uid));
      setMentors(mentors.filter(m => m.uid !== uid));
    } catch (err) {
      console.error(err);
      alert('Failed to delete profile');
    }
  };

  if (fetching) return <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto mt-20" />;

  const pending = mentors.filter(m => !m.isApproved);
  const approved = mentors.filter(m => m.isApproved);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mentor Approvals</h1>
        <p className="text-gray-500 text-sm mt-1">Review and approve senior mentor profiles before they appear on the public mentorship directory.</p>
      </div>

      {pending.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Pending Approvals ({pending.length})</h2>
          <div className="space-y-4">
            {pending.map(mentor => (
              <div key={mentor.uid} className="bg-yellow-50/50 rounded-xl shadow-sm border border-yellow-200 p-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                  <h3 className="font-bold text-gray-900">{mentor.displayName} <span className="text-sm font-normal text-gray-500">({mentor.rollNumber})</span></h3>
                  <p className="text-sm text-gray-700 mt-2">{mentor.bio}</p>
                  <div className="flex gap-2 mt-3">
                    {mentor.expertise.map((exp, i) => (
                      <span key={i} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded font-medium">{exp}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleToggleApproval(mentor.uid, mentor.isApproved)} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700">
                    <FiCheckCircle /> Approve
                  </button>
                  <button onClick={() => handleDeleteProfile(mentor.uid)} className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50">
                    <FiTrash2 /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Approved Mentors ({approved.length})</h2>
        {approved.length === 0 ? (
          <p className="text-gray-500 text-sm">No approved mentors yet.</p>
        ) : (
          <div className="space-y-4">
            {approved.map(mentor => (
              <div key={mentor.uid} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                 <div>
                  <h3 className="font-bold text-gray-900">{mentor.displayName} <span className="text-sm font-normal text-gray-500">({mentor.rollNumber})</span></h3>
                  <div className="flex gap-2 mt-2">
                    {mentor.expertise.map((exp, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-medium">{exp}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleToggleApproval(mentor.uid, mentor.isApproved)} className="flex items-center gap-1.5 px-4 py-2 justify-center border border-yellow-500 text-yellow-600 rounded-lg text-sm font-semibold hover:bg-yellow-50">
                    <FiXCircle /> Revoke Access
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
