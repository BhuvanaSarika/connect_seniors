'use client';

import Link from 'next/link';
import { FiGithub, FiLinkedin, FiGlobe, FiMail } from 'react-icons/fi';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-200 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Logo & Vision */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm">
                <span className="font-display font-black text-sm">CS</span>
              </div>
              <span className="font-display font-black text-xl tracking-tight text-slate-900 uppercase">Connect<span className="text-primary italic">Seniors</span></span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed max-w-sm mb-8 font-medium">
              Bridging the technical gap between academic excellence and professional industry standards. A dedicated ecosystem for roadmaps, mentorship, and career acceleration.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-9 h-9 rounded-lg border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary transition-all">
                <FiGlobe size={18} />
              </a>
              <a href="https://github.com/vijayvj86" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary transition-all">
                <FiGithub size={18} />
              </a>
              <a href="https://linkedin.com/in/vijay-manikanta" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary transition-all">
                <FiLinkedin size={18} />
              </a>
            </div>
          </div>

          {/* Quick Registry */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 mb-6">Platform Registry</h4>
            <ul className="space-y-4">
              {['Dashboard', 'Roadmaps', 'Projects', 'Mentorship', 'Resume Reviews'].map((item) => (
                <li key={item}>
                  <Link href={`/${item.toLowerCase().replace(' ', '-')}`} className="text-sm text-slate-500 hover:text-primary transition-colors font-medium">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 mb-6">Connectivity</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                <FiMail className="text-primary" />
                <span>support@solvempire.com</span>
              </li>
              <li className="text-xs text-slate-400 leading-relaxed font-medium">
                Technical support available during institutional hours (IST).
              </li>
            </ul>
          </div>
        </div>

        {/* Brand Credit Section */}
        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <span>© {currentYear} ConnectSeniors</span>
            <span className="hidden md:block w-1 h-1 bg-slate-200 rounded-full" />
            <span className="text-slate-900">A Product from <Link href="https://solvempire.com" target="_blank" rel="noopener noreferrer"><span className="text-primary">Solvempire Private Limited</span></Link></span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <span>Developed by</span>
            <span className="px-2 py-1 bg-slate-50 text-slate-900 rounded border border-slate-200">Tammana Vijaya Manikanta</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
