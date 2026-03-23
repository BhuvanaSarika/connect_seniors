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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary-dark">Project Ideas</h1>
          <p className="text-gray-500 mt-1">Curated project ideas across all skill levels</p>
        </div>
        {isSenior && (
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-light text-white font-semibold shadow-lg hover:shadow-primary/40 hover:scale-105 transition-all">
            {showForm ? <FiX size={18} /> : <FiPlus size={18} />} {showForm ? 'Close' : 'Add Project'}
          </button>
        )}
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="mb-8 bg-white rounded-2xl shadow-lg border border-muted/30 p-6">
          <h3 className="text-lg font-bold text-primary-dark mb-4">{editingId ? 'Edit Project Idea' : 'New Project Idea'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-bg-light" placeholder="Project Title" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
                <ReactQuill theme="snow" value={description} onChange={setDescription} style={{ height: '160px', marginBottom: '40px' }} placeholder="Detailed rich text description..." />
              </div>
            </div>
            <div>
              <select value={category} onChange={(e) => setCategory(e.target.value as ProjectCategory)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none bg-bg-light capitalize">
                {categories.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>
            <div>
              <input type="text" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-bg-light" placeholder="AI Prompt (optional)" />
            </div>
            <div>
              <input type="url" value={referenceUrl} onChange={(e) => setReferenceUrl(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-bg-light" placeholder="Reference Website URL" />
            </div>
            <div>
              <input type="url" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-bg-light" placeholder="GitHub Link" />
            </div>
            <div>
              <input type="url" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-bg-light" placeholder="YouTube Link" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={creating} className="px-6 py-2 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark disabled:opacity-60">{creating ? (editingId ? 'Saving...' : 'Adding...') : (editingId ? 'Save Changes' : 'Add Project')}</button>
              <button type="button" onClick={handleCloseForm} className="px-6 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === 'all' ? 'bg-primary text-white shadow-lg' : 'bg-white text-gray-500 border border-muted/30 hover:border-primary-light'}`}>All</button>
        {categories.map((c) => (
          <button key={c} onClick={() => setFilter(c)} className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${filter === c ? 'bg-primary text-white shadow-lg' : 'bg-white text-gray-500 border border-muted/30 hover:border-primary-light'}`}>{c}</button>
        ))}
      </div>

      {/* Projects Grid */}
      {fetching ? (
        <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20"><FiCode className="mx-auto text-muted mb-4" size={48} /><p className="text-gray-400 text-lg">No projects found</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl shadow-md hover:shadow-xl border border-muted/20 transition-all duration-300 flex flex-col overflow-hidden">
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold capitalize border ${categoryColors[p.category]}`}>{p.category}</span>
                  {(p.createdBy === appUser.uid || appUser.role === 'admin') && (
                    <div className="flex gap-1.5">
                      <button onClick={() => handleEdit(p)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-primary transition-colors"><FiEdit2 size={16} /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"><FiTrash2 size={16} /></button>
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-bold text-primary-dark mb-2">{p.title}</h3>
                <div 
                  className="text-sm text-gray-500 mb-4 line-clamp-3 prose prose-sm max-w-none break-words overflow-hidden" 
                  dangerouslySetInnerHTML={{ __html: p.description }} 
                />
                {p.aiPrompt && (
                  <div className="mb-3 p-3 rounded-lg bg-accent/10 border border-accent/20">
                    <p className="text-xs font-semibold text-accent mb-1">AI Prompt</p>
                    <p className="text-xs text-gray-600 line-clamp-2">{p.aiPrompt}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-auto">
                  {p.referenceUrl && <a href={p.referenceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-bg-light text-primary hover:bg-primary hover:text-white transition-colors"><FiExternalLink size={12} /> Reference</a>}
                  {p.githubUrl && <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-bg-light text-gray-700 hover:bg-gray-800 hover:text-white transition-colors"><FiGithub size={12} /> GitHub</a>}
                  {p.youtubeUrl && <a href={p.youtubeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors"><FiYoutube size={12} /> YouTube</a>}
                </div>
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-50">
                   <p className="text-xs text-gray-400">By {p.createdByName}</p>
                   <Link href={`/projects/${p.id}`} className="text-sm font-semibold text-primary hover:text-primary-dark hover:underline">View Details &rarr;</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
