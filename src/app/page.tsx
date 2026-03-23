'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { FiMap, FiCode, FiUsers, FiFileText, FiBookOpen, FiAward } from 'react-icons/fi';

const features = [
  { icon: FiMap, title: 'Custom Roadmaps', desc: 'Seniors create interactive learning paths with branching nodes — tailored guidance, not generic advice.', color: 'from-primary to-primary-light' },
  { icon: FiCode, title: 'Project Ideas', desc: 'Curated projects by difficulty with AI prompts, GitHub repos, and YouTube tutorials.', color: 'from-accent to-yellow-400' },
  { icon: FiUsers, title: '1:1 Mentorship', desc: 'Book time slots with approved seniors for personalized guidance sessions.', color: 'from-primary-dark to-primary' },
  { icon: FiFileText, title: 'Resume Reviews', desc: 'Upload your resume and get validated by experienced seniors with detailed feedback.', color: 'from-green-500 to-emerald-400' },
  { icon: FiBookOpen, title: 'Courses', desc: "Hand-picked YouTube courses recommended by seniors who've been through the journey.", color: 'from-purple-500 to-violet-400' },
  { icon: FiAward, title: 'Certifications', desc: 'Curated certification links to boost your resume and validate your skills.', color: 'from-rose-500 to-pink-400' },
];

export default function HomePage() {
  const { appUser } = useAuth();

  return (
    <div className="min-h-screen pt-20">
      {/* Hero */}
      <section className="relative px-4 pt-16 pb-24 sm:pt-24 sm:pb-32 overflow-hidden">
        {/* Subtle Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-accent/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 mb-8 animate-fade-in">
             <span className="relative flex h-2 w-2">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
             </span>
             <span className="text-xs font-bold tracking-wider text-primary uppercase">The Hub for Growth</span>
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-display font-extrabold tracking-tight text-gray-900 mb-8 leading-[1.1]">
            Empowering the <br />
            <span className="text-gradient">Next Generation</span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed font-sans">
            ConnectSeniors is the elite bridge for students. Access custom roadmaps, 
            personalized mentorship, and industry-standard resume validations.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {appUser ? (
              <Link
                href="/dashboard"
                className="group relative inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-primary text-white font-bold text-lg shadow-float hover:bg-primary-dark transition-all duration-300"
              >
                Go to Dashboard
                <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-10 py-4 rounded-2xl bg-primary text-white font-bold text-lg shadow-float hover:bg-primary-dark hover:scale-[1.02] transition-all"
                >
                  Start Your Journey
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-10 py-4 rounded-2xl border border-gray-200 bg-white text-gray-900 font-bold text-lg hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section className="max-w-7xl mx-auto px-4 py-24 border-t border-gray-100">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-display font-bold text-gray-900 mb-4 tracking-tight">Focus on what matters</h2>
          <p className="text-gray-500 max-w-lg mx-auto">High-performance tools meticulously designed for student success and senior contribution.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 grid-rows-2 gap-4 h-full md:h-[600px]">
          {/* Main Feature - Roadmaps */}
          <div className="md:col-span-3 md:row-span-2 group relative overflow-hidden bg-white rounded-3xl p-8 border border-gray-100 shadow-premium hover:shadow-float transition-all duration-500">
            <div className="relative z-10 h-full flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FiMap size={24} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 font-display">Custom Roadmaps</h3>
              <p className="text-gray-600 leading-relaxed mb-auto">
                Move beyond generic guides. Our seniors build branching, node-based learning paths tailored specifically for your academic and career goals.
              </p>
              <div className="mt-8 pt-8 border-t border-gray-50">
                <div className="flex -space-x-2">
                   {[1,2,3,4].map(i => (
                     <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200" />
                   ))}
                   <div className="pl-4 text-xs font-bold text-gray-400 self-center">+ 500+ Juniors growing</div>
                </div>
              </div>
            </div>
          </div>

          {/* Mentorship */}
          <div className="md:col-span-3 group relative overflow-hidden bg-[#1e293b] rounded-3xl p-8 shadow-premium hover:shadow-float transition-all duration-500 text-white">
            <div className="relative z-10 flex flex-col h-full">
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center mb-6">
                <FiUsers size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 font-display">1:1 Elite Mentorship</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Book deep-dive sessions with approved seniors. Real-time guidance on your specific blockers.</p>
              </div>
            </div>
            {/* Abstract Graphic */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary opacity-20 blur-3xl rounded-full" />
          </div>

          {/* Projects */}
          <div className="md:col-span-3 flex gap-4">
            <div className="flex-1 group bg-white rounded-3xl p-6 border border-gray-100 shadow-premium hover:shadow-float transition-all duration-500">
                <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4">
                  <FiCode size={20} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Projects</h3>
                <p className="text-gray-500 text-xs">AI-powered prompts & resources.</p>
            </div>
            <div className="flex-1 group bg-white rounded-3xl p-6 border border-gray-100 shadow-premium hover:shadow-float transition-all duration-500">
                <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-4">
                  <FiFileText size={20} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Resumes</h3>
                <p className="text-gray-500 text-xs">Industry-standard validations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="font-display font-bold text-2xl tracking-tight text-gray-900">
            <span className="text-primary">Connect</span>Seniors
          </div>
          <p className="text-gray-400 text-sm">© 2026 ConnectSeniors Platform. Meticulously crafted for developers.</p>
          <div className="flex gap-6 text-gray-400 text-sm font-semibold">
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-primary transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
