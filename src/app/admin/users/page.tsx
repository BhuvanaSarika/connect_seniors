'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AppUser } from '@/types';
import { FiSearch, FiMail, FiCheckCircle, FiXCircle, FiMoreHorizontal, FiUser, FiShield } from 'react-icons/fi';

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
      setUsers(snap.docs.map(d => ({ ...d.data(), uid: d.id } as AppUser)).sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)));
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = u.displayName.toLowerCase().includes(search.toLowerCase()) ||
        (u.rollNumber?.toLowerCase() || '').includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchStatus = statusFilter === 'all' || (statusFilter === 'active' && u.status !== 'suspended') || (statusFilter === 'suspended' && u.status === 'suspended');
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const handleToggleStatus = async (user: AppUser) => {
    if (user.role === 'admin') return alert("Cannot modify root administrators.");
    setActionLoading(user.uid);
    try {
      const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
      await updateDoc(doc(db, 'users', user.uid), { status: newStatus });
      setUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, status: newStatus } : u));
    } catch (err) {
      console.error(err);
      alert('Operational failure: could not update status');
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
    if (selectedUids.size === filteredUsers.length && filteredUsers.length > 0) setSelectedUids(new Set());
    else setSelectedUids(new Set(filteredUsers.map(u => u.uid)));
  };

  const handleSendEmail = () => {
    if (selectedUids.size === 0) return;
    const selectedUsers = users.filter(u => selectedUids.has(u.uid));
    const emails = selectedUsers.map(u => u.email).join(',');
    window.location.href = `mailto:?bcc=${emails}&subject=ConnectSeniors: Administrative Communiqué`;
  };

  if (loading) return (
    <div className="h-96 flex flex-col items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full mb-4" />
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Querying User Index...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      {/* Directory Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="w-10 h-1 bg-slate-900 rounded-full" />
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">User Management</p>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-black text-slate-900 leading-tight mb-4 tracking-tight">
            Member <span className="text-primary italic">Directory.</span>
          </h1>
          <p className="text-slate-500 font-medium leading-relaxed">
            Comprehensive audit of all registered community identities. Filter by role, status, or academic roll number to perform bulk administrative actions.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSendEmail}
            disabled={selectedUids.size === 0}
            className="btn-primary flex items-center justify-center gap-3 disabled:opacity-20 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
          >
            <FiMail size={18} />
            <span>Broadcast to {selectedUids.size || 'Selection'}</span>
          </button>
        </div>
      </div>

      <div className="clean-card shadow-lg shadow-slate-200/50">
        {/* Advanced Filter Bar */}
        <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Query by name, email, or roll id..."
              className="input-clean pl-14 shadow-sm"
            />
          </div>
          <div className="flex gap-3 w-full lg:w-auto">
            <select
              value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
              className="flex-1 lg:flex-none px-6 py-3.5 rounded-xl border border-slate-200 outline-none focus:border-primary transition-all text-xs font-bold text-slate-600 bg-white"
            >
              <option value="all">Every Role</option>
              <option value="junior">Juniors Only</option>
              <option value="senior">Seniors Only</option>
              <option value="admin">Administrators</option>
            </select>
            <select
              value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="flex-1 lg:flex-none px-6 py-3.5 rounded-xl border border-slate-200 outline-none focus:border-primary transition-all text-xs font-bold text-slate-600 bg-white"
            >
              <option value="all">Any Status</option>
              <option value="active">Active Members</option>
              <option value="suspended">Suspended Accounts</option>
            </select>
          </div>
        </div>

        {/* High-Performance Data Table */}
        <div className="overflow-x-auto border-t border-slate-200">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/30">
                <th className="px-8 py-6 w-20 border-b border-slate-100">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedUids.size === filteredUsers.length && filteredUsers.length > 0}
                      onChange={handleSelectAll}
                      className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary transition-colors cursor-pointer"
                    />
                  </div>
                </th>
                <th className="px-8 py-6 border-b border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">User Identity</p>
                </th>
                <th className="px-8 py-6 border-b border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Access Role</p>
                </th>
                <th className="px-8 py-6 border-b border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Platform Status</p>
                </th>
                <th className="px-8 py-6 border-b border-slate-100 text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Governance</p>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center">
                    <p className="text-sm font-medium text-slate-400">No organizational records match your current parameters.</p>
                  </td>
                </tr>
              ) : filteredUsers.map(u => (
                <tr key={u.uid} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-6">
                    <input
                      type="checkbox"
                      checked={selectedUids.has(u.uid)}
                      onChange={() => toggleSelection(u.uid)}
                      className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary transition-colors cursor-pointer"
                    />
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-5">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500">
                        {u.displayName ? u.displayName[0] : <FiUser />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 leading-tight mb-1">{u.displayName}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                            {u.rollNumber}
                          </span>
                          <span className="text-[10px] font-medium text-slate-300">•</span>
                          <span className="text-[10px] font-medium text-slate-400">{u.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${u.role === 'admin' ? 'bg-red-50 text-red-600 border-red-100' :
                        u.role === 'senior' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                          'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    {u.status === 'suspended' ? (
                      <span className="inline-flex items-center gap-2 text-[10px] font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 uppercase tracking-widest">
                        <FiXCircle size={12} /> Suspended
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 uppercase tracking-widest">
                        <FiCheckCircle size={12} /> Authorized
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    {u.role !== 'admin' ? (
                      <button
                        onClick={() => handleToggleStatus(u)}
                        disabled={actionLoading === u.uid}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${u.status === 'suspended'
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20'
                            : 'bg-white text-slate-400 border border-slate-200 hover:text-red-600 hover:border-red-100 hover:bg-red-50'
                          }`}
                      >
                        {actionLoading === u.uid ? 'Working...' : u.status === 'suspended' ? 'Authorize' : 'Suspend'}
                      </button>
                    ) : (
                      <div className="text-slate-200 px-4 py-2">
                        <FiShield size={16} className="ml-auto" />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Placeholder / Footer */}
        <div className="p-6 bg-slate-50/50 border-t border-slate-200 flex justify-between items-center bg-transparent">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Platform Governance Index • Total Records: {filteredUsers.length}</p>
          <button className="text-slate-400 hover:text-slate-900 transition-colors">
            <FiMoreHorizontal size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
