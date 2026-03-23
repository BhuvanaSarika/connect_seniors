'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import 'react-quill-new/dist/quill.snow.css';
import { ProjectIdea } from '@/types';
import Link from 'next/link';
import { FiArrowLeft, FiGithub, FiExternalLink, FiYoutube, FiMessageSquare, FiUser, FiCopy, FiCheck } from 'react-icons/fi';

export default function ProjectDetail() {
  const { appUser, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectIdea | null>(null);
  const [fetching, setFetching] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (project?.aiPrompt) {
      navigator.clipboard.writeText(project.aiPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/projects" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary transition-colors mb-6 font-medium">
        <FiArrowLeft /> Back to Ideas
      </Link>

      <div className="bg-white rounded-3xl shadow-xl shadow-primary/5 border border-muted/20 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-light p-8 md:p-10 text-white">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${categoryColors[project.category] || 'bg-gray-100 text-gray-700'}`}>
              {project.category}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-white/80 bg-black/20 px-3 py-1 rounded-full font-medium">
              <FiUser /> Added by {project.createdByName}
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">{project.title}</h1>
        </div>

        {/* Content */}
        <div className="p-8 md:p-10 space-y-10">
          <section>
            <h2 className="text-xl font-bold text-primary-dark mb-4 border-b border-gray-100 pb-2">Description</h2>
            <div className="text-gray-700 text-lg sm:text-base ql-snow">
              <div className="ql-editor" style={{ padding: 0 }} dangerouslySetInnerHTML={{ __html: project.description }} />
            </div>
          </section>

          {project.aiPrompt && (
            <section>
              <h2 className="text-xl font-bold text-primary-dark mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
                <FiMessageSquare className="text-primary" /> AI Prompt
              </h2>
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 font-mono text-sm text-gray-800 relative group">
                <button 
                  onClick={handleCopy}
                  className="absolute top-0 right-0 flex items-center gap-1.5 py-1.5 px-3 bg-primary/10 hover:bg-primary/20 text-primary transition-colors text-xs font-sans font-bold rounded-bl-lg rounded-tr-xl cursor-pointer"
                  title="Copy to clipboard"
                >
                  {copied ? <FiCheck size={14} /> : <FiCopy size={14} />} {copied ? 'Copied!' : 'Copy'}
                </button>
                {project.aiPrompt}
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
