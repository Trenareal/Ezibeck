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
      <div className="bg-slate-900 text-slate-200 text-[10px] sm:text-xs py-2 px-4 shadow-sm border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-4">
            <span className="flex items-center gap-1.5 justify-center">
              <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 flex-shrink-0" />
              <span className="truncate max-w-[280px] sm:max-w-none">{template.address}</span>
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 flex-shrink-0" />
              {template.phone}
            </span>
            <span className="hidden xs:inline text-slate-700">|</span>
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 flex-shrink-0" />
              {template.email}
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 bg-opacity-95 backdrop-blur-sm shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-700 flex items-center justify-center rounded-lg shadow-sm">
              <span className="text-white font-black text-lg sm:text-xl font-sans">E</span>
            </div>
            <div>
              <h1 className="text-sm sm:text-lg font-black tracking-tight text-slate-900 leading-none uppercase italic">
                {template.schoolName}
              </h1>
              <p className="text-[8px] sm:text-[10px] font-bold tracking-widest text-indigo-600 uppercase mt-0.5 sm:mt-1">
                {template.motto}
              </p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => setActiveTab('welcome')} 
              className={`text-sm font-medium transition-colors py-1 ${activeTab === 'welcome' ? 'text-indigo-700 border-b-2 border-indigo-700 font-bold' : 'text-slate-500 hover:text-indigo-600'}`}
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

          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              onClick={() => onEnterPortal('student')}
              className="px-3 py-1.5 sm:px-5 sm:py-2.5 bg-indigo-700 text-white rounded-full text-[10px] sm:text-xs font-bold shadow-md shadow-indigo-100 hover:bg-indigo-805 transition-all cursor-pointer active:scale-95"
            >
              Portal
            </button>
            <button
              onClick={() => onEnterPortal('teacher')}
              className="px-3 py-1.5 sm:px-5 sm:py-2.5 border border-slate-205 hover:border-slate-350 rounded-full text-[10px] sm:text-xs font-bold text-slate-600 hover:text-slate-900 transition-all cursor-pointer bg-slate-50/50 active:scale-95"
            >
              Staff Desk
            </button>
          </div>
        </div>
      </header>

      {/* Tactile Mobile Tab Swapper */}
      <div className="md:hidden sticky top-[64px] sm:top-[80px] z-30 bg-slate-50 border-b border-slate-200/60 p-2">
        <div className="flex bg-slate-200/70 p-1 rounded-xl max-w-sm mx-auto shadow-3xs">
          <button
            onClick={() => setActiveTab('welcome')}
            className={`flex-1 text-center py-2 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all ${activeTab === 'welcome' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Home
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`flex-1 text-center py-2 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all ${activeTab === 'about' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            About
          </button>
          <button
            onClick={() => setActiveTab('admissions')}
            className={`flex-1 text-center py-2 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all ${activeTab === 'admissions' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Calendar
          </button>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-slate-50 via-slate-100/30 to-white text-slate-900 py-10 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-100 overflow-hidden relative">
          <div className="absolute inset-0 opacity-10 bg-grid-pattern"></div>
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
            {/* Hero Left Text Info */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100/80 text-left">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 flex-shrink-0 animate-ping"></span>
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-indigo-700 leading-tight">
                  Premium academic center of delta state
                </span>
              </div>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-light leading-[1.1] text-slate-900 tracking-tight">
                Sharpening Minds, <br />
                <span className="font-extrabold text-indigo-700">
                  Inspiring Greatness.
                </span>
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm lg:text-base leading-relaxed max-w-xl mx-auto lg:mx-0">
                At <strong className="text-slate-900 font-extrabold">{template.schoolName}</strong>, we provide a holistic environment for world-class learning. Guided by our motto <span className="text-indigo-600 italic font-semibold">"{template.motto}"</span>, we nurture students through meticulous junior & senior secondary curricula to conquer national and global thresholds.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
                <div className="flex items-start gap-3 bg-white/75 backdrop-blur-xs border border-slate-100 p-3.5 sm:p-4 rounded-xl shadow-2xs text-left">
                  <div className="bg-indigo-55 text-indigo-700 p-2 rounded-lg">
                    <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-605" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs sm:text-sm">Full Class Access</h4>
                    <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Grades JSS1-JSS3 & SS1-SS3 stream guides.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-white/75 backdrop-blur-xs border border-slate-100 p-3.5 sm:p-4 rounded-xl shadow-2xs text-left">
                  <div className="bg-indigo-55 text-indigo-700 p-2 rounded-lg">
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-605" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs sm:text-sm">Secure Portal Access</h4>
                    <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Tactile lockboxes for student report directories.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 justify-center lg:justify-start">
                <button
                  onClick={() => onEnterPortal('student')}
                  className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 bg-indigo-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md hover:bg-indigo-805 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Parent & Student Portal <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onEnterPortal('teacher')}
                  className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center justify-center cursor-pointer"
                >
                  Admin & Teacher Sign In
                </button>
              </div>
            </div>

            {/* Hero Right Interactive Widget Card (Professional Polish styled as a 2x2 layout) */}
            <div className="lg:col-span-5 relative mt-6 lg:mt-0">
              <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500 to-indigo-100 rounded-3xl blur opacity-15"></div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 relative">
                <div className="h-32 sm:h-44 bg-white/95 backdrop-blur-xs border border-slate-105 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xs flex flex-col justify-end p-4 sm:p-6">
                  <div className="text-2xl sm:text-4xl font-light text-indigo-700 mb-0.5 sm:mb-1">45+</div>
                  <div className="text-[9px] sm:text-xs uppercase tracking-wider text-slate-400 font-black">Expert Faculty</div>
                </div>
                <div className="h-32 sm:h-44 bg-indigo-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white flex flex-col justify-end shadow-md">
                  <div className="text-2xl sm:text-4xl font-bold mb-0.5 sm:mb-1">98%</div>
                  <div className="text-[9px] sm:text-xs uppercase tracking-wider text-indigo-100 font-extrabold">Exams Success</div>
                </div>
                <div className="col-span-2 p-4 sm:p-6 bg-white border border-slate-105 rounded-2xl sm:rounded-3xl flex flex-col justify-between relative shadow-sm">
                  <span className="absolute top-4 right-4 bg-emerald-50 text-emerald-700 font-extrabold text-[8px] sm:text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1 border border-emerald-150">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> ONLINE
                  </span>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    </div>
                    <div className="text-left">
                      <div className="text-xs sm:text-sm font-black text-slate-800">Quick Portal Gateway</div>
                      <div className="text-[9px] sm:text-[10px] text-slate-500">Immediate access for parents & faculty</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => onEnterPortal('student')}
                      className="w-full bg-indigo-700 hover:bg-indigo-805 text-white font-extrabold text-[10px] sm:text-xs py-2 rounded-lg transition-all text-center cursor-pointer active:scale-95 shadow-3xs"
                    >
                      Report Sheets
                    </button>
                    <button
                      onClick={() => onEnterPortal('teacher')}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10px] sm:text-xs py-2 rounded-lg transition-all text-center cursor-pointer active:scale-95 shadow-3xs"
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
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          {activeTab === 'welcome' && (
            <div className="space-y-12 sm:space-y-16">
              {/* Statistics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <div className="bg-slate-50 border border-slate-100 p-4 sm:p-6 rounded-2xl sm:rounded-3xl text-center shadow-3xs transition-all hover:bg-white hover:shadow-xs hover:border-slate-200/65">
                  <span className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-indigo-700 block mb-0.5 sm:mb-1">JSS1-SS3</span>
                  <span className="text-slate-400 font-extrabold text-[9px] sm:text-[10px] tracking-wider uppercase block">Full Coverage</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-4 sm:p-6 rounded-2xl sm:rounded-3xl text-center shadow-3xs transition-all hover:bg-white hover:shadow-xs hover:border-slate-200/65">
                  <span className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-indigo-700 block mb-0.5 sm:mb-1">100%</span>
                  <span className="text-slate-400 font-extrabold text-[9px] sm:text-[10px] tracking-wider uppercase block">WAEC SUCCESS</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-4 sm:p-6 rounded-2xl sm:rounded-3xl text-center shadow-3xs transition-all hover:bg-white hover:shadow-xs hover:border-slate-200/65">
                  <span className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-indigo-700 block mb-0.5 sm:mb-1">45+</span>
                  <span className="text-slate-400 font-extrabold text-[9px] sm:text-[10px] tracking-wider uppercase block">EXPERT EDUCATORS</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-4 sm:p-6 rounded-2xl sm:rounded-3xl text-center shadow-3xs transition-all hover:bg-white hover:shadow-xs hover:border-slate-200/65">
                  <span className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-indigo-700 block mb-0.5 sm:mb-1">1,500+</span>
                  <span className="text-slate-400 font-extrabold text-[9px] sm:text-[10px] tracking-wider uppercase block">GLOBAL ALUMNI</span>
                </div>
              </div>

              {/* Core Features */}
              <div className="text-center max-w-xl mx-auto">
                <h3 className="text-xl sm:text-2xl font-black text-slate-905 tracking-tight uppercase">Our Curricular Core</h3>
                <p className="text-slate-550 text-xs sm:text-sm mt-2 leading-relaxed">
                  Providing rich intellectual, behavioral, and practical training tailored to meet contemporary and state requirements.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 sm:p-8 rounded-3xl bg-slate-50 border border-slate-100 transition-all shadow-3xs hover:shadow-md duration-305 group">
                  <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl shadow-xs flex items-center justify-center font-bold text-indigo-700 text-xs mb-5">01</div>
                  <h4 className="font-extrabold text-slate-900 text-sm tracking-tight">Junior Secondary (JSS1-3)</h4>
                  <p className="text-slate-550 text-xs mt-3 leading-relaxed">
                    Nurturing fundamental schemas across Mathematics, English language, Basic Science, Business studies, and computer/ICT competencies to construct an ironclad intellectual base.
                  </p>
                </div>
                <div className="p-5 sm:p-8 rounded-3xl bg-slate-50 border border-slate-100 transition-all shadow-3xs hover:shadow-md duration-305 group">
                  <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl shadow-xs flex items-center justify-center font-bold text-indigo-700 text-xs mb-5">02</div>
                  <h4 className="font-extrabold text-slate-900 text-sm tracking-tight">Senior Secondary (SS1-3)</h4>
                  <p className="text-slate-550 text-xs mt-3 leading-relaxed">
                    Advanced specialization in Sciences and Social sciences with exhaustive study in Physics, Chemistry, Biology, Economics, and further mathematics to ready students for external examinations.
                  </p>
                </div>
                <div className="p-5 sm:p-8 rounded-3xl bg-indigo-75 text-white transition-all shadow-3xs hover:shadow-md duration-305 group">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center font-bold text-white text-xs mb-5">03</div>
                  <h4 className="font-extrabold text-sm tracking-tight text-white">Character & Conduct</h4>
                  <p className="text-indigo-100 text-xs mt-3 leading-relaxed">
                    Molding ethical character. Evaluating students Term-by-Term on critical attributes such as Neatness, Punctuality, Politeness, Cooperation, and Self-reliance in accordance with societal value norms.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-10 shadow-sm space-y-8 text-left">
              <h3 className="text-xl sm:text-2xl font-black text-slate-905 border-b border-slate-100 pb-4">About {template.schoolName}</h3>
              <p className="text-slate-650 text-xs sm:text-sm leading-relaxed">
                Founded with a strong commitment to premium values, <strong>{template.schoolName}</strong> represents a hub for high-achieving scholars. Nestled at the heart of Delta, we bridge the gap between traditional training excellence and innovative educational technologies.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 pt-2">
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

              <div className="bg-slate-50 border border-slate-100 p-4 sm:p-6 rounded-2xl relative">
                <h4 className="font-bold text-indigo-700 text-xs uppercase tracking-widest mb-3">Registered Address</h4>
                <div className="flex items-start gap-2.5 text-xs text-slate-600">
                  <MapPin className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <span>{template.address}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'admissions' && (
            <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-10 shadow-sm space-y-8 text-left">
              <h3 className="text-xl sm:text-2xl font-black text-slate-905 border-b border-slate-100 pb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-750" /> Academic & Resumption Schedule
              </h3>
              
              <p className="text-slate-550 text-xs">
                The school runs three terms annually. Following our digital school guidelines, parents can find general reporting sheet records updated here immediately at term's closure.
              </p>

              <div className="relative border-l border-indigo-100 ml-2 space-y-6 sm:space-y-8 pt-2">
                <div className="relative pl-5 sm:pl-6">
                  <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 bg-indigo-705 rounded-full"></div>
                  <h4 className="font-bold text-slate-800 text-xs">Academic Term Closure</h4>
                  <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Completed {template.termDate}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Compilation and release of the digital Student Report Card portfolio for all classes JSS1-JSS3 and SS1-SS3.
                  </p>
                </div>
                <div className="relative pl-5 sm:pl-6">
                  <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 bg-indigo-400 rounded-full"></div>
                  <h4 className="font-bold text-indigo-700 text-xs">Holiday Review & Tutoring</h4>
                  <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">May - July 2026</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Continuous feedback logs. Parents are requested to log into the Report Portal using their student’s exact registered name to download WAEC/report slips.
                  </p>
                </div>
                <div className="relative pl-5 sm:pl-6">
                  <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 bg-indigo-700 rounded-full animate-pulse"></div>
                  <h4 className="font-bold text-indigo-800 text-xs">Next Term Resumption</h4>
                  <p className="text-xs text-indigo-650 font-extrabold mt-0.5">{template.resumptionDate}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Resumption of new academic sessions. All registration logs, fees, and class boards will go live physically at {template.address}.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 sm:px-12 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between text-center md:text-left gap-4 text-[9px] sm:text-[10px] text-slate-400 font-medium uppercase tracking-widest bg-slate-50">
        <div>&copy; 2026 {template.schoolName}. All Rights Reserved.</div>
        <div className="flex items-center gap-4 sm:gap-6">
          <span className="hover:text-indigo-600 transition-colors cursor-pointer">Terms</span>
          <span className="hover:text-indigo-600 transition-colors cursor-pointer">Privacy</span>
          <span className="hover:text-indigo-600 transition-colors cursor-pointer">Accessibility</span>
        </div>
        <div className="flex items-center gap-2 justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          System Status: Online
        </div>
      </footer>
    </div>
  );
}
