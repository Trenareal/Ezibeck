import React, { useState } from 'react';
import { 
  BookOpen, ChevronRight, GraduationCap, Award,
  UserCheck, Shield, CheckSquare, Printer, Info, X, Sparkles, Key
} from 'lucide-react';

interface GuidelinesComponentProps {
  onClose?: () => void;
  inlineOnly?: boolean;
  isPublic?: boolean;
}

export default function GuidelinesComponent({ onClose, inlineOnly = false, isPublic = false }: GuidelinesComponentProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'student' | 'teacher' | 'admin'>('overview');

  const tabs = [
    { id: 'overview', title: '📖 System Overview', bg: 'bg-emerald-50 text-emerald-800' },
    { id: 'student', title: '🎓 Student & Parent Portal', bg: 'bg-sky-50 text-sky-800' },
    ...(isPublic ? [] : [
      { id: 'teacher', title: '🏫 Staff & Teacher Desk', bg: 'bg-indigo-50 text-indigo-850' },
      { id: 'admin', title: '🛡️ Admin & Security', bg: 'bg-rose-50 text-rose-850' }
    ])
  ];

  const content = {
    overview: (
      <div className="space-y-6">
        <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex items-start gap-4">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 text-sm">EZIBECK Academics</h4>
            <p className="text-xs text-slate-650 mt-1 leading-relaxed">
              Welcome to our high-performance academic management ecosystem. Directed by our motto <span className="text-emerald-700 italic font-semibold">"Knowledge is Power"</span>, this platform integrates terminal scorecards, behavior monitoring, secure individual logins, and secure real-time online syncing.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h5 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">🌟 Core Pillars of the system</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl space-y-1.5">
              <span className="text-xs font-black text-slate-850 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                Dual-Sided Portals
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Distinct dashboards tailored specifically for student-parent view permissions vs. robust faculty management workstations.
              </p>
            </div>
            <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl space-y-1.5">
              <span className="text-xs font-black text-slate-850 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-500" />
                Passcode Security
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                No passwords to type or remember. Every student is issued a unique, system-generated 6-digit passcode for instant secure access.
              </p>
            </div>
            <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl space-y-1.5">
              <span className="text-xs font-black text-slate-850 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                Automatic Calculus
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Terminal report aggregates, grades (A to F), percentage averages, and competitive class rank rankings are fully automated on change.
              </p>
            </div>
            <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl space-y-1.5">
              <span className="text-xs font-black text-slate-850 flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-sky-600" />
                High-DPI PDF Exporter
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Render pixel-perfect terminal report sheets with stamps, signatures, official watermarks, and razor-sharp desktop sizing.
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
    student: (
      <div className="space-y-6">
        <div className="bg-sky-50 border border-sky-100 p-5 rounded-2xl">
          <h4 className="font-extrabold text-sky-905 text-sm flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-sky-700" />
            Student & Parent Reference Manual
          </h4>
          <p className="text-xs text-slate-650 mt-1 leading-relaxed">
            Follow this simple guide to access, review, and print terminal academic report cards from home.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-800 font-black text-xs flex items-center justify-center shrink-0">1</div>
            <div className="space-y-1">
              <h5 className="text-xs font-extrabold text-slate-850">Authenticate into the Portal</h5>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Navigate to the **Report Portal**. Select your active class (PRE-NURSERY to SS3). Click on your name in the directory, type in your unique 6-digit passcode/PIN, and hit **Access Report**.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-800 font-black text-xs flex items-center justify-center shrink-0">2</div>
            <div className="space-y-1">
              <h5 className="text-xs font-extrabold text-slate-850">Navigate Terminal Sessions</h5>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Use the upper tabs to toggle between **First Term**, **Second Term**, and **Third Term** scores. Note that historical scores are automatically synced in the cloud.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-800 font-black text-xs flex items-center justify-center shrink-0">3</div>
            <div className="space-y-1">
              <h5 className="text-xs font-extrabold text-slate-850">Interpret the Report Cards</h5>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Each report includes:
                <br />• **Academic Grades**: Test Score (max 30) + Exam Score (max 70) = Total Marks (max 100), accompanied by letter grades (A–FF) and positions.
                <br />• **Behavioral Ratings**: Detailed ratings (1 to 5 stars) across core neatness, cooperation, leadership, manners, and punctuality.
                <br />• **Attendance Indexes**: Number of days present out of the total term session.
                <br />• **Endorsements**: Personalized remarks from the Form Teacher and authorized Principal.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-800 font-black text-xs flex items-center justify-center shrink-0">4</div>
            <div className="space-y-1">
              <h5 className="text-xs font-extrabold text-slate-850">Export High-Quality PDF</h5>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Click **Print Preview (Eye Icon)** to render the full report card. Check all marks, then click **Download Official PDF**. The system will download a stamped desktop layout with authentic signatures and watermarks.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-800 font-black text-xs flex items-center justify-center shrink-0">5</div>
            <div className="space-y-1">
              <h5 className="text-xs font-extrabold text-slate-850">Passcode Recovery Setup</h5>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                If you have misplaced your passcode slip, select **Reset / OTP Passcode** on the verification modal. Supply your registered guardian emergency email to receive an instant recovery code. Alternatively, contact your class form teacher.
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
    teacher: (
      <div className="space-y-6">
        <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl">
          <h4 className="font-extrabold text-indigo-905 text-sm flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-705" />
            Class Tutor & Staff Desk Manual
          </h4>
          <p className="text-xs text-slate-650 mt-1 leading-relaxed">
            Professional guidelines for logging scores, evaluating traits, and configuring terminal metrics.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 font-black text-xs flex items-center justify-center shrink-0">1</div>
            <div className="space-y-1">
              <h5 className="text-xs font-extrabold text-slate-850">Update Score Sheets</h5>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Select your class roster. Click on a student to launch the **Active Row Editor**. Enter CA Marks (0-30) and Exam Marks (0-70). **Leaving a field blank defaults to 0**. Saving recalculates rank positions immediately.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 font-black text-xs flex items-center justify-center shrink-0">2</div>
            <div className="space-y-1">
              <h5 className="text-xs font-extrabold text-slate-850">Input Behavioral Traits</h5>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                In the student row editor, rate traits across: Punctuality, Neatness, Politeness, Cooperation, and Leadership. Use the 1 (Weakest) to 5 (Outstanding / Excellent) star buttons.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 font-black text-xs flex items-center justify-center shrink-0">3</div>
            <div className="space-y-1">
              <h5 className="text-xs font-extrabold text-slate-850">Configure Terminal Parameters (Workspace 15)</h5>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Click **Workspace** tab. You can configure school branding: Address, Email, Motto, Next Term Fees, active session (e.g. 2025/2026), terminal date boundaries, distinction margins, or pass thresholds.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 font-black text-xs flex items-center justify-center shrink-0">4</div>
            <div className="space-y-1">
              <h5 className="text-xs font-extrabold text-slate-850">Batch CSV Imports & Excel Alignment</h5>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                To populate mock rosters instantly, click **CSV Imports** or download template files. Align columns with name, age, and sex parameters to upload class databases instantly.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 font-black text-xs flex items-center justify-center shrink-0">5</div>
            <div className="space-y-1">
              <h5 className="text-xs font-extrabold text-slate-850">Perform Backup Logs</h5>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Educators can download local backups of classroom score summaries by clicking on **Roster Backups** in zip files to prevent accidental deletion in the browser cache.
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
    admin: (
      <div className="space-y-6">
        <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl">
          <h4 className="font-extrabold text-rose-905 text-sm flex items-center gap-2">
            <Shield className="w-5 h-5 text-rose-705" />
            Administrator Control & Security Checklist
          </h4>
          <p className="text-xs text-slate-650 mt-1 leading-relaxed">
            Administrative tasks for user setup, security audits, portal lockouts, and passcard distribution.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 font-black text-xs flex items-center justify-center shrink-0">1</div>
            <div className="space-y-1">
              <h5 className="text-xs font-extrabold text-slate-850">Tutor Profile Protection</h5>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Go to the **Staff** panel (Admin Only). Configure individual staff profiles and restrict class permissions. E.g. Restricted Tutor is locked inside JSS1 view exclusively; preventing edits to senior classes.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 font-black text-xs flex items-center justify-center shrink-0">2</div>
            <div className="space-y-1">
              <h5 className="text-xs font-extrabold text-slate-850">Print Passcards in Batch Sheets</h5>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Admins click **Passcards** tab to render the printing layout. Scissor-cut along dashed guidelines to hand-out standard secure passcard slips containing individual login credentials.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 font-black text-xs flex items-center justify-center shrink-0">3</div>
            <div className="space-y-1">
              <h5 className="text-xs font-extrabold text-slate-850">Audit Master Ledger logs</h5>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Go to **Audit Logs** tab. View the full, immutable security list of who made modifications to student credentials, rolled over terms, completed resetting requests, or triggered self-OTP recovery.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 font-black text-xs flex items-center justify-center shrink-0">4</div>
            <div className="space-y-1">
              <h5 className="text-xs font-extrabold text-slate-850">Secure Lockout Toggles</h5>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Toggle **Portal Locked** switch in the Workspace tab. Locking prevents student portal access globally—perfect during test-taking, compilation phases, or school fees clearance audits.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  };

  const mainView = (
    <div className="bg-white rounded-3xl border border-slate-150/80 p-5 sm:p-8 space-y-6 text-left shadow-xs">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-850">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase">EZIBECK Academy Guidebook</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Comprehensive, dynamic user manual for students, staff, and admins</p>
          </div>
        </div>
        
        {onClose && (
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-150 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 min-w-[130px] text-center py-2 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              activeTab === tab.id 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.title}
          </button>
        ))}
      </div>

      {/* Active Tab Panel */}
      <div className="min-h-[250px] animate-fade-in">
        {content[activeTab]}
      </div>

      <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-[10px] text-slate-400 font-extrabold select-none">
        <span>Ezibeck College Faculty Systems</span>
        <span>Version 1.2 • Verified Stable</span>
      </div>
    </div>
  );

  if (inlineOnly) {
    return mainView;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-3xl transform transition-all animate-framer">
        {mainView}
      </div>
    </div>
  );
}
