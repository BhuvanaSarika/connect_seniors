'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { Roadmap } from '@/types';
import { FiPlus, FiTrash2, FiEdit3, FiMap, FiX, FiInfo, FiArrowRight } from 'react-icons/fi';
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
            data: { label: title, description: 'Protocol starting point' },
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
      alert('Operational failure: could not initialize roadmap architecture.');
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Operational security: confirm deletion of this technical roadmap?')) return;
    try {
      await deleteDoc(doc(db, 'roadmaps', id));
      setRoadmaps((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !appUser) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full" />
    </div>
  );

  const isSenior = appUser.role === 'senior' || appUser.role === 'admin';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 text-slate-900">
      {/* Module Header */}
      <div className="mb-16">
        <div className="inline-flex items-center gap-2 mb-6">
           <span className="w-10 h-1 bg-primary rounded-full" />
           <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Technical navigation</p>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-display font-black text-slate-900 leading-tight mb-4 tracking-tight">
              Learning <span className="text-slate-900/40 italic">Roadmaps.</span>
            </h1>
            <p className="text-slate-500 font-medium leading-relaxed">
               Architectural learning paths meticulously crafted by industry seniors. Structured, node-based navigation through complex technical stacks and career progressions.
            </p>
          </div>
          {isSenior && (
            <button
              onClick={() => setShowCreate(true)}
              className="btn-primary flex items-center gap-3 px-8 shadow-xl shadow-primary/20"
            >
              <FiPlus size={18} /> <span>Architect Roadmap</span>
            </button>
          )}
        </div>
      </div>

      {/* Creation Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto transform transition-all p-10 md:p-14 relative border border-white/10">
            <button onClick={() => setShowCreate(false)} className="absolute top-8 right-8 p-3 rounded-xl bg-slate-100 text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
              <FiX size={20} />
            </button>
            <div className="text-center mb-12">
               <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-900 border border-slate-100 flex items-center justify-center mx-auto mb-6">
                 <FiMap size={28} />
               </div>
               <h2 className="text-3xl font-display font-black text-slate-900 mb-2 tracking-tight">Initialize Protocol</h2>
               <p className="text-slate-500 font-medium">Drafting the structural foundation for a new learning path.</p>
            </div>
            
            <form onSubmit={handleCreate} className="space-y-10">
              <div>
                <label className="section-label mb-4 block">Systemic Title</label>
                <input
                  type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-6 py-4 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-primary outline-none transition-all font-medium text-sm"
                  placeholder="e.g. Full-Stack Architecture Masterclass"
                />
              </div>

              <div>
                <label className="section-label mb-4 block">Curriculum Abstract</label>
                <div className="rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                  <ReactQuill theme="snow" value={description} onChange={setDescription} />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit" disabled={creating}
                  className="btn-primary w-full py-4 text-sm disabled:opacity-20 shadow-xl shadow-primary/20"
                >
                  {creating ? 'Establishing Architecture...' : 'Commence Architecture'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid of Roadmaps */}
      {fetching ? (
        <div className="flex justify-center py-24"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : roadmaps.length === 0 ? (
        <div className="clean-card py-32 text-center border-slate-100 bg-slate-50/10">
          <FiMap className="mx-auto text-slate-100 mb-6" size={48} />
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No roadmap architectures have been initialized.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {roadmaps.map((roadmap) => (
            <div key={roadmap.id} className="clean-card p-8 group flex flex-col hover:border-primary/30 transition-all duration-300">
              <div className="flex items-start justify-between mb-8">
                 <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-900 border border-slate-100 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                    <FiMap size={24} />
                 </div>
                 <span className="px-3 py-1 bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-400 border border-slate-100 rounded">
                    {roadmap.nodes?.length || 0} Nodes
                 </span>
              </div>
              
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 mb-3 font-display group-hover:text-primary transition-colors">{roadmap.title}</h3>
                <div 
                  className="text-sm text-slate-500 font-medium line-clamp-2 mb-8 h-[40px] prose prose-slate"
                  dangerouslySetInnerHTML={{ __html: roadmap.description }}
                />
              </div>

              <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-900 flex items-center justify-center text-[10px] font-black uppercase border border-slate-100">
                      {roadmap.createdByName?.[0] || 'A'}
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                       By {roadmap.createdByName}
                    </p>
                 </div>
                 <div className="flex items-center gap-2">
                    {(roadmap.createdBy === appUser.uid || appUser.role === 'admin') && (
                      <div className="flex gap-1 mr-2">
                         <Link href={`/roadmaps/${roadmap.id}/edit`} className="p-2 rounded-lg hover:bg-slate-900 hover:text-white text-slate-300 transition-all">
                            <FiEdit3 size={14} />
                         </Link>
                         <button onClick={() => handleDelete(roadmap.id)} className="p-2 rounded-lg hover:bg-red-600 hover:text-white text-slate-300 transition-all">
                            <FiTrash2 size={14} />
                         </button>
                      </div>
                    )}
                    <Link
                      href={`/roadmaps/${roadmap.id}`}
                      className="btn-primary text-[9px] px-5 py-2 whitespace-nowrap"
                    >
                      Initialize
                    </Link>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
