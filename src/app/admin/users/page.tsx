'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AppUser } from '@/types';
import { FiSearch, FiMail, FiCheckCircle, FiXCircle } from 'react-icons/fi';

export default function AdminUsersDirectory() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUids, setSelectedUids] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      setUsers(snap.docs.map(d => ({ ...d.data(), uid: d.id } as AppUser)).sort((a,b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()));
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = u.displayName.toLowerCase().includes(search.toLowerCase()) || u.rollNumber.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchStatus = statusFilter === 'all' || (statusFilter === 'active' && u.status !== 'suspended') || (statusFilter === 'suspended' && u.status === 'suspended');
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const handleToggleStatus = async (user: AppUser) => {
    if (user.role === 'admin') return alert("Cannot suspend admins.");
    setActionLoading(user.uid);
    try {
      const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
      await updateDoc(doc(db, 'users', user.uid), { status: newStatus });
      setUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, status: newStatus } : u));
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
    setActionLoading(null);
  };

  const toggleSelection = (uid: string) => {
    const newSet = new Set(selectedUids);
    if (newSet.has(uid)) newSet.delete(uid);
    else newSet.add(uid);
    setSelectedUids(newSet);
  };

  const handleSelectAll = () => {
    if (selectedUids.size === filteredUsers.length) setSelectedUids(new Set());
    else setSelectedUids(new Set(filteredUsers.map(u => u.uid)));
  };

  const handleSendEmail = () => {
    if (selectedUids.size === 0) return;
    const selectedUsers = users.filter(u => selectedUids.has(u.uid));
    const emails = selectedUsers.map(u => u.email).join(',');
    window.location.href = `mailto:?bcc=${emails}&subject=Message from ConnectSeniors Admin`;
  };

  if (loading) return <div className="h-64 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
         <div>
           <h1 className="text-2xl font-bold text-gray-900 leading-tight">User Directory</h1>
           <p className="text-gray-500 text-sm mt-1">Manage all students and send mass communications.</p>
         </div>
         <button 
           onClick={handleSendEmail} 
           disabled={selectedUids.size === 0}
           className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold disabled:opacity-50 hover:bg-primary-dark transition-colors"
         >
           <FiMail /> Mass Email ({selectedUids.size})
         </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
         <div className="relative flex-1">
           <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
           <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, roll no..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-red-500 text-sm" />
         </div>
         <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="px-4 py-2 rounded-lg border border-gray-200 outline-none text-sm bg-white">
           <option value="all">All Roles</option>
           <option value="junior">Juniors</option>
           <option value="senior">Seniors</option>
           <option value="admin">Admins</option>
         </select>
         <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2 rounded-lg border border-gray-200 outline-none text-sm bg-white">
           <option value="all">All Status</option>
           <option value="active">Active</option>
           <option value="suspended">Suspended</option>
         </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-sm text-gray-500 bg-gray-50/50">
              <th className="p-4 font-semibold w-10">
                <input type="checkbox" checked={selectedUids.size === filteredUsers.length && filteredUsers.length > 0} onChange={handleSelectAll} className="w-4 h-4 rounded border-gray-300 text-primary cursor-pointer" />
              </th>
              <th className="p-4 font-semibold">User</th>
              <th className="p-4 font-semibold">Roll Number</th>
              <th className="p-4 font-semibold">Role</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
               <tr><td colSpan={6} className="p-8 text-center text-gray-400">No users found matching filters.</td></tr>
            ) : filteredUsers.map(u => (
               <tr key={u.uid} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                 <td className="p-4">
                   <input type="checkbox" checked={selectedUids.has(u.uid)} onChange={() => toggleSelection(u.uid)} className="w-4 h-4 rounded border-gray-300 text-primary cursor-pointer" />
                 </td>
                 <td className="p-4">
                   <p className="font-bold text-gray-900 leading-tight">{u.displayName}</p>
                   <p className="text-xs text-gray-400">{u.email}</p>
                 </td>
                 <td className="p-4 font-mono text-sm text-gray-600">{u.rollNumber}</td>
                 <td className="p-4">
                   <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${u.role === 'admin' ? 'bg-red-100 text-red-700' : u.role === 'senior' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                     {u.role}
                   </span>
                 </td>
                 <td className="p-4">
                   {u.status === 'suspended' ? (
                     <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full w-max"><FiXCircle /> Suspended</span>
                   ) : (
                     <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full w-max"><FiCheckCircle /> Active</span>
                   )}
                 </td>
                 <td className="p-4 text-right">
                   {u.role !== 'admin' && (
                     <button
                       onClick={() => handleToggleStatus(u)}
                       disabled={actionLoading === u.uid}
                       className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${u.status === 'suspended' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                     >
                       {actionLoading === u.uid ? 'Working...' : u.status === 'suspended' ? 'Activate' : 'Suspend'}
                     </button>
                   )}
                 </td>
               </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
