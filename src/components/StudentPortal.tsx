/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, GraduationCap, Search, BookOpen, Eye, Layers, Printer, Star } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Student, ClassName, Workspace15Template } from '../types';
import { SCHOOL_INFO, calculateStudentStats, getLetterAndRemark, calculateSubjectTotal, BEHAVIOUR_TRAITS } from '../utils/academicUtils';

interface StudentPortalProps {
  students: Student[];
  template: Workspace15Template;
  onBack: () => void;
  onUpdateStudents?: (updatedList: Student[]) => void;
}

export default function StudentPortal({ students, template, onBack, onUpdateStudents }: StudentPortalProps) {
  const [selectedClass, setSelectedClass] = useState<ClassName>('JSS1');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [viewTab, setViewTab] = useState<'report' | 'charts'>('report');
  
  // Student Lock Portal credentials
  const [passwordInput, setPasswordInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loginError, setLoginError] = useState('');

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

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Filter students by class and search query
  const filteredStudents = students.filter(s => {
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
      // Scroll to top of window to avoid rendering defects in html2canvas
      window.scrollTo(0, 0);
      
      // Enforce desktop viewport sizing for high physical layout precision and avoid wrapping
      element.style.width = '1024px';
      element.style.minWidth = '1024px';
      element.style.maxWidth = '1024px';
      
      // Set all horizontal overflows of tables inside the print wrapper to visible
      overflowElms.forEach((el) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.overflowX = 'visible';
        htmlEl.style.width = '100%';
      });

      // Generate canvas
      const canvas = await html2canvas(element, {
        scale: 1.5, // High physical definition, lightweight and highly reliable
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 1024,
        windowWidth: 1024
      });
      
      restoreStyles();
      
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Fit comfortably in portrait A4 width (210mm) with 10mm margins on both sides
      const imgWidth = 190; 
      const pageHeight = 277; // Margins top/bottom
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10; // Start with 10mm margin
      
      pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }
      
      const filename = `Ezibeck_Report_Sheet_${selectedStudent.id}_${selectedStudent.name.replace(/\s+/g, '_')}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error('Direct PDF Generation Error:', err);
      
      // Fallback style restoration to prevent UI defects
      restoreStyles();
      
      // Trigger native printing directly without popup distraction
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
          const found = students.find(s => s.id === studentId);
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
  }, [students]);

  const handleSelectStudent = (stud: Student) => {
    if (typeof window !== 'undefined') {
      const curState = window.history.state;
      if (!curState || curState.studentId !== stud.id || curState.view !== 'student') {
        window.history.pushState({ view: 'student', studentId: stud.id }, '');
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
    if (typeof window !== 'undefined' && window.history.state && window.history.state.studentId) {
      window.history.back();
    } else {
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
      setIsUnlocked(true);
      setLoginError('');
    } else {
      setLoginError('Invalid Student Password Code. Please try again!');
    }
  };

  const handleSendResetOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    
    const expectedEmail = selectedStudent.name.toLowerCase().replace(/\s+/g, '') + "@ezibeckacademy.edu.ng";
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

    // Update password in the database / main state
    if (onUpdateStudents) {
      const updatedList = students.map(s => {
        if (s.id === selectedStudent.id) {
          return { ...s, password: newPass };
        }
        return s;
      });
      onUpdateStudents(updatedList);
      // Also update selectedStudent state to keep it synchronized!
      setSelectedStudent({ ...selectedStudent, password: newPass });
    }

    setResetSuccess('Password updated successfully! You can now log in using your new password.');
    setNewPass('');
    setNewPassConfirm('');
    setResetStep('request');
    setShowResetForm(false);
    setSimulatedNotification('');
  };

  return (
    <div className="bg-slate-50/70 min-h-screen py-10 px-4 sm:px-6 lg:px-8 font-sans print:bg-white print:py-0 print:px-0">
      
      {/* Search Selection Header Card (hidden during print) */}
      <div className="max-w-4xl mx-auto mb-8 print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-700 transition-all mb-5 uppercase tracking-wider cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to School Homepage
        </button>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 sm:p-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-50 text-indigo-700 p-3 rounded-xl shadow-xs">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="max-w-[calc(100%-60px)]">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight uppercase truncate">{template.schoolName}</h2>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-1">Select class and choose student ID to unlock secure report sheet</p>
              </div>
            </div>
            
            {/* Class Tabs Selector */}
            <div className="flex gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-100/80 overflow-x-auto whitespace-nowrap scrollbar-none w-full lg:w-auto -mx-1 sm:mx-0">
              {(['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'] as ClassName[]).map(cls => (
                <button
                  key={cls}
                  onClick={() => {
                    setSelectedClass(cls);
                    setSearchQuery('');
                    setSelectedStudent(null);
                    setIsUnlocked(false);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex-1 sm:flex-initial text-center ${selectedClass === cls ? 'bg-indigo-700 text-white shadow-md shadow-indigo-100' : 'text-slate-600 hover:bg-slate-100'}`}
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
                className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-55 focus:bg-white rounded-xl py-2.5 pl-10 pr-4 text-xs outline-none transition-all text-slate-705 font-bold shadow-xs"
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
                      className={`px-3.5 py-1.5 text-xs rounded-xl border font-bold transition-all cursor-pointer ${selectedStudent?.id === stud.id ? 'bg-indigo-50 border-indigo-205 text-indigo-700 scale-[1.01] shadow-xs' : 'bg-white hover:bg-slate-50 border-slate-100 text-slate-600 font-mono'}`}
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
        // Secure Password Form / OTP Reset Form to decrypt Student Report Card
        <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-200 p-5 sm:p-8 shadow-xl text-center space-y-6 print:hidden animate-fade-in my-10">
          {showResetForm ? (
            <div className="space-y-5 text-left">
              <div className="flex items-center justify-between border-b pb-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetForm(false);
                    setResetError('');
                    setResetSuccess('');
                    setSimulatedNotification('');
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-indigo-700 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  ← Back to Unlock
                </button>
                <span className="text-[9px] bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold px-2 py-0.5 rounded tracking-widest uppercase">
                  OTP Reset Desk
                </span>
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900 uppercase">Reset Student Password</h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Reset password for candidate <strong className="text-slate-800 font-bold">{selectedStudent.name}</strong> ({selectedStudent.id}) with a simulated email verification passcode.
                </p>
              </div>

              {simulatedNotification && (
                <div className="bg-emerald-50 border border-emerald-250 text-emerald-855 text-xs rounded-xl p-3.5 space-y-1 font-semibold shadow-3xs animate-pulse">
                  <span className="text-[9px] uppercase font-black tracking-wider text-emerald-800 block">📬 Simulation Inbox Notification</span>
                  <p className="font-mono text-[11px] break-all leading-normal">{simulatedNotification}</p>
                </div>
              )}

              {resetError && (
                <p className="text-red-600 text-xs font-semibold bg-red-50 border border-red-100 rounded-lg p-2.5">
                  ⚠️ {resetError}
                </p>
              )}

              {resetSuccess && !simulatedNotification && (
                <p className="text-emerald-700 text-xs font-semibold bg-emerald-50 border border-emerald-100 rounded-lg p-2.5">
                  ✓ {resetSuccess}
                </p>
              )}

              {resetStep === 'request' && (
                <form onSubmit={handleSendResetOTP} className="space-y-4">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[11px] text-slate-500 font-medium leading-relaxed">
                    Student's registered email address on archive: <br />
                    <strong className="text-slate-800 font-bold">{selectedStudent.name.toLowerCase().replace(/\s+/g, '')}@ezibeckacademy.edu.ng</strong>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Enter Student's Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="Enter registered email address..."
                      value={resetEmailInput}
                      onChange={(e) => {
                        setResetEmailInput(e.target.value);
                        setResetError('');
                      }}
                      className="w-full bg-slate-50 border border-slate-205 focus:border-indigo-500 focus:bg-white rounded-xl py-2.5 px-3 text-xs font-bold outline-none transition-all shadow-3xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-indigo-700 hover:bg-indigo-805 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md shadow-indigo-100 cursor-pointer"
                  >
                    Send Authorization OTP Code
                  </button>
                </form>
              )}

              {resetStep === 'verify' && (
                <form onSubmit={handleVerifyResetOTP} className="space-y-4">
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Please look at the green inbox banner above, copy the **6-digit verification code**, and input it below:
                  </p>
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">6-Digit OTP Verification Passcode</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="e.g. 123456"
                      value={otpInput}
                      onChange={(e) => {
                        setOtpInput(e.target.value);
                        setResetError('');
                      }}
                      className="w-full bg-slate-50 border border-slate-205 focus:border-indigo-500 focus:bg-white rounded-xl py-2.5 px-3 text-xs font-mono font-bold tracking-widest text-center outline-none transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    Confirm & Verify OTP
                  </button>
                </form>
              )}

              {resetStep === 'new_password' && (
                <form onSubmit={handleConfirmNewPassword} className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">New Password (Min 4 chars)</label>
                    <input
                      type="password"
                      required
                      placeholder="Enter new account password..."
                      value={newPass}
                      onChange={(e) => {
                        setNewPass(e.target.value);
                        setResetError('');
                      }}
                      className="w-full bg-slate-50 border border-slate-205 focus:border-indigo-500 focus:bg-white rounded-xl py-2.5 px-3 text-xs font-bold outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      placeholder="Re-type new password to confirm..."
                      value={newPassConfirm}
                      onChange={(e) => {
                        setNewPassConfirm(e.target.value);
                        setResetError('');
                      }}
                      className="w-full bg-slate-50 border border-slate-205 focus:border-indigo-500 focus:bg-white rounded-xl py-2.5 px-3 text-xs font-bold outline-none transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-indigo-700 hover:bg-indigo-805 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md cursor-pointer animate-pulse"
                  >
                    Save & Update Student Password
                  </button>
                </form>
              )}
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 p-4 rounded-full">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase">Secure Portal Unlock</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Academic file of Student ID <strong className="text-[#3b82f6] font-mono">{selectedStudent.id}</strong> is encrypted. Please enter their student password to decrypt.
                </p>
              </div>

              <form onSubmit={handleVerifyPassword} className="space-y-4">
                <div className="text-left">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 flex justify-between items-center">
                    <span>Student Password</span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowResetForm(true);
                        setResetStep('request');
                      }}
                      className="text-[10px] text-indigo-650 hover:text-indigo-800 hover:underline font-extrabold normal-case cursor-pointer"
                    >
                      🔑 Forgot Key? Overwrite with OTP
                    </button>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter password..."
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl py-3 px-4 text-xs font-bold outline-none transition-all shadow-3xs"
                  />
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
                    className="w-1/2 bg-indigo-700 hover:bg-indigo-805 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md shadow-indigo-100 cursor-pointer"
                  >
                    Unlock Report Card
                  </button>
                </div>
              </form>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-left">
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-700 block mb-0.5">Demo Credentials Helper</span>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Candidate Student ID: <span className="font-mono font-bold text-slate-700">{selectedStudent.id}</span>
                </p>
              </div>
            </>
          )}
        </div>
      ) : (
        // Decrypted View
        <div className="max-w-4xl mx-auto space-y-6">
          
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
                }}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-red-650 hover:bg-red-50 transition-all cursor-pointer border border-red-100/50 flex-1 xs:flex-initial"
              >
                🔒 Lock Session
              </button>
            </div>
            <button
              onClick={downloadPdfDirect}
              disabled={isGeneratingPdf}
              className="bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white font-bold text-xs px-5 py-3 sm:py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer w-full sm:w-auto"
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
            
            if (viewTab === 'charts') {
              return (
                <div className="bg-white rounded-3xl border border-slate-100 p-8 space-y-8 print:hidden shadow-sm animate-fade-in">
                  <div>
                    <h3 className="text-slate-900 font-extrabold text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-indigo-700" /> Academic Performance Chart — {selectedStudent.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Graphical breakdown of subject score aggregates (Total 100 points per subject, split into 30% Test and 70% Exam)</p>
                    
                    <div className="space-y-5 pt-6">
                      {selectedStudent.subjects.map(subj => {
                        const tot = calculateSubjectTotal(subj);
                        const { letter } = getLetterAndRemark(tot);
                        let barColor = 'bg-indigo-750';
                        if (tot >= 80) barColor = 'bg-emerald-600';
                        else if (tot >= 70) barColor = 'bg-green-600';
                        else if (tot >= 60) barColor = 'bg-indigo-650';
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
                  </div>
                </div>
              );
            }            // Otherwise, render full standard report sheet card (printable)
            return (
              <div 
                ref={printAreaRef}
                className="report-card-printable bg-white border border-slate-200/80 rounded-3xl shadow-xl p-4 sm:p-12 space-y-6 sm:space-y-8 relative print:border-none print:shadow-none print:p-0 print:m-0 animate-fade-in"
              >
                {/* Print layout decorator line */}
                <div className="absolute inset-1.5 xs:inset-3 border border-slate-100 rounded-2xl pointer-events-none print:hidden"></div>

                {/* Notion Style Header Breadcrumbs */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] font-medium text-slate-400 border-b border-slate-100/70 pb-3 mb-2 relative z-10 select-none">
                  <span className="hover:text-slate-600 transition-colors cursor-pointer">🏫 {template.schoolName}</span>
                  <span>/</span>
                  <span className="hover:text-slate-600 transition-colors cursor-pointer">📁 Report Registry</span>
                  <span>/</span>
                  <span className="hover:text-slate-600 transition-colors cursor-pointer">👥 {selectedStudent.className}</span>
                  <span>/</span>
                  <span className="text-slate-700 font-semibold">📄 {selectedStudent.name}</span>
                </div>

                {/* Notion Top Cover Band */}
                <div className="relative h-20 sm:h-28 w-full bg-slate-150 rounded-2xl overflow-hidden mb-6 border border-slate-150 print:hidden select-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-200/50 via-indigo-50/10 to-slate-100"></div>
                  <div className="absolute top-2 right-3 text-[9px] sm:text-[10px] bg-white/70 backdrop-blur-xs px-2 py-0.5 rounded text-slate-400 font-bold tracking-wider uppercase">Cover Slate</div>
                </div>

                {/* Overlapping Page Emoji Icon & School Identification */}
                <div className="relative z-10 space-y-4">
                  <div className="flex items-start gap-4 -mt-10 sm:-mt-14 print:mt-0 select-none">
                    <div className="w-14 h-14 sm:w-20 sm:h-20 bg-white rounded-2xl border border-slate-205 shadow-sm flex items-center justify-center text-2xl sm:text-4xl">
                      📒
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h1 className="text-xl sm:text-3.5xl font-black text-slate-900 tracking-tight leading-tight uppercase">
                      {template.schoolName}
                    </h1>
                    <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-indigo-700 font-bold flex items-center gap-1.5 select-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                      Motto: {template.motto}
                    </p>
                    <p className="text-slate-500 text-[10px] sm:text-[11px] leading-relaxed">
                      <strong>Registered Address:</strong> {template.address} | <strong>Email:</strong> {template.email} | <strong>Phone:</strong> {template.phone}
                    </p>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Dynamic Official Page Heading */}
                  <div className="py-2">
                    <h2 className="text-xs sm:text-base font-extrabold text-slate-900 tracking-tight leading-tight uppercase flex flex-col xs:flex-row xs:items-center gap-2">
                      <span className="inline-block px-2.5 py-1 bg-slate-900 text-slate-100 text-[9px] sm:text-[10px] font-black rounded-md tracking-wider w-max">OFFICIAL STATUS</span>
                      STUDENT’S TERMLY REPORT SHEET FOR {selectedStudent.className.startsWith('JSS') ? 'JUNIOR' : 'SENIOR'} SECONDARY SCHOOL
                    </h2>
                  </div>
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
                      <span className="font-mono font-bold text-indigo-700 text-right">{selectedStudent.id}</span>
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
                      <span className="font-extrabold text-indigo-700 text-right">{template.resumptionDate}</span>
                    </div>

                    <div className="flex items-center justify-between lg:border-0 gap-2">
                      <span className="font-semibold text-slate-400 select-none flex items-center gap-1.5 flex-shrink-0">
                        <span>💰</span> Next Term Fees
                      </span>
                      <span className="font-extrabold text-emerald-700 text-right">{template.nextTermFee || '₦45,000'}</span>
                    </div>
                  </div>
                </div>

                {/* Part A: Academic Course Evaluation */}
                <div className="relative z-10 space-y-4">
                  <h3 className="text-slate-900 font-extrabold text-xs uppercase tracking-widest border-l-4 border-slate-900 pl-2.5 pb-0.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 select-none">
                    <span>Part A: Academic Course Evaluation</span>
                    <span className="text-[10px] text-indigo-650 font-bold flex items-center gap-1 animate-pulse sm:animate-none">
                      <span className="sm:hidden">Swipe table left/right ↔️</span>
                      <span className="hidden sm:inline text-slate-400 font-normal">Standard Formula Matrix Layout</span>
                    </span>
                  </h3>
                  
                  {/* Notion-style database table */}
                  <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-3xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        {/* Header columns styled like raw Notion headers */}
                        <tr className="bg-[#F7F7F7] border-b border-slate-200 text-slate-500 font-medium select-none text-[10.5px]">
                          <th className="py-2.5 px-3 border-r border-slate-200 min-w-[150px]">
                            <span className="flex items-center gap-1.5">📝 Subjects</span>
                          </th>
                          <th className="py-2.5 px-3 border-r border-slate-200 text-center w-24">
                            <span className="flex items-center justify-center gap-1"># TEST (30)</span>
                          </th>
                          <th className="py-2.5 px-3 border-r border-slate-200 text-center w-24">
                            <span className="flex items-center justify-center gap-1"># EXAM (70)</span>
                          </th>
                          <th className="py-2.5 px-3 border-r border-slate-200 text-center bg-indigo-50/30 w-24">
                            <span className="flex items-center justify-center gap-1 text-indigo-700">Σ TERM (100)</span>
                          </th>
                          <th className="py-2.5 px-3 border-r border-slate-200 text-center text-[10px] w-20">
                            <span className="flex items-center justify-center gap-1"># 1ST TERM (20)</span>
                          </th>
                          <th className="py-2.5 px-3 border-r border-slate-200 text-center text-[10px] w-20">
                            <span className="flex items-center justify-center gap-1"># 2ND TERM (20)</span>
                          </th>
                          <th className="py-2.5 px-3 border-r border-slate-200 text-center text-[10px] w-20">
                            <span className="flex items-center justify-center gap-1"># 3RD TERM (60)</span>
                          </th>
                          <th className="py-2.5 px-3 border-r border-slate-200 text-center bg-indigo-50/20 w-28">
                            <span className="flex items-center justify-center gap-1 text-slate-800 font-bold">Σ SESSION AVE</span>
                          </th>
                          <th className="py-2.5 px-3 border-r border-slate-200 text-center w-20">
                            <span className="flex items-center justify-center gap-1">Σ GRADE</span>
                          </th>
                          <th className="py-2.5 px-3 border-r border-slate-200 text-center w-16">
                            <span className="flex items-center justify-center gap-1"># RANK</span>
                          </th>
                          <th className="py-2.5 px-4 font-bold text-slate-500">
                            <span className="flex items-center gap-1.5">💬 TEACHER'S REMARK</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {selectedStudent.subjects.map(subj => {
                          const tot = calculateSubjectTotal(subj);
                          
                          // Formulate annual / session average data realistically matching the 20/20/60 formula of Notion
                          const firstTerm = subj.firstTermSummary !== undefined ? subj.firstTermSummary : 0;
                          const secondTerm = subj.secondTermSummary !== undefined ? subj.secondTermSummary : 0;
                          const thirdTerm = subj.thirdTermSummary !== undefined ? subj.thirdTermSummary : 0;
                          const sessionAvg = firstTerm + secondTerm + thirdTerm;

                          const { letter, remark, ratingClass } = getLetterAndRemark(sessionAvg);

                          return (
                            <tr key={subj.id} className="hover:bg-slate-50/60 transition-all">
                              <td className="py-2.5 px-3 border-r border-slate-100 font-extrabold text-slate-900 bg-slate-50/20">{subj.name}</td>
                              <td className="py-2.5 px-3 border-r border-slate-100 text-center font-mono text-slate-500">{subj.testScore}</td>
                              <td className="py-2.5 px-3 border-r border-slate-100 text-center font-mono text-slate-500">{subj.examScore}</td>
                              <td className="py-2.5 px-3 border-r border-slate-100 text-center font-black font-mono text-indigo-755 bg-indigo-50/20">{tot}</td>
                              <td className="py-2.5 px-3 border-r border-slate-100 text-center font-mono text-slate-450">{firstTerm}</td>
                              <td className="py-2.5 px-3 border-r border-slate-100 text-center font-mono text-slate-455">{secondTerm}</td>
                              <td className="py-2.5 px-3 border-r border-slate-100 text-center font-mono text-slate-455">{thirdTerm}</td>
                              <td className="py-2.5 px-3 border-r border-slate-100 text-center font-black font-mono text-indigo-700/80 bg-slate-50/40">{sessionAvg}</td>
                              <td className="py-2.5 px-3 border-r border-slate-100 text-center">
                                <span className={`px-2 py-0.5 text-[10px] font-black rounded-sm tracking-wider ${ratingClass}`}>
                                  {letter}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 border-r border-slate-100 text-center font-bold text-slate-600 bg-slate-50/20">{subj.position ? `${subj.position}` : '-'}</td>
                              <td className="py-2.5 px-4 italic text-slate-500 text-[11px] font-normal leading-tight">{remark}</td>
                            </tr>
                          );
                        })}

                        {/* Calculation Footer styled exactly like Notion database table calculation footer */}
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
                          <td className="py-2 px-3 text-center font-black text-indigo-700 bg-indigo-50/20">
                            Average: {stats.avgScore.toFixed(1)}%
                          </td>
                          <td className="py-2 px-3 text-center font-bold">
                            Average: {(() => {
                              const tCount = selectedStudent.subjects.length || 1;
                              const fSum = selectedStudent.subjects.reduce((sum, s) => sum + (s.firstTermSummary !== undefined ? s.firstTermSummary : 0), 0);
                              return (fSum / tCount).toFixed(1);
                            })()}
                          </td>
                          <td className="py-2 px-3 text-center font-bold">
                            Average: {(() => {
                              const tCount = selectedStudent.subjects.length || 1;
                              const sSum = selectedStudent.subjects.reduce((sum, s) => sum + (s.secondTermSummary !== undefined ? s.secondTermSummary : 0), 0);
                              return (sSum / tCount).toFixed(1);
                            })()}
                          </td>
                          <td className="py-2 px-3 text-center font-bold">
                            Average: {(() => {
                              const tCount = selectedStudent.subjects.length || 1;
                              const thSum = selectedStudent.subjects.reduce((sum, s) => sum + (s.thirdTermSummary !== undefined ? s.thirdTermSummary : 0), 0);
                              return (thSum / tCount).toFixed(1);
                            })()}
                          </td>
                          <td className="py-2 px-3 text-center font-black bg-slate-100/50">
                            Average: {(() => {
                              const tCount = selectedStudent.subjects.length || 1;
                              const sessionSum = selectedStudent.subjects.reduce((sum, s) => {
                                const f = s.firstTermSummary !== undefined ? s.firstTermSummary : 0;
                                const sec = s.secondTermSummary !== undefined ? s.secondTermSummary : 0;
                                const th = s.thirdTermSummary !== undefined ? s.thirdTermSummary : 0;
                                return sum + (f + sec + th);
                              }, 0);
                              return (sessionSum / tCount).toFixed(1);
                            })()}%
                          </td>
                          <td className="py-2 px-3" colSpan={3}>
                            {/* Empty spacing for other columns */}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sub-Score KPI Dashboard metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 relative z-10 select-none">
                  <div className="bg-[#FAF9F9] border border-slate-150 p-3 sm:p-4 rounded-xl text-center space-y-1">
                    <span className="text-[8px] xs:text-[9px] font-black text-slate-400 uppercase tracking-widest block">Cumulative Total</span>
                    <p className="font-extrabold text-slate-900 text-sm sm:text-base leading-none">
                      {stats.totalScore} <span className="text-[10px] sm:text-xs text-slate-400 font-normal">/ {stats.maxPossibleScore}</span>
                    </p>
                  </div>

                  <div className="bg-[#FAF9F9] border border-slate-150 p-3 sm:p-4 rounded-xl text-center space-y-1">
                    <span className="text-[8px] xs:text-[9px] font-black text-slate-400 uppercase tracking-widest block">Termly Average</span>
                    <p className="font-extrabold text-slate-900 text-sm sm:text-base leading-none">
                      {stats.avgScore.toFixed(1)}%
                    </p>
                  </div>

                  <div className="bg-[#FAF9F9] border border-slate-150 p-3 sm:p-4 rounded-xl text-center space-y-1">
                    <span className="text-[8px] xs:text-[9px] font-black text-slate-400 uppercase tracking-widest block">Calculated GPA</span>
                    <p className="font-extrabold text-indigo-700 text-sm sm:text-base leading-none">
                      {stats.gpa} <span className="text-[9px] sm:text-[10px] text-slate-400 font-normal">/ 5.0</span>
                    </p>
                  </div>

                  <div className="bg-[#FAF9F9] border border-slate-150 p-3 sm:p-4 rounded-xl text-center space-y-1">
                    <span className="text-[8px] xs:text-[9px] font-black text-slate-400 uppercase tracking-widest block">Attendance Record</span>
                    <p className="font-extrabold text-emerald-600 text-sm sm:text-base leading-none">
                      {Math.round(selectedStudent.attendancePresent / selectedStudent.attendanceTotal * 100)}% <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium">Present</span>
                    </p>
                  </div>
                </div>

                {/* Part B: Character Assessment, Grades Scale, and Behaviour Guide Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 relative z-10">
                  {/* Left Parameter Column: Conduct Evaluation */}
                  <div className="lg:col-span-6 bg-[#FCFCFC]/60 border border-slate-155 p-4 sm:p-5 rounded-2xl space-y-3.5 shadow-3xs">
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-widest border-l-4 border-indigo-600 pl-2 select-none flex justify-between items-center">
                      <span>Part B: Character & Behavioral Conduct</span>
                    </h4>

                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-x-5 gap-y-2 text-xs text-slate-800">
                      {selectedStudent.behaviour.map(b => (
                        <div key={b.name} className="flex items-center justify-between py-1 border-b border-dashed border-slate-150">
                          <span className="font-semibold text-slate-600">{b.name}</span>
                          <span className="font-mono font-black text-[10px] text-indigo-750 bg-indigo-50 border border-indigo-100/60 px-1.5 py-0.5 rounded-md">
                            {b.rating} / 5
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Grades Index Table & Rating Guide */}
                  <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Grades Scale Box */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5">
                      <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-widest border-l-4 border-slate-900 pl-2 select-none">
                        Grades Index Card
                      </h4>
                      <div className="border border-slate-150 rounded-xl overflow-hidden shadow-3xs">
                        <table className="w-full text-[10px] text-left border-collapse text-slate-600">
                          <thead>
                            <tr className="bg-[#FAF9F9] border-b border-slate-150 font-bold select-none text-slate-500">
                              <th className="py-1.5 px-2.5 border-r border-slate-150 w-16">Grade</th>
                              <th className="py-1.5 px-2.5">Details</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            <tr className="hover:bg-slate-50/50">
                              <td className="py-1.5 px-2.5 border-r border-slate-150 font-bold text-slate-800 bg-emerald-50 text-[10px] text-emerald-700">A+</td>
                              <td className="py-1.5 px-2.5 text-slate-500">Distinction 90 - 100</td>
                            </tr>
                            <tr className="hover:bg-slate-50/50">
                              <td className="py-1.5 px-2.5 border-r border-slate-150 font-bold text-slate-800 bg-green-50 text-[10px] text-green-700">A</td>
                              <td className="py-1.5 px-2.5 text-slate-500">Excellent 80 - 89</td>
                            </tr>
                            <tr className="hover:bg-slate-50/50">
                              <td className="py-1.5 px-2.5 border-r border-slate-150 font-bold text-slate-800 bg-sky-50 text-[10px] text-sky-700">B</td>
                              <td className="py-1.5 px-2.5 text-slate-500">Very Good 70 - 79</td>
                            </tr>
                            <tr className="hover:bg-slate-50/50">
                              <td className="py-1.5 px-2.5 border-r border-slate-150 font-bold text-slate-800 bg-amber-50 text-[10px] text-amber-700">C</td>
                              <td className="py-1.5 px-2.5 text-slate-500">Good 60 - 69</td>
                            </tr>
                            <tr className="hover:bg-slate-50/50">
                              <td className="py-1.5 px-2.5 border-r border-slate-150 font-bold text-slate-800 bg-orange-50 text-[10px] text-orange-700">D</td>
                              <td className="py-1.5 px-2.5 text-slate-500">Fair 50 - 59</td>
                            </tr>
                            <tr className="hover:bg-slate-50/50">
                              <td className="py-1.5 px-2.5 border-r border-slate-150 font-bold text-slate-800 bg-red-50 text-[10px] text-red-500">F</td>
                              <td className="py-1.5 px-2.5 text-slate-500">Fail Below 50</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Behavior Evaluation Guideline */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5">
                      <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-widest border-l-4 border-slate-900 pl-2 select-none">
                        Conduct Rating Scale
                      </h4>
                      <ul className="text-xs text-slate-500 space-y-1.5 font-bold pt-1.5">
                        <li className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] flex items-center justify-center font-mono">5</span>
                          <span>Excellent Standards</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-green-50 text-green-700 text-[10px] flex items-center justify-center font-mono">4</span>
                          <span>Very Good Behavior</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] flex items-center justify-center font-mono">3</span>
                          <span>Satisfactory Conduct</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-amber-50 text-amber-500 text-[10px] flex items-center justify-center font-mono">2</span>
                          <span>Fair / Passable</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-red-50 text-red-700 text-[10px] flex items-center justify-center font-mono">1</span>
                          <span>Needs Record Fix</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Part C: Remarks & Signatures Segment */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 pt-6 border-t border-dashed border-slate-200">
                  {/* Form Teacher Remark Callout */}
                  {(() => {
                    const displayTeacherName = selectedStudent.formTeacherName || (selectedStudent.className.startsWith('JSS') ? template.formTeacherJunior : template.formTeacherSenior);
                    const displayPrincipalName = template.principalName;
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
                              <div className="text-xs sm:text-sm font-serif italic text-indigo-950 font-semibold h-5 tracking-wide">
                                {displayTeacherName.replace("Mrs.", "").replace("Mr.","").trim()}
                              </div>
                              <span className="text-[8px] text-slate-400 uppercase tracking-wider block border-t border-slate-200 pt-0.5 mt-0.5">Signature & Stamp</span>
                            </div>
                          </div>
                        </div>

                        {/* Principal Assessment Callout */}
                        <div className="bg-[#FAF9F9] border border-slate-200 p-4 sm:p-5 rounded-2xl space-y-4 flex flex-col justify-between shadow-3xs">
                          <div>
                            <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-200/50 pb-1.5 select-none flex items-center gap-1.5">
                              <span>🎓 Principal's Performance Assessment</span>
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
                              <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-extrabold select-none">Authorized Principal</span>
                              <p className="font-black text-slate-900 text-[11px] sm:text-xs">{displayPrincipalName}</p>
                            </div>
                            <div className="text-right select-none">
                              <div className="text-xs sm:text-sm font-serif italic text-indigo-950 font-semibold h-5 tracking-wide">
                                {displayPrincipalName.replace("Dr.","").trim()}
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
                  <div className="flex flex-row sm:flex-col gap-4 sm:gap-1.5 justify-between bg-white border border-emerald-100/85 p-3 rounded-xl w-full sm:w-auto sm:min-w-[200px] text-xs shadow-3xs">
                    <div className="flex justify-between gap-4 w-full">
                      <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider select-none">Expected Resumption</span>
                      <span className="font-extrabold text-slate-800 text-right">{template.resumptionDate}</span>
                    </div>
                    <div className="flex justify-between gap-4 w-full border-t border-slate-100 pt-1.5 sm:pt-1 sm:mt-1">
                      <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider select-none">Required Fee</span>
                      <span className="font-black text-emerald-700 text-xs text-right">{template.nextTermFee || '₦45,000'}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Status bar stamp */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900 text-slate-200 p-4 rounded-xl relative z-10 text-xs border border-slate-800 shadow-sm animate-fade-in select-none">
                  <span className="flex items-center gap-2.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Candidate Academic Status: <strong className="text-white">Active and Promoted</strong></span>
                  </span>
                  
                  <span className="bg-indigo-700 text-white font-extrabold px-3 py-1 text-[10px] rounded tracking-widest uppercase font-bold">
                    ★ Official Seal Verified
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}


    </div>
  );
}
