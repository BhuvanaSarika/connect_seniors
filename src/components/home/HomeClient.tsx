'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { FiMap, FiCode, FiUsers, FiFileText, FiCheckCircle, FiArrowRight, FiGithub, FiYoutube } from 'react-icons/fi';

const features = [
  {
    icon: FiMap,
    title: 'Precision Roadmaps',
    desc: 'Bespoke learning paths designed by industry-active seniors. No generic curriculum—only direct technical vectors.',
    link: '/roadmaps'
  },
  {
    icon: FiUsers,
    title: 'Senior Mentorship',
    desc: 'Direct 1:1 access to vetted senior developers for technical deep-dives and career architecture.',
    link: '/mentorship'
  },
  {
    icon: FiFileText,
    title: 'Resume Engineering',
    desc: 'Get your resume validated by the people who hire. Actionable feedback to clear high-tier technical screenings.',
    link: '/resume'
  },
  {
    icon: FiCode,
    title: 'Project Blueprints',
    desc: 'Curated technical challenges with AI prompts and reference implementations to build a standout portfolio.',
    link: '/projects'
  },
];

const stats = [
  { label: 'Verified Seniors', value: '150+' },
  { label: 'Juniors Placed', value: '1,200+' },
  { label: 'Technical Roadmaps', value: '450+' },
  { label: 'Resume Reviews', value: '3,500+' },
];

export default function HomeClient() {
  const { appUser } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Refined Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-40 border-b border-slate-100 overflow-hidden">
        {/* Subtle Architectural Grid */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-200 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <FiCheckCircle className="text-primary" size={14} />
            <span className="text-[10px] font-bold tracking-[0.2em] text-slate-600 uppercase">Authorized Educational Portal</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-black text-slate-900 mb-8 leading-[1.05] tracking-tight max-w-4xl mx-auto">
            The Bridge Between <br />
            <span className="text-primary italic">Ambition</span> and <span className="text-slate-900/40">Expertise.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
            ConnectSeniors is a professional ecosystem designed to accelerate the transition from junior developer to industry engineer through direct senior-led guidance.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {appUser ? (
              <Link
                href="/dashboard"
                className="btn-primary flex items-center gap-2 group text-lg px-8 py-4"
              >
                Enter Control Center
                <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="btn-primary text-lg px-10 py-4 shadow-lg shadow-primary/20"
                >
                  Apply to Platform
                </Link>
                <Link
                  href="/login"
                  className="btn-secondary text-lg px-10 py-4"
                >
                  Member Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats Bar - For Credibility */}
      <section className="bg-slate-50 border-b border-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="text-center md:border-r last:border-0 border-slate-200 px-4">
                <p className="text-3xl font-display font-black text-slate-900 mb-1">{stat.value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Structured Feature Grid */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-20">
            <p className="section-label">Core Capabilities</p>
            <h2 className="text-3xl md:text-4xl font-display font-black text-slate-900 mb-6 leading-tight">
              Tools Meticulously Architected for Professional Growth.
            </h2>
            <p className="text-slate-500 font-medium leading-relaxed">
              We focus on the metrics that matter: quality of guidance, depth of curriculum, and accuracy of technical validation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="clean-card p-8 group hover:border-primary/30 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-900 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                  <feature.icon size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium mb-8">
                  {feature.desc}
                </p>
                <Link href={feature.link} className="inline-flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest hover:gap-3 transition-all">
                  Learn more <FiArrowRight />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Senior Outreach Section */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full -mr-48 -mt-48 blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-2 items-center gap-16">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-4">Are you a Senior?</p>
              <h2 className="text-4xl md:text-5xl font-display font-black mb-8 leading-tight">
                Shape the Next Cohort <br />
                of Engineers.
              </h2>
              <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                Join a vetted community of senior developers giving back to the community. Validate resumes, mentor high-potential juniors, and curate industry-grade roadmaps.
              </p>
              <Link href="/register" className="btn-primary bg-white text-slate-900 hover:bg-slate-100 px-8 py-3.5 inline-block text-center min-w-[200px]">
                Join as a Senior
              </Link>
            </div>
            <div className="relative">
              <div className="clean-card bg-white/5 border-white/10 p-8 md:p-12 rotate-3 transform translate-x-4 md:translate-x-12 scale-105">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">JD</div>
                  <div>
                    <p className="font-bold text-lg text-slate-600">Senior Feedback</p>
                    <p className="text-xs text-slate-400">Validated 2h ago</p>
                  </div>
                </div>
                <p className="text-slate-300 italic mb-8 leading-relaxed font-medium">
                  "The depth of the technical roadmap we built here is exactly what high-tier companies look for. Seeing juniors clear screenings based on our feedback is truly rewarding."
                </p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(s => <FiCheckCircle key={s} size={14} className="text-primary" />)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
