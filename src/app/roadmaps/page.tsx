'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { Roadmap } from '@/types';
import { FiPlus, FiTrash2, FiEdit3, FiMap } from 'react-icons/fi';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

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
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-1 bg-primary rounded-full" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary-light">Navigation</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-gray-900 leading-tight">
            Learning <span className="text-gradient">Roadmaps</span>
          </h1>
          <p className="text-gray-500 mt-2 max-w-lg">
            Structured, node-based learning paths meticulously crafted by seniors to guide your technical journey.
          </p>
        </div>
        {(appUser.role === 'senior' || appUser.role === 'admin') && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-white font-bold shadow-float hover:bg-primary-dark transition-all hover:scale-[1.02] active:scale-95"
          >
            <FiPlus size={20} /> Create Roadmap
          </button>
        )}
      </div>

      {/* Creation Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl transform transition-all p-8 md:p-12 relative">
            <button onClick={() => setShowCreate(false)} className="absolute top-8 right-8 p-2 rounded-xl hover:bg-gray-100 text-gray-400">
              <FiPlus size={24} className="rotate-45" />
            </button>
            <div className="text-center mb-10">
               <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                  <FiMap size={32} />
               </div>
               <h3 className="text-3xl font-display font-bold text-gray-900">Blueprint a Roadmap</h3>
               <p className="text-gray-500 mt-2">Set the foundation for a new learning path.</p>
            </div>
            
            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Roadmap Title</label>
                <input
                  type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-lg font-medium"
                  placeholder="e.g. Master React & Next.js"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Curriculum Overview</label>
                <div className="bg-white rounded-2xl overflow-hidden border border-gray-200">
                  <ReactQuill theme="snow" value={description} onChange={setDescription} style={{ height: '150px', marginBottom: '40px' }} />
                </div>
              </div>

              <button
                type="submit" disabled={creating}
                className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-lg shadow-float hover:bg-primary-dark transition-all disabled:opacity-60"
              >
                {creating ? 'Architecting...' : 'Initialize Roadmap'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Grid of Roadmaps */}
      {fetching ? (
        <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : roadmaps.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-[3rem] border border-gray-100 shadow-premium">
          <FiMap className="mx-auto text-gray-100 mb-6" size={64} />
          <p className="text-gray-400 text-xl font-medium">No roadmaps architected yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {roadmaps.map((roadmap) => (
            <div key={roadmap.id} className="group relative bg-white rounded-[2.5rem] p-5 shadow-premium hover:shadow-float border border-gray-100 transition-all duration-500 hover:-translate-y-2 flex flex-col">
              <div className="relative aspect-video rounded-3xl bg-gray-50 flex items-center justify-center overflow-hidden mb-6 border border-gray-50">
                 <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/80 backdrop-blur-sm border border-gray-100 text-gray-500 shadow-sm">
                   {roadmap.nodes?.length || 0} Milestones
                 </div>
                 <FiMap size={48} className="text-gray-200 group-hover:scale-110 transition-transform duration-500" />
                 <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />
              </div>
              
              <div className="px-3 pb-2 flex flex-col flex-1">
                <h3 className="text-xl font-display font-bold text-gray-900 mb-2 truncate group-hover:text-primary transition-colors">{roadmap.title}</h3>
                <div 
                  className="text-sm text-gray-500 line-clamp-2 mb-8 h-10 overflow-hidden prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: roadmap.description }}
                />
                
                <div className="mt-auto flex items-center justify-between pt-5 border-t border-gray-50">
                   <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary capitalize">
                        {roadmap.createdByName?.[0] || 'U'}
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">By {roadmap.createdByName}</span>
                   </div>
                   <div className="flex items-center gap-1">
                      {(roadmap.createdBy === appUser.uid || appUser.role === 'admin') && (
                        <div className="flex gap-1 mr-2">
                           <Link href={`/roadmaps/${roadmap.id}/edit`} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary transition-all">
                              <FiEdit3 size={16} />
                           </Link>
                           <button onClick={() => handleDelete(roadmap.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all">
                              <FiTrash2 size={16} />
                           </button>
                        </div>
                      )}
                      <Link
                        href={`/roadmaps/${roadmap.id}`}
                        className="px-6 py-2.5 rounded-xl bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-primary transition-all shadow-lg shadow-black/5"
                      >
                        Launch
                      </Link>
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
