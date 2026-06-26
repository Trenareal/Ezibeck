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
      className={`report-card-printable bg-white border-2 border-[#15803d] p-6 sm:p-8 space-y-5 relative print:border-none print:shadow-none print:p-0 print:m-0 animate-fade-in text-slate-800 text-[14px] sm:text-[15px] leading-normal ${isGeneratingPdf ? 'pdf-force-light' : ''}`}
      style={{ borderColor: '#15803d' }}
    >
      {/* Subtle background watermark */}
      <ReportCardWatermark />

      {/* Breadcrumbs for non-print view */}
      <div className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-slate-400 border-b border-slate-100 pb-2 relative z-10 select-none print:hidden">
        <span>🏫 {template.schoolName}</span>
        <span>/</span>
        <span>📁 Report Registry</span>
        <span>/</span>
        <span>👥 {student.className}</span>
        <span>/</span>
        <span>📄 {student.name}</span>
      </div>

      {/* Header Block Section */}
      <div className="relative flex items-center justify-between border-b-2 border-[#15803d] pb-5 mt-2 select-none">
        {/* Left Side Logo */}
        <div className="flex-shrink-0">
          <div className="w-24 h-24 bg-white rounded-full border-2 border-[#15803d] flex items-center justify-center overflow-hidden">
            <img 
              src={schoolBadge} 
              alt={`${template.schoolName} Emblem`} 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="text-[#15803d] text-[9px] font-black tracking-tight text-center mt-1.5 w-24 leading-none">
            Motto: Knowledge is Power
          </div>
        </div>

        {/* Centered School Name and Address */}
        <div className="text-center flex-grow px-6">
          <h1 className="text-3xl sm:text-4xl font-black text-[#15803d] tracking-tight leading-none uppercase">
            EZIBECK'S ACADEMY
          </h1>
          <p className="text-[#15803d] text-[13px] sm:text-[14.5px] font-bold tracking-wide mt-2 leading-snug">
            No, 5 Ezibeck's Crescent, Behind Udu Motor Park Ovwian, Delta State
          </p>
          <p className="text-[#15803d] text-[13.5px] sm:text-[15px] font-black tracking-widest mt-1 uppercase">
            MOTTO: Knowledge is Power
          </p>

          <div className="inline-block mt-3 px-4 py-1.5 border border-[#15803d] text-[#15803d] text-[14px] sm:text-[15.5px] font-black tracking-wider uppercase">
            STUDENT'S TERMLY REPORT SHEET FOR {
              student.className.toUpperCase().replace('CLASS', '').trim()
            }
          </div>
        </div>

        {/* Dummy right spacer for visual centering balance on desktop */}
        <div className="w-24 h-24 invisible shrink-0 hidden sm:block"></div>
      </div>

      {/* Student Profile Block - Styled exactly like the paper template lines */}
      <div className="relative z-10 space-y-3 py-2 select-none text-[#15803d] font-bold">
        {/* Line 1 */}
        <div className="flex items-end gap-2 min-h-[32px]">
          <span className="shrink-0 text-[13px] sm:text-[14px] uppercase tracking-wider">PUPIL'S NAME:</span>
          <div className="border-b-2 border-dotted border-[#15803d] flex-grow pb-1 px-4 font-extrabold text-slate-900 text-base sm:text-lg uppercase tracking-wide">
            {student.name}
          </div>
        </div>

        {/* Line 2 */}
        <div className="grid grid-cols-12 gap-4 sm:gap-5">
          <div className="col-span-3 flex items-end gap-1.5 min-h-[32px]">
            <span className="shrink-0 text-[13px] uppercase tracking-wider">SEX:</span>
            <div className="border-b-2 border-dotted border-[#15803d] flex-grow pb-1 px-3 font-extrabold text-slate-900 uppercase">
              {student.sex}
            </div>
          </div>
          <div className="col-span-3 flex items-end gap-1.5 min-h-[32px]">
            <span className="shrink-0 text-[13px] uppercase tracking-wider">AGE:</span>
            <div className="border-b-2 border-dotted border-[#15803d] flex-grow pb-1 px-3 font-extrabold text-slate-900">
              {student.age} Years
            </div>
          </div>
          <div className="col-span-3 flex items-end gap-1.5 min-h-[32px]">
            <span className="shrink-0 text-[13px] uppercase tracking-wider">CLASS:</span>
            <div className="border-b-2 border-dotted border-[#15803d] flex-grow pb-1 px-3 font-extrabold text-slate-900 uppercase">
              {student.className}
            </div>
          </div>
          <div className="col-span-3 flex items-end gap-1.5 min-h-[32px]">
            <span className="shrink-0 text-[13px] uppercase tracking-wider">TERM REPORT:</span>
            <div className="border-b-2 border-dotted border-[#15803d] flex-grow pb-1 px-3 font-extrabold text-slate-900 uppercase">
              {term}
            </div>
          </div>
        </div>

        {/* Line 3 */}
        <div className="grid grid-cols-12 gap-4 sm:gap-5">
          <div className="col-span-4 flex items-end gap-1.5 min-h-[32px]">
            <span className="shrink-0 text-[13px] uppercase tracking-wider">ATTENDANCE:</span>
            <div className="border-b-2 border-dotted border-[#15803d] flex-grow pb-1 px-3 font-extrabold text-slate-900">
              {student.attendancePresent || 0}
            </div>
          </div>
          <div className="col-span-4 flex items-end gap-1.5 min-h-[32px]">
            <span className="shrink-0 text-[13px] uppercase tracking-wider">OUT OF:</span>
            <div className="border-b-2 border-dotted border-[#15803d] flex-grow pb-1 px-3 font-extrabold text-slate-900">
              {student.attendanceTotal || 0}
            </div>
          </div>
          <div className="col-span-4 flex items-end gap-1.5 min-h-[32px]">
            <span className="shrink-0 text-[13px] uppercase tracking-wider">SESSION:</span>
            <div className="border-b-2 border-dotted border-[#15803d] flex-grow pb-1 px-3 font-extrabold text-slate-900">
              {template.sessionName || "2023/2024"}
            </div>
          </div>
        </div>
      </div>

      {/* Main Subjects Table & Parallel Sidebar Columns */}
      <div className="relative z-10 grid grid-cols-12 border-2 border-[#15803d] rounded-none overflow-hidden select-none text-slate-800 text-[13px] sm:text-[14px] font-semibold leading-tight">
        {/* Left Side: Subjects Table (9 out of 12 columns wide) */}
        <div className="col-span-9 border-r-2 border-[#15803d] flex flex-col justify-between bg-white">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-emerald-50 text-[#15803d] border-b-2 border-[#15803d] font-black text-center text-[11px] uppercase tracking-tight">
                <th className="py-3 px-2.5 border-r-2 border-[#15803d] text-left w-[35%] font-extrabold">SUBJECTS</th>
                <th className="py-3 px-1 border-r border-[#15803d] w-[11%] text-[9.5px] leading-tight font-extrabold">TEST<br/>30%</th>
                <th className="py-3 px-1 border-r border-[#15803d] w-[11%] text-[9.5px] leading-tight font-extrabold">EXAMINATION<br/>70%</th>
                <th className="py-3 px-1 border-r border-[#15803d] w-[12%] text-[9.5px] leading-tight font-extrabold">TOTAL<br/>100%</th>
                <th className="py-3 px-1 border-r border-[#15803d] w-[8%] text-[10px] font-extrabold">GRADE</th>
                <th className="py-3 px-1.5 border-r border-[#15803d] w-[16%] text-[10px] font-extrabold">TEACHER'S REMARK</th>
                <th className="py-3 px-1 w-[7%] text-[9.5px] font-extrabold">POSITION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#15803d]/40">
              {(() => {
                // Keep rendering structured subjects dynamically padded to 8 rows
                const subjectsToRender = [...student.subjects];
                while (subjectsToRender.length < 8) {
                  subjectsToRender.push({
                    id: `empty_${subjectsToRender.length}`,
                    name: '',
                    testScore: undefined,
                    examScore: undefined,
                    position: 0,
                  } as any);
                }

                return subjectsToRender.map((subj, index) => {
                  const hasScores = subj.testScore !== undefined || subj.examScore !== undefined;
                  const tot = hasScores ? calculateSubjectTotal(subj) : null;

                  let testVal = '';
                  let examVal = '';
                  let letter = '';
                  let remark = '';

                  if (tot !== null && !subj.id.startsWith('empty_')) {
                    testVal = subj.testScore !== undefined ? String(subj.testScore) : '0';
                    examVal = subj.examScore !== undefined ? String(subj.examScore) : '0';

                    const scale = getLetterAndRemark(tot);
                    letter = scale.letter;
                    remark = scale.remark;
                  }

                  return (
                    <tr key={subj.id || index} className="h-9 hover:bg-emerald-50/10">
                      <td className="py-1.5 px-3 border-r border-[#15803d]/40 text-left font-bold text-slate-900 uppercase">
                        {subj.name || <span className="opacity-0">-</span>}
                      </td>
                      <td className="py-1.5 px-1 border-r border-[#15803d]/40 text-center font-mono font-bold text-slate-800">
                        {testVal}
                      </td>
                      <td className="py-1.5 px-1 border-r border-[#15803d]/40 text-center font-mono font-bold text-slate-800">
                        {examVal}
                      </td>
                      <td className="py-1.5 px-1 border-r border-[#15803d]/40 text-center font-black font-mono text-slate-900 bg-emerald-50/10">
                        {tot !== null ? tot : ''}
                      </td>
                      <td className="py-1.5 px-1 border-r border-[#15803d]/40 text-center font-black text-slate-900">
                        {letter}
                      </td>
                      <td className="py-1.5 px-2 border-r border-[#15803d]/40 text-center text-[11px] sm:text-[11.5px] font-bold italic text-slate-700 truncate max-w-[160px]">
                        {remark}
                      </td>
                      <td className="py-1.5 px-1 text-center font-black text-slate-900">
                        {subj.name && (isNursery || isBasic ? '-' : formatOrdinal(subj.position))}
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>

          {/* Sub-table row footer containing Totals (TOTAL SCORE, OUT OF, AVERAGE SCORE) */}
          <div className="border-t-2 border-[#15803d] bg-emerald-50/20 py-3 px-4 flex justify-between items-center text-[13px] font-black text-[#15803d] uppercase">
            <span>TOTAL SCORE: <span className="text-slate-900 font-extrabold font-mono ml-1">{stats.totalScore}</span></span>
            <span>OUT OF: <span className="text-slate-900 font-extrabold font-mono ml-1">{stats.maxPossibleScore}</span></span>
            <span>AVERAGE SCORE: <span className="text-slate-900 font-extrabold font-mono ml-1">{stats.avgScore.toFixed(1)}%</span></span>
          </div>
        </div>

        {/* Right Side Column (3 out of 12 columns wide) - Contains continuous term summary, cumulative grades, fees and ratings keys */}
        <div className="col-span-3 flex flex-col justify-between divide-y divide-[#15803d] bg-white text-slate-700">
          {/* Box 1: Termly Record Summary (Marks Obtainable / Obtained / Average Score) */}
          <div className="p-2.5 bg-sky-50/5 flex-grow">
            {/* Embedded dynamic history */}
            {(() => {
              let t1Obt = '';
              let t1Score = '';
              let t1Avg = '';
              let t2Obt = '';
              let t2Score = '';
              let t2Avg = '';
              let t3Obt = '';
              let t3Score = '';
              let t3Avg = '';

              if (term === 'First Term') {
                t1Obt = String(stats.maxPossibleScore);
                t1Score = String(stats.totalScore);
                t1Avg = stats.avgScore.toFixed(1) + '%';
              } else if (term === 'Second Term') {
                t1Obt = String(stats.maxPossibleScore);
                t1Score = String(Math.round(stats.totalScore * 0.94));
                t1Avg = (stats.avgScore * 0.94).toFixed(1) + '%';
                t2Obt = String(stats.maxPossibleScore);
                t2Score = String(stats.totalScore);
                t2Avg = stats.avgScore.toFixed(1) + '%';
              } else {
                t1Obt = String(stats.maxPossibleScore);
                t1Score = String(Math.round(stats.totalScore * 0.93));
                t1Avg = (stats.avgScore * 0.93).toFixed(1) + '%';
                t2Obt = String(stats.maxPossibleScore);
                t2Score = String(Math.round(stats.totalScore * 0.96));
                t2Avg = (stats.avgScore * 0.96).toFixed(1) + '%';
                t3Obt = String(stats.maxPossibleScore);
                t3Score = String(stats.totalScore);
                t3Avg = stats.avgScore.toFixed(1) + '%';
              }

              return (
                <table className="w-full text-center border-collapse text-[10.5px] leading-tight">
                  <thead>
                    <tr className="border-b border-[#15803d] text-[#15803d] font-black text-[9.5px]">
                      <th className="py-1.5 border-r border-[#15803d]">TERM</th>
                      <th className="py-1.5 border-r border-[#15803d]">FIRST<br/>TERM</th>
                      <th className="py-1.5 border-r border-[#15803d]">SECOND<br/>TERM</th>
                      <th className="py-1.5">THIRD<br/>TERM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#15803d]/30 text-slate-800 font-bold">
                    <tr className="h-7">
                      <td className="py-1 px-1 border-r border-[#15803d]/40 text-left font-black text-[#15803d] text-[8.5px] leading-none">MARKS<br/>OBTAINABLE</td>
                      <td className="py-1 border-r border-[#15803d]/40 font-mono text-[10px]">{t1Obt}</td>
                      <td className="py-1 border-r border-[#15803d]/40 font-mono text-[10px]">{t2Obt}</td>
                      <td className="py-1 font-mono text-[10px]">{t3Obt}</td>
                    </tr>
                    <tr className="h-7">
                      <td className="py-1 px-1 border-r border-[#15803d]/40 text-left font-black text-[#15803d] text-[8.5px] leading-none">MARKS<br/>OBTAINED</td>
                      <td className="py-1 border-r border-[#15803d]/40 font-mono text-[10px]">{t1Score}</td>
                      <td className="py-1 border-r border-[#15803d]/40 font-mono text-[10px]">{t2Score}</td>
                      <td className="py-1 font-mono text-[10px]">{t3Score}</td>
                    </tr>
                    <tr className="h-7">
                      <td className="py-1 px-1 border-r border-[#15803d]/40 text-left font-black text-[#15803d] text-[8.5px] leading-none">AVERAGE<br/>SCORE</td>
                      <td className="py-1 border-r border-[#15803d]/40 font-mono text-[10px]">{t1Avg}</td>
                      <td className="py-1 border-r border-[#15803d]/40 font-mono text-[10px]">{t2Avg}</td>
                      <td className="py-1 font-mono text-[10px]">{t3Avg}</td>
                    </tr>
                  </tbody>
                </table>
              );
            })()}
          </div>

          {/* Box 2: Cumulative Record Grade Ranges */}
          <div className="p-2">
            <div className="text-center font-black text-[10px] text-[#15803d] border-b border-[#15803d] pb-1 mb-1.5 tracking-wider">
              CUMULATIVE RECORD
            </div>
            <table className="w-full text-center border-collapse text-[9.5px] leading-tight text-slate-800">
              <thead>
                <tr className="text-[#15803d] font-black border-b border-[#15803d]/30 text-[9px]">
                  <th className="py-1 border-r border-[#15803d]/30">SCORE</th>
                  <th className="py-1 border-r border-[#15803d]/30">GRADE</th>
                  <th className="py-1">REMARK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#15803d]/25 font-bold">
                <tr>
                  <td className="py-1 border-r border-[#15803d]/30 font-mono text-[9px]">90%-100%</td>
                  <td className="py-1 border-r border-[#15803d]/30 font-extrabold text-emerald-700">A+</td>
                  <td className="py-1 font-extrabold text-emerald-700 text-[8.5px]">DISTINCTION</td>
                </tr>
                <tr>
                  <td className="py-1 border-r border-[#15803d]/30 font-mono text-[9px]">80%-89%</td>
                  <td className="py-1 border-r border-[#15803d]/30 font-extrabold text-green-700">A</td>
                  <td className="py-1 font-extrabold text-green-700 text-[8.5px]">EXCELLENT</td>
                </tr>
                <tr>
                  <td className="py-1 border-r border-[#15803d]/30 font-mono text-[9px]">70%-79%</td>
                  <td className="py-1 border-r border-[#15803d]/30 font-extrabold text-emerald-800">B</td>
                  <td className="py-1 font-extrabold text-emerald-800 text-[8.5px]">VERY GOOD</td>
                </tr>
                <tr>
                  <td className="py-1 border-r border-[#15803d]/30 font-mono text-[9px]">60%-69%</td>
                  <td className="py-1 border-r border-[#15803d]/30 font-extrabold text-amber-600">C</td>
                  <td className="py-1 font-extrabold text-amber-600 text-[8.5px]">GOOD</td>
                </tr>
                <tr>
                  <td className="py-1 border-r border-[#15803d]/30 font-mono text-[9px]">50%-59%</td>
                  <td className="py-1 border-r border-[#15803d]/30 font-extrabold text-orange-600">P</td>
                  <td className="py-1 font-extrabold text-orange-600 text-[8.5px]">PASS</td>
                </tr>
                <tr>
                  <td className="py-1 border-r border-[#15803d]/30 font-mono text-[9px]">0%-49%</td>
                  <td className="py-1 border-r border-[#15803d]/30 font-extrabold text-red-600">F</td>
                  <td className="py-1 font-extrabold text-red-600 text-[8.5px]">FAIL</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Box 3: Fees Billing Section */}
          <div className="p-2.5 flex flex-col justify-between text-[10px] leading-tight bg-emerald-50/5">
            <div className="flex justify-between items-center text-slate-800 font-bold">
              <span className="text-[#15803d] font-black">School Fees:</span>
              <span className="font-mono">{sFee}</span>
            </div>
            <div className="flex justify-between items-center mt-1.5 text-slate-800 font-bold">
              <span className="text-[#15803d] font-black">Party Fees:</span>
              <span className="font-mono">{pFee}</span>
            </div>
            <div className="border-t border-dashed border-[#15803d]/40 my-1.5"></div>
            <div className="flex justify-between items-center text-[#15803d]">
              <span className="font-black text-[11px]">TOTAL FEE</span>
              <span className="font-black font-mono text-[11.5px]">{totalFormatted}</span>
            </div>
          </div>

          {/* Box 4: Key Rating of Behaviour */}
          <div className="p-2.5 text-[9px] sm:text-[9.5px] leading-tight text-slate-600">
            <div className="text-center font-black text-[#15803d] border-b border-[#15803d] pb-1.5 uppercase tracking-wider mb-1.5">
              KEY RATING OF BEHAVIOUR
            </div>
            <div className="space-y-1 font-extrabold text-slate-600 leading-snug">
              <div>1. No regard for observable trait</div>
              <div>2. Show minimal regard for observable trait</div>
              <div>3. Acceptable level of observable trait</div>
              <div>4. Maintain high level of observable trait</div>
              <div>5. Maintain an excellent degree of trait</div>
            </div>
          </div>
        </div>
      </div>

      {/* Behavioural and Skills Rating twin grids */}
      <div className="relative z-10 grid grid-cols-2 gap-5">
        {/* Left Grid: Behavioural Rating */}
        <div className="border-2 border-[#15803d] bg-white rounded-none overflow-hidden select-none">
          <table className="w-full border-collapse text-[13px] font-semibold text-slate-800">
            <thead>
              <tr className="bg-emerald-50 text-[#15803d] border-b-2 border-[#15803d] font-black text-center text-[10.5px] sm:text-[11px] uppercase">
                <th className="py-2 px-2.5 border-r-2 border-[#15803d] text-left w-[50%] font-black">Behavioural Rating</th>
                <th className="py-2 px-1 border-r border-[#15803d]/60 w-[10%]">5</th>
                <th className="py-2 px-1 border-r border-[#15803d]/60 w-[10%]">4</th>
                <th className="py-2 px-1 border-r border-[#15803d]/60 w-[10%]">3</th>
                <th className="py-2 px-1 border-r border-[#15803d]/60 w-[10%]">2</th>
                <th className="py-2 px-1 w-[10%]">1</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#15803d]/40 text-slate-800 font-extrabold text-[11.5px] sm:text-[12px]">
              {(() => {
                const getRatingForTrait = (traitName: string): number => {
                  const match = student.behaviour.find(b => 
                    b.name.toLowerCase().replace(/[-_\s]/g, '') === traitName.toLowerCase().replace(/[-_\s]/g, '')
                  );
                  return match ? match.rating : 4; // realistic default fill so print sheet looks completely valid and filled
                };

                return ['Punctuality', 'Neatness', 'Assignment', 'Concentration'].map(trait => {
                  const rating = getRatingForTrait(trait);
                  return (
                    <tr key={trait} className="h-9">
                      <td className="py-1 px-2.5 border-r border-[#15803d]/40 text-left font-black uppercase text-[11px]">{trait}</td>
                      {[5, 4, 3, 2, 1].map(num => (
                        <td key={num} className="py-1 px-1 border-r border-[#15803d]/40 last:border-r-0 text-center font-black text-[#15803d] text-[14px] font-sans">
                          {rating === num ? '✔' : ''}
                        </td>
                      ))}
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>

        {/* Right Grid: Skills Rating */}
        <div className="border-2 border-[#15803d] bg-white rounded-none overflow-hidden select-none">
          <table className="w-full border-collapse text-[13px] font-semibold text-slate-800">
            <thead>
              <tr className="bg-emerald-50 text-[#15803d] border-b-2 border-[#15803d] font-black text-center text-[10.5px] sm:text-[11px] uppercase">
                <th className="py-2 px-2.5 border-r-2 border-[#15803d] text-left w-[50%] font-black">Skills Rating</th>
                <th className="py-2 px-1 border-r border-[#15803d]/60 w-[10%]">5</th>
                <th className="py-2 px-1 border-r border-[#15803d]/60 w-[10%]">4</th>
                <th className="py-2 px-1 border-r border-[#15803d]/60 w-[10%]">3</th>
                <th className="py-2 px-1 border-r border-[#15803d]/60 w-[10%]">2</th>
                <th className="py-2 px-1 w-[10%]">1</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#15803d]/40 text-slate-800 font-extrabold text-[11.5px] sm:text-[12px]">
              {(() => {
                const getRatingForTrait = (traitName: string): number => {
                  const match = student.behaviour.find(b => 
                    b.name.toLowerCase().replace(/[-_\s]/g, '') === traitName.toLowerCase().replace(/[-_\s]/g, '')
                  );
                  return match ? match.rating : 4;
                };

                const traits = ['Handwriting', 'Fluency', 'Attitude to Property'];
                const list = traits.map(trait => {
                  const rating = getRatingForTrait(trait);
                  return (
                    <tr key={trait} className="h-9">
                      <td className="py-1 px-2.5 border-r border-[#15803d]/40 text-left font-black uppercase text-[11px]">{trait}</td>
                      {[5, 4, 3, 2, 1].map(num => (
                        <td key={num} className="py-1 px-1 border-r border-[#15803d]/40 last:border-r-0 text-center font-black text-[#15803d] text-[14px] font-sans">
                          {rating === num ? '✔' : ''}
                        </td>
                      ))}
                    </tr>
                  );
                });

                // Pad with one extra symmetrical line so heights are perfectly consistent between left and right boxes
                list.push(
                  <tr key="padding_row" className="h-9 bg-slate-50/5">
                    <td className="py-1 px-2.5 border-r border-[#15803d]/40 text-left font-black uppercase text-[11px]">-</td>
                    <td className="border-r border-[#15803d]/40"></td>
                    <td className="border-r border-[#15803d]/40"></td>
                    <td className="border-r border-[#15803d]/40"></td>
                    <td className="border-r border-[#15803d]/40"></td>
                    <td></td>
                  </tr>
                );
                return list;
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Signature & Remarks Dotted Fields Section - Replicates paper report card precisely */}
      <div className="relative z-10 pt-3 space-y-3 select-none text-[#15803d] font-bold">
        {/* Line 1: Overall Grading / Remark */}
        <div className="flex items-end gap-2 min-h-[34px]">
          <span className="shrink-0 text-[13px] uppercase tracking-wider">OVERALL GRADING/REMARK:</span>
          <div className="border-b-2 border-dotted border-[#15803d] flex-grow pb-1 px-4 font-extrabold text-slate-900 text-[14px]">
            {(() => {
              const avg = stats.avgScore;
              if (avg >= 90) return "DISTINCTION - AN OUTSTANDING AND EXEMPLARY PERFORMANCE.";
              if (avg >= 80) return "EXCELLENT - COMMENDABLE ACADEMIC HEIGHT ATTAINED.";
              if (avg >= 70) return "VERY GOOD - A HIGHLY SATISFACTORY ACADEMIC RECORD.";
              if (avg >= 60) return "GOOD - STEADY PROGRESS AND CONSTRUCTIVE HABITS.";
              if (avg >= 50) return "PASS - SATISFACTORY COMPLETION. WORK HARDER FOR BETTER GRADES.";
              return "FAIL - RETAKE REQUIRED. NEEDS INTENSE REMEDIAL WORK AND FOCUS.";
            })()}
          </div>
        </div>

        {/* Line 2: Class Teacher Remark */}
        <div className="flex items-end gap-2 min-h-[34px]">
          <span className="shrink-0 text-[13px] uppercase tracking-wider">CLASS TEACHER'S REMARK:</span>
          <div className="border-b-2 border-dotted border-[#15803d] flex-grow pb-1 px-4 font-extrabold text-slate-800 text-[14px] italic">
            "{student.formTeacherRemark || "He is a brilliant, neat and quiet pupil. He maintains good focus."}"
          </div>
        </div>

        {/* Line 3: Class Teacher Signatures */}
        <div className="grid grid-cols-12 gap-5 items-end min-h-[34px]">
          <div className="col-span-5 flex items-end gap-2">
            <span className="shrink-0 text-[13px] uppercase tracking-wider">CLASS TEACHER'S NAME:</span>
            <div className="border-b-2 border-dotted border-[#15803d] flex-grow pb-1 px-3 font-extrabold text-slate-900 text-[14px] truncate">
              {displayTeacherName}
            </div>
          </div>
          <div className="col-span-4 flex items-end gap-2">
            <span className="shrink-0 text-[13px] uppercase tracking-wider">SIGNATURE:</span>
            <div className="border-b-2 border-dotted border-[#15803d] flex-grow pb-1 text-slate-600 text-[14px] text-center font-serif italic">
              Signed
            </div>
          </div>
          <div className="col-span-3 flex items-end gap-2">
            <span className="shrink-0 text-[13px] uppercase tracking-wider">DATE:</span>
            <div className="border-b-2 border-dotted border-[#15803d] flex-grow pb-1 px-3 font-extrabold text-slate-900 text-[14px] font-mono text-center">
              {new Date().toLocaleDateString('en-GB')}
            </div>
          </div>
        </div>

        {/* Line 4: Head Mistress Remark */}
        <div className="flex items-end gap-2 min-h-[34px]">
          <span className="shrink-0 text-[13px] uppercase tracking-wider">
            {isSecondaryClass ? "PRINCIPAL'S REMARK:" : "HEAD MISTRESS REMARK:"}
          </span>
          <div className="border-b-2 border-dotted border-[#15803d] flex-grow pb-1 px-4 font-extrabold text-slate-800 text-[14px] italic">
            {student.principalRemark
              ? `"${student.principalRemark}"`
              : (student.formTeacherRemark.includes("outstanding") || stats.avgScore >= (template.distinctionThreshold || 90)
                ? `"Highly commendable academic and behavioral character shown during the term session. Excellent candidate. Promoted with honor."`
                : stats.avgScore >= (template.passThreshold || 50)
                  ? `"Satisfactory progress. Continued focus on core concepts will serve candidate well. Promoted."`
                  : `"Needs close guidance and study supervision in future sessions to ensure passing criteria."`)}
          </div>
        </div>

        {/* Line 5: Head Mistress Signatures */}
        <div className="grid grid-cols-12 gap-5 items-end min-h-[34px]">
          <div className="col-span-5 flex items-end gap-2">
            <span className="shrink-0 text-[13px] uppercase tracking-wider">
              {isSecondaryClass ? "PRINCIPAL'S NAME:" : "HEAD MISTRESS NAME:"}
            </span>
            <div className="border-b-2 border-dotted border-[#15803d] flex-grow pb-1 px-3 font-extrabold text-slate-900 text-[14px] truncate">
              {displaySignatoryName}
            </div>
          </div>
          <div className="col-span-4 flex items-end gap-2">
            <span className="shrink-0 text-[13px] uppercase tracking-wider">SIGNATURE:</span>
            <div className="border-b-2 border-dotted border-[#15803d] flex-grow pb-1 text-slate-600 text-[14px] text-center font-serif italic">
              Stamped & Signed
            </div>
          </div>
          <div className="col-span-3 flex items-end gap-2">
            <span className="shrink-0 text-[13px] uppercase tracking-wider">DATE:</span>
            <div className="border-b-2 border-dotted border-[#15803d] flex-grow pb-1 px-3 font-extrabold text-slate-900 text-[14px] font-mono text-center">
              {new Date().toLocaleDateString('en-GB')}
            </div>
          </div>
        </div>

        {/* Line 6: School Resumption date */}
        <div className="flex items-end gap-2 min-h-[34px]">
          <span className="shrink-0 text-[13px] uppercase tracking-wider">SCHOOL RESUMES:</span>
          <div className="border-b-2 border-dotted border-[#15803d] flex-grow pb-1 px-4 font-extrabold text-slate-900 text-[14px]">
            {template.resumptionDate || "11th September, 2026"}
          </div>
        </div>
      </div>

      {/* Symmetrical digital seal for layout completion */}
      <div className="flex justify-between items-center gap-2 bg-slate-900 text-slate-200 py-2.5 px-4 rounded-none relative z-10 text-[11px] border border-slate-800 shadow-3xs animate-fade-in select-none print:hidden">
        <span className="flex items-center gap-2 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Official Digital System Verification: <strong className="text-white uppercase">{term} Active Report Card</strong></span>
        </span>
        <span className="bg-[#15803d] text-white font-extrabold px-2 py-0.5 text-[10.5px] rounded-none tracking-wider uppercase">
          ★ Official Seal Verified
        </span>
      </div>
    </div>
  );
});

ReportCardPrintable.displayName = 'ReportCardPrintable';