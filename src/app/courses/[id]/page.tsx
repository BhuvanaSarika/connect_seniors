'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { RecommendedCourse } from '@/types';
import Link from 'next/link';
import { FiArrowLeft, FiYoutube, FiUser, FiCalendar } from 'react-icons/fi';

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
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/courses" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary transition-colors mb-6 font-medium">
        <FiArrowLeft /> Back to Courses
      </Link>

      <div className="bg-white rounded-3xl shadow-xl shadow-primary/5 border border-muted/20 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-500 p-8 md:p-10 text-white">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="flex items-center gap-1.5 text-xs text-red-700 bg-white/90 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              <FiYoutube /> Recommended Course
            </span>
            <span className="flex items-center gap-1.5 text-xs text-white/90 bg-black/20 px-3 py-1 rounded-full font-medium">
              <FiUser /> Added by {course.addedByName}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-white/90 bg-black/20 px-3 py-1 rounded-full font-medium">
              <FiCalendar /> {new Date(course.createdAt?.toMillis()).toLocaleDateString()}
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">{course.title}</h1>
        </div>

        {/* Video Player */}
        {videoId ? (
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full border-b border-gray-100"
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        ) : (
           <div className="p-8 bg-gray-50 text-center border-b border-gray-100">
             <FiYoutube size={48} className="mx-auto text-gray-300 mb-4" />
             <p className="text-gray-500">Invalid YouTube URL or unsupported format.</p>
             <a href={course.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline mt-2 inline-block">Try Opening Directly</a>
           </div>
        )}

        {/* Content */}
        <div className="p-8 md:p-10">
          <section>
            <h2 className="text-xl font-bold text-primary-dark mb-4 border-b border-gray-100 pb-2">Why review this course?</h2>
            {course.description ? (
               <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg">
                 {course.description}
               </p>
            ) : (
               <p className="text-gray-400 italic">No description provided by the senior.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
