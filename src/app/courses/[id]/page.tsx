'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import 'react-quill-new/dist/quill.snow.css';
import { RecommendedCourse } from '@/types';
import Link from 'next/link';
import { FiArrowLeft, FiYoutube, FiUser, FiCalendar, FiAward } from 'react-icons/fi';

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
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 text-lg mb-4">Course not found</p>
        <Link href="/courses" className="text-primary hover:underline font-semibold">Back to Courses</Link>
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
    <div className="max-w-5xl mx-auto px-4 py-12 pb-24">
      <Link href="/courses" className="group inline-flex items-center gap-2 text-gray-500 hover:text-primary transition-all mb-10 font-bold text-sm uppercase tracking-widest">
        <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Library
      </Link>

      <div className="bg-white rounded-[3rem] shadow-premium border border-gray-100 overflow-hidden">
        {/* Header Section */}
        <div className="relative p-8 md:p-16 border-b border-gray-50 overflow-hidden bg-gray-900 group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl -mr-48 -mt-48 transition-all group-hover:bg-red-600/20" />
          
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-red-600 text-white shadow-lg shadow-red-600/20">
                <FiYoutube size={12} /> Recommended Course
              </span>
              <span className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-full border border-white/10 text-white/60">
                <FiUser size={12} className="text-red-500" /> Curated by {course.addedByName}
              </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-display font-extrabold text-white mb-6 leading-tight">
              {course.title}
            </h1>

            <div className="flex items-center gap-4 text-white/40 text-xs font-bold uppercase tracking-widest">
               <FiCalendar className="text-red-500" /> Added {new Date(course.createdAt?.toMillis()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Video Player */}
        <div className="bg-black">
          {videoId ? (
            <div className="relative aspect-video group shadow-2xl">
              <iframe
                className="absolute top-0 left-0 w-full h-full border-none"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`}
                title={course.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          ) : (
             <div className="p-24 text-center bg-gray-950 flex flex-col items-center">
               <div className="w-20 h-20 rounded-full bg-red-600/20 flex items-center justify-center text-red-500 mb-6">
                 <FiYoutube size={40} />
               </div>
               <p className="text-gray-400 font-medium mb-6">The technical guide is hosted externally.</p>
               <a 
                 href={course.youtubeUrl} target="_blank" rel="noopener noreferrer" 
                 className="px-8 py-3 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all shadow-xl shadow-red-600/20"
               >
                 Launch Video in New Tab
               </a>
             </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-8 md:p-16">
          <section className="relative">
            <div className="absolute inset-0 bg-primary/5 rounded-[2.5rem] -m-6 -z-10 border border-primary/10" />
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                 <FiAward size={20} />
              </div>
              <h2 className="text-2xl font-display font-bold text-gray-900">Senior Insight</h2>
            </div>

            {course.description ? (
               <div 
                 className="prose prose-lg max-w-none text-gray-600 leading-relaxed ql-editor !p-0" 
                 dangerouslySetInnerHTML={{ __html: course.description }} 
               />
            ) : (
               <div className="flex items-center gap-3 p-8 rounded-3xl bg-gray-50 border border-gray-100 text-gray-400 italic">
                  No additional context provided for this resource.
               </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
