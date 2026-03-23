"use client"
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { collection, doc, getDocs, addDoc, updateDoc, Timestamp, query, where, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ResumeSubmission, ResumeReview } from '@/types';
import { FiUploadCloud, FiFileText, FiCheckCircle, FiStar, FiMessageSquare, FiExternalLink, FiX, FiChevronLeft, FiChevronRight, FiShield, FiArrowRight } from 'react-icons/fi';

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
        docs.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
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
        alert('Operational failure: Only PDF format is authorized.');
        return;
      }
      if (selectedInfo.size > 5 * 1024 * 1024) {
        alert('File volume exceeds 5MB limit.');
        return;
      }
      setFile(selectedInfo);
    }
  };

  const handleUpload = async () => {
    if (!appUser || !file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Cloudinary handshaked failed');
      const downloadUrls = data.urls;

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
      alert('Asset uploaded successfully. Assessment pending senior review.');
    } catch (err) {
      console.error(err);
      alert('Upload operational failure.');
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
      setViewingResume(null);
    } catch (err) {
      console.error(err);
      alert('Review submission failed.');
    }
    setReviewStatus('pending');
  };

  if (loading || !appUser) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full" />
    </div>
  );

  const isSenior = appUser.role === 'senior' || appUser.role === 'admin';
  const isJunior = appUser.role === 'junior';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 text-slate-900">
      {/* Module Header */}
      <div className="mb-16 border-b border-slate-100 pb-12">
        <div className="inline-flex items-center gap-2 mb-6">
          <span className="w-10 h-1 bg-primary rounded-full" />
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Career Validation</p>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-display font-black text-slate-900 leading-tight mb-4 tracking-tight">
              Resume <span className="text-slate-900/40 italic">Assessment.</span>
            </h1>
            <p className="text-slate-500 font-medium leading-relaxed">
              Professional evaluation of technical presentation. Connect with seniors for industry-tier feedback on your professional portfolio.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Management Panel */}
        <div className="lg:col-span-4 space-y-8">
          {isJunior && (
            <div className="clean-card p-8 bg-white border-slate-200">
              <p className="section-label">Submission Portal</p>
              <h2 className="text-xl font-bold text-slate-900 mb-6 font-display">Author New Assessment</h2>

              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 ${file ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-900 hover:bg-slate-50'
                  }`}
              >
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".pdf" className="hidden" />
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 mx-auto mb-4 flex items-center justify-center border border-slate-200 group-hover:bg-slate-900 group-hover:text-white transition-all">
                  <FiUploadCloud size={24} />
                </div>
                {file ? (
                  <div className="animate-in fade-in slide-in-from-bottom-2">
                    <p className="text-xs font-bold text-slate-900 truncate max-w-[180px] mx-auto mb-1">{file.name}</p>
                    <p className="text-[9px] text-primary font-black uppercase tracking-widest">Asset Locked</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-bold text-slate-900">Select PDF Document</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">Standard A4 format (Max 5MB)</p>
                  </div>
                )}
              </div>

              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="btn-primary w-full mt-6 py-4 disabled:opacity-20"
              >
                {uploading ? 'Processing Architecture...' : 'Submit to Senior Audit'}
              </button>
            </div>
          )}

          <div className="clean-card p-8 bg-slate-900 text-white border-none shadow-xl shadow-slate-900/20">
            <FiShield className="text-primary mb-6" size={32} />
            <h3 className="text-xl font-bold font-display mb-4">Assessment Standards</h3>
            <ul className="space-y-4 text-slate-400 text-xs font-medium leading-relaxed">
              <li className="flex gap-3">
                <FiCheckCircle className="text-primary flex-shrink-0 mt-0.5" />
                <span>Technical impact metrics and measurable KPIs.</span>
              </li>
              <li className="flex gap-3">
                <FiCheckCircle className="text-primary flex-shrink-0 mt-0.5" />
                <span>Architecture-centric project descriptions.</span>
              </li>
              <li className="flex gap-3">
                <FiCheckCircle className="text-primary flex-shrink-0 mt-0.5" />
                <span>Concise, semantic, and professional formatting.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Assessment Log */}
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-8">
            <p className="section-label mb-0">{isSenior ? 'Pending Operations' : 'Assessment History'}</p>
            <div className="h-px flex-1 bg-slate-100 mx-6" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {resumes.length} Entries
            </span>
          </div>

          {fetching ? (
            <div className="flex justify-center py-24"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
          ) : resumes.length === 0 ? (
            <div className="clean-card py-24 text-center border-slate-200 bg-slate-50/10">
              <FiFileText className="mx-auto text-slate-100 mb-6" size={48} />
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No active assessment cycles.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {resumes.map(resume => (
                <div
                  key={resume.id}
                  className="clean-card p-6 border-slate-200 hover:border-slate-900 transition-all cursor-pointer group flex flex-col"
                  onClick={() => setViewingResume(resume)}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-200 group-hover:bg-slate-900 group-hover:text-white transition-all">
                      <FiFileText size={20} />
                    </div>
                    {resume.reviews && resume.reviews.length > 0 ? (
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded border border-slate-200">
                        Audit Complete
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded border border-slate-200">
                        Pending review
                      </span>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-base font-bold text-slate-900 mb-1 group-hover:text-primary transition-colors truncate">{resume.fileName}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Authored by {resume.juniorName}</p>

                    {resume.reviews && resume.reviews.length > 0 && (
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FiStar
                            key={star}
                            size={10}
                            className={star <= (resume.reviews?.[0]?.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-200 flex items-center justify-between text-[10px] font-bold">
                    <span className="text-slate-300 tracking-tighter uppercase font-medium">
                      {new Date(resume.createdAt?.toMillis() || 0).toLocaleDateString()}
                    </span>
                    <span className="text-primary group-hover:gap-3 transition-all flex items-center gap-2">
                      Inspect <FiArrowRight />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assessment Modal - The 'Billion Dollar' Viewer */}
      {viewingResume && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl w-full max-w-6xl h-[92vh] flex flex-col md:flex-row shadow-2xl overflow-hidden relative border border-white/10">
            <button
              onClick={() => { setViewingResume(null); setCurrentImageIndex(0); }}
              className="absolute top-6 right-6 z-[160] p-3 rounded-xl bg-slate-100 text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
            >
              <FiX size={20} />
            </button>

            {/* Left: Document View Area */}
            <div className="flex-1 bg-slate-50 flex flex-col p-8 min-h-0 relative border-r border-slate-200">
              <div className="flex-1 relative rounded-xl overflow-hidden bg-white border border-slate-200 flex items-center justify-center shadow-inner">
                <img
                  src={viewingResume.fileUrls[currentImageIndex]}
                  alt="Resume page"
                  className="max-h-full max-w-full shadow-2xl animate-in zoom-in-95 duration-500"
                />
                {viewingResume.fileUrls.length > 1 && (
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-6 pointer-events-none">
                    <button onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => Math.max(0, prev - 1)); }} className={`pointer-events-auto p-4 rounded-full bg-white/90 text-slate-900 shadow-xl border border-slate-200 hover:bg-white transition-all ${currentImageIndex === 0 ? 'opacity-0' : 'opacity-100'}`}>
                      <FiChevronLeft size={24} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => Math.min(viewingResume.fileUrls.length - 1, prev + 1)); }} className={`pointer-events-auto p-4 rounded-full bg-white/90 text-slate-900 shadow-xl border border-slate-200 hover:bg-white transition-all ${currentImageIndex === viewingResume.fileUrls.length - 1 ? 'opacity-0' : 'opacity-100'}`}>
                      <FiChevronRight size={24} />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex justify-center mt-6 gap-2">
                {viewingResume.fileUrls.map((_, i) => (
                  <button key={i} onClick={() => setCurrentImageIndex(i)} className={`h-1.5 rounded-full transition-all duration-500 ${currentImageIndex === i ? 'w-10 bg-slate-900' : 'w-2 bg-slate-200'}`} />
                ))}
              </div>
            </div>

            {/* Right: Assessment Sidepanel */}
            <div className="w-full md:w-[400px] bg-white flex flex-col p-10 md:p-12 overflow-y-auto border-l border-slate-200">
              <div className="mb-10 pb-8 border-b border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Internal Audit</p>
                <h3 className="text-2xl font-display font-black text-slate-900 mb-1 leading-tight">Professional Insights</h3>
                <p className="text-xs font-bold text-primary italic lowercase">@{viewingResume.juniorName.replace(/\s+/g, '').toLowerCase()}</p>
              </div>

              {viewingResume.reviews && viewingResume.reviews.length > 0 ? (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                  {viewingResume.reviews.map((rev, i) => (
                    <div key={i} className="clean-card p-8 bg-slate-50/50 border-slate-100">
                      <div className="flex items-center gap-1 mb-6">
                        {[1, 2, 3, 4, 5].map(s => <FiStar key={s} size={14} className={s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />)}
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed mb-8 font-medium italic border-l-2 border-slate-400 pl-4">
                        "{rev.feedback}"
                      </p>
                      <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Audited by {rev.seniorName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : isSenior ? (
                <div className="flex flex-col flex-1 animate-in slide-in-from-right-4 duration-500">
                  <div className="mb-10">
                    <label className="section-label mb-6 block">Performance Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(s => (
                        <button
                          key={s} onClick={() => setRating(s)}
                          className={`w-10 h-10 rounded-lg transition-all flex items-center justify-center ${s <= rating ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'bg-slate-100 text-slate-300 hover:bg-slate-200'}`}
                        >
                          <FiStar size={18} className={s <= rating ? 'fill-white' : ''} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col mb-10">
                    <label className="section-label mb-4 block">Architectural Feedback</label>
                    <textarea
                      value={feedback} onChange={e => setFeedback(e.target.value)}
                      className="flex-1 w-full px-6 py-5 rounded-xl bg-white border border-slate-200 focus:border-slate-900 focus:ring-0 transition-all outline-none text-sm font-medium resize-none placeholder-slate-300 shadow-sm"
                      placeholder="Detail specific technical enhancements and structural refinements..."
                    />
                  </div>

                  <button
                    onClick={() => handleSubmitReview(viewingResume.id)}
                    disabled={!feedback.trim() || reviewStatus === 'submitting'}
                    className="btn-primary w-full py-4 text-sm"
                  >
                    {reviewStatus === 'submitting' ? 'Syncing Insights...' : 'Publish Assessment'}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-200 flex items-center justify-center mb-6">
                    <FiMessageSquare size={28} />
                  </div>
                  <p className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-1">Audit in Queue</p>
                  <p className="text-[10px] text-slate-400 max-w-[180px] leading-relaxed font-medium">Your architectural profile is awaiting senior authentication.</p>
                </div>
              )}

              <div className="mt-auto pt-8 border-t border-slate-50">
                <a href={viewingResume.fileUrls[0]} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-slate-400 font-bold text-[9px] uppercase tracking-widest hover:text-slate-900 transition-colors">
                  <FiExternalLink /> View Technical Raw Source
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
