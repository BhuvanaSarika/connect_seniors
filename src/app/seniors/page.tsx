'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, Timestamp, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { SeniorContact } from '@/types';
import { FiUploadCloud, FiUser, FiMail, FiPhone, FiCheckCircle, FiLinkedin, FiGithub, FiEdit, FiTrash, FiX } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { validateRollNumber, DEFAULT_ROLL_NUMBER_RANGES } from '@/lib/rollNumberValidator';

export default function SeniorsPage() {
  const { appUser } = useAuth();
  const [seniors, setSeniors] = useState<SeniorContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form State for Adding
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Delete State
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Edit Modal State
  const [editingSenior, setEditingSenior] = useState<SeniorContact | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

  const isAdmin = appUser?.role === 'admin';

  useEffect(() => {
    fetchSeniors();
  }, []);

  const fetchSeniors = async () => {
    try {
      const q = query(collection(db, 'seniors_list'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedSeniors: SeniorContact[] = [];
      querySnapshot.forEach((document) => {
        fetchedSeniors.push({ id: document.id, ...document.data() } as SeniorContact);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, isEditNode = false) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (isEditNode) {
        setEditImageFile(file);
        setEditImagePreview(URL.createObjectURL(file));
      } else {
         setImageFile(file);
         setImagePreview(URL.createObjectURL(file));
      }
    }
  };

  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'connectseniors/profiles');
    const res = await fetch('/api/upload-image', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Image upload failed');
    const data = await res.json();
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(''); setSuccessMsg('');
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
      if (imageFile) imageUrl = await uploadImageToCloudinary(imageFile);

      const newSenior = {
        name, rollNumber, email, phone, imageUrl, linkedinUrl, githubUrl, createdAt: Timestamp.now(),
      };

      try {
        const docRef = await addDoc(collection(db, 'seniors_list'), newSenior);
        setSeniors(prev => [{ id: docRef.id, ...newSenior }, ...prev]);
      } catch (err) {
        console.warn('Firebase addDoc failed, using local API fallback for testing:', err);
        const fallbackSenior = { id: Date.now().toString(), ...newSenior, createdAt: new Date() as any };
        await fetch('/api/seniors', { method: 'POST', body: JSON.stringify(fallbackSenior) });
        setSeniors(prev => [fallbackSenior, ...prev]);
      }

      setSuccessMsg('Senior added successfully!');
      setName(''); setRollNumber(''); setEmail(''); setPhone(''); setLinkedinUrl(''); setGithubUrl(''); setImageFile(null); setImagePreview(null);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error('Error saving senior:', error);
      setErrorMsg('Failed to add senior. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ────────────────────────────
  // Edit Handlers
  // ────────────────────────────
  const openEditModal = (senior: SeniorContact) => {
    setEditingSenior({ ...senior });
    setEditImagePreview(senior.imageUrl || null);
    setEditImageFile(null);
  };

  const closeEditModal = () => {
    setEditingSenior(null);
    setEditImagePreview(null);
    setEditImageFile(null);
  };

  const handleEditModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSenior) return;
    
    const validation = validateRollNumber(editingSenior.rollNumber, DEFAULT_ROLL_NUMBER_RANGES);
    if (!validation || !validation.valid) { alert('Invalid Roll Number format.'); return; }
    if (validation.role === 'junior') { alert('Cannot assign junior roll number to a senior.'); return; }

    setIsSubmitting(true);
    try {
      let updatedImageUrl = editingSenior.imageUrl;
      if (editImageFile) {
        updatedImageUrl = await uploadImageToCloudinary(editImageFile);
      }

      const updatedPayload = { ...editingSenior, imageUrl: updatedImageUrl } as SeniorContact;

      try {
        await updateDoc(doc(db, 'seniors_list', editingSenior.id), updatedPayload as any);
        setSeniors(prev => prev.map(s => s.id === editingSenior.id ? updatedPayload : s));
      } catch(err) {
        console.warn('Firebase update failed, using local API fallback for testing:', err);
        await fetch('/api/seniors', { method: 'PUT', body: JSON.stringify(updatedPayload) });
        setSeniors(prev => prev.map(s => s.id === editingSenior.id ? updatedPayload : s));
      }

      closeEditModal();
    } catch (error) {
       console.error('Failed to update senior', error);
       alert('Update failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ────────────────────────────
  // Delete Handlers
  // ────────────────────────────
  const handleDelete = async (id: string, contactName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${contactName} from the database?`)) return;
    setIsDeletingId(id);
    try {
      try {
         await deleteDoc(doc(db, 'seniors_list', id));
         setSeniors(prev => prev.filter(s => s.id !== id));
      } catch(err) {
         console.warn('Firebase deleteDoc failed, using local API fallback for testing:', err);
         await fetch(`/api/seniors?id=${id}`, { method: 'DELETE' });
         setSeniors(prev => prev.filter(s => s.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete', err);
      alert('Error occurred while deleting profile.');
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      
      {/* ──────────────────────────── Modal Overlay ──────────────────────────── */}
      {editingSenior && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-2xl relative w-full max-w-lg mb-10 overflow-y-auto max-h-[90vh]">
            <button 
              onClick={closeEditModal} 
              className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
              <FiEdit className="text-indigo-400" /> Edit Profile
            </h2>
            <form onSubmit={handleEditModalSubmit} className="space-y-4">
               {/* Image Upload Area */}
               <div className="flex justify-center mb-6">
                  <label htmlFor="edit-image-upload" className="cursor-pointer group relative">
                    <div className={`w-24 h-24 rounded-full overflow-hidden border-2 flex items-center justify-center transition-all ${editImagePreview ? 'border-indigo-400 bg-slate-800' : 'border-dashed border-slate-600 bg-slate-800/50 group-hover:border-indigo-400'}`}>
                      {editImagePreview ? ( <img src={editImagePreview} alt="Preview" className="w-full h-full object-cover" /> ) : ( <FiUploadCloud className="w-6 h-6 text-slate-400 group-hover:text-indigo-400" /> )}
                    </div>
                    <input id="edit-image-upload" type="file" accept="image/*" onChange={(e) => handleImageChange(e, true)} className="hidden" />
                  </label>
                </div>
                <div className="space-y-3">
                  <input type="text" required value={editingSenior.name} onChange={(e) => setEditingSenior({...editingSenior, name: e.target.value})} className="block w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-800 text-slate-200 focus:ring-2 focus:ring-indigo-500" placeholder="Full Name" />
                  <input type="text" required value={editingSenior.rollNumber} onChange={(e) => setEditingSenior({...editingSenior, rollNumber: e.target.value})} className="block w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-800 text-slate-200 focus:ring-2 focus:ring-indigo-500 font-mono" placeholder="Roll Number" />
                  <input type="email" required value={editingSenior.email} onChange={(e) => setEditingSenior({...editingSenior, email: e.target.value})} className="block w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-800 text-slate-200 focus:ring-2 focus:ring-indigo-500" placeholder="Email" />
                  <input type="tel" required value={editingSenior.phone} onChange={(e) => setEditingSenior({...editingSenior, phone: e.target.value})} className="block w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-800 text-slate-200 focus:ring-2 focus:ring-indigo-500" placeholder="Phone" />
                  <input type="url" value={editingSenior.linkedinUrl || ''} onChange={(e) => setEditingSenior({...editingSenior, linkedinUrl: e.target.value})} className="block w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-800 text-slate-200 focus:ring-2 focus:ring-indigo-500" placeholder="LinkedIn URL" />
                  <input type="url" value={editingSenior.githubUrl || ''} onChange={(e) => setEditingSenior({...editingSenior, githubUrl: e.target.value})} className="block w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-800 text-slate-200 focus:ring-2 focus:ring-indigo-500" placeholder="GitHub URL" />
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-3 mt-4 border border-transparent rounded-xl shadow-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-500 disabled:opacity-70 transition-all">
                  {isSubmitting ? 'Saving...' : 'Save Profile'}
                </button>
            </form>
          </div>
        </div>
      )}

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
                    <input id="image-upload" type="file" accept="image/*" onChange={(e) => handleImageChange(e, false)} className="hidden" />
                    <div className="absolute bottom-0 right-0 bg-indigo-500 rounded-full p-2 border-2 border-slate-900 shadow-md transform translate-x-2 translate-y-2">
                      <FiUploadCloud className="w-4 h-4 text-white" />
                    </div>
                  </label>
                </div>

                {/* Input Fields */}
                <div className="space-y-3">
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="block w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-900/80 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500" placeholder="Full Name" />
                  <input type="text" required value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} className="block w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-900/80 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 font-mono" placeholder="Roll Number (e.g. 22A91A4401)" />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-900/80 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500" placeholder="Email Address" />
                  <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="block w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-900/80 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500" placeholder="Phone Number" />
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLinkedin className="text-slate-500" />
                    </div>
                    <input type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl bg-slate-900/80 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500" placeholder="LinkedIn URL (Optional)" />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiGithub className="text-slate-500" />
                    </div>
                    <input type="url" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl bg-slate-900/80 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500" placeholder="GitHub URL (Optional)" />
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 focus:ring-2 focus:ring-indigo-500 disabled:opacity-70 transition-all">
                  {isSubmitting ? 'Uploading...' : 'Add Senior'}
                </button>

                {successMsg && (
                  <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex gap-2 items-center">
                    <FiCheckCircle /> {successMsg}
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
                  <div key={senior.id} className={`group relative bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-slate-800 hover:border-slate-700 p-6 transition-all hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 ${isDeletingId === senior.id ? 'opacity-50 blur-sm pointer-events-none' : ''}`}>
                    
                    {/* Admin Action Bar */}
                    {isAdmin && (
                      <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(senior)} className="p-2 rounded-lg bg-slate-800 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 transition-colors" title="Edit Profile">
                          <FiEdit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(senior.id, senior.name)} className="p-2 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors" title="Delete Profile">
                          <FiTrash className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div className="flex flex-col items-center gap-4 xl:flex-row xl:items-start text-center xl:text-left mt-2">
                      <div className="relative w-20 h-20 shrink-0">
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
                        
                        <div className="space-y-1.5 mb-4 max-w-full">
                          <a href={`mailto:${senior.email}`} className="flex items-center justify-center xl:justify-start gap-2 text-sm text-slate-400 hover:text-slate-300 truncate w-full group/link">
                            <FiMail className="shrink-0 group-hover/link:text-blue-400" />
                            <span className="truncate">{senior.email}</span>
                          </a>
                          
                          <a href={`tel:${senior.phone}`} className="flex items-center justify-center xl:justify-start gap-2 text-sm text-slate-400 hover:text-slate-300 truncate w-full group/link">
                            <FiPhone className="shrink-0 group-hover/link:text-blue-400" />
                            <span className="truncate">{senior.phone}</span>
                          </a>
                        </div>

                        {/* Social Links */}
                        {(senior.linkedinUrl || senior.githubUrl) && (
                          <div className="flex items-center justify-center xl:justify-start gap-3 pt-4 border-t border-slate-800/80">
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
