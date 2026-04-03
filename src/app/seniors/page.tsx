'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, Timestamp, query, orderBy } from 'firebase/firestore';
import { SeniorContact } from '@/types';
import { FiUploadCloud, FiUser, FiMail, FiPhone, FiCheckCircle, FiLinkedin, FiGithub } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { validateRollNumber, DEFAULT_ROLL_NUMBER_RANGES } from '@/lib/rollNumberValidator';

export default function SeniorsPage() {
  const { appUser } = useAuth();
  const [seniors, setSeniors] = useState<SeniorContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchSeniors();
  }, []);

  const fetchSeniors = async () => {
    try {
      const q = query(collection(db, 'seniors_list'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedSeniors: SeniorContact[] = [];
      querySnapshot.forEach((doc) => {
        fetchedSeniors.push({ id: doc.id, ...doc.data() } as SeniorContact);
      });
      setSeniors(fetchedSeniors);
    } catch (error) {
      console.warn('Firebase permission error, showing empty or local state for testing:', error);
      try {
        const res = await fetch('/api/seniors');
        if (res.ok) {
          const apiData = await res.json();
          if (apiData && apiData.length > 0) {
            setSeniors(apiData);
          }
        }
      } catch (e) {
        console.error("Failed to load local API backup", e);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'connectseniors/profiles');

    const res = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) throw new Error('Image upload failed');
    const data = await res.json();
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!name || !rollNumber || !email || !phone) return;

    // Validate Roll Number
    const validation = validateRollNumber(rollNumber, DEFAULT_ROLL_NUMBER_RANGES);
    if (!validation || !validation.valid) {
      setErrorMsg('Invalid Roll Number format.');
      return;
    }
    if (validation.role === 'junior') {
      setErrorMsg('Cannot add junior as senior.');
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = '';
      if (imageFile) {
        imageUrl = await uploadImageToCloudinary(imageFile);
      }

      const newSenior: Omit<SeniorContact, 'id'> = {
        name,
        rollNumber,
        email,
        phone,
        imageUrl,
        linkedinUrl,
        githubUrl,
        createdAt: Timestamp.now(),
      };

      try {
        const docRef = await addDoc(collection(db, 'seniors_list'), newSenior);
        setSeniors(prev => [{ id: docRef.id, ...newSenior }, ...prev]);
      } catch (err) {
        console.warn('Firebase addDoc failed, using local API fallback for testing:', err);
        const fallbackSenior = { id: Date.now().toString(), ...newSenior, createdAt: new Date() };
        await fetch('/api/seniors', { method: 'POST', body: JSON.stringify(fallbackSenior) });
        setSeniors(prev => [fallbackSenior as any, ...prev]);
      }

      setSuccessMsg('Senior added successfully!');
      
      // Reset logic
      setName('');
      setRollNumber('');
      setEmail('');
      setPhone('');
      setLinkedinUrl('');
      setGithubUrl('');
      setImageFile(null);
      setImagePreview(null);

      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error('Error saving senior:', error);
      setErrorMsg('Failed to add senior. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Safe checks if user object isn't completely resolved
  const isAdmin = appUser?.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
            Senior Directory
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Connect with our experienced seniors. View their profiles, access their networks, and connect instantly.
          </p>
        </div>

        {/* Top Layout */}
        <div className={`grid grid-cols-1 gap-8 items-start ${isAdmin ? 'lg:grid-cols-12' : ''}`}>
          
          {/* Add Senior Form - Admin ONLY */}
          {isAdmin && (
            <div className="lg:col-span-5 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
              
              <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
                <FiUser className="text-blue-400" /> Add Profile
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Image Upload Area */}
                <div className="flex justify-center mb-6">
                  <label htmlFor="image-upload" className="cursor-pointer group relative">
                    <div className={`w-28 h-28 rounded-full overflow-hidden border-2 flex items-center justify-center transition-all ${imagePreview ? 'border-indigo-400 bg-slate-800' : 'border-dashed border-slate-600 bg-slate-800/50 group-hover:border-indigo-400 group-hover:bg-slate-800'}`}>
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <FiUploadCloud className="w-8 h-8 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                      )}
                    </div>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <div className="absolute bottom-0 right-0 bg-indigo-500 rounded-full p-2 border-2 border-slate-900 shadow-md transform translate-x-2 translate-y-2">
                      <FiUploadCloud className="w-4 h-4 text-white" />
                    </div>
                  </label>
                </div>

                {/* Input Fields */}
                <div className="space-y-3">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-900/80 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Full Name"
                  />
                  <input
                    type="text"
                    required
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-900/80 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    placeholder="Roll Number (e.g. 22A91A4401)"
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-900/80 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Email Address"
                  />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-900/80 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Phone Number"
                  />
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLinkedin className="text-slate-500" />
                    </div>
                    <input
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl bg-slate-900/80 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="LinkedIn URL (Optional)"
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiGithub className="text-slate-500" />
                    </div>
                    <input
                      type="url"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl bg-slate-900/80 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="GitHub URL (Optional)"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? 'Uploading...' : 'Add Senior'}
                </button>

                {successMsg && (
                  <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex gap-2 items-center">
                    <FiCheckCircle />
                    {successMsg}
                  </div>
                )}
                {errorMsg && (
                  <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                    {errorMsg}
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Directory List Area */}
          <div className={isAdmin ? 'lg:col-span-7' : 'w-full'}>
            <div className={`grid grid-cols-1 gap-6 ${isAdmin ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
              {loading ? (
                // Skeleton Loaders
                Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-slate-800"></div>
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                        <div className="h-3 bg-slate-800 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : seniors.length === 0 ? (
                <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
                  <FiUser className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No seniors have been added yet.</p>
                </div>
              ) : (
                seniors.map((senior) => (
                  <div key={senior.id} className="group relative bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-slate-800 hover:border-slate-700 p-6 transition-all hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1">
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start text-center sm:text-left">
                      <div className="relative w-20 h-20 sm:w-16 sm:h-16 shrink-0">
                        {senior.imageUrl ? (
                          <img
                            src={senior.imageUrl}
                            alt={senior.name}
                            className="w-full h-full rounded-full object-cover ring-2 ring-slate-800 group-hover:ring-blue-500/50 transition-all"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center ring-2 ring-slate-700">
                            <FiUser className="w-8 h-8 text-slate-500" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0 w-full">
                        <h3 className="text-lg font-bold text-white truncate mb-0.5 group-hover:text-blue-400 transition-colors">
                          {senior.name}
                        </h3>
                        {senior.rollNumber && (
                          <p className="text-xs font-bold text-indigo-400 mb-3 tracking-widest uppercase">
                            {senior.rollNumber}
                          </p>
                        )}
                        
                        <div className="space-y-1.5 mb-4">
                          <a href={`mailto:${senior.email}`} className="flex items-center justify-center sm:justify-start gap-2 text-sm text-slate-400 hover:text-slate-300 truncate w-full group/link">
                            <FiMail className="shrink-0 group-hover/link:text-blue-400" />
                            <span className="truncate">{senior.email}</span>
                          </a>
                          
                          <a href={`tel:${senior.phone}`} className="flex items-center justify-center sm:justify-start gap-2 text-sm text-slate-400 hover:text-slate-300 truncate w-full group/link">
                            <FiPhone className="shrink-0 group-hover/link:text-blue-400" />
                            <span className="truncate">{senior.phone}</span>
                          </a>
                        </div>

                        {/* Social Links */}
                        {(senior.linkedinUrl || senior.githubUrl) && (
                          <div className="flex items-center justify-center sm:justify-start gap-3 pt-4 border-t border-slate-800/80">
                            {senior.linkedinUrl && (
                              <a href={senior.linkedinUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-slate-800 text-slate-300 hover:bg-[#0A66C2] hover:text-white transition-all transform hover:scale-110" title="LinkedIn">
                                <FiLinkedin className="w-4 h-4" />
                              </a>
                            )}
                            {senior.githubUrl && (
                              <a href={senior.githubUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-slate-800 text-slate-300 hover:bg-white hover:text-black transition-all transform hover:scale-110" title="GitHub">
                                <FiGithub className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
