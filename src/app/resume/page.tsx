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
      setViewingResume(null); // Close modal on success
    } catch (err) {
      console.error(err);
      alert('Failed to submit review');
    }
    setReviewStatus('pending');
  };

  if (loading || !appUser) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const isSenior = appUser.role === 'senior' || appUser.role === 'admin';
  const isJunior = appUser.role === 'junior';

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-1 bg-fuchsia-500 rounded-full" />
            <span className="text-xs font-bold uppercase tracking-widest text-fuchsia-500/60">Career Accelerator</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-gray-900 leading-tight">
            Resume <span className="text-gradient">Intelligence</span>
          </h1>
          <p className="text-gray-500 mt-2 max-w-lg">
            Get expert feedback from seniors to optimize your resume for high-tier engineering roles.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Upload or Stats */}
        <div className="lg:col-span-4 space-y-8">
          {isJunior && (
            <div className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-gray-100 group relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/5 rounded-full -mr-16 -mt-16 transition-all group-hover:scale-150" />
               <h2 className="text-2xl font-display font-bold text-gray-900 mb-6 relative z-10">New Submission</h2>
               
               <div 
                 onClick={() => fileInputRef.current?.click()}
                 className={`relative z-10 border-2 border-dashed rounded-[2rem] p-8 text-center cursor-pointer transition-all duration-500 ${
                   file ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-primary/30 hover:bg-gray-50/50'
                 }`}
               >
                 <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".pdf" className="hidden" />
                 <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-all duration-500 ${
                   file ? 'bg-primary text-white scale-110 shadow-lg' : 'bg-gray-50 text-gray-400 group-hover:text-primary'
                 }`}>
                   <FiUploadCloud size={32} />
                 </div>
                 {file ? (
                   <div className="animate-in fade-in slide-in-from-bottom-2">
                     <p className="text-sm font-bold text-primary truncate max-w-[200px] mx-auto">{file.name}</p>
                     <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Ready to upload</p>
                   </div>
                 ) : (
                   <div>
                     <p className="text-sm font-bold text-gray-900">Drop PDF here</p>
                     <p className="text-xs text-gray-400 mt-1">or click to browse library</p>
                   </div>
                 )}
               </div>

               <button
                 onClick={handleUpload}
                 disabled={!file || uploading}
                 className="w-full mt-6 py-4 rounded-2xl bg-gray-900 text-white font-bold text-sm uppercase tracking-widest shadow-float hover:bg-primary transition-all active:scale-95 disabled:opacity-30"
               >
                 {uploading ? 'Processing Assets...' : 'Analyze My Resume'}
               </button>
               <p className="text-[10px] text-center text-gray-400 mt-4 font-bold uppercase tracking-tighter">Only PDF files (max 5MB)</p>
            </div>
          )}

          <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-premium relative overflow-hidden">
             <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mb-24" />
             <div className="relative z-10">
                <FiMessageSquare className="text-primary mb-6" size={32} />
                <h3 className="text-2xl font-display font-bold mb-2">Expert Insights</h3>
                <p className="text-white/60 text-sm leading-relaxed mb-6">Seniors look for impact, technical depth, and clarity. Make sure your project descriptions highlight your unique contribution.</p>
                <div className="flex items-center gap-3">
                   <div className="h-1 w-12 bg-primary rounded-full" />
                   <span className="text-[10px] font-bold uppercase tracking-widest">ConnectSeniors Standard</span>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: List */}
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-display font-bold text-gray-900">
              {isSenior ? 'Pending Assessments' : 'My Analysis Log'}
            </h2>
            <div className="px-4 py-1.5 rounded-full bg-gray-50 border border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {resumes.length} Records
            </div>
          </div>

          {fetching ? (
            <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" /></div>
          ) : resumes.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-[3rem] border border-gray-100 shadow-premium">
              <FiFileText className="mx-auto text-gray-100 mb-6" size={64} />
              <p className="text-gray-400 text-xl font-medium">No resumes found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {resumes.map(resume => (
                <div key={resume.id} className="group relative bg-white rounded-[2.5rem] p-6 shadow-premium hover:shadow-float border border-gray-100 transition-all duration-500 flex flex-col cursor-pointer" onClick={() => setViewingResume(resume)}>
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
                      <FiFileText size={24} />
                    </div>
                    {resume.reviews && resume.reviews.length > 0 ? (
                      <span className="flex items-center gap-1 text-emerald-500 bg-emerald-50 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-emerald-100">
                        <FiCheckCircle size={10} /> Reviewed
                      </span>
                    ) : (
                      <span className="text-amber-500 bg-amber-50 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-amber-100">
                        Pending
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-display font-bold text-gray-900 mb-1 group-hover:text-primary transition-colors truncate">{resume.fileName}</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">By {resume.juniorName}</p>
                    
                    {resume.reviews && resume.reviews.length > 0 && (
                      <div className="mt-4 flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FiStar
                            key={star}
                            size={12}
                            className={star <= (resume.reviews?.[0]?.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-5 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                       {new Date(resume.createdAt.toMillis()).toLocaleDateString()}
                    </span>
                    <span className="text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                       View Analysis &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modern Resume Viewer Modal */}
      {viewingResume && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-6xl h-[95vh] flex flex-col md:flex-row shadow-2xl overflow-hidden relative">
            <button onClick={() => setViewingResume(null)} className="absolute top-6 right-6 z-[160] p-3 rounded-2xl bg-white/10 text-white md:bg-gray-100 md:text-gray-400 hover:scale-110 transition-all backdrop-blur-xl">
               <FiX size={24} />
            </button>

            {/* Left: Document View */}
            <div className="flex-1 bg-gray-950 flex flex-col p-6 min-h-0 relative">
               <div className="flex-1 relative rounded-2xl overflow-hidden bg-white/5 group flex items-center justify-center">
                  <img 
                    src={viewingResume.fileUrls[currentImageIndex]} 
                    alt="Resume page" 
                    className="max-h-full max-w-full object-contain animate-in zoom-in-95 duration-500"
                  />
                  {viewingResume.fileUrls.length > 1 && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => Math.max(0, prev - 1)); }} className={`absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-black/40 text-white backdrop-blur-xl hover:bg-primary transition-all ${currentImageIndex === 0 ? 'opacity-0' : 'opacity-100'}`}>
                         <FiChevronLeft size={24} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => Math.min(viewingResume.fileUrls.length - 1, prev + 1)); }} className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-black/40 text-white backdrop-blur-xl hover:bg-primary transition-all ${currentImageIndex === viewingResume.fileUrls.length - 1 ? 'opacity-0' : 'opacity-100'}`}>
                         <FiChevronRight size={24} />
                      </button>
                    </>
                  )}
               </div>
               <div className="flex justify-center mt-6 gap-2">
                  {viewingResume.fileUrls.map((_, i) => (
                    <button key={i} onClick={() => setCurrentImageIndex(i)} className={`h-1.5 rounded-full transition-all duration-500 ${currentImageIndex === i ? 'w-8 bg-primary' : 'w-2 bg-white/20'}`} />
                  ))}
               </div>
            </div>

            {/* Right: Insights Panel */}
            <div className="w-full md:w-96 bg-white flex flex-col p-8 md:p-12 overflow-y-auto border-l border-gray-100">
               <div className="mb-10">
                  <h3 className="text-3xl font-display font-bold text-gray-900 mb-2">Analysis</h3>
                  <p className="text-gray-500 text-sm font-medium">Assessing <span className="text-primary font-bold">{viewingResume.juniorName}</span></p>
               </div>

               {viewingResume.reviews && viewingResume.reviews.length > 0 ? (
                  <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                    {viewingResume.reviews.map((rev, i) => (
                      <div key={i} className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                         <div className="flex items-center gap-1 mb-4">
                            {[1, 2, 3, 4, 5].map(s => <FiStar key={s} size={16} className={s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />)}
                         </div>
                         <p className="text-gray-600 text-sm leading-relaxed mb-6 font-medium italic">"{rev.feedback}"</p>
                         <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assessed by {rev.seniorName}</span>
                         </div>
                      </div>
                    ))}
                  </div>
               ) : isSenior ? (
                  <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 flex flex-col flex-1">
                     <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1">Overall Rating</label>
                        <div className="flex gap-2">
                           {[1, 2, 3, 4, 5].map(s => (
                             <button 
                               key={s} onClick={() => setRating(s)} 
                               className={`p-3 rounded-xl transition-all ${s <= rating ? 'bg-amber-100 text-amber-500 scale-110 shadow-lg shadow-amber-500/10' : 'bg-gray-50 text-gray-300'}`}
                             >
                               <FiStar size={24} className={s <= rating ? 'fill-amber-500' : ''} />
                             </button>
                           ))}
                        </div>
                     </div>

                     <div className="flex-1 flex flex-col">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1">Expert Feedback</label>
                        <textarea
                          value={feedback} onChange={e => setFeedback(e.target.value)}
                          className="flex-1 w-full px-5 py-4 rounded-[2rem] bg-gray-50 border border-gray-100 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-sm font-medium resize-none"
                          placeholder="Highlight strengths and suggest specific edits..."
                        />
                     </div>

                     <button
                       onClick={() => handleSubmitReview(viewingResume.id)}
                       disabled={!feedback.trim() || reviewStatus === 'submitting'}
                       className="w-full py-4 mt-6 rounded-2xl bg-primary text-white font-bold text-sm uppercase tracking-widest shadow-float hover:bg-primary-dark transition-all active:scale-95 disabled:opacity-30"
                     >
                       {reviewStatus === 'submitting' ? 'Submitting Insights...' : 'Publish Assessment'}
                     </button>
                  </div>
               ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                     <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-6">
                        <FiMessageSquare size={32} />
                     </div>
                     <p className="text-gray-500 font-bold mb-1">Awaiting Expert Insights</p>
                     <p className="text-xs text-gray-400 max-w-[200px] leading-relaxed">A senior mentor will review your resume shortly. You'll be notified of the rating.</p>
                  </div>
               )}

               <div className="mt-auto pt-8 border-t border-gray-50">
                  <a href={viewingResume.fileUrls[0]} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-primary font-bold text-xs uppercase tracking-widest hover:underline">
                     <FiExternalLink /> Source Document
                  </a>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
