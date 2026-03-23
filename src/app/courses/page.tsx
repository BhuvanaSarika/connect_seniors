'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { RecommendedCourse, Certification } from '@/types';
import { FiYoutube, FiAward, FiPlus, FiTrash2, FiExternalLink, FiX, FiUser, FiBookOpen, FiShield } from 'react-icons/fi';
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
    } catch (err) { alert('Operational failure: could not provision technical resource.'); }
    setCreating(false);
  };

  const handleDelete = async (id: string, collectionName: 'courses' | 'certifications') => {
    if (!confirm('Operational security: confirm deletion of this technical resource?')) return;
    await deleteDoc(doc(db, collectionName, id));
    if (collectionName === 'courses') setCourses(curr => curr.filter(c => c.id !== id));
    else setCerts(curr => curr.filter(c => c.id !== id));
  };

  const extractYoutubeId = (urlStr: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = urlStr.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
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
           <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Knowledge Base</p>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-display font-black text-slate-900 leading-tight mb-4 tracking-tight">
              Curated <span className="text-slate-900/40 italic">Curriculum.</span>
            </h1>
            <p className="text-slate-500 font-medium leading-relaxed">
               Industry-standard technical resources and recognized certification paths. Meticulously vetted by seniors to ensure alignment with professional engineering standards.
            </p>
          </div>
          {isSenior && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary flex items-center gap-3 px-8 shadow-xl shadow-primary/20"
            >
              <FiPlus size={18} /> <span>Provision Resource</span>
            </button>
          )}
        </div>
      </div>

      {/* Modern Tab Switcher */}
      <div className="flex items-center gap-8 mb-16 border-b border-slate-100 pb-px">
        <button
          onClick={() => setTab('courses')}
          className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${
            tab === 'courses' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Technical Courses
          {tab === 'courses' && <div className="absolute bottom-0 inset-x-0 h-1 bg-primary rounded-full" />}
        </button>
        <button
          onClick={() => setTab('certs')}
          className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${
            tab === 'certs' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Industry Certifications
          {tab === 'certs' && <div className="absolute bottom-0 inset-x-0 h-1 bg-primary rounded-full" />}
        </button>
      </div>

      {/* Creation Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto transform transition-all p-10 md:p-14 relative border border-white/10">
            <button onClick={() => setShowForm(false)} className="absolute top-8 right-8 p-3 rounded-xl bg-slate-100 text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
              <FiX size={20} />
            </button>
            <div className="mb-12">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Protocol: provisioning</p>
               <h3 className="text-3xl font-display font-black text-slate-900 mb-2">
                 {tab === 'courses' ? 'Authorize Course' : 'Add Certification'}
               </h3>
               <p className="text-slate-500 font-medium">Injecting high-fidelity technical resources into the global knowledge base.</p>
            </div>
            
            <form onSubmit={handleCreate} className="space-y-8">
              <div>
                <label className="section-label mb-3 block">System Title</label>
                <input
                  type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary outline-none transition-all font-medium text-sm"
                  placeholder={tab === 'courses' ? "e.g. Advanced System Design" : "e.g. Google Cloud Professional Architect"}
                />
              </div>

              {tab === 'certs' && (
                <div>
                  <label className="section-label mb-3 block">Issuing Authority</label>
                  <input
                    type="text" required value={provider} onChange={(e) => setProvider(e.target.value)}
                    className="w-full px-5 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary outline-none transition-all font-medium text-sm"
                    placeholder="e.g. Amazon Web Services"
                  />
                </div>
              )}

              <div>
                <label className="section-label mb-3 block">Technical Rationale</label>
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                  <ReactQuill theme="snow" value={description} onChange={setDescription} />
                </div>
              </div>

              <div>
                <label className="section-label mb-3 block">
                  {tab === 'courses' ? 'Source Video URL' : 'Certification Terminal URL'}
                </label>
                <input
                  type="url" required value={url} onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary outline-none transition-all font-medium text-sm"
                />
              </div>

              <div className="pt-6">
                <button
                  type="submit" disabled={creating}
                  className="btn-primary w-full py-4 text-sm disabled:opacity-20 shadow-xl shadow-primary/20"
                >
                  {creating ? 'Syncing Resource...' : 'Provision Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Content Grid */}
      {fetching ? (
        <div className="flex justify-center py-24"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : tab === 'courses' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {courses.length === 0 ? (
             <div className="col-span-full clean-card py-32 text-center border-slate-100 bg-slate-50/10">
                <FiYoutube className="mx-auto text-slate-100 mb-6" size={48} />
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No technical courses have been provisioned.</p>
             </div>
           ) : (
             courses.map((course) => {
               const vId = extractYoutubeId(course.youtubeUrl);
               return (
                 <div key={course.id} className="clean-card p-6 group flex flex-col hover:border-primary/30 transition-all duration-300">
                   <div className="relative aspect-video rounded-xl bg-slate-900 flex items-center justify-center overflow-hidden mb-6 border border-slate-800">
                      {vId ? (
                        <img src={`https://img.youtube.com/vi/${vId}/mqdefault.jpg`} alt="" className="w-full h-full object-cover opacity-40 group-hover:opacity-20 transition-opacity" />
                      ) : (
                        <FiYoutube size={40} className="text-slate-800" />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-white shadow-xl group-hover:bg-primary group-hover:scale-110 transition-all">
                            <div className="ml-1 w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent" />
                         </div>
                      </div>
                   </div>
                   
                   <div className="flex flex-col flex-1">
                      <h3 className="text-lg font-bold text-slate-900 mb-2 font-display group-hover:text-primary transition-colors truncate">{course.title}</h3>
                      <div className="text-sm text-slate-500 font-medium line-clamp-2 mb-8 h-[40px] prose prose-slate" dangerouslySetInnerHTML={{ __html: course.description || '' }} />
                      
                      <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-100">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center text-[10px] font-black uppercase border border-slate-100">
                               {course.addedByName?.[0] || 'A'}
                             </div>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                By {course.addedByName}
                             </p>
                          </div>
                         <div className="flex items-center gap-2">
                            {(course.addedBy === appUser.uid || appUser.role === 'admin') && (
                              <button onClick={() => handleDelete(course.id, 'courses')} className="p-2 rounded-lg hover:bg-red-600 hover:text-white text-slate-300 transition-all">
                                 <FiTrash2 size={14} />
                              </button>
                            )}
                            <Link
                              href={`/courses/${course.id}`}
                              className="btn-primary text-[9px] px-5 py-2"
                            >
                              Initialize
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
             <div className="col-span-full clean-card py-32 text-center border-slate-100 bg-slate-50/10">
                <FiAward className="mx-auto text-slate-100 mb-6" size={48} />
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No industry certifications are currently indexed.</p>
             </div>
           ) : (
             certs.map((cert) => (
                <div key={cert.id} className="clean-card p-8 group flex flex-col hover:border-primary/30 transition-all duration-300">
                   <div className="flex items-start justify-between mb-8">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-900 flex items-center justify-center border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                         <FiAward size={24} />
                      </div>
                      <span className="px-3 py-1 bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-400 border border-slate-100 rounded">
                         Certification
                      </span>
                   </div>
                   
                   <div className="flex-1">
                      <p className="text-[9px] font-bold text-primary uppercase tracking-[0.2em] mb-1">{cert.provider}</p>
                      <h3 className="text-xl font-bold text-slate-900 mb-4 font-display group-hover:text-primary transition-colors">{cert.title}</h3>
                      <div className="text-sm text-slate-500 font-medium leading-relaxed mb-10 prose prose-slate" dangerouslySetInnerHTML={{ __html: cert.description || '' }} />
                   </div>

                   <div className="mt-auto flex items-center gap-3">
                      <a
                        href={cert.url} target="_blank" rel="noopener noreferrer"
                        className="btn-primary text-[9px] flex-1 py-3"
                      >
                        Inspect Authority
                      </a>
                      {(cert.addedBy === appUser.uid || appUser.role === 'admin') && (
                        <button onClick={() => handleDelete(cert.id, 'certifications')} className="p-3 rounded-xl border border-slate-100 text-slate-300 hover:bg-red-600 hover:text-white transition-all">
                          <FiTrash2 size={16} />
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
