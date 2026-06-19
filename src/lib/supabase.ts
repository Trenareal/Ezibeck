import { createClient } from '@supabase/supabase-js';
import { Student, Workspace15Template, ClassName, FacultyProfile } from '../types';
import { compareSubjects } from '../utils/academicUtils';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  !supabaseUrl.includes('placeholder-url') &&
  !supabaseUrl.includes('your-supabase-project-id');

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) are not set. ' +
    'Please configure them in your settings/environment secrets to connect to your real database.'
  );
}

// Create a singleton instance of the client
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

export const mapDbStudentToFrontend = (dbStudent: any): Student => {
  return {
    id: dbStudent.id,
    name: dbStudent.name,
    age: dbStudent.age,
    sex: dbStudent.sex as 'Male' | 'Female',
    className: dbStudent.class_name as ClassName,
    termDate: dbStudent.term_date,
    session: dbStudent.session,
    attendancePresent: dbStudent.attendance_present,
    attendanceTotal: dbStudent.attendance_total,
    formTeacherRemark: dbStudent.form_teacher_remark || '',
    formTeacherName: dbStudent.form_teacher_name || '',
    principalName: dbStudent.principal_name || '',
    resumptionDate: dbStudent.resumption_date,
    password: dbStudent.password,
    principalRemark: dbStudent.principal_remark || '',
    subjects: (dbStudent.subjects || []).map((sub: any) => ({
      id: sub.id,
      name: sub.name,
      testScore: sub.test_score,
      examScore: sub.exam_score,
      firstTermSummary: sub.first_term_summary,
      secondTermSummary: sub.second_term_summary,
      thirdTermSummary: sub.third_term_summary,
      position: sub.position,
      isPositionManual: sub.is_position_manual
    })).sort((a: any, b: any) => compareSubjects(a.name, b.name)),
    behaviour: (dbStudent.behaviour || []).map((b: any) => ({
      name: b.name,
      rating: b.rating
    }))
  };
};

export const mapDbConfigToTemplate = (cfg: any): Workspace15Template => {
  const mottoRaw = cfg.motto || '';
  const isLocked = mottoRaw.includes('|LOCKED') || !!cfg.portal_locked;
  const cleanMotto = mottoRaw.split('|LOCKED')[0];
  return {
    schoolName: cfg.school_name,
    motto: cleanMotto,
    address: cfg.address,
    phone: cfg.phone,
    email: cfg.email,
    resumptionDate: cfg.resumption_date,
    termDate: cfg.term_date,
    session: cfg.session,
    principalName: cfg.principal_name,
    formTeacherJunior: cfg.form_teacher_junior,
    formTeacherSenior: cfg.form_teacher_senior,
    currentTerm: cfg.current_term,
    nextTermFee: cfg.next_term_fee,
    distinctionThreshold: cfg.distinction_threshold,
    passThreshold: cfg.pass_threshold,
    portalLocked: isLocked,
  };
};

export const mapTemplateToDbConfig = (tpl: Workspace15Template) => {
  const cleanMotto = tpl.motto ? tpl.motto.split('|LOCKED')[0] : '';
  const mottoToStore = tpl.portalLocked ? `${cleanMotto}|LOCKED` : cleanMotto;
  return {
    school_name: tpl.schoolName,
    motto: mottoToStore,
    address: tpl.address,
    phone: tpl.phone,
    email: tpl.email,
    resumption_date: tpl.resumptionDate,
    term_date: tpl.termDate,
    session: tpl.session,
    principal_name: tpl.principalName,
    form_teacher_junior: tpl.formTeacherJunior,
    form_teacher_senior: tpl.formTeacherSenior,
    current_term: tpl.currentTerm,
    next_term_fee: tpl.nextTermFee,
    distinction_threshold: tpl.distinctionThreshold,
    pass_threshold: tpl.passThreshold,
  };
};

/**
 * Service helpers for fetching and updating database tables with Supabase
 */
export function mapFrontendIdToUuid(id: string): string {
  if (!id) return id;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id.toLowerCase();
  }
  const mappings: Record<string, string> = {
    ezekiel: "ea4d6a45-0015-4b1a-b5bd-6f23006e2df1",
    gladys: "ea4d6a45-0015-4b1a-b5bd-6f23006e2df2",
    anthony: "ea4d6a45-0015-4b1a-b5bd-6f23006e2df3",
    sarah: "ea4d6a45-0015-4b1a-b5bd-6f23006e2df4",
    benson: "ea4d6a45-0015-4b1a-b5bd-6f23006e2df5",
    florence: "ea4d6a45-0015-4b1a-b5bd-6f23006e2df6",
    david: "ea4d6a45-0015-4b1a-b5bd-6f23006e2df7",
    maroger: "ea4d6a45-0015-4b1a-b5bd-6f23006e2df8",
    spare: "ea4d6a45-0015-4b1a-b5bd-6f23006e2df9"
  };
  if (mappings[id.toLowerCase()]) {
    return mappings[id.toLowerCase()];
  }
  // Otherwise create a deterministic UUID out of the string
  let hashStr = "";
  for (let i = 0; i < id.length; i++) {
    hashStr += id.charCodeAt(i).toString(16);
  }
  hashStr = (hashStr + "00000000000000000000000005081997").slice(0, 32);
  return `${hashStr.substring(0, 8)}-${hashStr.substring(8, 12)}-${hashStr.substring(12, 16)}-${hashStr.substring(16, 20)}-${hashStr.substring(20, 32)}`;
}

export function mapUuidToFrontendId(uuid: string): string {
  if (!uuid) return uuid;
  const reverseMappings: Record<string, string> = {
    "ea4d6a45-0015-4b1a-b5bd-6f23006e2df1": "ezekiel",
    "ea4d6a45-0015-4b1a-b5bd-6f23006e2df2": "gladys",
    "ea4d6a45-0015-4b1a-b5bd-6f23006e2df3": "anthony",
    "ea4d6a45-0015-4b1a-b5bd-6f23006e2df4": "sarah",
    "ea4d6a45-0015-4b1a-b5bd-6f23006e2df5": "benson",
    "ea4d6a45-0015-4b1a-b5bd-6f23006e2df6": "florence",
    "ea4d6a45-0015-4b1a-b5bd-6f23006e2df7": "david",
    "ea4d6a45-0015-4b1a-b5bd-6f23006e2df8": "maroger",
    "ea4d6a45-0015-4b1a-b5bd-6f23006e2df9": "spare"
  };
  const lowered = uuid.toLowerCase();
  if (reverseMappings[lowered]) {
    return reverseMappings[lowered];
  }

  // Check if it's a deterministic encoded custom UUID (from mapFrontendIdToUuid)
  const clean = lowered.replace(/-/g, '');
  if (clean.length === 32) {
    let decoded = "";
    let isValid = true;
    for (let i = 0; i < 32; i += 2) {
      const hexUnit = clean.substring(i, i + 2);
      if (hexUnit === "00") {
        break;
      }
      const code = parseInt(hexUnit, 16);
      if (isNaN(code) || code < 32 || code > 126) {
        isValid = false;
        break;
      }
      decoded += String.fromCharCode(code);
    }
    if (isValid && decoded.length > 0) {
      return decoded;
    }
  }

  return lowered;
}

export const mapDbFacultyToFrontend = (dbFaculty: any): FacultyProfile => {
  return {
    id: mapUuidToFrontendId(dbFaculty.id),
    name: dbFaculty.name,
    role: dbFaculty.role,
    avatar: dbFaculty.avatar,
    password: dbFaculty.password,
    isRestricted: dbFaculty.is_restricted,
    email: dbFaculty.email || '',
    assignedClass: dbFaculty.assigned_class as ClassName || undefined
  };
};

export const dbService = {
  // --- School Config ---
  async getSchoolConfig() {
    const { data, error } = await supabase
      .from('school_config')
      .select('*')
      .limit(1);
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  },

  async updateSchoolConfig(id: string, updates: any) {
    const { data, error } = await supabase
      .from('school_config')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // --- Students ---
  async getStudents(className?: string) {
    let query = supabase.from('students').select(`
      *,
      subjects:subject_grades(*),
      behaviour:behavioural_ratings(*)
    `);
    
    if (className) {
      query = query.eq('class_name', className);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getStudentById(id: string) {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        subjects:subject_grades(*),
        behaviour:behavioural_ratings(*)
      `)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async saveStudent(student: any) {
    const { subjects, behaviour, ...studentData } = student;
    const fallbackId = `EZB-STUDENT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const targetId = studentData.id || fallbackId;

    // 1. Upsert student basic details with strict type safety matching PostgreSQL column types
    const { data: savedStudent, error: studentError } = await supabase
      .from('students')
      .upsert({
        id: targetId,
        name: studentData.name,
        age: Math.max(1, Math.round(Number(studentData.age) || 15)),
        sex: studentData.sex === 'Female' ? 'Female' : 'Male',
        class_name: studentData.className || 'JSS1',
        term_date: studentData.termDate || '',
        session: studentData.session || '',
        attendance_present: Math.max(0, Math.round(Number(studentData.attendancePresent) || 0)),
        attendance_total: Math.max(0, Math.round(Number(studentData.attendanceTotal) || 110)),
        form_teacher_remark: studentData.formTeacherRemark || '',
        form_teacher_name: studentData.formTeacherName || '',
        principal_name: studentData.principalName || '',
        resumption_date: studentData.resumptionDate || '',
        password: studentData.password || '123456',
        principal_remark: studentData.principalRemark || ''
      })
      .select()
      .single();

    if (studentError) throw studentError;

    const studentId = savedStudent.id;

    // 2. Clear and Upsert Subjects
    if (subjects && subjects.length > 0) {
      // Clear old
      await supabase.from('subject_grades').delete().eq('student_id', studentId);
      
      // Insert new with strict bounds adhering to PostgreSQL check constraints (test <= 30, exam <= 70)
      const subjectsWithRelations = subjects.map((sub: any) => ({
        student_id: studentId,
        name: sub.name,
        test_score: Math.max(0, Math.min(30, Math.round(Number(sub.testScore) || 0))),
        exam_score: Math.max(0, Math.min(70, Math.round(Number(sub.examScore) || 0))),
        first_term_summary: Math.round(Number(sub.firstTermSummary) || 0),
        second_term_summary: Math.round(Number(sub.secondTermSummary) || 0),
        third_term_summary: Math.round(Number(sub.thirdTermSummary) || 0),
        position: sub.position ? Math.max(1, Math.round(Number(sub.position))) : null,
        is_position_manual: !!sub.isPositionManual
      }));

      const { error: subError } = await supabase
        .from('subject_grades')
        .insert(subjectsWithRelations);

      if (subError) throw subError;
    }

    // 3. Clear and Upsert Behaviour/Traits
    if (behaviour && behaviour.length > 0) {
      // Clear old
      await supabase.from('behavioural_ratings').delete().eq('student_id', studentId);

      // Insert new with strict rating bounds matching check constraints (1 to 5)
      const behaviourWithRelations = behaviour.map((b: any) => ({
        student_id: studentId,
        name: b.name,
        rating: Math.max(1, Math.min(5, Math.round(Number(b.rating) || 5)))
      }));

      const { error: bError } = await supabase
        .from('behavioural_ratings')
        .insert(behaviourWithRelations);

      if (bError) throw bError;
    }

    return savedStudent;
  },

  async saveAllStudents(students: Student[]) {
    if (students.length === 0) return;

    // 1. Map all basic details to DB format, enforcing strict integer data types
    const dbStudents = students.map(s => ({
      id: s.id,
      name: s.name,
      age: Math.max(1, Math.round(Number(s.age) || 15)),
      sex: s.sex === 'Female' ? 'Female' : 'Male',
      class_name: s.className || 'JSS1',
      term_date: s.termDate || '',
      session: s.session || '',
      attendance_present: Math.max(0, Math.round(Number(s.attendancePresent) || 0)),
      attendance_total: Math.max(0, Math.round(Number(s.attendanceTotal) || 110)),
      form_teacher_remark: s.formTeacherRemark || '',
      form_teacher_name: s.formTeacherName || '',
      principal_name: s.principalName || '',
      resumption_date: s.resumptionDate,
      password: s.password || '123456',
      principal_remark: s.principalRemark || ''
    }));

    // Batch upsert students in a single high-performance request
    const { error: studentError } = await supabase
      .from('students')
      .upsert(dbStudents);

    if (studentError) throw studentError;

    // 2. Gather all subjects and all behaviours from all students, enforcing constraints
    const allSubjects: any[] = [];
    const allBehaviours: any[] = [];
    const studentIds = students.map(s => s.id);

    students.forEach(student => {
      if (student.subjects && student.subjects.length > 0) {
        student.subjects.forEach((sub: any) => {
          allSubjects.push({
            student_id: student.id,
            name: sub.name,
            test_score: Math.max(0, Math.min(30, Math.round(Number(sub.testScore) || 0))),
            exam_score: Math.max(0, Math.min(70, Math.round(Number(sub.examScore) || 0))),
            first_term_summary: Math.round(Number(sub.firstTermSummary) || 0),
            second_term_summary: Math.round(Number(sub.secondTermSummary) || 0),
            third_term_summary: Math.round(Number(sub.thirdTermSummary) || 0),
            position: sub.position ? Math.max(1, Math.round(Number(sub.position))) : null,
            is_position_manual: !!sub.isPositionManual
          });
        });
      }

      if (student.behaviour && student.behaviour.length > 0) {
        student.behaviour.forEach((b: any) => {
          allBehaviours.push({
            student_id: student.id,
            name: b.name,
            rating: Math.max(1, Math.min(5, Math.round(Number(b.rating) || 5)))
          });
        });
      }
    });

    // 3. Clear existing grades/behaviours for these specific students in bulk, then batch insert
    if (studentIds.length > 0) {
      const { error: delSubError } = await supabase.from('subject_grades').delete().in('student_id', studentIds);
      if (delSubError) throw delSubError;

      const { error: delBhvError } = await supabase.from('behavioural_ratings').delete().in('student_id', studentIds);
      if (delBhvError) throw delBhvError;
    }

    // 4. Batch insert all new grades and behaviours
    if (allSubjects.length > 0) {
      const { error: subError } = await supabase
        .from('subject_grades')
        .insert(allSubjects);
      if (subError) throw subError;
    }

    if (allBehaviours.length > 0) {
      const { error: bError } = await supabase
        .from('behavioural_ratings')
        .insert(allBehaviours);
      if (bError) throw bError;
    }
  },

  async deleteStudent(studentId: string) {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId);
    if (error) throw error;
    return true;
  },

  // --- Faculty Admin Profile ---
  async getFacultyProfiles() {
    const { data, error } = await supabase
      .from('faculty_profiles')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return data;
  },

  async saveFacultyProfile(profile: any) {
    const tempId = mapFrontendIdToUuid(profile.id);
    const { data, error } = await supabase
      .from('faculty_profiles')
      .upsert({
        id: tempId || undefined,
        name: profile.name,
        role: profile.role,
        avatar: profile.avatar,
        password: profile.password || '123456',
        is_restricted: profile.isRestricted || false,
        email: profile.email || '',
        assigned_class: profile.assignedClass || null
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteFacultyProfile(profileId: string) {
    const dbId = mapFrontendIdToUuid(profileId);
    const { error } = await supabase
      .from('faculty_profiles')
      .delete()
      .eq('id', dbId);
    if (error) throw error;
    return true;
  },

  // --- Ezibeck Calendar Events ---
  async getCalendarEvents() {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .order('year', { ascending: true, nullsFirst: true })
        .order('month', { ascending: true })
        .order('day', { ascending: true });
      if (error) {
        console.warn("Could not query calendar_events table. If it doesn't exist, please run the SQL migration in your Supabase editor.", error);
        return null;
      }
      return data.map((row: any) => ({
        id: row.id,
        title: row.title,
        desc: row.description || '',
        type: row.type as 'holiday' | 'academic' | 'break' | 'exam',
        day: Number(row.day),
        month: Number(row.month),
        year: row.year ? Number(row.year) : undefined
      }));
    } catch (e) {
      console.warn("Exception fetching calendar events:", e);
      return null;
    }
  },

  async saveCalendarEvent(event: any) {
    const payload: any = {
      title: event.title,
      description: event.desc || '',
      type: event.type,
      day: Math.max(1, Math.min(31, Math.round(Number(event.day)))),
      month: Math.max(0, Math.min(11, Math.round(Number(event.month)))),
      year: event.year ? Math.round(Number(event.year)) : null
    };

    if (event.id && event.id.length === 36) {
      payload.id = event.id;
    }

    const { data, error } = await supabase
      .from('calendar_events')
      .upsert(payload)
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      title: data.title,
      desc: data.description || '',
      type: data.type as 'holiday' | 'academic' | 'break' | 'exam',
      day: Number(data.day),
      month: Number(data.month),
      year: data.year ? Number(data.year) : undefined
    };
  },

  async deleteCalendarEvent(id: string) {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
};
