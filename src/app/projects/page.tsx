'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import { collection, getDocs, addDoc, deleteDoc, doc, Timestamp, query, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ProjectIdea, ProjectCategory } from '@/types';
import { FiPlus, FiTrash2, FiExternalLink, FiGithub, FiYoutube, FiCode, FiX, FiEdit2, FiInfo, FiLayers } from 'react-icons/fi';
import Link from 'next/link';

const categories: ProjectCategory[] = ['beginner', 'intermediate', 'advanced', 'pro'];

export default function ProjectsPage() {
  const { appUser, loading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectIdea[]>([]);
  const [fetching, setFetching] = useState(true);
  const [filter, setFilter] = useState<ProjectCategory | 'all'>('all');
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('beginner');
  const [aiPrompt, setAiPrompt] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !appUser) router.push('/login');
  }, [loading, appUser, router]);

  useEffect(() => {
    if (!appUser) return;
    const fetch = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'projectIdeas'), orderBy('createdAt', 'desc')));
        setProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ProjectIdea)));
      } catch { /* noop */ }
      setFetching(false);
    };
    fetch();
  }, [appUser]);

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setTitle(''); setDescription(''); setAiPrompt(''); setReferenceUrl(''); setGithubUrl(''); setYoutubeUrl('');
    setCategory('beginner');
  };

  const handleEdit = (project: ProjectIdea) => {
    setEditingId(project.id);
    setTitle(project.title);
    setDescription(project.description);
    setCategory(project.category);
    setAiPrompt(project.aiPrompt || '');
    setReferenceUrl(project.referenceUrl || '');
    setGithubUrl(project.githubUrl || '');
    setYoutubeUrl(project.youtubeUrl || '');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appUser) return;
    setCreating(true);
    try {
      const projectData = {
        title, description, category, aiPrompt, referenceUrl, githubUrl, youtubeUrl,
      };

      if (editingId) {
         await updateDoc(doc(db, 'projectIdeas', editingId), projectData);
         setProjects(prev => prev.map(p => p.id === editingId ? { ...p, ...projectData } : p));
      } else {
         const newProject: Omit<ProjectIdea, 'id'> = {
           ...projectData,
           createdBy: appUser.uid,
           createdByName: appUser.displayName,
           createdAt: Timestamp.now(),
         };
         const docRef = await addDoc(collection(db, 'projectIdeas'), newProject);
         setProjects((prev) => [{ id: docRef.id, ...newProject } as ProjectIdea, ...prev]);
      }
      handleCloseForm();
    } catch (err) { console.error(err); }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Operational security: confirm deletion of this technical asset?')) return;
    await deleteDoc(doc(db, 'projectIdeas', id));
    setProjects((prev) => prev.filter((p) => p.id !== id));
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
           <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Technical Assets</p>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-display font-black text-slate-900 leading-tight mb-4 tracking-tight">
              Project <span className="text-slate-900/40 italic">Blueprints.</span>
            </h1>
            <p className="text-slate-500 font-medium leading-relaxed">
               Architecturally-curated repository of project challenges. Structured by complexity to bridge the gap between academic theory and industry engineering.
            </p>
          </div>
          {isSenior && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary flex items-center gap-3 px-8 shadow-xl shadow-primary/20"
            >
              <FiPlus size={18} /> <span>Draft New Blueprint</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Segment */}
      <div className="flex flex-wrap items-center gap-3 mb-12 border-b border-slate-100 pb-8">
        <button
          onClick={() => setFilter('all')}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            filter === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-900 border border-slate-100'
          }`}
        >
          Global Index
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              filter === cat
                ? 'bg-primary text-white'
                : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-900 border border-slate-100'
            }`}
          >
            {cat} Level
          </button>
        ))}
      </div>

      {/* Creation Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto transform transition-all p-10 md:p-14 relative border border-white/10">
            <button onClick={handleCloseForm} className="absolute top-8 right-8 p-3 rounded-xl bg-slate-100 text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
              <FiX size={20} />
            </button>
            <div className="mb-12">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Protocol: Authoring</p>
               <h3 className="text-3xl font-display font-black text-slate-900 mb-2">{editingId ? 'Modify Blueprint' : 'Draft New Architecture'}</h3>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                   <label className="section-label mb-3 block">System Title</label>
                   <input
                    type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-5 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary outline-none transition-all font-medium text-sm"
                    placeholder="e.g. Distributed Ledger Interface"
                  />
                </div>
                <div>
                  <label className="section-label mb-3 block">Complexity Tier</label>
                  <select
                    value={category} onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                    className="w-full px-5 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary outline-none transition-all text-xs font-bold uppercase tracking-widest appearance-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c} Authorization</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="section-label mb-3 block">Technical Brief</label>
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                  <ReactQuill theme="snow" value={description} onChange={setDescription} />
                </div>
              </div>

              <div>
                <label className="section-label mb-3 block">AI Architecture Prompt</label>
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                   <ReactQuill theme="snow" value={aiPrompt} onChange={setAiPrompt} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="url" placeholder="Reference URL" value={referenceUrl} onChange={(e) => setReferenceUrl(e.target.value)} className="px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-primary transition-all" />
                <input type="url" placeholder="GitHub Repository" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} className="px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-primary transition-all" />
                <input type="url" placeholder="YouTube Seminar" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} className="px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-primary transition-all" />
              </div>

              <div className="pt-6">
                <button
                  type="submit" disabled={creating}
                  className="btn-primary w-full py-4 text-sm disabled:opacity-20 shadow-xl shadow-primary/20"
                >
                  {creating ? 'Syncing Handshake...' : editingId ? 'Finalize Asset Update' : 'Initialize Protocol'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Blueprint Index */}
      {fetching ? (
        <div className="flex justify-center py-24"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : projects.length === 0 ? (
        <div className="clean-card py-32 text-center border-slate-100 bg-slate-50/10">
          <FiLayers className="mx-auto text-slate-100 mb-6" size={48} />
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Global blueprint repository is currently empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.filter((p) => filter === 'all' || p.category === filter).map((project) => (
            <div key={project.id} className="clean-card p-8 group flex flex-col hover:border-primary/30 transition-all duration-500">
              <div className="flex items-start justify-between mb-8">
                 <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-900 border border-slate-100 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                    <FiCode size={24} />
                 </div>
                 <span className="px-3 py-1 bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-400 border border-slate-100 rounded">
                    {project.category} tier
                 </span>
              </div>
              
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 mb-3 font-display group-hover:text-primary transition-colors">{project.title}</h3>
                <div 
                  className="text-sm text-slate-500 font-medium line-clamp-2 mb-8 mb-h-[40px] prose prose-slate"
                  dangerouslySetInnerHTML={{ __html: project.description }}
                />
                
                <div className="flex gap-4 mb-10">
                  {project.githubUrl && <FiGithub className="text-slate-300 group-hover:text-slate-900 transition-colors" size={16} />}
                  {project.youtubeUrl && <FiYoutube className="text-slate-300 group-hover:text-red-600 transition-colors" size={16} />}
                  {project.referenceUrl && <FiExternalLink className="text-slate-300 group-hover:text-primary transition-colors" size={16} />}
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-900 flex items-center justify-center text-[10px] font-black uppercase border border-slate-100">
                      {project.createdByName?.[0] || 'A'}
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                       {project.createdByName}
                    </p>
                 </div>
                 <div className="flex items-center gap-2">
                    {(project.createdBy === appUser.uid || appUser.role === 'admin') && (
                      <div className="flex gap-1 mr-2">
                         <button onClick={() => handleEdit(project)} className="p-2 rounded-lg hover:bg-slate-900 hover:text-white text-slate-300 transition-all">
                            <FiEdit2 size={14} />
                         </button>
                         <button onClick={() => handleDelete(project.id)} className="p-2 rounded-lg hover:bg-red-600 hover:text-white text-slate-300 transition-all">
                            <FiTrash2 size={14} />
                         </button>
                      </div>
                    )}
                    <Link
                      href={`/projects/${project.id}`}
                      className="btn-primary text-[9px] px-5 py-2 whitespace-nowrap"
                    >
                      Inspect
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
