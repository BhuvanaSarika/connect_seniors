"use client"
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { collection, doc, getDocs, addDoc, updateDoc, Timestamp, query, where, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ResumeSubmission, ResumeReview } from '@/types';
import { FiUploadCloud, FiFileText, FiCheckCircle, FiStar, FiMessageSquare, FiExternalLink, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function ResumePage() {
  const { appUser, loading } = useAuth();
  const router = useRouter();

  const [resumes, setResumes] = useState<ResumeSubmission[]>([]);
  const [fetching, setFetching] = useState(true);

  // Upload state (Juniors)
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Review state (Seniors)
  const [rating, setRating] = useState<number>(5);
  const [feedback, setFeedback] = useState('');
  const [reviewStatus, setReviewStatus] = useState<'pending' | 'submitting'>('pending');

  // Modal Viewer State
  const [viewingResume, setViewingResume] = useState<ResumeSubmission | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!loading && !appUser) router.push('/login');
  }, [loading, appUser, router]);

  useEffect(() => {
    if (!appUser) return;
    const fetchResumes = async () => {
      try {
        let q;
        if (appUser.role === 'junior') {
          q = query(collection(db, 'resumes'), where('juniorUid', '==', appUser.uid));
        } else {
          q = query(collection(db, 'resumes'));
        }

        const snap = await getDocs(q);
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as ResumeSubmission));

        // Client-side sort to avoid Firebase index requirement
        docs.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
        setResumes(docs);
      } catch (err) {
        console.error(err);
      }
      setFetching(false);
    };
    fetchResumes();
  }, [appUser]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedInfo = e.target.files[0];
      if (selectedInfo.type !== 'application/pdf') {
        alert('Only PDF files are allowed');
        return;
      }
      if (selectedInfo.size > 5 * 1024 * 1024) {
        alert('File size must be under 5MB');
        return;
      }
      setFile(selectedInfo);
    }
  };

  const handleUpload = async () => {
    if (!appUser || !file) return;
    setUploading(true);
    try {
      // Upload to Cloudinary via backend API
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload to Cloudinary');
      }

      const downloadUrls = data.urls;

      // Create Firestore doc
      const submission: Omit<ResumeSubmission, 'id'> = {
        juniorUid: appUser.uid,
        juniorName: appUser.displayName,
        juniorRollNumber: appUser.rollNumber,
        fileUrls: downloadUrls,
        fileName: file.name,
        status: 'pending',
        reviews: [],
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'resumes'), submission);
      setResumes(prev => [{ id: docRef.id, ...submission } as ResumeSubmission, ...prev]);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      alert('Resume uploaded successfully. Seniors have been notified!');
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    }
    setUploading(false);
  };

  const handleSubmitReview = async (submissionId: string) => {
    if (!appUser || !feedback.trim()) return;
    setReviewStatus('submitting');
    try {
      const review: ResumeReview = {
        seniorUid: appUser.uid,
        seniorName: appUser.displayName,
        rating,
        feedback,
        createdAt: Timestamp.now(),
      };

      const docRef = doc(db, 'resumes', submissionId);
      await updateDoc(docRef, {
        status: 'reviewed',
        reviews: arrayUnion(review)
      });

      setResumes(prev => prev.map(r =>
        r.id === submissionId
          ? { ...r, status: 'reviewed', reviews: [...(r.reviews || []), review] }
          : r
      ));

      setRating(5);
      setFeedback('');
    } catch (err) {
      console.error(err);
      alert('Failed to submit review');
    }
    setReviewStatus('pending');
  };

  if (loading || !appUser) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const isJunior = appUser.role === 'junior';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary-dark">Resume Validation</h1>
        <p className="text-gray-500 mt-1">
          {isJunior ? 'Upload your resume for review by experienced seniors' : 'Review and validate junior resumes'}
        </p>
      </div>

      {/* Junior Upload Section */}
      {isJunior && (
        <div className="bg-white rounded-2xl shadow-sm border border-muted/20 p-6 mb-10">
          <label className="block text-sm font-medium text-gray-700 mb-4">Upload New Resume (PDF, Max 5MB)</label>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full relative">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                ref={fileInputRef}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploading}
              />
              <div className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed transition-all ${file ? 'border-primary bg-primary/5' : 'border-gray-300 bg-gray-50 hover:border-primary-light'
                }`}>
                <FiUploadCloud className={`text-2xl ${file ? 'text-primary' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium truncate ${file ? 'text-primary' : 'text-gray-500'}`}>
                  {file ? file.name : 'Click or drag PDF here'}
                </span>
              </div>
            </div>
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-white font-semibold shadow-lg hover:shadow-primary/40 disabled:opacity-50 transition-all"
            >
              {uploading ? 'Uploading...' : 'Upload & Notify'}
            </button>
          </div>
        </div>
      )}

      {/* Resumes List */}
      <div>
        <h2 className="text-xl font-bold text-primary-dark flex items-center gap-2 mb-6">
          <FiFileText className="text-primary-light" />
          {isJunior ? 'My Submissions' : 'Pending & Reviewed Resumes'}
        </h2>

        {fetching ? (
          <div className="flex justify-center py-10"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
        ) : resumes.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-muted/20">
            <p className="text-gray-400">No resumes found.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {resumes.map(resume => (
              <div key={resume.id} className="bg-white rounded-2xl shadow-md border border-muted/20 overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex flex-wrap gap-4 items-center justify-between bg-bg-light/50">
                  <div>
                    <h3 className="font-bold text-primary-dark">{resume.juniorName} <span className="text-sm font-normal text-gray-500 uppercase">({resume.juniorRollNumber})</span></h3>
                    <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                      <FiFileText /> {resume.fileName}
                      <span className="text-muted">•</span>
                      {new Date(resume.createdAt.toMillis()).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${resume.status === 'reviewed' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                      }`}>
                      {resume.status}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setViewingResume(resume);
                    setCurrentImageIndex(0);
                    if (!isJunior && reviewStatus !== 'submitting') {
                        setRating(5);
                        setFeedback('');
                    }
                  }}
                  className="mt-4 mb-4 flex items-center gap-2 text-sm font-semibold text-primary bg-primary/5 px-4 py-2 rounded-xl border border-primary/10 hover:bg-primary/10 transition-all hover:scale-[1.02]"
                >
                  <FiExternalLink size={16} /> Open Resume Viewer ({resume.fileUrls?.length || 0} Pages)
                </button>

                {/* Reviews List */}
                {resume.reviews && resume.reviews.length > 0 && (
                  <div className="p-5 bg-white space-y-4">
                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Feedback</h4>
                    {resume.reviews.map((review, i) => (
                      <div key={i} className="bg-bg-light rounded-xl p-4 border border-muted/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-primary">{review.seniorName}</span>
                          <div className="flex items-center gap-1 text-yellow-400">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <FiStar key={idx} className={idx < review.rating ? 'fill-current' : 'text-gray-300'} size={14} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {review.feedback}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </div>

      {viewingResume && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[95vh] overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white z-10 shadow-sm relative">
              <div>
                <h3 className="font-bold text-xl text-primary-dark flex items-center gap-2">
                  <FiFileText className="text-primary" /> {viewingResume.juniorName}&apos;s Resume
                </h3>
                <p className="text-sm font-semibold text-gray-500 mt-0.5 ml-7 text-primary/80">Page {currentImageIndex + 1} of {viewingResume.fileUrls?.length || 1}</p>
              </div>
              <button onClick={() => setViewingResume(null)} className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors">
                <FiX size={24} />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-hidden flex bg-gray-100/50 relative">
               {/* Left/Center: The actual image carousel */}
               <div className="flex-1 relative flex items-center justify-center p-4">
                  <div className="relative h-full w-full max-w-4xl max-h-full flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                       src={viewingResume.fileUrls?.[currentImageIndex]} 
                       alt={`Page ${currentImageIndex + 1}`} 
                       className="max-h-full max-w-full object-contain shadow-md ring-1 ring-gray-900/5 bg-white scale-[1.01]"
                    />
                  </div>
                  
                  {/* Navigation Arrows */}
                  <button 
                     onClick={() => setCurrentImageIndex(i => Math.max(0, i - 1))}
                     disabled={currentImageIndex === 0}
                     className="absolute left-4 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white text-gray-800 shadow-xl hover:bg-gray-50 hover:scale-110 disabled:opacity-0 transition-all z-10 group"
                  >
                     <FiChevronLeft size={28} className="group-hover:-translate-x-0.5 transition-transform" />
                  </button>
                  <button 
                     onClick={() => setCurrentImageIndex(i => Math.min((viewingResume.fileUrls?.length || 1) - 1, i + 1))}
                     disabled={currentImageIndex === (viewingResume.fileUrls?.length || 1) - 1}
                     className="absolute right-4 top-1/2 -translate-y-1/2 p-4 rounded-full bg-primary text-white shadow-xl hover:bg-primary-dark hover:scale-110 disabled:opacity-0 transition-all z-10 group"
                  >
                     <FiChevronRight size={28} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
               </div>

               {/* Right Side: Review Form (Shows dynamically on the last page for seniors) */}
               {currentImageIndex === (viewingResume.fileUrls?.length || 1) - 1 && !isJunior && (
                 <div className="w-full max-w-md bg-white border-l border-gray-100 p-8 flex flex-col shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)] overflow-y-auto z-20 animate-in slide-in-from-right-10 duration-300">
                   <div className="mb-8 border-b border-gray-100 pb-6">
                     <h3 className="text-2xl font-extrabold text-primary-dark flex items-center gap-2 mb-2">
                       <FiCheckCircle className="text-green-500" /> Final Review
                     </h3>
                     <p className="text-sm text-gray-500 leading-relaxed">
                       You have reached the end of the document. Provide your comprehensive rating and feedback below.
                     </p>
                   </div>
                   
                   <div className="flex-1 space-y-6">
                      <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                        <label className="block text-sm font-bold text-gray-700 mb-3">Overall Rating</label>
                        <div className="flex items-center gap-4">
                          <input type="range" min="1" max="5" value={rating} onChange={e => setRating(Number(e.target.value))} className="flex-1 accent-primary cursor-pointer" />
                          <div className="flex flex-col items-center justify-center bg-primary/10 w-12 h-12 rounded-xl border border-primary/20">
                            <span className="font-bold text-lg text-primary">{rating}</span>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium">
                          <span>Needs Work</span>
                          <span>Excellent</span>
                        </div>
                      </div>

                      <div className="flex flex-col flex-1 min-h-[250px]">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Constructive Feedback</label>
                        <textarea
                          value={feedback}
                          onChange={e => setFeedback(e.target.value)}
                          className="flex-1 w-full px-5 py-4 rounded-2xl border border-gray-200 focus:border-primary outline-none focus:ring-4 focus:ring-primary/10 bg-white resize-none shadow-sm transition-all"
                          placeholder="Highlight strengths, point out formatting errors, and provide actionable advice to improve this resume..."
                          required
                        />
                      </div>
                   </div>

                   <div className="mt-8 pt-6 border-t border-gray-100 flex gap-3">
                     <button
                        onClick={async () => {
                           await handleSubmitReview(viewingResume.id);
                           setViewingResume(null);
                        }}
                        disabled={reviewStatus === 'submitting' || !feedback.trim()}
                        className="flex-1 py-4 rounded-xl bg-gradient-to-r from-primary to-primary-light text-white font-bold shadow-lg hover:shadow-primary/30 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 text-lg"
                     >
                       {reviewStatus === 'submitting' ? 'Submitting...' : 'Submit Evaluation'}
                     </button>
                   </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
