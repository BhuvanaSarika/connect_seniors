'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import 'react-quill-new/dist/quill.snow.css';
import { RecommendedCourse } from '@/types';
import Link from 'next/link';
import { FiArrowLeft, FiYoutube, FiUser, FiCalendar, FiAward, FiInfo, FiPlayCircle } from 'react-icons/fi';

export default function CourseDetail() {
  const { appUser, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<RecommendedCourse | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !appUser) router.push('/login');
  }, [loading, appUser, router]);

  useEffect(() => {
    if (!appUser || !courseId) return;
    const fetchCourse = async () => {
      try {
        const snap = await getDoc(doc(db, 'courses', courseId));
        if (snap.exists()) {
          setCourse({ id: snap.id, ...snap.data() } as RecommendedCourse);
        }
      } catch (err) {
        console.error(err);
      }
      setFetching(false);
    };
    fetchCourse();
  }, [appUser, courseId]);

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <FiInfo className="mx-auto text-slate-100 mb-6" size={48} />
        <p className="text-slate-400 font-bold uppercase tracking-widest mb-6">Course resource not found</p>
        <Link href="/courses" className="btn-primary px-8">Return to Library</Link>
      </div>
    );
  }

  const extractYoutubeId = (urlStr: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = urlStr.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = extractYoutubeId(course.youtubeUrl);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 text-slate-900">
      <Link href="/courses" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-all mb-12">
        <FiArrowLeft size={14} /> Back to Course Library
      </Link>

      <div className="clean-card overflow-hidden shadow-2xl shadow-slate-200/50 border-slate-200">
        {/* Course Terminal Header */}
        <div className="p-10 md:p-16 border-b border-slate-100 bg-slate-900 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -mr-48 -mt-48" />
           
           <div className="relative z-10">
              <div className="flex flex-wrap items-center gap-3 mb-8">
                <span className="flex items-center gap-2 px-3 py-1 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-lg">
                   <FiYoutube size={12} /> Technical Resource
                </span>
                <span className="px-3 py-1 bg-white/5 text-slate-400 text-[9px] font-bold uppercase tracking-widest rounded-lg border border-white/10">
                   Curated by {course.addedByName}
                </span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-display font-black text-white mb-8 leading-tight tracking-tight max-w-4xl">
                {course.title}
              </h1>

              <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                 <div className="flex items-center gap-2">
                    <FiCalendar className="text-primary" />
                    <span>Added {new Date(course.createdAt?.toMillis()).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <FiUser className="text-primary" />
                    <span>Senior Approved</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Playback Environment */}
        <div className="bg-black border-y border-slate-800">
          {videoId ? (
            <div className="relative aspect-video">
              <iframe
                className="absolute top-0 left-0 w-full h-full border-none"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`}
                title={course.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          ) : (
             <div className="p-24 text-center bg-slate-950 flex flex-col items-center">
               <FiPlayCircle className="text-slate-800 mb-8" size={64} />
               <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-8">The authorized seminar is hosted on an external terminal.</p>
               <a 
                 href={course.youtubeUrl} target="_blank" rel="noopener noreferrer" 
                 className="btn-primary px-10 py-4 shadow-xl shadow-primary/20"
               >
                 Initialize External Playback
               </a>
             </div>
          )}
        </div>

        {/* Insight Section */}
        <div className="p-10 md:p-16">
          <section>
             <div className="flex items-center gap-4 mb-10">
                <div className="w-10 h-1 bg-slate-900 rounded-full" />
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Senior Technical Rationale</p>
             </div>

             {course.description ? (
                <div 
                  className="prose prose-slate max-w-none text-slate-600 leading-relaxed font-medium ql-editor !p-0" 
                  dangerouslySetInnerHTML={{ __html: course.description }} 
                />
             ) : (
                <div className="p-10 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 font-bold uppercase tracking-widest text-[10px] italic text-center">
                   No auxiliary rationale indexed for this resource.
                </div>
             )}
          </section>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="mt-12 pt-12 border-t border-slate-100 flex justify-between items-center opacity-50">
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Resource GUID: {course.id}</p>
         <Link href="/courses" className="text-[10px] font-black uppercase text-slate-900 hover:underline">Return to library</Link>
      </div>
    </div>
  );
}
