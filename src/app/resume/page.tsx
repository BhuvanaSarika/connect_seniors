'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { collection, doc, getDocs, addDoc, updateDoc, Timestamp, query, orderBy, where, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { ResumeSubmission, ResumeReview } from '@/types';
import { FiUploadCloud, FiFileText, FiCheckCircle, FiStar, FiMessageSquare, FiExternalLink } from 'react-icons/fi';

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
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [feedback, setFeedback] = useState('');
  const [reviewStatus, setReviewStatus] = useState<'pending' | 'submitting'>('pending');

  useEffect(() => {
    if (!loading && !appUser) router.push('/login');
  }, [loading, appUser, router]);

  useEffect(() => {
    if (!appUser) return;
    const fetchResumes = async () => {
      try {
        let q;
        if (appUser.role === 'junior') {
          q = query(collection(db, 'resumes'), where('juniorUid', '==', appUser.uid), orderBy('createdAt', 'desc'));
        } else {
          // Seniors see all pending resumes or ones they've interacted with (latest first)
          q = query(collection(db, 'resumes'), orderBy('createdAt', 'desc'));
        }
        
        const snap = await getDocs(q);
        setResumes(snap.docs.map(d => ({ id: d.id, ...d.data() } as ResumeSubmission)));
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
      // Upload to Storage
      const storageRef = ref(storage, `resumes/${appUser.uid}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Create Firestore doc
      const submission: Omit<ResumeSubmission, 'id'> = {
        juniorUid: appUser.uid,
        juniorName: appUser.displayName,
        juniorRollNumber: appUser.rollNumber,
        fileUrl: downloadURL,
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
      
      setReviewingId(null);
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
              <div className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed transition-all ${
                file ? 'border-primary bg-primary/5' : 'border-gray-300 bg-gray-50 hover:border-primary-light'
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
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${
                      resume.status === 'reviewed' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                    }`}>
                      {resume.status}
                    </span>
                    <a
                      href={resume.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-dark/5 text-primary-dark hover:bg-primary-dark/10 font-medium text-sm transition-colors"
                    >
                      <FiExternalLink /> View PDF
                    </a>
                  </div>
                </div>

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

                {/* Review Form (Seniors only) */}
                {!isJunior && (
                   <div className="p-5 border-t border-gray-100 bg-gray-50/50">
                     {reviewingId === resume.id ? (
                       <div className="space-y-4">
                         <div className="flex items-center gap-4">
                           <label className="text-sm font-medium text-gray-700">Rating (1-5)</label>
                           <input type="range" min="1" max="5" value={rating} onChange={e => setRating(Number(e.target.value))} className="w-32 accent-primary" />
                           <span className="font-bold text-primary">{rating} / 5</span>
                         </div>
                         <textarea
                           value={feedback}
                           onChange={e => setFeedback(e.target.value)}
                           className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                           placeholder="Provide detailed, constructive feedback on formatting, content, bullet points..."
                           rows={4}
                           required
                         />
                         <div className="flex gap-2">
                           <button onClick={() => handleSubmitReview(resume.id)} disabled={reviewStatus === 'submitting'} className="px-5 py-2 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-50">
                             {reviewStatus === 'submitting' ? 'Submitting...' : 'Submit Review'}
                           </button>
                           <button onClick={() => setReviewingId(null)} className="px-5 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-white transition-colors">
                             Cancel
                           </button>
                         </div>
                       </div>
                     ) : (
                       <button onClick={() => setReviewingId(resume.id)} className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark">
                         <FiMessageSquare /> {resume.reviews?.some(r => r.seniorUid === appUser.uid) ? 'Add another review' : 'Write a review'}
                       </button>
                     )}
                   </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
