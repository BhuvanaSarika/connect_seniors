'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { Roadmap } from '@/types';
import { FiPlus, FiTrash2, FiEdit3, FiMap } from 'react-icons/fi';

export default function RoadmapsPage() {
  const { appUser, loading } = useAuth();
  const router = useRouter();
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [fetching, setFetching] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!loading && !appUser) router.push('/login');
  }, [loading, appUser, router]);

  useEffect(() => {
    if (!appUser) return;
    const fetchRoadmaps = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'roadmaps'), orderBy('createdAt', 'desc')));
        setRoadmaps(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Roadmap)));
      } catch { /* noop */ }
      setFetching(false);
    };
    fetchRoadmaps();
  }, [appUser]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appUser) return;
    setCreating(true);
    try {
      const newRoadmap = {
        title,
        description,
        createdBy: appUser.uid,
        createdByName: appUser.displayName,
        nodes: [
          {
            id: 'start',
            type: 'milestone',
            position: { x: 250, y: 0 },
            data: { label: title, description: 'Starting point' },
          },
        ],
        edges: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      const docRef = await addDoc(collection(db, 'roadmaps'), newRoadmap);
      router.push(`/roadmaps/${docRef.id}/edit`);
    } catch (err) {
      console.error(err);
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this roadmap?')) return;
    try {
      await deleteDoc(doc(db, 'roadmaps', id));
      setRoadmaps((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !appUser) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const isSenior = appUser.role === 'senior' || appUser.role === 'admin';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary-dark">Learning Roadmaps</h1>
          <p className="text-gray-500 mt-1">Custom learning paths created by seniors</p>
        </div>
        {isSenior && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-light text-white font-semibold shadow-lg hover:shadow-primary/40 hover:scale-105 transition-all"
          >
            <FiPlus size={18} /> Create Roadmap
          </button>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="mb-8 bg-white rounded-2xl shadow-lg border border-muted/30 p-6">
          <h3 className="text-lg font-bold text-primary-dark mb-4">New Roadmap</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-bg-light"
              placeholder="Roadmap title (e.g. Web Development)"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-bg-light"
              placeholder="Short description..."
              rows={3}
            />
            <div className="flex gap-3">
              <button type="submit" disabled={creating} className="px-6 py-2 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60">
                {creating ? 'Creating...' : 'Create & Edit'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="px-6 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Roadmaps Grid */}
      {fetching ? (
        <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : roadmaps.length === 0 ? (
        <div className="text-center py-20">
          <FiMap className="mx-auto text-muted mb-4" size={48} />
          <p className="text-gray-400 text-lg">No roadmaps yet</p>
          {isSenior && <p className="text-gray-400 text-sm mt-1">Create the first one!</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roadmaps.map((rm) => (
            <div key={rm.id} className="bg-white rounded-2xl shadow-md hover:shadow-xl border border-muted/20 hover:border-primary-light/50 transition-all duration-300 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-primary to-primary-light" />
              <div className="p-6">
                <h3 className="text-lg font-bold text-primary-dark mb-2">{rm.title}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{rm.description}</p>
                <p className="text-xs text-gray-400 mb-4">
                  By {rm.createdByName} · {rm.nodes?.length || 0} nodes
                </p>
                <div className="flex gap-2">
                  <Link
                    href={`/roadmaps/${rm.id}`}
                    className="flex-1 text-center py-2 rounded-lg bg-bg-light text-primary font-medium hover:bg-primary hover:text-white transition-colors text-sm"
                  >
                    View
                  </Link>
                  {(rm.createdBy === appUser.uid || appUser.role === 'admin') && (
                    <>
                      <Link
                        href={`/roadmaps/${rm.id}/edit`}
                        className="p-2 rounded-lg bg-bg-light text-primary hover:bg-primary hover:text-white transition-colors"
                      >
                        <FiEdit3 size={16} />
                      </Link>
                      <button
                        onClick={() => handleDelete(rm.id)}
                        className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
