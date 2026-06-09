/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import PublicHome from './components/PublicHome';
import StudentPortal from './components/StudentPortal';
import TeacherDashboard from './components/TeacherDashboard';
import { Student, Workspace15Template } from './types';
import { loadStoredStudents, saveStudents } from './utils/academicUtils';

const DEFAULT_WORKSPACE_15: Workspace15Template = {
  schoolName: "EZIBECK’S ACADEMY",
  motto: "Knowledge is Power",
  address: "No, 5 Ezibeck’s Crescent, Behind Udu Motor Park Ovwian, Delta State",
  phone: "+234 803 123 4567",
  email: "info@ezibeckacademy.edu.ng",
  resumptionDate: "2026-09-14",
  termDate: "2026-04-10",
  session: "2025/2026",
  principalName: "Dr. Ezekiel Beck",
  formTeacherJunior: "Mrs. Gladys Alabi",
  formTeacherSenior: "Mr. Anthony Okon",
  currentTerm: "Second Term",
  nextTermFee: "₦45,000",
  distinctionThreshold: 90,
  passThreshold: 50,
};

export default function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [currentView, setCurrentView] = useState<'home' | 'student' | 'teacher'>('home');
  const [template, setTemplate] = useState<Workspace15Template>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ezibeck_workspace15');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Error parsing loaded Workspace 15 template', e);
        }
      }
    }
    return DEFAULT_WORKSPACE_15;
  });

  // Load/Reload student dataset reactively when the selected term updates
  useEffect(() => {
    const loaded = loadStoredStudents(template.currentTerm);
    setStudents(loaded);
  }, [template.currentTerm]);

  // Update students roster and commit back to term-isolated storage
  const handleUpdateStudents = (updatedList: Student[]) => {
    setStudents(updatedList);
    saveStudents(updatedList, template.currentTerm);
  };

  const handleUpdateTemplate = (newTemplate: Workspace15Template) => {
    setTemplate(newTemplate);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ezibeck_workspace15', JSON.stringify(newTemplate));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative select-none">
      {/* Route Views Transition */}
      {currentView === 'home' && (
        <div className="fade-in animate-fade-in">
          <PublicHome template={template} onEnterPortal={(role) => setCurrentView(role)} />
        </div>
      )}

      {currentView === 'student' && (
        <div className="fade-in animate-fade-in">
          <StudentPortal 
            students={students} 
            template={template}
            onBack={() => setCurrentView('home')} 
          />
        </div>
      )}

      {currentView === 'teacher' && (
        <div className="fade-in animate-fade-in">
          <TeacherDashboard 
            students={students} 
            template={template}
            onBack={() => setCurrentView('home')} 
            onUpdateStudents={handleUpdateStudents}
            onUpdateTemplate={handleUpdateTemplate}
          />
        </div>
      )}
    </div>
  );
}

