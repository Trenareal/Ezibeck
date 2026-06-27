/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, School, GraduationCap, Plus, Save, Trash2, Edit2, CheckCircle, ShieldAlert, Users, TrendingUp, AlertCircle, FileSpreadsheet, Eye, EyeOff, Printer, UserCheck, LogOut, Database, Wifi, WifiOff, RefreshCw, CloudLightning, Lock, Search, Clock, Copy, Check, CloudUpload, CloudDownload } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { Student, ClassName, SubjectGrade, BehaviourRating, Workspace15Template, FacultyProfile, DbStatus, AuditLogEntry, ALL_CLASSES } from '../types';
import { createStudent, calculateStudentStats, calculateStudentStatsForTerm, calculateClassPositions, BEHAVIOUR_TRAITS, NURSERY_SUBJECTS, SCHOOL_INFO, getLetterAndRemark, calculateSubjectTotal, formatOrdinal, generateUnique6DigitPassword, getDeterministicPasscode, getStudentPasscodesFromOtherTerms } from '../utils/academicUtils';
import { logPasscodeEvent, getAuditLogs, clearAuditLogs } from '../utils/auditLogger';
import { dbService, mapDbFacultyToFrontend, mapDbStudentToFrontend } from '../lib/supabase';
import schoolBadge from '../assets/images/school_badge_1781423327113.jpg';
import { ReportCardWatermark, ScratchCardWatermark } from './ReportCardWatermark';
import { ReportCardPrintable } from './ReportCardPrintable';
import GuidelinesComponent from './GuidelinesComponent';
import AIAgentComponent from './AIAgentComponent';
import { safeStorage } from '../utils/safeStorage';

const localStorage = safeStorage;

const safeConfirm = (message: string): boolean => {
  try {
    return window.confirm(message);
  } catch (e) {
    console.warn('window.confirm blocked by sandbox, defaulting to true:', e);
    return true;
  }
};

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

interface TeacherDashboardProps {
  students: Student[];
  template: Workspace15Template;
  onBack: () => void;
  onUpdateStudents: (updatedList: Student[]) => void;
  onUpdateTemplate: (newTemplate: Workspace15Template) => void;
  dbStatus?: DbStatus;
  onPushLocalToSupabase?: () => Promise<{ success: boolean; message: string }>;
  onPullFromSupabase?: () => Promise<{ success: boolean; message: string }>;
  isSaving?: boolean;
}

export function isPasswordStandardCompliant(password: string): boolean {
  if (password.length < 8) return false;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  return hasUpperCase && hasLowerCase && hasNumbers && hasSymbol;
}

const DEFAULT_FACULTY: FacultyProfile[] = [
  { id: "ezekiel", name: "Dr. Ezekiel Beck", role: "Administrator (Head Principal)", avatar: "👨‍🏫", password: "Ezekiel@2026", email: "ezekiel@ezibeckacademy.edu.ng" },
  
  // 10 classes: Pre-Nursery, Nursery 1-3, Basic 1-6
  { id: "evelyn", name: "Mrs. Evelyn Ndu", role: "Form Teacher - Pre-Nursery", avatar: "👩‍🏫", password: "Evelyn@PreNursery", email: "evelyn@ezibeckacademy.edu.ng", assignedClass: "Pre-Nursery" },
  { id: "rose", name: "Mrs. Rose Mary", role: "Form Teacher - Nursery 1", avatar: "👩‍🏫", password: "Rose@Nursery1", email: "rose@ezibeckacademy.edu.ng", assignedClass: "Nursery 1" },
  { id: "kelvin", name: "Mr. Kelvin Joe", role: "Form Teacher - Nursery 2", avatar: "👨‍🏫", password: "Kelvin@Nursery2", email: "kelvin@ezibeckacademy.edu.ng", assignedClass: "Nursery 2" },
  { id: "mercy", name: "Mrs. Mercy Joy", role: "Form Teacher - Nursery 3", avatar: "👩‍🏫", password: "Mercy@Nursery3", email: "mercy@ezibeckacademy.edu.ng", assignedClass: "Nursery 3" },
  { id: "samuel", name: "Mr. Samuel Adele", role: "Form Teacher - Basic 1", avatar: "👨‍🏫", password: "Samuel@Basic1", email: "samuel@ezibeckacademy.edu.ng", assignedClass: "Basic 1" },
  { id: "blessing", name: "Mrs. Blessing Praise", role: "Form Teacher - Basic 2", avatar: "👩‍🏫", password: "Blessing@Basic2", email: "blessing@ezibeckacademy.edu.ng", assignedClass: "Basic 2" },
  { id: "patrick", name: "Mr. Patrick Obi", role: "Form Teacher - Basic 3", avatar: "👨‍💻", password: "Patrick@Basic3", email: "patrick@ezibeckacademy.edu.ng", assignedClass: "Basic 3" },
  { id: "victoria", name: "Mrs. Victoria Oge", role: "Form Teacher - Basic 4", avatar: "👩‍🏫", password: "Victoria@Basic4", email: "victoria@ezibeckacademy.edu.ng", assignedClass: "Basic 4" },
  { id: "emmanuel", name: "Mr. Emmanuel Eze", role: "Form Teacher - Basic 5", avatar: "👨‍💻", password: "Emmanuel@Basic5", email: "emmanuel@ezibeckacademy.edu.ng", assignedClass: "Basic 5" },
  { id: "juliet", name: "Mrs. Juliet Ngozi", role: "Form Teacher - Basic 6", avatar: "👩‍🏫", password: "Juliet@Basic6", email: "juliet@ezibeckacademy.edu.ng", assignedClass: "Basic 6" },

  // JSS1-3, SS1, SS2A-B, SS3A-B
  { id: "gladys", name: "Mrs. Gladys Alabi", role: "Form Teacher - JSS1", avatar: "👩‍🏫", password: "Gladys@Jss1", email: "gladys@ezibeckacademy.edu.ng", assignedClass: "JSS1" },
  { id: "anthony", name: "Mr. Anthony Okon", role: "Form Teacher - JSS2", avatar: "👨‍💻", password: "Anthony@Jss2", email: "anthony@ezibeckacademy.edu.ng", assignedClass: "JSS2" },
  { id: "sarah", name: "Mrs. Sarah John", role: "Form Teacher - JSS3", avatar: "👩‍🏫", password: "Sarah@Jss3", email: "sarah@ezibeckacademy.edu.ng", assignedClass: "JSS3" },
  { id: "benson", name: "Mr. Benson Chidi", role: "Form Teacher - SS1", avatar: "👨‍🏫", password: "Benson@Ss1", email: "benson@ezibeckacademy.edu.ng", assignedClass: "SS1" },
  { id: "florence", name: "Mrs. Florence Musa", role: "Form Teacher - SS2A (Science)", avatar: "👩‍🏫", password: "Florence@Ss2a", email: "florence.ss2a@ezibeckacademy.edu.ng", assignedClass: "SS2A" },
  { id: "maroger", name: "Mrs. Mabel Rogers", role: "Form Teacher - SS2B (Art)", avatar: "👩‍🏫", password: "Maro@2026", email: "maroger.ss2b@ezibeckacademy.edu.ng", assignedClass: "SS2B" },
  { id: "david", name: "Mr. David Ibrahim", role: "Form Teacher - SS3A (Science)", avatar: "👨‍💻", password: "David@Ss3a", email: "david.ss3a@ezibeckacademy.edu.ng", assignedClass: "SS3A" },
  { id: "spare", name: "Mr. Julius Spare", role: "Form Teacher - SS3B (Art)", avatar: "👨‍🏫", password: "Spare@2026", email: "spare.ss3b@ezibeckacademy.edu.ng", assignedClass: "SS3B" },

  // 3 Section Admins & Co-Admins
  { id: "nancy", name: "Mrs. Nancy Yusuf", role: "Head Teacher (Pre-Nursery to Basic 6)", avatar: "🏫", password: "Nancy@HeadTeacher", email: "nancy.head@ezibeckacademy.edu.ng" },
  { id: "justina", name: "Mrs. Justina Cole", role: "Junior Secondary Admin (JSS1 to JSS3)", avatar: "🏫", password: "Justina@Junior", email: "justina.junior@ezibeckacademy.edu.ng" },
  { id: "samson", name: "Mr. Samson Duke", role: "Senior Secondary Admin (SS1 to SS3B)", avatar: "🏫", password: "Samson@Senior", email: "samson.senior@ezibeckacademy.edu.ng" },
  { id: "coadmin", name: "Mr. Paul Coadmin", role: "Co-Administrator", avatar: "👨‍💻", password: "Coadmin@2026", email: "coadmin@ezibeckacademy.edu.ng" }
];

function alignFacultyProfiles(profiles: FacultyProfile[]): FacultyProfile[] {
  const oldToNewPassMap: Record<string, string> = {
    "admin": "Ezekiel@2026",
    "teacher1": "Gladys@Jss1",
    "teacher2": "Anthony@Jss2",
    "teacher3": "Sarah@Jss3",
    "teacher4": "Benson@Ss1",
    "teacher5": "Florence@Ss2a",
    "teacher6": "David@Ss3a",
    "maroger": "Maro@2026",
    "spare": "Spare@2026",
    "coadmin": "Coadmin@2026",
    "evelyn": "Evelyn@PreNursery",
    "rose": "Rose@Nursery1",
    "kelvin": "Kelvin@Nursery2",
    "mercy": "Mercy@Nursery3",
    "samuel": "Samuel@Basic1",
    "blessing": "Blessing@Basic2",
    "patrick": "Patrick@Basic3",
    "victoria": "Victoria@Basic4",
    "emmanuel": "Emmanuel@Basic5",
    "juliet": "Juliet@Basic6",
    "nancy": "Nancy@HeadTeacher",
    "justina": "Justina@Junior",
    "samson": "Samson@Senior"
  };

  const slots = [
    { key: 'Admin', check: (f: FacultyProfile) => f.id === 'ezekiel' || f.name.toLowerCase().includes('ezekiel'), def: DEFAULT_FACULTY[0] },
    
    // 10 primary classes
    { key: 'Pre-Nursery', check: (f: FacultyProfile) => f.assignedClass === 'Pre-Nursery', def: DEFAULT_FACULTY[1] },
    { key: 'Nursery 1', check: (f: FacultyProfile) => f.assignedClass === 'Nursery 1', def: DEFAULT_FACULTY[2] },
    { key: 'Nursery 2', check: (f: FacultyProfile) => f.assignedClass === 'Nursery 2', def: DEFAULT_FACULTY[3] },
    { key: 'Nursery 3', check: (f: FacultyProfile) => f.assignedClass === 'Nursery 3', def: DEFAULT_FACULTY[4] },
    { key: 'Basic 1', check: (f: FacultyProfile) => f.assignedClass === 'Basic 1', def: DEFAULT_FACULTY[5] },
    { key: 'Basic 2', check: (f: FacultyProfile) => f.assignedClass === 'Basic 2', def: DEFAULT_FACULTY[6] },
    { key: 'Basic 3', check: (f: FacultyProfile) => f.assignedClass === 'Basic 3', def: DEFAULT_FACULTY[7] },
    { key: 'Basic 4', check: (f: FacultyProfile) => f.assignedClass === 'Basic 4', def: DEFAULT_FACULTY[8] },
    { key: 'Basic 5', check: (f: FacultyProfile) => f.assignedClass === 'Basic 5', def: DEFAULT_FACULTY[9] },
    { key: 'Basic 6', check: (f: FacultyProfile) => f.assignedClass === 'Basic 6', def: DEFAULT_FACULTY[10] },

    // 8 secondary classes
    { key: 'JSS1', check: (f: FacultyProfile) => f.assignedClass === 'JSS1', def: DEFAULT_FACULTY[11] },
    { key: 'JSS2', check: (f: FacultyProfile) => f.assignedClass === 'JSS2', def: DEFAULT_FACULTY[12] },
    { key: 'JSS3', check: (f: FacultyProfile) => f.assignedClass === 'JSS3', def: DEFAULT_FACULTY[13] },
    { key: 'SS1', check: (f: FacultyProfile) => f.assignedClass === 'SS1', def: DEFAULT_FACULTY[14] },
    { key: 'SS2A', check: (f: FacultyProfile) => f.assignedClass === 'SS2A', def: DEFAULT_FACULTY[15] },
    { key: 'SS2B', check: (f: FacultyProfile) => f.assignedClass === 'SS2B', def: DEFAULT_FACULTY[16] },
    { key: 'SS3A', check: (f: FacultyProfile) => f.assignedClass === 'SS3A', def: DEFAULT_FACULTY[17] },
    { key: 'SS3B', check: (f: FacultyProfile) => f.assignedClass === 'SS3B', def: DEFAULT_FACULTY[18] },

    // 4 Admins
    { key: 'NancyHead', check: (f: FacultyProfile) => f.id === 'nancy' || f.role.toLowerCase().includes('head teacher'), def: DEFAULT_FACULTY[19] },
    { key: 'JustinaJunior', check: (f: FacultyProfile) => f.id === 'justina' || f.role.toLowerCase().includes('junior secondary'), def: DEFAULT_FACULTY[20] },
    { key: 'SamsonSenior', check: (f: FacultyProfile) => f.id === 'samson' || f.role.toLowerCase().includes('senior secondary'), def: DEFAULT_FACULTY[21] },
    { key: 'CoAdmin', check: (f: FacultyProfile) => f.id === 'coadmin' || f.id === 'maroger' || f.role.toLowerCase().includes('co-administrator'), def: DEFAULT_FACULTY[22] }
  ];

  const aligned: FacultyProfile[] = [];
  const assignedIds = new Set<string>();

  for (const slot of slots) {
    // Try matching by both exact ID and slot first
    let match = profiles.find(f => f.id === slot.def.id && slot.check(f) && !assignedIds.has(f.id));
    if (!match) {
      // If not found, match by slot check to support renamed/edited IDs
      match = profiles.find(f => slot.check(f) && !assignedIds.has(f.id));
    }

    if (match) {
      // Upgrade database placeholder generic names to slots default settings
      if (match.name === 'Administrator' || match.role === 'Admin') {
        match = {
          ...match,
          name: slot.def.name,
          role: slot.def.role,
          avatar: slot.def.avatar,
          email: slot.def.email || match.email,
          password: (match.password === 'admin123' || !match.password) ? slot.def.password : match.password
        };
      }
      aligned.push(match);
      assignedIds.add(match.id);
    } else {
      aligned.push(slot.def);
      assignedIds.add(slot.def.id);
    }
  }

  // Also preserve all extra/additional custom profiles so they never get deleted during database sync
  for (const p of profiles) {
    if (!assignedIds.has(p.id)) {
      // Filter out any leftover seeded or manual generic "Administrator" accounts so they get cleanly deleted
      const isLegacyAdmin = p.id === 'admin' || p.name === 'Administrator' || p.role === 'Admin' || p.role === 'Administrator' || p.name.includes('Administrator');
      const isForbiddenStaff = p.id.toLowerCase().startsWith('a0000') || p.id.toLowerCase() === 'a0000000';
      if (!isLegacyAdmin && !isForbiddenStaff) {
        aligned.push(p);
        assignedIds.add(p.id);
      }
    }
  }

  return aligned
    .filter(f => !f.id.toLowerCase().startsWith('a0000'))
    .map(f => {
    let updatedPass = f.password;
    if (f.password && oldToNewPassMap[f.password]) {
      updatedPass = oldToNewPassMap[f.password];
    } else if (f.id === 'ezekiel' && f.password === 'admin') {
      updatedPass = 'Ezekiel@2026';
    }
    const up = { ...f, password: updatedPass };
    if (up.id === 'ezekiel') {
      return { ...up, isRestricted: false };
    }
    return up;
  });
}

export default function TeacherDashboard({ 
  students, 
  template, 
  onBack, 
  onUpdateStudents, 
  onUpdateTemplate,
  dbStatus,
  onPushLocalToSupabase,
  onPullFromSupabase,
  isSaving = false
}: TeacherDashboardProps) {
  const [currentUser, setCurrentUser] = useState<FacultyProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('ezibeck_faculty_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          const oldToNewPassMap: Record<string, string> = {
            "admin": "Ezekiel@2026",
            "teacher1": "Gladys@Jss1",
            "teacher2": "Anthony@Jss2",
            "teacher3": "Sarah@Jss3",
            "teacher4": "Benson@Ss1",
            "teacher5": "Florence@Ss2a",
            "teacher6": "David@Ss3a",
            "maroger": "Maro@2026",
            "spare": "Spare@2026",
            "coadmin": "Coadmin@2026"
          };
          if (parsed && parsed.password && oldToNewPassMap[parsed.password]) {
            parsed.password = oldToNewPassMap[parsed.password];
            localStorage.setItem('ezibeck_faculty_user', JSON.stringify(parsed));
          }
          return parsed;
        } catch (e) {
          console.error('Error loading saved faculty user session', e);
        }
      }
    }
    return null;
  });

  const [focusedInputs, setFocusedInputs] = useState<Record<string, boolean>>({});

  // Sync staff user session to survive browser reloads
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      if (currentUser) {
        localStorage.setItem('ezibeck_faculty_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('ezibeck_faculty_user');
      }
    }
  }, [currentUser]);
  const isAdmin = currentUser && (
    currentUser.id === 'ezekiel' ||
    currentUser.role.toLowerCase().includes('principal') ||
    currentUser.role.toLowerCase().includes('admin')
  );
  const isCoAdmin = !!(currentUser && (
    currentUser.id === 'coadmin' ||
    currentUser.role.toLowerCase().includes('co-') ||
    currentUser.role.toLowerCase().includes('coadmin')
  ));
  const canAccessWorkspaceConfig = !!(currentUser && (
    currentUser.id === 'ezekiel' ||
    currentUser.role.toLowerCase() === 'administrator (head principal)' ||
    currentUser.role.toLowerCase() === 'administrator' ||
    currentUser.role.toLowerCase() === 'main admin'
  ));
  const [selectedClass, setSelectedClass] = useState<ClassName>('Pre-Nursery');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingReportStudent, setViewingReportStudent] = useState<Student | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [resetConfirmState, setResetConfirmState] = useState<'idle' | 'confirming'>('idle');
  const teacherPrintAreaRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (resetConfirmState === 'confirming') {
      const timer = setTimeout(() => {
        setResetConfirmState('idle');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [resetConfirmState]);

  const downloadTeacherPdf = async () => {
    if (isGeneratingPdf || !teacherPrintAreaRef.current || !viewingReportStudent) return;
    setIsGeneratingPdf(true);

    const element = teacherPrintAreaRef.current;
    
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
      element.style.height = '1448px';
      element.style.minHeight = '1448px';
      element.style.maxHeight = '1448px';
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
      
      const filename = `${template.schoolName.replace(/\s+/g, '_')}_Report_Sheet_${viewingReportStudent.id}_${viewingReportStudent.name.replace(/\s+/g, '_')}.pdf`;
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

  const generateSingleStudentPdf = (student: Student, indexInClass: number, classSize: number, activeTerm: string, template: Workspace15Template): jsPDF => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const stats = calculateStudentStatsForTerm(student, activeTerm);
    const positionStr = indexInClass !== -1 ? formatOrdinal(indexInClass + 1) : 'N/A';

    const primaryColor = [4, 120, 87];   // #047857 (Deep Emerald)
    const darkTextColor = [15, 23, 42];   // #0f172a (Charcoal Slate)
    const lightBgColor = [240, 253, 250];  // Light mint / teal bg
    const slateBorder = [226, 232, 240];  // Slate 200 border
    const mutedTextColor = [100, 116, 139]; // Slate 500 gray

    // Background crest watermark (Slightly smaller and higher contrast)
    doc.setDrawColor(240, 253, 250);
    doc.setLineWidth(0.4);
    doc.circle(105, 142, 40, 'S');
    doc.circle(105, 142, 38, 'S');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(220, 235, 230);
    doc.text(`${template.schoolName.toUpperCase()}  *  ${template.motto.toUpperCase()}  *`, 105, 116, { align: 'center' });

    // Draw real crest at top left
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.4);
    doc.circle(22, 21, 9, 'S');
    doc.setDrawColor(217, 119, 6); // Amber index
    doc.circle(22, 21, 7.5, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(template.schoolName.charAt(0).toUpperCase() || 'S', 22, 24.2, { align: 'center' });

    // School Title Header (Slightly compressed vertical offsets)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(template.schoolName.toUpperCase(), 35, 18);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.0);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`"${template.motto}"`, 35, 22.0);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.0);
    doc.setTextColor(75, 85, 99);
    doc.text(`${template.address}  |  Tel: ${template.phone}  |  Email: ${template.email}`, 35, 26.0);

    // Double horizontal divider line
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(10, 29.5, 200, 29.5);
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.12);
    doc.line(10, 30.3, 200, 30.3);

    // Report Card Section Banner Title
    doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
    doc.rect(10, 34, 190, 6.8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text(`OFFICIAL STUDENT REPORT SHEET  -  ${activeTerm.toUpperCase()} SESSION`, 105, 38.5, { align: 'center' });

    // Student Information Grid
    const infoY = 44;
    doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
    doc.setLineWidth(0.3);
    doc.rect(10, infoY, 190, 16, 'S');

    doc.line(10, infoY + 8, 200, infoY + 8); // horizontal mid divider
    doc.line(55, infoY, 55, infoY + 16); // vert 1
    doc.line(102, infoY, 102, infoY + 16); // vert 2
    doc.line(152, infoY, 152, infoY + 16); // vert 3

    // Row 1 Column 1
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.0);
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.text("FULL STUDENT NAME:", 13, infoY + 3);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.0);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    const trimmedName = student.name.length > 22 ? student.name.substring(0, 20) + "..." : student.name;
    doc.text(trimmedName, 13, infoY + 6.5);

    // Row 1 Column 2
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.0);
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.text("STUDENT ACCESS ID:", 58, infoY + 3);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.0);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text(student.id, 58, infoY + 6.5);

    // Row 1 Column 3
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.0);
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.text("GENDER / SEX:", 105, infoY + 3);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.0);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text(student.sex, 105, infoY + 6.5);

    // Row 1 Column 4
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.0);
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.text("AGE PROFILE:", 155, infoY + 3);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.0);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text(`${student.age} Years`, 155, infoY + 6.5);

    // Row 2 Column 1
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.0);
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.text("CLASS STANDARD:", 13, infoY + 11.0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.0);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text(student.className, 13, infoY + 14.5);

    // Row 2 Column 2
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.0);
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.text("ACADEMIC SESSION:", 58, infoY + 11.0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.0);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text(template.session, 58, infoY + 14.5);

    // Row 2 Column 3
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.0);
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.text("TERM CLOSING DATE:", 105, infoY + 11.0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.0);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text(template.termDate, 105, infoY + 14.5);

    // Row 2 Column 4
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.0);
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.text("RESUMPTION DATE:", 155, infoY + 11.0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.0);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text(template.resumptionDate, 155, infoY + 14.5);

    // 6. Subjects Grade Performance Grid Table (Compressed)
    const tableY = 64;
    const isThirdTerm = activeTerm === 'Third Term';
    const isSecondaryClass = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2A', 'SS2B', 'SS3A', 'SS3B'].includes((student.className || '').replace(/\s+/g, ''));
    const isSecondarySecondTerm = activeTerm === 'Second Term' && isSecondaryClass;

    const w = isThirdTerm ? {
      name: 50, test: 12, exam: 12, total: 12, t1: 11, t2: 11, t3: 11, avg: 13, grade: 11, rank: 11, remark: 36
    } : isSecondarySecondTerm ? {
      name: 54, test: 14, exam: 14, total: 14, t1: 16, t2: 0, t3: 0, avg: 0, grade: 13, rank: 13, remark: 52
    } : {
      name: 56, test: 18, exam: 18, total: 18, t1: 0, t2: 0, t3: 0, avg: 0, grade: 15, rank: 15, remark: 50
    };

    // Header Draw
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(10, tableY, 190, 5.8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);

    let currentX = 10;
    const drawTableHeaderText = (txt: string, colW: number, align: 'left' | 'center' = 'center') => {
      const textX = align === 'center' ? currentX + colW / 2 : currentX + 3;
      doc.text(txt, textX, tableY + 3.8, { align });
      currentX += colW;
    };

    drawTableHeaderText("SUBJECT PERFORMANCE SHEET", w.name, 'left');
    drawTableHeaderText("TEST", w.test);
    drawTableHeaderText("EXAM", w.exam);
    drawTableHeaderText("TOTAL", w.total);
    if (isThirdTerm) {
      drawTableHeaderText("1ST T", w.t1);
      drawTableHeaderText("2ND T", w.t2);
      drawTableHeaderText("3RD T", w.t3);
      drawTableHeaderText("SESS AVG", w.avg);
    } else if (isSecondarySecondTerm) {
      drawTableHeaderText("1ST T AVG", w.t1);
    }
    drawTableHeaderText("GRADE", w.grade);
    drawTableHeaderText("POSITION", w.rank);
    drawTableHeaderText("TEACHER REMARK", w.remark, 'left');

    doc.setFontSize(6.5);
    doc.setTextColor(31, 41, 55);
    doc.setLineWidth(0.15);
    doc.setDrawColor(218, 225, 233);

    let rowY = tableY + 5.8;
    const rowHeight = 4.8;

    student.subjects.forEach((subj, idx) => {
      if (idx % 2 === 1) {
         doc.setFillColor(252, 253, 253);
         doc.rect(10, rowY, 190, rowHeight, 'F');
      }

      const tot = (subj.testScore || 0) + (subj.examScore || 0);
      const fTermVal = subj.firstTermSummary !== undefined && subj.firstTermSummary !== 0 ? subj.firstTermSummary : Math.round(tot * 0.2);
      const sTermVal = subj.secondTermSummary !== undefined && subj.secondTermSummary !== 0 ? subj.secondTermSummary : Math.round(tot * 0.2);
      const tTermVal = subj.thirdTermSummary !== undefined && subj.thirdTermSummary !== 0 ? subj.thirdTermSummary : Math.round(tot * 0.6);
      const annualSum = fTermVal + sTermVal + tTermVal;

      const { letter, remark } = getLetterAndRemark(isThirdTerm ? annualSum : tot);

      currentX = 10;
      const writeCellText = (txt: string, colW: number, align: 'left' | 'center' = 'center', isBold = false) => {
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        const textX = align === 'center' ? currentX + colW / 2 : currentX + 3;
        doc.text(txt, textX, rowY + 3.2, { align });
        currentX += colW;
      };

      writeCellText(subj.name.toUpperCase(), w.name, 'left', true);
      writeCellText(String(subj.testScore || 0), w.test);
      writeCellText(String(subj.examScore || 0), w.exam);
      writeCellText(String(tot), w.total, 'center', true);

      if (isThirdTerm) {
        writeCellText(String(fTermVal), w.t1);
        writeCellText(String(sTermVal), w.t2);
        writeCellText(String(tTermVal), w.t3);
        writeCellText(String(annualSum), w.avg, 'center', true);
      } else if (isSecondarySecondTerm) {
        // Fetch or render first term average
        const fSummaryVal = subj.firstTermSummary !== undefined && subj.firstTermSummary !== 0 ? subj.firstTermSummary : Math.round(tot * 0.75);
        writeCellText(String(fSummaryVal) + "%", w.t1, 'center', true);
      }

      writeCellText(letter, w.grade, 'center', true);
      writeCellText(formatOrdinal(subj.position), w.rank);
      writeCellText(remark, w.remark, 'left');

      doc.line(10, rowY + rowHeight, 200, rowY + rowHeight);
      rowY += rowHeight;
    });

    doc.setLineWidth(0.3);
    doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
    doc.line(10, tableY, 10, rowY);
    doc.line(200, tableY, 200, rowY);

    // 7. Performance metrics
    const metricsY = rowY + 3;
    doc.setFontSize(7);

    const kpis = [
      { label: "CUMULATIVE TOTAL", value: `${stats.totalScore} / ${stats.maxPossibleScore}` },
      { label: "TERMLY AVERAGE", value: `${stats.avgScore.toFixed(1)}%` },
      { label: positionStr === 'N/A' ? "CLASS SIZE" : "POSITION IN CLASS", value: positionStr === 'N/A' ? `${classSize} Students` : `${positionStr} of ${classSize}` }
    ];

    const kpiWidth = 60;
    const kpiGap = 5;
    kpis.forEach((k, idx) => {
      const kpiX = 10 + idx * (kpiWidth + kpiGap);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.rect(kpiX, metricsY, kpiWidth, 9.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.0);
      doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
      doc.text(k.label, kpiX + kpiWidth/2, metricsY + 3.2, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.0);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(k.value, kpiX + kpiWidth/2, metricsY + 7.5, { align: 'center' });
    });

    // 8. Affective evaluations
    const domainsY = metricsY + 11.5;
    doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
    doc.rect(10, domainsY, 190, 4.8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text("PERSONALITY PROFILE & AFFECTIVE SKILLS EVALUATION (5-POINT SCALE)", 105, domainsY + 3.3, { align: 'center' });

    const ratingsY = domainsY + 4.8;
    doc.setLineWidth(0.15);
    doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);

    const midX = 105;
    const colSize = Math.ceil((student.behaviour || []).length / 2) || 4;

    const getRatingStars = (rating: number) => {
      return "O".repeat(rating) + ".".repeat(Math.max(0, 5 - rating)) + `  (${rating}/5)`;
    };

    (student.behaviour || []).forEach((b, idx) => {
      const isCol2 = idx >= colSize;
      const itemIdx = isCol2 ? idx - colSize : idx;
      const bX = isCol2 ? midX + 4 : 14;
      const bY = ratingsY + 2.5 + itemIdx * 3.8;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.0);
      doc.setTextColor(75, 85, 99);
      doc.text(`${b.name.toUpperCase()}:`, bX, bY);

      doc.setFont('courier', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(getRatingStars(b.rating), bX + 38, bY - 0.2);
    });

    const behaviourHeight = colSize * 3.8 + 2;
    const signatureY = ratingsY + behaviourHeight + 4;

    doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
    doc.setLineWidth(0.3);
    doc.line(10, signatureY - 1.5, 200, signatureY - 1.5);

    // 9. Comments (Compressed Paragraph Spacing)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

    doc.text("FORM TEACHER'S EVALUATION REMARK:", 12, signatureY);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.0);
    doc.setTextColor(15, 23, 42);
    const FTComment = (student.formTeacherRemark || "An excellent, dedicated student. consistent performance throughout.").replace(/\r?\n/g, ' ');
    doc.text(`"${FTComment}"`, 12, signatureY + 3.0, { maxWidth: 185 });

    const cleanClassName = (student.className || '').replace(/\s+/g, '');
    const isPreNurseryToBasic6 = ['Pre-Nursery', 'Nursery1', 'Nursery2', 'Nursery3', 'Basic1', 'Basic2', 'Basic3', 'Basic4', 'Basic5', 'Basic6'].includes(cleanClassName);
    const headmistressName = facultyProfiles.find(f => f.id === 'nancy')?.name || "Mrs. Nancy Yusuf";
    const signatoryName = isPreNurseryToBasic6 ? headmistressName : (template.principalName || "Dr. Ezekiel Beck");
    const assessmentVerdictLabel = isPreNurseryToBasic6 ? "HEADMISTRESS'S ASSESSMENT VERDICT:" : "PRINCIPAL'S ASSESSMENT VERDICT:";
    const signatoryTitle = isPreNurseryToBasic6 ? "HEADMISTRESS" : "PRINCIPAL";

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(assessmentVerdictLabel, 12, signatureY + 8.5);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.0);
    doc.setTextColor(15, 23, 42);
    const PRComment = (student.principalRemark || "Impressive terminal portfolio marks. Approved for publication.").replace(/\r?\n/g, ' ');
    doc.text(`"${PRComment}"`, 12, signatureY + 11.5, { maxWidth: 185 });

    // 10. Signatures and Official Stamp Circular Watermark
    const sigY = signatureY + 22;
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.25);

    doc.line(15, sigY, 60, sigY);
    doc.line(82, sigY, 127, sigY);
    doc.line(148, sigY, 193, sigY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.text("CLASS FORM TEACHER", 37.5, sigY + 2.5, { align: 'center' });
    doc.text(`${signatoryTitle} (${signatoryName.toUpperCase()})`, 104.5, sigY + 2.5, { align: 'center' });
    doc.text("PARENT / GUARDIAN SIGNATURE", 170.5, sigY + 2.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);

    const formTeacherNameStr = student.formTeacherName || "Form Educator";
    doc.text(formTeacherNameStr, 37.5, sigY - 1.2, { align: 'center' });
    doc.text(signatoryName, 104.5, sigY - 1.2, { align: 'center' });

    doc.setDrawColor(4, 120, 87);
    doc.setLineWidth(0.15);
    doc.circle(105, sigY - 7, 6.0, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(3.8);
    doc.setTextColor(4, 120, 87);
    doc.text("OFFICIAL STAMP", 105, sigY - 8.0, { align: 'center' });
    doc.text(template.schoolName.toUpperCase(), 105, sigY - 5.8, { align: 'center' });

    return doc;
  };

  const handleDownloadAllClassesZip = async () => {
    if (isDownloadingAllZip) return;
    setIsDownloadingAllZip(true);
    setZipProgress("Scanning student registry database...");

    try {
      const zip = new JSZip();
      const classes = ALL_CLASSES;
      
      // Global CSV report content
      let schoolWideCsv = "Class,Position,Student ID,Student Name,Gender,Cumulative Total,Average Score\n";
      let totalPdfsGenerated = 0;

      for (const cls of classes) {
        setZipProgress(`Compiling reports for class ${cls}...`);
        
        // Calculate class ranks of standard for this term exactly
        const sortedRoster = calculateClassPositions(students, cls, activeTermTab)
          .filter(s => s.className === cls);

        if (sortedRoster.length === 0) {
          // Add a placeholder/empty indicator file to represent empty folder structure nicely
          const classFolder = zip.folder(cls);
          if (classFolder) {
            classFolder.file("empty_class_notice.txt", `There are currently no registered students in class ${cls} inside the active ${activeTermTab} terminal registry.`);
          }
          continue;
        }

        const classFolder = zip.folder(cls);
        if (!classFolder) continue;

        // Populate CSV results data for this class
        let classCsv = "Position,Student ID,Student Name,Gender,Cumulative Total,Average Score\n";

        // Generate student sheets sequentially
        for (let i = 0; i < sortedRoster.length; i++) {
          const stud = sortedRoster[i];
          const position = i + 1;
          const stats = calculateStudentStatsForTerm(stud, activeTermTab);

          // Render programmatic fast PDF
          const doc = generateSingleStudentPdf(stud, i, sortedRoster.length, activeTermTab, template);
          const pdfBlob = doc.output('blob');

          // Add to class folder
          const filename = `${stud.id}_${stud.name.replace(/\s+/g, '_')}_Report.pdf`;
          classFolder.file(filename, pdfBlob);

          // Add to CSV reports
          const rowText = `${cls},${position},${stud.id},"${stud.name}",${stud.sex},${stats.totalScore},${stats.avgScore.toFixed(2)}%\n`;
          schoolWideCsv += rowText;

          const classRowText = `${position},${stud.id},"${stud.name}",${stud.sex},${stats.totalScore},${stats.avgScore.toFixed(2)}%\n`;
          classCsv += classRowText;

          totalPdfsGenerated++;
        }

        // Add class roster index report CSV safely inside class folder
        classFolder.file(`${cls}_Students_Roster_Positions.csv`, classCsv);
      }

      if (totalPdfsGenerated === 0) {
        setWarningMsg("No student slips are active in any class! Please register students to download compiled result ZIPs.");
        setTimeout(() => setWarningMsg(''), 4000);
        setIsDownloadingAllZip(false);
        return;
      }

      setZipProgress("Finalizing ZIP folder archive structure...");
      // Add general master school index CSV at the ZIP root envelope
      zip.file(`School_Wide_Students_Positions_Index_${activeTermTab.replace(/\s+/g, '_')}.csv`, schoolWideCsv);
      
      const content = await zip.generateAsync({ type: 'blob' });
      
      const sessionClean = template.session.replace(/\//g, '-');
      const termClean = activeTermTab.replace(/\s+/g, '_');
      const downloadFilename = `Ezibeck_Academy_All_Classes_Results_${termClean}_${sessionClean}.zip`;

      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = downloadFilename;
      link.click();

      triggerSuccess(`Successfully archived and downloaded result portfolio folder containing ${totalPdfsGenerated} student report cards!`);
    } catch (err) {
      console.error("Bulk ZIP compile failed:", err);
      setWarningMsg("Failed to compile results into a ZIP folder archive. Please retry.");
      setTimeout(() => setWarningMsg(''), 4000);
    } finally {
      setIsDownloadingAllZip(false);
    }
  };
  const [showDbSyncModal, setShowDbSyncModal] = useState(false);
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [syncDbResult, setSyncDbResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [sqlCopied, setSqlCopied] = useState(false);

  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState<{ id: string; name: string; className: ClassName; source: 'list' | 'view' | 'edit' } | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [warningMsg, setWarningMsg] = useState('');

  const triggerWarning = (msg: string) => {
    setWarningMsg(msg);
    setTimeout(() => setWarningMsg(''), 4500);
  };
  
  // Dashboard Sub-navigation Tab
  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'workspace' | 'staff' | 'audit' | 'passcodes' | 'guidelines' | 'calendar'>('roster');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Ezibeck Calendar Manager States
  const [dbCalendarEvents, setDbCalendarEvents] = useState<any[]>([]);
  const [calendarSelectedMonth, setCalendarSelectedMonth] = useState<number>(5); // June
  const [calendarEventTitle, setCalendarEventTitle] = useState('');
  const [calendarEventDesc, setCalendarEventDesc] = useState('');
  const [calendarEventType, setCalendarEventType] = useState<'holiday' | 'academic' | 'break' | 'exam'>('holiday');
  const [calendarEventDay, setCalendarEventDay] = useState<number>(1);
  const [calendarEventYearOptional, setCalendarEventYearOptional] = useState<string>('2026'); // 'annual' or '2024'...'2027'
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [isSavingCalendarEvent, setIsSavingCalendarEvent] = useState(false);

  const loadDbCalendarEvents = async () => {
    try {
      const events = await dbService.getCalendarEvents();
      if (events) {
        setDbCalendarEvents(events);
      }
    } catch (err) {
      console.warn("Could not fetch calendar events:", err);
    }
  };

  // Update audit logs state on mount and tab activations
  useEffect(() => {
    setAuditLogs(getAuditLogs());
    if (activeSubTab === 'calendar') {
      loadDbCalendarEvents();
    }
  }, [activeSubTab]);

  // Prevent unauthorized staff from hanging on the forbidden staff tab
  React.useEffect(() => {
    if (activeSubTab === 'staff' && (!currentUser || currentUser.id !== 'ezekiel')) {
      setActiveSubTab('roster');
    }
  }, [currentUser, activeSubTab]);

  // Prevent unauthorized staff from hanging on the forbidden workspace tab
  React.useEffect(() => {
    if (activeSubTab === 'workspace' && !canAccessWorkspaceConfig) {
      setActiveSubTab('roster');
    }
  }, [currentUser, activeSubTab, canAccessWorkspaceConfig]);

  const [activeTermTab, setActiveTermTab] = useState<'First Term' | 'Second Term' | 'Third Term'>(() => {
    if (template.currentTerm === 'First Term' || template.currentTerm === 'Second Term' || template.currentTerm === 'Third Term') {
      return template.currentTerm;
    }
    return 'First Term';
  });

  const isTermReadOnly = activeTermTab !== template.currentTerm;
  const editingIsSecondary = editingStudent ? ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2A', 'SS2B', 'SS3A', 'SS3B'].includes((editingStudent.className || '').replace(/\s+/g, '')) : false;

  // Print latest database issues or status to the system console when they occur
  useEffect(() => {
    if (dbStatus && dbStatus.error) {
      console.error("🔴 DATABASE SYNC FAILURE DETAILS:", dbStatus.error);
    }
  }, [dbStatus]);

  // Load faculty profiles from Supabase when database is connected/configured
  useEffect(() => {
    async function syncFacultyWithSupabase() {
      if (dbStatus && dbStatus.configured && dbStatus.connected) {
        try {
          const dbProfiles = await dbService.getFacultyProfiles();
          if (dbProfiles && dbProfiles.length > 0) {
            // Actively delete any pre-existing legacy/duplicate staff profiles that start with 'a0000'
            const badProfiles = dbProfiles.filter(p => p.id && p.id.toLowerCase().startsWith('a0000'));
            for (const bp of badProfiles) {
              await dbService.deleteFacultyProfile(bp.id).catch(err => {
                console.error("Failed to delete bad profile:", bp.id, err);
              });
            }

            const mapped = dbProfiles.map(mapDbFacultyToFrontend).filter(f => !f.id.toLowerCase().startsWith('a0000'));
            const aligned = alignFacultyProfiles(mapped).filter(f => !f.id.toLowerCase().startsWith('a0000'));

            // Sync any missing or default profiles back to Supabase
            for (const f of aligned) {
              await dbService.saveFacultyProfile(f).catch(err => {
                console.error("Failed to sync faculty profile to database:", f.name, err);
              });
            }

            // Clean up/delete any non-core/excessive profiles from the Supabase database
            const alignedIds = aligned.map(f => f.id);
            const extraProfiles = mapped.filter(f => !alignedIds.includes(f.id));
            for (const extra of extraProfiles) {
              await dbService.deleteFacultyProfile(extra.id).catch(err => {
                console.error("Failed to clean up non-core faculty profile:", extra.id, err);
              });
            }

            setFacultyProfiles(aligned);
            if (typeof window !== 'undefined') {
              localStorage.setItem('ezibeck_faculty_profiles', JSON.stringify(aligned));
            }
          } else {
            // Seed defaults to Supabase so it's always populated initially
            for (const f of DEFAULT_FACULTY) {
              await dbService.saveFacultyProfile(f).catch(err => {
                console.error("Failed to seed default faculty profile:", f.name, err);
              });
            }
            const refreshed = await dbService.getFacultyProfiles();
            if (refreshed && refreshed.length > 0) {
              const mapped = refreshed.map(mapDbFacultyToFrontend);
              const aligned = alignFacultyProfiles(mapped);
              setFacultyProfiles(aligned);
              if (typeof window !== 'undefined') {
                localStorage.setItem('ezibeck_faculty_profiles', JSON.stringify(aligned));
              }
            }
          }
        } catch (error) {
          console.error("Failed to load/sync/purge external faculty profiles from database:", error);
        }
      }
    }
    syncFacultyWithSupabase();
  }, [dbStatus?.connected]);

  // Dynamic Faculty Management State
  const [facultyProfiles, setFacultyProfiles] = useState<FacultyProfile[]>(() => {
    let initialList = DEFAULT_FACULTY;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ezibeck_faculty_profiles');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            initialList = parsed;
          }
        } catch (e) {
          console.error('Error parsing stored faculty profiles', e);
        }
      }
    }
    return alignFacultyProfiles(initialList).filter(f => !f.id.toLowerCase().startsWith('a0000'));
  });

  // Ensure Administrator is never restricted under any circumstances and clear any stale restriction
  useEffect(() => {
    const hasRestrictedAdmin = facultyProfiles.some(f => f.id === 'ezekiel' && f.isRestricted);
    if (hasRestrictedAdmin) {
      const updated = facultyProfiles.map(f => f.id === 'ezekiel' ? { ...f, isRestricted: false } : f);
      setFacultyProfiles(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('ezibeck_faculty_profiles', JSON.stringify(updated));
      }
      const ezekielProfile = updated.find(f => f.id === 'ezekiel');
      if (ezekielProfile && dbStatus && dbStatus.configured && dbStatus.connected) {
        dbService.saveFacultyProfile(ezekielProfile).catch(err => {
          console.error("Failed to unrestrict Ezekiel in database:", err);
        });
      }
    }
  }, [facultyProfiles, dbStatus?.connected, dbStatus?.configured]);

  // Synchronize viewingReportStudent and editingStudent subviews with browser history pop events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.view === 'teacher') {
        const { sub, studentId } = event.state;
        
        if (sub === 'view' && studentId) {
          const found = students.find(s => s.id === studentId);
          if (found) {
            setViewingReportStudent(found);
            setEditingStudent(null);
            return;
          }
        } else if (sub === 'edit' && studentId) {
          const found = students.find(s => s.id === studentId);
          if (found) {
            startEditStudent(found);
            setViewingReportStudent(null);
            return;
          }
        }
        
        // Return to normal registry roster lists on back button
        setViewingReportStudent(null);
        setEditingStudent(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [students]);

  // Listen to state changes to push history entries upon user action click
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      if (window.history) {
        const sub = viewingReportStudent ? 'view' : (editingStudent ? 'edit' : null);
        const studentId = viewingReportStudent ? viewingReportStudent.id : (editingStudent ? editingStudent.id : null);

        const curState = window.history.state;
        const isMatched = curState && 
                          curState.view === 'teacher' && 
                          curState.sub === sub && 
                          curState.studentId === studentId;

        if (!isMatched) {
          window.history.pushState({ view: 'teacher', sub, studentId }, '');
        }
      }
    } catch (e) {
      console.warn('TeacherDashboard history state check or pushState blocked:', e);
    }
  }, [viewingReportStudent, editingStudent]);

  // Faculty edit & class assignment states
  const [editingFaculty, setEditingFaculty] = useState<FacultyProfile | null>(null);
  const [editingFacultyId, setEditingFacultyId] = useState('');
  const [editingFacultyName, setEditingFacultyName] = useState('');
  const [editingFacultyEmail, setEditingFacultyEmail] = useState('');
  const [editingFacultyPassword, setEditingFacultyPassword] = useState('');
  const [editingFacultyClass, setEditingFacultyClass] = useState<ClassName | ''>('');
  const [editingFacultyRole, setEditingFacultyRole] = useState('');
  const [editingFacultyAvatar, setEditingFacultyAvatar] = useState('👩‍🏫');
  const [facultyPasswordError, setFacultyPasswordError] = useState('');

  // Faculty Password Reset via Simulated Email OTP states
  const [showFacultyReset, setShowFacultyReset] = useState(false);
  const [facultyResetEmail, setFacultyResetEmail] = useState('');
  const [facultyResetOtp, setFacultyResetOtp] = useState('');
  const [facultyResetStep, setFacultyResetStep] = useState<'request' | 'verify' | 'new_password'>('request');
  const [facultyGeneratedOtp, setFacultyGeneratedOtp] = useState('');
  const [facultyResetError, setFacultyResetError] = useState('');
  const [facultyResetSuccess, setFacultyResetSuccess] = useState('');
  const [facultySimulatedNotification, setFacultySimulatedNotification] = useState('');
  const [facultyNewPass, setFacultyNewPass] = useState('');
  const [facultyNewPassConfirm, setFacultyNewPassConfirm] = useState('');
  const [facultyResetUser, setFacultyResetUser] = useState<FacultyProfile | null>(null);

  // Faculty Login Credentials States
  const [pendingLoginUser, setPendingLoginUser] = useState<FacultyProfile | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [teacherPasswordInput, setTeacherPasswordInput] = useState('');
  const [showTeacherPass, setShowTeacherPass] = useState(false);
  const [showResetNewPass, setShowResetNewPass] = useState(false);
  const [showResetConfirmPass, setShowResetConfirmPass] = useState(false);
  const [teacherLoginError, setTeacherLoginError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Admin folder/ZIP execution state variables
  const [isDownloadingAllZip, setIsDownloadingAllZip] = useState(false);
  const [zipProgress, setZipProgress] = useState('');

  // Faculty Registration States
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [regName, setRegName] = useState('');
  const [regRole, setRegRole] = useState('Secondary Subject Educator');
  const [regAvatar, setRegAvatar] = useState('👩‍🏫');
  const [regPassword, setRegPassword] = useState('');

  // Passcode audit search and clear state controls
  const [auditSearch, setAuditSearch] = useState('');
  const [selectedPassClass, setSelectedPassClass] = useState('ALL');
  const handleClearAuditLogs = () => {
    if (safeConfirm("Are you sure you want to permanently clear all security passcode audit logs? This action is irreversible.")) {
      clearAuditLogs();
      setAuditLogs([]);
      triggerSuccess("🛡️ Security master audit ledger cleared successfully!");
    }
  };

  // Ezibeck Calendar Manager Handlers
  const handleSaveCalendarEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calendarEventTitle.trim()) {
      triggerWarning("Event title cannot be empty.");
      return;
    }
    const dayVal = Math.max(1, Math.min(31, Number(calendarEventDay) || 1));
    const monthVal = Number(calendarSelectedMonth);
    const yrVal = calendarEventYearOptional === 'annual' ? null : Number(calendarEventYearOptional);

    setIsSavingCalendarEvent(true);
    try {
      const payload = {
        id: editingEventId || undefined,
        title: calendarEventTitle.trim(),
        desc: calendarEventDesc.trim(),
        type: calendarEventType,
        day: dayVal,
        month: monthVal,
        year: yrVal
      };
      
      await dbService.saveCalendarEvent(payload);
      triggerSuccess(editingEventId ? "📅 Calendar event updated successfully!" : "📅 Calendar event created successfully!");
      
      // Reset form
      setCalendarEventTitle('');
      setCalendarEventDesc('');
      setCalendarEventDay(1);
      setEditingEventId(null);
      
      // Reload events
      await loadDbCalendarEvents();
    } catch (err: any) {
      triggerWarning(`Error saving calendar event: ${err?.message || err}`);
    } finally {
      setIsSavingCalendarEvent(false);
    }
  };

  const handleEditCalendarEvent = (evt: any) => {
    setEditingEventId(evt.id);
    setCalendarEventTitle(evt.title);
    setCalendarEventDesc(evt.desc || '');
    setCalendarEventType(evt.type);
    setCalendarEventDay(evt.day);
    setCalendarSelectedMonth(evt.month);
    setCalendarEventYearOptional(evt.year ? String(evt.year) : 'annual');
    triggerSuccess(`Editing event: "${evt.title}"`);
  };

  const handleDeleteCalendarEvent = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the calendar event "${title}"?`)) {
      return;
    }
    try {
      await dbService.deleteCalendarEvent(id);
      triggerSuccess("📅 Calendar event removed successfully!");
      await loadDbCalendarEvents();
    } catch (err: any) {
      triggerWarning(`Error deleting calendar event: ${err?.message || err}`);
    }
  };

  // 15 properties Editable Workspace template states
  const [tempSchoolName, setTempSchoolName] = useState(template.schoolName);
  const [tempMotto, setTempMotto] = useState(template.motto);
  const [tempAddress, setTempAddress] = useState(template.address);
  const [tempPhone, setTempPhone] = useState(template.phone);
  const [tempEmail, setTempEmail] = useState(template.email);
  const [tempResumptionDate, setTempResumptionDate] = useState(template.resumptionDate);
  const [tempTermDate, setTempTermDate] = useState(template.termDate);
  const [tempSession, setTempSession] = useState(template.session);
  const [tempCurrentTerm, setTempCurrentTerm] = useState(template.currentTerm);
  const [tempPrincipalName, setTempPrincipalName] = useState(template.principalName);
  const [tempFormTeacherJunior, setTempFormTeacherJunior] = useState(template.formTeacherJunior);
  const [tempFormTeacherSenior, setTempFormTeacherSenior] = useState(template.formTeacherSenior);
  const [tempNextTermFee, setTempNextTermFee] = useState(template.nextTermFee);
  const [tempDistinctionThreshold, setTempDistinctionThreshold] = useState(template.distinctionThreshold);
  const [tempPassThreshold, setTempPassThreshold] = useState(template.passThreshold);

  const [tempSchoolFee, setTempSchoolFee] = useState(template.schoolFee || "₦100,000.00");
  const [tempPartyFee, setTempPartyFee] = useState(template.partyFee || "₦15,000.00");
  const [tempEnrollmentFee, setTempEnrollmentFee] = useState(template.enrollmentFee || "₦15,000.00");
  const [tempBookFee, setTempBookFee] = useState(template.bookFee || "₦20,000.00");

  // Nursery section fees (Pre-Nursery to Nursery 3)
  const [tempSchoolFeeNursery, setTempSchoolFeeNursery] = useState(template.schoolFeeNursery || template.schoolFee || "₦100,000.00");
  const [tempPartyFeeNursery, setTempPartyFeeNursery] = useState(template.partyFeeNursery || template.partyFee || "₦15,000.00");
  const [tempEnrollmentFeeNursery, setTempEnrollmentFeeNursery] = useState(template.enrollmentFeeNursery || template.enrollmentFee || "₦15,000.00");
  const [tempBookFeeNursery, setTempBookFeeNursery] = useState(template.bookFeeNursery || template.bookFee || "₦20,000.00");

  // Primary section fees (Basic 1 to 6)
  const [tempSchoolFeePrimary, setTempSchoolFeePrimary] = useState(template.schoolFeePrimary || template.schoolFee || "₦100,000.00");
  const [tempPartyFeePrimary, setTempPartyFeePrimary] = useState(template.partyFeePrimary || template.partyFee || "₦15,000.00");
  const [tempEnrollmentFeePrimary, setTempEnrollmentFeePrimary] = useState(template.enrollmentFeePrimary || template.enrollmentFee || "₦15,000.00");
  const [tempBookFeePrimary, setTempBookFeePrimary] = useState(template.bookFeePrimary || template.bookFee || "₦20,000.00");

  // Junior Secondary section fees (JSS1 to JSS3)
  const [tempSchoolFeeJunior, setTempSchoolFeeJunior] = useState(template.schoolFeeJunior || template.schoolFee || "₦100,000.00");
  const [tempPartyFeeJunior, setTempPartyFeeJunior] = useState(template.partyFeeJunior || template.partyFee || "₦15,000.00");
  const [tempEnrollmentFeeJunior, setTempEnrollmentFeeJunior] = useState(template.enrollmentFeeJunior || template.enrollmentFee || "₦15,000.00");
  const [tempBookFeeJunior, setTempBookFeeJunior] = useState(template.bookFeeJunior || template.bookFee || "₦20,000.00");

  // Senior Secondary section fees (SS1 to SS3)
  const [tempSchoolFeeSenior, setTempSchoolFeeSenior] = useState(template.schoolFeeSenior || template.schoolFee || "₦100,000.00");
  const [tempPartyFeeSenior, setTempPartyFeeSenior] = useState(template.partyFeeSenior || template.partyFee || "₦15,000.00");
  const [tempEnrollmentFeeSenior, setTempEnrollmentFeeSenior] = useState(template.enrollmentFeeSenior || template.enrollmentFee || "₦15,000.00");
  const [tempBookFeeSenior, setTempBookFeeSenior] = useState(template.bookFeeSenior || template.bookFee || "₦20,000.00");

  // Synchronize dynamic template modifications
  React.useEffect(() => {
    setTempSchoolName(template.schoolName);
    setTempMotto(template.motto);
    setTempAddress(template.address);
    setTempPhone(template.phone);
    setTempEmail(template.email);
    setTempResumptionDate(template.resumptionDate);
    setTempTermDate(template.termDate);
    setTempSession(template.session);
    setTempCurrentTerm(template.currentTerm);
    if (template.currentTerm === 'First Term' || template.currentTerm === 'Second Term' || template.currentTerm === 'Third Term') {
      setActiveTermTab(template.currentTerm);
    }
    setTempPrincipalName(template.principalName);
    setTempFormTeacherJunior(template.formTeacherJunior);
    setTempFormTeacherSenior(template.formTeacherSenior);
    setTempNextTermFee(template.nextTermFee);
    setTempDistinctionThreshold(template.distinctionThreshold);
    setTempPassThreshold(template.passThreshold);
    setTempPortalLocked(template.portalLocked || false);
    
    setTempSchoolFee(template.schoolFee || "₦100,000.00");
    setTempPartyFee(template.partyFee || "₦15,000.00");
    setTempEnrollmentFee(template.enrollmentFee || "₦15,000.00");
    setTempBookFee(template.bookFee || "₦20,000.00");

    setTempSchoolFeeNursery(template.schoolFeeNursery || template.schoolFee || "₦100,000.00");
    setTempPartyFeeNursery(template.partyFeeNursery || template.partyFee || "₦15,000.00");
    setTempEnrollmentFeeNursery(template.enrollmentFeeNursery || template.enrollmentFee || "₦15,000.00");
    setTempBookFeeNursery(template.bookFeeNursery || template.bookFee || "₦20,000.00");

    setTempSchoolFeePrimary(template.schoolFeePrimary || template.schoolFee || "₦100,000.00");
    setTempPartyFeePrimary(template.partyFeePrimary || template.partyFee || "₦15,000.00");
    setTempEnrollmentFeePrimary(template.enrollmentFeePrimary || template.enrollmentFee || "₦15,000.00");
    setTempBookFeePrimary(template.bookFeePrimary || template.bookFee || "₦20,000.00");

    setTempSchoolFeeJunior(template.schoolFeeJunior || template.schoolFee || "₦100,000.00");
    setTempPartyFeeJunior(template.partyFeeJunior || template.partyFee || "₦15,000.00");
    setTempEnrollmentFeeJunior(template.enrollmentFeeJunior || template.enrollmentFee || "₦15,000.00");
    setTempBookFeeJunior(template.bookFeeJunior || template.bookFee || "₦20,000.00");

    setTempSchoolFeeSenior(template.schoolFeeSenior || template.schoolFee || "₦100,000.00");
    setTempPartyFeeSenior(template.partyFeeSenior || template.partyFee || "₦15,000.00");
    setTempEnrollmentFeeSenior(template.enrollmentFeeSenior || template.enrollmentFee || "₦15,000.00");
    setTempBookFeeSenior(template.bookFeeSenior || template.bookFee || "₦20,000.00");
  }, [template]);

  // Enforce dynamic staff account restriction live and dynamically propagate credential changes (username/password/name)
  React.useEffect(() => {
    if (currentUser) {
      // Find matching live profile from facultyProfiles loaded from Supabase database by ID first to ensure precise session tracking
      const activeProfile = facultyProfiles.find(p => p.id === currentUser.id) || facultyProfiles.find(p => 
        (currentUser.assignedClass && p.assignedClass === currentUser.assignedClass)
      );

      if (activeProfile) {
        if (activeProfile.isRestricted && currentUser.id !== 'ezekiel') {
          setCurrentUser(null);
          setEditingStudent(null);
          setViewingReportStudent(null);
          setTeacherLoginError('Your current educator session was restricted by the administrator.');
        } else if (
          activeProfile.id !== currentUser.id ||
          activeProfile.password !== currentUser.password ||
          activeProfile.name !== currentUser.name ||
          activeProfile.email !== currentUser.email ||
          activeProfile.avatar !== currentUser.avatar
        ) {
          // Propagate dynamic updates (changed Username ID, password, or name) directly to the active session
          setCurrentUser(activeProfile);
          if (typeof window !== 'undefined') {
            localStorage.setItem('ezibeck_faculty_user', JSON.stringify(activeProfile));
          }
        }
      }
    }
  }, [facultyProfiles, currentUser]);

  // New Student input fields including password
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentSex, setNewStudentSex] = useState<'Male' | 'Female'>('Male');
  const [newStudentAge, setNewStudentAge] = useState(12);
  const [newStudentPassword, setNewStudentPassword] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());

  // Auto-generate a unique 6-digit passcode to avoid matching other term passwords for the same student name
  useEffect(() => {
    if (showAddForm) {
      const studentName = newStudentName.trim() || 'Pre-Launch';
      const uniquePass = generateUnique6DigitPassword(studentName, '');
      setNewStudentPassword(uniquePass);
    }
  }, [newStudentName, showAddForm]);

  // Edit Student form fields state including password
  const [editAge, setEditAge] = useState(12);
  const [editSex, setEditSex] = useState<'Male' | 'Female'>('Male');
  const [editPassword, setEditPassword] = useState('123456');
  const [editAttendancePresent, setEditAttendancePresent] = useState(100);
  const [editAttendanceTotal, setEditAttendanceTotal] = useState(110);
  const [editSubjects, setEditSubjects] = useState<SubjectGrade[]>([]);
  const [editBehaviour, setEditBehaviour] = useState<BehaviourRating[]>([]);
  const [editFormComment, setEditFormComment] = useState('');
  const [editPrincipalRemark, setEditPrincipalRemark] = useState('');
  const [editTeacherName, setEditTeacherName] = useState('');
  const [editPrincipalName, setEditPrincipalName] = useState('');
  const [editResumeDate, setEditResumeDate] = useState('2026-09-14');
  const [isSavingScores, setIsSavingScores] = useState(false);
  const [tempPortalLocked, setTempPortalLocked] = useState(template.portalLocked || false);
  const [isLoadingStudentData, setIsLoadingStudentData] = useState(false);

  // useEffect Hook to load latest saved student data directly from Supabase upon reopening the editor
  useEffect(() => {
    if (!editingStudent) return;
    
    let active = true;
    async function loadLatestDbData() {
      if (dbStatus && dbStatus.configured) {
        setIsLoadingStudentData(true);
        try {
          const rawDbData = await dbService.getStudentById(editingStudent.id);
          if (rawDbData && active) {
            const freshStudent = mapDbStudentToFrontend(rawDbData);
            
            // Re-apply values to edit form states to ensure inputs are never blank/stale
            setEditAge(freshStudent.age);
            setEditSex(freshStudent.sex);
            setEditPassword(freshStudent.password || '123456');
            setEditAttendancePresent(freshStudent.attendancePresent);
            setEditAttendanceTotal(freshStudent.attendanceTotal);
            
            let subjectsListToEdit = [...freshStudent.subjects];
            if (activeTermTab === 'Third Term') {
              const baseId = freshStudent.id.split('_')[0];
              try {
                const firstTermKey = 'ezibeck_students_first_term';
                const secondTermKey = 'ezibeck_students_second_term';
                const firstTermData = typeof window !== 'undefined' ? localStorage.getItem(firstTermKey) : null;
                const secondTermData = typeof window !== 'undefined' ? localStorage.getItem(secondTermKey) : null;
                
                const parsedFirst = firstTermData ? JSON.parse(firstTermData) : [];
                const parsedSecond = secondTermData ? JSON.parse(secondTermData) : [];
                const firstTermStuds: Student[] = Array.isArray(parsedFirst) ? parsedFirst : [];
                const secondTermStuds: Student[] = Array.isArray(parsedSecond) ? parsedSecond : [];
                
                const matchingFirstStudent = firstTermStuds.find(s => s.id.startsWith(baseId));
                const matchingSecondStudent = secondTermStuds.find(s => s.id.startsWith(baseId));
                
                subjectsListToEdit = subjectsListToEdit.map(subj => {
                  let firstTermVal = subj.firstTermSummary !== undefined ? subj.firstTermSummary : 0;
                  let secondTermVal = subj.secondTermSummary !== undefined ? subj.secondTermSummary : 0;
                  let thirdTermVal = subj.thirdTermSummary !== undefined ? subj.thirdTermSummary : 0;
                  
                  if (firstTermVal === 0 && matchingFirstStudent) {
                    const fs = matchingFirstStudent.subjects.find(s => s.name.toLowerCase() === subj.name.toLowerCase());
                    if (fs) {
                      const fsTotal = (fs.testScore || 0) + (fs.examScore || 0);
                      firstTermVal = Math.round(fsTotal * 0.2);
                    }
                  }
                  if (secondTermVal === 0 && matchingSecondStudent) {
                    const ss = matchingSecondStudent.subjects.find(s => s.name.toLowerCase() === subj.name.toLowerCase());
                    if (ss) {
                      const ssTotal = (ss.testScore || 0) + (ss.examScore || 0);
                      secondTermVal = Math.round(ssTotal * 0.2);
                    }
                  }
                  if (thirdTermVal === 0) {
                    const currentTotal = (subj.testScore || 0) + (subj.examScore || 0);
                    thirdTermVal = Math.round(currentTotal * 0.6);
                  }
                  
                  return {
                    ...subj,
                    firstTermSummary: firstTermVal,
                    secondTermSummary: secondTermVal,
                    thirdTermSummary: thirdTermVal
                  };
                });
              } catch (e) {
                console.error("Auto pre-populating summaries failed:", e);
              }
            }

            setEditSubjects(subjectsListToEdit);
            setEditBehaviour([...freshStudent.behaviour]);
            setEditFormComment(freshStudent.formTeacherRemark);
            setEditPrincipalRemark(freshStudent.principalRemark || '');
            setEditTeacherName(freshStudent.formTeacherName);
            setEditPrincipalName(freshStudent.principalName);
            setEditResumeDate(freshStudent.resumptionDate);
          }
        } catch (e: any) {
          console.error(`[Supabase Error] Unable to retrieve latest scores for student ID: ${editingStudent.id}`, e);
        } finally {
          if (active) setIsLoadingStudentData(false);
        }
      }
    }

    loadLatestDbData();

    return () => {
      active = false;
    };
  }, [editingStudent?.id]);

  // Trigger quick alerts helper
  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };



  // Staff registration helper
  const handleRegisterStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regPassword) return;

    const newFaculty: FacultyProfile = {
      id: "staff_" + Date.now(),
      name: regName.trim(),
      role: regRole,
      avatar: regAvatar,
      password: regPassword
    };

    const updated = [...facultyProfiles, newFaculty];
    setFacultyProfiles(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ezibeck_faculty_profiles', JSON.stringify(updated));
    }

    if (dbStatus && dbStatus.configured && dbStatus.connected) {
      dbService.saveFacultyProfile(newFaculty).catch(err => {
        console.error("Failed to sync registered staff to Supabase:", err);
      });
    }

    setRegName('');
    setRegPassword('');
    setShowRegisterForm(false);
    triggerSuccess(`Registered and activated credentials for ${newFaculty.name} successfully!`);
  };

  // Save edited teacher profile and class assignment
  const handleSaveFacultyEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaculty) return;

    const trimmedPassword = editingFacultyPassword.trim();
    if (!isPasswordStandardCompliant(trimmedPassword)) {
      setFacultyPasswordError("Requires: 8+ chars, 1 uppercase, 1 lowercase, 1 number, & 1 symbol.");
      return;
    }

    const newId = editingFacultyId.trim().toLowerCase() || editingFaculty.id;
    const updatedProfile = {
      ...editingFaculty,
      id: newId,
      name: editingFacultyName.trim(),
      email: editingFacultyEmail.trim(),
      password: editingFacultyPassword.trim(),
      assignedClass: editingFacultyClass || undefined,
      avatar: editingFacultyAvatar,
      role: editingFacultyClass 
        ? `Form Teacher - ${editingFacultyClass}` 
        : editingFacultyRole
    };

    const updated = facultyProfiles.map(f => {
      if (f.id === editingFaculty.id) {
        return updatedProfile;
      }
      return f;
    });

    setFacultyProfiles(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ezibeck_faculty_profiles', JSON.stringify(updated));
    }

    if (dbStatus && dbStatus.configured && dbStatus.connected) {
      if (editingFaculty.id !== newId) {
        dbService.deleteFacultyProfile(editingFaculty.id)
          .then(() => dbService.saveFacultyProfile(updatedProfile))
          .catch(err => {
            console.error("Failed to sync faculty ID rename update to Supabase:", err);
          });
      } else {
        dbService.saveFacultyProfile(updatedProfile).catch(err => {
          console.error("Failed to sync faculty edit updates to Supabase:", err);
        });
      }
    }

    // Update active user session if the logged-in staff member edited their own profile details
    if (currentUser && currentUser.id === editingFaculty.id) {
      setCurrentUser(updatedProfile);
      if (typeof window !== 'undefined') {
        localStorage.setItem('ezibeck_faculty_user', JSON.stringify(updatedProfile));
      }
    }

    setEditingFaculty(null);
    triggerSuccess(`Successfully saved class assignment and profile updates for ${editingFacultyName}!`);
  };

  // Staff Login action
  const handleVerifyTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;

    const matchedUser = facultyProfiles.find(p => 
      p.id.toLowerCase() === usernameInput.trim().toLowerCase() ||
      p.name.toLowerCase() === usernameInput.trim().toLowerCase() ||
      p.name.toLowerCase().replace(/^(dr\.|mr\.|mrs\.|prof\.)\s+/i, '').startsWith(usernameInput.trim().toLowerCase())
    );

    if (!matchedUser) {
      setTeacherLoginError('Username / Staff ID not found.');
      return;
    }

    if (matchedUser.isRestricted) {
      setTeacherLoginError('This educator account has been restricted by the Administrator. Please contact the School Administrator.');
      return;
    }

    const correctPassword = matchedUser.password || 'Ezekiel@2026';
    if (teacherPasswordInput === correctPassword) {
      setCurrentUser(matchedUser);
      if (typeof window !== 'undefined') {
        if (rememberMe) {
          localStorage.setItem('ezibeck_faculty_user', JSON.stringify(matchedUser));
        } else {
          localStorage.removeItem('ezibeck_faculty_user');
        }
      }
      setTeacherPasswordInput('');
      setUsernameInput('');
      setTeacherLoginError('');
      triggerSuccess(`Successfully logged in as ${matchedUser.name}`);
    } else {
      setTeacherLoginError('Incorrect faculty access password code.');
    }
  };

  const handleFacultySendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const matched = facultyProfiles.find(p => p.email?.toLowerCase().trim() === facultyResetEmail.trim().toLowerCase());
    if (!matched) {
      setFacultyResetError('No staff profile registered with this email address.');
      return;
    }
    setFacultyResetError('');
    setFacultyResetUser(matched);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setFacultyGeneratedOtp(code);
    setFacultyResetStep('verify');
    setFacultySimulatedNotification(`💌 TCH-OTP Code for ${matched.name} sent to ${matched.email}: ${code}`);
    setFacultyResetSuccess(`Passcode OTP code generated and sent to: ${matched.email}`);
  };

  const handleFacultyVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (facultyResetOtp === facultyGeneratedOtp) {
      setFacultyResetStep('new_password');
      setFacultyResetError('');
      setFacultyResetSuccess('OTP passcode verified successfully! Set your new access passcode key below.');
    } else {
      setFacultyResetError('Incorrect verification OTP passcode key. Check simulated inbox.');
    }
  };

  const handleFacultyConfirmNewPass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!facultyResetUser) return;
    if (!isPasswordStandardCompliant(facultyNewPass)) {
      setFacultyResetError('Password must be at least 8 characters long, and contain at least one uppercase letter, one lowercase letter, one number, and one symbol or special character.');
      return;
    }
    if (facultyNewPass !== facultyNewPassConfirm) {
      setFacultyResetError('Passcodes do not match. Please re-enter.');
      return;
    }

    const updatedUser = { ...facultyResetUser, password: facultyNewPass };
    const updated = facultyProfiles.map(f => {
      if (f.id === facultyResetUser.id) {
        return updatedUser;
      }
      return f;
    });

    setFacultyProfiles(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ezibeck_faculty_profiles', JSON.stringify(updated));
    }

    if (dbStatus && dbStatus.configured && dbStatus.connected) {
      dbService.saveFacultyProfile(updatedUser).catch(err => {
        console.error("Failed to sync OTP password update to Supabase:", err);
      });
    }

    setFacultyResetSuccess('Security passcode updated successfully! Please login with your new key.');
    setFacultyNewPass('');
    setFacultyNewPassConfirm('');
    setFacultyResetStep('request');
    setShowFacultyReset(false);
    setFacultySimulatedNotification('');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setEditingStudent(null);
    setShowAddForm(false);
  };

  // Get allowed classes for current user dynamic roles
  const allowedClasses: ClassName[] = React.useMemo(() => {
    if (!currentUser) return ALL_CLASSES;
    const matchProfile = facultyProfiles.find(f => f.id === currentUser.id);
    const roleStr = ((matchProfile?.role || currentUser.role) || '').toLowerCase();

    // 1. The main admin should be the only one that has access to the workspace configuration, and has access to all classes
    if (currentUser.id === 'ezekiel' || roleStr === 'administrator (head principal)' || roleStr === 'administrator' || roleStr === 'main admin') {
      return ALL_CLASSES;
    }

    // 2. The nursery admin should only have access to pre-nursery, Nursery 1, Nursery 2, and Nursery 3
    if (roleStr.includes('nursery admin') || roleStr.includes('nursery section admin')) {
      return ['Pre-Nursery', 'Nursery 1', 'Nursery 2', 'Nursery 3'];
    }

    // 3. The basic admin should have access to basic 1 to 6
    if (roleStr.includes('basic admin') || roleStr.includes('primary admin') || roleStr.includes('primary section admin') || roleStr.includes('head teacher') || currentUser.id === 'nancy') {
      return ['Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5', 'Basic 6'];
    }

    // 4. The principal should access to jss1 to ss3b
    if (
      roleStr.includes('principal') || 
      roleStr.includes('junior secondary admin') || 
      roleStr.includes('junior secondary section admin') || 
      roleStr.includes('senior secondary admin') || 
      roleStr.includes('senior secondary section admin') ||
      currentUser.id === 'justina' || 
      currentUser.id === 'samson'
    ) {
      return ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2A', 'SS2B', 'SS3A', 'SS3B'];
    }

    const assigned = matchProfile?.assignedClass || currentUser.assignedClass;
    
    if (currentUser.id !== 'ezekiel' && !roleStr.includes('administrator') && assigned) {
      return [assigned];
    }
    
    return ALL_CLASSES;
  }, [currentUser, facultyProfiles]);

  // Keep selected class parameter within bounds when roles change
  React.useEffect(() => {
    if (currentUser && !allowedClasses.includes(selectedClass)) {
      setSelectedClass(allowedClasses[0]);
    }
  }, [currentUser, allowedClasses, selectedClass]);

  // Filter students showing in the selected class
  const classStudents = students.filter(s => s.className === selectedClass);

  // Stats for current class overview
  const totalInClass = classStudents.length;
  const highestScore = classStudents.length > 0 
    ? Math.max(...classStudents.map(s => calculateStudentStatsForTerm(s, activeTermTab).totalScore))
    : 0;
  const maxClassCumulative = classStudents.length > 0
    ? (classStudents[0].subjects.length * 100)
    : 1000;
  const averageClassScorePercent = classStudents.length > 0
    ? (classStudents.reduce((sum, s) => sum + calculateStudentStatsForTerm(s, activeTermTab).avgScore, 0) / classStudents.length).toFixed(1)
    : "0.0";

  // Create Student
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const newIdx = students.filter(s => s.className === selectedClass).length;
    const added = createStudent(newStudentName.trim(), selectedClass, newIdx, activeTermTab);
    added.age = newStudentAge;
    added.sex = newStudentSex;
    added.password = newStudentPassword || Math.floor(100000 + Math.random() * 900000).toString();
    
    // Add student, trigger ranking refresh
    let refreshed = [...students, added];
    refreshed = calculateClassPositions(refreshed, selectedClass, activeTermTab);
    
    onUpdateStudents(refreshed);
    
    // Log passcode generation event
    logPasscodeEvent({
      studentId: added.id,
      studentName: added.name,
      studentClass: added.className,
      action: 'Created',
      performedBy: currentUser?.name || 'Academic Educator',
      newPasscode: added.password || '123456'
    });

    setNewStudentName('');
    setNewStudentPassword(Math.floor(100000 + Math.random() * 900000).toString());
    setShowAddForm(false);
    triggerSuccess(`Added ${added.name} of school standard JSS1-SS3 registration catalog!`);
  };

  // Start Editing Student scores
  const startEditStudent = (student: Student) => {
    setEditingStudent(student);
    setEditAge(student.age);
    setEditSex(student.sex);
    setEditPassword(student.password || '123456');
    setEditAttendancePresent(student.attendancePresent);
    setEditAttendanceTotal(student.attendanceTotal);
    
    let subjectsListToEdit = [...student.subjects];
    if (activeTermTab === 'Third Term') {
      const baseId = student.id.split('_')[0];
      try {
        const firstTermKey = 'ezibeck_students_first_term';
        const secondTermKey = 'ezibeck_students_second_term';
        const firstTermData = typeof window !== 'undefined' ? localStorage.getItem(firstTermKey) : null;
        const secondTermData = typeof window !== 'undefined' ? localStorage.getItem(secondTermKey) : null;
        
        const parsedFirst = firstTermData ? JSON.parse(firstTermData) : [];
        const parsedSecond = secondTermData ? JSON.parse(secondTermData) : [];
        const firstTermStuds: Student[] = Array.isArray(parsedFirst) ? parsedFirst : [];
        const secondTermStuds: Student[] = Array.isArray(parsedSecond) ? parsedSecond : [];
        
        const matchingFirstStudent = firstTermStuds.find(s => s.id.startsWith(baseId));
        const matchingSecondStudent = secondTermStuds.find(s => s.id.startsWith(baseId));
        
        subjectsListToEdit = subjectsListToEdit.map(subj => {
          let firstTermVal = subj.firstTermSummary !== undefined ? subj.firstTermSummary : 0;
          let secondTermVal = subj.secondTermSummary !== undefined ? subj.secondTermSummary : 0;
          let thirdTermVal = subj.thirdTermSummary !== undefined ? subj.thirdTermSummary : 0;
          
          if (firstTermVal === 0 && matchingFirstStudent) {
            const fs = matchingFirstStudent.subjects.find(s => s.name.toLowerCase() === subj.name.toLowerCase());
            if (fs) {
              const fsTotal = (fs.testScore || 0) + (fs.examScore || 0);
              firstTermVal = Math.round(fsTotal * 0.2); // 20%
            }
          }
          if (secondTermVal === 0 && matchingSecondStudent) {
            const ss = matchingSecondStudent.subjects.find(s => s.name.toLowerCase() === subj.name.toLowerCase());
            if (ss) {
              const ssTotal = (ss.testScore || 0) + (ss.examScore || 0);
              secondTermVal = Math.round(ssTotal * 0.2); // 20%
            }
          }
          if (thirdTermVal === 0) {
            const currentTotal = (subj.testScore || 0) + (subj.examScore || 0);
            thirdTermVal = Math.round(currentTotal * 0.6); // 60%
          }
          
          return {
            ...subj,
            firstTermSummary: firstTermVal,
            secondTermSummary: secondTermVal,
            thirdTermSummary: thirdTermVal
          };
        });
      } catch (e) {
        console.error("Auto pre-populating summaries failed:", e);
      }
    }

    setEditSubjects(subjectsListToEdit);
    setEditBehaviour([...student.behaviour]);
    setEditFormComment(student.formTeacherRemark);
    setEditPrincipalRemark((student as any).principalRemark || '');
    setEditTeacherName(student.formTeacherName);
    setEditPrincipalName(student.principalName);
    setEditResumeDate(student.resumptionDate);
  };

  // Handle Score Input Key Change
  const handleScoreChange = (sid: string, type: 'test' | 'exam' | 'firstTerm' | 'secondTerm' | 'thirdTerm' | 'position', val: number) => {
    setEditSubjects(prev => prev.map(s => {
      if (s.id !== sid) return s;
      if (type === 'test') {
        const validated = Math.max(0, Math.min(30, val));
        const newTotal = validated + s.examScore;
        const autoThirdTerm = Math.round(newTotal * 0.6);
        return { 
          ...s, 
          testScore: validated, 
          thirdTermSummary: s.thirdTermSummary === 0 || s.thirdTermSummary === undefined || s.thirdTermSummary === Math.round(((s.testScore || 0) + (s.examScore || 0)) * 0.6) 
            ? autoThirdTerm 
            : s.thirdTermSummary 
        };
      } else if (type === 'exam') {
        const validated = Math.max(0, Math.min(70, val));
        const newTotal = s.testScore + validated;
        const autoThirdTerm = Math.round(newTotal * 0.6);
        return { 
          ...s, 
          examScore: validated, 
          thirdTermSummary: s.thirdTermSummary === 0 || s.thirdTermSummary === undefined || s.thirdTermSummary === Math.round(((s.testScore || 0) + (s.examScore || 0)) * 0.6) 
            ? autoThirdTerm 
            : s.thirdTermSummary 
        };
      } else if (type === 'firstTerm') {
        const validated = Math.max(0, Math.min(100, val));
        return { ...s, firstTermSummary: validated };
      } else if (type === 'secondTerm') {
        const validated = Math.max(0, Math.min(100, val));
        return { ...s, secondTermSummary: validated };
      } else if (type === 'thirdTerm') {
        const validated = Math.max(0, Math.min(100, val));
        return { ...s, thirdTermSummary: validated };
      } else {
        const validated = Math.max(1, Math.min(150, val));
        return { ...s, position: validated, isPositionManual: true };
      }
    }));
  };

  // Handle Edit Subject Name
  const handleSubjectNameChange = (sid: string, newName: string) => {
    setEditSubjects(prev => prev.map(s => {
      if (s.id !== sid) return s;
      return { ...s, name: newName };
    }));
  };

  // Handle Add New Subject in Report Sheet
  const handleAddNewSubject = () => {
    const newSubj: SubjectGrade = {
      id: "subj_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      name: "New Course " + (editSubjects.length + 1),
      testScore: 0,
      examScore: 0,
      firstTermSummary: 0,
      secondTermSummary: 0,
      thirdTermSummary: 0
    };
    setEditSubjects(prev => [...prev, newSubj]);
    triggerSuccess(`Added new blank subject row: "${newSubj.name}"!`);
  };

  // Handle Delete Subject Row
  const handleDeleteSubject = (sid: string, name: string) => {
    setEditSubjects(prev => prev.filter(s => s.id !== sid));
    triggerSuccess(`Removed subject course row: "${name}".`);
  };

  // Handle Behaviour Rating Change
  const handleBehaviourChange = (traitName: string, ratingVal: number) => {
    setEditBehaviour(prev => prev.map(b => {
      if (b.name !== traitName) return b;
      return { ...b, rating: Math.max(1, Math.min(5, ratingVal)) };
    }));
  };

  // Save Student Academic updates
  const saveStudentChanges = async () => {
    if (!editingStudent) return;

    if (editPassword) {
      const otherPasscodes = getStudentPasscodesFromOtherTerms(editingStudent.id);
      if (otherPasscodes.includes(editPassword)) {
        triggerWarning("Security Alert: This passcode is already used by this student in another academic term! Please enter a unique 6-digit passcode.");
        return;
      }
    }

    // Log Manual Reset if password changed
    if (editPassword && editPassword !== editingStudent.password) {
      logPasscodeEvent({
        studentId: editingStudent.id,
        studentName: editingStudent.name,
        studentClass: editingStudent.className,
        action: 'Manual Reset',
        performedBy: currentUser?.name || 'Academic Educator',
        oldPasscode: editingStudent.password || '123455',
        newPasscode: editPassword
      });
    }

    const updatedStudent: Student = {
      ...editingStudent,
      age: editAge,
      sex: editSex,
      password: editPassword,
      passwordUseCount: editPassword !== editingStudent.password ? 0 : (editingStudent.passwordUseCount || 0),
      passwordRolledOver: editPassword !== editingStudent.password ? false : (editingStudent.passwordRolledOver || false),
      attendancePresent: editAttendancePresent,
      attendanceTotal: editAttendanceTotal,
      subjects: editSubjects,
      behaviour: editBehaviour,
      formTeacherRemark: editFormComment,
      formTeacherName: editTeacherName,
      principalName: editPrincipalName,
      resumptionDate: editResumeDate,
      principalRemark: editPrincipalRemark
    } as any;

    // Replace in full list, trigger rank recalculation
    let refreshed = students.map(s => s.id === editingStudent.id ? updatedStudent : s);
    refreshed = calculateClassPositions(refreshed, selectedClass, activeTermTab);

    // Validate score boundaries to safeguard database check constraints
    for (const s of editSubjects) {
      if (s.testScore < 0 || s.testScore > 30) {
        triggerWarning(`Validation Error: ${s.name} test score must be within 0-30 range.`);
        return;
      }
      if (s.examScore < 0 || s.examScore > 70) {
        triggerWarning(`Validation Error: ${s.name} exam score must be within 0-70 range.`);
        return;
      }
    }

    setIsSavingScores(true);
    
    try {
      // Streamline: Let high-performance parent handler perform selective differential upserting to both localStorage and Supabase
      await onUpdateStudents(refreshed);
      
      // Keep local editing view active with the newly saved values so the editor stays open and form components are fully interactive
      setEditingStudent(updatedStudent);
      
      triggerSuccess(`Reports updated perfectly for ${updatedStudent.name}! Class ranks recalculated.`);
    } catch (err: any) {
      console.error("[Supabase Save Failure] Detail:", err);
      // Construct detailed descriptive message
      const errMsg = err?.message || err?.details || String(err);
      triggerWarning(`Database Save Error: ${errMsg}. Please verify your network and schema. Check browser console logs for details.`);
    } finally {
      setIsSavingScores(false);
    }
  };

  // Remove Student Profile Efficaciously
  const deleteStudentProfile = (id: string, name: string) => {
    const stud = students.find(s => s.id === id);
    const cls = stud ? stud.className : selectedClass;
    setDeleteConfirmStudent({ id, name, className: cls, source: 'list' });
  };

  // --- LOGGED OUT FACULTY SCREEN ---
  if (!currentUser) {
    return (
      <div className="bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 min-h-screen text-slate-700 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
        {/* Aesthetic background mesh glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-100/30 rounded-full filter blur-3xl opacity-60 select-none pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-50/80 rounded-full filter blur-3xl opacity-60 select-none pointer-events-none"></div>

        <div className="max-w-md w-full space-y-4 relative z-10 transition-all duration-200">
          
          <button
            onClick={onBack}
            className="group text-slate-500 hover:text-emerald-700 text-xs font-black transition-all flex items-center gap-2 bg-white/95 hover:bg-emerald-50/60 py-2.5 px-4 rounded-xl border border-slate-200/70 shadow-3xs cursor-pointer select-none"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> Back to School Homepage
          </button>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6">
            <div className="flex justify-center flex-col items-center gap-3 select-none">
              <div className="bg-emerald-50 border border-emerald-100/60 font-bold text-emerald-600 p-4 rounded-full shadow-3xs flex items-center justify-center">
                <School className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <span className="text-[9px] bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold tracking-widest uppercase px-3 py-1 rounded-full">
                  Educators Entry Desk
                </span>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase text-slate-950 mt-2">
                  EZIBECK STAFF DESK
                </h1>
                <p className="text-[10px] tracking-wide text-slate-400 font-extrabold uppercase mt-1">
                  Authorized Central Roster & Report Manager
                </p>
              </div>
            </div>

            {/* Simulated Alerts & Notifications */}
            {(successMsg || facultyResetSuccess) && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-emerald-800 text-xs text-left font-bold shadow-3xs animate-fade-in">
                ✓ {successMsg || facultyResetSuccess}
              </div>
            )}

            {facultyResetError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-red-705 text-xs text-left font-semibold shadow-3xs animate-fade-in">
                ⚠️ {facultyResetError}
              </div>
            )}

            {facultySimulatedNotification && (
              <div className="bg-emerald-50 border border-emerald-250 rounded-xl p-4 text-left space-y-1.5 animate-pulse shadow-3xs">
                <span className="text-[9px] uppercase font-black tracking-widest text-emerald-850 block">📬 Simulation Educator Email Inbox</span>
                <p className="font-mono text-[11px] text-emerald-800 break-all leading-normal">{facultySimulatedNotification}</p>
              </div>
            )}

            {showFacultyReset ? (
              /* FACULTY OTP PASSWORD RESET FORM */
              <div className="space-y-4 text-left animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Passcode Reset Desk</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowFacultyReset(false);
                      setFacultyResetError('');
                      setFacultyResetSuccess('');
                      setFacultySimulatedNotification('');
                      setFacultyResetStep('request');
                    }}
                    className="text-[10px] text-emerald-600 hover:text-emerald-850 hover:underline font-bold cursor-pointer"
                  >
                    ← Back to Login
                  </button>
                </div>

                {facultyResetStep === 'request' && (
                  <form onSubmit={handleFacultySendOtp} className="space-y-4">
                    <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl text-slate-505 text-[11px] leading-relaxed font-semibold">
                      Enter the registered Email address of your Educator account (e.g. <span className="font-mono text-[10px] text-emerald-700 font-extrabold">gladys@ezibeckacademy.edu.ng</span>) to receive a secure login OTP code.
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-widest text-slate-450 mb-1.5">Registered Email Address:</label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. gladys@ezibeckacademy.edu.ng"
                        value={facultyResetEmail}
                        onChange={(e) => {
                          setFacultyResetEmail(e.target.value);
                          setFacultyResetError('');
                        }}
                        className="w-full bg-slate-50 border border-slate-205 focus:border-emerald-500 focus:bg-white rounded-xl p-3 text-xs text-slate-900 outline-none font-bold"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 text-xs font-black tracking-wider uppercase transition-all duration-150 cursor-pointer shadow-md shadow-emerald-50"
                    >
                      Send One-Time OTP Passcode
                    </button>
                  </form>
                )}

                {facultyResetStep === 'verify' && (
                  <form onSubmit={handleFacultyVerifyOtp} className="space-y-4">
                    <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl text-slate-505 text-[11px] leading-normal font-medium">
                      Copy the dynamic verification OTP code shown in the green simulated inbox banner at the top of the card and input below:
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-widest text-slate-450 mb-1.5">Enter 6-Digit OTP Code:</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="e.g. 123456"
                        value={facultyResetOtp}
                        onChange={(e) => {
                          setFacultyResetOtp(e.target.value);
                          setFacultyResetError('');
                        }}
                        className="w-full bg-slate-50 border border-emerald-200 text-slate-900 rounded-xl p-3 text-xs font-mono font-bold tracking-widest text-center outline-none focus:border-emerald-500 focus:bg-white transition-all focus:ring-4 focus:ring-emerald-500/10"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 text-xs font-black tracking-wider uppercase transition-all duration-150 cursor-pointer shadow-md shadow-emerald-50"
                    >
                      Verify Passcode OTP
                    </button>
                  </form>
                )}

                {facultyResetStep === 'new_password' && (
                  <form onSubmit={handleFacultyConfirmNewPass} className="space-y-4">
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-widest text-slate-455 mb-1.5">New Access Passcode Key (Min 4 chars):</label>
                      <div className="relative">
                        <input
                          type={showResetNewPass ? "text" : "password"}
                          required
                          placeholder="Enter new educator passcode..."
                          value={facultyNewPass}
                          onChange={(e) => {
                            setFacultyNewPass(e.target.value);
                            setFacultyResetError('');
                          }}
                          className="w-full bg-slate-50 border border-slate-205 focus:border-emerald-500 focus:bg-white rounded-xl py-3 pl-3 pr-10 text-xs text-slate-900 outline-none font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetNewPass(!showResetNewPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                        >
                          {showResetNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-widest text-slate-455 mb-1.5">Confirm New Access Passcode Key:</label>
                      <div className="relative">
                        <input
                          type={showResetConfirmPass ? "text" : "password"}
                          required
                          placeholder="Confirm new educator passcode..."
                          value={facultyNewPassConfirm}
                          onChange={(e) => {
                            setFacultyNewPassConfirm(e.target.value);
                            setFacultyResetError('');
                          }}
                          className="w-full bg-slate-50 border border-slate-205 focus:border-emerald-500 focus:bg-white rounded-xl py-3 pl-3 pr-10 text-xs text-slate-900 outline-none font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetConfirmPass(!showResetConfirmPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                        >
                          {showResetConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 text-xs font-black tracking-wider uppercase transition-all duration-150 cursor-pointer shadow-md shadow-emerald-50"
                    >
                      Save & Update Passcode Key
                    </button>
                  </form>
                )}
              </div>
            ) : (
              /* STANDARD FACULTY LOGIN FORM */
              <form onSubmit={handleVerifyTeacherLogin} className="space-y-5 text-left animate-fade-in">
                <div>
                  <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest mb-1.5">Username / Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ezekiel, gladys, anthony, or Full Name"
                    value={usernameInput}
                    onChange={(e) => {
                      setUsernameInput(e.target.value);
                      setTeacherLoginError('');
                    }}
                    className="w-full bg-slate-50 border border-slate-200/80 focus:border-emerald-500 focus:bg-white rounded-xl p-3 text-xs text-slate-900 outline-none font-bold transition-all focus:ring-4 focus:ring-emerald-500/10 placeholder-slate-405"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest mb-1.5">
                    Passcode Password Key
                  </label>
                  <div className="relative">
                    <input
                      type={showTeacherPass ? "text" : "password"}
                      required
                      placeholder="Profile security password"
                      value={teacherPasswordInput}
                      onChange={(e) => {
                        setTeacherPasswordInput(e.target.value);
                        setTeacherLoginError('');
                      }}
                      className="w-full bg-slate-50 border border-slate-205 focus:border-emerald-500 focus:bg-white rounded-xl py-3 pl-3 pr-10 text-xs text-slate-900 outline-none transition-all focus:ring-4 focus:ring-emerald-500/10 font-bold placeholder-slate-405"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTeacherPass(!showTeacherPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    >
                      {showTeacherPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {teacherLoginError && (
                    <p className="text-[10px] text-red-650 font-semibold mt-2.5 bg-red-50 border border-red-100 rounded-lg p-2.5">{teacherLoginError}</p>
                  )}
                </div>

                {/* Keep Me Signed In Box */}
                <label className="flex items-center gap-2 py-1 select-none hover:opacity-90 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-205 text-emerald-600 focus:ring-emerald-500/25 bg-slate-50 accent-emerald-600 cursor-pointer"
                  />
                  <span className="text-[11px] font-extrabold text-slate-500 pb-0.5">
                    Remember my credentials
                  </span>
                </label>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-555 hover:to-emerald-700 text-white rounded-xl py-3 text-xs font-black tracking-wider uppercase transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg hover:shadow-emerald-500/15 active:scale-98 border border-emerald-500/10 flex items-center justify-center gap-2"
                  >
                    Confirm & Log In 🔐
                  </button>
                </div>

                <div className="flex justify-center pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowFacultyReset(true);
                      setFacultyResetStep('request');
                    }}
                    className="text-[11px] text-emerald-650 hover:text-emerald-800 font-extrabold flex items-center gap-1.5 hover:underline transition-colors py-1 cursor-pointer"
                  >
                    🔑 Forgot password? Overwrite with OTP
                  </button>
                </div>
              </form>
            )}

            {/* Secure administrative note */}
            <p className="text-[9px] text-slate-450 text-center select-none pt-2">
              💡 Staff login credentials are restricted and handled securely. Contact system administrators for your individual activation key.
            </p>

            <p className="text-[9px] text-slate-450">
              Secure administrative console. EZIBECK ACADEMY Academic Information Terminal.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- LOGGED IN STAFF DESK VIEW ---
  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8 font-sans print:bg-white print:py-0 print:px-0">
      
      {/* Top dashboard navigation banner */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <span className="bg-slate-900 text-amber-400 font-extrabold text-[9px] tracking-widest uppercase px-2.5 py-1 rounded-md border border-slate-800">
            Faculty Workspace Desk
          </span>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-2xl">👩‍🏫</span>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 leading-none">{currentUser.name}</h2>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">{currentUser.role}</p>
            </div>
          </div>
        </div>

        {/* Supabase Connection Status Badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDbSyncModal(true)}
            title="Click to manage database connection and synchronize data"
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all shadow-xs hover:brightness-95 active:scale-95 text-left cursor-pointer select-none ${
              !dbStatus || !dbStatus.configured
                ? 'bg-slate-55 border-slate-200 text-slate-500 hover:bg-slate-100'
                : dbStatus.connected
                ? 'bg-emerald-50 border-emerald-250 text-emerald-800 hover:bg-emerald-100'
                : 'bg-rose-50 border-rose-250 text-rose-800 hover:bg-rose-100'
            }`}
          >
            {!dbStatus || !dbStatus.configured ? (
              <>
                <WifiOff className="w-4 h-4 text-slate-400" />
                <div className="text-left font-sans">
                  <div className="leading-none text-[11px] font-extrabold text-slate-600">Database: Offline</div>
                  <div className="text-[9px] text-slate-400 font-semibold mt-1 flex items-center gap-1">Local Browser Mode <span className="text-[8px] bg-slate-200 text-slate-600 px-1 rounded">Click</span></div>
                </div>
              </>
            ) : dbStatus.connected ? (
              <>
                <Wifi className="w-4 h-4 text-emerald-600 animate-pulse" />
                <div className="text-left font-sans">
                  <div className="leading-none text-[11px] font-extrabold text-emerald-800">Database: Online</div>
                  <div className="text-[9px] text-emerald-600 font-semibold mt-1 flex items-center gap-1 font-sans">Active sync enabled <span className="text-[8px] bg-emerald-200 text-emerald-800 px-1 rounded font-mono">Sync</span></div>
                </div>
              </>
            ) : (
              <>
                <CloudLightning className="w-4 h-4 text-rose-600 animate-bounce" />
                <div className="text-left font-sans">
                  <div className="leading-none text-[11px] font-extrabold text-rose-800">Connection Error</div>
                  <div className="text-[9px] text-rose-600 font-semibold mt-1 flex items-center gap-1">Click to check details <span className="text-[8px] bg-rose-250 text-rose-800 px-1 rounded animate-pulse">Fix</span></div>
                </div>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Real-time Alerts popups */}
      {successMsg && (
        <div className="max-w-6xl mx-auto mb-6 bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 flex items-center gap-3 text-emerald-900 animate-slide-in print:hidden">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-xs font-bold">{successMsg}</p>
        </div>
      )}

      {warningMsg && (
        <div className="max-w-6xl mx-auto mb-6 bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-center gap-3 text-amber-900 animate-slide-in print:hidden">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-xs font-bold">{warningMsg}</p>
        </div>
      )}

      {/* Roster & Editable Workspace Template navigation bar */}
      {!viewingReportStudent && !editingStudent && (
        <div className="max-w-6xl mx-auto mb-6 flex gap-2 border-b border-slate-200 pb-px print:hidden overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('roster')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${activeSubTab === 'roster' ? 'border-slate-900 text-slate-900 font-black' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            📂 Students Registry Roster
          </button>
          {canAccessWorkspaceConfig && (
            <button
              onClick={() => setActiveSubTab('workspace')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${activeSubTab === 'workspace' ? 'border-slate-900 text-slate-900 font-black' : 'border-transparent text-slate-400 hover:text-slate-650'}`}
            >
              ⚙️ Workspace Configuration
            </button>
          )}
          {currentUser && currentUser.id === 'ezekiel' && (
            <button
              id="subtab-manage-staff-restrict"
              onClick={() => setActiveSubTab('staff')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${activeSubTab === 'staff' ? 'border-slate-900 text-slate-900 font-black' : 'border-transparent text-slate-400 hover:text-slate-650'}`}
            >
              🔒 Manage Staff Access ({facultyProfiles.length})
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setActiveSubTab('calendar')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${activeSubTab === 'calendar' ? 'border-slate-900 text-slate-900 font-black' : 'border-transparent text-slate-400 hover:text-slate-650'}`}
            >
              📅 Ezibeck Calendar Manager
            </button>
          )}
          <button
            onClick={() => setActiveSubTab('audit')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${activeSubTab === 'audit' ? 'border-slate-900 text-slate-900 font-black' : 'border-transparent text-slate-400 hover:text-slate-650'}`}
          >
            📋 Passcode Audit Log ({auditLogs.length})
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveSubTab('passcodes')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${activeSubTab === 'passcodes' ? 'border-slate-900 text-slate-900 font-black' : 'border-transparent text-slate-400 hover:text-slate-650'}`}
            >
              🔑 Passcards Directory
            </button>
          )}
          <button
            onClick={() => setActiveSubTab('guidelines')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${activeSubTab === 'guidelines' ? 'border-slate-900 text-slate-900 font-black' : 'border-transparent text-slate-400 hover:text-slate-650'}`}
          >
            📖 Staff User Handbook
          </button>
        </div>
      )}

      {/* Main Container Workspace */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 gap-8">
        
        {/* VIEW 1: ACTIVE STUDENT ROW EDITOR MODE */}
        {viewingReportStudent ? (
          <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center bg-white border border-slate-100 rounded-2xl px-5 py-4 print:hidden gap-3 shadow-xs border-slate-200">
              <button
                onClick={() => setViewingReportStudent(null)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:bg-slate-50 border cursor-pointer text-slate-700"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Roster
              </button>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    startEditStudent(viewingReportStudent);
                    setViewingReportStudent(null);
                  }}
                  className="bg-indigo-650 hover:bg-indigo-755 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  title="Edit subject scores, behaviour and comments inside the report editor"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Report / Subjects
                </button>

                <button
                  onClick={downloadTeacherPdf}
                  disabled={isGeneratingPdf}
                  className="bg-emerald-800 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  {isGeneratingPdf ? (
                    <>
                      <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full"></span>
                      Saving PDF...
                    </>
                  ) : (
                    <>
                      <Printer className="w-4 h-4" /> Download / Print PDF
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Ezibeck Style Report Sheet Card */}
            {(() => {
              const stats = calculateStudentStatsForTerm(viewingReportStudent, activeTermTab);
              const isSecondary = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2A', 'SS2B', 'SS3A', 'SS3B'].includes((viewingReportStudent?.className || '').replace(/\s+/g, ''));
              return (
                <>
                  <ReportCardPrintable 
                    ref={teacherPrintAreaRef}
                    student={viewingReportStudent}
                    term={activeTermTab}
                    template={template}
                    studentsRoster={students}
                    isGeneratingPdf={isGeneratingPdf}
                  />
                  <div className="hidden print:hidden">
                  {/* Diagonal tiled watermark background */}
                  <ReportCardWatermark />

                  {/* Print layout decorator line */}
                  <div className="absolute inset-2 border border-slate-100 rounded-xl pointer-events-none print:hidden"></div>

                  {/* Ezibeck Style Header Breadcrumbs */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-medium text-slate-400 border-b border-slate-100 pb-2 relative z-10 select-none">
                    <span>🏫 {template.schoolName}</span>
                    <span>/</span>
                    <span>📁 Report Registry</span>
                    <span>/</span>
                    <span>👥 {viewingReportStudent.className}</span>
                    <span>/</span>
                    <span className="text-slate-700 font-semibold">📄 {viewingReportStudent.name}</span>
                  </div>

                  {/* School Header Section with centered text and badge on the left */}
                  <div className="relative flex items-center justify-center border-b border-slate-200/50 pb-3 mt-1 select-none">
                    {/* School Badge on the left side */}
                    <div className="absolute left-0 flex-shrink-0">
                      <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 shadow-3xs flex items-center justify-center overflow-hidden">
                        <img 
                          src={schoolBadge} 
                          alt={`${template.schoolName} Emblem`} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>

                    {/* Centered header details */}
                    <div className="text-center space-y-0.5 max-w-xl">
                      <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-none uppercase">
                        {template.schoolName}
                      </h1>
                      <p className="text-[8.5px] uppercase tracking-wider text-emerald-750 font-extrabold flex items-center justify-center gap-1 select-none">
                        <span className="w-1 h-1 rounded-full bg-emerald-600"></span>
                        Motto: {template.motto}
                      </p>
                      <p className="text-slate-500 text-[8.5px] leading-none">
                        <strong>Address:</strong> {template.address} | <strong>Phone:</strong> {template.phone} | <strong>Email:</strong> {template.email}
                      </p>
                    </div>
                  </div>

                  {/* Dynamic Official Page Heading */}
                  <div className="relative z-10 py-1 flex items-center justify-between border-b border-slate-100 select-none">
                    <h2 className="text-[10.5px] font-extrabold text-slate-900 tracking-tight leading-none uppercase flex items-center gap-1.5">
                      <span className="inline-block px-2 py-0.5 bg-slate-900 text-slate-100 text-[8px] font-black rounded tracking-wider">OFFICIAL STATUS</span>
                      STUDENT’S TERMLY REPORT SHEET FOR {viewingReportStudent.className.startsWith('JSS') ? 'JUNIOR' : 'SENIOR'} SECONDARY SCHOOL
                    </h2>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      {activeTermTab.toUpperCase()} SESSION
                    </span>
                  </div>

                  {/* Top Compact Cards: 3 Columns Grid */}
                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Card 1: Student Profile */}
                    <div className="bg-[#FAF9F9] border border-slate-200/80 rounded-xl p-2.5 shadow-3xs text-slate-800 text-[10px] flex flex-col justify-between">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-[9px] uppercase tracking-wider mb-1.5 select-none border-b border-slate-200/50 pb-0.5 flex items-center gap-1">
                          <span>👤</span> Student Profile
                        </h4>
                        <div className="space-y-0.5">
                          <div className="flex justify-between items-center gap-1">
                            <span className="text-slate-400 font-semibold select-none">Name:</span>
                            <span className="font-extrabold text-slate-900 truncate max-w-[150px]">{viewingReportStudent.name}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-semibold select-none">Access ID:</span>
                            <span className="font-mono font-bold text-slate-750">{viewingReportStudent.id}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-semibold select-none">Class:</span>
                            <span className="font-extrabold text-slate-900">{viewingReportStudent.className}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-semibold select-none">Sex / Gender:</span>
                            <span className="font-bold text-slate-800">{viewingReportStudent.sex}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-semibold select-none">Age Profile:</span>
                            <span className="font-bold text-slate-800">{viewingReportStudent.age} Years</span>
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-slate-200/50 pt-1 mt-1 flex justify-between items-center text-[9px]">
                        <span className="text-slate-400 font-semibold select-none">Attendance:</span>
                        <span className="font-bold text-slate-800">{viewingReportStudent.attendancePresent} / {viewingReportStudent.attendanceTotal} sessions ({Math.round(viewingReportStudent.attendancePresent / (viewingReportStudent.attendanceTotal || 1) * 100)}%)</span>
                      </div>
                    </div>

                    {/* Card 2: Academic Summary */}
                    <div className="bg-[#FAF9F9] border border-slate-200/80 rounded-xl p-2.5 shadow-3xs text-slate-800 text-[10px] flex flex-col justify-between">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-[9px] uppercase tracking-wider mb-1.5 select-none border-b border-slate-200/50 pb-0.5 flex items-center gap-1">
                          <span>📊</span> Academic Performance
                        </h4>
                        <div className="space-y-0.5">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-semibold select-none">Cumulative Total:</span>
                            <span className="font-black text-slate-900">{stats.totalScore} / {stats.maxPossibleScore}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-semibold select-none">Termly Average:</span>
                            <span className="font-black text-emerald-800 font-mono">{stats.avgScore.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-semibold select-none">Class Position:</span>
                            <span className="font-black text-slate-900">{(() => {
                              const sortedRoster = calculateClassPositions(students, viewingReportStudent.className, activeTermTab)
                                .filter(s => s.className === viewingReportStudent.className);
                              const posIdx = sortedRoster.findIndex(s => s.id === viewingReportStudent.id);
                              return posIdx !== -1 ? `${formatOrdinal(posIdx + 1)} of ${sortedRoster.length}` : "N/A";
                            })()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-semibold select-none">Total Subjects:</span>
                            <span className="font-bold text-slate-800">{viewingReportStudent.subjects.length} Subjects</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-semibold select-none">Subjects Passed:</span>
                            <span className="font-bold text-emerald-700">{stats.creditsAndAbove + stats.passes} Passed</span>
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-slate-200/50 pt-1 mt-1 flex justify-between items-center text-[9px]">
                        <span className="text-slate-400 font-semibold select-none">Academic Verdict:</span>
                        <span className="font-bold text-emerald-800">{stats.avgScore >= (template.passThreshold || 50) ? "PASS" : "FAIL"}</span>
                      </div>
                    </div>

                    {/* Card 3: Next Term & Fees Summary */}
                    {(() => {
                      const parseNum = (v: string): number => {
                        const cln = v.replace(/[^\d.]/g, '');
                        const parsed = parseFloat(cln);
                        return isNaN(parsed) ? 0 : parsed;
                      };
                      
                      const cls = viewingReportStudent.className || '';
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
                        <div className="bg-[#FAF9F9] border border-slate-200/80 rounded-xl p-2.5 shadow-3xs text-slate-850 text-[9px] flex flex-col justify-between">
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-[9px] uppercase tracking-wider mb-1.5 select-none border-b border-slate-200/50 pb-0.5 flex items-center gap-1">
                              <span>💰</span> Next Term Fees Summary
                            </h4>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-medium">School Fees:</span>
                                <span className="font-bold text-slate-700">{sFee}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-medium">Party Fee:</span>
                                <span className="font-bold text-slate-700">{pFee}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-medium">Enrollment:</span>
                                <span className="font-bold text-slate-700">{eFee}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-medium">Book Fees:</span>
                                <span className="font-bold text-slate-700">{bFee}</span>
                              </div>
                            </div>
                          </div>
                          <div className="border-t border-dashed border-emerald-300 pt-1 mt-1 flex justify-between items-center text-[10px]">
                            <span className="font-extrabold text-emerald-850">Total Invoice:</span>
                            <span className="font-black text-emerald-850 font-mono">{totalFormatted}</span>
                          </div>
                          <div className="flex justify-between items-center mt-0.5 text-[8.5px] text-slate-400 leading-none">
                            <span>Resumption:</span>
                            <span className="font-extrabold text-slate-600">{template.resumptionDate}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Part A: Academic Course Evaluation */}
                  <div className="relative z-10 space-y-1.5">
                    <h3 className="text-slate-900 font-black text-[10.5px] uppercase tracking-wider border-l-4 border-slate-900 pl-2 py-0.5 flex items-center justify-between select-none">
                      <span>Part A: Academic Course Evaluation</span>
                      <span className="text-[8.5px] text-slate-450 normal-case font-bold">Standard Formula Matrix Layout</span>
                    </h3>
                    {/* Ezibeck-style database table */}
                    <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white shadow-3xs">
                      <table className="w-full text-left text-[10px] border-collapse">
                        <thead>
                          <tr className="bg-[#EAEAEA] border-b border-slate-300 text-slate-950 font-black select-none text-[9px] uppercase tracking-wider">
                            <th className="py-1 px-2 border-r border-slate-300 min-w-[130px]">
                              <span className="flex items-center gap-1">📝 Subjects</span>
                            </th>
                            <th className="py-1 px-2 border-r border-slate-300 text-center w-16">
                              <span className="flex items-center justify-center">TEST (30)</span>
                            </th>
                            <th className="py-1 px-2 border-r border-slate-300 text-center w-16">
                              <span className="flex items-center justify-center">EXAM (70)</span>
                            </th>
                            <th className="py-1 px-2 border-r border-slate-300 text-center bg-emerald-100/30 w-18">
                              <span className="flex items-center justify-center text-emerald-950 font-black">TERM (100)</span>
                            </th>
                            {activeTermTab === 'Second Term' && isSecondary && (
                              <th className="py-1 px-2 border-r border-slate-300 text-center text-[8.5px] w-20 bg-blue-50 text-blue-900 font-black">
                                <span className="flex items-center justify-center">1ST T AVG</span>
                              </th>
                            )}
                            {activeTermTab === 'Third Term' && (
                              <>
                                <th className="py-1 px-1 border-r border-slate-300 text-center text-[8px] w-14">
                                  <span className="flex items-center justify-center">1ST T (20)</span>
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 text-center text-[8px] w-14">
                                  <span className="flex items-center justify-center">2ND T (20)</span>
                                </th>
                                <th className="py-1 px-1 border-r border-slate-300 text-center text-[8px] w-14">
                                  <span className="flex items-center justify-center">3RD T (60)</span>
                                </th>
                                <th className="py-1 px-2 border-r border-slate-300 text-center bg-emerald-100/20 w-22 text-slate-950 font-black">
                                  <span className="flex items-center justify-center font-black">SESS AVG</span>
                                </th>
                              </>
                            )}
                            <th className="py-1 px-2 border-r border-slate-300 text-center w-16">
                              <span className="flex items-center justify-center">GRADE</span>
                            </th>
                            <th className="py-1 px-1 border-r border-slate-300 text-center w-14">
                              <span className="flex items-center justify-center">POSITION</span>
                            </th>
                            <th className="py-1 px-2 font-black text-slate-955">
                              <span className="flex items-center gap-1">💬 REMARK</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                          {viewingReportStudent.subjects.map(subj => {
                            const tot = calculateSubjectTotal(subj);
                            
                            // Formulate annual / session average data realistically matching the 20/20/60 formula of Ezibeck
                            const firstTerm = subj.firstTermSummary !== undefined && subj.firstTermSummary !== 0 ? subj.firstTermSummary : Math.round(tot * 0.2);
                            const secondTerm = subj.secondTermSummary !== undefined && subj.secondTermSummary !== 0 ? subj.secondTermSummary : Math.round(tot * 0.2);
                            const thirdTerm = subj.thirdTermSummary !== undefined && subj.thirdTermSummary !== 0 ? subj.thirdTermSummary : Math.round(tot * 0.6);
                            const sessionAvg = firstTerm + secondTerm + thirdTerm;

                            const { letter, remark, ratingClass } = getLetterAndRemark(
                              activeTermTab === 'Third Term' ? sessionAvg : tot
                            );

                            return (
                              <tr key={subj.id} className="hover:bg-slate-50/50 border-b border-slate-150 text-[10px]">
                                <td className="py-1 px-2 border-r border-slate-150 font-extrabold text-slate-900 bg-slate-50/20">{subj.name}</td>
                                <td className="py-1 px-2 border-r border-slate-150 text-center font-mono font-bold text-slate-800">{subj.testScore}</td>
                                <td className="py-1 px-2 border-r border-slate-150 text-center font-mono font-bold text-slate-800">{subj.examScore}</td>
                                <td className="py-1 px-2 border-r border-slate-150 text-center font-black font-mono text-emerald-850 bg-emerald-50/10">{tot}</td>
                                {activeTermTab === 'Second Term' && isSecondary && (
                                  <td className="py-1 px-2 border-r border-slate-150 text-center font-mono font-bold text-slate-800 bg-blue-50/5">
                                    {(() => {
                                      let firstTermAvgStr = "-";
                                      const baseId = viewingReportStudent.id.split('_')[0];
                                      try {
                                        const firstTermKey = 'ezibeck_students_first_term';
                                        const firstTermData = typeof window !== 'undefined' ? localStorage.getItem(firstTermKey) : null;
                                        const parsedFirst = firstTermData ? JSON.parse(firstTermData) : [];
                                        const firstTermStuds: Student[] = Array.isArray(parsedFirst) ? parsedFirst : [];
                                        const matchMatch = firstTermStuds.find(s => s.id.startsWith(baseId));
                                        const matchSubj = matchMatch?.subjects.find(s => s.name.toLowerCase() === subj.name.toLowerCase());
                                        if (subj.firstTermSummary !== undefined && subj.firstTermSummary !== 0) {
                                          firstTermAvgStr = String(subj.firstTermSummary) + "%";
                                        } else {
                                          const matchMatch = firstTermStuds.find(s => s.id.startsWith(baseId));
                                          const matchSubj = matchMatch?.subjects.find(s => s.name.toLowerCase() === subj.name.toLowerCase());
                                          if (matchSubj) {
                                            firstTermAvgStr = String((matchSubj.testScore || 0) + (matchSubj.examScore || 0)) + "%";
                                          } else {
                                            firstTermAvgStr = String(Math.round(tot * 0.75)) + "%";
                                          }
                                        }
                                      } catch (e) {
                                        console.error(e);
                                      }
                                      return firstTermAvgStr;
                                    })()}
                                  </td>
                                )}
                                {activeTermTab === 'Third Term' && (
                                  <>
                                    <td className="py-1 px-1 border-r border-slate-150 text-center font-mono font-bold text-slate-800">{firstTerm}</td>
                                    <td className="py-1 px-1 border-r border-slate-150 text-center font-mono font-bold text-slate-800">{secondTerm}</td>
                                    <td className="py-1 px-1 border-r border-slate-150 text-center font-mono font-bold text-slate-800">{thirdTerm}</td>
                                    <td className="py-1 px-2 border-r border-slate-150 text-center font-black font-mono text-emerald-850 bg-slate-50/40">{sessionAvg}</td>
                                  </>
                                )}
                                <td className="py-1 px-2 border-r border-slate-150 text-center">
                                  <span className={`px-1.5 py-0.5 text-[8.5px] font-black rounded-sm tracking-wider ${ratingClass}`}>
                                    {letter}
                                  </span>
                                </td>
                                <td className="py-1 px-1 border-r border-slate-150 text-center font-black text-slate-900 bg-slate-50/10">{formatOrdinal(subj.position)}</td>
                                <td className="py-1 px-2 italic text-slate-700 text-[9px] font-bold leading-tight bg-[#FCFCFC]">{remark}</td>
                              </tr>
                            );
                          })}

                          {/* Calculation Footer */}
                          <tr className="bg-[#FAF9F9]/90 border-t border-slate-205 text-slate-400 font-semibold select-none text-[9px] uppercase tracking-wider divide-x divide-slate-100">
                            <td className="py-1 px-2 font-semibold text-slate-500">
                              Count: {viewingReportStudent.subjects.length}
                            </td>
                            <td className="py-1 px-2 text-center font-bold">
                              Avg: {(() => {
                                const tCount = viewingReportStudent.subjects.length || 1;
                                const testSum = viewingReportStudent.subjects.reduce((sum, s) => sum + (s.testScore || 0), 0);
                                return (testSum / tCount).toFixed(1);
                              })()}
                            </td>
                            <td className="py-1 px-2 text-center font-bold">
                              Avg: {(() => {
                                const tCount = viewingReportStudent.subjects.length || 1;
                                const examSum = viewingReportStudent.subjects.reduce((sum, s) => sum + (s.examScore || 0), 0);
                                return (examSum / tCount).toFixed(1);
                              })()}
                            </td>
                            <td className="py-1 px-2 text-center font-black text-emerald-850 bg-emerald-50/10">
                              Avg: {stats.avgScore.toFixed(1)}%
                            </td>
                            {activeTermTab === 'Third Term' && (
                              <>
                                <td className="py-1 px-1 text-center font-bold">
                                  Avg: {(() => {
                                    const tCount = viewingReportStudent.subjects.length || 1;
                                    const fSum = viewingReportStudent.subjects.reduce((sum, s) => sum + (s.firstTermSummary !== undefined ? s.firstTermSummary : 0), 0);
                                    return (fSum / tCount).toFixed(1);
                                  })()}
                                </td>
                                <td className="py-1 px-1 text-center font-bold">
                                  Avg: {(() => {
                                    const tCount = viewingReportStudent.subjects.length || 1;
                                    const sSum = viewingReportStudent.subjects.reduce((sum, s) => sum + (s.secondTermSummary !== undefined ? s.secondTermSummary : 0), 0);
                                    return (sSum / tCount).toFixed(1);
                                  })()}
                                </td>
                                <td className="py-1 px-1 text-center font-bold">
                                  Avg: {(() => {
                                    const tCount = viewingReportStudent.subjects.length || 1;
                                    const thSum = viewingReportStudent.subjects.reduce((sum, s) => sum + (s.thirdTermSummary !== undefined ? s.thirdTermSummary : 0), 0);
                                    return (thSum / tCount).toFixed(1);
                                  })()}
                                </td>
                                <td className="py-1 px-2 text-center font-black bg-slate-100/50 text-slate-800">
                                  Avg: {(() => {
                                    const tCount = viewingReportStudent.subjects.length || 1;
                                    const sessionSum = viewingReportStudent.subjects.reduce((sum, s) => {
                                      const f = s.firstTermSummary !== undefined ? s.firstTermSummary : 0;
                                      const sec = s.secondTermSummary !== undefined ? s.secondTermSummary : 0;
                                      const th = s.thirdTermSummary !== undefined ? s.thirdTermSummary : 0;
                                      return sum + (f + sec + th);
                                    }, 0);
                                    return (sessionSum / tCount).toFixed(1);
                                  })()}%
                                </td>
                              </>
                            )}
                            <td className="py-1 px-2" colSpan={3}></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Side-by-Side Bottom Grid layout */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative z-10 pt-3 border-t border-dashed border-slate-200">
                    {/* Column 1: Character & Behavioral Conduct Ratings */}
                    {(() => {
                      const cleanClassName = (viewingReportStudent?.className || '').replace(/\s+/g, '');
                      const isSecondaryClass = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2A', 'SS2B', 'SS3A', 'SS3B'].includes(cleanClassName);
                      return (
                        <div className="bg-[#FCFCFC]/60 border border-slate-200 rounded-xl p-3 shadow-3xs flex flex-col justify-between">
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-[10px] uppercase tracking-wider mb-2 select-none border-b border-slate-200/50 pb-1 flex items-center gap-1">
                              <span>🌟</span> Character & Skills Ratings
                            </h4>
                            <div className="space-y-1 text-[10px] text-slate-800">
                              {(() => {
                                const isKgClass = viewingReportStudent.className === 'Pre-Nursery' || viewingReportStudent.className.startsWith('Nursery');
                                if (isKgClass) {
                                  const behaviouralList = viewingReportStudent.behaviour.filter(b => 
                                    ["Punctuality", "Neatness", "Assignment", "Concentration"].includes(b.name)
                                  );
                                  const skillList = viewingReportStudent.behaviour.filter(b => 
                                    ["Hand-writing", "Fluency", "Attitude to Property"].includes(b.name)
                                  );
                                  return (
                                    <div className="grid grid-cols-2 gap-x-2">
                                      <div className="space-y-0.5">
                                        <h5 className="font-bold text-[8px] text-slate-400 uppercase tracking-wider pb-0.5 border-b border-slate-100">Behavioral</h5>
                                        {behaviouralList.map(b => (
                                          <div key={b.name} className="flex items-center justify-between py-0.5 border-b border-dashed border-slate-100">
                                            <span className="font-semibold text-slate-600 truncate max-w-[60px]">{b.name}</span>
                                            <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-1 rounded">{b.rating}/5</span>
                                          </div>
                                        ))}
                                      </div>
                                      <div className="space-y-0.5">
                                        <h5 className="font-bold text-[8px] text-slate-400 uppercase tracking-wider pb-0.5 border-b border-slate-100">Skills</h5>
                                        {skillList.map(b => (
                                          <div key={b.name} className="flex items-center justify-between py-0.5 border-b border-dashed border-slate-100">
                                            <span className="font-semibold text-slate-600 truncate max-w-[60px]">{b.name}</span>
                                            <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-1 rounded">{b.rating}/5</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div className="grid grid-cols-2 gap-x-2">
                                      {viewingReportStudent.behaviour.map(b => (
                                        <div key={b.name} className="flex items-center justify-between py-0.5 border-b border-dashed border-slate-100">
                                          <span className="font-semibold text-slate-600 truncate max-w-[70px]">{b.name}</span>
                                          <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-1 rounded">{b.rating}/5</span>
                                        </div>
                                      ))}
                                    </div>
                                  );
                                }
                              })()}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Column 2: Grades Index & Conduct Scale */}
                    <div className="bg-[#FCFCFC]/60 border border-slate-200 rounded-xl p-3 shadow-3xs flex flex-col justify-between">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-[10px] uppercase tracking-wider mb-2 select-none border-b border-slate-200/50 pb-1 flex items-center gap-1">
                          <span>📋</span> Grade Key & Conduct Scale
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          {/* Grades Index table */}
                          <div className="border border-slate-150 rounded-lg overflow-hidden shadow-3xs">
                            <table className="w-full text-[8px] text-left border-collapse text-slate-600">
                              <tbody className="divide-y divide-slate-100 font-semibold">
                                <tr>
                                  <td className="py-0.5 px-1 font-black text-emerald-700 bg-emerald-50">A+</td>
                                  <td className="py-0.5 px-1">90-100</td>
                                </tr>
                                <tr>
                                  <td className="py-0.5 px-1 font-black text-green-700 bg-green-50">A</td>
                                  <td className="py-0.5 px-1">80-89</td>
                                </tr>
                                <tr>
                                  <td className="py-0.5 px-1 font-black text-sky-700 bg-sky-50">B</td>
                                  <td className="py-0.5 px-1">70-79</td>
                                </tr>
                                <tr>
                                  <td className="py-0.5 px-1 font-black text-amber-500 bg-amber-50">C</td>
                                  <td className="py-0.5 px-1">60-69</td>
                                </tr>
                                <tr>
                                  <td className="py-0.5 px-1 font-black text-orange-600 bg-orange-50">D</td>
                                  <td className="py-0.5 px-1">50-59</td>
                                </tr>
                                <tr>
                                  <td className="py-0.5 px-1 font-black text-red-500 bg-red-50">F</td>
                                  <td className="py-0.5 px-1">&lt; 50</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          {/* Conduct Scale list */}
                          <div className="space-y-0.5 text-slate-500 font-bold">
                            <div className="flex items-center gap-1">
                              <span className="w-3.5 h-3.5 rounded bg-emerald-50 text-emerald-700 text-[8px] flex items-center justify-center font-mono font-black">5</span>
                              <span>Excellent</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="w-3.5 h-3.5 rounded bg-green-50 text-green-700 text-[8px] flex items-center justify-center font-mono font-black">4</span>
                              <span>Very Good</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="w-3.5 h-3.5 rounded bg-sky-50 text-sky-700 text-[8px] flex items-center justify-center font-mono font-black">3</span>
                              <span>Good</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="w-3.5 h-3.5 rounded bg-amber-50 text-amber-600 text-[8px] flex items-center justify-center font-mono font-black">2</span>
                              <span>Fair</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="w-3.5 h-3.5 rounded bg-slate-50 text-slate-500 text-[8px] flex items-center justify-center font-mono font-black">1</span>
                              <span>Needs Work</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Column 3: Appraisals, Signatures & Stamps */}
                    {(() => {
                      const cleanClassName = (viewingReportStudent.className || '').replace(/\s+/g, '');
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

                      const displayTeacherName = viewingReportStudent.formTeacherName || fallbackTeacher;

                      let displaySignatoryName = template.principalName;
                      if (isBasic) {
                        displaySignatoryName = template.formTeacherJunior || "Mrs. Nancy Yusuf";
                      } else if (isNursery) {
                        displaySignatoryName = template.formTeacherSenior || "Nursery Admin";
                      }
                      return (
                        <div className="bg-[#FAF9F9] border border-slate-200 rounded-xl p-2.5 shadow-3xs text-[9.5px] text-slate-800 space-y-1.5 flex flex-col justify-between">
                          <div className="space-y-1">
                            {/* Teacher Remark */}
                            <div>
                              <span className="font-extrabold text-slate-950 uppercase tracking-wider block border-b border-slate-200 pb-0.5 select-none text-[8.5px]">
                                💬 Teacher Appraisal
                              </span>
                              <p className="italic text-slate-600 leading-tight">
                                "{viewingReportStudent.formTeacherRemark}"
                              </p>
                            </div>

                            {/* Principal Remark */}
                            <div>
                              <span className="font-extrabold text-slate-955 uppercase tracking-wider block border-b border-slate-200 pb-0.5 select-none text-[8.5px]">
                                {isBasic ? "Headmistress assessment" : isNursery ? "Nursery Admin assessment" : "Principal assessment"}
                              </span>
                              <p className="italic text-slate-600 leading-tight">
                                {viewingReportStudent.principalRemark
                                  ? `"${viewingReportStudent.principalRemark}"`
                                  : (viewingReportStudent.formTeacherRemark.includes("outstanding") || stats.avgScore >= (template.distinctionThreshold || 90)
                                    ? `"Highly commendable academic and behavioral character shown during the term session. Excellent candidate. Promoted with honor."`
                                    : stats.avgScore >= (template.passThreshold || 50)
                                      ? `"Satisfactory progress. Continued focus on core concepts will serve candidate well. Promoted."`
                                      : `"Needs close guidance and study supervision in future sessions to ensure passing criteria."`)}
                              </p>
                            </div>
                          </div>

                          {/* Signatures & Seal Row */}
                          <div className="border-t border-slate-200 pt-1.5 flex justify-between items-center text-[7.5px] gap-2 leading-none">
                            <div>
                              <p className="font-black text-slate-900 select-none">{displayTeacherName}</p>
                              <span className="text-slate-450 uppercase tracking-wider select-none font-bold">Teacher</span>
                            </div>
                            
                            <div className="flex flex-col items-center select-none shrink-0">
                              <div className="w-7 h-7 rounded-full border border-emerald-600/50 flex flex-col items-center justify-center bg-white text-emerald-700 font-bold scale-90">
                                <span className="text-[3px] leading-none">OFFICIAL</span>
                                <span className="text-[4px] leading-none">STAMP</span>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="font-black text-slate-900 select-none">{displaySignatoryName}</p>
                              <span className="text-slate-450 uppercase tracking-wider select-none font-bold">
                                {isBasic ? "Headmistress" : isNursery ? "Nursery Admin" : "Principal"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Bottom Status bar stamp */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-2 bg-slate-900 text-slate-200 py-2 px-3.5 rounded-xl relative z-10 text-[10px] border border-slate-800 shadow-sm animate-fade-in select-none">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Candidate Academic Status: <strong className="text-white">Active and Promoted</strong></span>
                    </span>
                    
                    <span className="bg-emerald-600 text-white font-extrabold px-2 py-0.5 text-[8.5px] rounded tracking-wider uppercase">
                      ★ Official Seal Verified
                    </span>
                  </div>
                </div>
                </>
              );
            })()}

            {/* Bottom Right Escape Valve removed as requested */}
          </div>
        ) : editingStudent ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-md">
            {/* Editor Top Navigation header */}
            <div className="flex justify-between items-center border-b pb-4 mb-6">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-6 h-6 text-emerald-900" />
                <div>
                  <h3 className="text-base font-black text-slate-900">Digital Grade Marks Entry & Conduct Ratings</h3>
                  <p className="text-xs text-slate-400">Editing profile for student <strong className="text-slate-800">{editingStudent.name}</strong> ({editingStudent.id})</p>
                </div>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-600 px-4 py-1.5 rounded-lg transition-all"
              >
                Close Editor
              </button>
            </div>

            {/* Profile detail inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 bg-slate-50 border p-4 rounded-xl text-xs mb-8">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Student Gender Sex</label>
                <select
                  value={editSex}
                  onChange={(e) => setEditSex(e.target.value as 'Male' | 'Female')}
                  className="bg-white border rounded p-1.5 w-full font-bold text-slate-700 outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Age Profile Years</label>
                <select
                  value={editAge}
                  onChange={(e) => setEditAge(parseInt(e.target.value))}
                  className="bg-white border rounded p-1.5 w-full font-bold text-slate-700 outline-none"
                >
                  {Array.from({ length: 22 }, (_, i) => i + 1).map(y => (
                    <option key={y} value={y}>{y} Years</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Attendance Days Present</label>
                <input
                  type="number"
                  value={editAttendancePresent}
                  onChange={(e) => setEditAttendancePresent(Math.max(0, Math.min(editAttendanceTotal, parseInt(e.target.value) || 0)))}
                  className="bg-white border rounded p-1.5 w-full font-bold text-slate-700 outline-none text-center font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Attendance Total Sessions</label>
                <input
                  type="number"
                  value={editAttendanceTotal}
                  onChange={(e) => setEditAttendanceTotal(Math.max(1, parseInt(e.target.value) || 1))}
                  className="bg-white border rounded p-1.5 w-full font-bold text-slate-700 outline-none text-center font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Student Access Password</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    readOnly
                    placeholder="Default: 123456"
                    value={editPassword}
                    className="bg-slate-100 border rounded p-1.5 flex-1 font-bold text-emerald-700 outline-none text-center font-mono cursor-not-allowed select-all"
                    title="System auto-generated rolling passcode"
                  />
                  <button
                    type="button"
                    title="Generate a brand new random secure passcode"
                    onClick={() => {
                      if (editingStudent) {
                        const fresh = generateUnique6DigitPassword(editingStudent.name, editingStudent.id);
                        setEditPassword(fresh);
                        triggerSuccess("Successfully auto-generated a fresh secure passcode for the student!");
                      }
                    }}
                    className="bg-slate-800 text-white hover:bg-slate-900 border px-3 py-1 text-[11px] font-bold rounded-lg cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    🔄 Auto-Gen
                  </button>
                </div>
                <div className="mt-1 text-[9px] font-bold text-slate-500 flex justify-between items-center px-1">
                  <span>🔒 Secure automatic rolling password</span>
                  {(() => {
                    if (!editingStudent) return null;
                    const used = editingStudent.passwordUseCount || 0;
                    if (editingStudent.passwordRolledOver || used >= 5) {
                      return <span className="text-red-600 font-extrabold uppercase animate-pulse">⚠️ Rolled Over (Expired)</span>;
                    }
                    return <span className="text-emerald-700 font-semibold">{5 - used} uses left before auto-reset</span>;
                  })()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Academics Subjects list editor */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                    Academic Subject Grades Record
                  </h4>
                  <span className="bg-emerald-800 text-amber-400 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded border border-indigo-950">
                    📂 {activeTermTab} Session Active
                  </span>
                </div>

                {/* Dynamic Term isolation helper notice */}
                <div className="bg-emerald-950 text-emerald-100 border border-emerald-900 rounded-2xl p-4 text-[11px] font-semibold flex items-start gap-2.5 shadow-sm">
                  <span className="text-sm select-none">ℹ️</span>
                  <div>
                    <span className="font-extrabold text-amber-350">Workspace Session Isolation: {activeTermTab} Mode</span>
                    <p className="text-[10px] text-emerald-200 mt-0.5 leading-relaxed">
                      You are editing grades for the <strong className="text-white underline underline-offset-1">{activeTermTab} folder</strong>. The standard Test (30) and Exam (70) scores correspond to {activeTermTab}'s work. Summaries for other terms are read-only to preserve records. To edit other terms, change the active session folder at the top of the Student Registry Roster.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 border rounded-2xl overflow-x-auto shadow-inner">
                  <div className="bg-slate-100 border-b p-3 grid grid-cols-12 text-[10px] font-bold uppercase text-slate-500 tracking-wider min-w-[850px] items-center">
                    <span className={(activeTermTab === 'Third Term' || (activeTermTab === 'Second Term' && editingIsSecondary)) ? "col-span-3" : "col-span-4"}>Subject Course Title</span>
                    <span className={(activeTermTab === 'Third Term' || (activeTermTab === 'Second Term' && editingIsSecondary)) ? "col-span-1 text-center font-bold" : "col-span-2 text-center font-bold"}>Test (30)</span>
                    <span className={(activeTermTab === 'Third Term' || (activeTermTab === 'Second Term' && editingIsSecondary)) ? "col-span-1 text-center font-bold" : "col-span-2 text-center font-bold"}>Exam (70)</span>
                    <span className="col-span-1 text-center font-bold font-sans py-1 rounded text-indigo-900 bg-indigo-50 border border-slate-200">
                      Live Total
                    </span>
                    {activeTermTab === 'Second Term' && editingIsSecondary && (
                      <span className="col-span-2 text-center font-bold font-sans py-1 rounded text-emerald-800 bg-emerald-100/70 border border-emerald-300">
                        1st Term Avg (100)
                      </span>
                    )}
                    {activeTermTab === 'Third Term' && (
                      <>
                        <span className="col-span-1 text-center font-bold font-sans py-1 rounded text-emerald-800 bg-emerald-100/70 border border-emerald-300">
                          1st Term# (20)
                        </span>
                        <span className="col-span-1 text-center font-bold font-sans py-1 rounded text-emerald-900 bg-emerald-150 border border-emerald-300">
                          2nd Term# (20)
                        </span>
                        <span className="col-span-1 text-center font-bold font-sans py-1 rounded text-emerald-900 bg-emerald-150 border border-emerald-300">
                          3rd Term# (60)
                        </span>
                      </>
                    )}
                    <span className={(activeTermTab === 'Second Term' && editingIsSecondary) ? "col-span-3 text-center font-bold font-sans py-1 rounded text-emerald-900 bg-emerald-150 border border-emerald-300" : "col-span-2 text-center font-bold font-sans py-1 rounded text-emerald-900 bg-emerald-150 border border-emerald-300"} title="Automatically calculated from Student grades list ranking">
                      Subject Position (Auto)
                    </span>
                    <span className="col-span-1 text-center font-bold text-slate-400">Action</span>
                  </div>

                  <div className="divide-y max-h-96 overflow-y-auto min-w-[850px]">
                    {editSubjects.map(subj => {
                      const subjTotal = subj.testScore + subj.examScore;
                      const fTermVal = subj.firstTermSummary !== undefined ? subj.firstTermSummary : 0;
                      const sTermVal = subj.secondTermSummary !== undefined ? subj.secondTermSummary : 0;
                      const tTermVal = subj.thirdTermSummary !== undefined ? subj.thirdTermSummary : 0;
                      return (
                        <div key={subj.id} className="p-3 grid grid-cols-12 items-center text-xs font-semibold text-slate-800 hover:bg-slate-50">
                          <div className={(activeTermTab === 'Third Term' || (activeTermTab === 'Second Term' && editingIsSecondary)) ? "col-span-3 flex items-center pr-2" : "col-span-4 flex items-center pr-2"}>
                            {(() => {
                              const isKgClass = editingStudent && (editingStudent.className === 'Nursery 1' || editingStudent.className === 'Nursery 2' || editingStudent.className === 'Nursery 3');
                              const isPermanentKgSubject = !!(isKgClass && NURSERY_SUBJECTS.map(s => s.toLowerCase()).includes(subj.name.toLowerCase()));
                              return (
                                <input
                                  type="text"
                                  required
                                  disabled={true}
                                  value={subj.name}
                                  onChange={(e) => handleSubjectNameChange(subj.id, e.target.value)}
                                  placeholder="e.g. Mathematics"
                                  className="w-full bg-slate-100 border border-slate-200 py-1 px-1.5 rounded text-xs font-bold text-slate-500 outline-none transition-all font-sans cursor-not-allowed"
                                />
                              );
                            })()}
                          </div>
                          <span className={(activeTermTab === 'Third Term' || (activeTermTab === 'Second Term' && editingIsSecondary)) ? "col-span-1 flex justify-center px-1" : "col-span-2 flex justify-center px-1"}>
                            <input
                              type="number"
                              min={0}
                              max={30}
                              disabled={isTermReadOnly}
                              value={focusedInputs[`${subj.id}_test`] && subj.testScore === 0 ? '' : subj.testScore}
                              onFocus={() => setFocusedInputs(prev => ({ ...prev, [`${subj.id}_test`]: true }))}
                              onBlur={() => setFocusedInputs(prev => ({ ...prev, [`${subj.id}_test`]: false }))}
                              onChange={(e) => handleScoreChange(subj.id, 'test', parseInt(e.target.value) || 0)}
                              className="w-14 bg-white border border-slate-200 py-1 rounded text-center outline-none focus:border-emerald-600 font-bold font-mono text-slate-800 disabled:opacity-75 disabled:cursor-not-allowed"
                            />
                          </span>
                          <span className={(activeTermTab === 'Third Term' || (activeTermTab === 'Second Term' && editingIsSecondary)) ? "col-span-1 flex justify-center px-1" : "col-span-2 flex justify-center px-1"}>
                            <input
                              type="number"
                              min={0}
                              max={70}
                              disabled={isTermReadOnly}
                              value={focusedInputs[`${subj.id}_exam`] && subj.examScore === 0 ? '' : subj.examScore}
                              onFocus={() => setFocusedInputs(prev => ({ ...prev, [`${subj.id}_exam`]: true }))}
                              onBlur={() => setFocusedInputs(prev => ({ ...prev, [`${subj.id}_exam`]: false }))}
                              onChange={(e) => handleScoreChange(subj.id, 'exam', parseInt(e.target.value) || 0)}
                              className="w-14 bg-white border border-slate-200 py-1 rounded text-center outline-none focus:border-emerald-600 font-bold font-mono text-slate-800 disabled:opacity-75 disabled:cursor-not-allowed"
                            />
                          </span>
                          <span className="col-span-1 text-center font-extrabold font-mono text-emerald-900 bg-emerald-50/40 py-1 rounded border font-sans select-none">
                            {subjTotal}
                          </span>
                          
                          {activeTermTab === 'Second Term' && editingIsSecondary && (
                            <span className="col-span-2 flex justify-center px-1">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                disabled={isTermReadOnly}
                                value={focusedInputs[`${subj.id}_firstTerm`] && fTermVal === 0 ? '' : fTermVal}
                                onFocus={() => setFocusedInputs(prev => ({ ...prev, [`${subj.id}_firstTerm`]: true }))}
                                onBlur={() => setFocusedInputs(prev => ({ ...prev, [`${subj.id}_firstTerm`]: false }))}
                                onChange={(e) => handleScoreChange(subj.id, 'firstTerm', parseInt(e.target.value) || 0)}
                                className="w-14 py-1 rounded text-center outline-none font-bold font-mono bg-emerald-50/50 border border-emerald-200 focus:border-emerald-500 text-emerald-800 font-extrabold scale-[1.03] disabled:opacity-75 disabled:cursor-not-allowed"
                              />
                            </span>
                          )}

                          {activeTermTab === 'Third Term' && (
                            <>
                              {/* First Term Summary */}
                              <span className="col-span-1 flex justify-center px-1">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  disabled={isTermReadOnly}
                                  value={focusedInputs[`${subj.id}_firstTerm`] && fTermVal === 0 ? '' : fTermVal}
                                  onFocus={() => setFocusedInputs(prev => ({ ...prev, [`${subj.id}_firstTerm`]: true }))}
                                  onBlur={() => setFocusedInputs(prev => ({ ...prev, [`${subj.id}_firstTerm`]: false }))}
                                  onChange={(e) => handleScoreChange(subj.id, 'firstTerm', parseInt(e.target.value) || 0)}
                                  className="w-14 py-1 rounded text-center outline-none font-bold font-mono bg-emerald-50/50 border border-emerald-200 focus:border-emerald-500 text-emerald-800 font-extrabold scale-[1.03] disabled:opacity-75 disabled:cursor-not-allowed"
                                />
                              </span>

                              {/* Second Term Summary */}
                              <span className="col-span-1 flex justify-center px-1">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  disabled={isTermReadOnly}
                                  value={focusedInputs[`${subj.id}_secondTerm`] && sTermVal === 0 ? '' : sTermVal}
                                  onFocus={() => setFocusedInputs(prev => ({ ...prev, [`${subj.id}_secondTerm`]: true }))}
                                  onBlur={() => setFocusedInputs(prev => ({ ...prev, [`${subj.id}_secondTerm`]: false }))}
                                  onChange={(e) => handleScoreChange(subj.id, 'secondTerm', parseInt(e.target.value) || 0)}
                                  className="w-14 py-1 rounded text-center outline-none font-bold font-mono bg-emerald-50 border border-emerald-200 focus:border-emerald-505 text-emerald-990 font-extrabold scale-[1.03] disabled:opacity-75 disabled:cursor-not-allowed"
                                />
                              </span>

                              {/* Third Term Summary */}
                              <span className="col-span-1 flex justify-center px-1">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  disabled={isTermReadOnly}
                                  value={focusedInputs[`${subj.id}_thirdTerm`] && tTermVal === 0 ? '' : tTermVal}
                                  onFocus={() => setFocusedInputs(prev => ({ ...prev, [`${subj.id}_thirdTerm`]: true }))}
                                  onBlur={() => setFocusedInputs(prev => ({ ...prev, [`${subj.id}_thirdTerm`]: false }))}
                                  onChange={(e) => handleScoreChange(subj.id, 'thirdTerm', parseInt(e.target.value) || 0)}
                                  className="w-14 py-1 rounded text-center outline-none font-bold font-mono bg-emerald-50 border border-emerald-200 focus:border-indigo-500 text-emerald-900 font-extrabold scale-[1.03] disabled:opacity-75 disabled:cursor-not-allowed"
                                />
                              </span>
                            </>
                          )}

                          {/* Position (Auto calculated Rank) */}
                          <span className={(activeTermTab === 'Second Term' && editingIsSecondary) ? "col-span-3 flex justify-center px-2" : "col-span-2 flex justify-center px-2"}>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded font-mono font-bold text-xs" title="Position is automatically calculated based on class subject ranking">
                              {formatOrdinal(subj.position || 1)}
                            </span>
                          </span>

                          {/* Action Button */}
                          <div className="col-span-1 flex justify-center">
                            {(() => {
                              const isKgClass = editingStudent && (editingStudent.className === 'Nursery 1' || editingStudent.className === 'Nursery 2' || editingStudent.className === 'Nursery 3');
                              const isPermanentKgSubject = !!(isKgClass && NURSERY_SUBJECTS.map(s => s.toLowerCase()).includes(subj.name.toLowerCase()));
                              
                              if (isPermanentKgSubject) {
                                return <span className="text-slate-450 select-none text-[10px]">📌 Fixed</span>;
                              }
                              
                              return !isTermReadOnly ? (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSubject(subj.id, subj.name)}
                                  title={`Delete ${subj.name}`}
                                  className="p-1.5 text-slate-450 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer flex-shrink-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              ) : (
                                <span className="text-slate-350 select-none text-[10px]">🔒 Locked</span>
                              );
                            })()}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-3 bg-slate-50 border-t flex justify-between items-center min-w-[850px]">
                    <span className="text-[10px] text-slate-400 font-semibold italic">
                      💡 Tip: Click on any Subject Course Title input to rename the course.
                    </span>
                    <button
                      type="button"
                      disabled={isTermReadOnly}
                      onClick={handleAddNewSubject}
                      className={`font-extrabold text-[10px] tracking-wider uppercase px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                        isTermReadOnly 
                          ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed select-none' 
                          : 'bg-emerald-600 hover:bg-emerald-750 text-white'
                      }`}
                    >
                      {isTermReadOnly ? <Lock className="w-3.5 h-3.5 text-slate-400" /> : <Plus className="w-3.5 h-3.5" />} 
                      Add New Subject Course Row
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Behavior scores & teacher remarks */}
              <div className="lg:col-span-4 space-y-6">
                <div className="space-y-4">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider border-b pb-1.5 flex justify-between">
                    <span>Conduct Trait Ratings</span>
                    <span className="text-[10px] text-slate-400 capitalize">Guide: 1 to 5</span>
                  </h4>

                  {(() => {
                    const isKg = editingStudent && (editingStudent.className === 'Pre-Nursery' || editingStudent.className.startsWith('Nursery'));
                    if (isKg) {
                      const behaviouralList = editBehaviour.filter(b => 
                        ["Punctuality", "Neatness", "Assignment", "Concentration"].includes(b.name)
                      );
                      const skillList = editBehaviour.filter(b => 
                        ["Hand-writing", "Fluency", "Attitude to Property"].includes(b.name)
                      );
                      return (
                        <div className="space-y-4 max-h-[300px] overflow-y-auto">
                          <div className="space-y-2">
                            <h5 className="font-extrabold text-[#047857] text-[10px] uppercase tracking-wider">Behavioural Ratings</h5>
                            <div className="space-y-2 border p-3 rounded-2xl bg-white shadow-3xs">
                              {behaviouralList.length === 0 ? (
                                <p className="text-[9px] text-slate-400 italic">No ratings</p>
                              ) : behaviouralList.map(b => (
                                <div key={b.name} className="flex justify-between items-center text-xs border-b border-dashed border-slate-200 py-1.5 last:border-none">
                                  <span className="font-bold text-slate-700 text-[11px]">{b.name}</span>
                                  <select
                                    disabled={isTermReadOnly}
                                    value={b.rating}
                                    onChange={(e) => handleBehaviourChange(b.name, parseInt(e.target.value))}
                                    className="bg-white border rounded text-xs px-1.5 py-0.5 outline-none font-bold text-emerald-950 disabled:opacity-75 disabled:cursor-not-allowed"
                                  >
                                    {[1, 2, 3, 4, 5].map(v => (
                                      <option key={v} value={v}>{v}</option>
                                    ))}
                                  </select>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <h5 className="font-extrabold text-[#047857] text-[10px] uppercase tracking-wider">Skill Ratings</h5>
                            <div className="space-y-2 border p-3 rounded-2xl bg-white shadow-3xs">
                              {skillList.length === 0 ? (
                                <p className="text-[9px] text-slate-400 italic">No ratings</p>
                              ) : skillList.map(b => (
                                <div key={b.name} className="flex justify-between items-center text-xs border-b border-dashed border-slate-200 py-1.5 last:border-none">
                                  <span className="font-bold text-slate-700 text-[11px]">{b.name}</span>
                                  <select
                                    disabled={isTermReadOnly}
                                    value={b.rating}
                                    onChange={(e) => handleBehaviourChange(b.name, parseInt(e.target.value))}
                                    className="bg-white border rounded text-xs px-1.5 py-0.5 outline-none font-bold text-emerald-950 disabled:opacity-75 disabled:cursor-not-allowed"
                                  >
                                    {[1, 2, 3, 4, 5].map(v => (
                                      <option key={v} value={v}>{v}</option>
                                    ))}
                                  </select>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div className="space-y-2 max-h-56 overflow-y-auto border p-3 rounded-2xl bg-slate-50/50">
                          {editBehaviour.map(b => (
                            <div key={b.name} className="flex justify-between items-center text-xs border-b border-dashed border-slate-200 py-1.5 last:border-none">
                              <span className="font-bold text-slate-700 text-[11px]">{b.name}</span>
                              <select
                                disabled={isTermReadOnly}
                                value={b.rating}
                                onChange={(e) => handleBehaviourChange(b.name, parseInt(e.target.value))}
                                className="bg-white border rounded text-xs px-1.5 py-0.5 outline-none font-bold text-emerald-950 disabled:opacity-75 disabled:cursor-not-allowed"
                              >
                                {[1, 2, 3, 4, 5].map(v => (
                                  <option key={v} value={v}>{v}</option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      );
                    }
                  })()}
                </div>

                <div className="space-y-4 pt-2">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider border-b pb-1.5">
                    Official Comments & Signing Authorities
                  </h4>

                  <div className="space-y-3.5 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Form Teacher Remarks</label>
                      <textarea
                        disabled={isTermReadOnly}
                        value={editFormComment}
                        onChange={(e) => setEditFormComment(e.target.value)}
                        rows={3}
                        placeholder="Write term summary remark..."
                        className="w-full bg-slate-50 border p-2 text-xs rounded-lg outline-none font-medium text-slate-700 focus:border-emerald-600 disabled:opacity-75 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Principal's Remarks (Optional, Overrides Dynamic Default)</label>
                      <textarea
                        disabled={isTermReadOnly}
                        value={editPrincipalRemark}
                        onChange={(e) => setEditPrincipalRemark(e.target.value)}
                        rows={3}
                        placeholder="Write principal's performance summary comment..."
                        className="w-full bg-slate-50 border p-2 text-xs rounded-lg outline-none font-medium text-slate-700 focus:border-emerald-600 disabled:opacity-75 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Form Teacher’s Authorized Name</label>
                      <input
                        type="text"
                        disabled={isTermReadOnly}
                        value={editTeacherName}
                        onChange={(e) => setEditTeacherName(e.target.value)}
                        className="w-full bg-slate-50 border p-1.5 text-xs rounded-lg outline-none font-bold text-slate-700 disabled:opacity-75 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Resumption Date (Next Term)</label>
                      <input
                        type="text"
                        disabled={isTermReadOnly}
                        value={editResumeDate}
                        onChange={(e) => setEditResumeDate(e.target.value)}
                        className="w-full bg-slate-50 border p-1.5 text-xs rounded-lg outline-none font-bold text-emerald-800 font-mono disabled:opacity-75 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Buttons and actions */}
            <div className="border-t pt-6 mt-8 flex justify-end gap-3 print:hidden">
              <button
                disabled={isSavingScores}
                onClick={() => setEditingStudent(null)}
                className="border border-slate-350 hover:bg-slate-50 text-slate-650 font-bold text-xs px-6 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTermReadOnly ? 'Close Profile' : 'Discard Changes'}
              </button>
              {!isTermReadOnly && (
                <button
                  disabled={isSavingScores || isSaving}
                  onClick={saveStudentChanges}
                  className="bg-emerald-800 hover:bg-emerald-950 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-emerald-900/10 cursor-pointer whitespace-nowrap disabled:bg-emerald-950/70 disabled:cursor-not-allowed"
                >
                  {(isSavingScores || isSaving) ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
                  {(isSavingScores || isSaving) ? 'Saving...' : 'Save Score'}
                </button>
              )}
            </div>

            {/* Interactive Real-Time Report Sheet Live Preview */}
            <div className="mt-12 pt-12 border-t border-slate-200">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="bg-emerald-100 text-emerald-850 font-extrabold text-[9px] tracking-widest uppercase px-2.5 py-1 rounded-md border border-emerald-200 inline-block font-sans select-none">
                    Interactive Live Feed
                  </span>
                  <h4 className="text-sm font-black text-slate-900 mt-2">Termly Report Sheet Draft Preview</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Calculates final averages, letter grades achievements, and GPAs live as you modify figures above.</p>
                </div>
                <div className="text-[11px] font-bold text-slate-400 italic">
                  📝 Unsaved working draft
                </div>
              </div>

              {(() => {
                // Reconstruct transient draft student record matching the editing state
                const previewStudent: Student = {
                  ...editingStudent,
                  age: editAge,
                  sex: editSex,
                  attendancePresent: editAttendancePresent,
                  attendanceTotal: editAttendanceTotal,
                  subjects: editSubjects,
                  behaviour: editBehaviour,
                  formTeacherRemark: editFormComment,
                  formTeacherName: editTeacherName,
                  principalName: editPrincipalName,
                  resumptionDate: editResumeDate
                };

                const stats = calculateStudentStatsForTerm(previewStudent, activeTermTab);
                const isSecondary = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2A', 'SS2B', 'SS3A', 'SS3B'].includes((previewStudent?.className || '').replace(/\s+/g, ''));
                
                return (
                  <div 
                    className="bg-white border border-slate-205 rounded-3xl shadow-lg p-6 sm:p-12 space-y-8 relative text-slate-800 select-none max-w-5xl mx-auto"
                  >
                    {/* Visual slate borders */}
                    <div className="absolute inset-3 border border-slate-100 rounded-2xl pointer-events-none"></div>

                    {/* Ezibeck Style Header Breadcrumbs */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-400 border-b border-slate-100/70 pb-3 mb-2 relative z-10">
                      <span>🏫 {template.schoolName}</span>
                      <span>/</span>
                      <span>📁 Draft Sandbox</span>
                      <span>/</span>
                      <span>👥 {previewStudent.className}</span>
                      <span>/</span>
                      <span className="text-slate-700 font-semibold">📄 {previewStudent.name}</span>
                    </div>

                    {/* School Header Section with centered text and badge on the left */}
                    <div className="relative flex flex-col sm:flex-row items-center sm:justify-center border-b border-slate-200/60 pb-6 mb-6 mt-4 select-none">
                      {/* School Badge on the left side */}
                      <div className="sm:absolute sm:left-0 flex-shrink-0 mb-4 sm:mb-0">
                        <div className="w-14 h-14 sm:w-20 sm:h-20 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden">
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
                        <h1 className="text-xl sm:text-3.5xl font-black text-slate-900 tracking-tight leading-none uppercase">
                          {template.schoolName}
                        </h1>
                        <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-emerald-700 font-bold flex items-center justify-center gap-1.5 select-none font-sans">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          Motto: {template.motto}
                        </p>
                        <p className="text-slate-500 text-[10px] leading-relaxed">
                          <strong>Registered Address:</strong> {template.address}
                        </p>
                      </div>
                    </div>

                    {/* Official status banner title */}
                    <div className="py-1">
                      <h2 className="text-xs sm:text-sm font-extrabold text-slate-805 tracking-tight uppercase flex items-center gap-2">
                        <span className="inline-block px-2 py-0.5 bg-emerald-800 text-white text-[9px] font-black rounded tracking-wider">WORKING DRAFT</span>
                        STUDENT’S TERMLY REPORT SHEET FOR {previewStudent.className.startsWith('JSS') ? 'JUNIOR' : 'SENIOR'} SECONDARY SCHOOL
                      </h2>
                    </div>

                    {/* Student Properties Grid */}
                    <div className="relative z-10 border border-slate-200/80 rounded-2xl bg-[#FCFCFC]/85 divide-y divide-slate-100 shadow-3xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-3.5 gap-x-6 p-4 sm:p-5 text-xs text-slate-700">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <span className="font-semibold text-slate-400 flex items-center gap-1.5 w-1/2">
                            <span>📝</span> Student Name
                          </span>
                          <span className="font-extrabold text-slate-900 text-right w-1/2 truncate">{previewStudent.name}</span>
                        </div>

                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <span className="font-semibold text-slate-400 flex items-center gap-1.5 w-1/2">
                            <span>🔑</span> Student ID
                          </span>
                          <span className="font-mono font-bold text-emerald-700 text-right w-1/2">{previewStudent.id}</span>
                        </div>

                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <span className="font-semibold text-slate-400 flex items-center gap-1.5 w-1/2">
                            <span>🏫</span> Class
                          </span>
                          <span className="font-extrabold text-slate-900 text-right w-1/2">{previewStudent.className}</span>
                        </div>

                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 sm:border-0 sm:pb-0">
                          <span className="font-semibold text-slate-400 flex items-center gap-1.5 w-1/2">
                            <span>🧬</span> Sex / Gender
                          </span>
                          <span className="font-bold text-slate-805 text-right w-1/2">{previewStudent.sex}</span>
                        </div>

                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 sm:border-0 sm:pb-0">
                          <span className="font-semibold text-slate-400 flex items-center gap-1.5 w-1/2">
                            <span>🎂</span> Age Profile
                          </span>
                          <span className="font-bold text-slate-805 text-right w-1/2">{previewStudent.age} Years</span>
                        </div>

                        <div className="flex items-center justify-between border-b border-slate-105 pb-1.5 sm:border-0 sm:pb-0">
                          <span className="font-semibold text-slate-400 flex items-center gap-1.5 w-1/2">
                            <span>📅</span> Report Date
                          </span>
                          <span className="font-bold text-slate-805 text-right w-1/2">{template.termDate}</span>
                        </div>

                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 lg:border-0 lg:pb-0">
                          <span className="font-semibold text-slate-400 flex items-center gap-1.5 w-1/2">
                            <span>🗓️</span> Academic Session
                          </span>
                          <span className="font-extrabold text-slate-900 text-right w-1/2">{template.session}</span>
                        </div>

                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 lg:border-0 lg:pb-0">
                          <span className="font-semibold text-slate-400 flex items-center gap-1.5 w-1/2">
                            <span>🚌</span> Attendance Present
                          </span>
                          <span className="font-bold text-slate-805 text-right w-1/2">{previewStudent.attendancePresent} / {previewStudent.attendanceTotal} sessions</span>
                        </div>

                        <div className="flex items-center justify-between lg:border-0">
                          <span className="font-semibold text-slate-400 flex items-center gap-1.5 w-1/2">
                            <span>🔄</span> Resumption Date
                          </span>
                          <span className="font-extrabold text-emerald-750 text-right w-1/2">{template.resumptionDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Part A: Academic Course Evaluation */}
                    <div className="relative z-10 space-y-4 font-sans">
                      <h3 className="text-slate-900 font-extrabold text-xs uppercase tracking-widest border-l-4 border-slate-900 pl-2.5 pb-0.5 flex items-center justify-between">
                        <span>Part A: Academic Course Evaluation</span>
                      </h3>
                      
                      {/* Ezibeck Table draft view */}
                      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-3xs">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-[#F7F7F7] border-b border-slate-200 text-slate-500 font-medium text-[10.5px]">
                              <th className="py-2.5 px-3 border-r border-slate-200 min-w-[150px]">📝 Subjects</th>
                              <th className="py-2.5 px-3 border-r border-slate-200 text-center w-24"># TEST (30)</th>
                              <th className="py-2.5 px-3 border-r border-slate-200 text-center w-24"># EXAM (70)</th>
                              <th className="py-2.5 px-3 border-r border-slate-200 text-center bg-emerald-50/10 w-24 text-emerald-750">Σ TERM (100)</th>
                              {activeTermTab === 'Second Term' && isSecondary && (
                                <th className="py-2.5 px-3 border-r border-slate-200 text-center text-[10px] w-24 bg-blue-50 text-blue-900 font-extrabold">
                                  1st Term Avg
                                </th>
                              )}
                              {activeTermTab === 'Third Term' && (
                                <>
                                  <th className="py-2.5 px-3 border-r border-slate-200 text-center text-[10px] w-20"># 1ST TERM</th>
                                  <th className="py-2.5 px-3 border-r border-slate-200 text-center text-[10px] w-20"># 2ND TERM</th>
                                  <th className="py-2.5 px-3 border-r border-slate-205 text-center text-[10px] w-20"># 3RD TERM</th>
                                  <th className="py-2.5 px-3 border-r border-slate-200 text-center bg-emerald-50/10 w-28 text-slate-800 font-bold">Σ SESSION AVE</th>
                                </>
                              )}
                              <th className="py-2.5 px-3 border-r border-slate-200 text-center w-20">Σ GRADE</th>
                              <th className="py-2.5 px-3 border-r border-slate-200 text-center w-16"># POSITION</th>
                              <th className="py-2.5 px-4 font-bold text-slate-500">💬 TEACHER'S REMARK</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {previewStudent.subjects.map(subj => {
                              const tot = calculateSubjectTotal(subj);
                              
                              const firstTerm = subj.firstTermSummary !== undefined && subj.firstTermSummary !== 0 ? subj.firstTermSummary : Math.round(tot * 0.2);
                              const secondTerm = subj.secondTermSummary !== undefined && subj.secondTermSummary !== 0 ? subj.secondTermSummary : Math.round(tot * 0.2);
                              const thirdTerm = subj.thirdTermSummary !== undefined && subj.thirdTermSummary !== 0 ? subj.thirdTermSummary : Math.round(tot * 0.6);
                              const sessionAvg = firstTerm + secondTerm + thirdTerm;

                              const { letter, remark, ratingClass } = getLetterAndRemark(
                                activeTermTab === 'Third Term' ? sessionAvg : tot
                              );

                              return (
                                <tr key={subj.id} className="hover:bg-slate-50/60 transition-all">
                                  <td className="py-2.5 px-3 border-r border-slate-100 font-extrabold text-slate-1000 bg-slate-50/20">{subj.name}</td>
                                  <td className="py-2.5 px-3 border-r border-slate-100 text-center font-mono text-slate-550">{subj.testScore}</td>
                                  <td className="py-2.5 px-3 border-r border-slate-100 text-center font-mono text-slate-550">{subj.examScore}</td>
                                  <td className="py-2.5 px-3 border-r border-slate-100 text-center font-black font-mono text-emerald-750 bg-emerald-50/10">{tot}</td>
                                  {activeTermTab === 'Second Term' && isSecondary && (
                                    <td className="py-2.5 px-3 border-r border-slate-100 text-center font-mono font-bold text-slate-955 bg-blue-50/10">
                                      {(() => {
                                        let firstTermAvgStr = "-";
                                        const baseId = previewStudent.id.split('_')[0];
                                        try {
                                          const firstTermKey = 'ezibeck_students_first_term';
                                          const firstTermData = typeof window !== 'undefined' ? localStorage.getItem(firstTermKey) : null;
                                          const parsedFirst = firstTermData ? JSON.parse(firstTermData) : [];
                                          const firstTermStuds: Student[] = Array.isArray(parsedFirst) ? parsedFirst : [];
                                          const matchMatch = firstTermStuds.find(s => s.id.startsWith(baseId));
                                          const matchSubj = matchMatch?.subjects.find(s => s.name.toLowerCase() === subj.name.toLowerCase());
                                          if (matchSubj) {
                                            firstTermAvgStr = String((matchSubj.testScore || 0) + (matchSubj.examScore || 0)) + "%";
                                          } else if (subj.firstTermSummary !== undefined && subj.firstTermSummary !== 0) {
                                            firstTermAvgStr = String(subj.firstTermSummary) + "%";
                                          } else {
                                            firstTermAvgStr = String(Math.round(tot * 0.75)) + "%";
                                          }
                                        } catch (e) {
                                          console.error(e);
                                        }
                                        return firstTermAvgStr;
                                      })()}
                                    </td>
                                  )}
                                  {activeTermTab === 'Third Term' && (
                                    <>
                                      <td className="py-2.5 px-3 border-r border-slate-100 text-center font-mono text-slate-450">{firstTerm}</td>
                                      <td className="py-2.5 px-3 border-r border-slate-100 text-center font-mono text-slate-450">{secondTerm}</td>
                                      <td className="py-2.5 px-3 border-r border-slate-100 text-center font-mono text-slate-450">{thirdTerm}</td>
                                      <td className="py-2.5 px-3 border-r border-slate-100 text-center font-black font-mono text-emerald-700 bg-slate-50/40">{sessionAvg}</td>
                                    </>
                                  )}
                                  <td className="py-2.5 px-3 border-r border-slate-100 text-center">
                                    <span className={`px-2 py-0.5 text-[10px] font-black rounded-sm tracking-wider ${ratingClass}`}>
                                      {letter}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 border-r border-slate-100 text-center font-bold text-slate-800 bg-slate-50/20">{formatOrdinal(subj.position)}</td>
                                  <td className="py-2.5 px-4 italic text-slate-500 text-[11px] font-normal leading-tight">{remark}</td>
                                </tr>
                              );
                            })}
                            {/* Calculation Footer styled exactly like Ezibeck database table calculation footer */}
                            <tr className="bg-[#FAF9F9]/90 border-t border-slate-205 text-slate-400 font-medium select-none text-[10px] uppercase tracking-wider divide-x divide-slate-100">
                              <td className="py-2 px-3 font-semibold text-slate-500">
                                Count: {previewStudent.subjects.length}
                              </td>
                              <td className="py-2 px-3 text-center font-bold">
                                Average: {(() => {
                                  const tCount = previewStudent.subjects.length || 1;
                                  const testSum = previewStudent.subjects.reduce((sum, s) => sum + (s.testScore || 0), 0);
                                  return (testSum / tCount).toFixed(1);
                                })()}
                              </td>
                              <td className="py-2 px-3 text-center font-bold">
                                Average: {(() => {
                                  const tCount = previewStudent.subjects.length || 1;
                                  const examSum = previewStudent.subjects.reduce((sum, s) => sum + (s.examScore || 0), 0);
                                  return (examSum / tCount).toFixed(1);
                                })()}
                              </td>
                              <td className="py-2 px-3 text-center font-black text-indigo-705 bg-emerald-50/10">
                                Average: {stats.avgScore.toFixed(1)}%
                              </td>
                              {activeTermTab === 'Third Term' && (
                                <>
                                  <td className="py-2 px-3 text-center font-bold">
                                    Average: {(() => {
                                      const tCount = previewStudent.subjects.length || 1;
                                      const fSum = previewStudent.subjects.reduce((sum, s) => sum + (s.firstTermSummary !== undefined ? s.firstTermSummary : 0), 0);
                                      return (fSum / tCount).toFixed(1);
                                    })()}
                                  </td>
                                  <td className="py-2 px-3 text-center font-bold">
                                    Average: {(() => {
                                      const tCount = previewStudent.subjects.length || 1;
                                      const sSum = previewStudent.subjects.reduce((sum, s) => sum + (s.secondTermSummary !== undefined ? s.secondTermSummary : 0), 0);
                                      return (sSum / tCount).toFixed(1);
                                    })()}
                                  </td>
                                  <td className="py-2 px-3 text-center font-bold">
                                    Average: {(() => {
                                      const tCount = previewStudent.subjects.length || 1;
                                      const thSum = previewStudent.subjects.reduce((sum, s) => sum + (s.thirdTermSummary !== undefined ? s.thirdTermSummary : 0), 0);
                                      return (thSum / tCount).toFixed(1);
                                    })()}
                                  </td>
                                  <td className="py-2 px-3 text-center font-black bg-slate-100/50">
                                    Average: {(() => {
                                      const tCount = previewStudent.subjects.length || 1;
                                      const sessionSum = previewStudent.subjects.reduce((sum, s) => {
                                        const f = s.firstTermSummary !== undefined ? s.firstTermSummary : 0;
                                        const sec = s.secondTermSummary !== undefined ? s.secondTermSummary : 0;
                                        const th = s.thirdTermSummary !== undefined ? s.thirdTermSummary : 0;
                                        return sum + (f + sec + th);
                                      }, 0);
                                      return (sessionSum / tCount).toFixed(1);
                                    })()}%
                                  </td>
                                </>
                              )}
                              <td className="py-2 px-3" colSpan={3}></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* KPI Widget Row - optimized to single row with reduced size */}
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

                      {activeTermTab === 'Second Term' && (
                        <div className="flex-1 min-w-[70px] bg-[#FAF9F9] border border-slate-150 py-1.5 px-1 sm:py-2 px-1.5 rounded-lg text-center space-y-0.5 shadow-3xs">
                          <span className="text-[7.5px] sm:text-[8.5px] font-black text-slate-400 uppercase tracking-widest block leading-none">1st Term Avg</span>
                          <p className="font-extrabold text-slate-900 text-[10.5px] sm:text-xs leading-none">
                            {(() => {
                              const avg = getOverallAverageForTerm(previewStudent.id, 'ezibeck_students_first_term');
                              return avg !== null ? `${avg.toFixed(1)}%` : "N/A";
                            })()}
                          </p>
                        </div>
                      )}

                      {activeTermTab === 'Third Term' && (
                        <>
                          <div className="flex-1 min-w-[70px] bg-[#FAF9F9] border border-slate-150 py-1.5 px-1 sm:py-2 px-1.5 rounded-lg text-center space-y-0.5 shadow-3xs">
                            <span className="text-[7.5px] sm:text-[8.5px] font-black text-slate-400 uppercase tracking-widest block leading-none">1st Term Avg</span>
                            <p className="font-extrabold text-slate-900 text-[10.5px] sm:text-xs leading-none">
                              {(() => {
                                const avg = getOverallAverageForTerm(previewStudent.id, 'ezibeck_students_first_term');
                                return avg !== null ? `${avg.toFixed(1)}%` : "N/A";
                              })()}
                            </p>
                          </div>
                          <div className="flex-1 min-w-[70px] bg-[#FAF9F9] border border-slate-150 py-1.5 px-1 sm:py-2 px-1.5 rounded-lg text-center space-y-0.5 shadow-3xs">
                            <span className="text-[7.5px] sm:text-[8.5px] font-black text-slate-400 uppercase tracking-widest block leading-none">2nd Term Avg</span>
                            <p className="font-extrabold text-slate-900 text-[10.5px] sm:text-xs leading-none">
                              {(() => {
                                const avg = getOverallAverageForTerm(previewStudent.id, 'ezibeck_students_second_term');
                                return avg !== null ? `${avg.toFixed(1)}%` : "N/A";
                              })()}
                            </p>
                          </div>
                        </>
                      )}

                      {activeTermTab === 'Third Term' && (
                        <>
                          <div className="flex-1 min-w-[70px] bg-[#FAF9F9] border border-slate-150 py-1.5 px-1 sm:py-2 px-1.5 rounded-lg text-center space-y-0.5 shadow-3xs">
                            <span className="text-[7.5px] sm:text-[8.5px] font-black text-slate-400 uppercase tracking-widest block leading-none">1st Term (20%)</span>
                            <p className="font-extrabold text-slate-900 text-[10.5px] sm:text-xs leading-none">
                              {(() => {
                                const tCount = previewStudent.subjects.length || 1;
                                const fSum = previewStudent.subjects.reduce((sum, s) => sum + (s.firstTermSummary !== undefined ? s.firstTermSummary : 0), 0);
                                return (fSum / tCount).toFixed(1);
                              })()}<span className="text-[8px] text-slate-400 font-normal">/20</span>
                            </p>
                          </div>

                          <div className="flex-1 min-w-[70px] bg-[#FAF9F9] border border-slate-150 py-1.5 px-1 sm:py-2 px-1.5 rounded-lg text-center space-y-0.5 shadow-3xs">
                            <span className="text-[7.5px] sm:text-[8.5px] font-black text-slate-400 uppercase tracking-widest block leading-none">2nd Term (20%)</span>
                            <p className="font-extrabold text-slate-900 text-[10.5px] sm:text-xs leading-none">
                              {(() => {
                                const tCount = previewStudent.subjects.length || 1;
                                const sSum = previewStudent.subjects.reduce((sum, s) => sum + (s.secondTermSummary !== undefined ? s.secondTermSummary : 0), 0);
                                return (sSum / tCount).toFixed(1);
                              })()}<span className="text-[8px] text-slate-400 font-normal">/20</span>
                            </p>
                          </div>

                          <div className="flex-1 min-w-[70px] bg-[#FAF9F9] border border-slate-150 py-1.5 px-1 sm:py-2 px-1.5 rounded-lg text-center space-y-0.5 shadow-3xs">
                            <span className="text-[7.5px] sm:text-[8.5px] font-black text-slate-400 uppercase tracking-widest block leading-none">3rd Term (60%)</span>
                            <p className="font-extrabold text-slate-900 text-[10.5px] sm:text-xs leading-none">
                              {(() => {
                                const tCount = previewStudent.subjects.length || 1;
                                const thSum = previewStudent.subjects.reduce((sum, s) => sum + (s.thirdTermSummary !== undefined ? s.thirdTermSummary : 0), 0);
                                return (thSum / tCount).toFixed(1);
                              })()}<span className="text-[8px] text-slate-400 font-normal">/60</span>
                            </p>
                          </div>
                        </>
                      )}

                      <div className="flex-1 min-w-[70px] bg-[#FAF9F9] border border-slate-150 py-1.5 px-1 sm:py-2 px-1.5 rounded-lg text-center space-y-0.5 shadow-3xs">
                        <span className="text-[7.5px] sm:text-[8.5px] font-black text-slate-400 uppercase tracking-widest block leading-none">Attendance</span>
                        <p className="font-extrabold text-emerald-600 text-[10.5px] sm:text-xs leading-none">
                          {Math.round(previewStudent.attendancePresent / previewStudent.attendanceTotal * 100) || 0}%
                        </p>
                      </div>
                    </div>

                    {/* Academic Accomplishments: Credits, Fails & Subject count strip */}
                    <div className="relative z-10 grid grid-cols-3 gap-2 sm:gap-4 select-none leading-none w-full">
                      <div className="bg-sky-50/40 border border-sky-150 rounded-lg py-1.5 px-3 flex items-center justify-between text-[11px] text-sky-900 font-medium shadow-3xs">
                        <span className="flex items-center gap-1.5 uppercase font-extrabold tracking-wider text-[9px] text-slate-500 flex-wrap sm:flex-nowrap">
                          <span className="text-sky-550 font-black">📚</span> Number of Subjects:
                        </span>
                        <span className="font-black text-sky-850 text-xs">{previewStudent.subjects.length} Total</span>
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

                    {/* Behavioral & Conduct assessment Part B */}
                    {(() => {
                      const cleanClassName = (previewStudent?.className || '').replace(/\s+/g, '');
                      const isSecondaryClass = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2A', 'SS2B', 'SS3A', 'SS3B'].includes(cleanClassName);
                      if (isSecondaryClass) return null;
                      return (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
                          <div className="lg:col-span-12 bg-[#FCFCFC]/60 border border-slate-150 p-5 rounded-2xl space-y-3.5 shadow-3xs">
                            <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-widest border-l-4 border-emerald-600 pl-2">
                              Part B: Character & Behavioral Conduct Ratings
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-2 text-xs text-slate-800">
                              {(() => {
                                const isKgClass = previewStudent.className === 'Pre-Nursery' || previewStudent.className.startsWith('Nursery');
                                if (isKgClass) {
                                  const behaviouralList = previewStudent.behaviour.filter(b => 
                                    ["Punctuality", "Neatness", "Assignment", "Concentration"].includes(b.name)
                                  );
                                  const skillList = previewStudent.behaviour.filter(b => 
                                    ["Hand-writing", "Fluency", "Attitude to Property"].includes(b.name)
                                  );
                                  return (
                                    <div className="col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-1.5">
                                        <h5 className="font-bold text-[10.5px] text-slate-400 uppercase tracking-wider border-b pb-0.5">Behavioural Ratings</h5>
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
                                        <h5 className="font-bold text-[10.5px] text-slate-400 uppercase tracking-wider border-b pb-0.5">Skill Ratings</h5>
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
                                  return previewStudent.behaviour.map(b => (
                                    <div key={b.name} className="flex items-center justify-between py-1 border-b border-dashed border-slate-150">
                                      <span className="font-semibold text-slate-600 text-left truncate max-w-[200px]">{b.name}</span>
                                      <span className="font-mono font-black text-[10px] text-emerald-755 bg-emerald-50 border border-emerald-100/60 px-1.5 py-0.5 rounded-md">
                                        {b.rating} / 5
                                      </span>
                                    </div>
                                  ));
                                }
                              })()}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Part C: Appraisals and Signatures */}
                    <div className="grid grid-cols-2 print:grid-cols-2 gap-4 md:gap-6 relative z-10 pt-6 border-t border-dashed border-slate-200">
                      {/* Form Teacher Remark Callout */}
                      <div className="bg-[#FAF9F9] border border-slate-200 p-5 rounded-2xl space-y-4 flex flex-col justify-between shadow-3xs text-slate-800 text-xs text-left">
                        <div>
                          <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-200/50 pb-1.5 flex items-center gap-1.5">
                            <span>💬 Form Teacher's Appraisal</span>
                          </h4>
                          <p className="italic text-slate-600 pt-3 leading-relaxed">
                            "{previewStudent.formTeacherRemark}"
                          </p>
                        </div>
                        
                        {(() => {
                          const cleanClassName = (previewStudent.className || '').replace(/\s+/g, '');
                          const isNursery = ['Pre-Nursery', 'Nursery1', 'Nursery2', 'Nursery3'].includes(cleanClassName);
                          const isBasic = ['Basic1', 'Basic2', 'Basic3', 'Basic4', 'Basic5', 'Basic6'].includes(cleanClassName);

                          let fallbackTeacher = '';
                          if (isBasic) {
                            fallbackTeacher = template.formTeacherJunior || "Headmistress";
                          } else if (isNursery) {
                            fallbackTeacher = template.formTeacherSenior || "Nursery Admin";
                          } else {
                            fallbackTeacher = template.principalName || "Principal";
                          }

                          const displayTeacherName = previewStudent.formTeacherName || fallbackTeacher;
                          return (
                            <div className="border-t border-slate-200 pt-3 flex justify-between items-end">
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-extrabold font-sans">Appraiser</span>
                                <p className="font-black text-slate-900 font-sans">{displayTeacherName}</p>
                              </div>
                              <div className="text-right select-none">
                                <div className="text-sm font-serif italic text-emerald-950 font-semibold h-5 tracking-wide">
                                  {displayTeacherName.replace("Mrs.", "").replace("Mr.","").trim()}
                                </div>
                                <span className="text-[8px] text-slate-400 uppercase tracking-wider block border-t border-slate-200 pt-0.5 mt-0.5">Signature & Stamp</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {(() => {
                        const cleanClassName = (previewStudent.className || '').replace(/\s+/g, '');
                        const isNursery = ['Pre-Nursery', 'Nursery1', 'Nursery2', 'Nursery3'].includes(cleanClassName);
                        const isBasic = ['Basic1', 'Basic2', 'Basic3', 'Basic4', 'Basic5', 'Basic6'].includes(cleanClassName);

                        let displaySignatoryName = template.principalName;
                        let displayRole = "Principal";
                        let assessmentHeading = "🎓 Principal's Performance Assessment";

                        if (isBasic) {
                          displaySignatoryName = template.formTeacherJunior || "Mrs. Nancy Yusuf";
                          displayRole = "Headmistress";
                          assessmentHeading = "🏫 Headmistress's Performance Assessment";
                        } else if (isNursery) {
                          displaySignatoryName = template.formTeacherSenior || "Nursery Admin";
                          displayRole = "Nursery Admin";
                          assessmentHeading = "🧸 Nursery Admin's Performance Assessment";
                        }

                        return (
                          /* Signatory Assessment Callout */
                          <div className="bg-[#FAF9F9] border border-slate-200 p-5 rounded-2xl space-y-4 flex flex-col justify-between shadow-3xs text-slate-800 text-xs text-left">
                            <div>
                              <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-200/50 pb-1.5 flex items-center gap-1.5">
                                <span>{assessmentHeading}</span>
                              </h4>
                              <p className="italic text-slate-600 pt-3 leading-relaxed">
                                {(previewStudent as any).principalRemark
                                  ? `"${(previewStudent as any).principalRemark}"`
                                  : (previewStudent.formTeacherRemark.includes("outstanding") || stats.avgScore >= (template.distinctionThreshold || 90)
                                    ? `"Highly commendable academic and behavioral character shown during the term session. Excellent candidate. Promoted with honor."`
                                    : stats.avgScore >= (template.passThreshold || 50)
                                      ? `"Satisfactory progress. Continued focus on core concepts will serve candidate well. Promoted."`
                                      : `"Needs close guidance and study supervision in future sessions to ensure passing criteria."`)}
                              </p>
                            </div>

                            <div className="border-t border-slate-200 pt-3 flex justify-between items-end">
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-extrabold">
                                  Authorized {displayRole}
                                </span>
                                <p className="font-black text-slate-900">{displaySignatoryName}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        ) : activeSubTab === 'guidelines' ? (
          /* COMPREHENSIVE USER GUIDELINES PANEL */
          <div className="max-w-6xl mx-auto animate-fade-in">
            <GuidelinesComponent inlineOnly={true} />
          </div>
        ) : (activeSubTab === 'workspace' && canAccessWorkspaceConfig) ? (
          /* VIEW 3: WORKSPACE 15 PROPERTIES EDITABLE TEMPLATE FOR TEACHERS */
          <div className="bg-white border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm animate-fade-in text-slate-800">
            <div className="border-b pb-4">
              <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-md">
                Workspace Configuration Panel
              </span>
              <h2 className="text-sm font-extrabold text-slate-900 mt-3 flex items-center gap-1.5 uppercase tracking-tight">
                🏫 Edit School Info & Report Card Template
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Configure EZIBECK'S dynamic academic template. There are 15 dynamic properties customizable here.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!canAccessWorkspaceConfig) return;
                const nurseryFee = `${tempSchoolFeeNursery.trim()}|${tempPartyFeeNursery.trim()}|${tempEnrollmentFeeNursery.trim()}|${tempBookFeeNursery.trim()}`;
                const primaryFee = `${tempSchoolFeePrimary.trim()}|${tempPartyFeePrimary.trim()}|${tempEnrollmentFeePrimary.trim()}|${tempBookFeePrimary.trim()}`;
                const juniorFee = `${tempSchoolFeeJunior.trim()}|${tempPartyFeeJunior.trim()}|${tempEnrollmentFeeJunior.trim()}|${tempBookFeeJunior.trim()}`;
                const seniorFee = `${tempSchoolFeeSenior.trim()}|${tempPartyFeeSenior.trim()}|${tempEnrollmentFeeSenior.trim()}|${tempBookFeeSenior.trim()}`;
                const serializedFees = `${nurseryFee};${primaryFee};${juniorFee};${seniorFee}`;
                onUpdateTemplate({
                  schoolName: tempSchoolName,
                  motto: tempMotto,
                  address: tempAddress,
                  phone: tempPhone,
                  email: tempEmail,
                  resumptionDate: tempResumptionDate,
                  termDate: tempTermDate,
                  session: tempSession,
                  currentTerm: tempCurrentTerm,
                  principalName: tempPrincipalName,
                  formTeacherJunior: tempFormTeacherJunior,
                  formTeacherSenior: tempFormTeacherSenior,
                  nextTermFee: serializedFees,
                  distinctionThreshold: Number(tempDistinctionThreshold),
                  passThreshold: Number(tempPassThreshold),
                  portalLocked: tempPortalLocked,
                  schoolFee: tempSchoolFeeNursery,
                  partyFee: tempPartyFeeNursery,
                  enrollmentFee: tempEnrollmentFeeNursery,
                  bookFee: tempBookFeeNursery,
                  schoolFeeNursery: tempSchoolFeeNursery,
                  partyFeeNursery: tempPartyFeeNursery,
                  enrollmentFeeNursery: tempEnrollmentFeeNursery,
                  bookFeeNursery: tempBookFeeNursery,
                  schoolFeePrimary: tempSchoolFeePrimary,
                  partyFeePrimary: tempPartyFeePrimary,
                  enrollmentFeePrimary: tempEnrollmentFeePrimary,
                  bookFeePrimary: tempBookFeePrimary,
                  schoolFeeJunior: tempSchoolFeeJunior,
                  partyFeeJunior: tempPartyFeeJunior,
                  enrollmentFeeJunior: tempEnrollmentFeeJunior,
                  bookFeeJunior: tempBookFeeJunior,
                  schoolFeeSenior: tempSchoolFeeSenior,
                  partyFeeSenior: tempPartyFeeSenior,
                  enrollmentFeeSenior: tempEnrollmentFeeSenior,
                  bookFeeSenior: tempBookFeeSenior,
                });
                triggerSuccess('Scholastic report template settings (including section-specific school fees schedules) and portal status successfully saved!');
              }}
              className="space-y-6 text-xs"
            >
              {!canAccessWorkspaceConfig && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 text-[11px] font-semibold flex items-start gap-3 shadow-xs">
                  <span className="text-sm select-none">🔒</span>
                  <div>
                    <span className="font-extrabold text-slate-950 uppercase tracking-wide">Read-Only Workspace Configuration</span>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                      You are logged in as <strong className="text-slate-900 font-bold">{currentUser?.name}</strong> ({currentUser?.role}). Only School Administrators, Co-Administrators, and the Headmistress have permission to customize these 15 core template settings. However, all active configurations are synchronized and fully reflected on your students' records.
                    </p>
                  </div>
                </div>
              )}

              <fieldset disabled={!canAccessWorkspaceConfig} className="space-y-6 disabled:opacity-90">
                {/* Row A: General Scholastic Metadata */}
                <div className="space-y-3.5">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-slate-900 pl-2">
                    Section A: General Academic Information
                  </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">School Campus Name</label>
                    <input
                      type="text"
                      required
                      value={tempSchoolName}
                      onChange={(e) => setTempSchoolName(e.target.value)}
                      className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Official School Motto Slogan</label>
                    <input
                      type="text"
                      required
                      value={tempMotto}
                      onChange={(e) => setTempMotto(e.target.value)}
                      className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none font-bold text-slate-800"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Registered Campus Address</label>
                    <input
                      type="text"
                      required
                      value={tempAddress}
                      onChange={(e) => setTempAddress(e.target.value)}
                      className="w-full bg-[#FCFCFC] border rounded-lg p-2.5 outline-none font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Contact Office Phone</label>
                    <input
                      type="text"
                      required
                      value={tempPhone}
                      onChange={(e) => setTempPhone(e.target.value)}
                      className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Scholastic E-Mail Address</label>
                    <input
                      type="email"
                      required
                      value={tempEmail}
                      onChange={(e) => setTempEmail(e.target.value)}
                      className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none font-medium text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Row B: Calendar & Term Logistics */}
              <div className="space-y-3.5 pt-4 border-t">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-slate-900 pl-2">
                  Section B: Calendar & Terms Scheduling
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Academic Session Period</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2025/2026 Session"
                      value={tempSession}
                      onChange={(e) => setTempSession(e.target.value)}
                      className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Current Active Term (School-wide)</label>
                    <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl border">
                      {(['First Term', 'Second Term', 'Third Term'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTempCurrentTerm(t)}
                          className={`py-2 px-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer text-center ${
                            tempCurrentTerm === t
                              ? 'bg-emerald-800 text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <p className="text-[9px] text-slate-450 mt-1 italic">
                      Admin setting: Determines which term's assessment sheets are open for grade additions and edits school-wide.
                    </p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Report Card Issue Date</label>
                    <input
                      type="text"
                      required
                      value={tempTermDate}
                      onChange={(e) => setTempTermDate(e.target.value)}
                      className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none font-bold text-slate-800"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Next Term Resumption Date</label>
                    <input
                      type="text"
                      required
                      value={tempResumptionDate}
                      onChange={(e) => setTempResumptionDate(e.target.value)}
                      className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-indigo-700 pl-2">
                    Section C: Section-specific School Fees Schedules
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Configure school fees, books and auxiliary expenses individually for each level section. Students' portal bills will adapt dynamically to their standard class category.
                  </p>

                  <div className="space-y-6">
                    {/* Nursery Section Fees card */}
                    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 shadow-3xs">
                      <span className="text-[9px] bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold tracking-wider uppercase px-2.5 py-1 rounded select-none">
                        👶 Nursery Section Fees schedule (Pre-Nursery to Nursery 3)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5 mt-3 text-xs">
                        <div>
                          <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">School Fees (₦)</label>
                          <input
                            type="text"
                            required
                            value={tempSchoolFeeNursery}
                            onChange={(e) => setTempSchoolFeeNursery(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 outline-none font-bold text-slate-800 font-mono text-center focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Party Fee (₦)</label>
                          <input
                            type="text"
                            required
                            value={tempPartyFeeNursery}
                            onChange={(e) => setTempPartyFeeNursery(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 outline-none font-bold text-slate-800 font-mono text-center focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Enrollment Fee (₦)</label>
                          <input
                            type="text"
                            required
                            value={tempEnrollmentFeeNursery}
                            onChange={(e) => setTempEnrollmentFeeNursery(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 outline-none font-bold text-slate-800 font-mono text-center focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Book Fees (₦)</label>
                          <input
                            type="text"
                            required
                            value={tempBookFeeNursery}
                            onChange={(e) => setTempBookFeeNursery(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 outline-none font-bold text-slate-800 font-mono text-center focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Computed Total (₦)</label>
                          <div className="w-full bg-indigo-50 border border-indigo-200 text-indigo-950 font-black text-center font-mono py-2.5 rounded-lg text-xs leading-none">
                            {(() => {
                              const parseNum = (v: string): number => {
                                const cln = v.replace(/[^\d.]/g, '');
                                const parsed = parseFloat(cln);
                                return isNaN(parsed) ? 0 : parsed;
                              };
                              const total = parseNum(tempSchoolFeeNursery) + parseNum(tempPartyFeeNursery) + parseNum(tempEnrollmentFeeNursery) + parseNum(tempBookFeeNursery);
                              return `₦${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Primary Section Fees card */}
                    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 shadow-3xs">
                      <span className="text-[9px] bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold tracking-wider uppercase px-2.5 py-1 rounded select-none">
                        🎒 Primary Section Fees schedule (Basic 1 to 6)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5 mt-3 text-xs">
                        <div>
                          <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">School Fees (₦)</label>
                          <input
                            type="text"
                            required
                            value={tempSchoolFeePrimary}
                            onChange={(e) => setTempSchoolFeePrimary(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 outline-none font-bold text-slate-800 font-mono text-center focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Party Fee (₦)</label>
                          <input
                            type="text"
                            required
                            value={tempPartyFeePrimary}
                            onChange={(e) => setTempPartyFeePrimary(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 outline-none font-bold text-slate-800 font-mono text-center focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Enrollment Fee (₦)</label>
                          <input
                            type="text"
                            required
                            value={tempEnrollmentFeePrimary}
                            onChange={(e) => setTempEnrollmentFeePrimary(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 outline-none font-bold text-slate-800 font-mono text-center focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Book Fees (₦)</label>
                          <input
                            type="text"
                            required
                            value={tempBookFeePrimary}
                            onChange={(e) => setTempBookFeePrimary(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 outline-none font-bold text-slate-800 font-mono text-center focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Computed Total (₦)</label>
                          <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-950 font-black text-center font-mono py-2.5 rounded-lg text-xs leading-none">
                            {(() => {
                              const parseNum = (v: string): number => {
                                const cln = v.replace(/[^\d.]/g, '');
                                const parsed = parseFloat(cln);
                                return isNaN(parsed) ? 0 : parsed;
                              };
                              const total = parseNum(tempSchoolFeePrimary) + parseNum(tempPartyFeePrimary) + parseNum(tempEnrollmentFeePrimary) + parseNum(tempBookFeePrimary);
                              return `₦${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Junior Secondary Section Fees card */}
                    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 shadow-3xs">
                      <span className="text-[9px] bg-sky-50 border border-sky-200 text-sky-700 font-extrabold tracking-wider uppercase px-2.5 py-1 rounded select-none">
                        📚 Junior Secondary Fees schedule (JSS1 to JSS3)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5 mt-3 text-xs">
                        <div>
                          <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">School Fees (₦)</label>
                          <input
                            type="text"
                            required
                            value={tempSchoolFeeJunior}
                            onChange={(e) => setTempSchoolFeeJunior(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 outline-none font-bold text-slate-800 font-mono text-center focus:border-sky-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Party Fee (₦)</label>
                          <input
                            type="text"
                            required
                            value={tempPartyFeeJunior}
                            onChange={(e) => setTempPartyFeeJunior(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 outline-none font-bold text-slate-800 font-mono text-center focus:border-sky-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Enrollment Fee (₦)</label>
                          <input
                            type="text"
                            required
                            value={tempEnrollmentFeeJunior}
                            onChange={(e) => setTempEnrollmentFeeJunior(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 outline-none font-bold text-slate-800 font-mono text-center focus:border-sky-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Book Fees (₦)</label>
                          <input
                            type="text"
                            required
                            value={tempBookFeeJunior}
                            onChange={(e) => setTempBookFeeJunior(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 outline-none font-bold text-slate-800 font-mono text-center focus:border-sky-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Computed Total (₦)</label>
                          <div className="w-full bg-sky-50 border border-sky-200 text-sky-950 font-black text-center font-mono py-2.5 rounded-lg text-xs leading-none">
                            {(() => {
                              const parseNum = (v: string): number => {
                                const cln = v.replace(/[^\d.]/g, '');
                                const parsed = parseFloat(cln);
                                return isNaN(parsed) ? 0 : parsed;
                              };
                              const total = parseNum(tempSchoolFeeJunior) + parseNum(tempPartyFeeJunior) + parseNum(tempEnrollmentFeeJunior) + parseNum(tempBookFeeJunior);
                              return `₦${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Senior Secondary Section Fees card */}
                    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 shadow-3xs">
                      <span className="text-[9px] bg-rose-50 border border-rose-200 text-rose-700 font-extrabold tracking-wider uppercase px-2.5 py-1 rounded select-none">
                        🎓 Senior Secondary Fees schedule (SS1 to SS3)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5 mt-3 text-xs">
                        <div>
                          <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">School Fees (₦)</label>
                          <input
                            type="text"
                            required
                            value={tempSchoolFeeSenior}
                            onChange={(e) => setTempSchoolFeeSenior(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 outline-none font-bold text-slate-800 font-mono text-center focus:border-rose-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Party Fee (₦)</label>
                          <input
                            type="text"
                            required
                            value={tempPartyFeeSenior}
                            onChange={(e) => setTempPartyFeeSenior(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 outline-none font-bold text-slate-800 font-mono text-center focus:border-rose-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Enrollment Fee (₦)</label>
                          <input
                            type="text"
                            required
                            value={tempEnrollmentFeeSenior}
                            onChange={(e) => setTempEnrollmentFeeSenior(e.target.value)}
                            className="w-full bg-[#FCFCFC] border border-slate-200 rounded-lg p-2.5 outline-none font-bold text-slate-800 font-mono text-center focus:border-rose-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Book Fees (₦)</label>
                          <input
                            type="text"
                            required
                            value={tempBookFeeSenior}
                            onChange={(e) => setTempBookFeeSenior(e.target.value)}
                            className="w-full bg-[#FCFCFC] border border-slate-200 rounded-lg p-2.5 outline-none font-bold text-slate-800 font-mono text-center focus:border-rose-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Computed Total (₦)</label>
                          <div className="w-full bg-rose-50 border border-rose-200 text-rose-950 font-black text-center font-mono py-2.5 rounded-lg text-xs leading-none">
                            {(() => {
                              const parseNum = (v: string): number => {
                                const cln = v.replace(/[^\d.]/g, '');
                                const parsed = parseFloat(cln);
                                return isNaN(parsed) ? 0 : parsed;
                              };
                              const total = parseNum(tempSchoolFeeSenior) + parseNum(tempPartyFeeSenior) + parseNum(tempEnrollmentFeeSenior) + parseNum(tempBookFeeSenior);
                              return `₦${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              {/* Row C: Academic Governance Officers */}
              <div className="space-y-3.5 pt-4 border-t">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-slate-900 pl-2">
                  Section C: Scholastic Appraisers & Signatories
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Authorized Principal Name</label>
                    <input
                      type="text"
                      required
                      value={tempPrincipalName}
                      onChange={(e) => setTempPrincipalName(e.target.value)}
                      className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Headmistress (Basic 1 to 6)</label>
                    <input
                      type="text"
                      required
                      value={tempFormTeacherJunior}
                      onChange={(e) => setTempFormTeacherJunior(e.target.value)}
                      className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nursery Admin (Pre-Nursery to Nursery 3)</label>
                    <input
                      type="text"
                      required
                      value={tempFormTeacherSenior}
                      onChange={(e) => setTempFormTeacherSenior(e.target.value)}
                      className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Row D: Syllabus Grading Rubrics */}
              <div className="space-y-3.5 pt-4 border-t">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-slate-900 pl-2">
                  Section D: Grading Performance Boundaries
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Distinction Threshold Rating (%)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="100"
                      value={tempDistinctionThreshold}
                      onChange={(e) => setTempDistinctionThreshold(parseInt(e.target.value) || 90)}
                      className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none font-bold text-emerald-600 font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Pass / Promotion Threshold Rating (%)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="100"
                      value={tempPassThreshold}
                      onChange={(e) => setTempPassThreshold(parseInt(e.target.value) || 50)}
                      className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none font-bold text-amber-500 font-mono text-center"
                    />
                  </div>
                </div>
                </div>

                {/* Section E: Student Portal Control */}
                <div className="space-y-3.5 pt-4">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-slate-900 pl-2">
                    Section E: Student Portal Control
                  </h4>
                  <div className="bg-slate-50 border border-slate-205 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-left w-full md:w-2/3">
                      <span className="font-bold text-xs text-slate-905 flex items-center gap-1.5">
                        📂 Student Report Card Access Portal
                      </span>
                      <p className="text-[11px] text-slate-505 leading-relaxed font-sans">
                        Toggle this switch to control whether students are permitted to log in and inspect their termly result report cards. If locked, students attempting to log in will receive a secure notification that results are not yet ready.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTempPortalLocked(false)}
                        className={`px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition-all cursor-pointer ${
                          !tempPortalLocked 
                            ? 'bg-emerald-600 border border-emerald-500 text-white shadow-3xs' 
                            : 'bg-white border border-slate-250 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        🔓 Open / Unlock
                      </button>
                      <button
                        type="button"
                        onClick={() => setTempPortalLocked(true)}
                        className={`px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition-all cursor-pointer ${
                          tempPortalLocked 
                            ? 'bg-red-650 border border-red-500 text-white shadow-3xs' 
                            : 'bg-white border border-slate-250 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        🔒 Locked
                      </button>
                    </div>
                  </div>
                </div>
              </fieldset>

              {/* Form submit/save button */}
              <div className="pt-4 border-t flex justify-end">
                {canAccessWorkspaceConfig ? (
                  <button
                    type="submit"
                    className="bg-emerald-800 hover:bg-emerald-950 text-white font-extrabold text-[10px] tracking-wider uppercase px-6 py-3 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    ⚡ Save & Publish Workspace Template
                  </button>
                ) : (
                  <div className="bg-slate-100 text-slate-500 border border-slate-200 font-extrabold text-[10px] tracking-wider uppercase px-6 py-3 rounded-xl select-none flex items-center gap-1.5">
                    🔒 Read-Only (Synchronized Live)
                  </div>
                )}
              </div>
            </form>

            {/* Main Admin Only: Reset All Student Results Button */}
            {isAdmin && !isCoAdmin && (() => {
              const isResetActive = true;

              return (
                <div className="mt-8 pt-6 border-t border-red-100 bg-red-50/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-left">
                    <h4 className="text-red-950 font-extrabold text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                      <span>⚠️</span> Session Cleanup & Rollover Control
                    </h4>
                    <p className="text-[10px] text-slate-500 max-w-lg leading-relaxed font-medium">
                      This action completely deletes all students and their respective report card records (test scores, exam scores, term summaries, remarks, and settings) across all classes to start completely fresh for the next session.
                      <strong className="block text-emerald-800 mt-1 font-bold">
                        Always active and available for administrators.
                      </strong>
                    </p>
                  </div>
                  
                  <button
                    type="button"
                    disabled={!isResetActive}
                    onClick={() => {
                      if (resetConfirmState === 'idle') {
                        setResetConfirmState('confirming');
                      } else {
                        // Perform full reset: completely delete all student records!
                        onUpdateStudents([]);
                        triggerSuccess('Successfully deleted all students across all classes for a completely fresh academic session!');
                        setResetConfirmState('idle');
                      }
                    }}
                    className={`px-5 py-3 font-extrabold text-[10px] tracking-wider uppercase rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5 ${
                      !isResetActive
                        ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed select-none'
                        : resetConfirmState === 'confirming'
                          ? 'bg-red-700 hover:bg-red-850 text-white animate-pulse'
                          : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                    }`}
                  >
                    <span>🗑️</span>
                    {resetConfirmState === 'confirming' ? 'Click again to confirm Reset' : 'Delete All Students (Fresh Start)'}
                  </button>
                </div>
              );
            })()}


          </div>
        ) : activeSubTab === 'staff' && currentUser && currentUser.id === 'ezekiel' ? (
          /* VIEW 4: ADMIN STAFF MANAGEMENT SCREEN */
          <div className="bg-white border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm animate-fade-in text-slate-800">
            <div className="border-b pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-[10px] bg-rose-50 border border-rose-200 text-rose-750 font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-md">
                  Admin Security Desk
                </span>
                <h2 className="text-sm font-extrabold text-slate-900 mt-3 flex items-center gap-1.5 uppercase tracking-tight">
                  🔒 Educator Staff Class Assignments & Security Desk
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Configure class assignments for teachers. Form Teachers can strictly access and modify students in their assigned class. Use the edit button to assign classes, modify usernames, change passcodes, or authorize/restrict access.
                </p>
              </div>
            </div>

            {editingFaculty && (
              <form onSubmit={handleSaveFacultyEdit} className="bg-slate-50 border border-emerald-150 p-5 rounded-2xl space-y-4 animate-fade-in">
                <div className="border-b border-emerald-100 pb-2 flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    ⚙️ Edit Profile & Class Assignment: <span className="text-emerald-700">{editingFaculty.name}</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Updates take effect immediately</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 text-xs">
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">Full Educator Name</label>
                    <input
                      type="text"
                      required
                      value={editingFacultyName}
                      onChange={(e) => setEditingFacultyName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 outline-none focus:border-emerald-600 transition-all font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">Username ID (Login Name)</label>
                    <input
                      type="text"
                      required
                      value={editingFacultyId}
                      onChange={(e) => setEditingFacultyId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 outline-none focus:border-emerald-600 transition-all font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">Registered Email (For OTP Reset)</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. gladys@ezibeckacademy.edu.ng"
                      value={editingFacultyEmail}
                      onChange={(e) => setEditingFacultyEmail(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 outline-none focus:border-emerald-600 transition-all font-semibold font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">Designation / Role</label>
                    <select
                      value={
                        editingFacultyRole.toLowerCase().includes('head principal') || editingFacultyRole.toLowerCase().includes('administrator') || editingFacultyRole.toLowerCase().includes('main admin') ? 'admin' :
                        editingFacultyRole.toLowerCase().includes('nursery section admin') || editingFacultyRole.toLowerCase().includes('nursery admin') ? 'nursery_admin' :
                        editingFacultyRole.toLowerCase().includes('primary section admin') || editingFacultyRole.toLowerCase().includes('primary admin') || editingFacultyRole.toLowerCase().includes('basic admin') || editingFacultyRole.toLowerCase().includes('head teacher') ? 'primary_admin' :
                        editingFacultyRole.toLowerCase().includes('principal') || editingFacultyRole.toLowerCase().includes('junior') || editingFacultyRole.toLowerCase().includes('senior') ? 'senior' : 'form'
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'admin') {
                          setEditingFacultyRole('Administrator (Head Principal)');
                          setEditingFacultyClass('');
                        } else if (val === 'nursery_admin') {
                          setEditingFacultyRole('Nursery Admin (Pre-Nursery to Nursery 3)');
                          setEditingFacultyClass('');
                        } else if (val === 'primary_admin') {
                          setEditingFacultyRole('Basic Admin (Basic 1 to 6)');
                          setEditingFacultyClass('');
                        } else if (val === 'senior') {
                          setEditingFacultyRole('Principal (JSS1 to SS3B)');
                          setEditingFacultyClass('');
                        } else {
                          setEditingFacultyRole('Form Teacher - ');
                        }
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-850 focus:border-emerald-600 font-extrabold outline-none"
                    >
                      <option value="form">Form Teacher (Select Class)</option>
                      <option value="admin">Administrator (Head Principal)</option>
                      <option value="nursery_admin">Nursery Admin (Pre-Nursery to Nursery 3)</option>
                      <option value="primary_admin">Basic Admin (Basic 1 to 6)</option>
                      <option value="senior">Principal (JSS1 to SS3B)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">Class Assigned</label>
                    <select
                      disabled={
                        !editingFacultyRole.toLowerCase().startsWith('form teacher')
                      }
                      value={editingFacultyClass || ''}
                      onChange={(e) => {
                        const cls = e.target.value as ClassName | '';
                        setEditingFacultyClass(cls);
                        if (cls) {
                          setEditingFacultyRole(`Form Teacher - ${cls}`);
                        }
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-850 focus:border-emerald-600 font-extrabold outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                    >
                      <option value="">No Class Assigned</option>
                      {ALL_CLASSES.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">Security Passcode Password</label>
                    <input
                      type="text"
                      required
                      value={editingFacultyPassword}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingFacultyPassword(val);
                        if (val && !isPasswordStandardCompliant(val)) {
                          setFacultyPasswordError("Requires: 8+ chars, 1 uppercase, 1 lowercase, 1 number, & 1 symbol.");
                        } else {
                          setFacultyPasswordError("");
                        }
                      }}
                      className={`w-full bg-white border rounded-lg p-2.5 text-xs text-slate-800 outline-none font-mono font-bold focus:ring-1 ${facultyPasswordError ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-200 focus:border-emerald-600 focus:ring-emerald-600'}`}
                    />
                    {facultyPasswordError ? (
                      <p className="text-[10px] text-rose-600 font-bold mt-1 leading-tight">{facultyPasswordError}</p>
                    ) : (
                      <p className="text-[9px] text-slate-400 mt-1 leading-tight">Minimum 8 characters with at least one uppercase, lowercase, number & symbol.</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Avatar:</span>
                    <div className="flex gap-1.5">
                      {["👩‍🏫", "👨‍🏫", "👩‍💻", "👨‍💻", "🎓"].map(emoji => (
                        <button
                          type="button"
                          key={emoji}
                          onClick={() => setEditingFacultyAvatar(emoji)}
                          className={`text-xl p-1.5 rounded-xl transition-all border ${editingFacultyAvatar === emoji ? 'bg-emerald-50 border-emerald-200 scale-105' : 'bg-white hover:bg-slate-100 border-slate-200'}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingFaculty(null)}
                      className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl px-4 py-2.5 text-[10px] font-extrabold tracking-wider uppercase transition-all cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                    <button
                      type="submit"
                      className="bg-emerald-800 hover:bg-emerald-950 text-white rounded-xl px-5 py-2.5 text-[10px] font-extrabold tracking-wider uppercase transition-all cursor-pointer"
                    >
                      Save Assigned Class
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/55 shadow-xs">
              {facultyProfiles.map(p => {
                const isSelf = p.id === currentUser?.id;
                const isUrlAvatar = p.avatar && p.avatar.startsWith('http');
                
                return (
                  <div key={p.id} className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white hover:bg-slate-50/70 transition-colors">
                    <div className="flex items-start sm:items-center gap-3.5">
                      {isUrlAvatar ? (
                        <div className="w-12 h-12 bg-slate-100 flex items-center justify-center rounded-2xl overflow-hidden shrink-0">
                          <img src={p.avatar} alt={p.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <span className="text-3xl bg-slate-100 p-2 flex items-center justify-center rounded-2xl select-none shrink-0 w-12 h-12">{p.avatar || '👩‍🏫'}</span>
                      )}
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-xs flex flex-wrap items-center gap-2">
                          {p.name}
                          {isSelf && (
                            <span className="bg-emerald-100 text-emerald-750 text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded-md">
                              You (Admin)
                            </span>
                          )}
                          {p.isRestricted && (
                            <span className="bg-rose-100 text-rose-700 text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded-md">
                              Restricted (Locked)
                            </span>
                          )}
                          {p.assignedClass ? (
                            <span className="bg-emerald-600 text-white text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md">
                              Class: {p.assignedClass}
                            </span>
                          ) : (
                            <span className="bg-slate-200 text-slate-700 text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md">
                              No Class
                            </span>
                          )}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{p.role}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                          <span>Username ID: <strong className="font-bold text-slate-800 tracking-wider bg-slate-100 px-1.5 py-0.5 rounded font-mono">{p.id}</strong></span>
                          <span>Password Passcode: <strong className="font-bold text-slate-800 tracking-wider bg-slate-100 px-1.5 py-0.5 rounded font-mono">{p.password || (p.id === 'ezekiel' ? 'Ezekiel@2026' : p.id === 'maroger' ? 'Maro@2026' : p.id === 'spare' ? 'Spare@2026' : 'Gladys@Jss1')}</strong></span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingFaculty(p);
                          setEditingFacultyId(p.id);
                          setEditingFacultyName(p.name);
                          setEditingFacultyEmail(p.email || `${p.id}@ezibeckacademy.edu.ng`);
                          setEditingFacultyPassword(p.password || (p.id === 'ezekiel' ? 'Ezekiel@2026' : 'Gladys@Jss1'));
                          setEditingFacultyClass(p.assignedClass || '');
                          setEditingFacultyRole(p.role || '');
                          setEditingFacultyAvatar(p.avatar || '👩‍🏫');
                          setFacultyPasswordError('');
                        }}
                        className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 px-3.5 py-2 text-[10px] font-bold tracking-wider uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        ⚙️ Edit & Assign Class
                      </button>

                      {!isSelf && p.id !== 'ezekiel' && (
                        <button
                          type="button"
                          onClick={() => {
                            const updatedProfile = { ...p, isRestricted: !p.isRestricted };
                            const updated = facultyProfiles.map(f => {
                              if (f.id === p.id) {
                                return updatedProfile;
                              }
                              return f;
                            });
                            setFacultyProfiles(updated);
                            if (typeof window !== 'undefined') {
                              localStorage.setItem('ezibeck_faculty_profiles', JSON.stringify(updated));
                            }
                            if (dbStatus && dbStatus.configured && dbStatus.connected) {
                              dbService.saveFacultyProfile(updatedProfile).catch(err => {
                                console.error("Failed to sync access restriction change dynamically to Supabase:", err);
                              });
                            }
                            triggerSuccess(
                              p.isRestricted
                                ? `Access restored! ${p.name} account is now active.`
                                : `Account restricted! ${p.name} has been locked from educator desk access.`
                            );
                          }}
                          className={`px-3.5 py-2 text-[10px] font-black tracking-wider uppercase rounded-xl transition-all shadow-xs border cursor-pointer ${
                            p.isRestricted
                              ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-500 text-white'
                              : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-750 hover:text-rose-900'
                          }`}
                        >
                          {p.isRestricted ? '✅ Authorize' : '🚫 Restrict'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : activeSubTab === 'calendar' && isAdmin ? (
          /* VIEW SEARCH CALENDAR MANAGER */
          <div className="bg-white border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm animate-fade-in text-slate-800">
            <div className="border-b pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
              <div>
                <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-md">
                  School Logistics Desk
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-2 flex items-center gap-1.5 uppercase tracking-tight">
                  📅 Ezibeck Calendar Manager
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Add, edit, and delete school holidays and academic activities shown on the public home page calendar.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Form */}
              <div className="lg:col-span-5 bg-slate-50 border border-slate-150 p-5 sm:p-6 rounded-2xl space-y-4 text-left">
                <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                  {editingEventId ? "✏️ Edit Calendar Event" : "🆕 Create New Event"}
                </h3>
                
                <form onSubmit={handleSaveCalendarEvent} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Event Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Christmas Day, SS3 Trial Exams"
                      value={calendarEventTitle}
                      onChange={(e) => setCalendarEventTitle(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Short Description/Details</label>
                    <textarea
                      placeholder="Specify logistics, timings, or target audience..."
                      rows={2}
                      value={calendarEventDesc}
                      onChange={(e) => setCalendarEventDesc(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Event Type</label>
                      <select
                        value={calendarEventType}
                        onChange={(e) => setCalendarEventType(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-emerald-650"
                      >
                        <option value="holiday">Holiday (Rose/Red)</option>
                        <option value="academic">Academic (Indigo/Blue)</option>
                        <option value="break">Break (Emerald/Green)</option>
                        <option value="exam">Exam (Amber/Yellow)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Day of Month</label>
                      <select
                        value={calendarEventDay}
                        onChange={(e) => setCalendarEventDay(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none"
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                          <option key={d} value={d}>Day {d}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Month</label>
                      <select
                        value={calendarSelectedMonth}
                        onChange={(e) => setCalendarSelectedMonth(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-emerald-650"
                      >
                        {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, idx) => (
                          <option key={idx} value={idx}>{m}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Academic Year Scope</label>
                      <select
                        value={calendarEventYearOptional}
                        onChange={(e) => setCalendarEventYearOptional(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-emerald-650"
                      >
                        <option value="annual">Repeating Annually (All years)</option>
                        <option value="2024">Specific Year: 2024</option>
                        <option value="2025">Specific Year: 2025</option>
                        <option value="2026">Specific Year: 2026</option>
                        <option value="2027">Specific Year: 2027</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="submit"
                      disabled={isSavingCalendarEvent}
                      className="flex-1 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider py-3 px-4 rounded-xl cursor-pointer transition-all"
                    >
                      {isSavingCalendarEvent ? "Saving..." : (editingEventId ? "Update Event" : "Add Event")}
                    </button>
                    {editingEventId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingEventId(null);
                          setCalendarEventTitle('');
                          setCalendarEventDesc('');
                          setCalendarEventDay(1);
                        }}
                        className="bg-slate-300 hover:bg-slate-400 text-slate-700 font-extrabold text-xs uppercase tracking-wider py-3 px-4 rounded-xl cursor-pointer transition-all"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Right Column: List of Events */}
              <div className="lg:col-span-7 space-y-4 text-left">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                    📋 Active Custom Events ({dbCalendarEvents.length})
                  </h3>
                  <button
                    onClick={loadDbCalendarEvents}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 border text-slate-650 font-black tracking-wider uppercase px-2.5 py-1 rounded-md"
                  >
                    🔄 Reload
                  </button>
                </div>

                {dbCalendarEvents.length === 0 ? (
                  <div className="p-8 border border-dashed rounded-2xl bg-slate-50/50 text-center space-y-2">
                    <p className="text-xs text-slate-400 font-medium italic">
                      No custom activities or holidays registered in the database.
                    </p>
                    <p className="text-[10.5px] text-slate-450 leading-relaxed max-w-sm mx-auto font-medium">
                      Events added here will synchronize directly and override or supplement the static default dates on the homepage.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                    {dbCalendarEvents.map((evt) => {
                      const typeColors: Record<string, string> = {
                        holiday: 'bg-rose-50 text-rose-700 border-rose-205',
                        academic: 'bg-indigo-50 text-indigo-705 border-indigo-205',
                        break: 'bg-emerald-50 text-emerald-705 border-emerald-250',
                        exam: 'bg-amber-50 text-amber-800 border-amber-250'
                      };
                      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                      return (
                        <div key={evt.id} className="p-4 bg-white border rounded-2xl flex items-start justify-between gap-4 hover:shadow-2xs transition-all border-slate-150">
                          <div className="space-y-1 text-left">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 border rounded ${typeColors[evt.type] || 'bg-slate-50 text-slate-605'}`}>
                                {evt.type}
                              </span>
                              <span className="font-mono text-[10px] font-black text-slate-400">
                                {monthNames[evt.month]} {evt.day}{evt.year ? `, ${evt.year}` : ' (Annual)'}
                              </span>
                            </div>
                            <h4 className="text-xs font-black text-slate-900 leading-tight">
                              {evt.title}
                            </h4>
                            {evt.desc && (
                              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                                {evt.desc}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditCalendarEvent(evt)}
                              className="p-1 px-2.5 bg-slate-50 hover:bg-slate-100 border text-[10px] font-bold text-slate-650 rounded-lg cursor-pointer"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCalendarEvent(evt.id, evt.title)}
                              className="p-1 px-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-[10px] font-bold text-rose-700 rounded-lg cursor-pointer"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (activeSubTab === 'passcodes' && isAdmin) ? (
          /* NEW VIEW 6: PRINTABLE STUDENT PASSCARDS DIRECTORY */
          <div className="space-y-6 text-slate-800">
            {/* Custom high-performance CSS injection for perfect, distraction-free browser prints */}
            <style dangerouslySetInnerHTML={{__html: `
              @media print {
                body {
                  background: white !important;
                  color: black !important;
                }
                body * {
                  visibility: hidden !important;
                }
                #print-passcards-section, #print-passcards-section * {
                  visibility: visible !important;
                }
                #print-passcards-section {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  padding: 0 !important;
                  margin: 0 !important;
                }
                .passcard-page-break {
                  page-break-after: always !important;
                  break-after: page !important;
                  padding: 10px !important;
                  margin-bottom: 0 !important;
                }
                .no-print {
                  display: none !important;
                }
              }
            `}} />

            <div className="bg-white border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm no-print">
              <div className="border-b pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <span className="text-[10px] bg-sky-50 border border-sky-200 text-sky-700 font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-md">
                    Admin Security Centre
                  </span>
                  <h2 className="text-sm font-extrabold text-slate-900 mt-3 flex items-center gap-1.5 uppercase tracking-tight">
                    🔑 Class Student Passcards Directory
                  </h2>
                  <p className="text-[11px] text-slate-450 mt-0.5">
                    Generate and print physical passcode slips for each student. Each printed page is structured in a clean, professional **2-column by 6-row** grid (12 slips per sheet) for easy distribution.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      window.print();
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 border border-emerald-500 text-white px-5 py-2.5 text-xs font-bold uppercase rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5 font-sans"
                  >
                    🖨️ Print Active Grid
                  </button>
                </div>
              </div>

              {/* Alert Tips */}
              <div className="bg-sky-50/50 border border-sky-100 rounded-2xl p-4 text-xs font-medium text-sky-850 flex items-start gap-2.5 leading-relaxed">
                <span className="text-base select-none">🛡️</span>
                <div>
                  <strong className="font-extrabold">Faculty Security Standard:</strong> Keep printed passcard sheets under strict administrative lock. For distribution, scissor-cut along the dashed guidelines and hand over the individual slips to the students or their guardians. We have padded empty slots with blank guides to preserve sheet symmetry.
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 border p-4 rounded-2xl">
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <label id="passcode-class-filter-label" className="text-xs font-black uppercase text-slate-450 tracking-wider shrink-0">Filter Class:</label>
                  <select
                    id="passcode-class-filter-select"
                    value={selectedPassClass}
                    onChange={(e) => setSelectedPassClass(e.target.value)}
                    className="bg-white border rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer"
                  >
                    <option value="ALL">All {ALL_CLASSES.length} Classes</option>
                    {ALL_CLASSES.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
                
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-right">
                  System: All {students.length} student passcodes synchronized.
                </div>
              </div>
            </div>

            {/* The Actual Printable Passcard Sheets Container */}
            <div id="print-passcards-section" className="space-y-8 print:space-y-0 text-slate-800">
              {(() => {
                const targetClasses = selectedPassClass === 'ALL' 
                  ? ALL_CLASSES 
                  : [selectedPassClass as ClassName];

                return targetClasses.map((cls, clsIdx) => {
                  const classStudents = students.filter(s => s.className === cls);
                  
                  // Setup 12-slots pagination (2 columns x 6 rows = 12 slots)
                  const chunks: (Student | null)[][] = [];
                  if (classStudents.length === 0) {
                    // Always show at least 1 sheet with 12 blank slots for empty classes
                    const emptySheet = Array(12).fill(null);
                    chunks.push(emptySheet);
                  } else {
                    for (let i = 0; i < classStudents.length; i += 12) {
                      const slice = classStudents.slice(i, i + 12);
                      const paddedSlice: (Student | null)[] = [...slice];
                      // Pad the remaining slots to make up exactly 12 slots for a perfect 2x6 grid
                      while (paddedSlice.length < 12) {
                        paddedSlice.push(null);
                      }
                      chunks.push(paddedSlice);
                    }
                  }

                  return (
                    <div key={cls} className="space-y-4">
                      {chunks.map((sheet, sheetIdx) => {
                        const isLastPageOfClass = sheetIdx === chunks.length - 1;
                        const isLastClassTotal = clsIdx === targetClasses.length - 1;
                        const pageBreakClass = (isLastPageOfClass && isLastClassTotal) ? "" : "passcard-page-break";

                        return (
                          <div 
                            key={`${cls}_sheet_${sheetIdx}`} 
                            className={`bg-white border rounded-3xl p-6 shadow-xs border-slate-200 print:border-0 print:p-0 print:shadow-none space-y-4 ${pageBreakClass}`}
                          >
                            {/* Sheet Title Header */}
                            <div className="flex justify-between items-center bg-[#FAF9F9] print:bg-slate-50 border p-3 rounded-xl">
                              <span className="text-[10px] text-slate-800 font-sans font-extrabold tracking-widest uppercase flex items-center gap-1.5 leading-none">
                                🔑 STUDENT PASSWORDS DIRECTORY CARD
                              </span>
                              <span className="font-sans font-extrabold text-[#059669] bg-[#ecfdf5] border border-emerald-100 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider text-center">
                                CLASS: {cls} (Page {sheetIdx + 1}/{chunks.length})
                              </span>
                            </div>

                            {/* Pristine 2 columns x 6 rows printable grid. We loop exactly 12 items */}
                            <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-3.5">
                              {sheet.map((student, slotIdx) => {
                                if (student) {
                                  return (
                                    <div 
                                      key={student.id} 
                                      className="border-2 border-dashed border-slate-250 p-4 rounded-2xl flex flex-col justify-between bg-white hover:bg-slate-50/50 transition-all h-[145px] relative overflow-hidden font-sans text-slate-800"
                                    >
                                      {/* Security Watermark Background */}
                                      <ScratchCardWatermark />

                                      {/* Security card border frame */}
                                      <div className="flex justify-between items-start relative z-10">
                                        <div className="space-y-1">
                                          <p className="text-[9px] font-black text-slate-400 tracking-wider uppercase leading-none">
                                            {template.schoolName || "EZIBECK ACADEMY"}
                                          </p>
                                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight mt-1 truncate max-w-[150px]">
                                            {student.name}
                                          </h4>
                                        </div>
                                        <span className="text-[9px] font-extrabold bg-[#e0fec7] text-emerald-800 border border-[#b2e59b] px-2 py-0.5 rounded leading-none uppercase">
                                          {student.className}
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-2 items-end pt-2 relative z-10">
                                        <div className="space-y-1">
                                          <span className="text-[8px] font-black uppercase text-slate-400 block tracking-widest leading-none">REGISTRATION ID</span>
                                          <code className="text-[10.5px] font-mono font-bold text-slate-650 bg-white/70 backdrop-blur-3xs px-1.5 py-0.5 rounded border border-slate-200">
                                            {student.id}
                                          </code>
                                        </div>
                                        <div className="space-y-1 text-right">
                                          <span className="text-[8px] font-black uppercase text-slate-400 block tracking-widest leading-none">PORTAL KEY</span>
                                          <code className="text-xs font-mono font-black text-emerald-700 bg-white/70 backdrop-blur-3xs px-2 py-0.5 rounded border border-emerald-150 uppercase tracking-widest">
                                            {student.password || "123456"}
                                          </code>
                                        </div>
                                      </div>

                                      <div className="border-t border-slate-200/60 pt-2 flex justify-between items-center text-[7.5px] text-slate-400 font-extrabold uppercase tracking-wide relative z-10">
                                        <span>🔑 Official Portal Passcard</span>
                                        <span className="text-slate-350 tracking-wider">Do Not Share</span>
                                      </div>
                                    </div>
                                  );
                                } else {
                                  // Render a blank slots placeholder, keeping grid exact
                                  return (
                                    <div 
                                      key={`empty_${cls}_${sheetIdx}_${slotIdx}`} 
                                      className="border-2 border-dashed border-slate-200 bg-transparent rounded-2xl flex flex-col justify-center items-center text-center h-[145px] p-4 select-none font-sans"
                                    >
                                      <p className="text-sm">✂️</p>
                                      <p className="text-[8.5px] font-black uppercase tracking-wider text-slate-350 mt-1">
                                        Blank Passcard Frame
                                      </p>
                                      <p className="text-[7.5px] text-slate-300 mt-0.5">
                                        No Student Assigned in Slot {slotIdx + 1}
                                      </p>
                                    </div>
                                  );
                                }
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        ) : activeSubTab === 'audit' ? (
          /* VIEW 5: PASSCODE SECURITY AUDIT master LEDGER */
          <div className="bg-white border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm animate-fade-in text-slate-800">
            <div className="border-b pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-[10px] bg-emerald-50 border border-emerald-250 text-emerald-850 font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-md">
                  Security Log Desk
                </span>
                <h2 className="text-sm font-extrabold text-slate-900 mt-3 flex items-center gap-1.5 uppercase tracking-tight">
                  📋 Student Passcode & Access Audit Logs
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Chronological master ledger tracking passcode generations, manual security resets, and student portal rollover expirations school-wide.
                </p>
              </div>
              {isAdmin && auditLogs.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAuditLogs}
                  className="bg-rose-50 hover:bg-rose-150 border border-rose-250 text-rose-750 px-4 py-2.5 text-[10.5px] font-bold tracking-wider uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  🗑️ Clear Security Logs
                </button>
              )}
            </div>

            {/* Quick Metrics Statistics Widget Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 border rounded-2xl p-4 text-center">
                <p className="text-[9px] text-slate-450 font-black uppercase tracking-wider">Total Events</p>
                <p className="text-xl font-black text-slate-800 mt-1">{auditLogs.length}</p>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 text-center">
                <p className="text-[9px] text-emerald-600 font-black uppercase tracking-wider">Passcodes Created</p>
                <p className="text-xl font-black text-emerald-800 mt-1">{auditLogs.filter(l => l.action === 'Created').length}</p>
              </div>
              <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 text-center">
                <p className="text-[9px] text-amber-650 font-black uppercase tracking-wider">Manual Resets</p>
                <p className="text-xl font-black text-amber-800 mt-1">{auditLogs.filter(l => l.action === 'Manual Reset').length}</p>
              </div>
              <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 text-center">
                <p className="text-[9px] text-rose-650 font-black uppercase tracking-wider">Total Rollovers</p>
                <p className="text-xl font-black text-rose-800 mt-1">{auditLogs.filter(l => l.action === 'Rollover').length}</p>
              </div>
            </div>

            {/* Audit Logs Filter Search Input */}
            <div className="flex bg-slate-50 border rounded-xl px-3.5 py-3 items-center gap-2">
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search logs by student name, ID, class, action or educator..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="bg-transparent text-xs w-full focus:outline-none placeholder-slate-400 font-semibold"
              />
              {auditSearch && (
                <button
                  type="button"
                  onClick={() => setAuditSearch('')}
                  className="text-[10px] text-slate-400 hover:text-slate-650 font-black uppercase cursor-pointer"
                >
                  Clear Clear
                </button>
              )}
            </div>

            {/* Chronological Logs List */}
            {(() => {
              const filteredLogs = auditLogs.filter(log => {
                const q = auditSearch.toLowerCase();
                return log.studentName.toLowerCase().includes(q) || 
                       log.studentId.toLowerCase().includes(q) || 
                       log.studentClass.toLowerCase().includes(q) || 
                       log.performedBy.toLowerCase().includes(q) ||
                       log.action.toLowerCase().includes(q);
              });

              if (filteredLogs.length === 0) {
                return (
                  <div className="bg-slate-50 border rounded-2xl p-8 text-center space-y-2">
                    <p className="text-2xl select-none">📋</p>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">No Security Log Entries Found</p>
                    <p className="text-[10px] text-slate-400">
                      {auditLogs.length === 0 
                        ? "Passcode and security credentials logs will appear here as additions, resets, and logins rollover occur."
                        : "No log records matched your search query filter. Try general search letters."
                      }
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                  {filteredLogs.map((log) => {
                    let badgeColor = "bg-slate-100 text-slate-700 border-slate-200";
                    if (log.action === 'Created') badgeColor = "bg-emerald-50 text-emerald-800 border-emerald-100";
                    else if (log.action === 'Manual Reset') badgeColor = "bg-amber-50 text-amber-800 border-amber-200";
                    else if (log.action === 'Rollover') badgeColor = "bg-rose-50 text-rose-850 border-rose-200";
                    else if (log.action === 'Self Reset') badgeColor = "bg-blue-50 text-blue-800 border-blue-200";

                    return (
                      <div
                        key={log.id}
                        className="border rounded-2xl p-4 hover:bg-slate-50 border-slate-100 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs"
                      >
                        <div className="space-y-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border tracking-wide ${badgeColor}`}>
                              {log.action}
                            </span>
                            <span className="font-extrabold text-slate-800 text-xs">{log.studentName}</span>
                            <span className="bg-slate-100 text-slate-655 font-bold text-[9px] px-2 py-0.5 rounded-md border text-center uppercase tracking-wide">
                              {log.studentClass}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {log.studentId}</span>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[11px]">
                            <p className="text-slate-500 font-medium font-sans">
                              🔑 Active Credentials: <strong className="font-mono text-emerald-700 bg-emerald-50/50 px-1.5 py-0.5 rounded border border-emerald-110 font-extrabold">{log.newPasscode}</strong>
                              {log.oldPasscode && (
                                <span className="text-slate-450 text-[10px] font-sans font-medium"> (Rolled from: <span className="font-mono line-through">{log.oldPasscode}</span>)</span>
                              )}
                            </p>
                            <p className="text-slate-500 font-medium font-sans">
                              👤 Initiator: <strong className="text-slate-700 font-extrabold">{log.performedBy}</strong>
                            </p>
                          </div>
                        </div>

                        <div className="text-right flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center w-full md:w-auto border-t md:border-t-0 pt-2.5 md:pt-0 gap-2 border-slate-100">
                          <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Timestamp</p>
                          <p className="text-[10px] text-slate-500 font-mono font-semibold mt-0.5 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-350" />
                            {new Date(log.timestamp).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        ) : (
          
          // VIEW 2: ROSTER DIRECTORY FOR SELECTED CLASS
          <div className="space-y-6">
            
            {/* 3 Workspace Terminal Sessions Divider */}
            <div className="bg-emerald-950 text-white rounded-3xl p-6 shadow-xl border border-emerald-900 overflow-hidden relative select-none">
              {/* Abstract decorative background card elements */}
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-800 rounded-full blur-3xl opacity-30 select-none pointer-events-none"></div>
              <div className="absolute -left-10 -top-10 w-32 h-32 bg-amber-500 rounded-full blur-3xl opacity-10 select-none pointer-events-none"></div>

              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-350 text-slate-950 font-black text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-md">
                      Terminal Sessions Directory
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider font-mono">STAFF WORKSPACE DESK</span>
                  </div>
                  <h3 className="text-base font-black tracking-tight">Active Scholar Session: <span className="text-amber-300 underline decoration-amber-300/40 decoration-2 underline-offset-4">{activeTermTab}</span></h3>
                  <p className="text-xs text-emerald-200 font-medium max-w-xl">
                    Add new student slips and input terminal assessment marks inside this term workspace. switching active terms redirects and configures report template properties.
                  </p>
                </div>
                
                {/* 3 Segmented Session Toggles */}
                <div className="w-full md:w-auto bg-emerald-900/30 border border-emerald-600 p-1 rounded-2xl flex gap-1 font-bold text-xs">
                  {(['First Term', 'Second Term', 'Third Term'] as const).map((term) => (
                    <button
                      key={term}
                      id={`session-workspace-tab-${term.toLowerCase().replace(' ', '-')}`}
                      onClick={() => {
                        setActiveTermTab(term);
                        triggerSuccess(`Workspace local terminal directory safely routed to ${term}!`);
                      }}
                      className={`flex-1 md:flex-none uppercase tracking-wider text-[10px] font-extrabold py-2.5 px-5 rounded-xl transition-all cursor-pointer ${
                        activeTermTab === term
                          ? 'bg-amber-350 text-slate-900 shadow-lg font-black scale-[1.01]'
                          : 'text-emerald-200 hover:bg-emerald-800/60 hover:text-white'
                      }`}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live/Activate Term Banner - Only shown to teachers/admins */}
            <div className={`px-5 py-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs border transition-all ${
              !isTermReadOnly 
                ? 'bg-emerald-50/70 border-emerald-100 text-emerald-950' 
                : 'bg-amber-50/70 border-amber-200 text-amber-950'
            }`}>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="text-lg select-none">{!isTermReadOnly ? '🟢' : '🔒'}</span>
                <div>
                  <p className="font-extrabold uppercase tracking-wide flex items-center gap-2">
                    {!isTermReadOnly 
                      ? `Active Term Session: ${activeTermTab} is currently LIVE` 
                      : `Inactive Term View: ${activeTermTab} is in READ-ONLY mode`
                    }
                    {!isTermReadOnly && (
                      <span className="bg-emerald-600 text-white text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded animate-pulse">
                        LIVE
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                    {!isTermReadOnly
                      ? "Assessment records, grade additions, edits, behavior ratings, and remarks are unlocked school-wide."
                      : "Assessment sheets are locked. Grade inputs and student roster edits are disabled for this term's directory."
                    }
                  </p>
                </div>
              </div>
              {isTermReadOnly && (
                <div className="w-full sm:w-auto flex justify-end">
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateTemplate({
                          ...template,
                          currentTerm: activeTermTab
                        });
                        triggerSuccess(`🔔 School Academic Term has been officially activated to ${activeTermTab}!`);
                      }}
                      className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold tracking-wider uppercase px-4 py-2.5 rounded-xl border border-amber-650 shadow-md transition-all text-[10px] cursor-pointer"
                    >
                      ⚡ Activate {activeTermTab} for School
                    </button>
                  ) : (
                    <span className="text-[10px] text-amber-700 font-semibold italic">
                      🔒 Only Head Principal (Dr. Ezekiel Beck) can activate other terms.
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {/* Quick Metrics Statistics Widget Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Class Directory ({selectedClass})</span>
                  <p className="text-xl font-bold font-mono text-slate-900">{totalInClass} Students Slips</p>
                </div>
                <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-xl border">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-white border rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Highest Cumulative ({selectedClass})</span>
                  <p className="text-xl font-bold font-mono text-slate-900">{highestScore} <span className="text-xs text-slate-400">/ {maxClassCumulative} pts</span></p>
                </div>
                <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-xl border-emerald-100 border">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-white border rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Class Average Score</span>
                  <p className="text-xl font-bold font-mono text-slate-900">{averageClassScorePercent}%</p>
                </div>
                <div className="bg-amber-50 text-amber-800 p-2.5 rounded-xl border-amber-100 border">
                  <GraduationCap className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Roster Layout Filter & Action buttons row */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select Class Standard:</span>
                  <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl border text-xs">
                    {allowedClasses.map(cls => (
                      <button
                        key={cls}
                        onClick={() => {
                          setSelectedClass(cls);
                          setShowAddForm(false);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedClass === cls ? 'bg-emerald-800 text-white shadow-sm font-black' : 'text-slate-600 hover:bg-slate-200'}`}
                      >
                        {cls}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button
                      onClick={handleDownloadAllClassesZip}
                      disabled={isDownloadingAllZip}
                      className={`font-black text-[11px] px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md cursor-pointer border border-amber-650 bg-amber-500 hover:bg-amber-600 text-slate-950`}
                      title="Download student results portfolio for ALL academic classes structured in folders as a ZIP file"
                    >
                      {isDownloadingAllZip ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      ) : (
                        <FileSpreadsheet className="w-4 h-4 text-slate-950" />
                      )}
                      <span>ZIP BULK RESULTS</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (isTermReadOnly) {
                        triggerWarning("Adding student profiles is restricted for archived terms. Academic details are in read-only mode.");
                      } else {
                        setShowAddForm(!showAddForm);
                      }
                    }}
                    className={`font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                      isTermReadOnly 
                        ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed select-none' 
                        : 'bg-emerald-800 hover:bg-emerald-950 text-white'
                    }`}
                  >
                    {isTermReadOnly ? <Lock className="w-4 h-4 text-slate-400" /> : <Plus className="w-4 h-4" />} 
                    Add Student
                  </button>
                </div>
              </div>

              {/* Dynamic Expandable New Student Profile Form */}
              {showAddForm && (
                <form 
                  onSubmit={handleAddStudent}
                  className="bg-slate-50 border rounded-2xl p-5 space-y-4 animate-slide-in text-xs text-slate-800"
                >
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider border-b pb-1.5">
                    Register New Student Record ({selectedClass})
                  </h4>
                  
                  {/* Session Context Notice */}
                  <div className="bg-amber-50 border border-amber-250 text-slate-800 rounded-xl px-4 py-2.5 text-[11px] font-semibold flex items-start gap-2.5 shadow-xs">
                    <span className="text-base select-none">📅</span>
                    <div>
                      <span className="font-black text-slate-900">Current Session folder: {activeTermTab}</span>
                      <p className="text-[10px] text-slate-500 mt-0.5">The student will be initialized inside the active {activeTermTab} directory index. You can immediately access their report card to record their marks.</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Student Name Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Samuel Alaba"
                        value={newStudentName}
                        onChange={(e) => setNewStudentName(e.target.value)}
                        className="w-full bg-white border p-2 text-xs rounded-lg outline-none font-medium text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sex Gender</label>
                      <select
                        value={newStudentSex}
                        onChange={(e) => setNewStudentSex(e.target.value as 'Male' | 'Female')}
                        className="w-full bg-white border p-2 text-xs rounded-lg outline-none font-bold text-slate-700"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Age Profile</label>
                      <select
                        value={newStudentAge}
                        onChange={(e) => setNewStudentAge(parseInt(e.target.value))}
                        className="w-full bg-white border p-2 text-xs rounded-lg outline-none font-bold text-slate-700"
                      >
                        {Array.from({ length: 22 }, (_, i) => i + 1).map(y => (
                          <option key={y} value={y}>{y} Years Old</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Student Portal Password</label>
                      <input
                        type="text"
                        required
                        placeholder="Default: 123456"
                        value={newStudentPassword}
                        readOnly
                        className="w-full bg-slate-100 border p-2 text-xs rounded-lg outline-none font-mono font-black text-emerald-700 text-center cursor-not-allowed select-all"
                        title="Automatic secure 6-digit passcode"
                      />
                      <p className="text-[9px] text-slate-450 mt-1 italic">
                        🔒 Auto-generated for security. Only the system chooses passcodes.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t text-[11px] font-extrabold">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="text-slate-500 hover:text-slate-700 border px-4 py-2 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-emerald-800 border text-white hover:bg-emerald-950 px-5 py-2 rounded-lg"
                    >
                      Login Student
                    </button>
                  </div>
                </form>
              )}

              {/* Class roster tables */}
              {classStudents.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-2xl bg-slate-50 border-slate-200">
                  <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h4 className="font-extrabold text-slate-600 text-sm">Class Roster Empty</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Please click "Add Student" above to start populating reports for class {selectedClass}.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border rounded-xl shadow-sm">
                  <table className="w-full border-collapse text-left text-xs text-slate-800">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b">
                        <th className="py-2.5 px-4 text-center w-14">Position</th>
                        <th className="py-2.5 px-4 w-28">Student ID</th>
                        <th className="py-2.5 px-4">Student Name</th>
                        <th className="py-2.5 px-4 text-center">Sex</th>
                        <th className="py-2.5 px-4 text-center font-bold">Term Average Score</th>
                        <th className="py-2.5 px-4 text-right">Actions Panel</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-medium text-slate-900">
                      {classStudents.map((stud, index) => {
                        const stats = calculateStudentStatsForTerm(stud, activeTermTab);
                        const displayRank = index + 1;
                        
                        return (
                          <tr key={stud.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4 text-center font-extrabold text-slate-500">
                              <span className={`px-2 py-0.5 rounded-md ${displayRank === 1 ? 'bg-amber-100 text-amber-800 font-black' : displayRank === 2 ? 'bg-slate-200 text-slate-700' : 'text-slate-500'}`}>
                                {displayRank}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-500 text-xs">{stud.id}</td>
                            <td className="py-3 px-4 font-extrabold text-slate-900">{stud.name}</td>
                            <td className="py-3 px-4 text-center text-slate-600 font-bold text-xs">{stud.sex}</td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-xs text-slate-600">{stats.avgScore.toFixed(1)}%</td>
                            <td className="py-3 px-4 text-right flex justify-end gap-1.5 flex-row">
                              <button
                                onClick={() => setViewingReportStudent(stud)}
                                className="border border-slate-300 hover:border-emerald-600 hover:text-emerald-900 bg-white hover:bg-slate-50 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                              >
                                <Eye className="w-3.5 h-3.5" /> Print Preview
                              </button>
                              <button
                                onClick={() => startEditStudent(stud)}
                                className="border border-slate-300 hover:border-emerald-600 hover:text-emerald-900 bg-white hover:bg-slate-50 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                              >
                                {isTermReadOnly ? <Eye className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
                                {isTermReadOnly ? 'View Grades' : 'Grade Report'}
                              </button>
                              {!isTermReadOnly && (
                                <button
                                  onClick={() => deleteStudentProfile(stud.id, stud.name)}
                                  className="border border-red-250 hover:border-red-500 hover:bg-red-50 text-red-650 hover:text-red-900 p-1.5 rounded-lg transition-all shadow-sm"
                                  title="Delete student and report card"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Right Logout Button Panel */}
      <div className="max-w-6xl mx-auto mt-8 flex justify-end print:hidden">
        <button
          id="btn-trigger-logout-confirm"
          onClick={() => setShowLogoutConfirm(true)}
          className="bg-rose-600 hover:bg-rose-750 text-white text-[11px] font-black uppercase tracking-wider px-5 py-3 rounded-2xl transition-all shadow-md hover:scale-[1.01] active:scale-[0.99] flex items-center gap-2 cursor-pointer shadow-red-500/10"
        >
          <LogOut className="w-4 h-4 text-white" /> Logout Staff Desk
        </button>
      </div>

      {/* Custom Deletion Confirmation Dialog Modal with Yes/No */}
      {deleteConfirmStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 print:hidden animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-150 mx-4 transform transition-all duration-300 scale-100">
            <div className="flex items-center gap-3 text-red-600 mb-4 animate-bounce-subtle">
              <div className="p-2.5 bg-red-50 rounded-2xl">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Delete Report?</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Permanent change</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-600 font-medium mb-6">
              do you want to delete this report?
              <span className="block mt-2 font-extrabold text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px]">
                Student: {deleteConfirmStudent.name} ({deleteConfirmStudent.id})
              </span>
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                id="btn-delete-confirm-no"
                onClick={() => setDeleteConfirmStudent(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 hover:text-slate-800 transition-all cursor-pointer"
              >
                No
              </button>
              <button
                id="btn-delete-confirm-yes"
                onClick={() => {
                  const { id, name, className, source } = deleteConfirmStudent;
                  let refreshed = students.filter(s => s.id !== id);
                  refreshed = calculateClassPositions(refreshed, className, activeTermTab);
                  onUpdateStudents(refreshed);
                  
                  if (source === 'view') {
                    setViewingReportStudent(null);
                  } else if (source === 'edit') {
                    setEditingStudent(null);
                  }
                  
                  setDeleteConfirmStudent(null);
                  triggerSuccess(`Successfully erased student report card for ${name}.`);
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-red-500/20 cursor-pointer"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic bulk ZIP download progress overlay screen */}
      {isDownloadingAllZip && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 print:hidden animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-150 mx-4 space-y-4 text-slate-800">
            <div className="flex items-center gap-3 text-emerald-600 mb-2">
              <div className="p-2.5 bg-emerald-50 rounded-2xl">
                <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Bundling All Report Sheets</h3>
                <p className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-widest">{zipProgress}</p>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="bg-emerald-600 h-full transition-all duration-300 animate-pulse w-[105px]"></div>
            </div>
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
              Please wait. EZIBECK'S dynamic compiler is calculating rankings, mapping behavioral domains, and compiling high-DPI vector PDFs for all grade-levels into an archive.
            </p>
          </div>
        </div>
      )}

      {/* Custom Logout Confirmation Dialog Modal with Yes/Cancel */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 print:hidden animate-fade-in animate-once">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-150 mx-4 transform transition-all duration-300 scale-100">
            <div className="flex items-center gap-3 text-amber-600 mb-4 animate-bounce-subtle">
              <div className="p-2.5 bg-amber-50 rounded-2xl">
                <LogOut className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 font-sans uppercase">Confirm Logout</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Staff Desk Session</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-600 font-medium mb-6">
              Do you want to log out?
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                id="btn-logout-confirm-cancel"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 hover:text-slate-800 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-logout-confirm-yes"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  handleLogout();
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-750 text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-red-500/20 cursor-pointer"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supabase Database Cloud Sync Monitor Overlay Dialog */}
      {showDbSyncModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 overflow-y-auto print:hidden animate-fade-in py-8 font-sans">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-150 mx-4 my-auto relative transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto text-slate-705">
            
            <button
              onClick={() => {
                setShowDbSyncModal(false);
                setSyncDbResult(null);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors bg-slate-150 hover:bg-slate-200 p-2.5 rounded-xl cursor-pointer font-bold border-none"
            >
              ✕
            </button>

            {/* Header */}
            <div className="flex items-center gap-3.5 text-emerald-600 mb-6 pb-4 border-b border-slate-100">
              <div className="p-3 bg-emerald-50 rounded-2xl">
                <Database className="w-6 h-6 text-emerald-600 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 font-sans tracking-tight">EZIBECK Database Control Center</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Cloud Supabase Synchronization & Diagnostics</p>
              </div>
            </div>

            {/* Connection Status Detail Card */}
            <div className={`p-4 rounded-2xl border mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans ${
              !dbStatus || !dbStatus.configured
                ? 'bg-slate-50 border-slate-200 text-slate-600'
                : dbStatus.connected
                ? 'bg-emerald-50/50 border-emerald-150 text-emerald-900'
                : 'bg-rose-50 border-rose-150 text-rose-900'
            }`}>
              <div className="space-y-1">
                <span className="text-[9px] font-extrabold uppercase tracking-widest block text-slate-400">Current Integration Status</span>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${(!dbStatus || !dbStatus.configured) ? 'bg-slate-400' : dbStatus.connected ? 'bg-emerald-5000' : 'bg-red-500 animate-pulse'}`}></span>
                  <p className="text-xs font-black uppercase">
                    {(!dbStatus || !dbStatus.configured) ? 'Local Database Fallback' : dbStatus.connected ? 'Connected Live to Supabase' : 'Connection Blocked'}
                  </p>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  {(!dbStatus || !dbStatus.configured)
                    ? 'Your database is currently running entirely inside your local browser storage. Any additions, school configs, and grades will only exist on this PC.'
                    : dbStatus.connected
                    ? `Successfully connected to live cloud cluster. URL configured: ${dbStatus.supabaseUrl}`
                    : `We found environment credentials in AI Studio, but connection is blocked. Message: "${dbStatus.error || 'Check schema cache or network connection'}"`}
                </p>
              </div>
              
              {dbStatus && dbStatus.configured && (
                <button
                  onClick={async () => {
                    setIsSyncingDb(true);
                    setSyncDbResult(null);
                    const res = await onPullFromSupabase?.();
                    setIsSyncingDb(false);
                    if (res) {
                      setSyncDbResult({ type: res.success ? 'success' : 'error', text: res.message });
                    }
                  }}
                  disabled={isSyncingDb}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all outline-none cursor-pointer border border-slate-200 shrink-0 self-start md:self-center disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDb ? 'animate-spin' : ''}`} />
                  Test Sync & Refresh
                </button>
              )}
            </div>

            {/* Sync db results alert banner */}
            {syncDbResult && (
              <div className={`p-4 rounded-xl text-xs font-bold leading-normal mb-6 flex items-start gap-2.5 ${syncDbResult.type === 'success' ? 'bg-emerald-100 text-emerald-900 border border-emerald-250 animate-bounce-subtle' : 'bg-rose-100 text-rose-950 border border-rose-250 animate-shake'}`}>
                {syncDbResult.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" /> : <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />}
                <div>{syncDbResult.text}</div>
              </div>
            )}

            {/* Main Action Options */}
            {dbStatus && dbStatus.configured ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {/* Option Right: Download From Live database */}
                <div className="bg-slate-50/70 hover:bg-slate-50 p-5 rounded-2xl border border-slate-150 transition-all space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="p-2 bg-slate-100 w-fit rounded-xl text-slate-600">
                      <CloudDownload className="w-5 h-5 text-slate-800" />
                    </div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">Pull Fresh Supabase → Website</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Download all saved report cards, school Standard descriptions, staff logins, and next term resumption details from your Cloud Supabase DB to reload this webpage state.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      setIsSyncingDb(true);
                      setSyncDbResult(null);
                      const res = await onPullFromSupabase?.();
                      setIsSyncingDb(false);
                      if (res) {
                        setSyncDbResult({ type: res.success ? 'success' : 'error', text: res.message });
                      }
                    }}
                    disabled={isSyncingDb}
                    className="w-full mt-4 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:bg-slate-800 flex items-center justify-center gap-2 shadow-xs cursor-pointer select-none disabled:opacity-50 active:scale-[0.99] border-none"
                  >
                    {isSyncingDb ? (
                      <>
                        <RefreshCw className="w-4 h-4 text-white animate-spin" /> Pulling Cloud records...
                      </>
                    ) : (
                      <>
                        <CloudDownload className="w-4 h-4 text-white" /> Download Database Data
                      </>
                    )}
                  </button>
                </div>

                {/* Option Left: Push Local to Live Database */}
                <div className="bg-emerald-50/30 hover:bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100/60 transition-all space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="p-2 bg-emerald-50 w-fit rounded-xl text-emerald-600">
                      <CloudUpload className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h4 className="text-xs font-black text-emerald-950 uppercase tracking-tight">Push Website → Sync Supabase</h4>
                    <p className="text-[11px] text-emerald-900/70 leading-relaxed">
                      Erase old database records and upload your current browser local storage dataset directly into your active Supabase cloud cluster. Useful for initializing fresh databases.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      const consent = window.confirm("Are you sure you want to push local data to Supabase? This will overwrite the database tables for this term.");
                      if (!consent) return;
                      setIsSyncingDb(true);
                      setSyncDbResult(null);
                      const res = await onPushLocalToSupabase?.();
                      setIsSyncingDb(false);
                      if (res) {
                        setSyncDbResult({ type: res.success ? 'success' : 'error', text: res.message });
                      }
                    }}
                    disabled={isSyncingDb}
                    className="w-full mt-4 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:bg-emerald-700 flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/10 cursor-pointer select-none disabled:opacity-50 active:scale-[0.99] border-none"
                  >
                    {isSyncingDb ? (
                      <>
                        <RefreshCw className="w-4 h-4 text-white animate-spin" /> Uploading local roster...
                      </>
                    ) : (
                      <>
                        <CloudUpload className="w-4 h-4 text-white" /> Upload Local Data to Cloud
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200 space-y-3 text-slate-800 text-xs leading-normal mb-8">
                <span className="font-extrabold uppercase tracking-widest text-[9px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded">Setup Notification</span>
                <p className="font-medium text-[11px] text-slate-600 leading-normal">
                  Your live connection is currently disabled because the environment secrets are not filled yet. To connect real data and sync between teachers:
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-[11px] font-medium text-slate-600">
                  <li>Go to <strong>Settings Menu (top right core controls)</strong> in AI Studio.</li>
                  <li>Add <strong>VITE_SUPABASE_URL</strong> and <strong>VITE_SUPABASE_ANON_KEY</strong> to environment variables.</li>
                  <li>Recompile applet and sign in to access dynamic web database!</li>
                </ol>
              </div>
            )}

            {/* Footer buttons */}
            <div className="flex items-center justify-end mt-6 gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowDbSyncModal(false);
                  setSyncDbResult(null);
                }}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl tracking-wider uppercase transition-all shadow-xs cursor-pointer select-none border-none"
              >
                Close Controller
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Floating AI Staff Assistant */}
      <AIAgentComponent />
    </div>
  );
}
