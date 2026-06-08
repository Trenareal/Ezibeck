/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { ArrowLeft, Search, GraduationCap, Printer, BookOpen, UserCheck, Calendar, Award, Star, Eye, Layers } from 'lucide-react';
import { Student, ClassName } from '../types';
import { SCHOOL_INFO, calculateStudentStats, getLetterAndRemark, calculateSubjectTotal, BEHAVIOUR_TRAITS } from '../utils/academicUtils';

interface StudentPortalProps {
  students: Student[];
  onBack: () => void;
}

export default function StudentPortal({ students, onBack }: StudentPortalProps) {
  const [selectedClass, setSelectedClass] = useState<ClassName>('JSS1');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [viewTab, setViewTab] = useState<'report' | 'charts'>('report');

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Filter students by class and search query
  const filteredStudents = students.filter(s => {
    const matchClass = s.className === selectedClass;
    const matchQuery = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       s.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchClass && matchQuery;
  });

  const handlePrint = () => {
    window.print();
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

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-50 text-indigo-700 p-3 rounded-xl shadow-xs">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">Report Center</h2>
                <p className="text-xs text-slate-500 mt-1">Select class and search candidate to view active terminal reports</p>
              </div>
            </div>
            
            {/* Class Tabs Selector */}
            <div className="flex flex-wrap gap-1.5 bg-slate-55 p-1.5 rounded-2xl border border-slate-100">
              {(['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'] as ClassName[]).map(cls => (
                <button
                  key={cls}
                  onClick={() => {
                    setSelectedClass(cls);
                    setSearchQuery('');
                    setSelectedStudent(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${selectedClass === cls ? 'bg-indigo-700 text-white shadow-md shadow-indigo-100' : 'text-slate-600 hover:bg-slate-100'}`}
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
                placeholder="Search candidate name..."
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
                      onClick={() => {
                        setSelectedStudent(stud);
                        setViewTab('report');
                      }}
                      className={`px-3.5 py-1.5 text-xs rounded-xl border font-bold transition-all cursor-pointer ${selectedStudent?.id === stud.id ? 'bg-indigo-50 border-indigo-205 text-indigo-700 scale-[1.01] shadow-xs' : 'bg-white hover:bg-slate-50 border-slate-100 text-slate-600'}`}
                    >
                      {stud.name}
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
        <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-dashed border-slate-205 p-16 text-center shadow-sm print:hidden">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-base font-extrabold text-slate-700 tracking-tight leading-none uppercase">No Student Report Sheet Selected</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed font-semibold">
            Please parse the search filters above. Choose a class division and select a student registration card to view active term score charts.
          </p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Sub menu inside student viewer (hidden during print) */}
          <div className="flex justify-between items-center bg-white border border-slate-100 rounded-2xl px-5 py-4 print:hidden shadow-xs">
            <div className="flex gap-2 animate-fade-in">
              <button
                onClick={() => setViewTab('report')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${viewTab === 'report' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <Eye className="w-3.5 h-3.5" /> Official Report Card
              </button>
              <button
                onClick={() => setViewTab('charts')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${viewTab === 'charts' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <Layers className="w-3.5 h-3.5" /> Performance Visualizer
              </button>
            </div>
            <button
              onClick={handlePrint}
              className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print Sheet
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
            }

            // Otherwise, render full standard report sheet card (printable)
            return (
              <div 
                ref={printAreaRef}
                className="bg-white border border-slate-100 rounded-3xl shadow-xl p-8 sm:p-14 space-y-10 relative print:border-none print:shadow-none print:p-0 print:m-0"
              >
                {/* Printable border decoration */}
                <div className="absolute inset-4 border border-slate-100 rounded-2xl pointer-events-none print:hidden"></div>

                {/* Report Sheet Logo Header */}
                <div className="text-center relative z-10 border-b border-slate-100 pb-8 space-y-3">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight leading-none uppercase italic">
                    {SCHOOL_INFO.name}
                  </h1>
                  <p className="text-xs tracking-widest text-indigo-700 font-bold uppercase">
                    Motto: {SCHOOL_INFO.motto}
                  </p>
                  <p className="text-slate-400 text-[10px] sm:text-xs">
                    Address: {SCHOOL_INFO.address}
                  </p>
                  
                  <div className="pt-4">
                    <span className="bg-slate-900 text-slate-100 text-xs font-extrabold uppercase tracking-widest px-5 py-2.5 rounded-lg inline-block border border-slate-800 shadow-sm animate-fade-in">
                      Official Termly Progress Report Sheet
                    </span>
                  </div>
                </div>                {/* Profile Grid Block */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 bg-slate-50 border border-slate-100 rounded-2xl p-6 relative z-10 text-xs text-slate-800 shadow-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Student Name:</span>
                    <p className="font-extrabold text-slate-900 text-sm leading-none">{selectedStudent.name}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Student ID:</span>
                    <p className="font-mono font-bold text-indigo-700 text-sm leading-none">{selectedStudent.id}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Class Stream:</span>
                    <p className="font-extrabold text-slate-900 text-sm leading-none">{selectedStudent.className}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Academic Session:</span>
                    <p className="font-extrabold text-slate-900 text-sm leading-none">{selectedStudent.session}</p>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-slate-200/50">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Age Profile:</span>
                    <p className="font-bold text-slate-700">{selectedStudent.age} Years</p>
                  </div>
                  <div className="space-y-1 pt-2 border-t border-slate-200/50">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Gender Sex:</span>
                    <p className="font-bold text-slate-700">{selectedStudent.sex}</p>
                  </div>
                  <div className="space-y-1 pt-2 border-t border-slate-200/50">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Report Date:</span>
                    <p className="font-bold text-slate-700">{selectedStudent.termDate}</p>
                  </div>
                  <div className="space-y-1 pt-2 border-t border-slate-200/50">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Resumption:</span>
                    <p className="font-bold text-indigo-700 font-extrabold">{selectedStudent.resumptionDate}</p>
                  </div>
                </div>

                <div className="relative z-10 space-y-3">
                  <h3 className="text-slate-900 font-black text-xs uppercase tracking-widest border-b border-slate-100 pb-2 mb-4 flex items-center justify-between">
                    <span>Part A: Academic Course Evaluation</span>
                    <span className="text-[10px] text-slate-400 normal-case font-bold mt-[-4px]">Primary Grades Standards Grid</span>
                  </h3>
                  
                  <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-xs bg-white">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                          <th className="py-3.5 px-5">Subject Course</th>
                          <th className="py-3.5 px-3 text-center">Test (30)</th>
                          <th className="py-3.5 px-3 text-center">Exam (70)</th>
                          <th className="py-3.5 px-4 text-center">Term Score (100)</th>
                          <th className="py-3.5 px-3 text-center">Grade</th>
                          <th className="py-3.5 px-3 text-center">Rank</th>
                          <th className="py-3.5 px-5">Subject Assessment Review</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {selectedStudent.subjects.map(subj => {
                          const tot = calculateSubjectTotal(subj);
                          const { letter, remark, ratingClass } = getLetterAndRemark(tot);
                          return (
                            <tr key={subj.id} className="hover:bg-slate-50/40 transition-colors">
                              <td className="py-3.5 px-5 font-extrabold text-slate-900">{subj.name}</td>
                              <td className="py-3.5 px-3 text-center font-mono text-slate-500 font-semibold">{subj.testScore}</td>
                              <td className="py-3.5 px-3 text-center font-mono text-slate-500 font-semibold">{subj.examScore}</td>
                              <td className="py-3.5 px-4 text-center font-black font-mono text-indigo-700 bg-slate-50/20">{tot}</td>
                              <td className="py-3.5 px-3 text-center">
                                <span className={`px-2.5 py-1 text-[10px] uppercase font-black rounded-md ${ratingClass}`}>
                                  {letter}
                                </span>
                              </td>
                              <td className="py-3.5 px-3 text-center font-bold text-slate-600 bg-slate-50/20">{subj.position ? `${subj.position}` : '-'}</td>
                              <td className="py-3.5 px-5 italic text-slate-500 text-[11.5px] font-normal">{remark} performance</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sub Score Analysis Box and Behavior columns */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10 text-slate-800">
                  {/* Performance Statistics Summary */}
                  <div className="md:col-span-5 bg-slate-50 border border-slate-100 p-6 rounded-2xl space-y-4 flex flex-col justify-between shadow-xs">
                    <div>
                      <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-200/50 pb-2 mb-3">
                        Performance Analytics
                      </h4>
                      <div className="grid grid-cols-2 gap-4 pt-1 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-extrabold uppercase tracking-widest">Cumulative Total:</span>
                          <span className="font-extrabold text-slate-900 text-sm leading-tight">
                            {stats.totalScore} <span className="text-[10px] text-slate-400">/ {stats.maxPossibleScore}</span>
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-extrabold uppercase tracking-widest">Term Average Score:</span>
                          <span className="font-extrabold text-slate-900 text-sm leading-tight">
                            {stats.avgScore.toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-extrabold uppercase tracking-widest">Calculated GPA:</span>
                          <span className="font-mono text-indigo-700 font-black text-sm leading-tight">
                            {stats.gpa} <span className="text-[9px] text-slate-400 font-normal">/ 5.00</span>
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-extrabold uppercase tracking-widest">Resumption:</span>
                          <span className="font-bold text-slate-700">{selectedStudent.resumptionDate ? selectedStudent.resumptionDate : "None"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-200/50 pt-4 flex items-center justify-between text-xs font-bold gap-1.5 flex-wrap">
                      <span className="flex items-center gap-1 text-slate-600">
                        <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full inline-block"></span>
                        Credits: {stats.creditsAndAbove}
                      </span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <span className="w-2.5 h-2.5 bg-amber-500 rounded-full inline-block"></span>
                        Passes: {stats.passes}
                      </span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <span className="w-2.5 h-2.5 bg-red-500 rounded-full inline-block"></span>
                        Failures: {stats.failures}
                      </span>
                    </div>
                  </div>

                  {/* Behavior Assessment table */}
                  <div className="md:col-span-7 bg-white border border-slate-100 p-6 rounded-2xl space-y-3 shadow-xs">
                    <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-200/50 pb-2 flex justify-between items-center">
                      <span>Part B: Character & Conduct</span>
                      <span className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">Guide: 5 Max | 1 Min</span>
                    </h4>

                    <div className="grid grid-cols-2 gap-x-5 gap-y-1.5 pt-1 text-xs text-slate-800">
                      {selectedStudent.behaviour.map(b => (
                        <div key={b.name} className="flex items-center justify-between py-1 border-b border-dashed border-slate-100">
                          <span className="font-bold text-slate-600 text-[11px]">{b.name}</span>
                          <span className="font-mono font-black text-indigo-700 bg-indigo-50 border border-indigo-100/70 px-2 py-0.5 rounded text-[10px]">
                            {b.rating} / 5
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Remarks & Signatures Segment */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 pt-6 border-t border-dashed border-slate-200">
                  {/* Form Teacher Remark */}
                  <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4 flex flex-col justify-between shadow-xs">
                    <div>
                      <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-200/50 pb-1.5">
                        Form Teacher's Review
                      </h4>
                      <p className="text-xs italic text-slate-600 pt-3 leading-relaxed">
                        "{selectedStudent.formTeacherRemark}"
                      </p>
                    </div>
                    
                    <div className="border-t border-slate-200/50 pt-3 flex justify-between items-end">
                      <div className="text-xs">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-extrabold">Form Teacher:</span>
                        <p className="font-bold text-slate-900">{selectedStudent.formTeacherName}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-signature text-xs italic opacity-85 font-serif h-5 text-indigo-950">
                          {selectedStudent.formTeacherName.replace("Mrs.", "").replace("Mr.","").trim()}
                        </div>
                        <span className="text-[8px] text-slate-400 uppercase tracking-wider block border-t border-slate-200/70 pt-0.5 mt-0.5">Signature & Term Stamp</span>
                      </div>
                    </div>
                  </div>

                  {/* Principal Remarks & Promoted status */}
                  <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4 flex flex-col justify-between shadow-xs">
                    <div>
                      <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-200/50 pb-1.5">
                        Principal's Assessment & Promotion
                      </h4>
                      <p className="text-xs italic text-slate-600 pt-3 leading-relaxed">
                        "Outstanding academic performance. Very commendable behavioral qualities. Promoted to higher grade."
                      </p>
                    </div>

                    <div className="border-t border-slate-200/50 pt-3 flex justify-between items-end">
                      <div className="text-xs">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-extrabold">Head Principal:</span>
                        <p className="font-bold text-slate-900">{selectedStudent.principalName}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-signature text-xs italic opacity-85 font-serif h-5 text-indigo-950">
                          {selectedStudent.principalName.replace("Dr.","").trim()}
                        </div>
                        <span className="text-[8px] text-slate-400 uppercase tracking-wider block border-t border-slate-200/70 pt-0.5 mt-0.5 font-sans">Authorized Signature</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dynamic Attendance Footer stamp */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900 text-slate-150 p-4 sm:p-5 rounded-2xl relative z-10 text-xs border border-slate-800 shadow-sm animate-fade-in">
                  <span className="flex items-center gap-2.5 text-slate-100 font-medium">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span>Candidate Attendance Record: <strong className="text-white">{selectedStudent.attendancePresent} days present</strong> out of {selectedStudent.attendanceTotal} sessions.</span>
                  </span>
                  
                  <span className="bg-indigo-700 text-white font-extrabold px-3 py-1.5 rounded text-[11px] leading-none uppercase tracking-widest shadow-xs">
                    ★ Status: Active Student
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
