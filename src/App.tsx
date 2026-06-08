/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import PublicHome from './components/PublicHome';
import StudentPortal from './components/StudentPortal';
import TeacherDashboard from './components/TeacherDashboard';
import { Student } from './types';
import { loadStoredStudents, saveStudents } from './utils/academicUtils';

export default function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [currentView, setCurrentView] = useState<'home' | 'student' | 'teacher'>('home');

  // Load initial dataset or persisted changes on component mount
  useEffect(() => {
    const loaded = loadStoredStudents();
    setStudents(loaded);
  }, []);

  // Update students roster and commit back to storage
  const handleUpdateStudents = (updatedList: Student[]) => {
    setStudents(updatedList);
    saveStudents(updatedList);
  };

  return (
    <div className="min-h-screen bg-slate-50 relative select-none">
      {/* Route Views Transition */}
      {currentView === 'home' && (
        <div className="fade-in animate-fade-in">
          <PublicHome onEnterPortal={(role) => setCurrentView(role)} />
        </div>
      )}

      {currentView === 'student' && (
        <div className="fade-in animate-fade-in">
          <StudentPortal 
            students={students} 
            onBack={() => setCurrentView('home')} 
          />
        </div>
      )}

      {currentView === 'teacher' && (
        <div className="fade-in animate-fade-in">
          <TeacherDashboard 
            students={students} 
            onBack={() => setCurrentView('home')} 
            onUpdateStudents={handleUpdateStudents}
          />
        </div>
      )}
    </div>
  );
}

