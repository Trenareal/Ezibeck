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
import { 
  isSupabaseConfigured, 
  dbService, 
  supabase, 
  mapDbStudentToFrontend, 
  mapDbConfigToTemplate, 
  mapTemplateToDbConfig 
} from './lib/supabase';

const DEFAULT_WORKSPACE_15: Workspace15Template = {
  schoolName: "Notion Core International College",
  motto: "Knowledge, discipline and outstanding character excellence",
  address: "120, Broadway Lane, New York, NY 10025",
  phone: "+1 (555) 489-0128",
  email: "admissions@notioncollege.edu",
  resumptionDate: "September 14, 2026",
  termDate: "June 18, 2026",
  session: "2025/2026 Academic Year",
  principalName: "Dr. Christopher Vance, PhD",
  formTeacherJunior: "Mrs. Clara Vance",
  formTeacherSenior: "Mr. Albert King",
  currentTerm: "Third Term Summary",
  nextTermFee: "$2,500.00",
  distinctionThreshold: 85,
  passThreshold: 50,
};

export default function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [currentView, setCurrentView] = useState<'home' | 'student' | 'teacher'>(() => {
    if (typeof window !== 'undefined') {
      // 1. Check query parameter to support opening portal in new tabs seamlessly
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      if (viewParam === 'student' || viewParam === 'teacher' || viewParam === 'home') {
        localStorage.setItem('ezibeck_current_view', viewParam);
        return viewParam;
      }

      // 2. Check if the page is being reloaded/refreshed
      let isReload = false;
      try {
        const navEntries = performance.getEntriesByType('navigation');
        if (navEntries.length > 0) {
          isReload = (navEntries[0] as PerformanceNavigationTiming).type === 'reload';
        } else {
          isReload = (window.performance as any)?.navigation?.type === 1;
        }
      } catch (e) {
        console.warn('Navigation timing check failed or unsupported:', e);
      }

      // 3. If it is a reload, retrieve the saved view state; otherwise, reset to homepage
      if (isReload) {
        const savedView = localStorage.getItem('ezibeck_current_view');
        if (savedView === 'student' || savedView === 'teacher' || savedView === 'home') {
          return savedView;
        }
      } else {
        localStorage.removeItem('ezibeck_current_view');
      }
    }
    return 'home';
  });

  // Track page state changes to survive browser reloads
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ezibeck_current_view', currentView);
    }
  }, [currentView]);

  // Synchronize browser history pop events to allow back-button navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Set initial window history state if missing, ensuring clean go-back targets
    if (!window.history.state || !window.history.state.view) {
      window.history.replaceState({ view: currentView }, '');
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

  const handleNavigate = (view: 'home' | 'student' | 'teacher') => {
    if (typeof window !== 'undefined') {
      const curState = window.history.state;
      if (!curState || curState.view !== view) {
        window.history.pushState({ view }, '');
      }
    }
    setCurrentView(view);
  };

  const [template, setTemplate] = useState<Workspace15Template>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ezibeck_workspace15');
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
  const activeChannelsRef = React.useRef<Record<string, any>>({});

  const handlePushLocalToSupabase = async (): Promise<{ success: boolean; message: string }> => {
    if (!isSupabaseConfigured) {
      return { success: false, message: "Supabase environment variables are not configured in AI Studio Secrets." };
    }
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
    }
  };

  const handlePullFromSupabase = async (): Promise<{ success: boolean; message: string }> => {
    if (!isSupabaseConfigured) {
      return { success: false, message: "Supabase is not configured." };
    }
    setDbStatus(prev => ({ ...prev, checking: true }));
    try {
      setSyncTrigger(prev => prev + 1);
      return { success: true, message: "Fresh data retrieved and synchronized from live Supabase!" };
    } catch (e: any) {
      return { success: false, message: `Failed to retrieve data: ${e?.message || String(e)}` };
    }
  };

  // Helper to send real-time broadcast notifications to other devices
  const broadcastChange = (topic: string) => {
    if (!isSupabaseConfigured) return;
    try {
      const ch = activeChannelsRef.current[topic];
      if (ch) {
        console.log(`📡 Sending realtime sync broadcast on active channel: ${topic}`);
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
      const tableName = topic.split(':')[1];
      const ch = supabase
        .channel(topic, { config: { private: true } })
        .on('broadcast', { event: '*' }, (payload) => {
          console.log(`📥 Received real-time broadcast sync on topic: ${topic}`, payload);
          setSyncTrigger((prev) => prev + 1);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => {
          console.log(`📥 Received real-time postgres_changes sync on table: ${tableName}`, payload);
          setSyncTrigger((prev) => prev + 1);
        })
        .subscribe((status) => {
          console.log(`📡 Real-time channel ${topic} status: ${status}`);
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
            console.log("No school config found in Supabase, seeding default config row...");
            const dbTpl = mapTemplateToDbConfig(DEFAULT_WORKSPACE_15);
            const { data, error } = await supabase.from('school_config').insert(dbTpl).select();
            if (!error && data && data.length > 0) {
              cfg = data[0];
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
          const mapped = (rawStudents || []).map(mapDbStudentToFrontend);
          const termFiltered = mapped.filter(s => isStudentInTerm(s.id, template.currentTerm));
          
          if (termFiltered.length > 0) {
            setStudents(termFiltered);
          } else {
            console.log(`Supabase: No students found for active term "${template.currentTerm}". Seeding defaults...`);
            const initialForTerm = getInitialStudents(template.currentTerm);
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
          console.error("Error communicating with Supabase:", error);
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
        
        // Broadcast change so other active devices reload instantly
        broadcastChange('public:students');
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
        let cfg = null;
        try {
          cfg = await dbService.getSchoolConfig();
        } catch (err) {
          console.log("No config found, we will insert.");
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
      }
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
          />
        </div>
      )}
    </div>
  );
}

