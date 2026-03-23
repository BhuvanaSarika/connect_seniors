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
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-1 bg-primary rounded-full" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary-light">Control Center</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-gray-900 leading-tight">
            User <span className="text-gradient">Directory</span>
          </h1>
          <p className="text-gray-500 mt-2 max-w-lg">
            Manage the community, monitor student status, and broadcast critical communications across the platform.
          </p>
        </div>
        <button 
          onClick={handleSendEmail} 
          disabled={selectedUids.size === 0}
          className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gray-900 text-white font-bold shadow-float hover:bg-primary transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-30"
        >
          <FiMail size={20} /> Broadcast to {selectedUids.size || 'Selection'}
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-premium border border-gray-100 overflow-hidden">
        {/* Filter Bar */}
        <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" value={search} onChange={e => setSearch(e.target.value)} 
              placeholder="Search by name, email, or roll number..." 
              className="w-full pl-12 pr-5 py-3.5 rounded-2xl border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-sm font-medium" 
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <select 
              value={roleFilter} onChange={e => setRoleFilter(e.target.value)} 
              className="flex-1 md:flex-none px-6 py-3.5 rounded-2xl border border-gray-200 outline-none focus:border-primary transition-all text-sm font-bold text-gray-700 bg-white"
            >
              <option value="all">All Roles</option>
              <option value="junior">Juniors</option>
              <option value="senior">Seniors</option>
              <option value="admin">Admins</option>
            </select>
            <select 
              value={statusFilter} onChange={e => setStatusFilter(e.target.value)} 
              className="flex-1 md:flex-none px-6 py-3.5 rounded-2xl border border-gray-200 outline-none focus:border-primary transition-all text-sm font-bold text-gray-700 bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-50">
                <th className="px-8 py-5 w-16">
                   <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={selectedUids.size === filteredUsers.length && filteredUsers.length > 0} 
                      onChange={handleSelectAll} 
                      className="w-5 h-5 rounded-lg border-gray-200 text-primary focus:ring-primary transition-colors cursor-pointer" 
                    />
                   </div>
                </th>
                <th className="px-8 py-5">User Identity</th>
                <th className="px-8 py-5">Roll ID</th>
                <th className="px-8 py-5">Permission</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Administrative</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.length === 0 ? (
                 <tr>
                   <td colSpan={6} className="px-8 py-12 text-center text-gray-400 font-medium">
                      No matching records found in user directory.
                   </td>
                 </tr>
              ) : filteredUsers.map(u => (
                 <tr key={u.uid} className="hover:bg-gray-50/50 transition-colors group">
                   <td className="px-8 py-5">
                      <input 
                        type="checkbox" 
                        checked={selectedUids.has(u.uid)} 
                        onChange={() => toggleSelection(u.uid)} 
                        className="w-5 h-5 rounded-lg border-gray-200 text-primary focus:ring-primary transition-colors cursor-pointer" 
                      />
                   </td>
                   <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 font-bold group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          {u.displayName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 leading-tight">{u.displayName}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{u.email}</p>
                        </div>
                      </div>
                   </td>
                   <td className="px-8 py-5 font-mono text-xs font-bold text-gray-500">{u.rollNumber}</td>
                   <td className="px-8 py-5">
                     <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border ${
                       u.role === 'admin' ? 'bg-red-50 text-red-600 border-red-100' : 
                       u.role === 'senior' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 
                       'bg-emerald-50 text-emerald-600 border-emerald-100'
                     }`}>
                       {u.role}
                     </span>
                   </td>
                   <td className="px-8 py-5">
                     {u.status === 'suspended' ? (
                       <span className="flex items-center gap-2 text-[10px] font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-xl w-max border border-red-100">
                         <FiXCircle size={12} /> Suspended
                       </span>
                     ) : (
                       <span className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl w-max border border-emerald-100">
                         <FiCheckCircle size={12} /> Active
                       </span>
                     )}
                   </td>
                   <td className="px-8 py-5 text-right">
                     {u.role !== 'admin' && (
                       <button
                         onClick={() => handleToggleStatus(u)}
                         disabled={actionLoading === u.uid}
                         className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                           u.status === 'suspended' 
                             ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20' 
                             : 'bg-white text-red-600 border border-red-100 hover:bg-red-50'
                         }`}
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
    </div>
  );
}
