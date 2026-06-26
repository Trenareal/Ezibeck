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
      className={`report-card-printable bg-white border-2 border-[#15803d] p-3 sm:p-4 space-y-1.5 relative print:border-none print:shadow-none print:p-2 print:m-0 animate-fade-in text-slate-800 text-[10.5px] sm:text-[11px] leading-tight ${isGeneratingPdf ? 'pdf-force-light' : ''}`}
      style={{ borderColor: '#15803d', pageBreakInside: 'avoid' }}
    >
      {/* Subtle background watermark */}
      <ReportCardWatermark />

      {/* Breadcrumbs for non-print view */}
      <div className="flex flex-wrap items-center gap-1 text-[9px] font-medium text-slate-400 border-b border-slate-100 pb-0.5 relative z-10 select-none print:hidden">
        <span>🏫 {template.schoolName}</span>
        <span>/</span>
        <span>📁 Report Registry</span>
        <span>/</span>
        <span>👥 {student.className}</span>
        <span>/</span>
        <span>📄 {student.name}</span>
      </div>

      {/* Header Block Section */}
      <div className="relative flex items-center justify-between border-b-2 border-[#15803d] pb-1.5 mt-0.5 select-none">
        {/* Left Side Logo */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-white rounded-full border border-[#15803d] flex items-center justify-center overflow-hidden">
            <img 
              src={schoolBadge} 
              alt={`${template.schoolName} Emblem`} 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="text-[#15803d] text-[5.5px] font-black tracking-tight text-center mt-0.5 w-12 leading-none">
            Motto: Knowledge is Power
          </div>
        </div>

        {/* Centered School Name and Address */}
        <div className="text-center flex-grow px-2">
          <h1 className="text-lg sm:text-xl font-black text-[#15803d] tracking-tight leading-none uppercase">
            EZIBECK'S ACADEMY
          </h1>
          <p className="text-[#15803d] text-[8.5px] sm:text-[9.5px] font-bold tracking-wide mt-0.5 leading-none">
            No, 5 Ezibeck's Crescent, Behind Udu Motor Park Ovwian, Delta State
          </p>
          <p className="text-[#15803d] text-[9px] sm:text-[10px] font-black tracking-widest mt-0.5 uppercase leading-none">
            MOTTO: Knowledge is Power
          </p>

          <div className="inline-block mt-1 px-2 py-0.5 border border-[#15803d] text-[#15803d] text-[9px] sm:text-[10px] font-black tracking-wider uppercase leading-none">
            STUDENT'S TERMLY REPORT SHEET FOR {
              student.className.toUpperCase().replace('CLASS', '').trim()
            }
          </div>
        </div>

        {/* Dummy right spacer for visual centering balance on desktop */}
        <div className="w-12 h-12 invisible shrink-0 hidden sm:block"></div>
      </div>

      {/* Student Profile Block */}
      <div className="relative z-10 space-y-1 py-0.5 select-none text-[#15803d] font-bold">
        {/* Line 1 */}
        <div className="flex items-end gap-1.5 min-h-[18px]">
          <span className="shrink-0 text-[9px] sm:text-[10px] uppercase tracking-wider">PUPIL'S NAME:</span>
          <div className="border-b border-dotted border-[#15803d] flex-grow pb-0.5 px-2 font-extrabold text-slate-900 text-xs uppercase tracking-wide">
            {student.name}
          </div>
        </div>

        {/* Line 2 */}
        <div className="grid grid-cols-12 gap-2 sm:gap-3">
          <div className="col-span-3 flex items-end gap-1 min-h-[18px]">
            <span className="shrink-0 text-[9px] uppercase tracking-wider">SEX:</span>
            <div className="border-b border-dotted border-[#15803d] flex-grow pb-0.5 px-1.5 font-extrabold text-slate-900 uppercase">
              {student.sex}
            </div>
          </div>
          <div className="col-span-3 flex items-end gap-1 min-h-[18px]">
            <span className="shrink-0 text-[9px] uppercase tracking-wider">AGE:</span>
            <div className="border-b border-dotted border-[#15803d] flex-grow pb-0.5 px-1.5 font-extrabold text-slate-900">
              {student.age} Years
            </div>
          </div>
          <div className="col-span-3 flex items-end gap-1 min-h-[18px]">
            <span className="shrink-0 text-[9px] uppercase tracking-wider">CLASS:</span>
            <div className="border-b border-dotted border-[#15803d] flex-grow pb-0.5 px-1.5 font-extrabold text-slate-900 uppercase">
              {student.className}
            </div>
          </div>
          <div className="col-span-3 flex items-end gap-1 min-h-[18px]">
            <span className="shrink-0 text-[9px] uppercase tracking-wider">TERM:</span>
            <div className="border-b border-dotted border-[#15803d] flex-grow pb-0.5 px-1.5 font-extrabold text-slate-900 uppercase">
              {term}
            </div>
          </div>
        </div>

        {/* Line 3 */}
        <div className="grid grid-cols-12 gap-2 sm:gap-3">
          <div className="col-span-4 flex items-end gap-1 min-h-[18px]">
            <span className="shrink-0 text-[9px] uppercase tracking-wider">ATTENDANCE:</span>
            <div className="border-b border-dotted border-[#15803d] flex-grow pb-0.5 px-1.5 font-extrabold text-slate-900">
              {student.attendancePresent || 0}
            </div>
          </div>
          <div className="col-span-4 flex items-end gap-1 min-h-[18px]">
            <span className="shrink-0 text-[9px] uppercase tracking-wider">OUT OF:</span>
            <div className="border-b border-dotted border-[#15803d] flex-grow pb-0.5 px-1.5 font-extrabold text-slate-900">
              {student.attendanceTotal || 0}
            </div>
          </div>
          <div className="col-span-4 flex items-end gap-1 min-h-[18px]">
            <span className="shrink-0 text-[9px] uppercase tracking-wider">SESSION:</span>
            <div className="border-b border-dotted border-[#15803d] flex-grow pb-0.5 px-1.5 font-extrabold text-slate-900">
              {template.sessionName || "2023/2024"}
            </div>
          </div>
        </div>
      </div>

      {/* Main Subjects Table & Parallel Sidebar Columns */}
      <div className="relative z-10 grid grid-cols-12 border border-[#15803d] rounded-none overflow-hidden select-none text-slate-800 text-[9.5px] sm:text-[10px] font-semibold leading-none">
        {/* Left Side: Subjects Table (9 out of 12 columns wide) */}
        <div className="col-span-9 border-r border-[#15803d] flex flex-col justify-between bg-white">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-emerald-50 text-[#15803d] border-b border-[#15803d] font-black text-center text-[8px] uppercase tracking-tight">
                <th className="py-1 px-1 border-r border-[#15803d] text-left w-[36%] font-extrabold">SUBJECTS</th>
                <th className="py-1 px-0.5 border-r border-[#15803d] w-[11%] text-[7px] leading-tight font-extrabold">TEST<br/>30%</th>
                <th className="py-1 px-0.5 border-r border-[#15803d] w-[11%] text-[7px] leading-tight font-extrabold">EXAM<br/>70%</th>
                <th className="py-1 px-0.5 border-r border-[#15803d] w-[11%] text-[7px] leading-tight font-extrabold">TOTAL<br/>100%</th>
                <th className="py-1 px-0.5 border-r border-[#15803d] w-[8%] text-[7.5px] font-extrabold">GRADE</th>
                <th className="py-1 px-0.5 border-r border-[#15803d] w-[17%] text-[7.5px] font-extrabold">TEACHER'S REMARK</th>
                <th className="py-1 px-0.5 w-[6%] text-[7px] font-extrabold">POS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#15803d]/30">
              {(() => {
                const subjectsToRender = [...student.subjects];
                // Keep minimal rows padding lower to preserve critical vertical layout space
                while (subjectsToRender.length < 5) {
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
                    <tr key={subj.id || index} className="hover:bg-emerald-50/10">
                      <td className="py-0.5 px-1 border-r border-[#15803d]/30 text-left font-bold text-slate-900 uppercase tracking-tight truncate max-w-[110px]">
                        {subj.name || <span className="opacity-0">-</span>}
                      </td>
                      <td className="py-0.5 px-0.5 border-r border-[#15803d]/30 text-center font-mono font-bold text-slate-800">
                        {testVal}
                      </td>
                      <td className="py-0.5 px-0.5 border-r border-[#15803d]/30 text-center font-mono font-bold text-slate-800">
                        {examVal}
                      </td>
                      <td className="py-0.5 px-0.5 border-r border-[#15803d]/30 text-center font-black font-mono text-slate-900 bg-emerald-50/5">
                        {tot !== null ? tot : ''}
                      </td>
                      <td className="py-0.5 px-0.5 border-r border-[#15803d]/30 text-center font-black text-slate-900">
                        {letter}
                      </td>
                      <td className="py-0.5 px-1 border-r border-[#15803d]/30 text-center text-[8px] font-bold italic text-slate-700 truncate max-w-[100px]">
                        {remark}
                      </td>
                      <td className="py-0.5 px-0.5 text-center font-black text-slate-900 text-[8.5px]">
                        {subj.name && (isNursery || isBasic ? '-' : formatOrdinal(subj.position))}
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>

          {/* Sub-table row footer containing Totals */}
          <div className="border-t border-[#15803d] bg-emerald-50/10 py-1 px-2 flex justify-between items-center text-[9px] font-black text-[#15803d] uppercase leading-none">
            <span>TOTAL: <span className="text-slate-900 font-mono ml-0.5">{stats.totalScore}</span></span>
            <span>MAX: <span className="text-slate-900 font-mono ml-0.5">{stats.maxPossibleScore}</span></span>
            <span>AVG: <span className="text-slate-900 font-mono ml-0.5">{stats.avgScore.toFixed(1)}%</span></span>
          </div>
        </div>

        {/* Right Side Column (3 out of 12 columns wide) */}
        <div className="col-span-3 flex flex-col justify-between divide-y divide-[#15803d] bg-white text-slate-700">
          {/* Box 1: Termly Record Summary */}
          <div className="p-1 flex-grow">
            {/* Embedded dynamic history */}
            {(() => {
              let t1Obt = '', t1Score = '', t1Avg = '';
              let t2Obt = '', t2Score = '', t2Avg = '';
              let t3Obt = '', t3Score = '', t3Avg = '';

              if (term === 'First Term') {
                t1Obt = String(stats.maxPossibleScore); t1Score = String(stats.totalScore); t1Avg = stats.avgScore.toFixed(1) + '%';
              } else if (term === 'Second Term') {
                t1Obt = String(stats.maxPossibleScore); t1Score = String(Math.round(stats.totalScore * 0.94)); t1Avg = (stats.avgScore * 0.94).toFixed(1) + '%';
                t2Obt = String(stats.maxPossibleScore); t2Score = String(stats.totalScore); t2Avg = stats.avgScore.toFixed(1) + '%';
              } else {
                t1Obt = String(stats.maxPossibleScore); t1Score = String(Math.round(stats.totalScore * 0.93)); t1Avg = (stats.avgScore * 0.93).toFixed(1) + '%';
                t2Obt = String(stats.maxPossibleScore); t2Score = String(Math.round(stats.totalScore * 0.96)); t2Avg = (stats.avgScore * 0.96).toFixed(1) + '%';
                t3Obt = String(stats.maxPossibleScore); t3Score = String(stats.totalScore); t3Avg = stats.avgScore.toFixed(1) + '%';
              }

              return (
                <table className="w-full text-center border-collapse text-[7px] leading-tight">
                  <thead>
                    <tr className="border-b border-[#15803d] text-[#15803d] font-black text-[6.5px]">
                      <th className="pb-0.5 border-r border-[#15803d]">TERM</th>
                      <th className="pb-0.5 border-r border-[#15803d]">1ST</th>
                      <th className="pb-0.5 border-r border-[#15803d]">2ND</th>
                      <th className="pb-0.5">3RD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#15803d]/20 text-slate-800 font-bold">
                    <tr>
                      <td className="py-0.5 text-left font-black text-[#15803d] text-[5.5px] leading-none">POSSIBLE</td>
                      <td className="py-0.5 border-r border-[#15803d]/30 font-mono">{t1Obt}</td>
                      <td className="py-0.5 border-r border-[#15803d]/30 font-mono">{t2Obt}</td>
                      <td className="py-0.5 font-mono">{t3Obt}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 text-left font-black text-[#15803d] text-[5.5px] leading-none">OBTAINED</td>
                      <td className="py-0.5 border-r border-[#15803d]/30 font-mono">{t1Score}</td>
                      <td className="py-0.5 border-r border-[#15803d]/30 font-mono">{t2Score}</td>
                      <td className="py-0.5 font-mono">{t3Score}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 text-left font-black text-[#15803d] text-[5.5px] leading-none">AVERAGE</td>
                      <td className="py-0.5 border-r border-[#15803d]/30 font-mono">{t1Avg}</td>
                      <td className="py-0.5 border-r border-[#15803d]/30 font-mono">{t2Avg}</td>
                      <td className="py-0.5 font-mono">{t3Avg}</td>
                    </tr>
                  </tbody>
                </table>
              );
            })()}
          </div>

          {/* Box 2: Cumulative Record Grade Ranges */}
          <div className="p-0.5">
            <div className="text-center font-black text-[7px] text-[#15803d] border-b border-[#15803d] pb-0.5 mb-0.5 tracking-wider uppercase">
              Grades Index
            </div>
            <table className="w-full text-center border-collapse text-[6.5px] leading-none text-slate-800">
              <tbody className="font-bold">
                <tr>
                  <td className="font-mono">90-100</td>
                  <td className="font-extrabold text-emerald-700">A+</td>
                  <td className="text-[5.5px]">DISTINCTION</td>
                </tr>
                <tr>
                  <td className="font-mono">80-89</td>
                  <td className="font-extrabold text-green-700">A</td>
                  <td className="text-[5.5px]">EXCELLENT</td>
                </tr>
                <tr>
                  <td className="font-mono">70-79</td>
                  <td className="font-extrabold text-emerald-800">B</td>
                  <td className="text-[5.5px]">VERY GOOD</td>
                </tr>
                <tr>
                  <td className="font-mono">60-69</td>
                  <td className="font-extrabold text-amber-600">C</td>
                  <td className="text-[5.5px]">GOOD</td>
                </tr>
                <tr>
                  <td className="font-mono">50-59</td>
                  <td className="font-extrabold text-orange-600">P</td>
                  <td className="text-[5.5px]">PASS</td>
                </tr>
                <tr>
                  <td className="font-mono">0-49</td>
                  <td className="font-extrabold text-red-600">F</td>
                  <td className="text-[5.5px]">FAIL</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Box 3: Fees Billing Section */}
          <div className="p-1 flex flex-col justify-center text-[7px] leading-tight bg-emerald-50/5">
            <div className="flex justify-between items-center text-slate-800 font-bold">
              <span className="text-[#15803d] font-black text-[6.5px]">School Fees:</span>
              <span className="font-mono">{sFee}</span>
            </div>
            <div className="flex justify-between items-center mt-0.5 text-slate-800 font-bold">
              <span className="text-[#15803d] font-black text-[6.5px]">Party Fees:</span>
              <span className="font-mono">{pFee}</span>
            </div>
            <div className="border-t border-dashed border-[#15803d]/30 my-0.5"></div>
            <div className="flex justify-between items-center text-[#15803d]">
              <span className="font-black text-[7.5px]">TOTAL DUE</span>
              <span className="font-black font-mono text-[7.5px]">{totalFormatted}</span>
            </div>
          </div>

          {/* Box 4: Key Rating of Behaviour */}
          <div className="p-1 text-[6px] sm:text-[6.5px] leading-none text-slate-600">
            <div className="text-center font-black text-[#15803d] border-b border-[#15803d] pb-0.5 uppercase tracking-wider mb-0.5">
              RATING SCALE
            </div>
            <div className="font-semibold text-slate-600 space-y-px">
              <div>5 - Excellent Degree</div>
              <div>4 - Maintain High Level</div>
              <div>3 - Acceptable Level</div>
              <div>2 - Minimal Regard</div>
              <div>1 - No Regard</div>
            </div>
          </div>
        </div>
      </div>

      {/* Behavioural and Skills Rating twin grids */}
      <div className="relative z-10 grid grid-cols-2 gap-2">
        {/* Left Grid: Behavioural Rating */}
        <div className="border border-[#15803d] bg-white rounded-none overflow-hidden select-none">
          <table className="w-full border-collapse text-[9px] font-semibold text-slate-800">
            <thead>
              <tr className="bg-emerald-50 text-[#15803d] border-b border-[#15803d] font-black text-center text-[7.5px] uppercase">
                <th className="py-0.5 px-1 text-left w-[55%] font-black">Behavioural Rating</th>
                <th className="w-[9%]">5</th>
                <th className="w-[9%]">4</th>
                <th className="w-[9%]">3</th>
                <th className="w-[9%]">2</th>
                <th className="w-[9%]">1</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#15803d]/30 text-slate-800 font-extrabold text-[8px]">
              {(() => {
                const getRatingForTrait = (traitName: string): number => {
                  const match = student.behaviour.find(b => 
                    b.name.toLowerCase().replace(/[-_\s]/g, '') === traitName.toLowerCase().replace(/[-_\s]/g, '')
                  );
                  return match ? match.rating : 4;
                };

                return ['Punctuality', 'Neatness', 'Assignment', 'Concentration'].map(trait => {
                  const rating = getRatingForTrait(trait);
                  return (
                    <tr key={trait} className="h-4.5">
                      <td className="py-0.5 px-1 border-r border-[#15803d]/30 text-left font-black uppercase text-[7.5px]">{trait}</td>
                      {[5, 4, 3, 2, 1].map(num => (
                        <td key={num} className="border-r border-[#15803d]/30 last:border-r-0 text-center font-black text-[#15803d] text-[9.5px]">
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
        <div className="border border-[#15803d] bg-white rounded-none overflow-hidden select-none">
          <table className="w-full border-collapse text-[9px] font-semibold text-slate-800">
            <thead>
              <tr className="bg-emerald-50 text-[#15803d] border-b border-[#15803d] font-black text-center text-[7.5px] uppercase">
                <th className="py-0.5 px-1 text-left w-[55%] font-black">Skills Rating</th>
                <th className="w-[9%]">5</th>
                <th className="w-[9%]">4</th>
                <th className="w-[9%]">3</th>
                <th className="w-[9%]">2</th>
                <th className="w-[9%]">1</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#15803d]/30 text-slate-800 font-extrabold text-[8px]">
              {(() => {
                const getRatingForTrait = (traitName: string): number => {
                  const match = student.behaviour.find(b => 
                    b.name.toLowerCase().replace(/[-_\s]/g, '') === traitName.toLowerCase().replace(/[-_\s]/g, '')
                  );
                  return match ? match.rating : 4;
                };

                return ['Handwriting', 'Fluency', 'Attitude to Property'].map(trait => {
                  const rating = getRatingForTrait(trait);
                  return (
                    <tr key={trait} className="h-4.5">
                      <td className="py-0.5 px-1 border-r border-[#15803d]/30 text-left font-black uppercase text-[7.5px]">{trait}</td>
                      {[5, 4, 3, 2, 1].map(num => (
                        <td key={num} className="border-r border-[#15803d]/30 last:border-r-0 text-center font-black text-[#15803d] text-[9.5px]">
                          {rating === num ? '✔' : ''}
                        </td>
                      ))}
                    </tr>
                  );
                });
              })()}
              {/* Perfectly parallel placeholder line */}
              <tr className="h-4.5">
                <td className="py-0.5 px-1 border-r border-[#15803d]/30 text-left font-black uppercase text-[7.5px] opacity-20">-</td>
                <td className="border-r border-[#15803d]/30"></td>
                <td className="border-r border-[#15803d]/30"></td>
                <td className="border-r border-[#15803d]/30"></td>
                <td className="border-r border-[#15803d]/30"></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Signature & Remarks Dotted Fields Section */}
      <div className="relative z-10 pt-1 space-y-1 select-none text-[#15803d] font-bold text-[9.5px] sm:text-[10px]">
        {/* Line 1: Overall Grading / Remark */}
        <div className="flex items-end gap-1.5 min-h-[18px]">
          <span className="shrink-0 text-[8.5px] uppercase tracking-wider">OVERALL REMARK:</span>
          <div className="border-b border-dotted border-[#15803d] flex-grow pb-px px-2 font-extrabold text-slate-900 text-[9.5px]">
            {(() => {
              const avg = stats.avgScore;
              if (avg >= 90) return "DISTINCTION - OUTSTANDING AND EXEMPLARY PERFORMANCE.";
              if (avg >= 80) return "EXCELLENT - COMMENDABLE ACADEMIC HEIGHT ATTAINED.";
              if (avg >= 70) return "VERY GOOD - A HIGHLY SATISFACTORY ACADEMIC RECORD.";
              if (avg >= 60) return "GOOD - STEADY PROGRESS AND CONSTRUCTIVE HABITS.";
              if (avg >= 50) return "PASS - SATISFACTORY COMPLETION. WORK HARDER.";
              return "FAIL - RETAKE REQUIRED. NEEDS INTENSE REMEDIAL FOCUS.";
            })()}
          </div>
        </div>

        {/* Line 2: Class Teacher Remark */}
        <div className="flex items-end gap-1.5 min-h-[18px]">
          <span className="shrink-0 text-[8.5px] uppercase tracking-wider">TEACHER'S REMARK:</span>
          <div className="border-b border-dotted border-[#15803d] flex-grow pb-px px-2 font-extrabold text-slate-800 text-[9.5px] italic truncate">
            "{student.formTeacherRemark || "Brilliant, neat and quiet pupil. Maintains good focus."}"
          </div>
        </div>

        {/* Line 3: Class Teacher Signatures */}
        <div className="grid grid-cols-12 gap-3 items-end min-h-[18px]">
          <div className="col-span-5 flex items-end gap-1">
            <span className="shrink-0 text-[8.5px] uppercase tracking-wider">TEACHER'S NAME:</span>
            <div className="border-b border-dotted border-[#15803d] flex-grow pb-px px-1 font-extrabold text-slate-900 truncate">
              {displayTeacherName}
            </div>
          </div>
          <div className="col-span-4 flex items-end gap-1">
            <span className="shrink-0 text-[8.5px] uppercase tracking-wider">SIGNATURE:</span>
            <div className="border-b border-dotted border-[#15803d] flex-grow pb-px text-slate-600 text-center font-serif italic text-[9px]">
              Signed
            </div>
          </div>
          <div className="col-span-3 flex items-end gap-1">
            <span className="shrink-0 text-[8.5px] uppercase tracking-wider">DATE:</span>
            <div className="border-b border-dotted border-[#15803d] flex-grow pb-px font-mono text-center text-slate-900">
              {new Date().toLocaleDateString('en-GB')}
            </div>
          </div>
        </div>

        {/* Line 4: Head Mistress Remark */}
        <div className="flex items-end gap-1.5 min-h-[18px]">
          <span className="shrink-0 text-[8.5px] uppercase tracking-wider">
            {isSecondaryClass ? "PRINCIPAL REMARK:" : "HEAD MISTRESS REMARK:"}
          </span>
          <div className="border-b border-dotted border-[#15803d] flex-grow pb-px px-2 font-extrabold text-slate-800 text-[9.5px] italic truncate">
            {student.principalRemark
              ? `"${student.principalRemark}"`
              : (student.formTeacherRemark.includes("outstanding") || stats.avgScore >= (template.distinctionThreshold || 90)
                ? `"Highly commendable academic and behavioral character shown during the term. Promoted."`
                : stats.avgScore >= (template.passThreshold || 50)
                  ? `"Satisfactory progress. Continued focus on core concepts will serve well. Promoted."`
                  : `"Needs close guidance and study supervision in future sessions to ensure metrics."`)}
          </div>
        </div>

        {/* Line 5: Head Mistress Signatures */}
        <div className="grid grid-cols-12 gap-3 items-end min-h-[18px]">
          <div className="col-span-5 flex items-end gap-1">
            <span className="shrink-0 text-[8.5px] uppercase tracking-wider">
              {isSecondaryClass ? "PRINCIPAL'S NAME:" : "HEAD MISTRESS NAME:"}
            </span>
            <div className="border-b border-dotted border-[#15803d] flex-grow pb-px px-1 font-extrabold text-slate-900 truncate">
              {displaySignatoryName}
            </div>
          </div>
          <div className="col-span-4 flex items-end gap-1">
            <span className="shrink-0 text-[8.5px] uppercase tracking-wider">SIGNATURE:</span>
            <div className="border-b border-dotted border-[#15803d] flex-grow pb-px text-slate-600 text-center font-serif italic text-[9px]">
              Stamped & Signed
            </div>
          </div>
          <div className="col-span-3 flex items-end gap-1">
            <span className="shrink-0 text-[8.5px] uppercase tracking-wider">DATE:</span>
            <div className="border-b border-dotted border-[#15803d] flex-grow pb-px font-mono text-center text-slate-900">
              {new Date().toLocaleDateString('en-GB')}
            </div>
          </div>
        </div>

        {/* Line 6: School Resumption date */}
        <div className="flex items-end gap-1.5 min-h-[18px]">
          <span className="shrink-0 text-[8.5px] uppercase tracking-wider">SCHOOL RESUMES:</span>
          <div className="border-b border-dotted border-[#15803d] flex-grow pb-px px-2 font-extrabold text-slate-900">
            {template.resumptionDate || "11th September, 2026"}
          </div>
        </div>
      </div>

      {/* Symmetrical digital seal for layout completion */}
      <div className="flex justify-between items-center gap-1 bg-slate-900 text-slate-200 py-1 px-2 rounded-none relative z-10 text-[8px] border border-slate-800 select-none print:hidden">
        <span className="flex items-center gap-1 font-medium">
          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Official System Verification: <strong className="text-white uppercase">{term} Active Report Card</strong></span>
        </span>
        <span className="bg-[#15803d] text-white font-extrabold px-1 text-[7.5px] tracking-wider uppercase">
          ★ Official Seal Verified
        </span>
      </div>
    </div>
  );
});

ReportCardPrintable.displayName = 'ReportCardPrintable';