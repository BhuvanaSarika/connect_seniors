'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import 'react-quill-new/dist/quill.snow.css';
import { ProjectIdea } from '@/types';
import Link from 'next/link';
import { FiArrowLeft, FiGithub, FiExternalLink, FiYoutube, FiMessageSquare, FiCopy, FiCheck, FiCode, FiUser, FiInfo } from 'react-icons/fi';

export default function ProjectDetail() {
  const { appUser, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectIdea | null>(null);
  const [fetching, setFetching] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (project?.aiPrompt) {
      try {
        const tmp = document.createElement('div');
        tmp.innerHTML = project.aiPrompt;
        const plainText = tmp.textContent || tmp.innerText || "";
        await navigator.clipboard.writeText(plainText.trim());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy', err);
      }
    }
  };

  useEffect(() => {
    if (!loading && !appUser) router.push('/login');
  }, [loading, appUser, router]);

  useEffect(() => {
    if (!appUser || !projectId) return;
    const fetchProject = async () => {
      try {
        const snap = await getDoc(doc(db, 'projectIdeas', projectId));
        if (snap.exists()) {
          setProject({ id: snap.id, ...snap.data() } as ProjectIdea);
        }
      } catch (err) {
        console.error(err);
      }
      setFetching(false);
    };
    fetchProject();
  }, [appUser, projectId]);

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <FiInfo className="mx-auto text-slate-100 mb-6" size={48} />
        <p className="text-slate-400 font-bold uppercase tracking-widest mb-6">Asset not found in repository</p>
        <Link href="/projects" className="btn-primary px-8">Return to Index</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 text-slate-900">
      <Link href="/projects" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-all mb-12">
        <FiArrowLeft size={14} /> Back to Blueprint Index
      </Link>

      <div className="clean-card overflow-hidden shadow-2xl shadow-slate-200/50">
        {/* Architectural Header */}
        <div className="p-10 md:p-16 border-b border-slate-100 bg-slate-50/30">
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <span className="px-3 py-1 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg">
              {project.category} tier
            </span>
            <span className="px-3 py-1 bg-white text-slate-400 text-[9px] font-bold uppercase tracking-widest rounded-lg border border-slate-200">
              Authored by {project.createdByName}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-display font-black text-slate-900 mb-10 leading-tight tracking-tight max-w-4xl">
            {project.title}
          </h1>

          <div className="flex flex-wrap gap-4">
             {project.githubUrl && (
               <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="btn-primary flex items-center gap-3 px-8 shadow-lg shadow-primary/20">
                 <FiGithub size={18} /> <span>Source Terminal</span>
               </a>
             )}
             {project.referenceUrl && (
               <a href={project.referenceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-8 bg-white border border-slate-200 text-slate-900 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">
                 <FiExternalLink size={18} /> <span>Live Instance</span>
               </a>
             )}
          </div>
        </div>

        {/* System Details */}
        <div className="p-10 md:p-16 space-y-20">
          {/* Technical Protocol */}
          <section>
            <div className="flex items-center gap-4 mb-10">
               <div className="w-10 h-1 bg-slate-900 rounded-full" />
               <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Technical Protocol</p>
            </div>
            <div 
              className="prose prose-slate max-w-none text-slate-600 leading-relaxed font-medium ql-editor !p-0"
              dangerouslySetInnerHTML={{ __html: project.description }}
            />
          </section>

          {/* AI Synthesis Prompt */}
          {project.aiPrompt && (
            <section className="bg-slate-900 rounded-2xl p-10 md:p-14 relative overflow-hidden border border-slate-800">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-6">
                  <div className="flex items-center gap-4">
                    <FiMessageSquare className="text-primary" size={24} />
                    <h2 className="text-xl font-display font-bold text-white tracking-tight">AI Synthesis Prompt</h2>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10"
                  >
                     {copied ? <FiCheck className="text-emerald-400" size={14} /> : <FiCopy size={14} />} 
                     <span>{copied ? 'Copied' : 'Copy Protocol'}</span>
                  </button>
                </div>
                <div 
                  className="prose prose-invert prose-sm max-w-none text-slate-400 leading-relaxed font-mono"
                  dangerouslySetInnerHTML={{ __html: project.aiPrompt }}
                />
                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-10 text-center">
                   Copy this architectural handshake into your local AI environment (GPT-4 / Claude-3) to initialize the boilerplate.
                </p>
              </div>
            </section>
          )}

          {/* Global Resources */}
          <section>
             <p className="section-label mb-8">External Resource Registry</p>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
               {(project.referenceUrl || project.githubUrl || project.youtubeUrl) ? (
                 <>
                   {project.referenceUrl && (
                      <a href={project.referenceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-5 p-6 rounded-xl border border-slate-100 hover:border-primary hover:bg-primary/[0.02] transition-all group">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all">
                          <FiExternalLink size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm mb-1 leading-none">System Docs</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">External Module</p>
                        </div>
                      </a>
                   )}
                   {project.githubUrl && (
                      <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-5 p-6 rounded-xl border border-slate-100 hover:border-slate-900 transition-all group">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all">
                          <FiGithub size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm mb-1 leading-none">Source Index</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">GitHub Repository</p>
                        </div>
                      </a>
                   )}
                   {project.youtubeUrl && (
                      <a href={project.youtubeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-5 p-6 rounded-xl border border-slate-100 hover:border-red-600 transition-all group">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all">
                          <FiYoutube size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm mb-1 leading-none">Video Seminar</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">YouTube Protocol</p>
                        </div>
                      </a>
                   )}
                 </>
               ) : (
                 <p className="text-slate-400 text-xs font-medium italic">No auxiliary resources indexed for this blueprint.</p>
               )}
             </div>
          </section>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="mt-12 pt-12 border-t border-slate-100 flex justify-between items-center opacity-50">
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Blueprint ID: {project.id}</p>
         <Link href="/projects" className="text-[10px] font-black uppercase text-slate-900 hover:underline">Return to index</Link>
      </div>
    </div>
  );
}
