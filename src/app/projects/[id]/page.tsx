'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import 'react-quill-new/dist/quill.snow.css';
import { ProjectIdea } from '@/types';
import Link from 'next/link';
import { FiArrowLeft, FiGithub, FiExternalLink, FiYoutube, FiMessageSquare, FiUser, FiCopy, FiCheck, FiCode } from 'react-icons/fi';

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
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 text-lg mb-4">Project not found</p>
        <Link href="/projects" className="text-primary hover:underline font-semibold">Back to Projects</Link>
      </div>
    );
  }

  const categoryColors: Record<string, string> = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-blue-100 text-blue-700',
    advanced: 'bg-purple-100 text-purple-700',
    pro: 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 pb-24">
      <Link href="/projects" className="group inline-flex items-center gap-2 text-gray-500 hover:text-primary transition-all mb-10 font-bold text-sm uppercase tracking-widest">
        <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Library
      </Link>

      <div className="bg-white rounded-[3rem] shadow-premium border border-gray-100 overflow-hidden">
        {/* Header Section */}
        <div className="relative p-8 md:p-16 border-b border-gray-50 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm ${categoryColors[project.category] || 'bg-gray-100 text-gray-700'}`}>
                {project.category}
              </span>
              <span className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                <FiUser size={12} className="text-primary" /> Created by {project.createdByName}
              </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-display font-extrabold text-gray-900 mb-6 leading-tight">
              {project.title}
            </h1>

            <div className="flex gap-4">
               {project.githubUrl && (
                 <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gray-900 text-white font-bold text-sm hover:bg-gray-800 transition-all shadow-lg shadow-black/10">
                   <FiGithub /> Source Code
                 </a>
               )}
               {project.referenceUrl && (
                 <a href={project.referenceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-gray-200 text-gray-900 font-bold text-sm hover:bg-gray-50 transition-all">
                   <FiExternalLink /> Live Preview
                 </a>
               )}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8 md:p-16 space-y-16">
          {/* Technical Brief */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <FiCode size={20} />
              </div>
              <h2 className="text-2xl font-display font-bold text-gray-900">Technical Brief</h2>
            </div>
            <div 
              className="prose prose-lg max-w-none text-gray-600 leading-relaxed ql-editor !p-0"
              dangerouslySetInnerHTML={{ __html: project.description }}
            />
          </section>

          {/* AI Prompt Strategy */}
          {project.aiPrompt && (
            <section className="relative">
              <div className="absolute inset-0 bg-primary/5 rounded-[2.5rem] -m-6 -z-10 border border-primary/10" />
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                    <FiMessageSquare size={20} />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-gray-900">AI Collaboration Strategy</h2>
                </div>
                <button
                  onClick={handleCopy}
                  title="Copy to clipboard"
                >
                   {copied ? <FiCheck size={14} /> : <FiCopy size={14} />} {copied ? 'Copied!' : 'Copy'}
                </button>
                <div 
                  className="mt-8 prose prose-sm md:prose-base prose-primary max-w-none break-words overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: project.aiPrompt }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 ml-1">Copy and paste this prompt into ChatGPT or Claude to get a starting template.</p>
            </section>
          )}

          {/* Links */}
          <section>
             <h2 className="text-xl font-bold text-primary-dark mb-4 border-b border-gray-100 pb-2">Resources & References</h2>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
               {project.referenceUrl && (
                  <a href={project.referenceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-primary hover:shadow-md transition-all group">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                      <FiExternalLink size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">Reference Link</p>
                      <p className="text-xs text-gray-500 truncate w-32">External Website</p>
                    </div>
                  </a>
               )}
               {project.githubUrl && (
                  <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-gray-900 hover:shadow-md transition-all group">
                    <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center group-hover:bg-gray-900 group-hover:text-white transition-colors">
                      <FiGithub size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">GitHub Repo</p>
                      <p className="text-xs text-gray-500 truncate w-32">Source Code</p>
                    </div>
                  </a>
               )}
               {project.youtubeUrl && (
                  <a href={project.youtubeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-red-500 hover:shadow-md transition-all group">
                    <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors">
                      <FiYoutube size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">YouTube Video</p>
                      <p className="text-xs text-gray-500 truncate w-32">Tutorial</p>
                    </div>
                  </a>
               )}
             </div>
             {!project.referenceUrl && !project.githubUrl && !project.youtubeUrl && (
               <p className="text-gray-500 italic">No external resources provided for this project.</p>
             )}
          </section>
        </div>
      </div>
    </div>
  );
}
