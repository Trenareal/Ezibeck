/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import PublicHome from './components/PublicHome';
import StudentPortal from './components/StudentPortal';
import TeacherDashboard from './components/TeacherDashboard';
import { Student, Workspace15Template } from './types';
import { loadStoredStudents, saveStudents, getInitialStudents } from './utils/academicUtils';
import { 
  isSupabaseConfigured, 
  dbService, 
  supabase, 
  mapDbStudentToFrontend, 
  mapDbConfigToTemplate, 
  mapTemplateToDbConfig 
} from './lib/supabase';

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

  // Load/Reload student dataset and configuration reactively when selected, checking Supabase if available
  useEffect(() => {
    async function loadData() {
      if (isSupabaseConfigured) {
        try {
          // 1. Try loading school config from Supabase
          let cfg;
          try {
            cfg = await dbService.getSchoolConfig();
          } catch (e) {
            console.log("No school config found in Supabase, seeding default config row...");
            const dbTpl = mapTemplateToDbConfig(template);
            const { data, error } = await supabase.from('school_config').insert(dbTpl).select().single();
            if (!error && data) {
              cfg = data;
            }
          }
          if (cfg) {
            const mappedTpl = mapDbConfigToTemplate(cfg);
            setTemplate((prev) => ({
              ...prev,
              ...mappedTpl,
              currentTerm: prev.currentTerm, // maintain active tab selection from frontend state
            }));
          }

          // 2. Load students from Supabase
          const rawStudents = await dbService.getStudents();
          if (rawStudents && rawStudents.length > 0) {
            const mapped = rawStudents.map(mapDbStudentToFrontend);
            setStudents(mapped);
          } else {
            console.log("Supabase is configured but database is empty. Seeding with default dataset...");
            const initial = getInitialStudents();
            setStudents(initial);
            await dbService.saveAllStudents(initial);
          }
        } catch (error) {
          console.error("Error communicating with Supabase:", error);
          const loaded = loadStoredStudents(template.currentTerm);
          setStudents(loaded);
        }
      } else {
        const loaded = loadStoredStudents(template.currentTerm);
        setStudents(loaded);
      }
    }

    loadData();
  }, [template.currentTerm]);

  // Update students roster and commit back to term-isolated storage + Supabase
  const handleUpdateStudents = async (updatedList: Student[]) => {
    // Determine deleted students to delete them in Supabase
    const deletedStudents = students.filter(s => !updatedList.some(ul => ul.id === s.id));

    // Optimistically update frontend state and local storage fallback
    setStudents(updatedList);
    saveStudents(updatedList, template.currentTerm);

    if (isSupabaseConfigured) {
      try {
        // Delete missing students from real database
        for (const ds of deletedStudents) {
          await dbService.deleteStudent(ds.id);
        }
        // Save the updated/registered students
        await dbService.saveAllStudents(updatedList);
      } catch (error) {
        console.error("Failed to commit student updates to Supabase:", error);
      }
    }
  };

  const handleUpdateTemplate = async (newTemplate: Workspace15Template) => {
    setTemplate(newTemplate);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ezibeck_workspace15', JSON.stringify(newTemplate));
    }

    if (isSupabaseConfigured) {
      try {
        const cfg = await dbService.getSchoolConfig();
        const dbTpl = mapTemplateToDbConfig(newTemplate);
        if (cfg && cfg.id) {
          await dbService.updateSchoolConfig(cfg.id, dbTpl);
        } else {
          await supabase.from('school_config').insert(dbTpl);
        }
      } catch (error) {
        console.error("Failed to sync template to Supabase:", error);
      }
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

