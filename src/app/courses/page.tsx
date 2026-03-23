'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { RecommendedCourse, Certification } from '@/types';
import { FiYoutube, FiAward, FiPlus, FiTrash2, FiExternalLink, FiX } from 'react-icons/fi';
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary-dark">Learning Resources</h1>
          <p className="text-gray-500 mt-1">Curated courses and certifications by seniors</p>
        </div>
        {isSenior && (
          <button onClick={() => setShowForm(!showForm)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold shadow-lg transition-all ${
            showForm ? 'bg-gray-100 text-gray-700' : 'bg-gradient-to-r from-primary to-primary-light text-white hover:shadow-primary/40'
          }`}>
            {showForm ? <FiX size={18} /> : <FiPlus size={18} />} {showForm ? 'Close' : (tab === 'courses' ? 'Add Course' : 'Add Cert')}
          </button>
        )}
      </div>

      <div className="flex gap-4 mb-8">
        <button onClick={() => setTab('courses')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${tab === 'courses' ? 'bg-primary text-white shadow-lg' : 'bg-white text-gray-500 border border-muted/30 hover:border-primary-light'}`}>
          <FiYoutube size={20} /> Recommended Courses
        </button>
        <button onClick={() => setTab('certs')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${tab === 'certs' ? 'bg-primary text-white shadow-lg' : 'bg-white text-gray-500 border border-muted/30 hover:border-primary-light'}`}>
          <FiAward size={20} /> Certifications
        </button>
      </div>

      {showForm && (
        <div className="mb-10 bg-white rounded-2xl shadow-lg border border-muted/30 p-6 animate-in slide-in-from-top-4">
          <h3 className="text-lg font-bold text-primary-dark mb-4">New {tab === 'courses' ? 'Course (YouTube)' : 'Certification'}</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-bg-light" placeholder="Title" />
              <input type="url" required value={url} onChange={e => setUrl(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-bg-light" placeholder={tab === 'courses' ? "YouTube Link" : "Certification URL"} />
              {tab === 'certs' && (
                <input type="text" required value={provider} onChange={e => setProvider(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none bg-bg-light md:col-span-2" placeholder="Provider (e.g. AWS, Coursera)" />
              )}
              <div className="md:col-span-2">
                 <label className="block text-sm font-semibold text-gray-700 mb-2">Description / Why recommend?</label>
                 <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
                   <ReactQuill theme="snow" value={description} onChange={setDescription} style={{ height: '120px', marginBottom: '40px' }} placeholder="Why do you recommend this?" />
                 </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={creating} className="px-6 py-2 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark disabled:opacity-50">Add</button>
            </div>
          </form>
        </div>
      )}

      {fetching ? (
        <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : tab === 'courses' ? (
        // COURSES GRID
        courses.length === 0 ? <p className="text-center text-gray-500 py-20">No courses recommended yet.</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => {
              const videoId = extractYoutubeId(course.youtubeUrl);
              return (
                <div key={course.id} className="bg-white rounded-2xl shadow-md border border-muted/20 overflow-hidden group hover:shadow-xl transition-all">
                  {videoId ? (
                    <div className="relative pt-[56.25%] bg-gray-100">
                      <img src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} alt="Thumbnail" className="absolute top-0 left-0 w-full h-full object-cover" />
                      <a href={course.youtubeUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                        <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 transition-transform">
                          <FiYoutube size={28} />
                        </div>
                      </a>
                    </div>
                  ) : (
                    <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <FiYoutube size={40} className="text-gray-400" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                       <h3 className="font-bold text-primary-dark leading-tight line-clamp-2">{course.title}</h3>
                       {(course.addedBy === appUser.uid || appUser.role === 'admin') && (
                         <button onClick={() => handleDelete(course.id, 'courses')} className="text-gray-300 hover:text-red-500"><FiTrash2 size={16} /></button>
                       )}
                    </div>
                    {course.description && (
                      <div className="text-sm text-gray-600 mb-4 line-clamp-2 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: course.description }} />
                    )}
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                       <p className="text-xs text-gray-400">By {course.addedByName}</p>
                       <Link href={`/courses/${course.id}`} className="text-sm font-semibold text-primary hover:text-primary-dark hover:underline">View Course &rarr;</Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        // CERTS GRID
        certs.length === 0 ? <p className="text-center text-gray-500 py-20">No certifications recommended yet.</p> : (
          <div className="space-y-4">
            {certs.map(cert => (
              <div key={cert.id} className="bg-white rounded-2xl shadow-sm border border-muted/20 p-5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                    <FiAward size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-primary-dark mb-1">{cert.title}</h3>
                    <p className="text-sm font-semibold text-primary mb-1">{cert.provider}</p>
                    {cert.description && (
                       <div className="text-sm text-gray-600 max-w-2xl prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: cert.description }} />
                    )}
                    <p className="text-xs text-gray-400 mt-2">Added by {cert.addedByName}</p>
                  </div>
                </div>
                <div className="flex flex-row sm:flex-col gap-2 shrink-0 w-full sm:w-auto mt-4 sm:mt-0">
                  <a href={cert.url} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-bg-light text-primary font-semibold hover:bg-primary hover:text-white transition-colors">
                    View <FiExternalLink />
                  </a>
                  {(cert.addedBy === appUser.uid || appUser.role === 'admin') && (
                    <button onClick={() => handleDelete(cert.id, 'certifications')} className="px-5 py-2.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 font-medium transition-colors">
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
