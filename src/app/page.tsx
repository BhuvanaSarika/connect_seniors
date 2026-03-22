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
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-dark via-primary to-primary-light text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-accent rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-muted rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:py-32 text-center">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6">
            <span className="text-accent">Connect</span>Seniors
          </h1>
          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-10">
            Bridge the gap between juniors and seniors. Get personalized roadmaps,
            mentorship sessions, resume reviews, and curated learning resources — all in one platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {appUser ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-accent text-bg-dark font-semibold text-lg shadow-lg shadow-accent/30 hover:shadow-accent/50 hover:scale-105 transform transition-all"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-accent text-bg-dark font-semibold text-lg shadow-lg shadow-accent/30 hover:shadow-accent/50 hover:scale-105 transform transition-all"
                >
                  Get Started
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-8 py-3 rounded-xl border-2 border-white/30 text-white font-semibold text-lg hover:bg-white/10 transition-all"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-primary-dark mb-4">
          Everything You Need to <span className="text-accent">Grow</span>
        </h2>
        <p className="text-center text-primary-light mb-14 max-w-xl mx-auto">
          Whether you&apos;re a junior seeking guidance or a senior wanting to give back, ConnectSeniors has you covered.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f) => (
            <div
              key={f.title}
              className="group relative bg-white rounded-2xl p-6 shadow-md hover:shadow-xl border border-muted/30 hover:border-primary-light/50 transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${f.color} text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                <f.icon size={24} />
              </div>
              <h3 className="text-lg font-bold text-primary-dark mb-2">{f.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-bg-dark text-white/60 py-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="font-semibold text-white mb-1">
            <span className="text-accent">Connect</span>Seniors
          </p>
          <p className="text-sm">Empowering the next generation of developers through mentorship.</p>
        </div>
      </footer>
    </div>
  );
}
