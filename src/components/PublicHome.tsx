/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  School, MapPin, Phone, Mail, Award, BookOpen, Clock, UserCheck, 
  ChevronRight, ChevronLeft, GraduationCap, Shield, Calendar, Filter, 
  Info, Search, Image as ImageIcon, Eye, X, CheckSquare, Square, RefreshCw, Sparkles
} from 'lucide-react';
import { Workspace15Template } from '../types';
import schoolBadge from '../assets/images/school_badge_1781423327113.jpg';
import GuidelinesComponent from './GuidelinesComponent';

interface PublicHomeProps {
  onEnterPortal: (role: 'student' | 'teacher') => void;
  template: Workspace15Template;
}

// 1. High-Quality School Pictures with details
interface SchoolPicture {
  id: string;
  title: string;
  description: string;
  category: 'academics' | 'science' | 'campus' | 'sports';
  url: string;
}

const SCHOOL_PICTURES: SchoolPicture[] = [
  {
    id: 'classroom-1',
    title: 'Modern Classrooms',
    description: 'Smart board styled spacious learning halls with natural light and collaborative seating setup.',
    category: 'academics',
    url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&auto=format&fit=crop'
  },
  {
    id: 'science-1',
    title: 'Advanced Science Laboratory',
    description: 'State-of-the-art physics, chemistry & biology workspaces with customized test kits for practical exams.',
    category: 'science',
    url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop'
  },
  {
    id: 'library-1',
    title: 'Core Reference Library',
    description: 'Quiet sanctuary housing over 15,000 reference logs, journals, and local research archives.',
    category: 'academics',
    url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&auto=format&fit=crop'
  },
  {
    id: 'computer-1',
    title: 'ICT Computer Suite',
    description: 'Fitted computer systems network providing hands-on coding, typing, and digital assessment practices.',
    category: 'science',
    url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop'
  },
  {
    id: 'campus-1',
    title: 'Serene Green Quadrangle',
    description: 'The manicured center lawn hosting general assemblies, group studies, and relaxation breaks.',
    category: 'campus',
    url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&auto=format&fit=crop'
  },
  {
    id: 'sports-1',
    title: 'Athletic Sports Complex',
    description: 'Physical training development court supporting football, basketball, and athletic practices.',
    category: 'sports',
    url: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800&auto=format&fit=crop'
  }
];

// Helper to determine accurate day list matching Google style
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface CalendarEvent {
  id: string;
  title: string;
  desc: string;
  type: 'holiday' | 'academic' | 'break' | 'exam';
  day: number;
  month: number; // 0-indexed
  year?: number; // If defined, applies to specific year. If undefined, applies to all 4 years.
}

// Full comprehensive events list spanning 4 years (2024, 2025, 2026, 2027)
const EVENT_DEFINITIONS: CalendarEvent[] = [
  // Global annual holidays
  { id: 'ny-day', title: "New Year's Day", desc: "First day of the year national public holiday.", type: 'holiday', day: 1, month: 0 },
  { id: 'val-day', title: "Inter-House Valentine Socials", desc: "Special social hour promoting friendship, kindness, and character values.", type: 'academic', day: 14, month: 1 },
  { id: 'workers-day', title: "Workers' Day", desc: "National public holiday in honor of workers' contributions.", type: 'holiday', day: 1, month: 4 },
  { id: 'children-day', title: "Children's Cultural Day", desc: "No-pen celebration honoring youth developmental excellence and talents.", type: 'academic', day: 27, month: 4 },
  { id: 'dem-day', title: "National Democracy Day", desc: "Public holiday celebrating constitutional democratic governance.", type: 'holiday', day: 12, month: 5 },
  { id: 'ind-day', title: "Independence Day", desc: "National independence day parade and public holiday.", type: 'holiday', day: 1, month: 9 },
  { id: 'teachers-day', title: "World Teachers' Day", desc: "Special assembly honoring our expert educator squad.", type: 'academic', day: 5, month: 9 },
  { id: 'christmas-day', title: "Christmas Day", desc: "Global public holiday celebrating Christmas season.", type: 'holiday', day: 25, month: 11 },
  { id: 'boxing-day', title: "Boxing Day", desc: "National public holiday for sharing goodwill.", type: 'holiday', day: 26, month: 11 },

  // --- 2024 Holidays & Milestones ---
  { id: 'e-24-gf', title: "Good Friday Holiday", desc: "National public holiday.", type: 'holiday', day: 29, month: 2, year: 2024 },
  { id: 'e-24-em', title: "Easter Monday Holiday", desc: "Public holiday for Easter celebration.", type: 'holiday', day: 1, month: 3, year: 2024 },
  { id: 'exam-24-t2', title: "2nd Term examinations", desc: "Exams evaluating cognitive progression for all classes.", type: 'exam', day: 22, month: 2, year: 2024 },
  { id: 'break-24-easter', title: "Easter Holiday Break", desc: "Two week recovery break for junior and senior students.", type: 'break', day: 29, month: 2, year: 2024 },
  { id: 'res-24-t3', title: "3rd Term Resumption", desc: "Academic study files reopen for all classes.", type: 'academic', day: 22, month: 3, year: 2024 },
  { id: 'exam-24-t3', title: "WAEC & Promotional Exams", desc: "Final secondary school examinations and promotions.", type: 'exam', day: 18, month: 5, year: 2024 },
  { id: 'break-24-summer', title: "Grand Summer Vacation", desc: "End of active academic session summer break.", type: 'break', day: 26, month: 6, year: 2024 },
  { id: 'prep-24-st', title: "Annual Teachers' Colloquium", desc: "Staff training, curriculum mapping and lesson log review.", type: 'academic', day: 4, month: 8, year: 2024 },
  { id: 'res-24-t1', title: "New Academic Year Resumption", desc: "First Term orientation and classroom distribution.", type: 'academic', day: 16, month: 8, year: 2024 },
  { id: 'break-24-mid1', title: "First Term Mid-Term Break", desc: "Short structural mental break for students.", type: 'break', day: 1, month: 10, year: 2024 },
  { id: 'exam-24-t1', title: "First Term Examination Period", desc: "Terminal exams testing knowledge logs.", type: 'exam', day: 12, month: 11, year: 2024 },

  // --- 2025 Holidays & Milestones ---
  { id: 'res-25-t2', title: "Second Term Reopening", desc: "Resume classes for the Winter Academic term.", type: 'academic', day: 8, month: 0, year: 2025 },
  { id: 'break-25-mid2', title: "Second Term Mid-Term Break", desc: "Resting break to refresh focus schemas.", type: 'break', day: 20, month: 1, year: 2025 },
  { id: 'exam-25-treset', title: "Second Term Assessment Week", desc: "Term evaluation schedules.", type: 'exam', day: 14, month: 2, year: 2025 },
  { id: 'e-25-gf', title: "Good Friday Holiday", desc: "Public holiday during spring period.", type: 'holiday', day: 18, month: 3, year: 2025 },
  { id: 'e-25-em', title: "Easter Monday Holiday", desc: "Easter holiday break events.", type: 'holiday', day: 21, month: 3, year: 2025 },
  { id: 'res-25-t3', title: "Third Term Launch", desc: "Final stretch for SS3/JSS3 certificate preparation.", type: 'academic', day: 28, month: 3, year: 2025 },
  { id: 'exam-25-waec', title: "West African Senior Exams", desc: "External SSCE papers and local administrative logs.", type: 'exam', day: 19, month: 4, year: 2025 },
  { id: 'break-25-grad', title: "Speech & Graduation Ceremony", desc: "Certificates, honors rollup, and formal closure.", type: 'academic', day: 16, month: 6, year: 2025 },
  { id: 'break-25-summer', title: "Summer Long Vacation", desc: "General school closing before new class promotions.", type: 'break', day: 20, month: 6, year: 2025 },
  { id: 'res-25-t1', title: "Session Reopening (2025/2026)", desc: "New academic school calendar year begins.", type: 'academic', day: 15, month: 8, year: 2025 },
  { id: 'break-25-mid1', title: "1st Term Mid-Term Break", desc: "Rest period and homework checking.", type: 'break', day: 31, month: 9, year: 2025 },
  { id: 'exam-25-t1', title: "First Term Evaluation Exam", desc: "Exams evaluating terms lessons.", type: 'exam', day: 10, month: 11, year: 2025 },

  // --- 2026 Holidays & Milestones (System Present Year) ---
  { id: 'res-26-t2', title: "2026 2nd Term Reopening", desc: "Winter study launch and student ledger review.", type: 'academic', day: 12, month: 0, year: 2026 },
  { id: 'break-26-mid2', title: "2nd Term Mid-Term Break", desc: "Brief respite for teachers and students.", type: 'break', day: 19, month: 1, year: 2026 },
  { id: 'exam-26-t2', title: "Term 2 Final Assessments", desc: "Diagnostic performance scores logging.", type: 'exam', day: 15, month: 2, year: 2026 },
  { id: 'e-26-gf', title: "Good Friday", desc: "National religious spring public holiday.", type: 'holiday', day: 3, month: 3, year: 2026 },
  { id: 'e-26-em', title: "Easter Monday", desc: "Post-Easter relaxation break.", type: 'holiday', day: 6, month: 3, year: 2026 },
  { id: 'res-26-t3', title: "3rd Term Reopening", desc: "Final summer-flow term begins.", type: 'academic', day: 20, month: 3, year: 2026 },
  { id: 'exam-26-t3', title: "Promotion Exams & Tests", desc: "Determines standard upgrade logs.", type: 'exam', day: 15, month: 5, year: 2026 },
  { id: 'term-26-close', title: "Academic Term Graduation Day", desc: "Awarding of report slips of Notion College.", type: 'academic', day: 18, month: 5, year: 2026 },
  { id: 'break-26-summer', title: "Summer Retreat Vacation", desc: "August general vacation periods.", type: 'break', day: 20, month: 6, year: 2026 },
  { id: 'res-26-st1', title: "Session Reopening (2026/2027)", desc: "Fresh academic year distribution of lockers.", type: 'academic', day: 14, month: 8, year: 2026 },
  { id: 'break-26-mid1', title: "1st Term Mid-Term Rest", desc: "Active recess checking progress.", type: 'break', day: 30, month: 9, year: 2026 },
  { id: 'exam-26-t1', title: "Term 1 High-stakes Exams", desc: "Primary cognitive grading logs.", type: 'exam', day: 8, month: 11, year: 2026 },

  // --- 2027 Holidays & Milestones ---
  { id: 'res-27-t2', title: "Second Term Session Launch", desc: "Reopening of faculty doors and class hours.", type: 'academic', day: 11, month: 0, year: 2027 },
  { id: 'break-27-mid2', title: "Cold Season Mid-Term", desc: "Break to escape winter fatigue.", type: 'break', day: 18, month: 1, year: 2027 },
  { id: 'e-27-gf', title: "Good Friday Holiday", desc: "Spring public calendar holiday.", type: 'holiday', day: 26, month: 2, year: 2027 },
  { id: 'e-27-em', title: "Easter Monday Break", desc: "School holiday break event.", type: 'holiday', day: 29, month: 2, year: 2027 },
  { id: 'exam-27-t2', title: "Term 2 Secondary Exams", desc: "Assessed criteria logs entry.", type: 'exam', day: 15, month: 2, year: 2027 },
  { id: 'res-27-t3', title: "Third Term Reopening", desc: "Scholastic final review term launches.", type: 'academic', day: 19, month: 3, year: 2027 },
  { id: 'exam-27-promo', title: "Final Promotion Trials", desc: "Standard exams to certify advancements.", type: 'exam', day: 14, month: 5, year: 2027 },
  { id: 'break-27-summer', title: "Summer Vacation Phase", desc: "Closing down of academic boards.", type: 'break', day: 16, month: 6, year: 2027 },
  { id: 'res-27-t1', title: "Autumn Session Start (2027/2508)", desc: "Orientation day and standard setup logs.", type: 'academic', day: 13, month: 8, year: 2027 },
  { id: 'break-27-mid1', title: "Autumn Term Respite Break", desc: "Brief rest before semester finals.", type: 'break', day: 29, month: 9, year: 2027 },
  { id: 'exam-27-t1', title: "Autumn Term Examination Slates", desc: "General testing sequence records.", type: 'exam', day: 6, month: 11, year: 2027 }
];

export default function PublicHome({ onEnterPortal, template }: PublicHomeProps) {
  const [activeTab, setActiveTab] = useState<'welcome' | 'about'>('welcome');
  const [showGuidelines, setShowGuidelines] = useState(false);

  const handleTabChange = (tab: 'welcome' | 'about') => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToCalendar = () => {
    setActiveTab('welcome');
    setTimeout(() => {
      const element = document.getElementById('google-calendars-dashboard');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  const [openInNewTab, setOpenInNewTab] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ezibeck_open_new_tab') === 'true';
    }
    return false;
  });

  // Hero Section Sliding Image Carousel
  const [heroImageIdx, setHeroImageIdx] = useState(0);
  const heroImages = [
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&auto=format&fit=crop', // Scholars/Classroom focus
    'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&auto=format&fit=crop', // Beautiful brick campus building
    'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1600&auto=format&fit=crop'  // Classic Library
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroImageIdx((prev) => (prev + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // School Photo Gallery Filter State
  const [selectedGalleryCategory, setSelectedGalleryCategory] = useState<'all' | 'academics' | 'science' | 'campus' | 'sports'>('all');
  const [lightboxImage, setLightboxImage] = useState<SchoolPicture | null>(null);

  // Google Calendar States
  const [currentYear, setCurrentYear] = useState<number>(2026); // Default present local year
  const [currentMonth, setCurrentMonth] = useState<number>(5); // June (5 because of 0-based month Index)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ day: number; events: CalendarEvent[] } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Multiple Calendar checkbox states (Google Calendar style sidebar)
  const [enabledCalendars, setEnabledCalendars] = useState({
    holiday: true,
    academic: true,
    break: true,
    exam: true
  });

  const handleToggleNewTab = (val: boolean) => {
    setOpenInNewTab(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ezibeck_open_new_tab', String(val));
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Build the list of events matching current month, year, query and checks
  const getEventsForDay = (year: number, month: number, day: number) => {
    return EVENT_DEFINITIONS.filter(evt => {
      // Check year match
      if (evt.year !== undefined && evt.year !== year) return false;
      // Check month match
      if (evt.month !== month) return false;
      // Check day match
      if (evt.day !== day) return false;
      // Check search match
      if (searchQuery.trim() !== '') {
        const matchesQuery = evt.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             evt.desc.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesQuery) return false;
      }
      // Check type enable filter
      return enabledCalendars[evt.type];
    });
  };

  // Get color styles for the tags depending on event type
  const getEventBadgeStyles = (type: 'holiday' | 'academic' | 'break' | 'exam') => {
    switch (type) {
      case 'holiday':
        return 'bg-rose-50 text-rose-700 border-rose-150 hover:bg-rose-100';
      case 'academic':
        return 'bg-indigo-50 text-indigo-700 border-indigo-150 hover:bg-indigo-100';
      case 'break':
        return 'bg-emerald-50 text-emerald-700 border-emerald-150 hover:bg-emerald-100';
      case 'exam':
        return 'bg-amber-50 text-amber-700 border-amber-150 hover:bg-amber-100';
      default:
        return 'bg-slate-55 text-slate-700 border-slate-200';
    }
  };

  const getEventBgPillColor = (type: 'holiday' | 'academic' | 'break' | 'exam') => {
    switch (type) {
      case 'holiday': return '#ef4444'; // Red
      case 'academic': return '#6366f1'; // Indigo
      case 'break': return '#10b981'; // Green
      case 'exam': return '#f59e0b'; // Amber
    }
  };

  const toggleCalendar = (type: 'holiday' | 'academic' | 'break' | 'exam') => {
    setEnabledCalendars(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  // Setup initial load checking for query calendar link
  const goToToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(5); // June
    setSelectedDayEvents(null);
  };

  // Slide through lightbox images
  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (!lightboxImage) return;
    const filteredImages = SCHOOL_PICTURES.filter(img => 
      selectedGalleryCategory === 'all' ? true : img.category === selectedGalleryCategory
    );
    const currIdx = filteredImages.findIndex(img => img.id === lightboxImage.id);
    if (currIdx === -1) return;
    let nextIdx = direction === 'next' ? currIdx + 1 : currIdx - 1;
    if (nextIdx >= filteredImages.length) nextIdx = 0;
    if (nextIdx < 0) nextIdx = filteredImages.length - 1;
    setLightboxImage(filteredImages[nextIdx]);
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans flex flex-col justify-between">
      {/* Top Banner Contact Header */}
      <div className="bg-slate-900 text-slate-200 text-[10px] sm:text-xs py-2.5 px-4 shadow-sm border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-4">
            <span className="flex items-center gap-1.5 justify-center font-medium">
              <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span className="truncate max-w-[280px] sm:max-w-none">{template.address}</span>
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 font-medium">
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              {template.phone}
            </span>
            <span className="hidden xs:inline text-slate-750">|</span>
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              {template.email}
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 bg-opacity-95 backdrop-blur-sm shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex justify-between items-center">
          <div 
            onClick={() => handleTabChange('welcome')}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none hover:opacity-90 transition-opacity"
            title="Return to Home"
          >
            <div className="w-8 h-8 sm:w-11 sm:h-11 bg-emerald-600 flex items-center justify-center rounded-xl overflow-hidden shadow-sm">
              <img 
                src={schoolBadge} 
                alt={`${template.schoolName} Badge`} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-sm sm:text-lg font-black tracking-tight text-slate-900 leading-none uppercase italic">
                  {template.schoolName}
                </h1>
                <span className="text-[8px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-250 uppercase tracking-wider hidden xs:inline-block">
                  WAEC & NECO Approved
                </span>
              </div>
              <p className="text-[8px] sm:text-[10px] font-bold tracking-widest text-emerald-600 uppercase mt-1">
                {template.motto}
              </p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => handleTabChange('welcome')} 
              className={`text-sm font-bold transition-all py-1.5 border-b-2 ${activeTab === 'welcome' ? 'text-emerald-700 border-emerald-700' : 'text-slate-500 hover:text-emerald-600 border-transparent'}`}
            >
              Academic Home
            </button>
            <button 
              onClick={() => handleTabChange('about')} 
              className={`text-sm font-bold transition-all py-1.5 border-b-2 ${activeTab === 'about' ? 'text-emerald-700 border-emerald-700' : 'text-slate-500 hover:text-emerald-600 border-transparent'}`}
            >
              About Academy
            </button>
            <button 
              onClick={scrollToCalendar} 
              className="text-sm font-bold transition-all py-1.5 border-b-2 text-slate-500 hover:text-emerald-600 border-transparent"
            >
              Google Calendars
            </button>
            <button 
              onClick={() => setShowGuidelines(true)} 
              className="text-sm font-bold transition-all py-1.5 border-b-2 text-slate-500 hover:text-emerald-600 border-transparent cursor-pointer"
            >
              System Guidelines
            </button>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-4">
            {/* New Tab Option Checkbox */}
            <div className="hidden xs:flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 px-2.5 py-1.5 rounded-full text-[10px] font-extrabold text-slate-500 hover:text-slate-700 hover:border-slate-350 transition-all select-none">
              <input
                type="checkbox"
                id="header-open-new-tab"
                checked={openInNewTab}
                onChange={(e) => handleToggleNewTab(e.target.checked)}
                className="w-3.5 h-3.5 accent-emerald-700 rounded bg-white border-slate-300 cursor-pointer"
              />
              <label htmlFor="header-open-new-tab" className="cursor-pointer select-none">
                Separate tabs ↗
              </label>
            </div>

            <a
              href={`/?view=student`}
              target={openInNewTab ? "_blank" : "_self"}
              onClick={(e) => {
                if (!openInNewTab) {
                  e.preventDefault();
                  onEnterPortal('student');
                }
              }}
              className="px-3 py-1.5 sm:px-5 sm:py-2.5 bg-emerald-600 text-white rounded-full text-[10px] sm:text-xs font-black shadow-md shadow-emerald-100 hover:bg-emerald-700 transition-all cursor-pointer text-center select-none active:scale-95"
            >
              Report Portal
            </a>
            <a
              href={`/?view=teacher`}
              target={openInNewTab ? "_blank" : "_self"}
              onClick={(e) => {
                if (!openInNewTab) {
                  e.preventDefault();
                  onEnterPortal('teacher');
                }
              }}
              className="px-3 py-1.5 sm:px-5 sm:py-2.5 border border-slate-250 hover:border-slate-350 hover:bg-slate-100 rounded-full text-[10px] sm:text-xs font-black text-slate-650 hover:text-slate-900 transition-all cursor-pointer bg-slate-50/50 text-center select-none active:scale-95"
            >
              Staff Desk
            </a>
          </div>
        </div>
      </header>

      {/* Tactile Mobile Tab Swapper */}
      <div className="md:hidden sticky top-[64px] sm:top-[80px] z-30 bg-slate-50 border-b border-slate-200/60 p-2">
        <div className="flex bg-slate-200/75 p-1 rounded-2xl max-w-sm mx-auto shadow-3xs">
          <button
            onClick={() => handleTabChange('welcome')}
            className={`flex-1 text-center py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all ${activeTab === 'welcome' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Home
          </button>
          <button
            onClick={() => handleTabChange('about')}
            className={`flex-1 text-center py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all ${activeTab === 'about' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            About
          </button>
          <button
            onClick={scrollToCalendar}
            className="flex-1 text-center py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all text-slate-500 hover:text-slate-905"
          >
            Google Calendar
          </button>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-grow">
        {/* Dynamic Image Carousel Hero Section */}
        <section className="bg-slate-900 text-white overflow-hidden relative min-h-[360px] sm:min-h-[460px] flex items-center justify-center border-b border-slate-800">
          {/* Layered images for fading transition */}
          {heroImages.map((img, i) => (
            <div 
              key={i}
              className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
              style={{ 
                backgroundImage: `linear-gradient(to right, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.4) 50%, rgba(15,23,42,0.85) 100%), url(${img})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: heroImageIdx === i ? 0.75 : 0,
                zIndex: 1
              }}
            />
          ))}

          {/* Dots controller indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 bg-slate-950/40 px-3 py-1.5 rounded-full backdrop-blur-xs">
            {heroImages.map((_, i) => (
              <button 
                key={i} 
                onClick={() => setHeroImageIdx(i)}
                className={`w-2 h-2 rounded-full transition-transform ${heroImageIdx === i ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/60'}`}
              />
            ))}
          </div>

          {/* Right & Left tactile arrows */}
          <button 
            onClick={() => setHeroImageIdx((prev) => (prev - 1 + heroImages.length) % heroImages.length)}
            className="absolute left-4 w-9 h-9 rounded-full bg-slate-900/60 backdrop-blur-xs flex items-center justify-center hover:bg-slate-950/80 transition-all text-white z-10 cursor-pointer hidden md:flex"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setHeroImageIdx((prev) => (prev + 1) % heroImages.length)}
            className="absolute right-4 w-9 h-9 rounded-full bg-slate-900/60 backdrop-blur-xs flex items-center justify-center hover:bg-slate-950/80 transition-all text-white z-10 cursor-pointer hidden md:flex"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-10 w-full text-center lg:text-left">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Text Info */}
              <div className="lg:col-span-7 space-y-4 sm:space-y-6">
                <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-left">
                    <span className="w-2 h-2 rounded-full bg-emerald-405 animate-ping" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200">
                      Premium Academic Center Delta State
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/25 border border-emerald-400/30 text-left">
                    <Award className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                      WAEC & NECO APPROVED CENTRE
                    </span>
                  </div>
                </div>
                <h2 className="text-2xl sm:text-[45px] lg:text-[54px] font-black leading-[1.1] text-white tracking-tight">
                  Sharpening Minds, <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-emerald-300 to-emerald-100">
                    Inspiring Greatness
                  </span>
                </h2>
                <p className="text-slate-300 text-xs sm:text-sm lg:text-base leading-relaxed max-w-xl mx-auto lg:mx-0">
                  At <strong className="text-white font-extrabold">{template.schoolName}</strong>, we provide a holistic, secure workspace for world-class learning. Directed by our motto <span className="text-amber-300 italic font-medium">"{template.motto}"</span>, we prepare pupils to scale global performance thresholds.
                </p>

                <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-2 justify-center lg:justify-start items-center">
                  <a
                    href={`/?view=student`}
                    target={openInNewTab ? "_blank" : "_self"}
                    onClick={(e) => {
                      if (!openInNewTab) {
                        e.preventDefault();
                        onEnterPortal('student');
                      }
                    }}
                    className="w-full sm:w-auto px-5 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black rounded-2xl text-[11px] sm:text-xs shadow-md shadow-emerald-900/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
                  >
                    Parent & Student Report Portal <ChevronRight className="w-3.5 h-3.5 text-emerald-200" />
                  </a>
                  <a
                    href={`/?view=teacher`}
                    target={openInNewTab ? "_blank" : "_self"}
                    onClick={(e) => {
                      if (!openInNewTab) {
                        e.preventDefault();
                        onEnterPortal('teacher');
                      }
                    }}
                    className="w-full sm:w-auto px-5 py-3.5 bg-slate-950 border border-slate-850 hover:bg-slate-805 text-amber-400 font-bold rounded-2xl text-[11px] sm:text-xs transition-all shadow-md flex items-center justify-center cursor-pointer text-center"
                  >
                    Admin & Faculty Desk
                  </a>
                </div>

                {/* Always Open Portals Notice */}
                <div className="flex items-center justify-center lg:justify-start gap-2 pt-1 text-slate-400 text-xs select-none">
                  <input
                    type="checkbox"
                    id="hero-open-new-tab"
                    checked={openInNewTab}
                    onChange={(e) => handleToggleNewTab(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-750 bg-slate-800 border-slate-700 cursor-pointer accent-emerald-600 focus:ring-0"
                  />
                  <label htmlFor="hero-open-new-tab" className="cursor-pointer text-[11px] font-semibold hover:text-slate-200">
                    Open student sheets and staff desk in separate window grids ↗
                  </label>
                </div>
              </div>

              {/* Stat Boxes */}
              <div className="lg:col-span-5 grid grid-cols-2 gap-3 sm:gap-4 w-full">
                <div className="bg-slate-955/80 border border-slate-800/80 p-5 rounded-3xl backdrop-blur-md shadow-2xl hover:border-slate-700 transition-all">
                  <Award className="w-5 h-5 text-amber-400 mb-2" />
                  <div className="text-xl sm:text-2xl font-black text-white">45+ Years</div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mt-1">Excellent Pedigree</div>
                </div>
                <div className="bg-slate-955/80 border border-slate-800/80 p-5 rounded-3xl backdrop-blur-md shadow-2xl hover:border-slate-700 transition-all">
                  <GraduationCap className="w-5 h-5 text-emerald-400 mb-2" />
                  <div className="text-xl sm:text-2xl font-black text-white">100% SUCCESS</div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mt-1">WAEC & NECO Pass</div>
                </div>
                <div className="col-span-2 bg-gradient-to-r from-slate-955 to-slate-900 border border-slate-950 p-5 rounded-3xl backdrop-blur-md shadow-2xl text-left flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-xs font-extrabold text-emerald-300 uppercase tracking-widest">Active Academic Session</h4>
                    <p className="text-sm font-black text-white">{template.session}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Delta State Ministry Certifications</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-950 rounded-2xl flex items-center justify-center border border-emerald-900">
                    <CheckSquare className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section based on activeTab */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          {activeTab === 'welcome' && (
            <div className="space-y-16 sm:space-y-24">
              {/* Statistics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <div className="bg-white border border-slate-100 p-5 sm:p-7 rounded-3xl text-center shadow-3xs transition-all hover:shadow-xs hover:border-slate-200">
                  <span className="text-2xl sm:text-4xl font-black text-emerald-700 block mb-1">JSS1 - SS3</span>
                  <span className="text-slate-400 font-bold text-[9px] sm:text-[10px] tracking-wider uppercase block">Classes Available</span>
                </div>
                <div className="bg-white border border-slate-100 p-5 sm:p-7 rounded-3xl text-center shadow-3xs transition-all hover:shadow-xs hover:border-slate-200">
                  <span className="text-2xl sm:text-4xl font-black text-emerald-700 block mb-1">98.4%</span>
                  <span className="text-slate-400 font-bold text-[9px] sm:text-[10px] tracking-wider uppercase block">JAMB Entry Scores</span>
                </div>
                <div className="bg-white border border-slate-100 p-5 sm:p-7 rounded-3xl text-center shadow-3xs transition-all hover:shadow-xs hover:border-slate-200">
                  <span className="text-2xl sm:text-4xl font-black text-emerald-700 block mb-1">15+</span>
                  <span className="text-slate-400 font-bold text-[9px] sm:text-[10px] tracking-wider uppercase block">Science Labs Equipments</span>
                </div>
                <div className="bg-white border border-slate-100 p-5 sm:p-7 rounded-3xl text-center shadow-3xs transition-all hover:shadow-xs hover:border-slate-200">
                  <span className="text-2xl sm:text-4xl font-black text-emerald-700 block mb-1">1,820+</span>
                  <span className="text-slate-400 font-bold text-[9px] sm:text-[10px] tracking-wider uppercase block">Graduated Scholars</span>
                </div>
              </div>

              {/* Interactive Photo Gallery Section */}
              <div className="space-y-8" id="campus-photo-gallery">
                <div className="text-center max-w-2xl mx-auto space-y-2">
                  <span className="bg-emerald-50 border border-emerald-100 text-emerald-800 font-bold text-[10px] px-3 py-1 rounded-full uppercase tracking-widest inline-flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-600" /> Dynamic Campus Tour
                  </span>
                  <h3 className="text-xl sm:text-3xl font-black text-slate-905 tracking-tight uppercase">Vibrant Academy Gallery</h3>
                  <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                    Explore real photos of our excellent infrastructure, fully fitted labs, core resource reference library halls, and pristine Delta sports complex grounds.
                  </p>
                </div>

                {/* Filter Controls (Pill sliders) */}
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-md mx-auto">
                  {(['all', 'academics', 'science', 'campus', 'sports'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedGalleryCategory(cat)}
                      className={`px-4 py-2 text-xs font-bold rounded-full border transition-all cursor-pointer ${
                        selectedGalleryCategory === cat
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs scale-102 font-black'
                          : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300'
                      }`}
                    >
                      {cat.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Photo Responsive Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {SCHOOL_PICTURES.filter(img => selectedGalleryCategory === 'all' ? true : img.category === selectedGalleryCategory)
                    .map((picture) => (
                      <div 
                        key={picture.id}
                        onClick={() => setLightboxImage(picture)}
                        className="group bg-white rounded-3xl border border-slate-105 overflow-hidden shadow-2xs hover:shadow-lg hover:border-slate-200 transition-all cursor-pointer duration-300 hover:-translate-y-1 relative"
                      >
                        {/* Img Box */}
                        <div className="h-56 overflow-hidden relative">
                          <img 
                            src={picture.url} 
                            alt={picture.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-4 flex justify-between items-end">
                            <span className="text-[9px] font-black uppercase text-amber-400 bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800">
                              {picture.category}
                            </span>
                            <span className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center hover:bg-white text-white group-hover:text-emerald-600 transition-all">
                              <Eye className="w-4 h-4" />
                            </span>
                          </div>
                        </div>

                        {/* Title details */}
                        <div className="p-5 text-left space-y-1.5">
                          <h4 className="font-extrabold text-slate-900 text-sm tracking-tight group-hover:text-emerald-600 transition-colors">
                            {picture.title}
                          </h4>
                          <p className="text-slate-500 text-[11px] leading-relaxed">
                            {picture.description}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Core Features */}
              <div className="text-center max-w-xl mx-auto space-y-2">
                <span className="bg-emerald-50 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-lg border border-emerald-150 uppercase tracking-widest inline-flex items-center gap-1">
                  <Award className="w-3 h-3" /> Core Curricular Values
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-905 tracking-tight uppercase">Pedagogic Frameworks</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-105 shadow-2xs hover:shadow-md transition-all">
                  <div className="w-10 h-10 bg-emerald-50 border border-emerald-100/50 rounded-xl flex items-center justify-center font-black text-emerald-700 text-xs mb-5">01</div>
                  <h4 className="font-extrabold text-slate-900 text-sm tracking-tight">Junior Secondary (JSS1-3)</h4>
                  <p className="text-slate-550 text-xs mt-3 leading-relaxed">
                    Nurturing fundamental concepts in Mathematics, English Language, Basic Sciences, Business Studies, and computer literacy to support a competitive intellectual template.
                  </p>
                </div>
                <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-105 shadow-2xs hover:shadow-md transition-all">
                  <div className="w-10 h-10 bg-emerald-50 border border-emerald-100/50 rounded-xl flex items-center justify-center font-black text-emerald-700 text-xs mb-5">02</div>
                  <h4 className="font-extrabold text-slate-900 text-sm tracking-tight">Senior Secondary (SS1-3)</h4>
                  <p className="text-slate-550 text-xs mt-3 leading-relaxed">
                    Advanced classes branching to Sciences, Arts, and Social Sciences. Preparing students meticulously to tackle WAEC, NECO, and tertiary entrance examinations.
                  </p>
                </div>
                <div className="p-6 sm:p-8 rounded-3xl bg-emerald-600 text-white shadow-2xs hover:shadow-md transition-all">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center font-black text-white text-xs mb-5">03</div>
                  <h4 className="font-extrabold text-sm tracking-tight text-white">Character & Conduct</h4>
                  <p className="text-emerald-100 text-xs mt-3 leading-relaxed">
                    Building robust character. Students receive scores across Punctuality, Neatness, Politeness, Cooperation, and Leadership to ensure ethical compliance with premium community values.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="bg-white rounded-3xl border border-slate-105 p-5 sm:p-10 shadow-sm space-y-8 text-left">
              <h3 className="text-xl sm:text-2xl font-black text-slate-905 border-b border-slate-100 pb-4">About {template.schoolName}</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-4">
                  <p className="text-slate-650 text-xs sm:text-sm leading-relaxed">
                    Founded with a strong commitment to high-achieving scholars, <strong>{template.schoolName}</strong> represents a premier hub for educational distinction. Nestled at the heart of Delta, we bridge standard academic core values with modern online database persistence.
                  </p>
                  <p className="text-slate-550 text-xs leading-relaxed">
                    Every student registered is tracked individually on behavioral attributes, physical attendance indexes, and terminal scorecards. This ensures absolute transparency and keeps target metrics fully optimized for global alignment.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-2">
                      <h4 className="font-extrabold text-emerald-700 text-xs uppercase tracking-widest border-b border-slate-100 pb-1.5 mb-2">Our Vision</h4>
                      <p className="text-slate-550 text-xs leading-relaxed">
                        To remain the leading secondary educational sanctuary, known for molding scholars who emerge at the highest tier of intellectual, ethical, and global ranks.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-extrabold text-emerald-700 text-xs uppercase tracking-widest border-b border-slate-100 pb-1.5 mb-2">Our Mission</h4>
                      <p className="text-slate-550 text-xs leading-relaxed">
                        To deliver continuous high-fidelity learning through certified faculties, structured resources libraries, highly functional science laboratories, and responsive evaluations.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 rounded-3xl overflow-hidden shadow-md border border-slate-100">
                  <img 
                    src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop" 
                    alt="Campus building exterior"
                    referrerPolicy="no-referrer"
                    className="w-full h-64 object-cover"
                  />
                  <div className="bg-slate-900 p-4 text-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                      Notion Core Principal Block Exterior
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 border border-slate-100 p-4 sm:p-6 rounded-2xl relative">
                <h4 className="font-bold text-emerald-700 text-xs uppercase tracking-widest mb-3">Registered Administrative Address</h4>
                <div className="flex items-start gap-2.5 text-xs text-slate-600">
                  <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>{template.address}</span>
                </div>
              </div>

              {/* Outstanding pillars of the school */}
              <div className="border-t border-slate-100 pt-8 space-y-6">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" /> Outstanding Pillars of Our Academy
                </h4>
                <p className="text-slate-550 text-xs leading-relaxed">
                  We take pride in our well-equipped school environment, committed staff, and exceptional track record of modeling students for a bright and productive future.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  
                  <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200/60 flex flex-col justify-between text-left space-y-3 hover:border-emerald-250 transition-all">
                    <div className="space-y-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                      </div>
                      <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-tight">Experienced Educationalists</h5>
                      <p className="text-slate-550 text-[11px] leading-relaxed">
                        Led by passionate and qualified proprietors alongside active senior educationalists. Our dedicated staff guides pupils to secure excellent outcomes in both class and community.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Certified Mentorship &rarr;</span>
                  </div>

                  <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200/60 flex flex-col justify-between text-left space-y-3 hover:border-emerald-250 transition-all">
                    <div className="space-y-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <Award className="w-4 h-4 text-emerald-600" />
                      </div>
                      <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-tight">Outstanding Academic Record</h5>
                      <p className="text-slate-550 text-[11px] leading-relaxed">
                        Our academy consistently achieves a perfect 100% success rate in WAEC & NECO approved examinations, positioning our students at the very top tier.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">WAEC & NECO Approved Centre &rarr;</span>
                  </div>

                  <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200/60 flex flex-col justify-between text-left space-y-3 hover:border-emerald-250 transition-all">
                    <div className="space-y-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                        <School className="w-4 h-4 text-amber-600" />
                      </div>
                      <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-tight">Premium Infrastructure</h5>
                      <p className="text-slate-550 text-[11px] leading-relaxed">
                        Features beautiful, spacious, and extremely clean school buildings. Equipped with proper ventilation, comfortable seating structures, and modern visual learning aids.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-amber-600 uppercase">First-Class Environment &rarr;</span>
                  </div>

                  <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200/60 flex flex-col justify-between text-left space-y-3 hover:border-emerald-250 transition-all">
                    <div className="space-y-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-emerald-600" />
                      </div>
                      <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-tight">Character Molding</h5>
                      <p className="text-slate-550 text-[11px] leading-relaxed">
                        We actively shape young leaders with strong moral values, grading every student regularly in Cooperation, Politeness, Neatness, Punctuality, and Executive Conduct.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Integrity & Honor &rarr;</span>
                  </div>

                  <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200/60 flex flex-col justify-between text-left space-y-3 hover:border-emerald-250 transition-all">
                    <div className="space-y-2">
                      <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-orange-600" />
                      </div>
                      <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-tight">High Standard Labs</h5>
                      <p className="text-slate-550 text-[11px] leading-relaxed">
                        Fitted Chemistry, Physics, Biology, and ICT suites packed with correct reagents and high-grade apparatus designed for perfect WAEC and NECO practical lessons.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-orange-650 uppercase">Fully Equipped Labs &rarr;</span>
                  </div>

                  <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200/60 flex flex-col justify-between text-left space-y-3 hover:border-emerald-250 transition-all">
                    <div className="space-y-2">
                      <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-rose-600" />
                      </div>
                      <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-tight">Athletic Achievements</h5>
                      <p className="text-slate-550 text-[11px] leading-relaxed">
                        Outstanding athletic facilities supporting competitive track tournaments, football teams, and indoor physical sports activities to foster real fitness.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-rose-650 uppercase">Home of Champions &rarr;</span>
                  </div>

                </div>
              </div>

              {/* Term Sessions Schedule Section */}
              <div className="bg-gradient-to-br from-emerald-50/50 via-white to-slate-50/50 border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-3xs space-y-6 text-left mt-12">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-55 border border-emerald-100 rounded-2xl">
                    <Clock className="w-6 h-6 text-emerald-705" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase">Academic Session Terms</h3>
                    <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Official School Calendar Terms & Timelines</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* First Term Card */}
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-3xs flex flex-col justify-between hover:border-emerald-300 transition-all group">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] bg-slate-100 border border-slate-200 text-slate-700 font-extrabold tracking-widest uppercase px-2.5 py-0.5 rounded-md">First Term</span>
                        <span className="text-[10px] font-mono text-slate-400 font-bold">Sept - Dec</span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-sm">Autumn Term Session</h4>
                      <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                        Lays down academic foundations and class orientations. Runs from <strong className="text-emerald-750 font-black">September</strong> to the <strong className="text-emerald-700 font-black">3rd week of December</strong>. Matches curriculum orientation blocks.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-bold group-hover:text-emerald-700 transition-colors">
                      <span>STATUS: AUTUMN TERM ARCHIVE</span>
                      <span>&rarr;</span>
                    </div>
                  </div>

                  {/* Second Term Card */}
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-3xs flex flex-col justify-between hover:border-emerald-300 transition-all group">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] bg-slate-100 border border-slate-200 text-slate-700 font-extrabold tracking-widest uppercase px-2.5 py-0.5 rounded-md">Second Term</span>
                        <span className="text-[10px] font-mono text-slate-400 font-bold">Jan - Mar</span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-sm">Winter Term Session</h4>
                      <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                        Heavy intellectual content delivery cycles and class assessment slates. Runs from <strong className="text-emerald-750 font-black">January</strong> to the <strong className="text-emerald-700 font-black">last week of March</strong>.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-bold group-hover:text-emerald-700 transition-colors">
                      <span>STATUS: WINTER TERM ARCHIVE</span>
                      <span>&rarr;</span>
                    </div>
                  </div>

                  {/* Third Term Card */}
                  <div className="bg-white border border-emerald-300 p-5 rounded-2xl shadow-3xs flex flex-col justify-between hover:border-emerald-400 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full pointer-events-none flex items-center justify-center">
                      <span className="text-[8px] font-black text-emerald-800 uppercase tracking-widest -rotate-45 translate-x-2 -translate-y-2">Current</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] bg-emerald-50 border border-emerald-100 text-emerald-800 font-extrabold tracking-widest uppercase px-2.5 py-0.5 rounded-md">Third Term</span>
                        <span className="text-[10px] font-mono text-slate-400 font-bold">Apr - Jul</span>
                      </div>
                      <h4 className="font-extrabold text-slate-905 text-sm">Summer Term Session</h4>
                      <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                        Final promotional examination sequences and graduation ceremonies. Runs from the <strong className="text-emerald-750 font-black">last week of April</strong> to the <strong className="text-emerald-700 font-black">last week of July</strong>.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[9px] text-emerald-700 font-black">
                      <span>STATUS: ACTIVE CALENDAR</span>
                      <span>&rarr;</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Return Home CTA button */}
              <div className="flex justify-center pt-10 mt-6 border-t border-slate-100/60 select-none">
                <button
                  onClick={() => handleTabChange('welcome')}
                  className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs shadow-md shadow-emerald-100 hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 select-none active:scale-95 duration-200"
                >
                  &larr; Return to Academic Home
                </button>
              </div>

            </div>
          )}

          {activeTab === 'welcome' && (
            <div className="bg-white rounded-3xl border border-slate-105 p-4 sm:p-8 shadow-sm space-y-6 text-left mt-16 sm:mt-24" id="google-calendars-dashboard">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-150 pb-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
                    <Calendar className="w-6 h-6 text-emerald-700" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase">Google Calendar Workspace</h3>
                    <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Holidays & Academic Calendar (4 Years: 2024–2027)</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Today Quick Link */}
                  <button
                    onClick={goToToday}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-705 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Clock className="w-3.5 h-3.5 text-slate-600" /> Today
                  </button>

                  {/* Year Select Pills (2024 to 2027) */}
                  <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200 shadow-3xs">
                    {[2024, 2025, 2026, 2027].map((yr) => (
                      <button
                        key={yr}
                        onClick={() => {
                          setCurrentYear(yr);
                          setSelectedDayEvents(null);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          currentYear === yr 
                            ? 'bg-emerald-600 text-white' 
                            : 'text-slate-505 hover:text-slate-800'
                        }`}
                      >
                        {yr}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Subtitle description */}
              <p className="text-slate-550 text-xs leading-relaxed max-w-3xl">
                Track full national holiday rosters, term closures, promotional examination slates, and summer vacation schedules plotted precisely in Google Calendar aesthetics across <strong>2024, 2025, 2026, and 2027</strong>.
              </p>

              {/* TWO COLUMN GRID WORKSPACE (Left: Sidebar Filters | Right: Main Month Grid) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 pt-2">
                
                {/* Side filters */}
                <div className="lg:col-span-3 space-y-6 flex flex-col justify-start">
                  
                  {/* Search calendar input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Search in Calendar</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search holidays..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setSelectedDayEvents(null);
                        }}
                        className="w-full pl-9 pr-4 py-2 border border-slate-250 rounded-2xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  {/* Month Selection Sidebar Scroll list */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Months of {currentYear}</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-1 gap-1.5 max-h-[220px] lg:max-h-[300px] overflow-y-auto pr-1">
                      {MONTHS.map((m, idx) => (
                        <button
                          key={m}
                          onClick={() => {
                            setCurrentMonth(idx);
                            setSelectedDayEvents(null);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-between ${
                            currentMonth === idx
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-950 font-extrabold'
                              : 'bg-white border-slate-105 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span>{m}</span>
                          {currentMonth === idx && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sidebar Checkbox checklist filters (My Calendars) */}
                  <div className="bg-slate-50 border border-slate-250 p-4 rounded-2xl space-y-3">
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-205">
                      <Filter className="w-3.5 h-3.5 text-emerald-700" /> My Calendars
                    </h4>
                    
                    <div className="space-y-2">
                      <button 
                        onClick={() => toggleCalendar('holiday')}
                        className="flex items-center gap-2 text-xs font-bold text-slate-700 w-full hover:bg-slate-100 p-1 rounded-md text-left cursor-pointer transition-all"
                      >
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: '#ef4444' }} />
                        <span className="flex-grow">Public Holidays</span>
                        {enabledCalendars.holiday ? <CheckSquare className="w-4 h-4 text-slate-600" /> : <Square className="w-4 h-4 text-slate-350" />}
                      </button>
                      
                      <button 
                        onClick={() => toggleCalendar('academic')}
                        className="flex items-center gap-2 text-xs font-bold text-slate-700 w-full hover:bg-slate-100 p-1 rounded-md text-left cursor-pointer transition-all"
                      >
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: '#6366f1' }} />
                        <span className="flex-grow">Academic Sessions</span>
                        {enabledCalendars.academic ? <CheckSquare className="w-4 h-4 text-slate-600" /> : <Square className="w-4 h-4 text-slate-350" />}
                      </button>

                      <button 
                        onClick={() => toggleCalendar('break')}
                        className="flex items-center gap-2 text-xs font-bold text-slate-700 w-full hover:bg-slate-100 p-1 rounded-md text-left cursor-pointer transition-all"
                      >
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: '#10b981' }} />
                        <span className="flex-grow">Term Vacations</span>
                        {enabledCalendars.break ? <CheckSquare className="w-4 h-4 text-slate-600" /> : <Square className="w-4 h-4 text-slate-350" />}
                      </button>

                      <button 
                        onClick={() => toggleCalendar('exam')}
                        className="flex items-center gap-2 text-xs font-bold text-slate-700 w-full hover:bg-slate-100 p-1 rounded-md text-left cursor-pointer transition-all"
                      >
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: '#f59e0b' }} />
                        <span className="flex-grow">Exams & Slates</span>
                        {enabledCalendars.exam ? <CheckSquare className="w-4 h-4 text-slate-600" /> : <Square className="w-4 h-4 text-slate-350" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Main Google Grid content area */}
                <div className="lg:col-span-9 space-y-4">
                  {/* Grid Month Swiper Header */}
                  <div className="flex items-center justify-between bg-slate-900 text-white px-4 py-3 rounded-2xl">
                    <button
                      onClick={() => {
                        setSelectedDayEvents(null);
                        if (currentMonth === 0) {
                          setCurrentMonth(11);
                          setCurrentYear(prev => prev > 2024 ? prev - 1 : 2027);
                        } else {
                          setCurrentMonth(prev => prev - 1);
                        }
                      }}
                      className="p-1 rounded-full hover:bg-slate-800 transition-all cursor-pointer text-white"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <div className="text-center font-extrabold text-sm uppercase tracking-widest font-mono">
                      {MONTHS[currentMonth]} {currentYear}
                    </div>

                    <button
                      onClick={() => {
                        setSelectedDayEvents(null);
                        if (currentMonth === 11) {
                          setCurrentMonth(0);
                          setCurrentYear(prev => prev < 2027 ? prev + 1 : 2024);
                        } else {
                          setCurrentMonth(prev => prev + 1);
                        }
                      }}
                      className="p-1 rounded-full hover:bg-slate-800 transition-all cursor-pointer text-white"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Calendar Grid Container */}
                  <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-3xs">
                    
                    {/* Days of Week Label Header */}
                    <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                      {DAYS_OF_WEEK.map((day) => (
                        <div key={day} className="text-center py-2 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Infinite Cells Grid */}
                    <div className="grid grid-cols-7 border-b border-slate-105 divide-x divide-y divide-slate-150 min-h-[340px] sm:min-h-[440px] bg-slate-50/10">
                      {(() => {
                        const totalDays = getDaysInMonth(currentYear, currentMonth);
                        const startOff = getFirstDayOfMonth(currentYear, currentMonth);
                        const prevMonthDays = getDaysInMonth(currentYear, currentMonth === 0 ? 11 : currentMonth - 1);
                        const cells: React.ReactNode[] = [];

                        // 1. Padding days from last month
                        for (let i = startOff - 1; i >= 0; i--) {
                          const pDay = prevMonthDays - i;
                          cells.push(
                            <div 
                              key={`prev-${pDay}`} 
                              className="p-1.5 sm:p-2 bg-slate-100/40 text-slate-300 text-xs font-medium min-h-[64px] sm:min-h-[85px] text-right cursor-not-allowed select-none"
                            >
                              <span className="text-[10px] opacity-60 font-medium font-mono">{pDay}</span>
                            </div>
                          );
                        }

                        // 2. Active month days
                        for (let d = 1; d <= totalDays; d++) {
                          const dayEvts = getEventsForDay(currentYear, currentMonth, d);
                          
                          // Check if cell corresponds to the System Local Present Date: June 12, 2026
                          const isSystemToday = currentYear === 2026 && currentMonth === 5 && d === 12;

                          cells.push(
                            <div
                              key={`day-${d}`}
                              onClick={() => {
                                if (dayEvts.length > 0) {
                                  setSelectedDayEvents({ day: d, events: dayEvts });
                                } else {
                                  setSelectedDayEvents(null);
                                }
                              }}
                              className={`p-1.5 sm:p-2 text-slate-800 text-xs min-h-[64px] sm:min-h-[85px] flex flex-col justify-between transition-all relative cursor-pointer ${
                                isSystemToday 
                                  ? 'bg-slate-50 border-2 border-emerald-500/80' 
                                  : dayEvts.length > 0 
                                  ? 'bg-white hover:bg-slate-50' 
                                  : 'bg-white hover:bg-slate-50/30'
                              }`}
                            >
                              {/* Day index and today circle badge */}
                              <div className="flex justify-between items-center w-full">
                                {isSystemToday ? (
                                  <span className="bg-emerald-600 text-white w-5 h-5 rounded-full flex items-center justify-center font-black text-[9px] font-mono shadow-xs">
                                    {d}
                                  </span>
                                ) : (
                                  <span className={`text-[10px] sm:text-xs font-bold font-mono ${dayEvts.length > 0 ? 'text-slate-900 font-extrabold' : 'text-slate-400'}`}>
                                    {d}
                                  </span>
                                )}
                                
                                {isSystemToday && (
                                  <span className="text-[8px] font-black text-emerald-800 uppercase bg-emerald-50 px-1 py-0.5 rounded-sm select-none tracking-widest hidden sm:inline">
                                    Today
                                  </span>
                                )}
                              </div>

                              {/* Small event list indicator bars */}
                              <div className="space-y-1 mt-1.5 w-full flex-grow flex flex-col justify-end">
                                {dayEvts.slice(0, 2).map((e) => (
                                  <div
                                    key={e.id}
                                    className={`px-1.5 py-0.5 rounded text-[8px] sm:text-[9.5px] font-black leading-tight border truncate w-full select-none ${getEventBadgeStyles(e.type)}`}
                                  >
                                    {e.title}
                                  </div>
                                ))}
                                {dayEvts.length > 2 && (
                                  <div className="text-[8px] text-slate-400 font-bold text-center italic mt-0.5">
                                    +{dayEvts.length - 2} more
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }

                        // 3. Padding days into next month to balance grid (6 rows of 7 days = 42 total slots)
                        const totalCells = cells.length;
                        const remainder = 42 - totalCells;
                        for (let n = 1; n <= remainder; n++) {
                          cells.push(
                            <div 
                              key={`next-${n}`} 
                              className="p-1.5 sm:p-2 bg-slate-100/40 text-slate-300 text-xs font-medium min-h-[64px] sm:min-h-[85px] text-right cursor-not-allowed select-none"
                            >
                              <span className="text-[10px] opacity-60 font-medium font-mono">{n}</span>
                            </div>
                          );
                        }

                        return cells;
                      })()}
                    </div>
                  </div>

                  {/* Day Detailed Activities Overlay Card (Google Context style) */}
                  {selectedDayEvents && (
                    <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-xl border border-slate-800 animate-slide-in relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1 text-left flex-grow">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-emerald-600 rounded-md text-[9px] font-black uppercase">
                            DIAGNOSTIC LOGS
                          </span>
                          <span className="text-xs font-bold text-slate-300 font-mono">
                            {MONTHS[currentMonth]} {selectedDayEvents.day}, {currentYear}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-amber-400 uppercase tracking-tight">
                          Occurrence roster:
                        </h4>
                        
                        <div className="space-y-3 mt-3 pt-2 border-t border-slate-800">
                          {selectedDayEvents.events.map((e) => (
                            <div key={e.id} className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: getEventBgPillColor(e.type) }} />
                                <span className="text-xs font-extrabold text-slate-100">{e.title}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase border border-slate-800 px-1.5 rounded bg-slate-950">
                                  {e.type}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 leading-relaxed font-sans pl-4.5">
                                {e.desc}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedDayEvents(null)}
                        className="bg-slate-800 hover:bg-slate-700 font-extrabold text-[11px] text-slate-300 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer border border-slate-700 flex-shrink-0"
                      >
                        Dismiss detail
                      </button>
                    </div>
                  )}

                  {/* Fallback general list of holidays in selected year & month for ease of copying or scrolling */}
                  <div className="space-y-2 text-left">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                      <Info className="w-4 h-4 text-emerald-600" /> Scheduled events this month
                    </h4>
                    
                    {(() => {
                      // Compile all events for that year and index month
                      const monthlyList = EVENT_DEFINITIONS.filter(e => {
                        if (e.year !== undefined && e.year !== currentYear) return false;
                        if (e.month !== currentMonth) return false;
                        return enabledCalendars[e.type];
                      });

                      if (monthlyList.length === 0) {
                        return (
                          <div className="p-4 bg-slate-50 border border-slate-205 rounded-2xl text-center text-xs text-slate-400 font-medium italic">
                            No special events or school activities matching configuration listed for {MONTHS[currentMonth]} {currentYear}.
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {monthlyList.map((e) => (
                            <div 
                              key={e.id} 
                              onClick={() => setSelectedDayEvents({ day: e.day, events: [e] })}
                              className="p-3.5 bg-white border border-slate-150 rounded-2xl hover:border-slate-300 hover:shadow-2xs transition-all flex items-start gap-3 text-left cursor-pointer"
                            >
                              <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 font-bold text-slate-700 flex items-center justify-center font-mono text-xs flex-shrink-0 mt-0.5">
                                {e.day}
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h5 className="font-extrabold text-slate-900 text-xs leading-none">
                                    {e.title}
                                  </h5>
                                  <span className="text-[8px] font-black uppercase text-slate-400 bg-slate-50 border border-slate-100 px-1 py-0.5 rounded">
                                    {e.type}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-normal line-clamp-1">
                                  {e.desc}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Lightbox Modal for Photo Gallery */}
      {lightboxImage && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in animate-once transition-all">
          <div className="max-w-4xl w-full p-4 mx-4 flex flex-col justify-center items-center relative gap-4">
            
            {/* Top Bar with Dismiss Controls */}
            <div className="w-full flex justify-between items-center text-white pb-2 border-b border-white/10">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                {lightboxImage.category}
              </span>
              <button 
                onClick={() => setLightboxImage(null)}
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center cursor-pointer transition-all border border-white/10"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Main Picture Screen with Swipers */}
            <div className="w-full flex items-center justify-between relative min-h-[220px] sm:min-h-[440px]">
              
              {/* Tactile swiper left */}
              <button
                onClick={() => navigateLightbox('prev')}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 hover:scale-105 border border-white/10 hover:border-white/20 transition-all flex items-center justify-center text-white cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* The Image */}
              <div className="max-w-2xl w-full mx-4 overflow-hidden rounded-3xl border border-white/10 shadow-2xl flex items-center justify-center">
                <img 
                  src={lightboxImage.url} 
                  alt={lightboxImage.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-auto max-h-[70vh] object-cover"
                />
              </div>

              {/* Tactile swiper right */}
              <button
                onClick={() => navigateLightbox('next')}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 hover:scale-105 border border-white/10 hover:border-white/20 transition-all flex items-center justify-center text-white cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Bottom details card */}
            <div className="max-w-2xl w-full text-center text-white space-y-1.5 mt-2 bg-white/10 p-5 rounded-3xl border border-white/5 backdrop-blur-md">
              <h4 className="text-base sm:text-lg font-black tracking-tight text-amber-400 capitalize">
                {lightboxImage.title}
              </h4>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-sans font-light">
                {lightboxImage.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {showGuidelines && <GuidelinesComponent onClose={() => setShowGuidelines(false)} isPublic={true} />}

      {/* Footer */}
      <footer className="py-6 px-4 sm:px-12 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between text-center md:text-left gap-4 text-[9px] sm:text-[10px] text-slate-400 font-medium uppercase tracking-widest bg-white shadow-2xs">
        <div>&copy; 2026 {template.schoolName}. Delta State.</div>
        <div className="flex items-center gap-4 sm:gap-6 font-semibold">
          <span className="hover:text-emerald-600 transition-colors cursor-pointer">Academy Terms</span>
          <span className="hover:text-emerald-600 transition-colors cursor-pointer">Security Code</span>
          <span className="hover:text-emerald-600 transition-colors cursor-pointer">Infrastructure Support</span>
        </div>
        <div className="flex items-center gap-2 justify-center font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          General Status: Operations Live
        </div>
      </footer>
    </div>
  );
}
