'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import { collection, getDocs, addDoc, deleteDoc, doc, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ProjectIdea, ProjectCategory } from '@/types';
import { FiPlus, FiTrash2, FiExternalLink, FiGithub, FiYoutube, FiCode, FiX, FiEdit2 } from 'react-icons/fi';
import Link from 'next/link';

const categories: ProjectCategory[] = ['beginner', 'intermediate', 'advanced', 'pro'];
const categoryColors: Record<ProjectCategory, string> = {
  beginner: 'bg-green-100 text-green-700 border-green-200',
  intermediate: 'bg-blue-100 text-blue-700 border-blue-200',
  advanced: 'bg-purple-100 text-purple-700 border-purple-200',
  pro: 'bg-red-100 text-red-700 border-red-200',
};

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

  const [editingId, setEditingId] = useState<string | null>(null);

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
         await import('firebase/firestore').then(({ updateDoc }) => updateDoc(doc(db, 'projectIdeas', editingId), projectData));
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
    if (!confirm('Delete this project idea?')) return;
    await deleteDoc(doc(db, 'projectIdeas', id));
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const filtered = filter === 'all' ? projects : projects.filter((p) => p.category === filter);

  if (loading || !appUser) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const isSenior = appUser.role === 'senior' || appUser.role === 'admin';

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-1 bg-primary rounded-full" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary-light">Inspiration</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-gray-900 leading-tight">
            Project <span className="text-gradient">Ideas</span>
          </h1>
          <p className="text-gray-500 mt-2 max-w-lg">
            A curated library of technical challenges divided by difficulty to help you grow your portfolio.
          </p>
        </div>
        {(appUser.role === 'senior' || appUser.role === 'admin') && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-white font-bold shadow-float hover:bg-primary-dark transition-all hover:scale-[1.02] active:scale-95"
          >
            <FiPlus size={20} /> Create Idea
          </button>
        )}
      </div>

      {/* Modern Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 mb-10 overflow-x-auto pb-2 -mx-1 px-1">
        <button
          onClick={() => setFilter('all')}
          className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
            filter === 'all'
              ? 'bg-primary text-white shadow-lg shadow-primary/20'
              : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
          }`}
        >
          All Projects
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-5 py-2 rounded-xl text-sm font-bold capitalize transition-all ${
              filter === cat
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Creation/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all p-8 md:p-10 relative">
            <button onClick={handleCloseForm} className="absolute top-6 right-6 p-2 rounded-xl hover:bg-gray-100 text-gray-400">
              <FiX size={24} />
            </button>
            <h3 className="text-2xl font-display font-bold text-gray-900 mb-8">
              {editingId ? 'Refine Project Idea' : 'Draft New Idea'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Title</label>
                   <input
                    type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="e.g. Real-time Chat Engine"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Difficulty</label>
                  <select
                    value={category} onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none transition-all appearance-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c} className="capitalize">{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Technical Brief</label>
                <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
                  <ReactQuill theme="snow" value={description} onChange={setDescription} style={{ height: '150px', marginBottom: '40px' }} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">AI Prompt Strategy</label>
                <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
                  <ReactQuill theme="snow" value={aiPrompt} onChange={setAiPrompt} style={{ height: '120px', marginBottom: '40px' }} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="url" placeholder="Reference URL" value={referenceUrl} onChange={(e) => setReferenceUrl(e.target.value)} className="px-4 py-3 rounded-xl border border-gray-200 text-sm" />
                <input type="url" placeholder="GitHub Repo" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} className="px-4 py-3 rounded-xl border border-gray-200 text-sm" />
                <input type="url" placeholder="YouTube Guide" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} className="px-4 py-3 rounded-xl border border-gray-200 text-sm" />
              </div>

              <button
                type="submit" disabled={creating}
                className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-lg shadow-float hover:bg-primary-dark transition-all disabled:opacity-60"
              >
                {creating ? 'Synchronizing...' : editingId ? 'Update Idea' : 'Deploy Idea'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Grid of Projects */}
      {fetching ? (
        <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-premium">
          <FiCode className="mx-auto text-gray-200 mb-4" size={48} />
          <p className="text-gray-400 text-lg font-medium">No projects drafted yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.filter((p) => filter === 'all' || p.category === filter).map((project) => (
            <div key={project.id} className="group relative bg-white rounded-[2.5rem] p-5 shadow-premium hover:shadow-float border border-gray-100 transition-all duration-500 hover:-translate-y-2 flex flex-col">
              <div className="relative aspect-video rounded-3xl bg-gray-50 flex items-center justify-center overflow-hidden mb-6 border border-gray-50">
                 <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${categoryColors[project.category]}`}>
                   {project.category}
                 </div>
                 <FiCode size={40} className="text-gray-200 group-hover:scale-110 transition-transform duration-500" />
                 <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />
              </div>
              
              <div className="px-3 pb-2 flex flex-col flex-1">
                <h3 className="text-xl font-display font-bold text-gray-900 mb-2 truncate group-hover:text-primary transition-colors">{project.title}</h3>
                <div 
                  className="text-sm text-gray-500 line-clamp-2 mb-6 h-10 overflow-hidden prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: project.description }}
                />
                
                <div className="flex flex-wrap gap-2 mb-6">
                  {project.githubUrl && <div className="p-2 rounded-lg bg-gray-50 text-gray-400"><FiGithub size={14} /></div>}
                  {project.youtubeUrl && <div className="p-2 rounded-lg bg-red-50 text-red-400"><FiYoutube size={14} /></div>}
                  {project.referenceUrl && <div className="p-2 rounded-lg bg-primary/5 text-primary-light"><FiExternalLink size={14} /></div>}
                </div>

                <div className="mt-auto flex items-center justify-between pt-5 border-t border-gray-50">
                   <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary capitalize">
                        {project.createdByName?.[0] || 'U'}
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">By {project.createdByName}</span>
                   </div>
                   <div className="flex items-center gap-1">
                      {(project.createdBy === appUser.uid || appUser.role === 'admin') && (
                        <div className="flex gap-1 mr-2">
                           <button onClick={() => handleEdit(project)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary transition-all">
                              <FiEdit2 size={14} />
                           </button>
                           <button onClick={() => handleDelete(project.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all">
                              <FiTrash2 size={14} />
                           </button>
                        </div>
                      )}
                      <Link
                        href={`/projects/${project.id}`}
                        className="px-5 py-2 rounded-xl bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-primary transition-all shadow-lg shadow-black/5"
                      >
                        Explore
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
