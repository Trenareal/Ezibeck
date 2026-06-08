/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArrowLeft, School, GraduationCap, Plus, Save, Trash2, Edit2, CheckCircle, ShieldAlert, Users, TrendingUp, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { Student, ClassName, SubjectGrade, BehaviourRating } from '../types';
import { createStudent, calculateStudentStats, calculateClassPositions, BEHAVIOUR_TRAITS } from '../utils/academicUtils';

interface TeacherDashboardProps {
  students: Student[];
  onBack: () => void;
  onUpdateStudents: (updatedList: Student[]) => void;
}

interface FacultyProfile {
  name: string;
  role: string;
  avatar: string;
}

const FACULTY_LIST: FacultyProfile[] = [
  { name: "Dr. Ezekiel Beck", role: "School Head Principal & Founder", avatar: "👨‍🏫" },
  { name: "Mrs. Gladys Alabi", role: "Junior Secondary Form Lead", avatar: "👩‍🏫" },
  { name: "Mr. Anthony Okon", role: "Senior Secondary Form Lead", avatar: "👨‍💻" }
];

export default function TeacherDashboard({ students, onBack, onUpdateStudents }: TeacherDashboardProps) {
  const [currentUser, setCurrentUser] = useState<FacultyProfile | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassName>('JSS1');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // New Student input fields
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentSex, setNewStudentSex] = useState<'Male' | 'Female'>('Male');
  const [newStudentAge, setNewStudentAge] = useState(12);

  // Edit Student form fields state
  const [editAge, setEditAge] = useState(12);
  const [editSex, setEditSex] = useState<'Male' | 'Female'>('Male');
  const [editAttendancePresent, setEditAttendancePresent] = useState(100);
  const [editAttendanceTotal, setEditAttendanceTotal] = useState(110);
  const [editSubjects, setEditSubjects] = useState<SubjectGrade[]>([]);
  const [editBehaviour, setEditBehaviour] = useState<BehaviourRating[]>([]);
  const [editFormComment, setEditFormComment] = useState('');
  const [editTeacherName, setEditTeacherName] = useState('');
  const [editPrincipalName, setEditPrincipalName] = useState('');
  const [editResumeDate, setEditResumeDate] = useState('2026-09-14');

  // Trigger quick alerts helper
  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Staff Login action
  const handleLogin = (profile: FacultyProfile) => {
    setCurrentUser(profile);
    triggerSuccess(`Successfully authorized as ${profile.name}`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setEditingStudent(null);
    setShowAddForm(false);
  };

  // Filter students showing in the selected class
  const classStudents = students.filter(s => s.className === selectedClass);

  // Stats for current class overview
  const totalInClass = classStudents.length;
  const highestScore = classStudents.length > 0 
    ? Math.max(...classStudents.map(s => calculateStudentStats(s).totalScore))
    : 0;
  const averageGPAInClass = classStudents.length > 0
    ? (classStudents.reduce((sum, s) => sum + parseFloat(calculateStudentStats(s).gpa), 0) / classStudents.length).toFixed(2)
    : "0.00";

  // Create Student
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const newIdx = students.filter(s => s.className === selectedClass).length;
    const added = createStudent(newStudentName.trim(), selectedClass, newIdx);
    added.age = newStudentAge;
    added.sex = newStudentSex;
    
    // Add student, trigger ranking refresh
    let refreshed = [...students, added];
    refreshed = calculateClassPositions(refreshed, selectedClass);
    
    onUpdateStudents(refreshed);
    setNewStudentName('');
    setShowAddForm(false);
    triggerSuccess(`Added ${added.name} of school standard JSS1-SS3 registration catalog!`);
  };

  // Start Editing Student scores
  const startEditStudent = (student: Student) => {
    setEditingStudent(student);
    setEditAge(student.age);
    setEditSex(student.sex);
    setEditAttendancePresent(student.attendancePresent);
    setEditAttendanceTotal(student.attendanceTotal);
    setEditSubjects([...student.subjects]);
    setEditBehaviour([...student.behaviour]);
    setEditFormComment(student.formTeacherRemark);
    setEditTeacherName(student.formTeacherName);
    setEditPrincipalName(student.principalName);
    setEditResumeDate(student.resumptionDate);
  };

  // Handle Score Input Key Change
  const handleScoreChange = (sid: string, type: 'test' | 'exam', val: number) => {
    setEditSubjects(prev => prev.map(s => {
      if (s.id !== sid) return s;
      if (type === 'test') {
        const validated = Math.max(0, Math.min(30, val));
        return { ...s, testScore: validated };
      } else {
        const validated = Math.max(0, Math.min(70, val));
        return { ...s, examScore: validated };
      }
    }));
  };

  // Handle Behaviour Rating Change
  const handleBehaviourChange = (traitName: string, ratingVal: number) => {
    setEditBehaviour(prev => prev.map(b => {
      if (b.name !== traitName) return b;
      return { ...b, rating: Math.max(1, Math.min(5, ratingVal)) };
    }));
  };

  // Save Student Academic updates
  const saveStudentChanges = () => {
    if (!editingStudent) return;

    const updatedStudent: Student = {
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

    // Replace in full list, trigger rank recalculation
    let refreshed = students.map(s => s.id === editingStudent.id ? updatedStudent : s);
    refreshed = calculateClassPositions(refreshed, selectedClass);

    onUpdateStudents(refreshed);
    setEditingStudent(null);
    triggerSuccess(`Reports updated perfectly for ${updatedStudent.name}! Class ranks recalculated.`);
  };

  // Remove Student Profile Efficaciously
  const deleteStudentProfile = (id: string, name: string) => {
    if (confirm(`Action Critical: Are you absolutely certain you wish to delete the student report card for ${name}?`)) {
      let refreshed = students.filter(s => s.id !== id);
      refreshed = calculateClassPositions(refreshed, selectedClass);
      onUpdateStudents(refreshed);
      triggerSuccess(`Successfully erased student profile ${name}.`);
    }
  };

  // --- LOGGED OUT FACULTY SCREEN ---
  if (!currentUser) {
    return (
      <div className="bg-slate-950 min-h-screen text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-grid-pattern"></div>
        
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 text-center space-y-6">
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-white text-xs font-bold transition-all mb-4 block mx-auto flex items-center gap-1 bg-slate-800 py-1.5 px-3.5 rounded-lg border border-slate-700/60"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to School Homepage
          </button>

          <div className="flex justify-center">
            <div className="bg-amber-400/10 border border-amber-400/30 font-bold text-amber-400 p-4 rounded-2xl">
              <School className="w-10 h-10" />
            </div>
          </div>

          <div>
            <h1 className="text-xl font-black tracking-tight uppercase leading-none">EZIBECK STAFF DESK</h1>
            <p className="text-[10px] tracking-widest text-amber-400 font-extrabold uppercase mt-1">Authorized Entry Workspace</p>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-left text-xs text-slate-400 space-y-1">
            <span className="font-extrabold text-slate-200 block text-[11px] uppercase tracking-wider mb-1 text-amber-500">
              Staff Desk Policy
            </span>
            <p>Welcome, Educators! Sign in securely by selecting your authorized academic profile. You can edit marks and print report cards instantly.</p>
          </div>

          <div className="space-y-2 pt-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Choose Faculty profile:</span>
            {FACULTY_LIST.map(p => (
              <button
                key={p.name}
                onClick={() => handleLogin(p)}
                className="w-full bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl p-3 flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-3 text-left">
                  <span className="text-xl">{p.avatar}</span>
                  <div>
                    <h4 className="font-bold text-xs text-slate-200 group-hover:text-white leading-none">{p.name}</h4>
                    <span className="text-[10px] text-slate-400 leading-none">{p.role}</span>
                  </div>
                </div>
                <div className="text-[10px] bg-slate-900 border border-slate-700 px-2 py-1 rounded text-slate-400 font-bold">
                  Bypass Lock
                </div>
              </button>
            ))}
          </div>

          <p className="text-[9px] text-slate-500">
            Secure administrative console. EZIBECK'S ACADEMY Academic Office delta-terminal.
          </p>
        </div>
      </div>
    );
  }

  // --- LOGGED IN STAFF DESK VIEW ---
  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Top dashboard navigation banner */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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

        <div className="flex gap-2">
          <button
            onClick={handleLogout}
            className="border hover:bg-slate-100 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition-all"
          >
            Sign Out Desk
          </button>
          <button
            onClick={onBack}
            className="bg-indigo-900 hover:bg-indigo-950 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
          >
            View Homepage
          </button>
        </div>
      </div>

      {/* Real-time Alerts popups */}
      {successMsg && (
        <div className="max-w-6xl mx-auto mb-6 bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 flex items-center gap-3 text-emerald-900 animate-slide-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-xs font-bold">{successMsg}</p>
        </div>
      )}

      {/* Main Container Workspace */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 gap-8">
        
        {/* VIEW 1: ACTIVE STUDENT ROW EDITOR MODE */}
        {editingStudent ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-md">
            {/* Editor Top Navigation header */}
            <div className="flex justify-between items-center border-b pb-4 mb-6">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-6 h-6 text-indigo-900" />
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
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50 border p-4 rounded-xl text-xs mb-8">
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
                  {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(y => (
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
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Academics Subjects list editor */}
              <div className="lg:col-span-8 space-y-4">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider border-b pb-1.5">
                  Academic Subject Grades Record
                </h4>

                <div className="space-y-2 border rounded-2xl overflow-hidden shadow-inner">
                  <div className="bg-slate-100 border-b p-3 grid grid-cols-12 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                    <span className="col-span-6">Subject Course Title</span>
                    <span className="col-span-2 text-center">Test Score (30)</span>
                    <span className="col-span-2 text-center">Exam Score (70)</span>
                    <span className="col-span-2 text-center">Live Total (100)</span>
                  </div>

                  <div className="divide-y max-h-96 overflow-y-auto">
                    {editSubjects.map(subj => {
                      const subjTotal = subj.testScore + subj.examScore;
                      return (
                        <div key={subj.id} className="p-3 grid grid-cols-12 items-center text-xs font-semibold text-slate-800 hover:bg-slate-50">
                          <span className="col-span-6 font-bold">{subj.name}</span>
                          <span className="col-span-2 flex justify-center px-2">
                            <input
                              type="number"
                              min={0}
                              max={30}
                              value={subj.testScore}
                              onChange={(e) => handleScoreChange(subj.id, 'test', parseInt(e.target.value) || 0)}
                              className="w-16 bg-white border border-slate-200 py-1 rounded text-center outline-none focus:border-indigo-800 font-bold font-mono"
                            />
                          </span>
                          <span className="col-span-2 flex justify-center px-2">
                            <input
                              type="number"
                              min={0}
                              max={70}
                              value={subj.examScore}
                              onChange={(e) => handleScoreChange(subj.id, 'exam', parseInt(e.target.value) || 0)}
                              className="w-16 bg-white border border-slate-200 py-1 rounded text-center outline-none focus:border-indigo-800 font-bold font-mono"
                            />
                          </span>
                          <span className="col-span-2 text-center font-extrabold font-mono text-indigo-900 bg-indigo-50/50 py-1 rounded border">
                            {subjTotal}
                          </span>
                        </div>
                      );
                    })}
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

                  <div className="space-y-2 max-h-56 overflow-y-auto border p-3 rounded-2xl bg-slate-50/50">
                    {editBehaviour.map(b => (
                      <div key={b.name} className="flex justify-between items-center text-xs border-b border-dashed border-slate-200 py-1.5 last:border-none">
                        <span className="font-bold text-slate-700 text-[11px]">{b.name}</span>
                        <select
                          value={b.rating}
                          onChange={(e) => handleBehaviourChange(b.name, parseInt(e.target.value))}
                          className="bg-white border rounded text-xs px-1.5 py-0.5 outline-none font-bold text-indigo-900"
                        >
                          {[1, 2, 3, 4, 5].map(v => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider border-b pb-1.5">
                    Official Comments & Signing Authorities
                  </h4>

                  <div className="space-y-3.5 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Form Teacher Remarks</label>
                      <textarea
                        value={editFormComment}
                        onChange={(e) => setEditFormComment(e.target.value)}
                        rows={3}
                        placeholder="Write term summary remark..."
                        className="w-full bg-white border p-2 text-xs rounded-lg outline-none font-medium text-slate-700 focus:border-indigo-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Form Teacher’s Authorized Name</label>
                      <input
                        type="text"
                        value={editTeacherName}
                        onChange={(e) => setEditTeacherName(e.target.value)}
                        className="w-full bg-white border p-1.5 text-xs rounded-lg outline-none font-bold text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Resumption Date (Next Term)</label>
                      <input
                        type="text"
                        value={editResumeDate}
                        onChange={(e) => setEditResumeDate(e.target.value)}
                        className="w-full bg-white border p-1.5 text-xs rounded-lg outline-none font-bold text-indigo-800 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Buttons and actions */}
            <div className="border-t pt-6 mt-8 flex justify-end gap-3">
              <button
                onClick={() => setEditingStudent(null)}
                className="border border-slate-300 hover:bg-slate-50 text-slate-600 font-bold text-xs px-6 py-2.5 rounded-xl transition-all"
              >
                Discard Changes
              </button>
              <button
                onClick={saveStudentChanges}
                className="bg-indigo-900 hover:bg-indigo-950 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-indigo-900/10"
              >
                <Save className="w-4 h-4" /> Save Score Updates
              </button>
            </div>
          </div>
        ) : (
          
          // VIEW 2: ROSTER DIRECTORY FOR SELECTED CLASS
          <div className="space-y-6">
            
            {/* Quick Metrics Statistics Widget Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Class Directory ({selectedClass})</span>
                  <p className="text-xl font-bold font-mono text-slate-900">{totalInClass} Students Slips</p>
                </div>
                <div className="bg-indigo-50 text-indigo-800 p-2.5 rounded-xl border">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-white border rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Highest Cumulative ({selectedClass})</span>
                  <p className="text-xl font-bold font-mono text-slate-900">{highestScore} <span className="text-xs text-slate-400">/ 1000 pts</span></p>
                </div>
                <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-xl border-emerald-100 border">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-white border rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average GPA Performance</span>
                  <p className="text-xl font-bold font-mono text-slate-900">{averageGPAInClass} / 5.00 GPA</p>
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
                    {(['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'] as ClassName[]).map(cls => (
                      <button
                        key={cls}
                        onClick={() => {
                          setSelectedClass(cls);
                          setShowAddForm(false);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedClass === cls ? 'bg-indigo-900 text-white shadow-sm font-black' : 'text-slate-600 hover:bg-slate-200'}`}
                      >
                        {cls}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="bg-indigo-900 hover:bg-indigo-950 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add Student
                </button>
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
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                        {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(y => (
                          <option key={y} value={y}>{y} Years Old</option>
                        ))}
                      </select>
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
                      className="bg-indigo-900 border text-white hover:bg-indigo-950 px-5 py-2 rounded-lg"
                    >
                      Authenticate Student
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
                        <th className="py-2.5 px-4 text-center w-14">Rank</th>
                        <th className="py-2.5 px-4 w-28">Student ID</th>
                        <th className="py-2.5 px-4">Student Name</th>
                        <th className="py-2.5 px-4 text-center">Sex</th>
                        <th className="py-2.5 px-4 text-center font-bold">GPA</th>
                        <th className="py-2.5 px-4 text-center font-bold">Term Average Score</th>
                        <th className="py-2.5 px-4 text-right">Actions Panel</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-medium text-slate-900">
                      {classStudents.map((stud, index) => {
                        const stats = calculateStudentStats(stud);
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
                            <td className="py-3 px-4 text-center font-mono text-indigo-900 font-bold text-[13px]">{stats.gpa}</td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-xs text-slate-600">{stats.avgScore.toFixed(1)}%</td>
                            <td className="py-3 px-4 text-right flex justify-end gap-1.5 flex-row">
                              <button
                                onClick={() => startEditStudent(stud)}
                                className="border border-slate-300 hover:border-indigo-600 hover:text-indigo-900 bg-white hover:bg-slate-50 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                              >
                                <Edit2 className="w-3.5 h-3.5" /> Grade Report
                              </button>
                              <button
                                onClick={() => deleteStudentProfile(stud.id, stud.name)}
                                className="border border-slate-300 hover:border-red-600 hover:text-red-900 bg-white hover:bg-slate-50 text-slate-500 p-1.5 rounded-lg transition-all shadow-sm"
                                title="Delete from roster"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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
    </div>
  );
}
