/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { School, MapPin, Phone, Mail, Award, BookOpen, Clock, UserCheck, ChevronRight, GraduationCap, Shield } from 'lucide-react';
import { Workspace15Template } from '../types';

interface PublicHomeProps {
  onEnterPortal: (role: 'student' | 'teacher') => void;
  template: Workspace15Template;
}

export default function PublicHome({ onEnterPortal, template }: PublicHomeProps) {
  const [activeTab, setActiveTab] = useState<'welcome' | 'about' | 'admissions'>('welcome');

  return (
    <div className="bg-slate-50 min-h-screen font-sans flex flex-col justify-between">
      {/* Top Banner Contact Header */}
      <div className="bg-slate-900 text-slate-200 text-xs py-2 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              {template.address}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-amber-500" />
              {template.phone}
            </span>
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-amber-500" />
              {template.email}
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 bg-opacity-95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-700 flex items-center justify-center rounded-lg shadow-sm">
              <span className="text-white font-extrabold text-xl font-sans">E</span>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none uppercase italic">
                {template.schoolName}
              </h1>
              <p className="text-[10px] font-bold tracking-widest text-indigo-600 uppercase mt-1">
                {template.motto}
              </p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => setActiveTab('welcome')} 
              className={`text-sm font-medium transition-colors py-1 ${activeTab === 'welcome' ? 'text-indigo-700 border-b-2 border-indigo-700' : 'text-slate-500 hover:text-indigo-600'}`}
            >
              Home
            </button>
            <button 
              onClick={() => setActiveTab('about')} 
              className={`text-sm font-medium transition-colors py-1 ${activeTab === 'about' ? 'text-indigo-700 border-b-2 border-indigo-700' : 'text-slate-500 hover:text-indigo-600'}`}
            >
              About Academy
            </button>
            <button 
              onClick={() => setActiveTab('admissions')} 
              className={`text-sm font-medium transition-colors py-1 ${activeTab === 'admissions' ? 'text-indigo-700 border-b-2 border-indigo-700' : 'text-slate-500 hover:text-indigo-600'}`}
            >
              Academic Calendar
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onEnterPortal('student')}
              className="px-5 py-2.5 bg-indigo-700 text-white rounded-full text-xs font-semibold shadow-lg shadow-indigo-100 hover:bg-indigo-800 transition-all cursor-pointer"
            >
              Report Portal
            </button>
            <button
              onClick={() => onEnterPortal('teacher')}
              className="px-5 py-2.5 border border-slate-200 hover:border-slate-300 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
            >
              Staff Workspace
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-slate-50 via-slate-100/30 to-white text-slate-900 py-16 px-4 md:px-8 border-b border-slate-100 overflow-hidden relative">
          <div className="absolute inset-0 opacity-10 bg-grid-pattern"></div>
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            {/* Hero Left Text Info */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100/80">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-700">delta state's premium center for academic excellence</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-light leading-[1.1] text-slate-900">
                Sharpening Minds, <br />
                <span className="font-bold text-indigo-700">
                  Inspiring Greatness.
                </span>
              </h2>
              <p className="text-slate-500 text-lg leading-relaxed max-w-xl">
                At <strong className="text-slate-900 font-extrabold">{template.schoolName}</strong>, we provide a holistic environment for world-class learning. Guided by our motto <span className="text-indigo-600 italic font-semibold">"{template.motto}"</span>, we nurture students through meticulous junior & senior secondary curricula to conquer national and global thresholds.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-start gap-3 bg-white/60 backdrop-blur-xs border border-slate-100 p-4 rounded-xl shadow-xs">
                  <div className="bg-indigo-55 text-indigo-700 p-2 rounded-lg">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Full Class Access</h4>
                    <p className="text-xs text-slate-500">Encompassing Grades JSS1-JSS3 and SS1-SS3.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-white/60 backdrop-blur-xs border border-slate-100 p-4 rounded-xl shadow-xs">
                  <div className="bg-indigo-55 text-indigo-700 p-2 rounded-lg">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Empowered Portal</h4>
                    <p className="text-xs text-slate-500">Immediate parents and teachers performance lookup.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-4">
                <button
                  onClick={() => onEnterPortal('student')}
                  className="px-8 py-4 bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-800 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center gap-2 cursor-pointer"
                >
                  Parent & Student Portal <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onEnterPortal('teacher')}
                  className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition-all shadow-md cursor-pointer"
                >
                  Admin & Teacher Sign In
                </button>
              </div>
            </div>

            {/* Hero Right Interactive Widget Card (Professional Polish styled as a 2x2 layout) */}
            <div className="lg:col-span-5 relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="h-44 bg-white/90 backdrop-blur-xs border border-slate-100 rounded-3xl overflow-hidden shadow-sm flex flex-col justify-end p-6">
                  <div className="text-4xl font-light text-indigo-700 mb-1">45+</div>
                  <div className="text-xs uppercase tracking-tighter text-slate-500 font-extrabold">Expert Faculty</div>
                </div>
                <div className="h-44 bg-indigo-700 rounded-3xl p-6 text-white flex flex-col justify-end shadow-lg shadow-indigo-100">
                  <div className="text-4xl font-bold mb-1">98%</div>
                  <div className="text-xs uppercase tracking-tighter text-indigo-100 font-extrabold">Exams Success</div>
                </div>
                <div className="col-span-2 p-6 bg-slate-50/50 border border-slate-100/80 rounded-3xl flex flex-col justify-between relative shadow-xs">
                  <span className="absolute top-4 right-4 bg-emerald-50 text-emerald-700 font-bold text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 border border-emerald-100/50">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> SYSTEM ONLINE
                  </span>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-905">Quick Portal Gateway</div>
                      <div className="text-[10px] text-slate-500">Immediate access for parents & faculty</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-200/50">
                    <button
                      onClick={() => onEnterPortal('student')}
                      className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs py-2.5 rounded-xl transition-all text-center cursor-pointer shadow-xs"
                    >
                      Report Sheets
                    </button>
                    <button
                      onClick={() => onEnterPortal('teacher')}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition-all text-center cursor-pointer shadow-xs"
                    >
                      Staff Dashboard
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section based on activeTab */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {activeTab === 'welcome' && (
            <div>
              {/* Statistics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
                <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl text-center shadow-xs transition-colors hover:bg-slate-100/50">
                  <span className="text-3xl md:text-4xl font-extrabold text-indigo-700 block mb-1">JSS1-SS3</span>
                  <span className="text-slate-400 font-extrabold text-[10px] tracking-widest uppercase block">Full Coverage</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl text-center shadow-xs transition-colors hover:bg-slate-100/50">
                  <span className="text-3xl md:text-4xl font-extrabold text-indigo-700 block mb-1">100%</span>
                  <span className="text-slate-400 font-extrabold text-[10px] tracking-widest uppercase block">WAEC / NECO SUCCESS</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl text-center shadow-xs transition-colors hover:bg-slate-100/50">
                  <span className="text-3xl md:text-4xl font-extrabold text-indigo-700 block mb-1">45+</span>
                  <span className="text-slate-400 font-extrabold text-[10px] tracking-widest uppercase block">EXPERT EDUCATORS</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl text-center shadow-xs transition-colors hover:bg-slate-100/50">
                  <span className="text-3xl md:text-4xl font-extrabold text-indigo-700 block mb-1">1,500+</span>
                  <span className="text-slate-400 font-extrabold text-[10px] tracking-widest uppercase block">ALUMNI WORLDWIDE</span>
                </div>
              </div>

              {/* Core Features */}
              <div className="text-center max-w-xl mx-auto mb-12">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Our Curricular Core</h3>
                <p className="text-slate-500 text-sm mt-2">
                  Providing rich intellectual, behavioral, and practical training tailored to meet contemporary and state requirements.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 transition-all shadow-xs hover:shadow-md duration-300 group">
                  <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl shadow-xs flex items-center justify-center font-bold text-indigo-700 text-xs mb-6">01</div>
                  <h4 className="font-bold text-slate-900 text-sm tracking-tight">Junior Secondary (JSS1-3)</h4>
                  <p className="text-slate-500 text-xs mt-3 leading-relaxed">
                    Nurturing fundamental schemas across Mathematics, English language, Basic Science, Business studies, and computer/ICT competencies to construct an ironclad intellectual base.
                  </p>
                </div>
                <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 transition-all shadow-xs hover:shadow-md duration-300 group">
                  <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl shadow-xs flex items-center justify-center font-bold text-indigo-700 text-xs mb-6">02</div>
                  <h4 className="font-bold text-slate-900 text-sm tracking-tight">Senior Secondary (SS1-3)</h4>
                  <p className="text-slate-500 text-xs mt-3 leading-relaxed">
                    Advanced specialization in Sciences and Social sciences with exhaustive study in Physics, Chemistry, Biology, Economics, and further mathematics to ready students for external examinations.
                  </p>
                </div>
                <div className="p-8 rounded-3xl bg-indigo-75 text-white transition-all shadow-xs hover:shadow-md duration-300 group">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center font-bold text-white text-xs mb-6">03</div>
                  <h4 className="font-bold text-sm tracking-tight">Character & Conduct</h4>
                  <p className="text-indigo-100 text-xs mt-3 leading-relaxed">
                    Molding ethical character. Evaluating students Term-by-Term on critical attributes such as Neatness, Punctuality, Politeness, Cooperation, and Self-reliance in accordance with societal value norms.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="bg-white rounded-3xl border border-slate-100 p-10 shadow-sm space-y-8">
              <h3 className="text-2xl font-black text-slate-900 border-b border-slate-100 pb-4">About {template.schoolName}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Founded with a strong commitment to premium values, <strong>{template.schoolName}</strong> represents a hub for high-achieving scholars. Nestled at the heart of Delta, we bridge the gap between traditional training excellence and innovative educational technologies.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                <div className="space-y-2">
                  <h4 className="font-extrabold text-indigo-700 text-xs uppercase tracking-widest border-b border-slate-100 pb-1.5 mb-2.5">Our Vision</h4>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    To remain the leading secondary educational sanctuary, known for molding scholars who emerge at the highest tier of intellectual, ethical, and societal ranks nationwide.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-extrabold text-indigo-700 text-xs uppercase tracking-widest border-b border-slate-100 pb-1.5 mb-2.5">Our Mission</h4>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    To deliver continuous learning through certified faculties, structured state libraries, highly functional computer science laboratories, and responsive evaluations that help students maximize potential.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl relative">
                <h4 className="font-bold text-indigo-700 text-xs uppercase tracking-widest mb-3">Registered Address</h4>
                <div className="flex items-start gap-2.5 text-xs text-slate-600">
                  <MapPin className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span>{template.address}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'admissions' && (
            <div className="bg-white rounded-3xl border border-slate-100 p-10 shadow-sm space-y-8">
              <h3 className="text-2xl font-black text-slate-900 border-b border-slate-100 pb-4 flex items-center gap-2">
                <Clock className="w-6 h-6 text-indigo-700" /> Academic & Resumption Schedule
              </h3>
              
              <p className="text-slate-600 text-xs">
                The school runs three terms annually. Following our digital school guidelines, parents can find general reporting sheet records updated here immediately at term's closure.
              </p>

              <div className="relative border-l-2 border-indigo-100 ml-4 space-y-8 pt-4">
                <div className="relative pl-6">
                  <div className="absolute -left-[7px] top-1.5 w-3 h-3 bg-indigo-700 rounded-full"></div>
                  <h4 className="font-bold text-slate-800 text-xs">Academic Term Closure</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Completed {template.termDate}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Compilation and release of the digital Student Report Card portfolio for all classes JSS1-JSS3 and SS1-SS3.
                  </p>
                </div>
                <div className="relative pl-6">
                  <div className="absolute -left-[7px] top-1.5 w-3 h-3 bg-indigo-400 rounded-full"></div>
                  <h4 className="font-bold text-indigo-700 text-xs">Holiday Review & Tutoring</h4>
                  <p className="text-xs text-slate-400 mt-0.5">May - July 2026</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Continuous feedback logs. Parents are requested to log into the Report Portal using their student’s exact registered name to download WAEC/report slips.
                  </p>
                </div>
                <div className="relative pl-6">
                  <div className="absolute -left-[7px] top-1.5 w-3 h-3 bg-indigo-700 rounded-full animate-pulse"></div>
                  <h4 className="font-bold text-indigo-800 text-xs">Next Term Resumption</h4>
                  <p className="text-xs text-indigo-600 font-extrabold mt-0.5">{template.resumptionDate}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Resumption of new academic sessions. All registration logs, fees, and class boards will go live physically at {template.address}.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="py-6 px-12 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between text-[10px] text-slate-400 font-medium uppercase tracking-widest bg-slate-50">
        <div>&copy; 2026 Ezibeck's Academy. All Rights Reserved.</div>
        <div className="flex items-center gap-6 my-4 md:my-0">
          <span className="hover:text-indigo-600 transition-colors cursor-pointer">Terms</span>
          <span className="hover:text-indigo-600 transition-colors cursor-pointer">Privacy</span>
          <span className="hover:text-indigo-600 transition-colors cursor-pointer">Accessibility</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          System Status: Online
        </div>
      </footer>
    </div>
  );
}
