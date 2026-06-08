/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { ArrowLeft, School, GraduationCap, Plus, Save, Trash2, Edit2, CheckCircle, ShieldAlert, Users, TrendingUp, AlertCircle, FileSpreadsheet, Eye, Printer, UserCheck } from 'lucide-react';
import { Student, ClassName, SubjectGrade, BehaviourRating, Workspace15Template, FacultyProfile } from '../types';
import { createStudent, calculateStudentStats, calculateClassPositions, BEHAVIOUR_TRAITS, SCHOOL_INFO, getLetterAndRemark, calculateSubjectTotal } from '../utils/academicUtils';

interface TeacherDashboardProps {
  students: Student[];
  template: Workspace15Template;
  onBack: () => void;
  onUpdateStudents: (updatedList: Student[]) => void;
  onUpdateTemplate: (newTemplate: Workspace15Template) => void;
}

const DEFAULT_FACULTY: FacultyProfile[] = [
  { id: "ezekiel", name: "Dr. Ezekiel Beck", role: "School Head Principal & Founder", avatar: "👨‍🏫", password: "admin" },
  { id: "gladys", name: "Mrs. Gladys Alabi", role: "Junior Secondary Form Lead", avatar: "👩‍🏫", password: "junior" },
  { id: "anthony", name: "Mr. Anthony Okon", role: "Senior Secondary Form Lead", avatar: "👨‍💻", password: "senior" }
];

export default function TeacherDashboard({ students, template, onBack, onUpdateStudents, onUpdateTemplate }: TeacherDashboardProps) {
  const [currentUser, setCurrentUser] = useState<FacultyProfile | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassName>('JSS1');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingReportStudent, setViewingReportStudent] = useState<Student | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Dashboard Sub-navigation Tab
  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'workspace'>('roster');

  // Dynamic Faculty Management State
  const [facultyProfiles, setFacultyProfiles] = useState<FacultyProfile[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ezibeck_faculty_profiles');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Error parsing stored faculty profiles', e);
        }
      }
    }
    return DEFAULT_FACULTY;
  });

  // Faculty Login Credentials States
  const [pendingLoginUser, setPendingLoginUser] = useState<FacultyProfile | null>(null);
  const [teacherPasswordInput, setTeacherPasswordInput] = useState('');
  const [teacherLoginError, setTeacherLoginError] = useState('');

  // Faculty Registration States
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [regName, setRegName] = useState('');
  const [regRole, setRegRole] = useState('Secondary Subject Educator');
  const [regAvatar, setRegAvatar] = useState('👩‍🏫');
  const [regPassword, setRegPassword] = useState('');

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
    setTempPrincipalName(template.principalName);
    setTempFormTeacherJunior(template.formTeacherJunior);
    setTempFormTeacherSenior(template.formTeacherSenior);
    setTempNextTermFee(template.nextTermFee);
    setTempDistinctionThreshold(template.distinctionThreshold);
    setTempPassThreshold(template.passThreshold);
  }, [template]);

  // New Student input fields including password
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentSex, setNewStudentSex] = useState<'Male' | 'Female'>('Male');
  const [newStudentAge, setNewStudentAge] = useState(12);
  const [newStudentPassword, setNewStudentPassword] = useState('123456');

  // Edit Student form fields state including password
  const [editAge, setEditAge] = useState(12);
  const [editSex, setEditSex] = useState<'Male' | 'Female'>('Male');
  const [editPassword, setEditPassword] = useState('123456');
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

    setRegName('');
    setRegPassword('');
    setShowRegisterForm(false);
    triggerSuccess(`Registered and activated credentials for ${newFaculty.name} successfully!`);
  };

  // Staff Login action
  const handleVerifyTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingLoginUser) return;

    const correctPassword = pendingLoginUser.password || 'admin';
    if (teacherPasswordInput === correctPassword) {
      setCurrentUser(pendingLoginUser);
      setPendingLoginUser(null);
      setTeacherPasswordInput('');
      setTeacherLoginError('');
      triggerSuccess(`Successfully authorized as ${pendingLoginUser.name}`);
    } else {
      setTeacherLoginError('Incorrect faculty access password code.');
    }
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
    added.password = newStudentPassword || '123456';
    
    // Add student, trigger ranking refresh
    let refreshed = [...students, added];
    refreshed = calculateClassPositions(refreshed, selectedClass);
    
    onUpdateStudents(refreshed);
    setNewStudentName('');
    setNewStudentPassword('123456');
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
      password: editPassword,
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
            <div className="bg-indigo-450/10 border border-indigo-400/30 font-bold text-indigo-400 p-4 rounded-2xl">
              <School className="w-10 h-10 animate-pulse" />
            </div>
          </div>

          <div>
            <h1 className="text-xl font-black tracking-tight uppercase leading-none text-white">EZIBECK STAFF DESK</h1>
            <p className="text-[10px] tracking-widest text-indigo-400 font-extrabold uppercase mt-1">Authorized Entry Workspace</p>
          </div>

          {/* Real-time Alerts popups inside login */}
          {successMsg && (
            <div className="bg-emerald-900/30 border border-emerald-500/50 rounded-xl p-3 text-emerald-300 text-xs text-left font-semibold">
              ✓ {successMsg}
            </div>
          )}

          {/* Conditional view: Teacher Password Challenge */}
          {pendingLoginUser ? (
            <form onSubmit={handleVerifyTeacherLogin} className="space-y-4 text-left animate-fade-in bg-slate-950 border border-slate-850 p-5 rounded-2xl">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                <span className="text-2xl">{pendingLoginUser.avatar}</span>
                <div>
                  <h4 className="font-bold text-xs text-white">{pendingLoginUser.name}</h4>
                  <p className="text-[9px] text-slate-400">{pendingLoginUser.role}</p>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Enter Faculty Passcode:</label>
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="Profile security password"
                  value={teacherPasswordInput}
                  onChange={(e) => {
                    setTeacherPasswordInput(e.target.value);
                    setTeacherLoginError('');
                  }}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg p-2 text-xs font-mono tracking-widest text-white outline-none"
                />
                {teacherLoginError && (
                  <p className="text-[10px] text-red-400 font-semibold mt-1">{teacherLoginError}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPendingLoginUser(null);
                    setTeacherPasswordInput('');
                    setTeacherLoginError('');
                  }}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg py-2 text-[10px] font-bold text-slate-400 tracking-wider uppercase transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-900 hover:bg-indigo-950 text-white rounded-lg py-2 text-[10px] font-bold tracking-wider uppercase transition-all"
                >
                  Unlock Access
                </button>
              </div>
            </form>
          ) : showRegisterForm ? (
            /* Conditional view: Teacher Registration form */
            <form onSubmit={handleRegisterStaff} className="space-y-4 text-left animate-fade-in bg-slate-950 border border-slate-850 p-5 rounded-2xl">
              <h3 className="text-xs font-black text-white uppercase tracking-wider border-b border-slate-800 pb-2">Register New Educator Desk</h3>
              
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Educator Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Prof. Sarah Alao"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Staff Office Role</label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none font-bold"
                  >
                    <option value="Senior College Administrator">Senior College Administrator</option>
                    <option value="Junior Secondary Form Lead">Junior Secondary Form Lead</option>
                    <option value="Senior Secondary Form Lead">Senior Secondary Form Lead</option>
                    <option value="Subject Special Educator">Subject Special Educator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Passcode Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter secure staff layout key"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none font-mono tracking-widest"
                  />
                </div>

                <div className="grid grid-cols-5 gap-2">
                  <label className="col-span-5 block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Select Emoji Avatar</label>
                  {["👩‍🏫", "👨‍🏫", "👩‍💻", "👨‍💻", "🎓"].map(emoji => (
                    <button
                      type="button"
                      key={emoji}
                      onClick={() => setRegAvatar(emoji)}
                      className={`text-2xl p-1 rounded-md transition-all ${regAvatar === emoji ? 'bg-indigo-900 scale-110 border border-indigo-500' : 'bg-slate-900 hover:bg-slate-800'}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setShowRegisterForm(false)}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg py-2 text-[10px] font-bold text-slate-400 tracking-wider uppercase transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-900 hover:bg-indigo-950 text-white rounded-lg py-2 text-[10px] font-bold tracking-wider uppercase transition-all"
                >
                  Enroll Staff
                </button>
              </div>
            </form>
          ) : (
            /* Select profile block */
            <>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-left text-xs text-slate-400 space-y-1">
                <span className="font-extrabold text-slate-200 block text-[11px] uppercase tracking-wider mb-1 text-indigo-400">
                  Staff Desk Policy
                </span>
                <p>Welcome, Educators! Sign in securely by selecting your authorized academic profile. Enter your dynamic password key to configure classes and reports.</p>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Choose Faculty profile:</span>
                {facultyProfiles.map(p => (
                  <button
                    key={p.name}
                    onClick={() => setPendingLoginUser(p)}
                    className="w-full bg-slate-800/40 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex items-center justify-between transition-all group"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <span className="text-xl">{p.avatar}</span>
                      <div>
                        <h4 className="font-bold text-xs text-slate-200 group-hover:text-white leading-none">{p.name}</h4>
                        <span className="text-[10px] text-slate-400 leading-none">{p.role}</span>
                      </div>
                    </div>
                    <div className="text-[10px] bg-indigo-950 text-indigo-400 border border-indigo-900 px-2 py-1 rounded font-bold">
                      Authenticate
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowRegisterForm(true)}
                className="w-full border border-dashed border-slate-850 hover:bg-slate-800/40 hover:border-slate-700 transition-all rounded-xl py-2 px-4 text-xs font-bold text-slate-400 hover:text-white flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Register New staff profile
              </button>
            </>
          )}

          <p className="text-[9px] text-slate-500">
            Secure administrative console. EZIBECK'S ACADEMY Academic Office delta-terminal.
          </p>
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
        <div className="max-w-6xl mx-auto mb-6 bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 flex items-center gap-3 text-emerald-900 animate-slide-in print:hidden">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-xs font-bold">{successMsg}</p>
        </div>
      )}

      {/* Roster & Editable Workspace Template navigation bar */}
      {!viewingReportStudent && !editingStudent && (
        <div className="max-w-6xl mx-auto mb-6 flex gap-2 border-b border-slate-200 pb-px print:hidden">
          <button
            onClick={() => setActiveSubTab('roster')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${activeSubTab === 'roster' ? 'border-slate-900 text-slate-900 font-black' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            📂 Students Registry Roster
          </button>
          <button
            onClick={() => setActiveSubTab('workspace')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${activeSubTab === 'workspace' ? 'border-slate-900 text-slate-900 font-black' : 'border-transparent text-slate-400 hover:text-slate-650'}`}
          >
            ⚙️ Workspace Config Template (15 properties)
          </button>
        </div>
      )}

      {/* Main Container Workspace */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 gap-8">
        
        {/* VIEW 1: ACTIVE STUDENT ROW EDITOR MODE */}
        {viewingReportStudent ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white border border-slate-100 rounded-2xl px-5 py-4 print:hidden shadow-xs border-slate-200">
              <button
                onClick={() => setViewingReportStudent(null)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:bg-slate-50 border cursor-pointer text-slate-700"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Roster
              </button>
              <button
                onClick={() => window.print()}
                className="bg-indigo-700 hover:bg-indigo-805 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Report Sheet
              </button>
            </div>

            {/* Notion Style Report Sheet Card */}
            {(() => {
              const stats = calculateStudentStats(viewingReportStudent);
              return (
                <div 
                  className="bg-white border border-slate-205 rounded-3xl shadow-xl p-6 sm:p-12 space-y-8 relative print:border-none print:shadow-none print:p-0 print:m-0 animate-fade-in text-slate-800"
                >
                  {/* Print layout decorator line */}
                  <div className="absolute inset-3 border border-slate-100 rounded-2xl pointer-events-none print:hidden"></div>

                  {/* Notion Style Header Breadcrumbs */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-400 border-b border-slate-100/70 pb-3 mb-2 relative z-10 select-none">
                    <span>🏫 {template.schoolName}</span>
                    <span>/</span>
                    <span>📁 Report Registry</span>
                    <span>/</span>
                    <span>👥 {viewingReportStudent.className} Streams</span>
                    <span>/</span>
                    <span className="text-slate-700 font-semibold">📄 {viewingReportStudent.name}</span>
                  </div>

                  {/* Notion Top Cover Band */}
                  <div className="relative h-28 w-full bg-slate-100 rounded-2xl overflow-hidden mb-6 border border-slate-100 print:hidden select-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-200/50 via-indigo-50/10 to-slate-100"></div>
                    <div className="absolute top-2 right-3 text-[10px] bg-white/70 backdrop-blur-xs px-2 py-0.5 rounded text-slate-400 font-bold tracking-wider uppercase">Cover Slate</div>
                  </div>

                  {/* Overlapping Page Emoji Icon & School Identification */}
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-start gap-4 -mt-12 sm:-mt-14 print:mt-0 select-none">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center text-3xl sm:text-4xl">
                        📒
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <h1 className="text-2xl sm:text-3.5xl font-black text-slate-900 tracking-tight leading-none uppercase">
                        {template.schoolName}
                      </h1>
                      <p className="text-[11px] uppercase tracking-wider text-indigo-700 font-bold flex items-center gap-1.5 select-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                        Motto: {template.motto}
                      </p>
                      <p className="text-slate-500 text-[10px] sm:text-[11px] leading-relaxed">
                        <strong>Registered Address:</strong> {template.address} | <strong>Phone:</strong> {template.phone} | <strong>Email:</strong> {template.email}
                      </p>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Dynamic Official Page Heading */}
                    <div className="py-2.5">
                      <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight leading-none uppercase flex items-center gap-2">
                        <span className="inline-block px-2.5 py-1 bg-slate-900 text-slate-100 text-[10px] font-black rounded-md tracking-wider">OFFICIAL STATUS</span>
                        STUDENT’S TERMLY REPORT SHEET FOR {viewingReportStudent.className.startsWith('JSS') ? 'JUNIOR' : 'SENIOR'} SECONDARY SCHOOL
                      </h2>
                    </div>
                  </div>

                  {/* Database Properties Box: Student Info */}
                  <div className="relative z-10 border border-slate-200/80 rounded-2xl bg-[#FCFCFC]/80 divide-y divide-slate-100 shadow-3xs">
                    <div className="bg-[#FAF9F9] px-4 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 select-none">
                      <span>📋 Student Properties Collection View</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-3.5 gap-x-6 p-4 sm:p-5 text-xs text-slate-700">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <span className="font-semibold text-slate-400 select-none flex items-center gap-1.5 w-1/2">
                          <span>📝</span> Student Name
                        </span>
                        <span className="font-extrabold text-slate-900 text-right w-1/2 truncate">{viewingReportStudent.name}</span>
                      </div>

                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <span className="font-semibold text-slate-400 select-none flex items-center gap-1.5 w-1/2">
                          <span>🔑</span> Student ID
                        </span>
                        <span className="font-mono font-bold text-indigo-700 text-right w-1/2">{viewingReportStudent.id}</span>
                      </div>

                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <span className="font-semibold text-slate-400 select-none flex items-center gap-1.5 w-1/2">
                          <span>🏫</span> Class Stream
                        </span>
                        <span className="font-extrabold text-slate-900 text-right w-1/2">{viewingReportStudent.className} Stream</span>
                      </div>

                      <div className="flex items-center justify-between border-b border-slate-200/40 pb-1.5 sm:border-0 sm:pb-0">
                        <span className="font-semibold text-slate-400 select-none flex items-center gap-1.5 w-1/2">
                          <span>🧬</span> Sex / Gender
                        </span>
                        <span className="font-bold text-slate-800 text-right w-1/2">{viewingReportStudent.sex}</span>
                      </div>

                      <div className="flex items-center justify-between border-b border-slate-200/40 pb-1.5 sm:border-0 sm:pb-0">
                        <span className="font-semibold text-slate-400 select-none flex items-center gap-1.5 w-1/2">
                          <span>🎂</span> Age Profile
                        </span>
                        <span className="font-bold text-slate-800 text-right w-1/2">{viewingReportStudent.age} Years</span>
                      </div>

                      <div className="flex items-center justify-between border-b border-slate-200/40 pb-1.5 sm:border-0 sm:pb-0">
                        <span className="font-semibold text-slate-400 select-none flex items-center gap-1.5 w-1/2">
                          <span>📅</span> Report Date
                        </span>
                        <span className="font-bold text-slate-800 text-right w-1/2">{template.termDate}</span>
                      </div>

                      <div className="flex items-center justify-between border-b border-slate-200/40 pb-1.5 lg:border-0 lg:pb-0">
                        <span className="font-semibold text-slate-400 select-none flex items-center gap-1.5 w-1/2">
                          <span>🗓️</span> Academic Session
                        </span>
                        <span className="font-extrabold text-slate-900 text-right w-1/2">{template.session}</span>
                      </div>

                      <div className="flex items-center justify-between border-b border-slate-200/40 pb-1.5 lg:border-0 lg:pb-0">
                        <span className="font-semibold text-slate-400 select-none flex items-center gap-1.5 w-1/2">
                          <span>🚌</span> Attendance Present
                        </span>
                        <span className="font-bold text-slate-800 text-right w-1/2">{viewingReportStudent.attendancePresent} / {viewingReportStudent.attendanceTotal} sessions</span>
                      </div>

                      <div className="flex items-center justify-between lg:border-0">
                        <span className="font-semibold text-slate-400 select-none flex items-center gap-1.5 w-1/2">
                          <span>🔄</span> Resumption Date
                        </span>
                        <span className="font-extrabold text-indigo-750 text-right w-1/2">{template.resumptionDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Part A: Academic Course Evaluation */}
                  <div className="relative z-10 space-y-4">
                    <h3 className="text-slate-900 font-extrabold text-xs uppercase tracking-widest border-l-4 border-slate-900 pl-2.5 pb-0.5 flex items-center justify-between select-none">
                      <span>Part A: Academic Course Evaluation</span>
                      <span className="text-[10px] text-slate-400 normal-case font-bold mt-[-4px]">Standard Formula Matrix Layout</span>
                    </h3>
                    
                    {/* Notion-style database table */}
                    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-3xs">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
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
                              <span className="flex items-center justify-center gap-1 text-indigo-750">Σ TERM (100)</span>
                            </th>
                            <th className="py-2.5 px-3 border-r border-slate-200 text-center text-[10px] w-20">
                              <span className="flex items-center justify-center gap-1"># 1ST TERM (20)</span>
                            </th>
                            <th className="py-2.5 px-3 border-r border-slate-200 text-center text-[10px] w-20">
                              <span className="flex items-center justify-center gap-1"># 2ND TERM (20)</span>
                            </th>
                            <th className="py-2.5 px-3 border-r border-slate-205 text-center text-[10px] w-20">
                              <span className="flex items-center justify-center gap-1"># 3RD TERM (60)</span>
                            </th>
                            <th className="py-2.5 px-3 border-r border-slate-200 text-center bg-indigo-50/20 w-28">
                              <span className="flex items-center justify-center gap-1 text-slate-850 font-bold">Σ SESSION AVE</span>
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
                          {viewingReportStudent.subjects.map(subj => {
                            const tot = calculateSubjectTotal(subj);
                            const { letter, remark, ratingClass } = getLetterAndRemark(tot);
                            
                            // Formulate annual / session average data realistically matching the 20/20/60 formula of Notion
                            const firstTerm = subj.firstTermSummary !== undefined ? subj.firstTermSummary : Math.round(tot * 0.18);
                            const secondTerm = subj.secondTermSummary !== undefined ? subj.secondTermSummary : Math.round(tot * 0.19);
                            const thirdTerm = subj.thirdTermSummary !== undefined ? subj.thirdTermSummary : Math.round(tot * 0.60);
                            const sessionAvg = firstTerm + secondTerm + thirdTerm;

                            return (
                              <tr key={subj.id} className="hover:bg-slate-50/60 transition-all">
                                <td className="py-2.5 px-3 border-r border-slate-100 font-extrabold text-slate-1000 bg-slate-50/20">{subj.name}</td>
                                <td className="py-2.5 px-3 border-r border-slate-100 text-center font-mono text-slate-500">{subj.testScore}</td>
                                <td className="py-2.5 px-3 border-r border-slate-100 text-center font-mono text-slate-500">{subj.examScore}</td>
                                <td className="py-2.5 px-3 border-r border-slate-100 text-center font-black font-mono text-indigo-755 bg-indigo-50/20">{tot}</td>
                                <td className="py-2.5 px-3 border-r border-slate-100 text-center font-mono text-slate-450">{firstTerm}</td>
                                <td className="py-2.5 px-3 border-r border-slate-100 text-center font-mono text-slate-450">{secondTerm}</td>
                                <td className="py-2.5 px-3 border-r border-slate-100 text-center font-mono text-slate-450">{thirdTerm}</td>
                                <td className="py-2.5 px-3 border-r border-slate-100 text-center font-black font-mono text-indigo-700 bg-slate-50/40">{sessionAvg}</td>
                                <td className="py-2.5 px-3 border-r border-slate-100 text-center">
                                  <span className={`px-2 py-0.5 text-[10px] font-black rounded-sm tracking-wider ${ratingClass}`}>
                                    {letter}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 border-r border-slate-100 text-center font-bold text-slate-600 bg-slate-50/20">{subj.position ? `${subj.position}` : '-'}</td>
                                <td className="py-2.5 px-4 italic text-slate-500 text-[11px] font-normal leading-tight">{remark} performance</td>
                              </tr>
                            );
                          })}

                          {/* Calculation Footer */}
                          <tr className="bg-[#FAF9F9]/90 border-t border-slate-205 text-slate-400 font-medium select-none text-[10px] uppercase tracking-wider divide-x divide-slate-100">
                            <td className="py-2 px-3 font-semibold text-slate-500">
                              Count: {viewingReportStudent.subjects.length}
                            </td>
                            <td className="py-2 px-3 text-center font-bold">
                              Average: {(() => {
                                const tCount = viewingReportStudent.subjects.length || 1;
                                const testSum = viewingReportStudent.subjects.reduce((sum, s) => sum + (s.testScore || 0), 0);
                                return (testSum / tCount).toFixed(1);
                              })()}
                            </td>
                            <td className="py-2 px-3 text-center font-bold">
                              Average: {(() => {
                                const tCount = viewingReportStudent.subjects.length || 1;
                                const examSum = viewingReportStudent.subjects.reduce((sum, s) => sum + (s.examScore || 0), 0);
                                return (examSum / tCount).toFixed(1);
                              })()}
                            </td>
                            <td className="py-2 px-3 text-center font-black text-indigo-705 bg-indigo-50/20">
                              Average: {stats.avgScore.toFixed(1)}%
                            </td>
                            <td className="py-2 px-3 text-center font-bold">
                              Average: {(() => {
                                const tCount = viewingReportStudent.subjects.length || 1;
                                const fSum = viewingReportStudent.subjects.reduce((sum, s) => sum + (s.firstTermSummary !== undefined ? s.firstTermSummary : Math.round(calculateSubjectTotal(s) * 0.18)), 0);
                                return (fSum / tCount).toFixed(1);
                              })()}
                            </td>
                            <td className="py-2 px-3 text-center font-bold">
                              Average: {(() => {
                                const tCount = viewingReportStudent.subjects.length || 1;
                                const sSum = viewingReportStudent.subjects.reduce((sum, s) => sum + (s.secondTermSummary !== undefined ? s.secondTermSummary : Math.round(calculateSubjectTotal(s) * 0.19)), 0);
                                return (sSum / tCount).toFixed(1);
                              })()}
                            </td>
                            <td className="py-2 px-3 text-center font-bold">
                              Average: {(() => {
                                const tCount = viewingReportStudent.subjects.length || 1;
                                const thSum = viewingReportStudent.subjects.reduce((sum, s) => sum + (s.thirdTermSummary !== undefined ? s.thirdTermSummary : Math.round(calculateSubjectTotal(s) * 0.60)), 0);
                                return (thSum / tCount).toFixed(1);
                              })()}
                            </td>
                            <td className="py-2 px-3 text-center font-black bg-slate-100/50">
                              Average: {(() => {
                                const tCount = viewingReportStudent.subjects.length || 1;
                                const sessionSum = viewingReportStudent.subjects.reduce((sum, s) => {
                                  const totVal = calculateSubjectTotal(s);
                                  const f = s.firstTermSummary !== undefined ? s.firstTermSummary : Math.round(totVal * 0.18);
                                  const sec = s.secondTermSummary !== undefined ? s.secondTermSummary : Math.round(totVal * 0.19);
                                  const th = s.thirdTermSummary !== undefined ? s.thirdTermSummary : Math.round(totVal * 0.60);
                                  return sum + (f + sec + th);
                                }, 0);
                                return (sessionSum / tCount).toFixed(1);
                              })()}%
                            </td>
                            <td className="py-2 px-3" colSpan={3}></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Sub-Score KPI Dashboard metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10 select-none text-slate-800">
                    <div className="bg-[#FAF9F9] border border-slate-150 p-4 rounded-xl text-center space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Cumulative Total</span>
                      <p className="font-extrabold text-slate-900 text-base leading-none">
                        {stats.totalScore} <span className="text-xs text-slate-400 font-normal">/ {stats.maxPossibleScore}</span>
                      </p>
                    </div>

                    <div className="bg-[#FAF9F9] border border-slate-150 p-4 rounded-xl text-center space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Termly Average</span>
                      <p className="font-extrabold text-slate-900 text-base leading-none">
                        {stats.avgScore.toFixed(1)}%
                      </p>
                    </div>

                    <div className="bg-[#FAF9F9] border border-slate-150 p-4 rounded-xl text-center space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Calculated GPA</span>
                      <p className="font-extrabold text-indigo-700 text-base leading-none">
                        {stats.gpa} <span className="text-[10px] text-slate-400 font-normal">/ 5.0</span>
                      </p>
                    </div>

                    <div className="bg-[#FAF9F9] border border-slate-150 p-4 rounded-xl text-center space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Attendance Record</span>
                      <p className="font-extrabold text-emerald-600 text-base leading-none">
                        {Math.round(viewingReportStudent.attendancePresent / viewingReportStudent.attendanceTotal * 100)}% <span className="text-[10px] text-slate-400 font-semibold">Present</span>
                      </p>
                    </div>
                  </div>

                  {/* Part B: Character Assessment */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
                    <div className="lg:col-span-6 bg-[#FCFCFC]/60 border border-slate-150 p-5 rounded-2xl space-y-3.5 shadow-3xs">
                      <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-widest border-l-4 border-indigo-600 pl-2 select-none">
                        Part B: Character & Behavioral Conduct
                      </h4>

                      <div className="grid grid-cols-1 xs:grid-cols-2 gap-x-5 gap-y-2 text-xs text-slate-800">
                        {viewingReportStudent.behaviour.map(b => (
                          <div key={b.name} className="flex items-center justify-between py-1 border-b border-dashed border-slate-150">
                            <span className="font-semibold text-slate-600">{b.name}</span>
                            <span className="font-mono font-black text-[10px] text-indigo-755 bg-indigo-50 border border-indigo-100/60 px-1.5 py-0.5 rounded-md">
                              {b.rating} / 5
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right Column Index Guides */}
                    <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5 text-slate-800">
                        <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-widest border-l-4 border-slate-900 pl-2 select-none">
                          Grades Index Card
                        </h4>
                        <div className="border border-slate-150 rounded-xl overflow-hidden shadow-3xs">
                          <table className="w-full text-[10px] text-left border-collapse text-slate-650">
                            <thead>
                              <tr className="bg-[#FAF9F9] border-b border-slate-150 font-bold select-none text-slate-500">
                                <th className="py-1.5 px-2.5 border-r border-slate-150 w-16">Grade</th>
                                <th className="py-1.5 px-2.5">Details</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                              <tr className="hover:bg-slate-50/50">
                                <td className="py-1.5 px-2.5 border-r border-slate-155 font-bold text-slate-800 bg-emerald-50 text-[10px] text-emerald-700 animate-fade-in">A+</td>
                                <td className="py-1.5 px-2.5">Distinction 90 - 100</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50">
                                <td className="py-1.5 px-2.5 border-r border-slate-155 font-bold text-slate-800 bg-green-50 text-[10px] text-green-700">A</td>
                                <td className="py-1.5 px-2.5">Excellent 80 - 89</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50">
                                <td className="py-1.5 px-2.5 border-r border-slate-155 font-bold text-slate-800 bg-sky-50 text-[10px] text-sky-700">B</td>
                                <td className="py-1.5 px-2.5">Very Good 70 - 79</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50">
                                <td className="py-1.5 px-2.5 border-r border-slate-155 font-bold text-slate-800 bg-amber-50 text-[10px] text-amber-500">C</td>
                                <td className="py-1.5 px-2.5">Good 60 - 69</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50">
                                <td className="py-1.5 px-2.5 border-r border-slate-155 font-bold text-slate-800 bg-orange-50 text-[10px] text-orange-600">D</td>
                                <td className="py-1.5 px-2.5">Pass 50 - 59</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50">
                                <td className="py-1.5 px-2.5 border-r border-slate-155 font-bold text-slate-800 bg-red-50 text-[10px] text-red-500">F</td>
                                <td className="py-1.5 px-2.5">Fail Below 50</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5 text-slate-850">
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
                            <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-705 text-[10px] flex items-center justify-center font-mono">3</span>
                            <span>Satisfactory Conduct</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-amber-50 text-amber-550 text-[10px] flex items-center justify-center font-mono">2</span>
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
                      const displayTeacherName = viewingReportStudent.className.startsWith('JSS') ? template.formTeacherJunior : template.formTeacherSenior;
                      const displayPrincipalName = template.principalName;
                      return (
                        <>
                          <div className="bg-[#FAF9F9] border border-slate-200 p-5 rounded-2xl space-y-4 flex flex-col justify-between shadow-3xs text-slate-800 text-xs">
                            <div>
                              <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-200/50 pb-1.5 select-none flex items-center gap-1.5">
                                <span>💬 Form Teacher's Appraisal</span>
                              </h4>
                              <p className="italic text-slate-600 pt-3 leading-relaxed">
                                "{viewingReportStudent.formTeacherRemark}"
                              </p>
                            </div>
                            
                            <div className="border-t border-slate-200 pt-3 flex justify-between items-end">
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-extrabold select-none font-sans">Appraiser</span>
                                <p className="font-black text-slate-900 font-sans">{displayTeacherName}</p>
                              </div>
                              <div className="text-right select-none">
                                <div className="text-sm font-serif italic text-indigo-950 font-semibold h-5 tracking-wide">
                                  {displayTeacherName.replace("Mrs.", "").replace("Mr.","").trim()}
                                </div>
                                <span className="text-[8px] text-slate-400 uppercase tracking-wider block border-t border-slate-200 pt-0.5 mt-0.5">Signature & Stamp</span>
                              </div>
                            </div>
                          </div>

                          {/* Principal Assessment Callout */}
                          <div className="bg-[#FAF9F9] border border-slate-200 p-5 rounded-2xl space-y-4 flex flex-col justify-between shadow-3xs text-slate-800 text-xs">
                            <div>
                              <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-200/50 pb-1.5 select-none flex items-center gap-1.5">
                                <span>🎓 Principal's Performance Assessment</span>
                              </h4>
                              <p className="italic text-slate-600 pt-3 leading-relaxed">
                                {viewingReportStudent.formTeacherRemark.includes("outstanding") || stats.avgScore >= (template.distinctionThreshold || 90)
                                  ? `"Highly commendable academic and behavioral character shown during the term session. Excellent candidate. Promoted with honor."`
                                  : stats.avgScore >= (template.passThreshold || 50)
                                    ? `"Satisfactory progress. Continued focus on core concepts will serve candidate well. Promoted."`
                                    : `"Needs close guidance and study supervision in future sessions to ensure passing criteria."`}
                              </p>
                            </div>

                            <div className="border-t border-slate-200 pt-3 flex justify-between items-end">
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-extrabold select-none">Authorized Principal</span>
                                <p className="font-black text-slate-900">{displayPrincipalName}</p>
                              </div>
                              <div className="text-right select-none">
                                <div className="text-sm font-serif italic text-indigo-950 font-semibold h-5 tracking-wide">
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
        ) : editingStudent ? (
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
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Student Access Password</label>
                <input
                  type="text"
                  placeholder="Default: 123456"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="bg-white border rounded p-1.5 w-full font-bold text-indigo-700 outline-none text-center font-mono"
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
            <div className="border-t pt-6 mt-8 flex justify-end gap-3 print:hidden">
              <button
                onClick={() => setEditingStudent(null)}
                className="border border-slate-350 hover:bg-slate-50 text-slate-600 font-bold text-xs px-6 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap"
              >
                Discard Changes
              </button>
              <button
                onClick={saveStudentChanges}
                className="bg-indigo-900 hover:bg-indigo-950 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-indigo-900/10 cursor-pointer whitespace-nowrap"
              >
                <Save className="w-4 h-4" /> Save Score Updates
              </button>
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

                const stats = calculateStudentStats(previewStudent);
                
                return (
                  <div 
                    className="bg-white border border-slate-205 rounded-3xl shadow-lg p-6 sm:p-12 space-y-8 relative text-slate-800 pointer-events-none select-none max-w-5xl mx-auto"
                  >
                    {/* Visual slate borders */}
                    <div className="absolute inset-3 border border-slate-100 rounded-2xl pointer-events-none"></div>

                    {/* Notion Style Header Breadcrumbs */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-400 border-b border-slate-100/70 pb-3 mb-2 relative z-10">
                      <span>🏫 {SCHOOL_INFO.name}</span>
                      <span>/</span>
                      <span>📁 Draft Sandbox</span>
                      <span>/</span>
                      <span>👥 {previewStudent.className} Streams</span>
                      <span>/</span>
                      <span className="text-slate-700 font-semibold">📄 {previewStudent.name}</span>
                    </div>

                    {/* Notion Top Cover Band */}
                    <div className="relative h-24 w-full bg-slate-55 rounded-2xl overflow-hidden mb-6 border border-slate-100">
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-200/40 via-indigo-50/10 to-slate-100"></div>
                    </div>

                    {/* Overlapping Page Emoji Icon & School Identification */}
                    <div className="relative z-10 space-y-4">
                      <div className="flex items-start gap-4 -mt-10 sm:-mt-12">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-xl border border-slate-200 shadow-3xs flex items-center justify-center text-2xl sm:text-3xl">
                          📒
                        </div>
                      </div>

                      <div className="space-y-1.5 text-left">
                        <h1 className="text-xl sm:text-2.5xl font-black text-slate-900 tracking-tight leading-none uppercase">
                          {SCHOOL_INFO.name}
                        </h1>
                        <p className="text-[10px] uppercase tracking-wider text-indigo-700 font-bold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-650"></span>
                          Motto: {SCHOOL_INFO.motto}
                        </p>
                        <p className="text-slate-500 text-[10px] leading-relaxed">
                          <strong>Registered Address:</strong> {SCHOOL_INFO.address}
                        </p>
                      </div>

                      <hr className="border-slate-100" />

                      {/* Official status banner title */}
                      <div className="py-1">
                        <h2 className="text-xs sm:text-sm font-extrabold text-slate-805 tracking-tight uppercase flex items-center gap-2">
                          <span className="inline-block px-2 py-0.5 bg-indigo-900 text-white text-[9px] font-black rounded tracking-wider">WORKING DRAFT</span>
                          STUDENT’S TERMLY REPORT SHEET FOR {previewStudent.className.startsWith('JSS') ? 'JUNIOR' : 'SENIOR'} SECONDARY SCHOOL
                        </h2>
                      </div>
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
                          <span className="font-mono font-bold text-indigo-700 text-right w-1/2">{previewStudent.id}</span>
                        </div>

                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <span className="font-semibold text-slate-400 flex items-center gap-1.5 w-1/2">
                            <span>🏫</span> Class Stream
                          </span>
                          <span className="font-extrabold text-slate-900 text-right w-1/2">{previewStudent.className} Stream</span>
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
                          <span className="font-bold text-slate-805 text-right w-1/2">{previewStudent.termDate}</span>
                        </div>

                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 lg:border-0 lg:pb-0">
                          <span className="font-semibold text-slate-400 flex items-center gap-1.5 w-1/2">
                            <span>🗓️</span> Academic Session
                          </span>
                          <span className="font-extrabold text-slate-900 text-right w-1/2">{previewStudent.session}</span>
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
                          <span className="font-extrabold text-indigo-750 text-right w-1/2">{previewStudent.resumptionDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Part A: Academic Course Evaluation */}
                    <div className="relative z-10 space-y-4">
                      <h3 className="text-slate-900 font-extrabold text-xs uppercase tracking-widest border-l-4 border-slate-900 pl-2.5 pb-0.5 flex items-center justify-between">
                        <span>Part A: Academic Course Evaluation</span>
                      </h3>
                      
                      {/* Notion Table draft view */}
                      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-3xs">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-[#F7F7F7] border-b border-slate-200 text-slate-500 font-medium text-[10.5px]">
                              <th className="py-2.5 px-3 border-r border-slate-200 min-w-[150px]">📝 Subjects</th>
                              <th className="py-2.5 px-3 border-r border-slate-200 text-center w-24"># TEST (30)</th>
                              <th className="py-2.5 px-3 border-r border-slate-200 text-center w-24"># EXAM (70)</th>
                              <th className="py-2.5 px-3 border-r border-slate-200 text-center bg-indigo-50/20 w-24 text-indigo-750">Σ TERM (100)</th>
                              <th className="py-2.5 px-3 border-r border-slate-200 text-center text-[10px] w-20"># 1ST TERM</th>
                              <th className="py-2.5 px-3 border-r border-slate-200 text-center text-[10px] w-20"># 2ND TERM</th>
                              <th className="py-2.5 px-3 border-r border-slate-205 text-center text-[10px] w-20"># 3RD TERM</th>
                              <th className="py-2.5 px-3 border-r border-slate-200 text-center bg-indigo-50/10 w-28 text-slate-800 font-bold">Σ SESSION AVE</th>
                              <th className="py-2.5 px-3 border-r border-slate-200 text-center w-20">Σ GRADE</th>
                              <th className="py-2.5 px-3 border-r border-slate-200 text-center w-16"># RANK</th>
                              <th className="py-2.5 px-4 font-bold text-slate-500">💬 TEACHER'S REMARK</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {previewStudent.subjects.map(subj => {
                              const tot = calculateSubjectTotal(subj);
                              const { letter, remark, ratingClass } = getLetterAndRemark(tot);
                              
                              const firstTerm = subj.firstTermSummary !== undefined ? subj.firstTermSummary : Math.round(tot * 0.18);
                              const secondTerm = subj.secondTermSummary !== undefined ? subj.secondTermSummary : Math.round(tot * 0.19);
                              const thirdTerm = subj.thirdTermSummary !== undefined ? subj.thirdTermSummary : Math.round(tot * 0.60);
                              const sessionAvg = firstTerm + secondTerm + thirdTerm;

                              return (
                                <tr key={subj.id} className="hover:bg-slate-50/60 transition-all">
                                  <td className="py-2.5 px-3 border-r border-slate-100 font-extrabold text-slate-1000 bg-slate-50/20">{subj.name}</td>
                                  <td className="py-2.5 px-3 border-r border-slate-100 text-center font-mono text-slate-550">{subj.testScore}</td>
                                  <td className="py-2.5 px-3 border-r border-slate-100 text-center font-mono text-slate-550">{subj.examScore}</td>
                                  <td className="py-2.5 px-3 border-r border-slate-100 text-center font-black font-mono text-indigo-755 bg-indigo-50/20">{tot}</td>
                                  <td className="py-2.5 px-3 border-r border-slate-100 text-center font-mono text-slate-450">{firstTerm}</td>
                                  <td className="py-2.5 px-3 border-r border-slate-100 text-center font-mono text-slate-450">{secondTerm}</td>
                                  <td className="py-2.5 px-3 border-r border-slate-100 text-center font-mono text-slate-450">{thirdTerm}</td>
                                  <td className="py-2.5 px-3 border-r border-slate-100 text-center font-black font-mono text-indigo-700 bg-slate-50/40">{sessionAvg}</td>
                                  <td className="py-2.5 px-3 border-r border-slate-100 text-center">
                                    <span className={`px-2 py-0.5 text-[10px] font-black rounded-sm tracking-wider ${ratingClass}`}>
                                      {letter}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 border-r border-slate-100 text-center font-bold text-slate-600 bg-slate-50/20">{subj.position ? `${subj.position}` : '-'}</td>
                                  <td className="py-2.5 px-4 italic text-slate-500 text-[11px] font-normal leading-tight">{remark} performance</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* KPI Widget Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10 text-slate-800">
                      <div className="bg-[#FAF9F9] border border-slate-150 p-4 rounded-xl text-center space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Cumulative Total</span>
                        <p className="font-extrabold text-slate-900 text-base leading-none">
                          {stats.totalScore} <span className="text-xs text-slate-400 font-normal">/ {stats.maxPossibleScore}</span>
                        </p>
                      </div>

                      <div className="bg-[#FAF9F9] border border-slate-150 p-4 rounded-xl text-center space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Termly Average</span>
                        <p className="font-extrabold text-slate-900 text-base leading-none">
                          {stats.avgScore.toFixed(1)}%
                        </p>
                      </div>

                      <div className="bg-[#FAF9F9] border border-slate-150 p-4 rounded-xl text-center space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Calculated GPA</span>
                        <p className="font-extrabold text-indigo-700 text-base leading-none">
                          {stats.gpa} <span className="text-[10px] text-slate-400 font-normal">/ 5.0</span>
                        </p>
                      </div>

                      <div className="bg-[#FAF9F9] border border-slate-150 p-4 rounded-xl text-center space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Attendance Record</span>
                        <p className="font-extrabold text-emerald-600 text-base leading-none">
                          {Math.round(previewStudent.attendancePresent / previewStudent.attendanceTotal * 100) || 0}% <span className="text-[10px] text-slate-400 font-semibold">Present</span>
                        </p>
                      </div>
                    </div>

                    {/* Behavioral & Conduct assessment Part B */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
                      <div className="lg:col-span-12 bg-[#FCFCFC]/60 border border-slate-150 p-5 rounded-2xl space-y-3.5 shadow-3xs">
                        <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-widest border-l-4 border-indigo-600 pl-2">
                          Part B: Character & Behavioral Conduct Ratings
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-2 text-xs text-slate-800">
                          {previewStudent.behaviour.map(b => (
                            <div key={b.name} className="flex items-center justify-between py-1 border-b border-dashed border-slate-150">
                              <span className="font-semibold text-slate-600 text-left truncate max-w-[200px]">{b.name}</span>
                              <span className="font-mono font-black text-[10px] text-indigo-755 bg-indigo-50 border border-indigo-100/60 px-1.5 py-0.5 rounded-md">
                                {b.rating} / 5
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Part C: Appraisals and Signatures */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 pt-6 border-t border-dashed border-slate-200">
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
                        
                        <div className="border-t border-slate-200 pt-3 flex justify-between items-end">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-extrabold">Appraiser</span>
                            <p className="font-black text-slate-900">{previewStudent.formTeacherName}</p>
                          </div>
                        </div>
                      </div>

                      {/* Principal Assessment Callout */}
                      <div className="bg-[#FAF9F9] border border-slate-200 p-5 rounded-2xl space-y-4 flex flex-col justify-between shadow-3xs text-slate-800 text-xs text-left">
                        <div>
                          <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-200/50 pb-1.5 flex items-center gap-1.5">
                            <span>🎓 Principal's Performance Assessment</span>
                          </h4>
                          <p className="italic text-slate-600 pt-3 leading-relaxed">
                            {previewStudent.formTeacherRemark.includes("outstanding") || stats.avgScore >= 75
                              ? `"Highly commendable academic and behavioral character shown during the term session. Excellent candidate. Promoted with honor."`
                              : stats.avgScore >= 50
                                ? `"Satisfactory progress. Continued focus on core concepts will serve candidate well. Promoted."`
                                : `"Needs close guidance and study supervision in future sessions to ensure passing criteria."`}
                          </p>
                        </div>

                        <div className="border-t border-slate-200 pt-3 flex justify-between items-end">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-extrabold">Authorized Principal</span>
                            <p className="font-black text-slate-900">{previewStudent.principalName}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        ) : activeSubTab === 'workspace' ? (
          /* VIEW 3: WORKSPACE 15 PROPERTIES EDITABLE TEMPLATE FOR TEACHERS */
          <div className="bg-white border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm animate-fade-in text-slate-800">
            <div className="border-b pb-4">
              <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-md">
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
                  nextTermFee: tempNextTermFee,
                  distinctionThreshold: Number(tempDistinctionThreshold),
                  passThreshold: Number(tempPassThreshold),
                });
                triggerSuccess('Scholastic report template settings (15 properties) successfully saved!');
              }}
              className="space-y-6 text-xs"
            >
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
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Current Term</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Third Term"
                      value={tempCurrentTerm}
                      onChange={(e) => setTempCurrentTerm(e.target.value)}
                      className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Next Term School Fees (₦)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ₦120,000"
                      value={tempNextTermFee}
                      onChange={(e) => setTempNextTermFee(e.target.value)}
                      className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none font-bold text-indigo-700 font-mono text-center"
                    />
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
                  <div>
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
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Junior College Advisor (JSS)</label>
                    <input
                      type="text"
                      required
                      value={tempFormTeacherJunior}
                      onChange={(e) => setTempFormTeacherJunior(e.target.value)}
                      className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Senior College Advisor (SS)</label>
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

              {/* Form submit/save button */}
              <div className="pt-4 border-t flex justify-end">
                <button
                  type="submit"
                  className="bg-indigo-900 hover:bg-indigo-950 text-white font-extrabold text-[10px] tracking-wider uppercase px-6 py-3 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  ⚡ Save & Publish Workspace Template
                </button>
              </div>
            </form>
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
                        {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(y => (
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
                        onChange={(e) => setNewStudentPassword(e.target.value)}
                        className="w-full bg-white border p-2 text-xs rounded-lg outline-none font-mono font-black text-indigo-700 text-center"
                      />
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
                                onClick={() => setViewingReportStudent(stud)}
                                className="border border-slate-300 hover:border-indigo-600 hover:text-indigo-900 bg-white hover:bg-slate-50 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                              >
                                <Eye className="w-3.5 h-3.5" /> Print Preview
                              </button>
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
