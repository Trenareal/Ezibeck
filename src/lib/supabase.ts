import { createClient } from '@supabase/supabase-js';
import { Student, Workspace15Template, ClassName } from '../types';
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
  return {
    schoolName: cfg.school_name,
    motto: cfg.motto,
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
  };
};

export const mapTemplateToDbConfig = (tpl: Workspace15Template) => {
  return {
    school_name: tpl.schoolName,
    motto: tpl.motto,
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
export const dbService = {
  // --- School Config ---
  async getSchoolConfig() {
    const { data, error } = await supabase
      .from('school_config')
      .select('*')
      .limit(1)
      .single();
    if (error) throw error;
    return data;
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

  async saveStudent(student: any) {
    const { subjects, behaviour, ...studentData } = student;
    const fallbackId = `EZB-STUDENT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const targetId = studentData.id || fallbackId;

    // 1. Upsert student basic details
    const { data: savedStudent, error: studentError } = await supabase
      .from('students')
      .upsert({
        id: targetId,
        name: studentData.name,
        age: studentData.age,
        sex: studentData.sex,
        class_name: studentData.className,
        term_date: studentData.termDate,
        session: studentData.session,
        attendance_present: studentData.attendancePresent,
        attendance_total: studentData.attendanceTotal,
        form_teacher_remark: studentData.formTeacherRemark,
        form_teacher_name: studentData.formTeacherName,
        principal_name: studentData.principalName,
        resumption_date: studentData.resumptionDate,
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
      
      // Insert new
      const subjectsWithRelations = subjects.map((sub: any) => ({
        student_id: studentId,
        name: sub.name,
        test_score: sub.testScore,
        exam_score: sub.examScore,
        first_term_summary: sub.firstTermSummary || 0,
        second_term_summary: sub.secondTermSummary || 0,
        third_term_summary: sub.thirdTermSummary || 0,
        position: sub.position || null,
        is_position_manual: sub.isPositionManual || false
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

      // Insert new
      const behaviourWithRelations = behaviour.map((b: any) => ({
        student_id: studentId,
        name: b.name,
        rating: b.rating
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

    // 1. Map all basic details to DB format
    const dbStudents = students.map(s => ({
      id: s.id,
      name: s.name,
      age: s.age,
      sex: s.sex,
      class_name: s.className,
      term_date: s.termDate,
      session: s.session,
      attendance_present: s.attendancePresent,
      attendance_total: s.attendanceTotal,
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

    // 2. Gather all subjects and all behaviours from all students
    const allSubjects: any[] = [];
    const allBehaviours: any[] = [];
    const studentIds = students.map(s => s.id);

    students.forEach(student => {
      if (student.subjects && student.subjects.length > 0) {
        student.subjects.forEach((sub: any) => {
          allSubjects.push({
            student_id: student.id,
            name: sub.name,
            test_score: sub.testScore,
            exam_score: sub.examScore,
            first_term_summary: sub.firstTermSummary || 0,
            second_term_summary: sub.secondTermSummary || 0,
            third_term_summary: sub.thirdTermSummary || 0,
            position: sub.position || null,
            is_position_manual: sub.isPositionManual || false
          });
        });
      }

      if (student.behaviour && student.behaviour.length > 0) {
        student.behaviour.forEach((b: any) => {
          allBehaviours.push({
            student_id: student.id,
            name: b.name,
            rating: b.rating
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
    const { data, error } = await supabase
      .from('faculty_profiles')
      .upsert({
        id: profile.id || undefined,
        name: profile.name,
        role: profile.role,
        avatar: profile.avatar,
        password: profile.password || '123456',
        is_restricted: profile.isRestricted || false
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteFacultyProfile(profileId: string) {
    const { error } = await supabase
      .from('faculty_profiles')
      .delete()
      .eq('id', profileId);
    if (error) throw error;
    return true;
  }
};
