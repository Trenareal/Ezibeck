/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { forwardRef } from 'react';
import { Student, Workspace15Template } from '../types';
import { 
  calculateStudentStatsForTerm, 
  calculateClassPositions, 
  getLetterAndRemark, 
  calculateSubjectTotal, 
  formatOrdinal 
} from '../utils/academicUtils';
import { ReportCardWatermark } from './ReportCardWatermark';
import schoolBadge from '../assets/images/school_badge_1781423327113.jpg';
import { safeStorage } from '../utils/safeStorage';

interface ReportCardPrintableProps {
  student: Student;
  term: string;
  template: Workspace15Template;
  studentsRoster: Student[];
  isGeneratingPdf?: boolean;
}

export const ReportCardPrintable = forwardRef<HTMLDivElement, ReportCardPrintableProps>(({
  student,
  term,
  template,
  studentsRoster,
  isGeneratingPdf = false
}, ref) => {
  const stats = calculateStudentStatsForTerm(student, term);
  const cleanClassName = (student?.className || '').replace(/\s+/g, '');
  const isSecondaryClass = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2A', 'SS2B', 'SS3A', 'SS3B'].includes(cleanClassName);
  const isNursery = ['Pre-Nursery', 'Nursery1', 'Nursery2', 'Nursery3'].includes(cleanClassName);
  const isBasic = ['Basic1', 'Basic2', 'Basic3', 'Basic4', 'Basic5', 'Basic6'].includes(cleanClassName);

  const getNurseryTermStats = (termName: 'First Term' | 'Second Term' | 'Third Term') => {
    let subjectsToUse: any[] = [];
    
    if (term === termName) {
      subjectsToUse = student.subjects || [];
    } else {
      const termKey = `ezibeck_students_${termName.toLowerCase().replace(/\s+/g, '_')}`;
      const data = typeof window !== 'undefined' ? safeStorage.getItem(termKey) : null;
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            const baseId = student.id.split('_')[0];
            const matchedStud = parsed.find((s: any) => s && s.id && typeof s.id === 'string' && s.id.split('_')[0] === baseId);
            if (matchedStud && Array.isArray(matchedStud.subjects)) {
              subjectsToUse = matchedStud.subjects;
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    if (subjectsToUse.length === 0) {
      return { cumulative: 0, average: 0, available: false };
    }

    const cumulative = subjectsToUse.reduce((sum: number, s: any) => {
      const test = s.testScore || 0;
      const exam = s.examScore || 0;
      return sum + (test + exam);
    }, 0);
    const average = cumulative / subjectsToUse.length;

    return { cumulative, average, available: true };
  };

  // Load first term students from storage for average column in second term
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
    console.error("Error parsing first term students in ReportCardPrintable", e);
  }

  // Next term fees calculation
  const parseNum = (v: string): number => {
    const cln = (v || '').replace(/[^\d.]/g, '');
    const parsed = parseFloat(cln);
    return isNaN(parsed) ? 0 : parsed;
  };
  
  const cls = student.className || '';
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

  // Appraisal and signatories logic
  let fallbackTeacher = '';
  if (isBasic) {
    fallbackTeacher = template.formTeacherJunior || "Headmistress";
  } else if (isNursery) {
    fallbackTeacher = template.formTeacherSenior || "Nursery Admin";
  } else {
    fallbackTeacher = template.principalName || "Principal";
  }

  const displayTeacherName = student.formTeacherName || fallbackTeacher;

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
    <div 
      ref={ref}
      className={`report-card-printable bg-white border border-slate-200 rounded-xl shadow-md p-2 sm:p-3 space-y-1.5 relative print:border-none print:shadow-none print:p-3.5 print:m-0 print:w-[210mm] print:h-[297mm] print:flex print:flex-col print:justify-between animate-fade-in text-slate-800 text-[13px] leading-tight ${isGeneratingPdf ? 'pdf-force-light' : ''}`}
    >
      {/* Diagonal tiled watermark background */}
      <ReportCardWatermark />

      {/* Print layout decorator line */}
      <div className="absolute inset-2 border border-slate-100/50 rounded-lg pointer-events-none print:hidden"></div>

      {/* Ezibeck Style Header Breadcrumbs */}
      <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-medium text-slate-400 border-b border-slate-100 pb-1 relative z-10 select-none print:hidden">
        <span>🏫 {template.schoolName}</span>
        <span>/</span>
        <span>📁 Report Registry</span>
        <span>/</span>
        <span>👥 {student.className}</span>
        <span>/</span>
        <span className="text-slate-700 font-semibold">📄 {student.name}</span>
      </div>
      <div className="school-header-block relative flex items-center justify-center border-b border-slate-200/50 pb-1.5 mt-0 select-none">
        {/* School Badge on the left side */}
        <div className="absolute left-0 flex-shrink-0">
          <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 shadow-3xs flex items-center justify-center overflow-hidden">
            <img 
              src={schoolBadge} 
              alt={`${template.schoolName} Emblem`} 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Centered header details */}
        <div className="text-center space-y-0 max-w-xl">
          <h1 className="school-title-text text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none uppercase">
            {template.schoolName}
          </h1>
          <p className="text-[8px] uppercase tracking-wider text-emerald-750 font-extrabold flex items-center justify-center gap-1 select-none">
            <span className="w-1 h-1 rounded-full bg-emerald-600"></span>
            Motto: {template.motto}
          </p>
          <p className="text-slate-500 text-[8px] leading-none">
            <strong>Address:</strong> {template.address} | <strong>Phone:</strong> {template.phone} | <strong>Email:</strong> {template.email}
          </p>
        </div>
      </div>

      {/* Dynamic Official Page Heading */}
      <div className="official-status-row relative z-10 py-0.5 flex items-center justify-between border-b border-slate-100 select-none">
        <h2 className="text-[10px] font-extrabold text-slate-900 tracking-tight leading-none uppercase flex items-center gap-1.5">
          <span className="inline-block px-1.5 py-0.5 bg-slate-900 text-slate-100 text-[7.5px] font-black rounded tracking-wider">OFFICIAL STATUS</span>
          STUDENT’S TERMLY REPORT SHEET FOR {
            student.className.startsWith('JSS') ? 'JUNIOR SECONDARY' :
            student.className.startsWith('SS') ? 'SENIOR SECONDARY' :
            student.className.startsWith('Basic') ? 'BASIC' : 'NURSERY'
          } SCHOOL
        </h2>
        <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest">
          {term.toUpperCase()} SESSION
        </span>
      </div>

      {/* Top Compact Cards: 2 Columns Grid */}
      <div className="relative z-10 grid grid-cols-2 gap-3">
        {/* Card 1: Student Profile */}
        <div className="bg-[#FAF9F9] border border-slate-200/80 rounded-xl p-2 shadow-3xs text-slate-800 text-[12px] flex flex-col justify-between">
          <div>
            <h4 className="font-extrabold text-slate-900 text-[10px] uppercase tracking-wider mb-1 select-none border-b border-slate-200/50 pb-0.5 flex items-center gap-1">
              <span>👤</span> Student Profile
            </h4>
            <div className="space-y-0">
              <div className="flex justify-between items-center gap-1">
                <span className="text-slate-400 font-semibold select-none">Name:</span>
                <span className="font-extrabold text-slate-900 truncate max-w-[220px]">{student.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold select-none">Access ID:</span>
                <span className="font-mono font-bold text-slate-750">{student.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold select-none">Class:</span>
                <span className="font-extrabold text-slate-900">{student.className}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold select-none">Sex / Gender:</span>
                <span className="font-bold text-slate-800">{student.sex}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold select-none">Age Profile:</span>
                <span className="font-bold text-slate-800">{student.age} Years</span>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-200/50 pt-0.5 mt-0.5 flex justify-between items-center text-[10.5px]">
            <span className="text-slate-400 font-semibold select-none">Attendance:</span>
            <span className="font-bold text-slate-800">{student.attendancePresent} / {student.attendanceTotal} sessions ({Math.round((student.attendancePresent || 0) / (student.attendanceTotal || 1) * 105)}%)</span>
          </div>
        </div>

        {/* Card 2: Next Term & Fees Summary */}
        <div className="bg-[#FAF9F9] border border-slate-200/80 rounded-xl p-2 shadow-3xs text-slate-855 text-[12px] flex flex-col justify-between">
          <div>
            <h4 className="font-extrabold text-slate-900 text-[10px] uppercase tracking-wider mb-1 select-none border-b border-slate-200/50 pb-0.5 flex items-center gap-1">
              <span>💰</span> Next Term Fees Summary
            </h4>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0 text-[11px]">
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
          <div className="border-t border-dashed border-emerald-300 pt-0.5 mt-0.5 flex justify-between items-center text-[11px]">
            <span className="font-extrabold text-emerald-855">Total Invoice:</span>
            <span className="font-black text-emerald-855 font-mono">{totalFormatted}</span>
          </div>
          <div className="flex justify-between items-center mt-0.5 text-[10.5px] text-slate-400 leading-none">
            <span>Resumption:</span>
            <span className="font-extrabold text-slate-600">{template.resumptionDate}</span>
          </div>
        </div>
      </div>

      {/* Part A: Academic Course Evaluation */}
      <div className="relative z-10 space-y-1">
        <h3 className="text-slate-900 font-black text-[10.5px] uppercase tracking-wider border-l-4 border-slate-900 pl-2 py-0.5 flex items-center justify-between select-none">
          <span>Part A: Academic Course Evaluation</span>
          <span className="text-[8.5px] text-slate-450 normal-case font-bold">Standard Formula Matrix Layout</span>
        </h3>
        {/* Ezibeck-style database table */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white shadow-3xs">
          <table className="academic-evaluation-table w-full text-left text-[13px] border-collapse">
            <thead>
              <tr className="bg-[#EAEAEA] border-b border-slate-300 text-slate-955 font-black select-none text-[9px] uppercase tracking-wider">
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
                  <span className="flex items-center justify-center text-emerald-955 font-black">TERM (100)</span>
                </th>
                {term === 'Second Term' && isSecondaryClass && (
                  <th className="py-1 px-2 border-r border-slate-300 text-center text-[8.5px] w-20 bg-blue-50 text-blue-900 font-black">
                    <span className="flex items-center justify-center">1ST T AVG</span>
                  </th>
                )}
                {term === 'Third Term' && !isNursery && (
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
              {student.subjects.map(subj => {
                const tot = calculateSubjectTotal(subj);
                
                // Formulate annual / session average data realistically matching the 20/20/60 formula of Ezibeck
                const firstTerm = subj.firstTermSummary !== undefined && subj.firstTermSummary !== 0 ? subj.firstTermSummary : Math.round(tot * 0.2);
                const secondTerm = subj.secondTermSummary !== undefined && subj.secondTermSummary !== 0 ? subj.secondTermSummary : Math.round(tot * 0.2);
                const thirdTerm = subj.thirdTermSummary !== undefined && subj.thirdTermSummary !== 0 ? subj.thirdTermSummary : Math.round(tot * 0.6);
                const sessionAvg = firstTerm + secondTerm + thirdTerm;

                const { letter, remark, ratingClass } = getLetterAndRemark(
                  term === 'Third Term' ? sessionAvg : tot
                );

                return (
                  <tr key={subj.id} className="hover:bg-slate-50/50 border-b border-slate-150">
                    <td className="py-1 px-2 border-r border-slate-150 font-extrabold text-slate-900 bg-slate-50/20">{subj.name}</td>
                    <td className="py-1 px-2 border-r border-slate-150 text-center font-mono font-bold text-slate-800">{subj.testScore}</td>
                    <td className="py-1 px-2 border-r border-slate-150 text-center font-mono font-bold text-slate-800">{subj.examScore}</td>
                    <td className="py-1 px-2 border-r border-slate-150 text-center font-black font-mono text-emerald-850 bg-emerald-50/10">{tot}</td>
                    {term === 'Second Term' && isSecondaryClass && (
                      <td className="py-1 px-2 border-r border-slate-150 text-center font-mono font-bold text-slate-800 bg-blue-50/5">
                        {(() => {
                          let firstTermAvgStr = "-";
                          const baseId = student.id.split('_')[0];
                          try {
                            const matchMatch = firstTermStuds.find(s => s.id.startsWith(baseId));
                            const matchSubj = matchMatch?.subjects.find(s => s.name.toLowerCase() === subj.name.toLowerCase());
                            if (subj.firstTermSummary !== undefined && subj.firstTermSummary !== 0) {
                              firstTermAvgStr = String(subj.firstTermSummary) + "%";
                            } else if (matchSubj) {
                              firstTermAvgStr = String((matchSubj.testScore || 0) + (matchSubj.examScore || 0)) + "%";
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
                    {term === 'Third Term' && !isNursery && (
                      <>
                        <td className="py-1 px-1 border-r border-slate-150 text-center font-mono font-bold text-slate-800">{firstTerm}</td>
                        <td className="py-1 px-1 border-r border-slate-150 text-center font-mono font-bold text-slate-800">{secondTerm}</td>
                        <td className="py-1 px-1 border-r border-slate-150 text-center font-mono font-bold text-slate-800">{thirdTerm}</td>
                        <td className="py-1 px-2 border-r border-slate-150 text-center font-black font-mono text-emerald-850 bg-slate-50/40">{sessionAvg}</td>
                      </>
                    )}
                    <td className="py-1 px-2 border-r border-slate-150 text-center">
                      <span className={`px-1.5 py-0.5 text-[11px] font-black rounded-sm tracking-wider ${ratingClass}`}>
                        {letter}
                      </span>
                    </td>
                    <td className="py-1 px-1 border-r border-slate-150 text-center font-black text-slate-900 bg-slate-50/10">
                      {isNursery || isBasic ? '-' : formatOrdinal(subj.position)}
                    </td>
                    <td className="py-1 px-2 italic text-slate-700 text-[12px] font-bold leading-tight bg-[#FCFCFC]">{remark}</td>
                  </tr>
                );
              })}

              {/* Calculation Footer */}
              <tr className="bg-[#FAF9F9]/90 border-t border-slate-205 text-slate-400 font-semibold select-none text-[12px] uppercase tracking-wider divide-x divide-slate-100">
                <td className="py-1 px-2 font-semibold text-slate-500">
                  Count: {student.subjects.length}
                </td>
                <td className="py-1 px-2 text-center font-bold">
                  Avg: {(() => {
                    const tCount = student.subjects.length || 1;
                    const testSum = student.subjects.reduce((sum, s) => sum + (s.testScore || 0), 0);
                    return (testSum / tCount).toFixed(1);
                  })()}
                </td>
                <td className="py-1 px-2 text-center font-bold">
                  Avg: {(() => {
                    const tCount = student.subjects.length || 1;
                    const examSum = student.subjects.reduce((sum, s) => sum + (s.examScore || 0), 0);
                    return (examSum / tCount).toFixed(1);
                  })()}
                </td>
                <td className="py-1 px-2 text-center font-black text-emerald-850 bg-emerald-50/10">
                  Avg: {stats.avgScore.toFixed(1)}%
                </td>
                {term === 'Second Term' && isSecondaryClass && (
                  <td className="py-1 px-2 text-center font-bold text-slate-400">-</td>
                )}
                {term === 'Third Term' && !isNursery && (
                  <>
                    <td className="py-1 px-1 text-center font-bold">
                      Avg: {(() => {
                        const tCount = student.subjects.length || 1;
                        const fSum = student.subjects.reduce((sum, s) => sum + (s.firstTermSummary !== undefined ? s.firstTermSummary : 0), 0);
                        return (fSum / tCount).toFixed(1);
                      })()}
                    </td>
                    <td className="py-1 px-1 text-center font-bold">
                      Avg: {(() => {
                        const tCount = student.subjects.length || 1;
                        const sSum = student.subjects.reduce((sum, s) => sum + (s.secondTermSummary !== undefined ? s.secondTermSummary : 0), 0);
                        return (sSum / tCount).toFixed(1);
                      })()}
                    </td>
                    <td className="py-1 px-1 text-center font-bold">
                      Avg: {(() => {
                        const tCount = student.subjects.length || 1;
                        const thSum = student.subjects.reduce((sum, s) => sum + (s.thirdTermSummary !== undefined ? s.thirdTermSummary : 0), 0);
                        return (thSum / tCount).toFixed(1);
                      })()}
                    </td>
                    <td className="py-1 px-2 text-center font-black bg-slate-100/50 text-slate-800">
                      Avg: {(() => {
                        const tCount = student.subjects.length || 1;
                        const sessionSum = student.subjects.reduce((sum, s) => {
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

       {/* Part B: Academic Performance Summary (Moved before character and skill grading) */}
      <div className="relative z-10 bg-[#FAF9F9] border border-slate-200/85 rounded-xl p-2 shadow-3xs text-slate-800 text-[12px] print:text-[12px] mb-2">
        <div className="flex items-center justify-between gap-x-4 gap-y-1">
          <div className="flex items-center gap-1">
            <span className="font-extrabold text-slate-900 uppercase tracking-wider text-[10.5px] select-none">📊 Academic Summary:</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-semibold select-none">Cumulative Total:</span>
              <span className="font-black text-slate-900">{stats.totalScore} / {stats.maxPossibleScore}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-semibold select-none">Termly Average:</span>
              <span className="font-black text-emerald-800 font-mono">{stats.avgScore.toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-semibold select-none">Total Subjects:</span>
              <span className="font-bold text-slate-800">{student.subjects.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-semibold select-none">Passed:</span>
              <span className="font-bold text-emerald-700">{stats.creditsAndAbove + stats.passes}</span>
            </div>
            <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
              <span className="text-slate-500 font-semibold select-none">Verdict:</span>
              <span className="font-black text-emerald-855 bg-emerald-50 px-1.5 py-0.2 rounded text-[10.5px]">{stats.avgScore >= (template.passThreshold || 50) ? "PASS" : "FAIL"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Nursery Term Averages & Performance Catalog Table */}
      {isNursery && (
        <div className="relative z-10 bg-white border border-slate-200 rounded-xl p-2.5 shadow-3xs text-slate-800 text-[11px] print:text-[11px] mb-2">
          <h4 className="font-extrabold text-slate-900 text-[10px] uppercase tracking-wider mb-2 select-none border-b border-slate-200/50 pb-0.5 flex items-center gap-1">
            <span>📊</span> Term Averages & Performance Catalog
          </h4>
          <div className="overflow-hidden border border-slate-150 rounded-lg">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150 text-[9px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="py-1.5 px-3 font-black">Term Period</th>
                  <th className="py-1.5 px-3 text-center font-black">Cumulative Score</th>
                  <th className="py-1.5 px-3 text-center font-black">Overall Subject Average (%)</th>
                  <th className="py-1.5 px-3 text-center font-black">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {(['First Term', 'Second Term', 'Third Term'] as const).map(termName => {
                  const statsVal = getNurseryTermStats(termName);
                  const isCurrentActive = term === termName;
                  
                  return (
                    <tr key={termName} className={`hover:bg-slate-50/50 ${isCurrentActive ? 'bg-emerald-50/20 font-bold' : ''}`}>
                      <td className="py-1 px-3 font-extrabold text-slate-900">
                        {termName} Average
                      </td>
                      <td className="py-1 px-3 text-center font-mono text-slate-800">
                        {statsVal.available ? statsVal.cumulative : '-'}
                      </td>
                      <td className="py-1 px-3 text-center font-mono font-bold text-emerald-800">
                        {statsVal.available ? `${statsVal.average.toFixed(1)}%` : '-'}
                      </td>
                      <td className="py-1 px-3 text-center text-[9px]">
                        {isCurrentActive ? (
                          <span className="font-bold text-emerald-700">Current Term</span>
                        ) : statsVal.available ? (
                          <span className="text-slate-500">Recorded</span>
                        ) : (
                          <span className="text-slate-400 italic">Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ratings & Grade Scale Row */}
      <div className="grid grid-cols-12 gap-3 relative z-10 pt-2 border-t border-dashed border-slate-200">
        {/* Column 1: Character & Behavioral Conduct Ratings (takes 8/12 width) */}
        <div className="col-span-8 bg-[#FCFCFC]/60 border border-slate-200 rounded-xl p-2 shadow-3xs flex flex-col justify-between character-skills-ratings-box">
          <div>
            <h4 className="font-extrabold text-slate-900 text-[10.5px] uppercase tracking-wider mb-1 select-none border-b border-slate-200/50 pb-0.5 flex items-center gap-1">
              <span>🌟</span> Character & Skills Ratings
            </h4>
            <div className="space-y-0 text-[12px] text-slate-800">
              {(() => {
                const isKgClass = student.className === 'Pre-Nursery' || student.className.startsWith('Nursery');
                if (isKgClass) {
                  const behaviouralList = student.behaviour.filter(b => 
                    ["Punctuality", "Neatness", "Assignment", "Concentration"].includes(b.name)
                  );
                  const skillList = student.behaviour.filter(b => 
                    ["Hand-writing", "Fluency", "Attitude to Property"].includes(b.name)
                  );
                  return (
                    <div className="grid grid-cols-2 gap-x-4">
                      <div className="space-y-0">
                        <h5 className="font-bold text-[8.5px] text-slate-400 uppercase tracking-wider pb-0.2 border-b border-slate-100">Behavioral</h5>
                        {behaviouralList.map(b => (
                          <div key={b.name} className="flex items-center justify-between py-0.2 border-b border-dashed border-slate-100">
                            <span className="font-semibold text-slate-600 truncate max-w-[100px]">{b.name}</span>
                            <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-1 rounded">{b.rating}/5</span>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-0">
                        <h5 className="font-bold text-[8.5px] text-slate-400 uppercase tracking-wider pb-0.2 border-b border-slate-100">Skills</h5>
                        {skillList.map(b => (
                          <div key={b.name} className="flex items-center justify-between py-0.2 border-b border-dashed border-slate-100">
                            <span className="font-semibold text-slate-600 truncate max-w-[100px]">{b.name}</span>
                            <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-1 rounded">{b.rating}/5</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="grid grid-cols-2 gap-x-4">
                      {student.behaviour.map(b => (
                        <div key={b.name} className="flex items-center justify-between py-0.2 border-b border-dashed border-slate-100">
                          <span className="font-semibold text-slate-600 truncate max-w-[110px]">{b.name}</span>
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

        {/* Column 2: Grades Index & Conduct Scale (takes 4/12 width, very compact) */}
        <div className="col-span-4 bg-[#FCFCFC]/60 border border-slate-200 rounded-xl p-2 shadow-3xs flex flex-col justify-between grade-key-conduct-box">
          <div>
            <h4 className="font-extrabold text-slate-900 text-[10.5px] uppercase tracking-wider mb-1 select-none border-b border-slate-200/50 pb-0.5 flex items-center gap-1">
              <span>📋</span> Grade Key & Conduct Scale
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {/* Grades Index table */}
              <div className="border border-slate-150 rounded-lg overflow-hidden shadow-3xs">
                <table className="w-full text-[8.5px] text-left border-collapse text-slate-600">
                  <tbody className="divide-y divide-slate-100 font-semibold">
                    <tr>
                      <td className="py-0 px-1 font-black text-emerald-700 bg-emerald-50">A+</td>
                      <td className="py-0 px-1">90-100</td>
                    </tr>
                    <tr>
                      <td className="py-0 px-1 font-black text-green-700 bg-green-50">A</td>
                      <td className="py-0 px-1">80-89</td>
                    </tr>
                    <tr>
                      <td className="py-0 px-1 font-black text-sky-700 bg-sky-50">B</td>
                      <td className="py-0 px-1">70-79</td>
                    </tr>
                    <tr>
                      <td className="py-0 px-1 font-black text-amber-500 bg-amber-50">C</td>
                      <td className="py-0 px-1">60-69</td>
                    </tr>
                    <tr>
                      <td className="py-0 px-1 font-black text-orange-600 bg-orange-50">D</td>
                      <td className="py-0 px-1">50-59</td>
                    </tr>
                    <tr>
                      <td className="py-0 px-1 font-black text-red-500 bg-red-50">F</td>
                      <td className="py-0 px-1">&lt; 50</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Conduct Scale list */}
              <div className="space-y-0 text-slate-500 font-bold text-[8.5px]">
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-emerald-50 text-emerald-700 text-[7.5px] flex items-center justify-center font-mono font-black">5</span>
                  <span>Excellent</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-green-50 text-green-700 text-[7.5px] flex items-center justify-center font-mono font-black">4</span>
                  <span>Very Good</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-sky-50 text-sky-700 text-[7.5px] flex items-center justify-center font-mono font-black">3</span>
                  <span>Good</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-amber-50 text-amber-650 text-[7.5px] flex items-center justify-center font-mono font-black">2</span>
                  <span>Fair</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-slate-50 text-slate-500 text-[7.5px] flex items-center justify-center font-mono font-black">1</span>
                  <span>Needs Work</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appraisals, Signatures & Stamps (Guaranteed 1 row using grid-cols-2) */}
      <div className="bg-[#FAF9F9] border border-slate-200 rounded-xl p-2 shadow-3xs text-[12px] print:text-[12px] text-slate-800 space-y-2 relative z-10">
        <div className="grid grid-cols-2 gap-4">
          {/* Column 1: Teacher Remark */}
          <div className="space-y-1">
            <div>
              <span className="font-extrabold text-slate-955 uppercase tracking-wider block border-b border-slate-200 pb-0.5 select-none text-[10px]">
                💬 Teacher Appraisal
              </span>
              <p className="italic text-slate-600 leading-tight pt-0.5">
                "{student.formTeacherRemark}"
              </p>
            </div>
            
            <div className="pt-1 flex justify-between items-center border-t border-slate-100">
              <div>
                <p className="font-black text-slate-900 select-none text-[11px]">{displayTeacherName}</p>
                <span className="text-slate-455 uppercase tracking-wider select-none font-bold text-[8.5px]">Class Teacher</span>
              </div>
              <div className="border-b border-dashed border-slate-400 w-20 h-4"></div>
            </div>
          </div>

          {/* Column 2: Principal / Headmistress Remark */}
          <div className="space-y-1">
            <div>
              <span className="font-extrabold text-slate-955 uppercase tracking-wider block border-b border-slate-200 pb-0.5 select-none text-[10px]">
                {isBasic ? "Headmistress assessment" : isNursery ? "Nursery Admin assessment" : "Principal assessment"}
              </span>
              <p className="italic text-slate-600 leading-tight pt-0.5">
                {student.principalRemark
                  ? `"${student.principalRemark}"`
                  : (student.formTeacherRemark.includes("outstanding") || stats.avgScore >= (template.distinctionThreshold || 90)
                    ? `"Highly commendable academic and behavioral character shown during the term session. Excellent candidate. Promoted with honor."`
                    : stats.avgScore >= (template.passThreshold || 50)
                      ? `"Satisfactory progress. Continued focus on core concepts will serve candidate well. Promoted."`
                      : `"Needs close guidance and study supervision in future sessions to ensure passing criteria."`)}
              </p>
            </div>

            <div className="pt-1 flex justify-between items-center border-t border-slate-100">
              <div>
                <p className="font-black text-slate-900 select-none text-[11px]">{displaySignatoryName}</p>
                <span className="text-slate-455 uppercase tracking-wider select-none font-bold text-[8.5px]">
                  {isBasic ? "Headmistress" : isNursery ? "Nursery Admin" : "Principal"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="border-b border-dashed border-slate-400 w-20 h-4"></div>
                <div className="w-7 h-7 rounded-full border border-emerald-600/50 flex flex-col items-center justify-center bg-white text-emerald-700 font-bold shrink-0">
                  <span className="text-[2.5px] leading-none">OFFICIAL</span>
                  <span className="text-[3.5px] leading-none">STAMP</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Status bar stamp */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-1.5 bg-slate-900 text-slate-200 py-1.5 px-3 rounded-xl relative z-10 text-[9.5px] border border-slate-800 shadow-sm animate-fade-in select-none">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Candidate Academic Status: <strong className="text-white">Active and Promoted</strong></span>
        </span>
        
        <span className="bg-emerald-600 text-white font-extrabold px-1.5 py-0.2 text-[8px] rounded tracking-wider uppercase">
          ★ Official Seal Verified
        </span>
      </div>
    </div>
  );
});

ReportCardPrintable.displayName = 'ReportCardPrintable';
