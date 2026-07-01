/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import PublicHome from './components/PublicHome';
import StudentPortal from './components/StudentPortal';
import TeacherDashboard from './components/TeacherDashboard';
import { Student, Workspace15Template, DbStatus } from './types';
import { loadStoredStudents, saveStudents, getInitialStudents, isStudentInTerm } from './utils/academicUtils';
import { safeStorage } from './utils/safeStorage';
import { syncService } from './lib/syncService';
import { 
  isSupabaseConfigured, 
  dbService, 
  supabase, 
  mapDbStudentToFrontend, 
  mapDbConfigToTemplate, 
  mapTemplateToDbConfig 
} from './lib/supabase';

const DEFAULT_WORKSPACE_15: Workspace15Template = {
  schoolName: "Ezibeck Academy",
  motto: "Knowledge is Power",
  address: "No. 5 Ezibeck Crescent, Behind Udu Motor pack, Ovwian, Delta state",
  phone: "+234070",
  email: "admissions@ezibeckcollege.edu",
  resumptionDate: "September 14, 2026",
  termDate: "June 18, 2026",
  session: "2025/2026 Academic Year",
  principalName: "Maro German",
  formTeacherJunior: "Maro German",
  formTeacherSenior: "Maro German",
  currentTerm: "Third Term",
  nextTermFee: "₦100,000.00|₦15,000.00|₦15,000.00|₦20,000.00;₦100,000.00|₦15,000.00|₦15,000.00|₦20,000.00;₦100,000.00|₦15,000.00|₦15,000.00|₦20,000.00;₦100,000.00|₦15,000.00|₦15,000.00|₦20,000.00",
  distinctionThreshold: 90,
  passThreshold: 50,
  totalAttendance: 110,
  schoolFee: "₦100,000.00",
  partyFee: "₦15,000.00",
  enrollmentFee: "₦15,000.00",
  bookFee: "₦20,000.00",

  // Nursery Section
  schoolFeeNursery: "₦100,000.00",
  partyFeeNursery: "₦15,000.00",
  enrollmentFeeNursery: "₦15,000.00",
  bookFeeNursery: "₦20,000.00",

  // Primary Section
  schoolFeePrimary: "₦100,000.00",
  partyFeePrimary: "₦15,000.00",
  enrollmentFeePrimary: "₦15,000.00",
  bookFeePrimary: "₦20,000.00",

  // Junior Section
  schoolFeeJunior: "₦100,000.00",
  partyFeeJunior: "₦15,000.00",
  enrollmentFeeJunior: "₦15,000.00",
  bookFeeJunior: "₦20,000.00",

  // Senior Section
  schoolFeeSenior: "₦100,000.00",
  partyFeeSenior: "₦15,000.00",
  enrollmentFeeSenior: "₦15,000.00",
  bookFeeSenior: "₦20,000.00",
};

export default function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [currentView, setCurrentView] = useState<'home' | 'student' | 'teacher'>(() => {
    if (typeof window !== 'undefined') {
      // 1. Check query parameter to support opening portal in new tabs seamlessly
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      if (viewParam === 'student' || viewParam === 'teacher' || viewParam === 'home') {
        safeStorage.setItem('ezibeck_current_view', viewParam);
        return viewParam;
      }

      // 2. Check if the page is being reloaded/refreshed
      let isReload = false;
      try {
        const perf = typeof window !== 'undefined' ? window.performance : null;
        const navEntries = perf?.getEntriesByType?.('navigation') || [];
        if (navEntries.length > 0) {
          isReload = (navEntries[0] as PerformanceNavigationTiming).type === 'reload';
        } else {
          isReload = (perf as any)?.navigation?.type === 1;
        }
      } catch (e) {
        console.warn('Navigation timing check failed or unsupported:', e);
      }

      // 3. If it is a reload, retrieve the saved view state; otherwise, reset to homepage
      if (isReload) {
        const savedView = safeStorage.getItem('ezibeck_current_view');
        if (savedView === 'student' || savedView === 'teacher' || savedView === 'home') {
          return savedView;
        }
      } else {
        safeStorage.removeItem('ezibeck_current_view');
      }
    }
    return 'home';
  });

  // Track page state changes to survive browser reloads
  useEffect(() => {
    if (typeof window !== 'undefined') {
      safeStorage.setItem('ezibeck_current_view', currentView);
    }
  }, [currentView]);

  // Synchronize browser history pop events to allow back-button navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Set initial window history state if missing, ensuring clean go-back targets
    try {
      if (window.history && (!window.history.state || !window.history.state.view)) {
        window.history.replaceState({ view: currentView }, '');
      }
    } catch (e) {
      console.warn('History replaceState blocked:', e);
    }

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.view) {
        setCurrentView(event.state.view);
      } else {
        setCurrentView('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      console.log('App is online, syncing...');
      syncService.processQueue();
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const handleNavigate = (view: 'home' | 'student' | 'teacher') => {
    if (typeof window !== 'undefined') {
      try {
        if (window.history) {
          const curState = window.history.state;
          if (!curState || curState.view !== view) {
            window.history.pushState({ view }, '');
          }
        }
      } catch (e) {
        console.warn('History pushState blocked:', e);
      }
    }
    setCurrentView(view);
  };

  const [template, setTemplate] = useState<Workspace15Template>(() => {
    if (typeof window !== 'undefined') {
      const saved = safeStorage.getItem('ezibeck_workspace15');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed || DEFAULT_WORKSPACE_15;
        } catch (e) {
          console.error('Error parsing loaded Workspace 15 template', e);
        }
      }
    }
    return DEFAULT_WORKSPACE_15;
  });

  const [dbStatus, setDbStatus] = useState<DbStatus>({
    configured: isSupabaseConfigured,
    connected: false,
    checking: isSupabaseConfigured,
    error: null,
    supabaseUrl: (import.meta as any).env?.VITE_SUPABASE_URL || ''
  });

  const [syncTrigger, setSyncTrigger] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const activeChannelsRef = React.useRef<Record<string, any>>({});
  const isLocalSavingRef = React.useRef(false);

  const handlePushLocalToSupabase = async (): Promise<{ success: boolean; message: string }> => {
    if (!isSupabaseConfigured) {
      return { success: false, message: "Supabase environment variables are not configured in AI Studio Secrets." };
    }
    isLocalSavingRef.current = true;
    setDbStatus(prev => ({ ...prev, checking: true }));
    try {
      // 1. Get current local students
      const localStudents = loadStoredStudents(template.currentTerm);
      
      // 2. Clear & Save in Supabase
      await dbService.saveAllStudents(localStudents);

      // 3. Save template in Supabase
      const cfg = await dbService.getSchoolConfig().catch(() => null);
      const dbTpl = mapTemplateToDbConfig(template);
      if (cfg && cfg.id) {
        await dbService.updateSchoolConfig(cfg.id, dbTpl);
      } else {
        await supabase.from('school_config').insert(dbTpl);
      }

      setDbStatus({
        configured: true,
        connected: true,
        checking: false,
        error: null,
        supabaseUrl: (import.meta as any).env?.VITE_SUPABASE_URL
      });

      // Broadcast changes so other active devices pull immediately
      broadcastChange('public:students');
      broadcastChange('public:school_config');
      setSyncTrigger(prev => prev + 1);

      return { success: true, message: "All local report cards & configuration successfully uploaded and synced to your live Supabase database!" };
    } catch (e: any) {
      console.error("Failed to push to Supabase", e);
      setDbStatus({
        configured: true,
        connected: false,
        checking: false,
        error: e?.message || String(e),
        supabaseUrl: (import.meta as any).env?.VITE_SUPABASE_URL
      });
      return { success: false, message: `Failed to sync data: ${e?.message || String(e)}. Ensure your Supabase schema SQL is loaded and write permissions are allowed.` };
    } finally {
      setTimeout(() => {
        isLocalSavingRef.current = false;
      }, 1500);
    }
  };

  const handlePullFromSupabase = async (): Promise<{ success: boolean; message: string }> => {
    if (!isSupabaseConfigured) {
      return { success: false, message: "Supabase environment variables are not configured in AI Studio Secrets." };
    }
    setDbStatus(prev => ({ ...prev, checking: true }));
    try {
      // 1. Fetch school config from Supabase
      const cfg = await dbService.getSchoolConfig();
      let targetTerm = template.currentTerm;
      const validTerms = ['First Term', 'Second Term', 'Third Term'];

      if (cfg) {
        const mappedTpl = mapDbConfigToTemplate(cfg);
        const dbTerm = mappedTpl.currentTerm;
        if (dbTerm && validTerms.includes(dbTerm)) {
          targetTerm = dbTerm;
        } else if (!validTerms.includes(targetTerm)) {
          targetTerm = 'Third Term';
        }

        const nextTpl = {
          ...mappedTpl,
          currentTerm: targetTerm,
        };
        setTemplate(nextTpl);
        if (typeof window !== 'undefined') {
          safeStorage.setItem('ezibeck_workspace15', JSON.stringify(nextTpl));
        }
      }

      // 2. Fetch students from Supabase
      const rawStudents = await dbService.getStudents();
      const mapped = (rawStudents || []).map(mapDbStudentToFrontend);
      const termFiltered = mapped.filter(s => isStudentInTerm(s.id, targetTerm));
      
      if (termFiltered.length > 0) {
        setStudents(termFiltered);
        saveStudents(termFiltered, targetTerm);
      } else {
        // If Supabase has no students, pull what we have locally or fallback to initial
        const local = loadStoredStudents(targetTerm);
        setStudents(local);
      }

      setDbStatus({
        configured: true,
        connected: true,
        checking: false,
        error: null,
        supabaseUrl: (import.meta as any).env?.VITE_SUPABASE_URL
      });

      return { success: true, message: "All live records & configuration successfully retrieved and synchronized from your live Supabase database!" };
    } catch (e: any) {
      console.error("Failed to pull from Supabase", e);
      setDbStatus({
        configured: true,
        connected: false,
        checking: false,
        error: e?.message || String(e),
        supabaseUrl: (import.meta as any).env?.VITE_SUPABASE_URL
      });
      return { success: false, message: `Failed to load live data: ${e?.message || String(e)}. Check your connection and schema cache.` };
    }
  };

  // Helper to send real-time broadcast notifications to other devices
  const broadcastChange = (topic: string) => {
    if (!isSupabaseConfigured) return;
    try {
      const ch = activeChannelsRef.current[topic];
      if (ch) {
        // Realtime sync broadcast
        ch.send({
          type: 'broadcast',
          event: 'sync',
          payload: { timestamp: Date.now() },
        });
      } else {
        // Fallback if not mapped
        const tempCh = supabase.channel(topic, { config: { private: true } });
        tempCh.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            tempCh.send({
              type: 'broadcast',
              event: 'sync',
              payload: { timestamp: Date.now() },
            }).then(() => {
              // Wait a context delay before removing to ensure dispatch delivery
              setTimeout(() => {
                supabase.removeChannel(tempCh);
              }, 1200);
            });
          }
        });
      }
    } catch (e) {
      console.error(`Failed to send broadcast on ${topic}`, e);
    }
  };

  // Set up real-time multi-device subscription to keep devices in perfect sync
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    
    const topics = [
      'public:students',
      'public:school_config',
      'public:subject_grades',
      'public:behavioural_ratings',
      'public:faculty_profiles',
    ];
    
    const channelsMap: Record<string, any> = {};
    
    const channels = topics.map((topic) => {
      const ch = supabase
        .channel(topic, { config: { private: true } })
        .on('broadcast', { event: '*' }, (payload) => {
          if (isLocalSavingRef.current) {
            return;
          }
          // Real-time broadcast sync received
          setSyncTrigger((prev) => prev + 1);
        })
        .subscribe((status) => {
          // Connected status handler
        });
        
      channelsMap[topic] = ch;
      return ch;
    });
    
    activeChannelsRef.current = channelsMap;
    
    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
      activeChannelsRef.current = {};
    };
  }, []);

  // Load/Reload student dataset and configuration reactively when selected, checking Supabase if available
  useEffect(() => {
    async function loadData() {
      if (isSupabaseConfigured) {
        setDbStatus(prev => ({ ...prev, checking: true }));
        try {
          // 1. Try loading school config from Supabase
          let cfg = await dbService.getSchoolConfig();
          if (!cfg) {
            const dbTpl = mapTemplateToDbConfig(DEFAULT_WORKSPACE_15);
            const { data, error } = await supabase.from('school_config').insert(dbTpl).select();
            if (!error && data && data.length > 0) {
              cfg = data[0];
            }
          }

          let targetTerm = template.currentTerm;
          const validTerms = ['First Term', 'Second Term', 'Third Term'];

          if (cfg) {
            const mappedTpl = mapDbConfigToTemplate(cfg);
            const dbTerm = mappedTpl.currentTerm;
            if (dbTerm && validTerms.includes(dbTerm)) {
              targetTerm = dbTerm;
            } else if (!validTerms.includes(targetTerm)) {
              targetTerm = 'Third Term';
            }

            setTemplate((prev) => ({
              ...prev,
              ...mappedTpl,
              currentTerm: targetTerm,
            }));
          }

          // 2. Load students from Supabase
          const rawStudents = await dbService.getStudents();
          const mapped = (rawStudents || []).map(mapDbStudentToFrontend);
          const termFiltered = mapped.filter(s => isStudentInTerm(s.id, targetTerm));
          
          if (termFiltered.length > 0) {
            setStudents(termFiltered);
          } else {
            const initialForTerm = loadStoredStudents(targetTerm);
            setStudents(initialForTerm);
            await dbService.saveAllStudents(initialForTerm);
          }
          setDbStatus({
            configured: true,
            connected: true,
            checking: false,
            error: null,
            supabaseUrl: (import.meta as any).env?.VITE_SUPABASE_URL
          });
        } catch (error: any) {
          console.error("Error communicating with Supabase (detailed):", {
            message: error?.message,
            stack: error?.stack,
            config: isSupabaseConfigured,
            url: (import.meta as any).env?.VITE_SUPABASE_URL
          });
          setDbStatus({
            configured: true,
            connected: false,
            checking: false,
            error: error?.message || String(error),
            supabaseUrl: (import.meta as any).env?.VITE_SUPABASE_URL
          });
          const loaded = loadStoredStudents(template.currentTerm);
          setStudents(loaded);
        }
      } else {
        setDbStatus({
          configured: false,
          connected: false,
          checking: false,
          error: null,
          supabaseUrl: (import.meta as any).env?.VITE_SUPABASE_URL || ''
        });
        const loaded = loadStoredStudents(template.currentTerm);
        setStudents(loaded);
      }
    }

    loadData();
  }, [template.currentTerm, syncTrigger]);

  // Update students roster and commit back to term-isolated storage + Supabase
  const handleUpdateStudents = async (updatedList: Student[], targetTerm?: string) => {
    const termToUse = targetTerm || template.currentTerm;
    setIsSaving(true);
    isLocalSavingRef.current = true;
    try {
      // Determine deleted students to delete them in Supabase
      let originalList = students;
      if (termToUse !== template.currentTerm) {
        originalList = loadStoredStudents(termToUse);
      }
      const deletedStudents = originalList.filter(s => !updatedList.some(ul => ul.id === s.id));

      // Optimistically update frontend state and local storage fallback
      if (termToUse === template.currentTerm) {
        setStudents(updatedList);
      }
      saveStudents(updatedList, termToUse);

      if (isSupabaseConfigured) {
        try {
          // 1. Delete missing students from real database
          for (const ds of deletedStudents) {
            await dbService.deleteStudent(ds.id);
          }
          
          // 2. Identify and upsert only the added/modified students to prevent expensive bulk wiping
          const changedStudents = updatedList.filter(ul => {
            const original = originalList.find(s => s.id === ul.id);
            if (!original) return true; // Brand new student

            // Compare scalar student attributes
            if (original.name !== ul.name ||
                original.age !== ul.age ||
                original.sex !== ul.sex ||
                original.password !== ul.password ||
                original.formTeacherRemark !== ul.formTeacherRemark ||
                original.principalRemark !== ul.principalRemark ||
                original.attendancePresent !== ul.attendancePresent ||
                original.attendanceTotal !== ul.attendanceTotal ||
                original.resumptionDate !== ul.resumptionDate ||
                original.formTeacherName !== ul.formTeacherName ||
                original.principalName !== ul.principalName) {
              return true;
            }

            // Compare subjects array length and inner contents
            if ((original.subjects || []).length !== (ul.subjects || []).length) return true;
            for (let i = 0; i < (original.subjects || []).length; i++) {
              const os = original.subjects[i];
              const us = ul.subjects[i];
              if (!us || 
                  os.name !== us.name ||
                  os.testScore !== us.testScore ||
                  os.examScore !== us.examScore ||
                  os.firstTermSummary !== us.firstTermSummary ||
                  os.secondTermSummary !== us.secondTermSummary ||
                  os.thirdTermSummary !== us.thirdTermSummary ||
                  os.position !== us.position) {
                return true;
              }
            }

            // Compare behaviours array length and ratings
            if ((original.behaviour || []).length !== (ul.behaviour || []).length) return true;
            for (let i = 0; i < (original.behaviour || []).length; i++) {
              const ob = original.behaviour[i];
              const ub = ul.behaviour[i];
              if (!ub || ob.name !== ub.name || ob.rating !== ub.rating) {
                return true;
              }
            }

            return false;
          });

          // 3. Persist each changed student to Supabase (doing single-record upsert)
          for (const cs of changedStudents) {
            await dbService.saveStudent(cs);
          }
          
          // Broadcast change so other active devices reload instantly
          broadcastChange('public:students');
        } catch (error) {
          console.error("Failed to commit student updates to Supabase:", error);
          throw error;
        } finally {
          setTimeout(() => {
            isLocalSavingRef.current = false;
          }, 1500);
        }
      } else {
        isLocalSavingRef.current = false;
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateTemplate = async (newTemplate: Workspace15Template) => {
    isLocalSavingRef.current = true;
    setTemplate(newTemplate);
    if (typeof window !== 'undefined') {
      safeStorage.setItem('ezibeck_workspace15', JSON.stringify(newTemplate));
    }

    if (isSupabaseConfigured) {
      try {
        let cfg = null;
        try {
          cfg = await dbService.getSchoolConfig();
        } catch (err) {
          // Config was not found, insert will follow
        }
        const dbTpl = mapTemplateToDbConfig(newTemplate);
        if (cfg && cfg.id) {
          await dbService.updateSchoolConfig(cfg.id, dbTpl);
        } else {
          await supabase.from('school_config').insert(dbTpl);
        }
        
        // Broadcast change so other active devices reload instantly
        broadcastChange('public:school_config');
      } catch (error) {
        console.error("Failed to sync template to Supabase:", error);
        throw error;
      } finally {
        setTimeout(() => {
          isLocalSavingRef.current = false;
        }, 1500);
      }
    } else {
      isLocalSavingRef.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative select-none">
      {/* Route Views Transition */}
      {currentView === 'home' && (
        <div className="fade-in animate-fade-in">
          <PublicHome template={template} onEnterPortal={handleNavigate} />
        </div>
      )}

      {currentView === 'student' && (
        <div className="fade-in animate-fade-in">
          <StudentPortal 
            students={students} 
            template={template}
            onBack={() => handleNavigate('home')} 
            onUpdateStudents={handleUpdateStudents}
            onUpdateTemplate={handleUpdateTemplate}
            dbStatus={dbStatus}
            onPushLocalToSupabase={handlePushLocalToSupabase}
            onPullFromSupabase={handlePullFromSupabase}
          />
        </div>
      )}

      {currentView === 'teacher' && (
        <div className="fade-in animate-fade-in">
          <TeacherDashboard 
            students={students} 
            template={template}
            onBack={() => handleNavigate('home')} 
            onUpdateStudents={handleUpdateStudents}
            onUpdateTemplate={handleUpdateTemplate}
            dbStatus={dbStatus}
            onPushLocalToSupabase={handlePushLocalToSupabase}
            onPullFromSupabase={handlePullFromSupabase}
            isSaving={isSaving}
          />
        </div>
      )}
    </div>
  );
}

