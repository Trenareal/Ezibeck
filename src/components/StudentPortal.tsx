/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, GraduationCap, Search, BookOpen, Eye, EyeOff, Layers, Printer, Star, Wifi, WifiOff, CloudLightning, Clock, Lock } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Student, ClassName, Workspace15Template, DbStatus, AuditLogEntry, ALL_CLASSES } from '../types';
import { SCHOOL_INFO, calculateStudentStats, getLetterAndRemark, calculateSubjectTotal, BEHAVIOUR_TRAITS, generateUnique6DigitPassword, getStudentPasscodesFromOtherTerms, loadStoredStudents, saveStudents, isStudentInTerm, calculateClassPositions, formatOrdinal } from '../utils/academicUtils';
import { logPasscodeEvent } from '../utils/auditLogger';
import { isSupabaseConfigured, dbService, mapDbStudentToFrontend } from '../lib/supabase';
import schoolBadge from '../assets/images/school_badge_1781423327113.jpg';
import { ReportCardWatermark } from './ReportCardWatermark';
import { ReportCardPrintable } from './ReportCardPrintable';
import GuidelinesComponent from './GuidelinesComponent';
import { safeStorage } from '../utils/safeStorage';

const getOverallAverageForTerm = (studId: string | undefined | null, termKey: 'ezibeck_students_first_term' | 'ezibeck_students_second_term'): number | null => {
  try {
    if (!studId || typeof studId !== 'string') return null;
    const data = typeof window !== 'undefined' ? safeStorage.getItem(termKey) : null;
    if (!data) return null;
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return null;
    const baseId = studId.split('_')[0];
    const matchedStud = parsed.find((s: any) => s && s.id && typeof s.id === 'string' && s.id.split('_')[0] === baseId);
    if (!matchedStud || !Array.isArray(matchedStud.subjects) || matchedStud.subjects.length === 0) return null;
    const sum = matchedStud.subjects.reduce((acc: number, sub: any) => acc + (sub.testScore || 0) + (sub.examScore || 0), 0);
    return sum / matchedStud.subjects.length;
  } catch (e) {
    console.error(`Error calculating average for ${termKey}`, e);
    return null;
  }
};

interface StudentPortalProps {
  students: Student[];
  template: Workspace15Template;
  onBack: () => void;
  onUpdateStudents?: (updatedList: Student[]) => void;
  dbStatus?: DbStatus;
  onPushLocalToSupabase?: () => Promise<{ success: boolean; message: string }>;
  onPullFromSupabase?: () => Promise<{ success: boolean; message: string }>;
  onUpdateTemplate?: (updatedTpl: Workspace15Template) => void;
}

export default function StudentPortal({ 
  students, 
  template, 
  onBack, 
  onUpdateStudents,
  dbStatus,
  onPushLocalToSupabase,
  onPullFromSupabase,
  onUpdateTemplate
}: StudentPortalProps) {
  const [selectedClass, setSelectedClass] = useState<ClassName>('Pre-Nursery');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [viewTab, setViewTab] = useState<'report' | 'charts'>('report');
  
  // Student Lock Portal credentials
  const [passwordInput, setPasswordInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rollNotification, setRollNotification] = useState<string | null>(null);

  // Password reset via simulated OTP states
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmailInput, setResetEmailInput] = useState('');
  const [resetOtpCode, setResetOtpCode] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [resetStep, setResetStep] = useState<'request' | 'verify' | 'new_password'>('request');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [simulatedNotification, setSimulatedNotification] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newPassConfirm, setNewPassConfirm] = useState('');
  const [showGuidelines, setShowGuidelines] = useState(false);

  const [viewingTerm, setViewingTerm] = useState<'First Term' | 'Second Term' | 'Third Term'>(() => {
    if (template.currentTerm === 'First Term' || template.currentTerm === 'Second Term' || template.currentTerm === 'Third Term') {
      return template.currentTerm as 'First Term' | 'Second Term' | 'Third Term';
    }
    return 'First Term';
  });

  const [termStudents, setTermStudents] = useState<Student[]>(students);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    let active = true;
    async function fetchTermData() {
      if (viewingTerm === template.currentTerm) {
        setTermStudents(students);
        return;
      }
      setLoadingStudents(true);
      try {
        if (isSupabaseConfigured) {
          const rawStudents = await dbService.getStudents();
          if (active) {
            const mapped = (rawStudents || []).map(mapDbStudentToFrontend);
            const termFiltered = mapped.filter(s => isStudentInTerm(s.id, viewingTerm));
            if (termFiltered.length > 0) {
              setTermStudents(termFiltered);
            } else {
              setTermStudents(loadStoredStudents(viewingTerm));
            }
          }
        } else {
          if (active) {
            setTermStudents(loadStoredStudents(viewingTerm));
          }
        }
      } catch (err) {
        console.error("Failed to load students for term:", viewingTerm, err);
        if (active) {
          setTermStudents(loadStoredStudents(viewingTerm));
        }
      } finally {
        if (active) {
          setLoadingStudents(false);
        }
      }
    }

    fetchTermData();
    return () => {
      active = false;
    };
  }, [viewingTerm, students, template.currentTerm]);

  useEffect(() => {
    if (template.currentTerm === 'First Term' || template.currentTerm === 'Second Term' || template.currentTerm === 'Third Term') {
      setViewingTerm(template.currentTerm as 'First Term' | 'Second Term' | 'Third Term');
    }
  }, [template.currentTerm]);

  const updateLocalAndCloudStudents = async (updatedList: Student[]) => {
    setTermStudents(updatedList);
    saveStudents(updatedList, viewingTerm);
    if (viewingTerm === template.currentTerm && onUpdateStudents) {
      onUpdateStudents(updatedList);
    }
    if (isSupabaseConfigured && dbStatus?.connected) {
      try {
        await dbService.saveAllStudents(updatedList);
      } catch (err) {
        console.error("Failed to sync student updates to Supabase from Student Portal:", err);
      }
    }
  };

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Filter students by class and search query
  const filteredStudents = termStudents.filter(s => {
    const matchClass = s.className === selectedClass;
    const matchQuery = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       s.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchClass && matchQuery;
  });

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const downloadPdfDirect = async () => {
    if (isGeneratingPdf || !printAreaRef.current || !selectedStudent) return;
    setIsGeneratingPdf(true);

    const element = printAreaRef.current;
    
    // Store original scroll & style to safely restore in case of success or failure
    const originalStyle = element.getAttribute('style') || '';
    const originalScrollY = window.scrollY;
    
    // Find nested scroll wrappers so we can restore them fully
    const overflowElms = element.querySelectorAll('.overflow-x-auto');
    const originalOverflows: string[] = [];
    const originalWidths: string[] = [];
    overflowElms.forEach((el, idx) => {
      const htmlEl = el as HTMLElement;
      originalOverflows[idx] = htmlEl.style.overflowX || '';
      originalWidths[idx] = htmlEl.style.width || '';
    });

    const restoreStyles = () => {
      element.setAttribute('style', originalStyle);
      overflowElms.forEach((el, idx) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.overflowX = originalOverflows[idx];
        htmlEl.style.width = originalWidths[idx];
      });
      window.scrollTo(0, originalScrollY);
    };

    try {
      // Configure temporary desktop-optimized layout bounds to prevent text folding on mobile screens
      element.style.width = '1024px';
      element.style.minWidth = '1024px';
      element.style.maxWidth = '1024px';
      element.style.boxSizing = 'border-box';
      
      // Force nested tables to render fully visible in layout canvas
      overflowElms.forEach((el) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.overflowX = 'visible';
        htmlEl.style.width = '100%';
      });

      // Generate razor sharp canvas ignoring active window scrolls
      const canvas = await html2canvas(element, {
        scale: 3.0, // High-DPI razor sharp scaling
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1024
      });
      
      restoreStyles();
      
      const imgData = canvas.toDataURL('image/png');
      
      // Fit comfortably in portrait A4 width (210mm) with 0.6mm margins on all sides (80% margin reduction)
      const maxPdfWidth = 208.8; // 210mm - 1.2mm margins (0.6mm on each side)
      const maxPdfHeight = 295.8; // 297mm - 1.2mm margins (0.6mm on each side)

      let drawWidth = maxPdfWidth;
      let drawHeight = (canvas.height * drawWidth) / canvas.width;

      // Proportional downscaling if height exceeds max printable height to compress everything into one page
      if (drawHeight > maxPdfHeight) {
        drawHeight = maxPdfHeight;
        drawWidth = (canvas.width * drawHeight) / canvas.height;
      }

      // Center the image horizontally and vertically
      const xMargin = (210 - drawWidth) / 2;
      const yMargin = (297 - drawHeight) / 2;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      pdf.addImage(imgData, 'PNG', xMargin, yMargin, drawWidth, drawHeight, undefined, 'NONE');
      
      const filename = `${template.schoolName.replace(/\s+/g, '_')}_Report_Sheet_${selectedStudent.id}_${selectedStudent.name.replace(/\s+/g, '_')}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error('Direct PDF Generation Error:', err);
      
      // Fallback style restoration
      restoreStyles();
      
      // Trigger native printing directly
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Synchronize student selection with browser history
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.view === 'student') {
        const studentId = event.state.studentId;
        if (studentId) {
          const found = termStudents.find(s => s.id === studentId);
          if (found) {
            setSelectedStudent(found);
            setIsUnlocked(false);
            setPasswordInput('');
            setLoginError('');
            return;
          }
        }
        setSelectedStudent(null);
        setIsUnlocked(false);
        setPasswordInput('');
        setLoginError('');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [termStudents]);

  const handleSelectStudent = (stud: Student) => {
    if (typeof window !== 'undefined') {
      try {
        if (window.history) {
          const curState = window.history.state;
          if (!curState || curState.studentId !== stud.id || curState.view !== 'student') {
            window.history.pushState({ view: 'student', studentId: stud.id }, '');
          }
        }
      } catch (e) {
        console.warn('History pushState blocked:', e);
      }
    }
    setSelectedStudent(stud);
    setIsUnlocked(false);
    setPasswordInput('');
    setLoginError('');
    setShowResetForm(false);
    setResetEmailInput('');
    setResetOtpCode('');
    setOtpInput('');
    setResetStep('request');
    setResetError('');
    setResetSuccess('');
    setSimulatedNotification('');
  };

  const handleDeselectStudent = () => {
    setRollNotification(null);
    let hasState = false;
    try {
      if (typeof window !== 'undefined' && window.history && window.history.state && window.history.state.studentId) {
        hasState = true;
        window.history.back();
      }
    } catch (e) {
      console.warn('History back failed or blocked:', e);
    }
    if (!hasState) {
      setSelectedStudent(null);
      setIsUnlocked(false);
      setPasswordInput('');
      setLoginError('');
    }
  };

  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    
    const requiredPassword = selectedStudent.password || '123456';
    if (passwordInput === requiredPassword) {
      const currentUses = (selectedStudent.passwordUseCount || 0) + 1;
      const updatedStudent = { ...selectedStudent, passwordUseCount: currentUses };
      let rollMsg = "";
      
      if (currentUses >= 5) {
        const newPasscode = generateUnique6DigitPassword(selectedStudent.name, selectedStudent.id);
        updatedStudent.password = newPasscode;
        updatedStudent.passwordUseCount = 0;
        updatedStudent.passwordRolledOver = true;
        rollMsg = `🔒 ROLLOVER SECURITY NOTICE: This password has been verified successfully 5 times and is now expired. For maximum account security, a fresh 6-digit passcode has been automatically generated. For security reasons, you have been temporarily logged in, but you will not be able to use your previous password again. Please contact your class teacher or a school administrator to retrieve your new, freshly-generated 6-digit passcode for future logins!`;
        
        logPasscodeEvent({
          studentId: selectedStudent.id,
          studentName: selectedStudent.name,
          studentClass: selectedStudent.className,
          action: 'Rollover',
          performedBy: 'System Auto-Rollover',
          oldPasscode: requiredPassword,
          newPasscode: newPasscode
        });
      }
      
      const updatedList = termStudents.map(s => s.id === selectedStudent.id ? updatedStudent : s);
      updateLocalAndCloudStudents(updatedList);
      
      setSelectedStudent(updatedStudent);
      setIsUnlocked(true);
      setLoginError('');
      if (rollMsg) {
        setRollNotification(rollMsg);
      } else {
        setRollNotification(null);
      }
    } else {
      setLoginError('Invalid Student Password Code. Please try again!');
    }
  };

  const handleSendResetOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    
    const hostDomain = template.email.includes('@') ? template.email.split('@')[1] : 'ezibeckcollege.edu';
    const expectedEmail = selectedStudent.name.toLowerCase().replace(/\s+/g, '') + "@" + hostDomain;
    if (resetEmailInput.trim().toLowerCase() !== expectedEmail) {
      setResetError(`Incorrect email address. For this student, please enter: ${expectedEmail}`);
      return;
    }

    setResetError('');
    // Generate a secure 6-digit numeric OTP code
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    setResetOtpCode(generatedCode);
    setResetStep('verify');
    setSimulatedNotification(`💌 STU-OTP Code to Email ${expectedEmail}: ${generatedCode}`);
    setResetSuccess(`A secure OTP passcode has been sent to your registered email: ${expectedEmail}`);
  };

  const handleVerifyResetOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput === resetOtpCode) {
      setResetStep('new_password');
      setResetError('');
      setResetSuccess('OTP Verified successfully! Please input your new password.');
    } else {
      setResetError('The OTP passcode entered does not match our records. Please try again.');
    }
  };

  const handleConfirmNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    if (newPass.length < 4) {
      setResetError('Password must be at least 4 characters long.');
      return;
    }
    if (newPass !== newPassConfirm) {
      setResetError('Passwords do not match. Please confirm.');
      return;
    }

    const otherPasscodes = getStudentPasscodesFromOtherTerms(selectedStudent.id);
    if (otherPasscodes.includes(newPass)) {
      setResetError('For security reasons, your passcode cannot be the same as your passcode in other academic terms. Please choose a completely different passcode.');
      return;
    }

    const oldPass = selectedStudent.password || '123455';
    const updatedList = termStudents.map(s => {
      if (s.id === selectedStudent.id) {
        return { ...s, password: newPass };
      }
      return s;
    });
    updateLocalAndCloudStudents(updatedList);
    // Also update selectedStudent state to keep it synchronized!
    setSelectedStudent({ ...selectedStudent, password: newPass });

    // Log event
    logPasscodeEvent({
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      studentClass: selectedStudent.className,
      action: 'Self Reset',
      performedBy: 'Student Portal Self-Reset',
      oldPasscode: oldPass,
      newPasscode: newPass
    });

    setResetSuccess('Password updated successfully! You can now log in using your new password.');
    setNewPass('');
    setNewPassConfirm('');
    setResetStep('request');
    setShowResetForm(false);
    setSimulatedNotification('');
  };

  if (template.portalLocked) {
    return (
      <div className="bg-slate-100 min-h-screen py-12 px-4 sm:px-6 lg:px-8 font-sans flex items-center justify-center">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-xl animate-fade-in relative overflow-hidden">
          {/* Accent decoration */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 to-rose-600"></div>
          
          <button
            onClick={onBack}
            className="absolute top-4 left-4 flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>

          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100 shadow-3xs text-red-650 animate-pulse mt-4">
            <Lock className="w-8 h-8" />
          </div>
          
          <h2 className="text-xl font-black text-slate-900 tracking-tight mb-2 uppercase">Access Restricted</h2>
          <p className="text-sm text-slate-650 font-extrabold leading-relaxed mb-6">
            Result are not yet ready try again later
          </p>
          
          <div className="pt-2">
            <button
              onClick={onBack}
              className="w-full bg-slate-900 hover:bg-slate-950 text-white font-extrabold text-[11px] tracking-widest uppercase py-3.5 rounded-xl transition-all cursor-pointer shadow-md"
            >
              Back to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/70 min-h-screen py-10 px-4 sm:px-6 lg:px-8 font-sans print:bg-white print:py-0 print:px-0">
      
      {/* Search Selection Header Card (hidden during print) */}
      <div className="max-w-4xl mx-auto mb-8 print:hidden">
        <div className="flex items-center justify-between gap-4 mb-5">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-emerald-705 transition-all uppercase tracking-wider cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to School Homepage
          </button>
          
          <button
            onClick={() => setShowGuidelines(true)}
            className="flex items-center gap-1.5 bg-sky-50 border border-sky-100 text-sky-850 hover:bg-sky-100/80 transition-all px-3 py-1.5 rounded-full text-[10px] font-black uppercase cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" /> Portal Guidebook
          </button>
        </div>

         {/* Terminal Sessions Directory inside Student Portal */}
        <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 mb-6 shadow-md overflow-hidden relative select-none">
          <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-emerald-800 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
          <div className="absolute -left-10 -top-10 w-24 h-24 bg-amber-500 rounded-full blur-3xl opacity-10 pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-amber-300 text-slate-950 font-black text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-md">
                  Terminal Sessions Directory
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-405 animate-pulse"></span>
                <span className="text-[10px] text-emerald-250 font-bold uppercase tracking-wider font-mono">Student Access Portal</span>
              </div>
              <h3 className="text-sm font-black tracking-tight flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-300" />
                Active Scorecard Folder: <span className="text-amber-300 underline decoration-amber-300/40 decoration-2 underline-offset-4">{viewingTerm}</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-medium max-w-lg leading-relaxed">
                Choose an academic term slot to view the recorded candidate report profile, total grade logs and term averages.
              </p>
            </div>
            
            {/* 3 Segmented Session Toggles */}
            <div className="w-full md:w-auto bg-slate-850 border border-slate-700/80 p-1 rounded-2xl flex gap-1 font-bold text-[11px]">
              {(['First Term', 'Second Term', 'Third Term'] as const)
                .filter((term) => term === template.currentTerm)
                .map((term) => (
                  <button
                    key={term}
                    onClick={() => {
                      setViewingTerm(term);
                      setSelectedStudent(null);
                      setIsUnlocked(false);
                      setPasswordInput('');
                      setLoginError('');
                    }}
                    className={`flex-1 md:flex-none uppercase tracking-wider text-[9px] font-extrabold py-2.5 px-4 rounded-xl transition-all cursor-pointer ${
                      viewingTerm === term
                        ? 'bg-amber-305 text-slate-900 shadow-md font-black scale-[1.01]'
                        : 'text-slate-350 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {term}
                  </button>
                ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 sm:p-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl shadow-xs">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="max-w-[calc(100%-60px)]">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight uppercase truncate">{template.schoolName}</h2>
                  {dbStatus && (
                    <span className={`px-2 py-0.5 rounded-full border text-[9px] font-extrabold uppercase flex items-center gap-1 ${
                      !dbStatus.configured 
                        ? 'bg-amber-50 border-amber-200 text-amber-800' 
                        : dbStatus.connected 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-805' 
                        : 'bg-rose-50 border-rose-250 text-rose-800'
                    }`}>
                      {!dbStatus.configured ? (
                        <>
                          <WifiOff className="w-3 h-3 text-amber-500" />
                          Local Mode
                        </>
                      ) : dbStatus.connected ? (
                        <>
                          <Wifi className="w-3 h-3 text-emerald-500 animate-pulse" />
                          Live Connected
                        </>
                      ) : (
                        <>
                          <CloudLightning className="w-3 h-3 text-rose-500 animate-pulse" />
                          Sync Blocked
                        </>
                      )}
                    </span>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-1">Select class and choose student ID to unlock secure report sheet</p>
              </div>
            </div>
            
            {/* Class Tabs Selector */}
            <div className="flex flex-wrap gap-1.5 bg-slate-50 p-2 rounded-2xl border border-slate-100/80 w-full justify-start">
              {ALL_CLASSES.map(cls => (
                <button
                  key={cls}
                  onClick={() => {
                    setSelectedClass(cls);
                    setSearchQuery('');
                    setSelectedStudent(null);
                    setIsUnlocked(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${selectedClass === cls ? 'bg-emerald-700 text-white shadow-md shadow-emerald-100' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-4 relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search candidate ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 focus:border-emerald-500 focus:bg-white rounded-xl py-2.5 pl-10 pr-4 text-xs outline-none transition-all text-slate-705 font-bold shadow-xs"
              />
            </div>
            
            <div className="md:col-span-8 flex flex-wrap gap-2 items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-450">Roster candidate:</span>
              {filteredStudents.length === 0 ? (
                <span className="text-xs text-slate-400 italic font-medium">No candidate matches.</span>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {filteredStudents.map(stud => (
                    <button
                      key={stud.id}
                      onClick={() => handleSelectStudent(stud)}
                      className={`px-3.5 py-1.5 text-xs rounded-xl border font-bold transition-all cursor-pointer ${selectedStudent?.id === stud.id ? 'bg-emerald-50 border-emerald-250 text-emerald-700 scale-[1.01] shadow-xs' : 'bg-white hover:bg-slate-50 border-slate-100 text-slate-600 font-mono'}`}
                    >
                      {stud.id}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Student Report Display Container */}
      {!selectedStudent ? (
        <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-dashed border-slate-205 p-6 sm:p-16 text-center shadow-sm print:hidden">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-base font-extrabold text-slate-700 tracking-tight leading-none uppercase">No Student Report Sheet Selected</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed font-semibold">
            Please select a student registration card from the roster to unlock their terminal reports.
          </p>
        </div>
      ) : !isUnlocked ? (
        // Secure Password Form to decrypt Student Report Card
        <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-200 p-5 sm:p-8 shadow-xl text-center space-y-6 print:hidden animate-fade-in my-10">
          <div className="flex justify-center">
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-full">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 uppercase">Secure Portal Unlock</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Academic file of Student ID <strong className="text-emerald-650 font-mono">{selectedStudent.id}</strong> is encrypted. Please enter their student password to decrypt.
            </p>
          </div>

          <form onSubmit={handleVerifyPassword} className="space-y-4">
            <div className="text-left">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Student Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter password..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 pl-4 pr-10 text-xs font-bold outline-none transition-all shadow-3xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-2.5 leading-relaxed text-center">
                🔑 <strong>Forgot password?</strong> If you forget your password, please contact your class teacher to retrieve it.
              </p>
            </div>

            {loginError && (
              <p className="text-red-600 text-xs font-semibold bg-red-50 border border-red-100 rounded-lg p-2.5">
                {loginError}
              </p>
            )}

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={handleDeselectStudent}
                className="w-1/2 border hover:bg-slate-50 text-slate-500 font-bold text-xs py-3 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md shadow-emerald-100 cursor-pointer"
              >
                Unlock Report Card
              </button>
            </div>
          </form>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-left space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 block select-none">Demo Credentials Helper</span>
            <p className="text-[10px] text-slate-400 leading-normal">
              Candidate Student ID: <span className="font-mono font-bold text-slate-700">{selectedStudent.id}</span>
            </p>
            <p className="text-[10px] text-slate-400 leading-normal">
              Portal Passcode Key (6-digit): {selectedStudent.passwordRolledOver ? (
                <span className="text-red-650 font-bold bg-red-50 border border-red-105 px-1.5 py-0.5 rounded text-[10px]">🔒 Passcode Expired (Rolled over). Request the new passcode from Staff / Admin.</span>
              ) : (
                <>
                  <strong className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{selectedStudent.password || '123456'}</strong> <span className="text-[10px] text-slate-450 italic">({5 - (selectedStudent.passwordUseCount || 0)} uses remaining before rollover)</span>
                </>
              )}
            </p>
          </div>
        </div>
      ) : (
        // Decrypted View
        <div className="max-w-4xl mx-auto space-y-6">
          
          {rollNotification && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-3xl p-5 shadow-xs relative z-20 flex gap-3.5 items-start print:hidden">
              <span className="text-xl">⚠️</span>
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-800">Security Password Expiry & Rollover</h4>
                <p className="text-xs font-medium leading-relaxed">{rollNotification}</p>
                <p className="text-[10px] text-amber-700/80 font-bold italic">Note: Remember to note down this passcode! This alert will dismiss once you lock the session or navigate away.</p>
              </div>
            </div>
          )}
          
          {/* Sub menu inside student viewer (hidden during print) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-100 rounded-3xl p-4 sm:px-5 sm:py-4 print:hidden shadow-xs">
            <div className="flex flex-col xs:flex-row flex-wrap gap-2 animate-fade-in w-full sm:w-auto">
              <button
                onClick={() => setViewTab('report')}
                className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex-1 xs:flex-initial ${viewTab === 'report' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <Eye className="w-3.5 h-3.5" /> Official Report Card
              </button>
              <button
                onClick={() => setViewTab('charts')}
                className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex-1 xs:flex-initial ${viewTab === 'charts' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <Layers className="w-3.5 h-3.5" /> Performance Visualizer
              </button>
              <button
                onClick={() => {
                  setIsUnlocked(false);
                  setPasswordInput('');
                  setLoginError('');
                  setRollNotification(null);
                }}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-red-650 hover:bg-red-50 transition-all cursor-pointer border border-red-100/50 flex-1 xs:flex-initial"
              >
                🔒 Lock Session
              </button>
            </div>
            <button
              onClick={downloadPdfDirect}
              disabled={isGeneratingPdf}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-5 py-3 sm:py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer w-full sm:w-auto"
            >
              {isGeneratingPdf ? (
                <>
                  <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-once"></span>
                  Saving PDF...
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4" /> Download / Print PDF
                </>
              )}
            </button>
          </div>

          {/* Academic Stats Calculations */}
          {(() => {
            const stats = calculateStudentStats(selectedStudent);
            
            // Parse first term and second term students once
            let firstTermStuds: Student[] = [];
            try {
              const firstTermData = typeof window !== 'undefined' ? safeStorage.getItem('ezibeck_students_first_term') : null;
              if (firstTermData) {
                const parsed = JSON.parse(firstTermData);
                if (Array.isArray(parsed)) {
                  firstTermStuds = parsed;
                }
              }
            } catch (e) {
              console.error("Error parsing first term students in StudentPortal", e);
            }

            let secondTermStuds: Student[] = [];
            try {
              const secondTermData = typeof window !== 'undefined' ? safeStorage.getItem('ezibeck_students_second_term') : null;
              if (secondTermData) {
                const parsed = JSON.parse(secondTermData);
                if (Array.isArray(parsed)) {
                  secondTermStuds = parsed;
                }
              }
            } catch (e) {
              console.error("Error parsing second term students in StudentPortal", e);
            }
            const cleanClassName = selectedStudent.className.replace(/\s+/g, '');
            const isSecondaryClass = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2A', 'SS2B', 'SS3A', 'SS3B'].includes(cleanClassName);

            if (viewTab === 'charts') {
              return (
                <div className="bg-white rounded-3xl border border-slate-100 p-8 space-y-8 print:hidden shadow-sm animate-fade-in">
                  <div>
                    <h3 className="text-slate-900 font-extrabold text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-emerald-700" /> Academic Performance Chart — {selectedStudent.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Graphical breakdown of subject score aggregates (Total 100 points per subject, split into 30% Test and 70% Exam)</p>
                    
                    <div className="space-y-5 pt-6">
                      {selectedStudent.subjects.map(subj => {
                        const tot = calculateSubjectTotal(subj);
                        const { letter } = getLetterAndRemark(tot);
                        let barColor = 'bg-emerald-700';
                        if (tot >= 80) barColor = 'bg-emerald-600';
                        else if (tot >= 70) barColor = 'bg-green-600';
                        else if (tot >= 60) barColor = 'bg-emerald-500';
                        else if (tot >= 50) barColor = 'bg-amber-500';
                        else barColor = 'bg-red-500';

                        return (
                          <div key={subj.id} className="space-y-1.5 font-sans animate-fade-in">
                            <div className="flex justify-between text-xs font-bold leading-none">
                              <span className="text-slate-700 font-bold">{subj.name}</span>
                              <span className="text-slate-900">{tot}/100 ({letter})</span>
                            </div>
                            <div className="w-full bg-slate-50 border border-slate-100/70 rounded-full h-2.5 flex overflow-hidden p-[1px] shadow-xs">
                              <div 
                                className={`${barColor} rounded-l-full h-full`} 
                                style={{ width: `${subj.testScore / 100 * 105}%` }}
                                title={`Test score: ${subj.testScore}`}
                              />
                              <div 
                                className={`${barColor} opacity-80 rounded-r-full h-full`} 
                                style={{ width: `${subj.examScore / 100 * 105}%` }}
                                title={`Exam score: ${subj.examScore}`}
                              />
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-400 font-bold tracking-tight">
                              <span>Test Module: {subj.testScore}/30</span>
                              <span>Terminal Exam: {subj.examScore}/70</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-slate-900 font-extrabold text-sm border-b pb-2 flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-500" /> Behavioral Quality Profile
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Conduct evaluation ratings mapped against standards 1 to 5 (5 is Excellent, 1 is Poor)</p>
                    
                    {(() => {
                      const isKgClass = selectedStudent.className === 'Pre-Nursery' || selectedStudent.className.startsWith('Nursery');
                      if (isKgClass) {
                        const behaviouralList = selectedStudent.behaviour.filter(b => 
                          ["Punctuality", "Neatness", "Assignment", "Concentration"].includes(b.name)
                        );
                        const skillList = selectedStudent.behaviour.filter(b => 
                          ["Hand-writing", "Fluency", "Attitude to Property"].includes(b.name)
                        );
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                            <div className="space-y-3.5">
                              <h4 className="text-xs font-extrabold text-[#047857] uppercase tracking-wider">Behavioural Ratings</h4>
                              <div className="space-y-2">
                                {behaviouralList.length === 0 ? (
                                  <p className="text-[11px] text-slate-400 italic">No ratings</p>
                                ) : behaviouralList.map(b => (
                                  <div key={b.name} className="bg-slate-50 border p-3 rounded-xl flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700">{b.name}</span>
                                    <div className="flex gap-1">
                                      {[1, 2, 3, 4, 5].map(step => (
                                        <Star 
                                          key={step} 
                                          className={`w-4 h-4 ${step <= b.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
                                        />
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-3.5">
                              <h4 className="text-xs font-extrabold text-[#047857] uppercase tracking-wider">Skill Ratings</h4>
                              <div className="space-y-2">
                                {skillList.length === 0 ? (
                                  <p className="text-[11px] text-slate-400 italic">No ratings</p>
                                ) : skillList.map(b => (
                                  <div key={b.name} className="bg-slate-50 border p-3 rounded-xl flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700">{b.name}</span>
                                    <div className="flex gap-1">
                                      {[1, 2, 3, 4, 5].map(step => (
                                        <Star 
                                          key={step} 
                                          className={`w-4 h-4 ${step <= b.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
                                        />
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
                            {selectedStudent.behaviour.map(b => (
                              <div key={b.name} className="bg-slate-50 border p-3 rounded-xl flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700">{b.name}</span>
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map(step => (
                                    <Star 
                                      key={step} 
                                      className={`w-4 h-4 ${step <= b.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
                                    />
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              );
            }            // Otherwise, render full standard report sheet card (printable)
            return (
              <>
                <ReportCardPrintable 
                  ref={printAreaRef}
                  student={selectedStudent}
                  term={viewingTerm}
                  template={template}
                  studentsRoster={students}
                  isGeneratingPdf={isGeneratingPdf}
                />
                <div className="hidden print:hidden">
                {/* Diagonal tiled watermark background */}
                <ReportCardWatermark />

                {/* Print layout decorator line */}
                <div className="absolute inset-1.5 xs:inset-3 border border-slate-100 rounded-2xl pointer-events-none print:hidden"></div>

                {/* Ezibeck Style Header Breadcrumbs */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] font-medium text-slate-400 border-b border-slate-100/70 pb-3 mb-2 relative z-10 select-none">
                  <span className="hover:text-slate-600 transition-colors cursor-pointer">🏫 {template.schoolName}</span>
                  <span>/</span>
                  <span className="hover:text-slate-600 transition-colors cursor-pointer">📁 Report Registry</span>
                  <span>/</span>
                  <span className="hover:text-slate-600 transition-colors cursor-pointer">👥 {selectedStudent.className}</span>
                  <span>/</span>
                  <span className="text-slate-700 font-semibold">📄 {selectedStudent.name}</span>
                </div>

                {/* School Header Section with centered text and badge on the left */}
                <div className="relative flex flex-col sm:flex-row items-center sm:justify-center border-b border-slate-200/60 pb-6 mb-6 mt-4 select-none">
                  {/* School Badge on the left side */}
                  <div className="sm:absolute sm:left-0 flex-shrink-0 mb-4 sm:mb-0">
                    <div className="w-16 h-16 sm:w-24 sm:h-24 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden">
                      <img 
                        src={schoolBadge} 
                        alt={`${template.schoolName} Emblem`} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                  {/* Centered header details */}
                  <div className="text-center space-y-2 max-w-2xl">
                    <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none uppercase">
                      {template.schoolName}
                    </h1>
                    <p className="text-[10px] sm:text-[11.5px] uppercase tracking-wider text-emerald-700 font-extrabold flex items-center justify-center gap-1.5 select-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      Motto: {template.motto}
                    </p>
                    <p className="text-slate-500 text-[10px] sm:text-[11px] leading-relaxed">
                      <strong>Registered Address:</strong> {template.address} | <strong>Email:</strong> {template.email} | <strong>Phone:</strong> {template.phone}
                    </p>
                  </div>
                </div>

                {/* Dynamic Official Page Heading */}
                <div className="relative z-10 py-2">
                  <h2 className="text-xs sm:text-base font-extrabold text-slate-900 tracking-tight leading-tight uppercase flex flex-col xs:flex-row xs:items-center gap-2">
                    <span className="inline-block px-2.5 py-1 bg-slate-900 text-slate-100 text-[9px] sm:text-[10px] font-black rounded-md tracking-wider w-max">OFFICIAL STATUS</span>
                    STUDENT’S TERMLY REPORT SHEET FOR {selectedStudent.className.startsWith('JSS') ? 'JUNIOR' : 'SENIOR'} SECONDARY SCHOOL
                  </h2>
                </div>

                {/* Database Properties Box: Student Info */}
                <div className="relative z-10 border border-slate-200/80 rounded-2xl bg-[#FCFCFC]/80 divide-y divide-slate-100 shadow-3xs">
                  <div className="bg-[#FAF9F9] px-4 py-2 text-[9px] sm:text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 select-none">
                    <span>📋 Student Properties Collection View</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-3.5 gap-x-6 p-4 sm:p-5 text-[11px] sm:text-xs text-slate-700">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 gap-2">
                      <span className="font-semibold text-slate-400 select-none flex items-center gap-1.5 flex-shrink-0">
                        <span>📝</span> Student Name
                      </span>
                      <span className="font-extrabold text-slate-900 text-right truncate max-w-[60%]">{selectedStudent.name}</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 gap-2">
                      <span className="font-semibold text-slate-400 select-none flex items-center gap-1.5 flex-shrink-0">
                        <span>🔑</span> Student ID
                      </span>
                      <span className="font-mono font-bold text-emerald-700 text-right">{selectedStudent.id}</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 gap-2">
                      <span className="font-semibold text-slate-400 select-none flex items-center gap-1.5 flex-shrink-0">
                        <span>🏫</span> Class
                      </span>
                      <span className="font-extrabold text-slate-900 text-right">{selectedStudent.className}</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-200/40 pb-1.5 sm:border-0 sm:pb-0 gap-2">
                      <span className="font-semibold text-slate-400 select-none flex items-center gap-1.5 flex-shrink-0">
                        <span>🧬</span> Sex / Gender
                      </span>
                      <span className="font-bold text-slate-800 text-right">{selectedStudent.sex}</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-200/40 pb-1.5 sm:border-0 sm:pb-0 gap-2">
                      <span className="font-semibold text-slate-400 select-none flex items-center gap-1.5 flex-shrink-0">
                        <span>🎂</span> Age Profile
                      </span>
                      <span className="font-bold text-slate-800 text-right">{selectedStudent.age} Years</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-200/40 pb-1.5 sm:border-0 sm:pb-0 gap-2">
                      <span className="font-semibold text-slate-400 select-none flex items-center gap-1.5 flex-shrink-0">
                        <span>📅</span> Report Date
                      </span>
                      <span className="font-bold text-slate-800 text-right">{template.termDate}</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-200/40 pb-1.5 lg:border-0 lg:pb-0 gap-2">
                      <span className="font-semibold text-slate-400 select-none flex items-center gap-1.5 flex-shrink-0">
                        <span>🗓️</span> Academic Session
                      </span>
                      <span className="font-extrabold text-slate-900 text-right">{template.session}</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-200/40 pb-1.5 lg:border-0 lg:pb-0 gap-2">
                      <span className="font-semibold text-slate-400 select-none flex items-center gap-1.5 flex-shrink-0">
                        <span>🚌</span> Attendance
                      </span>
                      <span className="font-bold text-slate-800 text-right">{selectedStudent.attendancePresent} / {selectedStudent.attendanceTotal} sessions</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-200/40 pb-1.5 lg:border-0 lg:pb-0 gap-2">
                      <span className="font-semibold text-slate-400 select-none flex items-center gap-1.5 flex-shrink-0">
                        <span>🔄</span> Resumption Date
                      </span>
                      <span className="font-extrabold text-emerald-700 text-right">{template.resumptionDate}</span>
                    </div>

                    {(() => {
                      const parseNum = (v: string): number => {
                        const cln = v.replace(/[^\d.]/g, '');
                        const parsed = parseFloat(cln);
                        return isNaN(parsed) ? 0 : parsed;
                      };
                      
                      const cls = selectedStudent.className || '';
                      let sFee = template.schoolFee || '₦100,000.00';
                      let pFee = template.partyFee || '₦15,000.00';
                      let eFee = template.enrollmentFee || '₦15,000.00';
                      let bFee = template.bookFee || '₦20,000.00';
                      
                      if (cls === 'Pre-Nursery' || cls === 'Nursery 1' || cls === 'Nursery 2' || cls === 'Nursery 3') {
                        sFee = template.schoolFeeNursery || sFee;
                        pFee = template.partyFeeNursery || pFee;
                        eFee = template.enrollmentFeeNursery || eFee;
                        bFee = template.bookFeeNursery || bFee;
                      } else if (cls.startsWith('Basic')) {
                        sFee = template.schoolFeePrimary || sFee;
                        pFee = template.partyFeePrimary || pFee;
                        eFee = template.enrollmentFeePrimary || eFee;
                        bFee = template.bookFeePrimary || bFee;
                      } else if (cls.startsWith('JSS')) {
                        sFee = template.schoolFeeJunior || sFee;
                        pFee = template.partyFeeJunior || pFee;
                        eFee = template.enrollmentFeeJunior || eFee;
                        bFee = template.bookFeeJunior || bFee;
                      } else if (cls.startsWith('SS')) {
                        sFee = template.schoolFeeSenior || sFee;
                        pFee = template.partyFeeSenior || pFee;
                        eFee = template.enrollmentFeeSenior || eFee;
                        bFee = template.bookFeeSenior || bFee;
                      }

                      const totalVal = parseNum(sFee) + parseNum(pFee) + parseNum(eFee) + parseNum(bFee);
                      const totalFormatted = `₦${totalVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

                      return (
                        <div className="space-y-1 border-t border-slate-200/40 pt-2 lg:border-0 lg:pt-0 w-full">
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-1">Itemized Fees Breakdown ({cls})</span>
                          <div className="flex justify-between text-[11px] gap-2 lg:gap-8">
                            <span className="font-semibold text-slate-400">School Fees</span>
                            <span className="font-bold text-slate-700 text-right">{sFee}</span>
                          </div>
                          <div className="flex justify-between text-[11px] gap-2 lg:gap-8">
                            <span className="font-semibold text-slate-400">Party Fee</span>
                            <span className="font-bold text-slate-700 text-right">{pFee}</span>
                          </div>
                          <div className="flex justify-between text-[11px] gap-2 lg:gap-8">
                            <span className="font-semibold text-slate-400">Enrollment Fee</span>
                            <span className="font-bold text-slate-700 text-right">{eFee}</span>
                          </div>
                          <div className="flex justify-between text-[11px] gap-2 lg:gap-8">
                            <span className="font-semibold text-slate-400">Book Fees</span>
                            <span className="font-bold text-slate-700 text-right">{bFee}</span>
                          </div>
                          <div className="flex justify-between border-t border-dashed border-emerald-300 pt-1 text-xs">
                            <span className="font-extrabold text-emerald-800">Total fees</span>
                            <span className="font-black text-emerald-850 font-mono text-right">{totalFormatted}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Part A: Academic Course Evaluation */}
                <div className="relative z-10 space-y-4">
                  <h3 className="text-slate-900 font-extrabold text-xs uppercase tracking-widest border-l-4 border-slate-900 pl-2.5 pb-0.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 select-none">
                    <span>Part A: Academic Course Evaluation</span>
                    <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 animate-pulse sm:animate-none">
                      <span className="sm:hidden">Swipe table left/right ↔️</span>
                      <span className="hidden sm:inline text-slate-400 font-normal">Standard Formula Matrix Layout</span>
                    </span>
                  </h3>
                  
                  {/* Ezibeck-style database table */}
                  <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-3xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        {/* Header columns styled like raw Ezibeck headers */}
                        <tr className="bg-[#EAEAEA] border-b border-slate-300 text-slate-950 font-black select-none text-[10.5px] uppercase tracking-wider">
                          <th className="py-2.5 px-3 border-r border-slate-300 min-w-[150px]">
                            <span className="flex items-center gap-1.5">📝 Subjects</span>
                          </th>
                          <th className="py-2.5 px-3 border-r border-slate-300 text-center w-24">
                            <span className="flex items-center justify-center gap-1"># TEST (30)</span>
                          </th>
                          <th className="py-2.5 px-3 border-r border-slate-300 text-center w-24">
                            <span className="flex items-center justify-center gap-1"># EXAM (70)</span>
                          </th>
                          <th className="py-2.5 px-3 border-r border-slate-300 text-center bg-emerald-100/40 w-24">
                            <span className="flex items-center justify-center gap-1 text-emerald-950">Σ TERM (100)</span>
                          </th>
                          {viewingTerm === 'Second Term' && isSecondaryClass && (
                            <th className="py-2.5 px-3 border-r border-slate-300 text-center text-[10px] w-24">
                              <span className="flex items-center justify-center gap-1">1st Term Avg</span>
                            </th>
                          )}
                          {viewingTerm === 'Third Term' && (
                            <>
                              <th className="py-2.5 px-3 border-r border-slate-300 text-center text-[10px] w-20">
                                <span className="flex items-center justify-center gap-1"># 1ST TERM (20)</span>
                              </th>
                              <th className="py-2.5 px-3 border-r border-slate-300 text-center text-[10px] w-20">
                                <span className="flex items-center justify-center gap-1"># 2ND TERM (20)</span>
                              </th>
                              <th className="py-2.5 px-3 border-r border-slate-300 text-center text-[10px] w-20">
                                <span className="flex items-center justify-center gap-1"># 3RD TERM (60)</span>
                              </th>
                              <th className="py-2.5 px-3 border-r border-slate-300 text-center bg-emerald-100/30 w-28 text-slate-955 font-black">
                                <span className="flex items-center justify-center gap-1 text-slate-955 font-black">Σ SESSION AVE</span>
                              </th>
                            </>
                          )}
                          <th className="py-2.5 px-3 border-r border-slate-300 text-center w-20">
                            <span className="flex items-center justify-center gap-1">Σ GRADE</span>
                          </th>
                          <th className="py-2.5 px-3 border-r border-slate-300 text-center w-16">
                            <span className="flex items-center justify-center gap-1"># POSITION</span>
                          </th>
                          <th className="py-2.5 px-4 font-black text-slate-950">
                            <span className="flex items-center gap-1.5">💬 TEACHER'S REMARK</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-705">
                        {selectedStudent.subjects.map(subj => {
                          const tot = calculateSubjectTotal(subj);
                          
                          // Formulate annual / session average data realistically matching the 20/20/60 formula of Ezibeck
                          const firstTerm = subj.firstTermSummary !== undefined && subj.firstTermSummary !== 0 ? subj.firstTermSummary : Math.round(tot * 0.2);
                          const secondTerm = subj.secondTermSummary !== undefined && subj.secondTermSummary !== 0 ? subj.secondTermSummary : Math.round(tot * 0.2);
                          const thirdTerm = subj.thirdTermSummary !== undefined && subj.thirdTermSummary !== 0 ? subj.thirdTermSummary : Math.round(tot * 0.6);
                          const sessionAvg = firstTerm + secondTerm + thirdTerm;

                          // Find matching first term subject score if in 2nd term
                          let firstTermAvgStr = "-";
                          if (viewingTerm === 'Second Term') {
                            if (subj.firstTermSummary !== undefined && subj.firstTermSummary !== 0) {
                              firstTermAvgStr = String(subj.firstTermSummary);
                            } else {
                              const baseId = selectedStudent.id.split('_')[0];
                              const matchMatch = firstTermStuds.find(s => s.id.startsWith(baseId));
                              const matchSubj = matchMatch?.subjects.find(s => s.name.toLowerCase() === subj.name.toLowerCase());
                              if (matchSubj) {
                                firstTermAvgStr = String((matchSubj.testScore || 0) + (matchSubj.examScore || 0));
                              }
                            }
                          }

                          const { letter, remark, ratingClass } = getLetterAndRemark(
                            viewingTerm === 'Third Term' ? sessionAvg : tot
                          );

                          return (
                            <tr key={subj.id} className="hover:bg-slate-50/60 transition-all border-b border-slate-200">
                              <td className="py-2.5 px-3 border-r border-slate-200 font-extrabold text-slate-950 bg-slate-50/40">{subj.name}</td>
                              <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-bold text-slate-950">{subj.testScore}</td>
                              <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-bold text-slate-950">{subj.examScore}</td>
                              <td className="py-2.5 px-3 border-r border-slate-200 text-center font-black font-mono text-emerald-950 bg-emerald-50/30">{tot}</td>
                               {viewingTerm === 'Second Term' && isSecondaryClass && (
                                 <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-bold text-slate-950 bg-blue-50/10">
                                   {firstTermAvgStr !== "-" ? `${firstTermAvgStr}%` : "-"}
                                 </td>
                               )}
                              {viewingTerm === 'Third Term' && (
                                <>
                                  <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-bold text-slate-950">{firstTerm}</td>
                                  <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-bold text-slate-950">{secondTerm}</td>
                                  <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-bold text-slate-950">{thirdTerm}</td>
                                  <td className="py-2.5 px-3 border-r border-slate-200 text-center font-black font-mono text-emerald-950 bg-slate-50/60">{sessionAvg}</td>
                                </>
                              )}
                              <td className="py-2.5 px-3 border-r border-slate-200 text-center">
                                <span className={`px-2 py-0.5 text-[10px] font-black rounded-sm tracking-wider ${ratingClass}`}>
                                  {letter}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 border-r border-slate-200 text-center font-black text-slate-950 bg-slate-50/20">{subj.position ? `${subj.position}` : '-'}</td>
                              <td className="py-2.5 px-4 italic text-slate-950 text-[11px] font-bold leading-tight bg-[#FCFCFC]">{remark}</td>
                            </tr>
                          );
                        })}

                        {/* Calculation Footer styled exactly like Ezibeck database table calculation footer */}
                        <tr className="bg-[#FAF9F9]/90 border-t border-slate-200 text-slate-400 font-medium select-none text-[10px] uppercase tracking-wider divide-x divide-slate-100">
                          <td className="py-2 px-3 font-semibold text-slate-500">
                            Count: {selectedStudent.subjects.length}
                          </td>
                          <td className="py-2 px-3 text-center font-bold">
                            Average: {(() => {
                              const tCount = selectedStudent.subjects.length || 1;
                              const testSum = selectedStudent.subjects.reduce((sum, s) => sum + (s.testScore || 0), 0);
                              return (testSum / tCount).toFixed(1);
                            })()}
                          </td>
                          <td className="py-2 px-3 text-center font-bold">
                            Average: {(() => {
                              const tCount = selectedStudent.subjects.length || 1;
                              const examSum = selectedStudent.subjects.reduce((sum, s) => sum + (s.examScore || 0), 0);
                              return (examSum / tCount).toFixed(1);
                            })()}
                          </td>
                          <td className="py-2 px-3 text-center font-black text-emerald-705 bg-emerald-50/20">
                            Average: {stats.avgScore.toFixed(1)}%
                          </td>
                          {viewingTerm === 'Second Term' && (
                            <td className="py-2 px-3 text-center bg-slate-50/20 text-slate-400 font-bold">-</td>
                          )}
                          {viewingTerm === 'Third Term' && (
                            <>
                              <td className="py-2 px-3 text-center font-bold">
                                Average: {(() => {
                                  const tCount = selectedStudent.subjects.length || 1;
                                  const fSum = selectedStudent.subjects.reduce((sum, s) => {
                                    const tot = (s.testScore || 0) + (s.examScore || 0);
                                    const val = s.firstTermSummary !== undefined && s.firstTermSummary !== 0 ? s.firstTermSummary : Math.round(tot * 0.2);
                                    return sum + val;
                                  }, 0);
                                  return (fSum / tCount).toFixed(1);
                                })()}
                              </td>
                              <td className="py-2 px-3 text-center font-bold">
                                Average: {(() => {
                                  const tCount = selectedStudent.subjects.length || 1;
                                  const sSum = selectedStudent.subjects.reduce((sum, s) => {
                                    const tot = (s.testScore || 0) + (s.examScore || 0);
                                    const val = s.secondTermSummary !== undefined && s.secondTermSummary !== 0 ? s.secondTermSummary : Math.round(tot * 0.2);
                                    return sum + val;
                                  }, 0);
                                  return (sSum / tCount).toFixed(1);
                                })()}
                              </td>
                              <td className="py-2 px-3 text-center font-bold">
                                Average: {(() => {
                                  const tCount = selectedStudent.subjects.length || 1;
                                  const thSum = selectedStudent.subjects.reduce((sum, s) => {
                                    const tot = (s.testScore || 0) + (s.examScore || 0);
                                    const val = s.thirdTermSummary !== undefined && s.thirdTermSummary !== 0 ? s.thirdTermSummary : Math.round(tot * 0.6);
                                    return sum + val;
                                  }, 0);
                                  return (thSum / tCount).toFixed(1);
                                })()}
                              </td>
                              <td className="py-2 px-3 text-center font-black bg-slate-100/50">
                                Average: {(() => {
                                  const tCount = selectedStudent.subjects.length || 1;
                                  const sessionSum = selectedStudent.subjects.reduce((sum, s) => {
                                    const tot = (s.testScore || 0) + (s.examScore || 0);
                                    const f = s.firstTermSummary !== undefined && s.firstTermSummary !== 0 ? s.firstTermSummary : Math.round(tot * 0.2);
                                    const sec = s.secondTermSummary !== undefined && s.secondTermSummary !== 0 ? s.secondTermSummary : Math.round(tot * 0.2);
                                    const th = s.thirdTermSummary !== undefined && s.thirdTermSummary !== 0 ? s.thirdTermSummary : Math.round(tot * 0.6);
                                    return sum + (f + sec + th);
                                  }, 0);
                                  return (sessionSum / tCount).toFixed(1);
                                })()}%
                              </td>
                            </>
                          )}
                          <td className="py-2 px-3" colSpan={3}>
                            {/* Empty spacing for other columns */}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sub-Score KPI Dashboard metrics - optimized to single row with reduced size */}
                <div className="flex flex-wrap sm:flex-nowrap print:flex-nowrap gap-1.5 sm:gap-2 relative z-10 w-full select-none text-slate-800">
                  <div className="flex-1 min-w-[70px] bg-[#FAF9F9] border border-slate-150 py-1.5 px-1 sm:py-2 px-1.5 rounded-lg text-center space-y-0.5 shadow-3xs">
                    <span className="text-[7.5px] sm:text-[8.5px] font-black text-slate-400 uppercase tracking-widest block leading-none">Cumulative</span>
                    <p className="font-extrabold text-slate-900 text-[10.5px] sm:text-xs leading-none">
                      {stats.totalScore}<span className="text-[9px] text-slate-400 font-normal">/{stats.maxPossibleScore}</span>
                    </p>
                  </div>

                  <div className="flex-1 min-w-[70px] bg-[#FAF9F9] border border-slate-150 py-1.5 px-1 sm:py-2 px-1.5 rounded-lg text-center space-y-0.5 shadow-3xs">
                    <span className="text-[7.5px] sm:text-[8.5px] font-black text-slate-400 uppercase tracking-widest block leading-none">Termly Avg</span>
                    <p className="font-extrabold text-slate-900 text-[10.5px] sm:text-xs leading-none">
                      {stats.avgScore.toFixed(1)}%
                    </p>
                  </div>

                  {viewingTerm === 'Second Term' && (
                    <div className="flex-1 min-w-[70px] bg-[#FAF9F9] border border-slate-150 py-1.5 px-1 sm:py-2 px-1.5 rounded-lg text-center space-y-0.5 shadow-3xs">
                      <span className="text-[7.5px] sm:text-[8.5px] font-black text-slate-400 uppercase tracking-widest block leading-none">1st Term Avg</span>
                      <p className="font-extrabold text-slate-900 text-[10.5px] sm:text-xs leading-none">
                        {(() => {
                          const avg = getOverallAverageForTerm(selectedStudent.id, 'ezibeck_students_first_term');
                          return avg !== null ? `${avg.toFixed(1)}%` : "N/A";
                        })()}
                      </p>
                    </div>
                  )}

                  {viewingTerm === 'Third Term' && (
                    <>
                      <div className="flex-1 min-w-[70px] bg-[#FAF9F9] border border-slate-150 py-1.5 px-1 sm:py-2 px-1.5 rounded-lg text-center space-y-0.5 shadow-3xs">
                        <span className="text-[7.5px] sm:text-[8.5px] font-black text-slate-400 uppercase tracking-widest block leading-none">1st Term Avg</span>
                        <p className="font-extrabold text-slate-900 text-[10.5px] sm:text-xs leading-none">
                          {(() => {
                            const avg = getOverallAverageForTerm(selectedStudent.id, 'ezibeck_students_first_term');
                            return avg !== null ? `${avg.toFixed(1)}%` : "N/A";
                          })()}
                        </p>
                      </div>
                      <div className="flex-1 min-w-[70px] bg-[#FAF9F9] border border-slate-150 py-1.5 px-1 sm:py-2 px-1.5 rounded-lg text-center space-y-0.5 shadow-3xs">
                        <span className="text-[7.5px] sm:text-[8.5px] font-black text-slate-400 uppercase tracking-widest block leading-none">2nd Term Avg</span>
                        <p className="font-extrabold text-slate-900 text-[10.5px] sm:text-xs leading-none">
                          {(() => {
                            const avg = getOverallAverageForTerm(selectedStudent.id, 'ezibeck_students_second_term');
                            return avg !== null ? `${avg.toFixed(1)}%` : "N/A";
                          })()}
                        </p>
                      </div>
                    </>
                  )}

                  {viewingTerm === 'Third Term' && (
                    <>
                      <div className="flex-1 min-w-[70px] bg-[#FAF9F9] border border-slate-150 py-1.5 px-1 sm:py-2 px-1.5 rounded-lg text-center space-y-0.5 shadow-3xs">
                        <span className="text-[7.5px] sm:text-[8.5px] font-black text-slate-400 uppercase tracking-widest block leading-none">1st Term (20%)</span>
                        <p className="font-extrabold text-slate-900 text-[10.5px] sm:text-xs leading-none">
                          {(() => {
                            const tCount = selectedStudent.subjects.length || 1;
                            const fSum = selectedStudent.subjects.reduce((sum, s) => sum + (s.firstTermSummary !== undefined ? s.firstTermSummary : 0), 0);
                            return (fSum / tCount).toFixed(1);
                          })()}<span className="text-[8px] text-slate-400 font-normal">/20</span>
                        </p>
                      </div>

                      <div className="flex-1 min-w-[70px] bg-[#FAF9F9] border border-slate-150 py-1.5 px-1 sm:py-2 px-1.5 rounded-lg text-center space-y-0.5 shadow-3xs">
                        <span className="text-[7.5px] sm:text-[8.5px] font-black text-slate-400 uppercase tracking-widest block leading-none">2nd Term (20%)</span>
                        <p className="font-extrabold text-slate-900 text-[10.5px] sm:text-xs leading-none">
                          {(() => {
                            const tCount = selectedStudent.subjects.length || 1;
                            const sSum = selectedStudent.subjects.reduce((sum, s) => sum + (s.secondTermSummary !== undefined ? s.secondTermSummary : 0), 0);
                            return (sSum / tCount).toFixed(1);
                          })()}<span className="text-[8px] text-slate-400 font-normal">/20</span>
                        </p>
                      </div>

                      <div className="flex-1 min-w-[70px] bg-[#FAF9F9] border border-slate-150 py-1.5 px-1 sm:py-2 px-1.5 rounded-lg text-center space-y-0.5 shadow-3xs">
                        <span className="text-[7.5px] sm:text-[8.5px] font-black text-slate-400 uppercase tracking-widest block leading-none">3rd Term (60%)</span>
                        <p className="font-extrabold text-slate-900 text-[10.5px] sm:text-xs leading-none">
                          {(() => {
                            const tCount = selectedStudent.subjects.length || 1;
                            const thSum = selectedStudent.subjects.reduce((sum, s) => sum + (s.thirdTermSummary !== undefined ? s.thirdTermSummary : 0), 0);
                            return (thSum / tCount).toFixed(1);
                          })()}<span className="text-[8px] text-slate-400 font-normal">/60</span>
                        </p>
                      </div>
                    </>
                  )}

                  <div className="flex-1 min-w-[70px] bg-[#FAF9F9] border border-slate-150 py-1.5 px-1 sm:py-2 px-1.5 rounded-lg text-center space-y-0.5 shadow-3xs">
                    <span className="text-[7.5px] sm:text-[8.5px] font-black text-slate-400 uppercase tracking-widest block leading-none">Attendance</span>
                    <p className="font-extrabold text-emerald-600 text-[10.5px] sm:text-xs leading-none">
                      {Math.round(selectedStudent.attendancePresent / selectedStudent.attendanceTotal * 100)}%
                    </p>
                  </div>
                </div>

                {/* Academic Accomplishments: Credits, Fails & Subject count strip */}
                <div className="relative z-10 grid grid-cols-3 gap-2 sm:gap-4 select-none leading-none w-full">
                  <div className="bg-sky-50/40 border border-sky-150 rounded-lg py-1.5 px-3 flex items-center justify-between text-[11px] text-sky-900 font-medium shadow-3xs">
                    <span className="flex items-center gap-1.5 uppercase font-extrabold tracking-wider text-[9px] text-slate-500 flex-wrap sm:flex-nowrap">
                      <span className="text-sky-550 font-black">📚</span> Number of Subjects:
                    </span>
                    <span className="font-black text-sky-850 text-xs">{selectedStudent.subjects.length} Total</span>
                  </div>
                  <div className="bg-emerald-50/40 border border-emerald-150 rounded-lg py-1.5 px-3 flex items-center justify-between text-[11px] text-emerald-990 font-medium shadow-3xs">
                    <span className="flex items-center gap-1.5 uppercase font-extrabold tracking-wider text-[9px] text-slate-500 flex-wrap sm:flex-nowrap">
                      <span className="text-emerald-500 font-black">✔</span> Number of Credits:
                    </span>
                    <span className="font-black text-emerald-800 text-xs">{stats.creditsAndAbove + stats.passes} Passed</span>
                  </div>
                  <div className="bg-red-50/40 border border-red-155 rounded-lg py-1.5 px-3 flex items-center justify-between text-[11px] text-red-990 font-medium shadow-3xs">
                    <span className="flex items-center gap-1.5 uppercase font-extrabold tracking-wider text-[9px] text-slate-500 flex-wrap sm:flex-nowrap">
                      <span className="text-red-500 font-black">✘</span> Number of Fails:
                    </span>
                    <span className="font-black text-red-800 text-xs">{stats.failures} Failed</span>
                  </div>
                </div>

                {/* Part B: Character Assessment, Grades Scale, and Behaviour Guide Grid */}
                <div id="pdf-partB-character-traits" className="grid grid-cols-1 lg:grid-cols-10 print:grid-cols-10 gap-6 lg:gap-8 relative z-10">
                  {/* Left Parameter Column: Conduct Evaluation - Width reduced to 40% (lg:col-span-4) */}
                  {!isSecondaryClass && (
                    <div className="lg:col-span-4 print:col-span-4 bg-[#FCFCFC]/60 border border-slate-155 p-4 sm:p-5 rounded-2xl space-y-3.5 shadow-3xs">
                      <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-widest border-l-4 border-emerald-600 pl-2 select-none flex justify-between items-center">
                        <span>Part B: Character & Conduct</span>
                      </h4>

                      <div className="grid grid-cols-1 xs:grid-cols-2 gap-x-5 gap-y-2 text-xs text-slate-800">
                        {(() => {
                          const isKg = selectedStudent.className === 'Pre-Nursery' || selectedStudent.className.startsWith('Nursery');
                          if (isKg) {
                            const behaviouralList = selectedStudent.behaviour.filter(b => 
                              ["Punctuality", "Neatness", "Assignment", "Concentration"].includes(b.name)
                            );
                            const skillList = selectedStudent.behaviour.filter(b => 
                              ["Hand-writing", "Fluency", "Attitude to Property"].includes(b.name)
                            );
                            return (
                              <div className="col-span-2 grid grid-cols-2 gap-x-4">
                                <div className="space-y-1.5">
                                  <h5 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider border-b pb-0.5">Behavioural Ratings</h5>
                                  {behaviouralList.length === 0 ? (
                                    <p className="text-[9px] text-slate-400 italic">No ratings</p>
                                  ) : behaviouralList.map(b => (
                                    <div key={b.name} className="flex items-center justify-between py-0.5 border-b border-dashed border-slate-150">
                                      <span className="font-semibold text-slate-600 text-[10.5px]">{b.name}</span>
                                      <span className="font-mono font-black text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100/60 px-1.5 py-0.5 rounded-md">
                                        {b.rating} / 5
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                <div className="space-y-1.5">
                                  <h5 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider border-b pb-0.5">Skill Ratings</h5>
                                  {skillList.length === 0 ? (
                                    <p className="text-[9px] text-slate-400 italic">No ratings</p>
                                  ) : skillList.map(b => (
                                    <div key={b.name} className="flex items-center justify-between py-0.5 border-b border-dashed border-slate-150">
                                      <span className="font-semibold text-slate-600 text-[10.5px]">{b.name}</span>
                                      <span className="font-mono font-black text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100/60 px-1.5 py-0.5 rounded-md">
                                        {b.rating} / 5
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          } else {
                            return selectedStudent.behaviour.map(b => (
                              <div key={b.name} className="flex items-center justify-between py-1 border-b border-dashed border-slate-150">
                                <span className="font-semibold text-slate-600 text-[10.5px]">{b.name}</span>
                                <span className="font-mono font-black text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100/60 px-1.5 py-0.5 rounded-md">
                                  {b.rating} / 5
                                </span>
                              </div>
                            ));
                          }
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Grades Scale Box - Placed immediately to the right of behavioural ratings */}
                  <div className={`${isSecondaryClass ? 'lg:col-span-6 print:col-span-6' : 'lg:col-span-4 print:col-span-4'} bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5`}>
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-widest border-l-4 border-slate-900 pl-2 select-none">
                      Grades Index Card
                    </h4>
                    <div className="border border-slate-150 rounded-xl overflow-hidden shadow-3xs">
                      <table className="w-full text-[10px] text-left border-collapse text-slate-600">
                        <thead>
                          <tr className="bg-[#FAF9F9] border-b border-slate-150 font-bold select-none text-slate-500">
                            <th className="py-1 px-2 border-r border-slate-150 w-12">Grade</th>
                            <th className="py-1 px-2">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-1 px-2 border-r border-slate-150 font-bold text-slate-800 bg-emerald-50 text-[10px] text-emerald-700">A+</td>
                            <td className="py-1 px-2 text-slate-500">Distinction 90 - 100</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-1 px-2 border-r border-slate-150 font-bold text-slate-800 bg-emerald-55 text-[10px] text-emerald-700">A</td>
                            <td className="py-1 px-2 text-slate-500">Excellent 80 - 89</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-1 px-2 border-r border-slate-150 font-bold text-slate-800 bg-emerald-50 text-[10px] text-emerald-700">B</td>
                            <td className="py-1 px-2 text-slate-500">Very Good 70 - 79</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-1 px-2 border-r border-slate-150 font-bold text-slate-800 bg-[#FCF8E3] text-[10px] text-amber-700">C</td>
                            <td className="py-1 px-2 text-slate-500">Good 60 - 69</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-1 px-2 border-r border-slate-150 font-bold text-slate-800 bg-orange-50 text-[10px] text-orange-700">D</td>
                            <td className="py-1 px-2 text-slate-500">Fair 50 - 59</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-1 px-2 border-r border-slate-150 font-bold text-slate-800 bg-red-50 text-[10px] text-red-500">F</td>
                            <td className="py-1 px-2 text-slate-500">Fail Below 50</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Behavior Evaluation Guideline - Placed on the far right */}
                  <div className={`${isSecondaryClass ? 'lg:col-span-4 print:col-span-4' : 'lg:col-span-2 print:col-span-2'} bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5`}>
                    <h4 className="font-extrabold text-slate-900 text-[11px] uppercase tracking-widest border-l-4 border-slate-900 pl-2 select-none">
                      Conduct scale
                    </h4>
                    <ul className="text-[10px] text-slate-500 space-y-1 font-bold pt-1.5">
                      <li className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded bg-emerald-50 text-emerald-705 text-[9px] flex items-center justify-center font-mono font-black">5</span>
                        <span>Excellent</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded bg-emerald-50 text-emerald-600 text-[9px] flex items-center justify-center font-mono font-black">4</span>
                        <span>Very Good</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded bg-emerald-50 text-emerald-705 text-[9px] flex items-center justify-center font-mono font-black">3</span>
                        <span>Good</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded bg-amber-50 text-amber-500 text-[9px] flex items-center justify-center font-mono font-black">2</span>
                        <span>Fair</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded bg-red-50 text-red-700 text-[9px] flex items-center justify-center font-mono font-black">1</span>
                        <span>Needs Work</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Part C: Remarks & Signatures Segment */}
                <div className="grid grid-cols-2 print:grid-cols-2 gap-4 md:gap-6 relative z-10 pt-6 border-t border-dashed border-slate-200">
                  {/* Form Teacher Remark Callout */}
                  {(() => {
                    const cleanClassName = (selectedStudent.className || '').replace(/\s+/g, '');
                    const isNursery = ['Pre-Nursery', 'Nursery1', 'Nursery2', 'Nursery3'].includes(cleanClassName);
                    const isBasic = ['Basic1', 'Basic2', 'Basic3', 'Basic4', 'Basic5', 'Basic6'].includes(cleanClassName);
                    const isPreNurseryToBasic6 = isNursery || isBasic;

                    let fallbackTeacher = '';
                    if (isBasic) {
                      fallbackTeacher = template.formTeacherJunior || "Headmistress";
                    } else if (isNursery) {
                      fallbackTeacher = template.formTeacherSenior || "Nursery Admin";
                    } else {
                      fallbackTeacher = template.principalName || "Principal";
                    }

                    const displayTeacherName = selectedStudent.formTeacherName || fallbackTeacher;

                    let displaySignatoryName = template.principalName;
                    let displayRole = "Principal";
                    let assessmentHeading = "🏫 Headmistress's Performance Assessment";

                    if (isBasic) {
                      displaySignatoryName = template.formTeacherJunior || "Mrs. Nancy Yusuf";
                      displayRole = "Headmistress";
                      assessmentHeading = "🏫 Headmistress's Performance Assessment";
                    } else if (isNursery) {
                      displaySignatoryName = template.formTeacherSenior || "Nursery Admin";
                      displayRole = "Nursery Admin";
                      assessmentHeading = "🧸 Nursery Admin's Performance Assessment";
                    } else {
                      displaySignatoryName = template.principalName || "Principal";
                      displayRole = "Principal";
                      assessmentHeading = "🎓 Principal's Performance Assessment";
                    }

                    return (
                      <>
                        <div className="bg-[#FAF9F9] border border-slate-200 p-4 sm:p-5 rounded-2xl space-y-4 flex flex-col justify-between shadow-3xs">
                          <div>
                            <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-200/50 pb-1.5 select-none flex items-center gap-1.5">
                              <span>💬 Form Teacher's Appraisal</span>
                            </h4>
                            <p className="text-xs italic text-slate-600 pt-3 leading-relaxed">
                              "{selectedStudent.formTeacherRemark}"
                            </p>
                          </div>
                          
                          <div className="border-t border-slate-200 pt-3 flex justify-between items-end">
                            <div className="text-xs">
                              <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-extrabold select-none">Appraiser</span>
                              <p className="font-black text-slate-900 text-[11px] sm:text-xs">{displayTeacherName}</p>
                            </div>
                            <div className="text-right select-none">
                              <div className="text-xs sm:text-sm font-serif italic text-emerald-950 font-semibold h-5 tracking-wide">
                                {displayTeacherName.replace("Mrs.", "").replace("Mr.","").trim()}
                              </div>
                              <span className="text-[8px] text-slate-400 uppercase tracking-wider block border-t border-slate-200 pt-0.5 mt-0.5">Signature & Stamp</span>
                            </div>
                          </div>
                        </div>

                        {/* Signatory Assessment Callout */}
                        <div className="bg-[#FAF9F9] border border-slate-200 p-4 sm:p-5 rounded-2xl space-y-4 flex flex-col justify-between shadow-3xs">
                          <div>
                            <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-200/50 pb-1.5 select-none flex items-center gap-1.5">
                              <span>{assessmentHeading}</span>
                            </h4>
                            <p className="text-xs italic text-slate-600 pt-3 leading-relaxed">
                              {selectedStudent.principalRemark
                                ? `"${selectedStudent.principalRemark}"`
                                : (selectedStudent.formTeacherRemark.includes("outstanding") || stats.avgScore >= (template.distinctionThreshold || 90)
                                  ? `"Highly commendable academic and behavioral character shown during the term session. Excellent candidate. Promoted with honor."`
                                  : stats.avgScore >= (template.passThreshold || 50)
                                    ? `"Satisfactory progress. Continued focus on core concepts will serve candidate well. Promoted."`
                                    : `"Needs close guidance and study supervision in future sessions to ensure passing criteria."`)}
                            </p>
                          </div>

                          <div className="border-t border-slate-200 pt-3 flex justify-between items-end">
                            <div className="text-xs">
                              <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-extrabold select-none">Authorized {displayRole}</span>
                              <p className="font-black text-slate-900 text-[11px] sm:text-xs">{displaySignatoryName}</p>
                            </div>
                            <div className="text-right select-none">
                              <div className="text-xs sm:text-sm font-serif italic text-emerald-950 font-semibold h-5 tracking-wide">
                                {displaySignatoryName.replace("Dr.","").replace("Mrs.","").replace("Mr.","").trim()}
                              </div>
                              <span className="text-[8px] text-slate-400 uppercase tracking-wider block border-t border-slate-200 pt-0.5 mt-0.5">Seal & Signature</span>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Next Term & Fees Bill Card */}
                <div className="bg-emerald-50/50 border border-emerald-100/95 rounded-2xl p-4 sm:p-5 relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-3xs">
                  <div className="space-y-1 text-left sm:max-w-[60%]">
                    <span className="text-[9px] bg-emerald-100 border border-emerald-200 text-emerald-800 font-extrabold tracking-widest uppercase px-2 py-0.5 rounded select-none">
                      Upcoming Term Invoice Details
                    </span>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight select-none">
                      Next Term Resumption & Fee Breakdown
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      All outstanding and next term fees must be settled fully prior to resumption. Please present payment bank teller or invoice receipt to academic officer at entrance.
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 justify-between bg-white border border-emerald-100/85 p-3.5 rounded-xl w-full sm:w-80 text-xs shadow-3xs">
                    <div className="flex justify-between gap-4 w-full">
                      <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider select-none">Expected Resumption</span>
                      <span className="font-extrabold text-slate-800 text-right">{template.resumptionDate}</span>
                    </div>
                    {(() => {
                      const parseNum = (v: string): number => {
                        const cln = v.replace(/[^\d.]/g, '');
                        const parsed = parseFloat(cln);
                        return isNaN(parsed) ? 0 : parsed;
                      };
                      
                      const cls = selectedStudent.className || '';
                      let sFee = template.schoolFee || '₦100,000.00';
                      let pFee = template.partyFee || '₦15,000.00';
                      let eFee = template.enrollmentFee || '₦15,000.00';
                      let bFee = template.bookFee || '₦20,000.00';
                      
                      if (cls === 'Pre-Nursery' || cls === 'Nursery 1' || cls === 'Nursery 2' || cls === 'Nursery 3') {
                        sFee = template.schoolFeeNursery || sFee;
                        pFee = template.partyFeeNursery || pFee;
                        eFee = template.enrollmentFeeNursery || eFee;
                        bFee = template.bookFeeNursery || bFee;
                      } else if (cls.startsWith('Basic')) {
                        sFee = template.schoolFeePrimary || sFee;
                        pFee = template.partyFeePrimary || pFee;
                        eFee = template.enrollmentFeePrimary || eFee;
                        bFee = template.bookFeePrimary || bFee;
                      } else if (cls.startsWith('JSS')) {
                        sFee = template.schoolFeeJunior || sFee;
                        pFee = template.partyFeeJunior || pFee;
                        eFee = template.enrollmentFeeJunior || eFee;
                        bFee = template.bookFeeJunior || bFee;
                      } else if (cls.startsWith('SS')) {
                        sFee = template.schoolFeeSenior || sFee;
                        pFee = template.partyFeeSenior || pFee;
                        eFee = template.enrollmentFeeSenior || eFee;
                        bFee = template.bookFeeSenior || bFee;
                      }

                      const totalVal = parseNum(sFee) + parseNum(pFee) + parseNum(eFee) + parseNum(bFee);
                      const totalFormatted = `₦${totalVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

                      return (
                        <div className="border-t border-dashed border-slate-250 pt-2 mt-1 space-y-1">
                          <span className="text-[8px] font-black uppercase text-slate-450 tracking-wider block mb-1">Itemized Fees Breakdown ({cls})</span>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400 font-medium">School Fees</span>
                            <span className="font-bold text-slate-700">{sFee}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400 font-medium">Party Fee</span>
                            <span className="font-bold text-slate-700">{pFee}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400 font-medium">Enrollment Fee</span>
                            <span className="font-bold text-slate-700">{eFee}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400 font-medium">Book Fees</span>
                            <span className="font-bold text-slate-700">{bFee}</span>
                          </div>
                          <div className="flex justify-between border-t border-emerald-200/80 pt-1.5 sm:pt-1 mt-1 font-bold text-xs">
                            <span className="text-emerald-800">Total fees</span>
                            <span className="font-black text-emerald-800 font-mono text-right">{totalFormatted}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Bottom Status bar stamp */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900 text-slate-200 p-4 rounded-xl relative z-10 text-xs border border-slate-800 shadow-sm animate-fade-in select-none">
                  <span className="flex items-center gap-2.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Candidate Academic Status: <strong className="text-white">Active and Promoted</strong></span>
                  </span>
                  
                  <span className="bg-emerald-650 text-white font-extrabold px-3 py-1 text-[10px] rounded tracking-widest uppercase font-bold">
                    ★ Official Seal Verified
                  </span>
                </div>
              </div>
              </>
            );
          })()}
        </div>
      )}

      {showGuidelines && <GuidelinesComponent onClose={() => setShowGuidelines(false)} isPublic={true} />}

    </div>
  );
}
