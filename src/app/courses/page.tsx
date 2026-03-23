'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { RecommendedCourse, Certification } from '@/types';
import { FiYoutube, FiAward, FiPlus, FiTrash2, FiExternalLink, FiX, FiUser } from 'react-icons/fi';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export default function CoursesPage() {
  const { appUser, loading } = useAuth();
  const router = useRouter();
  
  const [tab, setTab] = useState<'courses' | 'certs'>('courses');
  const [courses, setCourses] = useState<RecommendedCourse[]>([]);
  const [certs, setCerts] = useState<Certification[]>([]);
  const [fetching, setFetching] = useState(true);

  // Forms
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [provider, setProvider] = useState(''); // Only for certs
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!loading && !appUser) router.push('/login');
  }, [loading, appUser, router]);

  useEffect(() => {
    if (!appUser) return;
    const fetchResources = async () => {
      try {
        const [cSnap, certSnap] = await Promise.all([
          getDocs(query(collection(db, 'courses'), orderBy('createdAt', 'desc'))),
          getDocs(query(collection(db, 'certifications'), orderBy('createdAt', 'desc')))
        ]);
        setCourses(cSnap.docs.map(d => ({ id: d.id, ...d.data() } as RecommendedCourse)));
        setCerts(certSnap.docs.map(d => ({ id: d.id, ...d.data() } as Certification)));
      } catch (err) { console.error(err); }
      setFetching(false);
    };
    fetchResources();
  }, [appUser]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appUser) return;
    setCreating(true);
    try {
      if (tab === 'courses') {
        const item: Omit<RecommendedCourse, 'id'> = {
          title, description, youtubeUrl: url,
          addedBy: appUser.uid, addedByName: appUser.displayName, createdAt: Timestamp.now()
        };
        const docRef = await addDoc(collection(db, 'courses'), item);
        setCourses(prev => [{ id: docRef.id, ...item } as RecommendedCourse, ...prev]);
      } else {
        const item: Omit<Certification, 'id'> = {
          title, description, url, provider,
          addedBy: appUser.uid, addedByName: appUser.displayName, createdAt: Timestamp.now()
        };
        const docRef = await addDoc(collection(db, 'certifications'), item);
        setCerts(prev => [{ id: docRef.id, ...item } as Certification, ...prev]);
      }
      setShowForm(false);
      setTitle(''); setDescription(''); setUrl(''); setProvider('');
    } catch (err) { alert('Failed to add resource'); }
    setCreating(false);
  };

  const handleDelete = async (id: string, collectionName: 'courses' | 'certifications') => {
    if (!confirm('Delete this item?')) return;
    await deleteDoc(doc(db, collectionName, id));
    if (collectionName === 'courses') setCourses(curr => curr.filter(c => c.id !== id));
    else setCerts(curr => curr.filter(c => c.id !== id));
  };

  const extractYoutubeId = (urlStr: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = urlStr.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (loading || !appUser) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const isSenior = appUser.role === 'senior' || appUser.role === 'admin';

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-1 bg-primary rounded-full" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary-light">Knowledge Base</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-gray-900 leading-tight">
            Learning <span className="text-gradient">Resources</span>
          </h1>
          <p className="text-gray-500 mt-2 max-w-lg">
            Curated courses and industry-standard certifications to accelerate your professional growth.
          </p>
        </div>
        {isSenior && (
           <button
             onClick={() => setShowForm(true)}
             className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-white font-bold shadow-float hover:bg-primary-dark transition-all hover:scale-[1.02] active:scale-95"
           >
             <FiPlus size={20} /> Add Resource
           </button>
        )}
      </div>

      {/* Modern Tab Switcher */}
      <div className="flex items-center gap-1 bg-gray-100/50 p-1.5 rounded-[1.25rem] w-fit mb-12 border border-gray-100">
        <button
          onClick={() => setTab('courses')}
          className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${
            tab === 'courses'
              ? 'bg-white text-primary shadow-premium scale-100'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <FiYoutube className={tab === 'courses' ? 'text-red-500' : ''} /> Recommended Courses
          </div>
        </button>
        <button
          onClick={() => setTab('certs')}
          className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${
            tab === 'certs'
              ? 'bg-white text-primary shadow-premium scale-100'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <FiAward className={tab === 'certs' ? 'text-orange-500' : ''} /> Key Certifications
          </div>
        </button>
      </div>

      {/* Creation Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all p-8 md:p-12 relative">
            <button onClick={() => setShowForm(false)} className="absolute top-8 right-8 p-2 rounded-xl hover:bg-gray-100 text-gray-400">
              <FiX size={24} />
            </button>
            <div className="mb-8">
               <h3 className="text-3xl font-display font-bold text-gray-900">
                 {tab === 'courses' ? 'Recommend a Course' : 'Add Certification'}
               </h3>
               <p className="text-gray-500 mt-2">Share valuable learning materials with the community.</p>
            </div>
            
            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Title</label>
                <input
                  type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                  placeholder={tab === 'courses' ? "e.g. Clean Code JavaScript" : "e.g. AWS Solutions Architect"}
                />
              </div>

              {tab === 'certs' && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Provider</label>
                  <input
                    type="text" required value={provider} onChange={(e) => setProvider(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:border-primary outline-none"
                    placeholder="e.g. Amazon Web Services"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Why this resource?</label>
                <div className="bg-white rounded-2xl overflow-hidden border border-gray-200">
                  <ReactQuill theme="snow" value={description} onChange={setDescription} style={{ height: '150px', marginBottom: '40px' }} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                  {tab === 'courses' ? 'YouTube URL' : 'Certification URL'}
                </label>
                <input
                  type="url" required value={url} onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:border-primary outline-none"
                />
              </div>

              <button
                type="submit" disabled={creating}
                className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-lg shadow-float hover:bg-primary-dark transition-all disabled:opacity-60"
              >
                {creating ? 'Processing...' : 'Add Resource'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Content Grid */}
      {fetching ? (
        <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : tab === 'courses' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {courses.length === 0 ? (
             <div className="col-span-full text-center py-24 bg-white rounded-[3rem] border border-gray-100 shadow-premium">
                <FiYoutube className="mx-auto text-gray-100 mb-6" size={64} />
                <p className="text-gray-400 text-xl font-medium">No courses recommended yet</p>
             </div>
           ) : (
             courses.map((course) => {
               const vId = extractYoutubeId(course.youtubeUrl);
               return (
                 <div key={course.id} className="group relative bg-white rounded-[2.5rem] p-5 shadow-premium hover:shadow-float border border-gray-100 transition-all duration-500 hover:-translate-y-2 flex flex-col">
                   <div className="relative aspect-video rounded-3xl bg-gray-900 flex items-center justify-center overflow-hidden mb-6">
                      {vId ? (
                        <img src={`https://img.youtube.com/vi/${vId}/mqdefault.jpg`} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                      ) : (
                        <FiYoutube size={48} className="text-white/20" />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform">
                            <div className="ml-1 w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent" />
                         </div>
                      </div>
                   </div>
                   
                   <div className="px-3 pb-2 flex flex-col flex-1">
                      <h3 className="text-xl font-display font-bold text-gray-900 mb-2 truncate group-hover:text-primary transition-colors">{course.title}</h3>
                      <div className="text-sm text-gray-500 line-clamp-2 mb-8 h-10 overflow-hidden" dangerouslySetInnerHTML={{ __html: course.description || '' }} />
                      
                      <div className="mt-auto flex items-center justify-between pt-5 border-t border-gray-50">
                         <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Added by {course.addedByName}</span>
                         </div>
                         <div className="flex items-center gap-2">
                            {(course.addedBy === appUser.uid || appUser.role === 'admin') && (
                              <button onClick={() => handleDelete(course.id, 'courses')} className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all">
                                 <FiTrash2 size={16} />
                              </button>
                            )}
                            <Link
                              href={`/courses/${course.id}`}
                              className="px-6 py-2.5 rounded-xl bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-primary transition-all shadow-lg shadow-black/5"
                            >
                              Watch
                            </Link>
                         </div>
                      </div>
                   </div>
                 </div>
               );
             })
           )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {certs.length === 0 ? (
             <div className="col-span-full text-center py-24 bg-white rounded-[3rem] border border-gray-100 shadow-premium">
                <FiAward className="mx-auto text-gray-100 mb-6" size={64} />
                <p className="text-gray-400 text-xl font-medium">No certifications listed yet</p>
             </div>
           ) : (
             certs.map((cert) => (
               <div key={cert.id} className="group relative bg-white rounded-[2.5rem] p-8 shadow-premium hover:shadow-float border border-gray-100 transition-all duration-500 hover:-translate-y-2 flex flex-col">
                   <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform">
                      <FiAward size={32} />
                   </div>
                   <div className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-1">{cert.provider}</div>
                   <h3 className="text-xl font-display font-bold text-gray-900 mb-4 group-hover:text-primary transition-colors">{cert.title}</h3>
                   <div className="text-sm text-gray-500 line-clamp-3 mb-8 flex-1" dangerouslySetInnerHTML={{ __html: cert.description || '' }} />
                   
                   <div className="flex items-center gap-3">
                      <a
                        href={cert.url} target="_blank" rel="noopener noreferrer"
                        className="flex-1 text-center py-3 rounded-2xl bg-gray-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-orange-500 transition-all shadow-lg shadow-black/5"
                      >
                        View Certificate
                      </a>
                      {(cert.addedBy === appUser.uid || appUser.role === 'admin') && (
                        <button onClick={() => handleDelete(cert.id, 'certifications')} className="p-3 rounded-2xl border border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-100 transition-all">
                          <FiTrash2 size={20} />
                        </button>
                      )}
                   </div>
               </div>
             ))
           )}
        </div>
      )}
    </div>
  );
}
